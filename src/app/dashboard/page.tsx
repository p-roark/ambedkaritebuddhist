'use client';

import { useSession, signOut } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';

// Mock data for UI preview
const MOCK_PENDING = [
  { id: '1', name: 'Rahul Meshram', email: 'rahul.meshram@gmail.com', referralCode: 'BHIM-ABC-7K2M', requestedAt: '2026-02-22' },
  { id: '2', name: 'Priya Kamble', email: 'priya.kamble@yahoo.com', referralCode: 'BHIM-XYZ-9P3Q', requestedAt: '2026-02-22' },
  { id: '3', name: 'Sanjay Gaikwad', email: 'sanjay.g@gmail.com', referralCode: 'BHIM-DEF-4R1S', requestedAt: '2026-02-23' },
];

const MOCK_MEMBERS = [
  { id: '1', name: 'Pankaj Meshram', email: 'pankaj@example.com', role: 'ADMIN', joinedAt: '2025-10-01', status: 'active' },
  { id: '2', name: 'Anita Jadhav', email: 'anita.j@gmail.com', role: 'LEADER', joinedAt: '2025-11-15', status: 'active' },
  { id: '3', name: 'Vikram Rathod', email: 'vikram.r@gmail.com', role: 'MEMBER', joinedAt: '2025-12-03', status: 'active' },
  { id: '4', name: 'Sunita Pawar', email: 'sunita.p@gmail.com', role: 'MEMBER', joinedAt: '2026-01-10', status: 'active' },
  { id: '5', name: 'Amit Bansode', email: 'amit.b@gmail.com', role: 'MEMBER', joinedAt: '2026-01-22', status: 'active' },
  { id: '6', name: 'Deepa Shinde', email: 'deepa.s@gmail.com', role: 'STUDENT', joinedAt: '2026-02-05', status: 'active' },
];

const ROLE_COLORS: Record<string, string> = {
  ADMIN: 'bg-red-100 text-red-800',
  LEADER: 'bg-yellow-100 text-yellow-800',
  MEMBER: 'bg-green-100 text-green-800',
  STUDENT: 'bg-blue-100 text-blue-800',
};

type Tab = 'overview' | 'pending' | 'members';

export default function DashboardPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [activeTab, setActiveTab] = useState<Tab>('overview');
  const [pending, setPending] = useState(MOCK_PENDING);

  useEffect(() => {
    if (status === 'unauthenticated') {
      router.push('/auth/login');
    }
  }, [status, router]);

  if (status === 'loading') {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading...</p>
        </div>
      </div>
    );
  }

  if (!session) return null;

  const isAdmin = session.user.role === 'ADMIN';
  const isLeader = session.user.role === 'LEADER';
  const canManage = isAdmin || isLeader;

  const handleApprove = (id: string) => {
    setPending(prev => prev.filter(p => p.id !== id));
  };
  const handleReject = (id: string) => {
    setPending(prev => prev.filter(p => p.id !== id));
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 flex justify-between items-center">
          <div>
            <h1 className="text-xl font-bold text-gray-900">Community Dashboard</h1>
            <p className="text-sm text-gray-500">
              {session.user.name} ·{' '}
              <span className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium ${ROLE_COLORS[session.user.role] || 'bg-gray-100 text-gray-800'}`}>
                {session.user.role}
              </span>
            </p>
          </div>
          <button
            onClick={() => signOut({ callbackUrl: '/' })}
            className="px-4 py-2 text-sm font-medium text-white bg-red-600 hover:bg-red-700 rounded-md"
          >
            Sign Out
          </button>
        </div>
      </div>

      {/* Tabs */}
      <div className="bg-white border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <nav className="flex space-x-8">
            {[
              { id: 'overview', label: 'Overview' },
              ...(canManage ? [
                { id: 'pending', label: `Pending Approvals ${pending.length > 0 ? `(${pending.length})` : ''}` },
                { id: 'members', label: `Members (${MOCK_MEMBERS.length})` },
              ] : []),
            ].map(tab => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id as Tab)}
                className={`py-4 px-1 border-b-2 text-sm font-medium whitespace-nowrap ${
                  activeTab === tab.id
                    ? 'border-blue-600 text-blue-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700'
                }`}
              >
                {tab.label}
              </button>
            ))}
          </nav>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">

        {/* Overview Tab */}
        {activeTab === 'overview' && (
          <div>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
              <StatCard label="Total Members" value={MOCK_MEMBERS.length} color="blue" />
              <StatCard label="Pending Approvals" value={pending.length} color="yellow" />
              <StatCard label="Leaders" value={MOCK_MEMBERS.filter(m => m.role === 'LEADER').length} color="purple" />
              <StatCard label="New This Month" value={3} color="green" />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              <FeatureCard title="Profile Management" desc="Update your profile information and preferences." color="blue" />
              <FeatureCard title="Community Events" desc="View and RSVP to upcoming community events." color="green" />
              <FeatureCard title="Resources" desc="Access educational materials and community resources." color="purple" />
              {canManage && <FeatureCard title="Member Management" desc="View and manage community members." color="yellow" onClick={() => setActiveTab('members')} />}
              {canManage && <FeatureCard title="Pending Approvals" desc={`${pending.length} new registration requests awaiting approval.`} color="orange" onClick={() => setActiveTab('pending')} badge={pending.length} />}
              {isAdmin && <FeatureCard title="Referral Codes" desc="Generate and manage BHIM- referral codes." color="indigo" />}
            </div>
          </div>
        )}

        {/* Pending Approvals Tab */}
        {activeTab === 'pending' && canManage && (
          <div>
            <h2 className="text-lg font-semibold text-gray-900 mb-4">Pending Registration Requests</h2>
            {pending.length === 0 ? (
              <div className="bg-white rounded-lg shadow p-12 text-center text-gray-500">
                <p className="text-4xl mb-3">✅</p>
                <p className="font-medium">All caught up! No pending approvals.</p>
              </div>
            ) : (
              <div className="bg-white shadow rounded-lg overflow-hidden">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      {['Name', 'Email', 'Referral Code', 'Requested', 'Actions'].map(h => (
                        <th key={h} className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {pending.map(req => (
                      <tr key={req.id} className="hover:bg-gray-50">
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="flex items-center">
                            <div className="h-9 w-9 rounded-full bg-blue-100 flex items-center justify-center text-blue-700 font-semibold text-sm mr-3">
                              {req.name.charAt(0)}
                            </div>
                            <span className="text-sm font-medium text-gray-900">{req.name}</span>
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{req.email}</td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span className="px-2 py-1 text-xs font-mono bg-gray-100 text-gray-700 rounded">{req.referralCode}</span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{req.requestedAt}</td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm space-x-2">
                          <button onClick={() => handleApprove(req.id)} className="px-3 py-1.5 bg-green-600 text-white text-xs font-medium rounded hover:bg-green-700">
                            Approve
                          </button>
                          <button onClick={() => handleReject(req.id)} className="px-3 py-1.5 bg-red-100 text-red-700 text-xs font-medium rounded hover:bg-red-200">
                            Reject
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        )}

        {/* Members Tab */}
        {activeTab === 'members' && canManage && (
          <div>
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-lg font-semibold text-gray-900">Member List</h2>
              {isAdmin && (
                <button className="px-4 py-2 bg-blue-600 text-white text-sm font-medium rounded-md hover:bg-blue-700">
                  + Generate Referral Code
                </button>
              )}
            </div>
            <div className="bg-white shadow rounded-lg overflow-hidden">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    {['Member', 'Email', 'Role', 'Joined', 'Status'].map(h => (
                      <th key={h} className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {MOCK_MEMBERS.map(member => (
                    <tr key={member.id} className="hover:bg-gray-50">
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center">
                          <div className="h-9 w-9 rounded-full bg-indigo-100 flex items-center justify-center text-indigo-700 font-semibold text-sm mr-3">
                            {member.name.charAt(0)}
                          </div>
                          <span className="text-sm font-medium text-gray-900">{member.name}</span>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{member.email}</td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={`px-2 py-1 text-xs font-medium rounded-full ${ROLE_COLORS[member.role]}`}>
                          {member.role}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{member.joinedAt}</td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className="px-2 py-1 text-xs font-medium rounded-full bg-green-100 text-green-800">Active</span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

function StatCard({ label, value, color }: { label: string; value: number; color: string }) {
  const colors: Record<string, string> = {
    blue: 'bg-blue-50 text-blue-600',
    yellow: 'bg-yellow-50 text-yellow-600',
    purple: 'bg-purple-50 text-purple-600',
    green: 'bg-green-50 text-green-600',
  };
  return (
    <div className={`rounded-lg p-6 ${colors[color] || 'bg-gray-50 text-gray-600'}`}>
      <p className="text-3xl font-bold">{value}</p>
      <p className="text-sm font-medium mt-1 opacity-80">{label}</p>
    </div>
  );
}

function FeatureCard({ title, desc, color, onClick, badge }: { title: string; desc: string; color: string; onClick?: () => void; badge?: number }) {
  const colors: Record<string, string> = {
    blue: 'bg-blue-50 border-blue-100',
    green: 'bg-green-50 border-green-100',
    purple: 'bg-purple-50 border-purple-100',
    yellow: 'bg-yellow-50 border-yellow-100',
    orange: 'bg-orange-50 border-orange-100',
    indigo: 'bg-indigo-50 border-indigo-100',
    red: 'bg-red-50 border-red-100',
  };
  const titleColors: Record<string, string> = {
    blue: 'text-blue-900', green: 'text-green-900', purple: 'text-purple-900',
    yellow: 'text-yellow-900', orange: 'text-orange-900', indigo: 'text-indigo-900', red: 'text-red-900',
  };
  const descColors: Record<string, string> = {
    blue: 'text-blue-700', green: 'text-green-700', purple: 'text-purple-700',
    yellow: 'text-yellow-700', orange: 'text-orange-700', indigo: 'text-indigo-700', red: 'text-red-700',
  };
  return (
    <div
      className={`rounded-lg border p-6 ${colors[color]} ${onClick ? 'cursor-pointer hover:shadow-md transition-shadow' : ''}`}
      onClick={onClick}
    >
      <div className="flex justify-between items-start">
        <h3 className={`text-base font-semibold ${titleColors[color]}`}>{title}</h3>
        {badge ? (
          <span className="ml-2 px-2 py-0.5 text-xs font-bold bg-red-500 text-white rounded-full">{badge}</span>
        ) : null}
      </div>
      <p className={`mt-2 text-sm ${descColors[color]}`}>{desc}</p>
    </div>
  );
}
