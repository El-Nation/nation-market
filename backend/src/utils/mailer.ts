import nodemailer from 'nodemailer';

const transporter = nodemailer.createTransport({
  host: process.env.SMTP_HOST || 'smtp.gmail.com',
  port: Number(process.env.SMTP_PORT) === 465 ? 587 : (Number(process.env.SMTP_PORT) || 587),
  secure: false,
  auth: {
    user: process.env.SMTP_USER,
    pass: process.env.SMTP_PASS,
  },
  tls: { rejectUnauthorized: false }
});

export const sendNationMarketEmail = async (
  to: string,
  subject: string,
  title: string,
  htmlContent: string
) => {
  if (!process.env.SMTP_USER || !process.env.SMTP_PASS) {
    console.log(`[SMTP Stub] Would have sent to ${to}: ${subject}`);
    return;
  }
  
  const html = `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>${subject}</title>
      <style>
        body { font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; background-color: #f9fafb; margin: 0; padding: 20px; color: #374151; }
        .container { max-width: 600px; margin: 0 auto; background: #ffffff; border-radius: 8px; overflow: hidden; box-shadow: 0 4px 6px rgba(0,0,0,0.05); }
        .header { background-color: #1a56db; padding: 20px; text-align: center; color: white; }
        .content { padding: 30px; }
        .title { color: #111827; font-size: 24px; font-weight: bold; margin-bottom: 20px; }
        .footer { background-color: #f3f4f6; padding: 20px; text-align: center; font-size: 12px; color: #6b7280; }
        .cta-button { display: inline-block; background-color: #1a56db; color: white !important; padding: 12px 24px; text-decoration: none; border-radius: 6px; font-weight: 500; margin-top: 20px; }
      </style>
    </head>
    <body>
      <div class="container">
        <div class="header">
          <h2 style="margin: 0">NATION MARKET</h2>
        </div>
        <div class="content">
          <div class="title">${title}</div>
          ${htmlContent}
        </div>
        <div class="footer">
          NATION MARKET © 2026<br/>
          © 2026 Nation Market. All rights reserved.
        </div>
      </div>
    </body>
    </html>
  `;

  try {
    await transporter.sendMail({
      from: `"Nation Market" <${process.env.SMTP_USER}>`,
      to,
      subject: `Nation Market - ${subject}`,
      html,
    });
    console.log(`Successfully sent email to ${to}`);
  } catch (error) {
    console.error('SMTP Error:', error);
  }
};
