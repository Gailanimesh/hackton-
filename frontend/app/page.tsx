import { redirect } from 'next/navigation';

// Root "/" → redirect to "/auth"
// Middleware will handle redirecting authenticated users to /dashboard
export default function RootPage() {
  redirect('/auth');
}
