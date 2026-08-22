import { Request, Response } from 'express';
import { prisma } from '../prisma';
import { PrismaBetterSqlite3 } from '@prisma/adapter-better-sqlite3';
import Database from 'better-sqlite3';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { sendNationMarketEmail } from '../utils/mailer';
import { generateSecret, verify } from 'otplib';
import QRCode from 'qrcode';

const JWT_SECRET = process.env.JWT_SECRET || 'NATION_MARKET_SUPER_SECRET_KEY_2026';

const generateToken = (id: string, role: string) => {
  return jwt.sign({ id, role }, JWT_SECRET, { expiresIn: '30d' });
};



export const register = async (req: Request, res: Response) => {
  try {
    const { email, password, firstName, lastName, role, phone, country, birthday, marketingOptIn, termsAccepted } = req.body;
    const userExists = await prisma.user.findUnique({ where: { email } });
    if (userExists) { return res.status(400).json({ success: false, message: 'User already exists' }); }
    if (!termsAccepted) { return res.status(400).json({ success: false, message: 'Terms of Use must be securely acknowledged to proceed' }); }

    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);
    const user = await prisma.user.create({
      data: { 
        email, password: hashedPassword, firstName, lastName, role: role || 'CUSTOMER',
        phone, country, birthday: birthday ? new Date(birthday) : null,
        marketingOptIn: marketingOptIn || false, 
        termsAccepted, agreementVersion: '1.0.0', agreementTimestamp: new Date()
      }
    });
    res.status(201).json({ success: true, data: { id: user.id, email: user.email, firstName: user.firstName, lastName: user.lastName, role: user.role, token: generateToken(user.id, user.role) } });
  } catch (error: any) { res.status(500).json({ success: false, message: error.message }); }
};

export const login = async (req: Request, res: Response) => {
  try {
    const { email, password } = req.body;
    const user = await prisma.user.findUnique({ where: { email } });
    if (!user) { return res.status(401).json({ success: false, message: 'Invalid credentials' }); }
    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) { return res.status(401).json({ success: false, message: 'Invalid credentials' }); }
    res.json({ success: true, data: { id: user.id, email: user.email, firstName: user.firstName, lastName: user.lastName, role: user.role, token: generateToken(user.id, user.role) } });
  } catch (error: any) { res.status(500).json({ success: false, message: error.message }); }
};

export const applyVendor = async (req: Request, res: Response) => {
  try {
    const { email, password, firstName, lastName, storeName, businessType, isRegistered, phone, country, termsAccepted } = req.body;
    const userExists = await prisma.user.findUnique({ where: { email } });
    if (userExists) { return res.status(400).json({ success: false, message: 'Email already exists' }); }
    if (!termsAccepted) { return res.status(400).json({ success: false, message: 'NATION MARKET Vendor Rules & Agreement must be accepted' }); }

    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);
    const user = await prisma.user.create({
      data: {
        email, password: hashedPassword, firstName, lastName, role: 'VENDOR',
        phone, country, termsAccepted, agreementVersion: 'VM-1.0.0', agreementTimestamp: new Date(),
        vendorProfile: { create: { storeName, businessType, isRegistered, status: 'ACTIVE' } }
      }
    });

    // Shoot registration confirmation emails natively bypassing blocking scopes
    try {
      await sendNationMarketEmail(
        email,
        'Vendor Registration Successful',
        'Welcome to Nation-Market',
        `<p>Hello ${firstName},</p><p>Your vendor account for <strong>${storeName}</strong> was successfully created and activated. You can now securely login to your Vendor Dashboard!</p>`
      );
      await sendNationMarketEmail(
        process.env.SMTP_USER || 'admin@nation-market.local',
        'New Vendor Registration',
        'Automated Alert: New Vendor Registration',
        `<p>A new vendor <strong>${firstName} ${lastName}</strong> (${storeName}) has registered under the business type: ${businessType}.</p>`
      );
    } catch (e) {
      console.log('Email transmission encountered a non-fatal bypass sequence', e);
    }

    res.status(201).json({ success: true, message: 'Application approved dynamically. Account is now ACTIVE.', data: { id: user.id, email: user.email, firstName: user.firstName, lastName: user.lastName, role: user.role, token: generateToken(user.id, user.role) } });
  } catch (error: any) { res.status(500).json({ success: false, message: error.message }); }
};

export const applyRider = async (req: Request, res: Response) => {
  try {
    const { 
      email, password, firstName, lastName, phone, country, termsAccepted,
      address, city, vehicleType, plateNumber, idType, idNumber, idDocumentUrl, profilePhotoUrl, licenseDocumentUrl
    } = req.body;
    
    const userExists = await prisma.user.findUnique({ where: { email } });
    if (userExists) { return res.status(400).json({ success: false, message: 'Email already exists' }); }
    if (!termsAccepted) { return res.status(400).json({ success: false, message: 'NATION MARKET Rider Rules & Agreement must be accepted' }); }

    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);
    const user = await prisma.user.create({
      data: {
        email, password: hashedPassword, firstName, lastName, role: 'RIDER',
        phone, country, termsAccepted, agreementVersion: 'RM-1.0.0', agreementTimestamp: new Date(),
        riderProfile: { 
          create: { 
            address, city, vehicleType, plateNumber, 
            idType, idNumber, idDocumentUrl, profilePhotoUrl, licenseDocumentUrl,
            status: 'ACTIVE' 
          } 
        }
      }
    });

    try {
      await sendNationMarketEmail(
        email,
        'Rider Registration Successful',
        'Welcome to Nation-Market',
        `<p>Hello ${firstName},</p><p>Your rider profile was successfully created and activated. You can now login to your Rider Dashboard!</p>`
      );
      await sendNationMarketEmail(
        process.env.SMTP_USER || 'admin@nation-market.local',
        'New Rider Registration',
        'Automated Alert: New Rider Registration',
        `<p>A new Rider <strong>${firstName} ${lastName}</strong> has successfully registered (${vehicleType}).</p>`
      );
    } catch (e) {
      console.log('Email transmission encountered a non-fatal bypass sequence', e);
    }

    res.status(201).json({ success: true, message: 'Application approved dynamically. Account is now ACTIVE.', data: { id: user.id, email: user.email, firstName: user.firstName, lastName: user.lastName, role: user.role, token: generateToken(user.id, user.role) } });
  } catch (error: any) { res.status(500).json({ success: false, message: error.message }); }
};

export const forgotPassword = async (req: Request, res: Response) => {
  try {
    const { email } = req.body;
    const user = await prisma.user.findUnique({ where: { email } });
    if (!user) { return res.status(404).json({ success: false, message: 'User not found' }); }
    const resetToken = jwt.sign({ id: user.id }, JWT_SECRET, { expiresIn: '15m' });
    const resetUrl = `http://localhost:3000/reset-password?token=${resetToken}`;
    await sendNationMarketEmail(
      user.email,
      'Secure Password Reset',
      'Password Reset Request',
      `<p>You requested a password reset. Click the button below securely to restore access:</p>
       <br />
       <a href="${resetUrl}" class="cta-button">Reset Your Password</a>
       <br />
       <p style="margin-top:20px;font-size:12px;color:grey;">If you didn't request this, please ignore this email.</p>`
    );
    res.json({ success: true, message: 'Reset transmission fired successfully' });
  } catch (err: any) { res.status(500).json({ success: false, message: err.message }); }
};

export const resetPassword = async (req: Request, res: Response) => {
  try {
    const { token, newPassword } = req.body;
    const decoded: any = jwt.verify(token, JWT_SECRET);
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(newPassword, salt);
    await prisma.user.update({ where: { id: decoded.id }, data: { password: hashedPassword } });
    res.json({ success: true, message: 'Password reset completely successful' });
  } catch (err: any) { res.status(400).json({ success: false, message: 'Invalid or expired token' }); }
};

export const updateDetails = async (req: Request, res: Response) => {
  try {
    const { firstName, lastName } = req.body;
    const userId = (req as any).user.id;
    const user = await prisma.user.update({ where: { id: userId }, data: { firstName, lastName } });
    res.json({ success: true, message: 'Details updated', data: { firstName: user.firstName, lastName: user.lastName } });
  } catch (err: any) { res.status(500).json({ success: false, message: err.message }); }
};

export const updateContact = async (req: Request, res: Response) => {
  try {
    const { email, phone } = req.body;
    const userId = (req as any).user.id;
    const user = await prisma.user.update({ where: { id: userId }, data: { email, phone } });
    res.json({ success: true, message: 'Contact updated', data: { email: user.email, phone: user.phone } });
  } catch (err: any) { res.status(500).json({ success: false, message: err.message }); }
};

export const updatePassword = async (req: Request, res: Response) => {
  try {
    const { currentPassword, newPassword } = req.body;
    const userId = (req as any).user.id;
    const user = await prisma.user.findUnique({ where: { id: userId } });
    if (!user) return res.status(404).json({ success: false, message: 'User not found' });
    const isMatch = await bcrypt.compare(currentPassword, user.password);
    if (!isMatch) return res.status(400).json({ success: false, message: 'Current password incorrect' });
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(newPassword, salt);
    await prisma.user.update({ where: { id: userId }, data: { password: hashedPassword } });
    res.json({ success: true, message: 'Password updated successfully' });
  } catch (err: any) { res.status(500).json({ success: false, message: err.message }); }
};

export const generate2FA = async (req: Request, res: Response) => {
  try {
    const userId = (req as any).user.id;
    const user = await prisma.user.findUnique({ where: { id: userId } });
    if (!user) return res.status(404).json({ success: false, message: 'User not found' });
    
    const secret = generateSecret();
    const otpauth = 'otpauth://totp/Nation-Market:' + encodeURIComponent(user.email) + '?secret=' + secret + '&issuer=Nation-Market';
    const qrCodeUrl = await QRCode.toDataURL(otpauth);
    
    await prisma.user.update({ where: { id: userId }, data: { twoFactorSecret: secret } });
    res.json({ success: true, data: { qrCodeUrl, secret } });
  } catch (err: any) { res.status(500).json({ success: false, message: err.message }); }
};

export const enable2FA = async (req: Request, res: Response) => {
  try {
    const { token } = req.body;
    const userId = (req as any).user.id;
    const user = await prisma.user.findUnique({ where: { id: userId } });
    if (!user || !user.twoFactorSecret) return res.status(400).json({ success: false, message: '2FA not initialized' });
    
    const validationResult = await verify({ token, secret: user.twoFactorSecret });
    if (!validationResult || !validationResult.valid) return res.status(400).json({ success: false, message: 'Invalid 2FA code' });
    
    await prisma.user.update({ where: { id: userId }, data: { isTwoFactorEnabled: true } });
    res.json({ success: true, message: '2FA effectively enabled and verified' });
  } catch (err: any) { res.status(500).json({ success: false, message: err.message }); }
};

export const disable2FA = async (req: Request, res: Response) => {
  try {
    const userId = (req as any).user.id;
    await prisma.user.update({ where: { id: userId }, data: { isTwoFactorEnabled: false, twoFactorSecret: null } });
    res.json({ success: true, message: '2FA successfully disabled' });
  } catch (err: any) { res.status(500).json({ success: false, message: err.message }); }
};

export const getMe = async (req: Request, res: Response) => {
  try {
    const userId = (req as any).user.id;
    const dbUser = await prisma.user.findUnique({
      where: { id: userId },
      select: { id: true, email: true, firstName: true, lastName: true, phone: true, role: true, isTwoFactorEnabled: true }
    });
    if (!dbUser) return res.status(404).json({ success: false, message: 'User not found' });
    res.json({ success: true, data: dbUser });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
};
