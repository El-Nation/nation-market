import { redirect } from 'next/navigation';

export default function AdminLogin() {
  // This securely forwards to the Global Unified Login interface
  redirect('http://localhost:3000/login');
}
