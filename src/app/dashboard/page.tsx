'use client';

import { useSession, signOut } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { useEffect } from 'react';

export default function DashboardPage() {
  const { data: session, status } = useSession();
  const router = useRouter();

  useEffect(() => {
    if (status === 'unauthenticated') {
      router.push('/auth/login');
    }
  }, [status, router]);

  if (status === 'loading') {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
          <p className="mt-4 text-gray-600">Loading...</p>
        </div>
      </div>
    );
  }

  if (!session) {
    return null;
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="bg-white shadow rounded-lg">
          <div className="px-4 py-5 sm:p-6">
            <div className="flex justify-between items-start">
              <div>
                <h1 className="text-2xl font-bold text-gray-900">
                  Welcome, {session.user.name}!
                </h1>
                <p className="mt-1 text-sm text-gray-500">
                  Role: <span className="capitalize font-medium">{session.user.role.toLowerCase()}</span>
                </p>
                <p className="text-sm text-gray-500">
                  Email: {session.user.email}
                </p>
              </div>
              <button
                onClick={() => signOut({ callbackUrl: '/' })}
                className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-red-600 hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500"
              >
                Sign Out
              </button>
            </div>
            
            <div className="mt-8">
              <h2 className="text-lg font-medium text-gray-900 mb-4">Dashboard Features</h2>
              
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                <div className="bg-blue-50 p-6 rounded-lg">
                  <h3 className="text-lg font-medium text-blue-900 mb-2">Profile Management</h3>
                  <p className="text-blue-700 text-sm">
                    Update your profile information and preferences.
                  </p>
                </div>
                
                <div className="bg-green-50 p-6 rounded-lg">
                  <h3 className="text-lg font-medium text-green-900 mb-2">Community Events</h3>
                  <p className="text-green-700 text-sm">
                    View and RSVP to upcoming community events.
                  </p>
                </div>
                
                <div className="bg-purple-50 p-6 rounded-lg">
                  <h3 className="text-lg font-medium text-purple-900 mb-2">Resources</h3>
                  <p className="text-purple-700 text-sm">
                    Access educational materials and community resources.
                  </p>
                </div>
                
                {(session.user.role === 'ADMIN' || session.user.role === 'LEADER') && (
                  <>
                    <div className="bg-yellow-50 p-6 rounded-lg">
                      <h3 className="text-lg font-medium text-yellow-900 mb-2">Member Management</h3>
                      <p className="text-yellow-700 text-sm">
                        View and manage community members.
                      </p>
                    </div>
                    
                    <div className="bg-indigo-50 p-6 rounded-lg">
                      <h3 className="text-lg font-medium text-indigo-900 mb-2">Referral Codes</h3>
                      <p className="text-indigo-700 text-sm">
                        Generate and manage referral codes.
                      </p>
                    </div>
                  </>
                )}
                
                {session.user.role === 'ADMIN' && (
                  <div className="bg-red-50 p-6 rounded-lg">
                    <h3 className="text-lg font-medium text-red-900 mb-2">Admin Panel</h3>
                    <p className="text-red-700 text-sm">
                      Advanced administration and system settings.
                    </p>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}