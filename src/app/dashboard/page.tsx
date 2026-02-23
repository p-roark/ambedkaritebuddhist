'use client';

import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { useEffect, useMemo, useState } from 'react';

type Role = 'ADMIN' | 'MEMBER';
type EventStatus = 'Upcoming' | 'Registration Started' | 'Event Ended';
type Tab = 'members' | 'events' | 'referrals';

const MOCK_PENDING = [
  { id: 'p1', name: 'Rahul Meshram', email: 'rahul.meshram@gmail.com', referralCode: 'BHIM-ABC-7K2M', requestedAt: '2026-02-22' },
  { id: 'p2', name: 'Priya Kamble', email: 'priya.kamble@yahoo.com', referralCode: 'BHIM-XYZ-9P3Q', requestedAt: '2026-02-22' },
  { id: 'p3', name: 'Sanjay Gaikwad', email: 'sanjay.g@gmail.com', referralCode: 'BHIM-DEF-4R1S', requestedAt: '2026-02-23' },
];

const MOCK_MEMBERS = [
  { id: 'm1', name: 'Pankaj Meshram', email: 'pankaj@example.com', role: 'ADMIN' as Role, joinedAt: '2025-10-01' },
  { id: 'm2', name: 'Anita Jadhav', email: 'anita.j@gmail.com', role: 'MEMBER' as Role, joinedAt: '2025-11-15' },
  { id: 'm3', name: 'Vikram Rathod', email: 'vikram.r@gmail.com', role: 'MEMBER' as Role, joinedAt: '2025-12-03' },
  { id: 'm4', name: 'Sunita Pawar', email: 'sunita.p@gmail.com', role: 'MEMBER' as Role, joinedAt: '2026-01-10' },
  { id: 'm5', name: 'Amit Bansode', email: 'amit.b@gmail.com', role: 'MEMBER' as Role, joinedAt: '2026-01-22' },
  { id: 'm6', name: 'Deepa Shinde', email: 'deepa.s@gmail.com', role: 'MEMBER' as Role, joinedAt: '2026-02-05' },
];

const MOCK_EVENTS = [
  { id: 'e1', title: 'Ambedkar Jayanti Celebration', date: '2026-04-14', location: 'Toronto', status: 'Upcoming' as EventStatus },
  { id: 'e2', title: 'Dhamma Study Circle', date: '2026-03-18', location: 'Mississauga', status: 'Registration Started' as EventStatus },
  { id: 'e3', title: 'Winter Community Meetup', date: '2026-01-12', location: 'Brampton', status: 'Event Ended' as EventStatus },
];

const MOCK_REFERRAL_CODES = [
  { id: '1', code: 'BHIM-K4P-9M2X', maxUses: 10, currentUses: 3, active: true, createdAt: '2026-01-15' },
  { id: '2', code: 'BHIM-R7T-2B5N', maxUses: 5, currentUses: 5, active: false, createdAt: '2026-01-20' },
  { id: '3', code: 'BHIM-W2Q-6H8J', maxUses: 10, currentUses: 1, active: true, createdAt: '2026-02-01' },
  { id: '4', code: 'BHIM-L9S-4D7F', maxUses: 3, currentUses: 0, active: true, createdAt: '2026-02-10' },
];

const ROLE_COLORS: Record<Role, string> = {
  ADMIN: 'bg-red-100 text-red-800',
  MEMBER: 'bg-green-100 text-green-800',
};

const EVENT_STATUS_COLORS: Record<EventStatus, string> = {
  Upcoming: 'bg-blue-100 text-blue-800',
  'Registration Started': 'bg-yellow-100 text-yellow-800',
  'Event Ended': 'bg-gray-200 text-gray-700',
};

function generateCode() {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  const seg = (n: number) => Array.from({ length: n }, () => chars[Math.floor(Math.random() * chars.length)]).join('');
  return `BHIM-${seg(3)}-${seg(4)}`;
}

export default function DashboardPage() {
  const { data: session, status } = useSession();
  const router = useRouter();

  const [activeTab, setActiveTab] = useState<Tab>('members');
  const [pending, setPending] = useState(MOCK_PENDING);
  const [members, setMembers] = useState(MOCK_MEMBERS);
  const [events, setEvents] = useState(MOCK_EVENTS);
  const [referralCodes, setReferralCodes] = useState(MOCK_REFERRAL_CODES);

  const [newEventTitle, setNewEventTitle] = useState('');
  const [newEventDate, setNewEventDate] = useState('');
  const [newEventLocation, setNewEventLocation] = useState('');
  const [newEventStatus, setNewEventStatus] = useState<EventStatus>('Upcoming');

  const [showModal, setShowModal] = useState(false);
  const [maxUses, setMaxUses] = useState(10);
  const [generatedCode, setGeneratedCode] = useState('');
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    if (status === 'unauthenticated') router.push('/auth/login');
  }, [status, router]);

  useEffect(() => {
    if (status === 'authenticated' && session?.user?.role !== 'ADMIN') {
      router.push('/');
    }
  }, [status, session?.user?.role, router]);

  if (status === 'loading') {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }
  if (!session) return null;
  if (session.user.role !== 'ADMIN') return null;

  const tabs = useMemo(
    () => [
      { id: 'members', label: `Members (${members.length})` },
      { id: 'events', label: `Events (${events.length})` },
      { id: 'referrals', label: 'Referral Codes' },
    ] satisfies Array<{ id: Tab; label: string }>,
    [members.length, events.length],
  );

  const handleRoleChange = (memberId: string, role: Role) => {
    setMembers((prev) => prev.map((m) => (m.id === memberId ? { ...m, role } : m)));
  };

  const handleApprovePending = (pendingId: string) => {
    const request = pending.find((p) => p.id === pendingId);
    if (!request) return;

    const today = new Date().toISOString().split('T')[0];
    setMembers((prev) => [
      {
        id: `m-${Date.now()}`,
        name: request.name,
        email: request.email,
        role: 'MEMBER',
        joinedAt: today,
      },
      ...prev,
    ]);
    setPending((prev) => prev.filter((p) => p.id !== pendingId));
  };

  const handleRejectPending = (pendingId: string) => {
    setPending((prev) => prev.filter((p) => p.id !== pendingId));
  };

  const handleAddEvent = () => {
    if (!newEventTitle.trim() || !newEventDate || !newEventLocation.trim()) return;

    setEvents((prev) => [
      {
        id: `e-${Date.now()}`,
        title: newEventTitle.trim(),
        date: newEventDate,
        location: newEventLocation.trim(),
        status: newEventStatus,
      },
      ...prev,
    ]);

    setNewEventTitle('');
    setNewEventDate('');
    setNewEventLocation('');
    setNewEventStatus('Upcoming');
  };

  const handleEventStatusChange = (eventId: string, status: EventStatus) => {
    setEvents((prev) => prev.map((event) => (event.id === eventId ? { ...event, status } : event)));
  };

  const handleGenerate = () => {
    const code = generateCode();
    setGeneratedCode(code);
  };

  const handleSave = () => {
    if (!generatedCode) return;
    setReferralCodes((prev) => [
      {
        id: String(Date.now()),
        code: generatedCode,
        maxUses,
        currentUses: 0,
        active: true,
        createdAt: new Date().toISOString().split('T')[0],
      },
      ...prev,
    ]);
    setShowModal(false);
    setGeneratedCode('');
    setMaxUses(10);
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
    setReferralCodes((prev) => prev.map((c) => (c.id === id ? { ...c, active: !c.active } : c)));
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="bg-white shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <h1 className="text-xl font-bold text-gray-900">Community Dashboard</h1>
          <p className="text-sm text-gray-500">
            {session.user.name} ·{' '}
            <span className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium ${ROLE_COLORS.ADMIN}`}>
              ADMIN
            </span>
          </p>
        </div>
      </div>

      <div className="bg-white border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <nav className="flex space-x-8">
            {tabs.map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
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
        {activeTab === 'members' && (
          <div className="space-y-8">
            <section>
              <div className="flex justify-between items-center mb-4">
                <h2 className="text-lg font-semibold text-gray-900">
                  Pending Member Approvals ({pending.length})
                </h2>
              </div>

              {pending.length === 0 ? (
                <div className="bg-white rounded-lg shadow p-8 text-center text-gray-500">
                  No pending approvals.
                </div>
              ) : (
                <div className="bg-white shadow rounded-lg overflow-hidden">
                  <table className="min-w-full divide-y divide-gray-200">
                    <thead className="bg-gray-50">
                      <tr>
                        {['Name', 'Email', 'Referral Code', 'Requested', 'Actions'].map((h) => (
                          <th
                            key={h}
                            className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                          >
                            {h}
                          </th>
                        ))}
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-200">
                      {pending.map((req) => (
                        <tr key={req.id} className="hover:bg-gray-50">
                          <td className="px-6 py-4 text-sm font-medium text-gray-900">{req.name}</td>
                          <td className="px-6 py-4 text-sm text-gray-500">{req.email}</td>
                          <td className="px-6 py-4">
                            <span className="px-2 py-1 text-xs font-mono bg-gray-100 text-gray-700 rounded">
                              {req.referralCode}
                            </span>
                          </td>
                          <td className="px-6 py-4 text-sm text-gray-500">{req.requestedAt}</td>
                          <td className="px-6 py-4 space-x-2">
                            <button
                              onClick={() => handleApprovePending(req.id)}
                              className="px-3 py-1.5 bg-green-600 text-white text-xs font-medium rounded hover:bg-green-700"
                            >
                              Approve
                            </button>
                            <button
                              onClick={() => handleRejectPending(req.id)}
                              className="px-3 py-1.5 bg-red-100 text-red-700 text-xs font-medium rounded hover:bg-red-200"
                            >
                              Reject
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </section>

            <section>
              <h2 className="text-lg font-semibold text-gray-900 mb-4">All Members</h2>
              <div className="bg-white shadow rounded-lg overflow-hidden">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      {['Member', 'Email', 'Role', 'Joined'].map((h) => (
                        <th
                          key={h}
                          className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                        >
                          {h}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-200">
                    {members.map((m) => (
                      <tr key={m.id} className="hover:bg-gray-50">
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">{m.name}</td>
                        <td className="px-6 py-4 text-sm text-gray-500">{m.email}</td>
                        <td className="px-6 py-4">
                          <div className="flex items-center gap-2">
                            <select
                              value={m.role}
                              onChange={(e) => handleRoleChange(m.id, e.target.value as Role)}
                              className="px-3 py-1.5 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                            >
                              <option value="ADMIN">Admin</option>
                              <option value="MEMBER">Member</option>
                            </select>
                            <span className={`px-2 py-1 text-xs font-medium rounded-full ${ROLE_COLORS[m.role]}`}>
                              {m.role}
                            </span>
                          </div>
                        </td>
                        <td className="px-6 py-4 text-sm text-gray-500">{m.joinedAt}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </section>
          </div>
        )}

        {activeTab === 'events' && (
          <div className="space-y-8">
            <section className="bg-white shadow rounded-lg p-6">
              <h2 className="text-lg font-semibold text-gray-900 mb-4">Add New Event</h2>
              <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
                <input
                  type="text"
                  value={newEventTitle}
                  onChange={(e) => setNewEventTitle(e.target.value)}
                  placeholder="Event title"
                  className="px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
                <input
                  type="date"
                  value={newEventDate}
                  onChange={(e) => setNewEventDate(e.target.value)}
                  className="px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
                <input
                  type="text"
                  value={newEventLocation}
                  onChange={(e) => setNewEventLocation(e.target.value)}
                  placeholder="Location"
                  className="px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
                <div className="flex gap-2">
                  <select
                    value={newEventStatus}
                    onChange={(e) => setNewEventStatus(e.target.value as EventStatus)}
                    className="flex-1 px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="Upcoming">Upcoming</option>
                    <option value="Registration Started">Registration Started</option>
                    <option value="Event Ended">Event Ended</option>
                  </select>
                  <button
                    onClick={handleAddEvent}
                    className="px-4 py-2 bg-blue-600 text-white text-sm font-medium rounded-md hover:bg-blue-700"
                  >
                    Add
                  </button>
                </div>
              </div>
            </section>

            <section>
              <h2 className="text-lg font-semibold text-gray-900 mb-4">All Events</h2>
              <div className="bg-white shadow rounded-lg overflow-hidden">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      {['Event', 'Date', 'Location', 'Status'].map((h) => (
                        <th
                          key={h}
                          className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                        >
                          {h}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-200">
                    {events.map((event) => (
                      <tr key={event.id} className="hover:bg-gray-50">
                        <td className="px-6 py-4 text-sm font-medium text-gray-900">{event.title}</td>
                        <td className="px-6 py-4 text-sm text-gray-500">{event.date}</td>
                        <td className="px-6 py-4 text-sm text-gray-500">{event.location}</td>
                        <td className="px-6 py-4">
                          <div className="flex items-center gap-2">
                            <select
                              value={event.status}
                              onChange={(e) => handleEventStatusChange(event.id, e.target.value as EventStatus)}
                              className="px-3 py-1.5 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                            >
                              <option value="Upcoming">Upcoming</option>
                              <option value="Registration Started">Registration Started</option>
                              <option value="Event Ended">Event Ended</option>
                            </select>
                            <span className={`px-2 py-1 text-xs font-medium rounded-full ${EVENT_STATUS_COLORS[event.status]}`}>
                              {event.status}
                            </span>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </section>
          </div>
        )}

        {activeTab === 'referrals' && (
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
                        {c.currentUses >= c.maxUses ? (
                          <span className="px-3 py-1.5 text-xs font-medium text-gray-400 bg-gray-50 rounded cursor-not-allowed">Exhausted</span>
                        ) : (
                          <button onClick={() => toggleCode(c.id)} className={`px-3 py-1.5 text-xs font-medium rounded ${c.active ? 'bg-gray-100 text-gray-700 hover:bg-gray-200' : 'bg-green-100 text-green-700 hover:bg-green-200'}`}>
                            {c.active ? 'Disable' : 'Enable'}
                          </button>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>

      {showModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-2xl w-full max-w-md">
            <div className="flex justify-between items-center px-6 py-4 border-b">
              <h3 className="text-lg font-semibold text-gray-900">Generate Referral Code</h3>
              <button onClick={handleCloseModal} className="text-gray-400 hover:text-gray-600 text-2xl leading-none">&times;</button>
            </div>

            <div className="px-6 py-5 space-y-5">
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

              <button
                onClick={handleGenerate}
                className="w-full py-2.5 bg-blue-600 text-white text-sm font-medium rounded-md hover:bg-blue-700 transition-colors"
              >
                {generatedCode ? 'Regenerate' : 'Generate Code'}
              </button>

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
                      {copied ? 'Copied!' : 'Copy'}
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
