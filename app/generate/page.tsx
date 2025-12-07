import { redirect } from 'next/navigation';
import { getCurrentUser } from '@/lib/auth';
import GenerateForm from './GenerateForm';

export default async function GeneratePage() {
  const user = await getCurrentUser();

  if (!user) {
    redirect('/login');
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
        <div className="px-4 py-6 sm:px-0">
          <h1 className="text-3xl font-bold text-gray-900 mb-4">
            Generate Passes
          </h1>
          <div className="bg-white shadow rounded-lg p-6">
            <GenerateForm />
          </div>
        </div>
      </div>
    </div>
  );
}
