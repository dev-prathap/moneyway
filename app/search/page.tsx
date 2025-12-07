import { redirect } from 'next/navigation';
import { getCurrentUser } from '@/lib/auth';
import SearchClient from './SearchClient';

export default async function SearchPage() {
  const user = await getCurrentUser();

  if (!user) {
    redirect('/login');
  }

  return <SearchClient user={user} />;
}
