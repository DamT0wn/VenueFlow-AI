import { redirect } from 'next/navigation';

// Login removed for hackathon demo — redirect straight to the app
export default function LoginPage() {
  redirect('/map');
}
