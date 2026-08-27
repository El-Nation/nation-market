import { redirect } from 'next/navigation';

export default function AdminLogin() {
  // This securely forwards to the Global Unified Login interface
  redirect((process.env.NEXT_PUBLIC_CUSTOMER_URL || '') + '/login');
}
