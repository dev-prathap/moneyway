import { redirect } from 'next/navigation';
import { getCurrentUser } from '@/lib/auth';
import { getDb } from '@/lib/db';
import DashboardClient from './DashboardClient';

export default async function DashboardPage() {
  // SSR auth check
  const user = await getCurrentUser();

  if (!user) {
    redirect('/login');
  }

  // Fetch pass statistics on server
  let stats = {
    totalPasses: 0,
    usedPasses: 0,
    unusedPasses: 0,
  };

  try {
    const db = await getDb();
    const passesCollection = db.collection('passes');

    const totalPasses = await passesCollection.countDocuments();
    const usedPasses = await passesCollection.countDocuments({ status: 'used' });
    const unusedPasses = totalPasses - usedPasses;

    stats = {
      totalPasses,
      usedPasses,
      unusedPasses,
    };
  } catch (error) {
    console.error('Error fetching pass statistics:', error);
  }

  return <DashboardClient user={user} stats={stats} />;
}
