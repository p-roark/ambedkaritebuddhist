'use client';

import { useSession, signOut } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';

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

const MOCK_REFERRAL_CODES = [
  { id: '1', code: 'BHIM-K4P-9M2X', maxUses: 10, currentUses: 3, active: true, createdAt: '2026-01-15' },
  { id: '2', code: 'BHIM-R7T-2B5N', maxUses: 5, currentUses: 5, active: false, createdAt: '2026-01-20' },
  { id: '3', code: 'BHIM-W2Q-6H8J', maxUses: 10, currentUses: 1, active: true, createdAt: '2026-02-01' },
  { id: '4', code: 'BHIM-L9S-4D7F', maxUses: 3, currentUses: 0, active: true, createdAt: '2026-02-10' },
];

const ROLE_COLORS: Record<string, string> = {
  ADMIN: 'bg-red-100 text-red-800',
  LEADER: 'bg-yellow-100 text-yellow-800',
  MEMBER: 'bg-green-100 text-green-800',
  STUDENT: 'bg-blue-100 text-blue-800',
};

function generateCode() {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  const seg = (n: number) => Array.from({ length: n }, () => chars[Math.floor(Math.random() * chars.length)]).join('');
  return `BHIM-${seg(3)}-${seg(4)}`;
}

type Tab = 'overview' | 'pending' | 'members' | 'referrals';

export default function DashboardPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [activeTab, setActiveTab] = useState<Tab>('overview');
  const [pending, setPending] = useState(MOCK_PENDING);
  const [referralCodes, setReferralCodes] = useState(MOCK_REFERRAL_CODES);

  // Modal state
  const [showModal, setShowModal] = useState(false);
  const [maxUses, setMaxUses] = useState(10);
  const [generatedCode, setGeneratedCode] = useState('');
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    if (status === 'unauthenticated') router.push('/auth/login');
  }, [status, router]);

  if (status === 'loading') {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }
  if (!session) return null;

  const isAdmin = session.user.role === 'ADMIN';
  const isLeader = session.user.role === 'LEADER';
  const canManage = isAdmin || isLeader;

  const handleGenerate = () => {
    const code = generateCode();
    setGeneratedCode(code);
  };

  const handleSave = () => {
    if (!generatedCode) return;
    setReferralCodes(prev => [{
      id: String(Date.now()),
      code: generatedCode,
      maxUses,
      currentUses: 0,
      active: true,
      createdAt: new Date().toISOString().split('T')[0],
    }, ...prev]);
    setShowModal(false);
    setGeneratedCode('');
    setMaxUses(10);
    setActiveTab('referrals');
  };

  const handleCopy = () => {
    navigator.clipboard.writeText(generatedCode);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleCloseModal = () => {
    setShowModal(false);
    setGeneratedCode('');
    setMaxUses(10);
    setCopied(false);
  };

  const toggleCode = (id: string) => {
    setReferralCodes(prev => prev.map(c => c.id === id ? { ...c, active: !c.active } : c));
  };

  const tabs = [
    { id: 'overview', label: 'Overview' },
    ...(canManage ? [
      { id: 'pending', label: `Pending${pending.length > 0 ? ` (${pending.length})` : ''}` },
      { id: 'members', label: `Members (${MOCK_MEMBERS.length})` },
    ] : []),
    ...(isAdmin ? [{ id: 'referrals', label: 'Referral Codes' }] : []),
  ];

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
          <button onClick={() => signOut({ callbackUrl: '/' })} className="px-4 py-2 text-sm font-medium text-white bg-red-600 hover:bg-red-700 rounded-md">
            Sign Out
          </button>
        </div>
      </div>

      {/* Tabs */}
      <div className="bg-white border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <nav className="flex space-x-8">
            {tabs.map(tab => (
              <button key={tab.id} onClick={() => setActiveTab(tab.id as Tab)}
                className={`py-4 px-1 border-b-2 text-sm font-medium whitespace-nowrap ${
                  activeTab === tab.id ? 'border-blue-600 text-blue-600' : 'border-transparent text-gray-500 hover:text-gray-700'
                }`}>
                {tab.label}
              </button>
            ))}
          </nav>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">

        {/* Overview */}
        {activeTab === 'overview' && (
          <div>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
              <StatCard label="Total Members" value={MOCK_MEMBERS.length} color="blue" />
              <StatCard label="Pending Approvals" value={pending.length} color="yellow" />
              <StatCard label="Active Referral Codes" value={referralCodes.filter(c => c.active).length} color="indigo" />
              <StatCard label="New This Month" value={3} color="green" />
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              <FeatureCard title="Profile Management" desc="Update your profile information and preferences." color="blue" />
              <FeatureCard title="Community Events" desc="View and RSVP to upcoming community events." color="green" />
              <FeatureCard title="Resources" desc="Access educational materials and community resources." color="purple" />
              {canManage && <FeatureCard title="Pending Approvals" desc={`${pending.length} registration requests awaiting approval.`} color="yellow" onClick={() => setActiveTab('pending')} badge={pending.length} />}
              {canManage && <FeatureCard title="Member List" desc={`${MOCK_MEMBERS.length} active community members.`} color="orange" onClick={() => setActiveTab('members')} />}
              {isAdmin && <FeatureCard title="Referral Codes" desc={`${referralCodes.filter(c => c.active).length} active codes. Generate new ones for invites.`} color="indigo" onClick={() => setActiveTab('referrals')} />}
            </div>
          </div>
        )}

        {/* Pending Approvals */}
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
                    <tr>{['Name', 'Email', 'Referral Code', 'Requested', 'Actions'].map(h => (
                      <th key={h} className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">{h}</th>
                    ))}</tr>
                  </thead>
                  <tbody className="divide-y divide-gray-200">
                    {pending.map(req => (
                      <tr key={req.id} className="hover:bg-gray-50">
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="flex items-center">
                            <div className="h-9 w-9 rounded-full bg-blue-100 flex items-center justify-center text-blue-700 font-semibold text-sm mr-3">{req.name.charAt(0)}</div>
                            <span className="text-sm font-medium text-gray-900">{req.name}</span>
                          </div>
                        </td>
                        <td className="px-6 py-4 text-sm text-gray-500">{req.email}</td>
                        <td className="px-6 py-4"><span className="px-2 py-1 text-xs font-mono bg-gray-100 text-gray-700 rounded">{req.referralCode}</span></td>
                        <td className="px-6 py-4 text-sm text-gray-500">{req.requestedAt}</td>
                        <td className="px-6 py-4 space-x-2">
                          <button onClick={() => setPending(p => p.filter(x => x.id !== req.id))} className="px-3 py-1.5 bg-green-600 text-white text-xs font-medium rounded hover:bg-green-700">Approve</button>
                          <button onClick={() => setPending(p => p.filter(x => x.id !== req.id))} className="px-3 py-1.5 bg-red-100 text-red-700 text-xs font-medium rounded hover:bg-red-200">Reject</button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        )}

        {/* Members */}
        {activeTab === 'members' && canManage && (
          <div>
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-lg font-semibold text-gray-900">Member List</h2>
            </div>
            <div className="bg-white shadow rounded-lg overflow-hidden">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>{['Member', 'Email', 'Role', 'Joined', 'Status'].map(h => (
                    <th key={h} className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">{h}</th>
                  ))}</tr>
                </thead>
                <tbody className="divide-y divide-gray-200">
                  {MOCK_MEMBERS.map(m => (
                    <tr key={m.id} className="hover:bg-gray-50">
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center">
                          <div className="h-9 w-9 rounded-full bg-indigo-100 flex items-center justify-center text-indigo-700 font-semibold text-sm mr-3">{m.name.charAt(0)}</div>
                          <span className="text-sm font-medium text-gray-900">{m.name}</span>
                        </div>
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-500">{m.email}</td>
                      <td className="px-6 py-4"><span className={`px-2 py-1 text-xs font-medium rounded-full ${ROLE_COLORS[m.role]}`}>{m.role}</span></td>
                      <td className="px-6 py-4 text-sm text-gray-500">{m.joinedAt}</td>
                      <td className="px-6 py-4"><span className="px-2 py-1 text-xs font-medium rounded-full bg-green-100 text-green-800">Active</span></td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* Referral Codes */}
        {activeTab === 'referrals' && isAdmin && (
          <div>
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-lg font-semibold text-gray-900">Referral Codes</h2>
              <button onClick={() => setShowModal(true)} className="px-4 py-2 bg-blue-600 text-white text-sm font-medium rounded-md hover:bg-blue-700">
                + Generate Referral Code
              </button>
            </div>
            <div className="bg-white shadow rounded-lg overflow-hidden">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>{['Code', 'Uses', 'Created', 'Status', 'Actions'].map(h => (
                    <th key={h} className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">{h}</th>
                  ))}</tr>
                </thead>
                <tbody className="divide-y divide-gray-200">
                  {referralCodes.map(c => (
                    <tr key={c.id} className="hover:bg-gray-50">
                      <td className="px-6 py-4">
                        <span className="font-mono text-sm font-medium text-gray-900">{c.code}</span>
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex items-center space-x-2">
                          <div className="w-24 bg-gray-200 rounded-full h-2">
                            <div className="bg-blue-600 h-2 rounded-full" style={{ width: `${Math.min((c.currentUses / c.maxUses) * 100, 100)}%` }}></div>
                          </div>
                          <span className="text-sm text-gray-600">{c.currentUses}/{c.maxUses}</span>
                        </div>
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-500">{c.createdAt}</td>
                      <td className="px-6 py-4">
                        <span className={`px-2 py-1 text-xs font-medium rounded-full ${c.active && c.currentUses < c.maxUses ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-600'}`}>
                          {c.currentUses >= c.maxUses ? 'Exhausted' : c.active ? 'Active' : 'Disabled'}
                        </span>
                      </td>
                      <td className="px-6 py-4">
                        <button onClick={() => toggleCode(c.id)} className={`px-3 py-1.5 text-xs font-medium rounded ${c.active ? 'bg-gray-100 text-gray-700 hover:bg-gray-200' : 'bg-green-100 text-green-700 hover:bg-green-200'}`}>
                          {c.active ? 'Disable' : 'Enable'}
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>

      {/* Generate Referral Code Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-2xl w-full max-w-md">
            <div className="flex justify-between items-center px-6 py-4 border-b">
              <h3 className="text-lg font-semibold text-gray-900">Generate Referral Code</h3>
              <button onClick={handleCloseModal} className="text-gray-400 hover:text-gray-600 text-2xl leading-none">&times;</button>
            </div>

            <div className="px-6 py-5 space-y-5">
              {/* Max uses */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Max Uses</label>
                <select
                  value={maxUses}
                  onChange={e => setMaxUses(Number(e.target.value))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  {[1, 3, 5, 10, 20, 50].map(n => (
                    <option key={n} value={n}>{n} {n === 1 ? 'person' : 'people'}</option>
                  ))}
                </select>
                <p className="mt-1 text-xs text-gray-500">How many people can register using this code</p>
              </div>

              {/* Generate button */}
              <button
                onClick={handleGenerate}
                className="w-full py-2.5 bg-blue-600 text-white text-sm font-medium rounded-md hover:bg-blue-700 transition-colors"
              >
                {generatedCode ? '↻ Regenerate' : 'Generate Code'}
              </button>

              {/* Generated code display */}
              {generatedCode && (
                <div className="bg-gray-50 border border-gray-200 rounded-lg p-4">
                  <p className="text-xs text-gray-500 mb-2 font-medium uppercase tracking-wide">Generated Code</p>
                  <div className="flex items-center justify-between">
                    <span className="font-mono text-xl font-bold text-gray-900 tracking-widest">{generatedCode}</span>
                    <button
                      onClick={handleCopy}
                      className={`ml-3 px-3 py-1.5 text-xs font-medium rounded-md transition-colors ${
                        copied ? 'bg-green-100 text-green-700' : 'bg-white border border-gray-300 text-gray-700 hover:bg-gray-50'
                      }`}
                    >
                      {copied ? '✓ Copied!' : 'Copy'}
                    </button>
                  </div>
                  <p className="mt-2 text-xs text-gray-500">Valid for {maxUses} {maxUses === 1 ? 'use' : 'uses'} · Prefix: BHIM-</p>
                </div>
              )}
            </div>

            <div className="px-6 py-4 border-t bg-gray-50 rounded-b-xl flex justify-end space-x-3">
              <button onClick={handleCloseModal} className="px-4 py-2 text-sm text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50">
                Cancel
              </button>
              <button
                onClick={handleSave}
                disabled={!generatedCode}
                className="px-4 py-2 text-sm text-white bg-blue-600 rounded-md hover:bg-blue-700 disabled:opacity-40 disabled:cursor-not-allowed"
              >
                Save & Add to List
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function StatCard({ label, value, color }: { label: string; value: number; color: string }) {
  const colors: Record<string, string> = {
    blue: 'bg-blue-50 text-blue-700', yellow: 'bg-yellow-50 text-yellow-700',
    indigo: 'bg-indigo-50 text-indigo-700', green: 'bg-green-50 text-green-700',
  };
  return (
    <div className={`rounded-lg p-6 ${colors[color]}`}>
      <p className="text-3xl font-bold">{value}</p>
      <p className="text-sm font-medium mt-1 opacity-80">{label}</p>
    </div>
  );
}

function FeatureCard({ title, desc, color, onClick, badge }: { title: string; desc: string; color: string; onClick?: () => void; badge?: number }) {
  const bg: Record<string, string> = { blue: 'bg-blue-50 border-blue-100', green: 'bg-green-50 border-green-100', purple: 'bg-purple-50 border-purple-100', yellow: 'bg-yellow-50 border-yellow-100', orange: 'bg-orange-50 border-orange-100', indigo: 'bg-indigo-50 border-indigo-100' };
  const tc: Record<string, string> = { blue: 'text-blue-900', green: 'text-green-900', purple: 'text-purple-900', yellow: 'text-yellow-900', orange: 'text-orange-900', indigo: 'text-indigo-900' };
  const dc: Record<string, string> = { blue: 'text-blue-700', green: 'text-green-700', purple: 'text-purple-700', yellow: 'text-yellow-700', orange: 'text-orange-700', indigo: 'text-indigo-700' };
  return (
    <div className={`rounded-lg border p-6 ${bg[color]} ${onClick ? 'cursor-pointer hover:shadow-md transition-shadow' : ''}`} onClick={onClick}>
      <div className="flex justify-between items-start">
        <h3 className={`text-base font-semibold ${tc[color]}`}>{title}</h3>
        {badge ? <span className="ml-2 px-2 py-0.5 text-xs font-bold bg-red-500 text-white rounded-full">{badge}</span> : null}
      </div>
      <p className={`mt-2 text-sm ${dc[color]}`}>{desc}</p>
    </div>
  );
}
