import { redirect } from 'next/navigation';

export default function VendorLogin() {
  // This explicitly forwards to the Global Unified Login interface built in Stage 3
  redirect('http://localhost:3000/login');
}
