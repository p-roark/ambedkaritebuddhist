'use client';

import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import Link from 'next/link';

type Role = 'ADMIN' | 'MEMBER';
type EventStatus = 'Upcoming' | 'Registration Started' | 'Event Ended';
type Tab = 'leadership' | 'members' | 'events' | 'cover-images' | 'referrals' | 'messages' | 'settings';

type OrgSettings = {
  orgName: string;
  shortName: string;
  email: string;
  phone: string;
  altPhone: string;
  addressLine1: string;
  addressLine2: string;
  city: string;
  province: string;
  postalCode: string;
  country: string;
  website: string;
  description: string;
};

type LeadershipRole = {
  id: string;
  roleName: string;
  displayOrder: number;
  userId: string | null;
  userName: string | null;
  userEmail: string | null;
};

type Member = {
  id: string;
  name: string;
  email: string;
  role: string;
  status: string;
  joinedAt: string;
};

type EventItem = {
  id: string;
  title: string;
  description: string;
  coverImage: string;
  date: string;
  time: string;
  location: string;
  eventType: string;
  isPaid: boolean;
  adultPrice: number;
  childPrice: number;
  paymentInstructions: string | null;
  archived: boolean;
  status: EventStatus;
  coordinators: Array<{ id: string; name: string }>;
};

type ReferralCode = {
  id: string;
  code: string;
  maxUses: number;
  currentUses: number;
  active: boolean;
  createdAt: string;
};

type ContactMessage = {
  id: string;
  name: string;
  email: string;
  phone: string | null;
  subject: string;
  message: string;
  status: 'PENDING' | 'RESOLVED';
  type: 'CONTACT' | 'ACTIVATION_REQUEST';
  userId: string | null;
  adminNote: string | null;
  createdAt: string;
  updatedAt: string;
};

type CoverImage = {
  key: string;
  name: string;
  url: string;
};

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

  const [activeTab, setActiveTab] = useState<Tab>('leadership');
  const [loading, setLoading] = useState(true);
  const [leadershipRolesList, setLeadershipRolesList] = useState<LeadershipRole[]>([]);
  const [newRoleName, setNewRoleName] = useState('');
  const [members, setMembers] = useState<Member[]>([]);
  const [events, setEvents] = useState<EventItem[]>([]);
  const [referralCodes, setReferralCodes] = useState<ReferralCode[]>([]);
  const [messages, setMessages] = useState<ContactMessage[]>([]);
  const [selectedMessage, setSelectedMessage] = useState<ContactMessage | null>(null);
  const [messageNoteDraft, setMessageNoteDraft] = useState('');
  const [coverImages, setCoverImages] = useState<CoverImage[]>([]);
  const [coverImageUploading, setCoverImageUploading] = useState(false);
  const [coverImageUploadName, setCoverImageUploadName] = useState('');
  const [coverImageUploadFile, setCoverImageUploadFile] = useState<File | null>(null);
  const [coverImageUploadError, setCoverImageUploadError] = useState('');
  const [coverImageInputKey, setCoverImageInputKey] = useState(0);
  const [coverImageRenameKey, setCoverImageRenameKey] = useState<string | null>(null);
  const [coverImageRenameDraft, setCoverImageRenameDraft] = useState('');
  const [coverImageDeleteConfirmKey, setCoverImageDeleteConfirmKey] = useState<string | null>(null);

  const [newEventTitle, setNewEventTitle] = useState('');
  const [newEventDescription, setNewEventDescription] = useState('');
  const [newEventCoverImage, setNewEventCoverImage] = useState('');
  const [newEventDate, setNewEventDate] = useState('');
  const [newEventTime, setNewEventTime] = useState('18:00');
  const [newEventLocation, setNewEventLocation] = useState('');
  const [newEventType, setNewEventType] = useState('');
  const [newEventIsPaid, setNewEventIsPaid] = useState(false);
  const [newEventAdultPrice, setNewEventAdultPrice] = useState(0);
  const [newEventChildPrice, setNewEventChildPrice] = useState(0);
  const [newEventMaxAttendees, setNewEventMaxAttendees] = useState('');
  const [newEventExternalLink, setNewEventExternalLink] = useState('');
  const [newEventPaymentInstructions, setNewEventPaymentInstructions] = useState('');
  const [newEventStatus, setNewEventStatus] = useState<EventStatus>('Upcoming');
  const [newEventShowVolunteering, setNewEventShowVolunteering] = useState(true);
  const [newEventShowCulturalVolunteering, setNewEventShowCulturalVolunteering] = useState(false);
  const [newEventShowNeedsRide, setNewEventShowNeedsRide] = useState(false);
  const [newEventShowPhotoConsent, setNewEventShowPhotoConsent] = useState(true);
  const [newEventShowDonation, setNewEventShowDonation] = useState(false);
  const [newEventShowNotes, setNewEventShowNotes] = useState(false);
  const [newEventMessage, setNewEventMessage] = useState('');

  const [confirmDeactivateMemberId, setConfirmDeactivateMemberId] = useState<string | null>(null);
  const [showModal, setShowModal] = useState(false);
  const [maxUses, setMaxUses] = useState(10);
  const [generatedCode, setGeneratedCode] = useState('');
  const [copied, setCopied] = useState(false);

  const emptyOrgSettings: OrgSettings = { orgName: '', shortName: '', email: '', phone: '', altPhone: '', addressLine1: '', addressLine2: '', city: '', province: '', postalCode: '', country: 'Canada', website: '', description: '' };
  const [orgSettingsForm, setOrgSettingsForm] = useState<OrgSettings>(emptyOrgSettings);
  const [orgSettingsSaving, setOrgSettingsSaving] = useState(false);
  const [orgSettingsMessage, setOrgSettingsMessage] = useState('');

  useEffect(() => {
    if (status === 'unauthenticated') router.push('/auth/login');
  }, [status, router]);

  const loadOrgSettings = async () => {
    const res = await fetch('/api/events?resource=org-settings', { cache: 'no-store' });
    if (!res.ok) return;
    const data = (await res.json()) as { settings: Record<string, string | null> };
    const s = data.settings;
    setOrgSettingsForm({
      orgName: s.orgName ?? '',
      shortName: s.shortName ?? '',
      email: s.email ?? '',
      phone: s.phone ?? '',
      altPhone: s.altPhone ?? '',
      addressLine1: s.addressLine1 ?? '',
      addressLine2: s.addressLine2 ?? '',
      city: s.city ?? '',
      province: s.province ?? '',
      postalCode: s.postalCode ?? '',
      country: s.country ?? 'Canada',
      website: s.website ?? '',
      description: s.description ?? '',
    });
  };

  const loadLeadership = async () => {
    const res = await fetch('/api/admin/members?resource=leadership', { cache: 'no-store' });
    if (!res.ok) throw new Error('Failed to load leadership');
    const data = (await res.json()) as { roles: LeadershipRole[] };
    setLeadershipRolesList(data.roles);
  };

  const loadMembers = async () => {
    const res = await fetch('/api/admin/members', { cache: 'no-store' });
    if (!res.ok) throw new Error('Failed to load members');
    const data = (await res.json()) as { members: Member[] };
    setMembers(data.members);
  };

  const loadEvents = async () => {
    const res = await fetch('/api/admin/events', { cache: 'no-store' });
    if (!res.ok) throw new Error('Failed to load events');
    const data = (await res.json()) as { events: EventItem[] };
    setEvents(data.events);
  };

  const loadReferralCodes = async () => {
    const res = await fetch('/api/admin/referral-codes', { cache: 'no-store' });
    if (!res.ok) throw new Error('Failed to load referral codes');
    const data = (await res.json()) as { referralCodes: ReferralCode[] };
    setReferralCodes(data.referralCodes);
  };

  const loadMessages = async () => {
    const res = await fetch('/api/admin/messages', { cache: 'no-store' });
    if (!res.ok) throw new Error('Failed to load messages');
    const data = (await res.json()) as { messages: ContactMessage[] };
    setMessages(data.messages);
  };

  const loadCoverImages = async () => {
    const res = await fetch('/api/admin/cover-images', { cache: 'no-store' });
    if (!res.ok) return;
    const data = (await res.json()) as { images: CoverImage[] };
    setCoverImages(data.images);
    if (data.images.length > 0 && !newEventCoverImage) {
      setNewEventCoverImage(data.images[0].key);
    }
  };

  useEffect(() => {
    if (status !== 'authenticated') return;
    const isAdmin = session?.user?.role === 'ADMIN';
    let alive = true;
    const loadAll = async () => {
      try {
        if (isAdmin) {
          await Promise.all([loadOrgSettings(), loadLeadership(), loadMembers(), loadEvents(), loadCoverImages(), loadReferralCodes(), loadMessages()]);
        } else {
          // Non-admin: try loading events — API returns 403 if not a coordinator
          const res = await fetch('/api/admin/events', { cache: 'no-store' });
          if (!res.ok) {
            if (alive) router.push('/');
            return;
          }
          const data = (await res.json()) as { events: EventItem[] };
          if (alive) {
            setEvents(data.events);
            setActiveTab('events');
          }
        }
      } catch (error) {
        console.error(error);
      } finally {
        if (alive) setLoading(false);
      }
    };
    void loadAll();
    return () => {
      alive = false;
    };
  }, [status, session?.user?.role]);

  if (status === 'loading' || loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }
  if (!session) return null;
  const isAdmin = session.user.role === 'ADMIN';

  const activeMembers = members.filter((m) => m.status === 'active');
  const inactiveMembers = members.filter((m) => m.status !== 'active');
  const activationRequests = messages.filter((m) => m.type === 'ACTIVATION_REQUEST' && m.status === 'PENDING');
  const pendingMessages = messages.filter((m) => m.type !== 'ACTIVATION_REQUEST' && m.status === 'PENDING');
  const resolvedMessages = messages.filter((m) => m.type !== 'ACTIVATION_REQUEST' && m.status === 'RESOLVED');

  const tabs: Array<{ id: Tab; label: string }> = isAdmin
    ? [
        { id: 'leadership', label: `Leadership (${leadershipRolesList.length})` },
        { id: 'members', label: `Members (${activeMembers.length} active${inactiveMembers.length > 0 ? `, ${inactiveMembers.length} inactive` : ''})` },
        { id: 'events', label: `Events (${events.length})` },
        { id: 'cover-images', label: `Cover Images (${coverImages.length})` },
        { id: 'referrals', label: 'Referral Codes' },
        { id: 'messages', label: `Messages (${pendingMessages.length + activationRequests.length} pending)` },
        { id: 'settings', label: 'Settings' },
      ]
    : [{ id: 'events', label: `My Events (${events.length})` }];

  const handleRoleChange = async (memberId: string, role: Role) => {
    const res = await fetch('/api/admin/members', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ action: 'setRole', userId: memberId, role }),
    });
    if (!res.ok) return;
    await loadMembers();
  };

  const handleDeactivateMember = async (memberId: string) => {
    const res = await fetch('/api/admin/members', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ action: 'deactivateMember', userId: memberId }),
    });
    if (!res.ok) return;
    await loadMembers();
  };

  const handleActivateMember = async (memberId: string) => {
    const res = await fetch('/api/admin/members', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ action: 'activateMember', userId: memberId }),
    });
    if (!res.ok) return;
    await loadMembers();
  };

  const handleAddRole = async () => {
    if (!newRoleName.trim()) return;
    await fetch('/api/admin/members', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ action: 'leadershipCreate', roleName: newRoleName.trim() }),
    });
    setNewRoleName('');
    await loadLeadership();
  };

  const handleUpdateRole = async (id: string, patch: { roleName?: string; userId?: string | null }) => {
    await fetch('/api/admin/members', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ action: 'leadershipUpdate', id, ...patch }),
    });
    await loadLeadership();
  };

  const handleDeleteRole = async (id: string) => {
    await fetch('/api/admin/members', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ action: 'leadershipDelete', id }),
    });
    await loadLeadership();
  };

  const handleMoveRole = async (id: string, direction: 'up' | 'down') => {
    const idx = leadershipRolesList.findIndex((r) => r.id === id);
    if (idx === -1) return;
    const swapIdx = direction === 'up' ? idx - 1 : idx + 1;
    if (swapIdx < 0 || swapIdx >= leadershipRolesList.length) return;
    const a = leadershipRolesList[idx];
    const b = leadershipRolesList[swapIdx];
    await Promise.all([
      fetch('/api/admin/members', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'leadershipUpdate', id: a.id, displayOrder: b.displayOrder }),
      }),
      fetch('/api/admin/members', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'leadershipUpdate', id: b.id, displayOrder: a.displayOrder }),
      }),
    ]);
    await loadLeadership();
  };

  const handleAddEvent = async () => {
    setNewEventMessage('');
    if (!newEventTitle.trim() || !newEventDate || !newEventLocation.trim()) {
      setNewEventMessage('Title, date, and location are required.');
      return;
    }
    const res = await fetch('/api/admin/events', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        title: newEventTitle.trim(),
        description: newEventDescription.trim(),
        coverImage: newEventCoverImage.trim(),
        date: newEventDate,
        time: newEventTime,
        location: newEventLocation.trim(),
        eventType: newEventType.trim(),
        isPaid: newEventIsPaid,
        adultPrice: newEventIsPaid ? newEventAdultPrice : 0,
        childPrice: newEventIsPaid ? newEventChildPrice : 0,
        maxAttendees: newEventMaxAttendees !== '' ? Number(newEventMaxAttendees) : null,
        externalLink: newEventExternalLink.trim() || null,
        paymentInstructions: newEventIsPaid ? newEventPaymentInstructions.trim() || null : null,
        status: newEventStatus,
        showVolunteering: newEventShowVolunteering,
        showCulturalVolunteering: newEventShowCulturalVolunteering,
        showNeedsRide: newEventShowNeedsRide,
        showPhotoConsent: newEventShowPhotoConsent,
        showDonation: newEventShowDonation,
        showNotes: newEventShowNotes,
      }),
    });
    const data = (await res.json()) as { error?: string };
    if (!res.ok) {
      setNewEventMessage(data.error ?? 'Failed to add event');
      return;
    }

    setNewEventTitle('');
    setNewEventDescription('');
    setNewEventCoverImage(coverImages[0]?.key ?? '');
    setNewEventDate('');
    setNewEventTime('18:00');
    setNewEventLocation('');
    setNewEventType('');
    setNewEventIsPaid(false);
    setNewEventAdultPrice(0);
    setNewEventChildPrice(0);
    setNewEventMaxAttendees('');
    setNewEventExternalLink('');
    setNewEventStatus('Upcoming');
    setNewEventMessage('Event added successfully.');
    await loadEvents();
  };

  const handleEventStatusChange = async (eventId: string, status: EventStatus) => {
    const res = await fetch('/api/admin/events', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id: eventId, status }),
    });
    if (!res.ok) return;
    await loadEvents();
  };

  const handleArchiveToggle = async (eventId: string, archived: boolean) => {
    const res = await fetch('/api/admin/events', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id: eventId, archived }),
    });
    if (!res.ok) return;
    await loadEvents();
  };

  const handleGenerate = () => {
    setGeneratedCode(generateCode());
  };

  const handleSave = async () => {
    if (!generatedCode) return;
    const res = await fetch('/api/admin/referral-codes', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ code: generatedCode, maxUses }),
    });
    if (!res.ok) return;
    setShowModal(false);
    setGeneratedCode('');
    setMaxUses(10);
    await loadReferralCodes();
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

  const toggleCode = async (id: string, nextActive: boolean) => {
    const res = await fetch('/api/admin/referral-codes', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id, active: nextActive }),
    });
    if (!res.ok) return;
    await loadReferralCodes();
  };

  const handleSaveOrgSettings = async () => {
    setOrgSettingsSaving(true);
    setOrgSettingsMessage('');
    const res = await fetch('/api/admin/members', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ action: 'updateOrgSettings', ...orgSettingsForm }),
    });
    setOrgSettingsSaving(false);
    setOrgSettingsMessage(res.ok ? 'Settings saved.' : 'Failed to save settings.');
    if (res.ok) await loadOrgSettings();
  };

  const updateMessage = async (id: string, patch: { status?: 'PENDING' | 'RESOLVED'; adminNote?: string }) => {
    const res = await fetch('/api/admin/messages', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id, ...patch }),
    });
    if (!res.ok) return;
    await loadMessages();
    if (selectedMessage?.id === id) {
      const updated = messages.find((m) => m.id === id);
      if (updated) {
        setSelectedMessage({
          ...updated,
          ...patch,
          adminNote: typeof patch.adminNote === 'undefined' ? updated.adminNote : patch.adminNote || null,
        });
      }
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="bg-white shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <h1 className="text-xl font-bold text-gray-900">Community Dashboard</h1>
          <p className="text-sm text-gray-500">
            {session.user.name} ·{' '}
            <span className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium ${isAdmin ? ROLE_COLORS.ADMIN : 'bg-blue-100 text-blue-800'}`}>
              {isAdmin ? 'ADMIN' : 'COORDINATOR'}
            </span>
          </p>
        </div>
      </div>

      <div className="bg-white border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 overflow-x-auto scrollbar-none">
          <nav className="flex space-x-6 min-w-max">
            {tabs.map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`py-4 px-1 border-b-2 text-sm font-medium whitespace-nowrap transition-colors ${
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
        {activeTab === 'leadership' && (
          <div className="space-y-6">
            {/* Add new role */}
            <section className="bg-white shadow rounded-lg p-6">
              <h2 className="text-lg font-semibold text-gray-900 mb-4">Add Leadership Role</h2>
              <div className="flex gap-3">
                <input
                  type="text"
                  value={newRoleName}
                  onChange={(e) => setNewRoleName(e.target.value)}
                  onKeyDown={(e) => { if (e.key === 'Enter') void handleAddRole(); }}
                  placeholder="e.g. President, Secretary, Treasurer…"
                  className="flex-1 px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
                <button
                  onClick={handleAddRole}
                  disabled={!newRoleName.trim()}
                  className="px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-md hover:bg-blue-700 disabled:opacity-40"
                >
                  Add Role
                </button>
              </div>
            </section>

            {/* Role list */}
            <section>
              <h2 className="text-lg font-semibold text-gray-900 mb-4">Leadership Roles</h2>
              {leadershipRolesList.length === 0 ? (
                <p className="text-sm text-gray-500">No roles yet. Add one above.</p>
              ) : (
                <div className="bg-white shadow rounded-lg divide-y divide-gray-200">
                  {leadershipRolesList.map((role, idx) => (
                    <div key={role.id} className="px-6 py-4 flex flex-col sm:flex-row sm:items-center gap-3">
                      {/* Role name */}
                      <input
                        value={role.roleName}
                        onChange={(e) =>
                          setLeadershipRolesList((prev) =>
                            prev.map((r) => r.id === role.id ? { ...r, roleName: e.target.value } : r)
                          )
                        }
                        onBlur={(e) => {
                          if (e.target.value.trim() && e.target.value.trim() !== role.roleName)
                            void handleUpdateRole(role.id, { roleName: e.target.value.trim() });
                        }}
                        className="flex-1 px-3 py-1.5 border border-gray-300 rounded-md text-sm font-medium focus:outline-none focus:ring-2 focus:ring-blue-500"
                      />

                      {/* Member assignment */}
                      <select
                        value={role.userId ?? ''}
                        onChange={(e) => void handleUpdateRole(role.id, { userId: e.target.value || null })}
                        className="flex-1 px-3 py-1.5 border border-gray-300 rounded-md text-sm bg-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                      >
                        <option value="">— Unassigned —</option>
                        {activeMembers.map((m) => (
                          <option key={m.id} value={m.id}>{m.name} ({m.email})</option>
                        ))}
                      </select>

                      {/* Reorder + delete */}
                      <div className="flex items-center gap-1 shrink-0">
                        <button
                          onClick={() => void handleMoveRole(role.id, 'up')}
                          disabled={idx === 0}
                          title="Move up"
                          className="p-1.5 rounded text-gray-400 hover:text-gray-700 hover:bg-gray-100 disabled:opacity-30"
                        >
                          ▲
                        </button>
                        <button
                          onClick={() => void handleMoveRole(role.id, 'down')}
                          disabled={idx === leadershipRolesList.length - 1}
                          title="Move down"
                          className="p-1.5 rounded text-gray-400 hover:text-gray-700 hover:bg-gray-100 disabled:opacity-30"
                        >
                          ▼
                        </button>
                        <button
                          onClick={() => void handleDeleteRole(role.id)}
                          title="Remove role"
                          className="p-1.5 rounded text-red-400 hover:text-red-700 hover:bg-red-50"
                        >
                          ✕
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </section>
          </div>
        )}

        {activeTab === 'members' && (
          <div className="space-y-8">
            {/* Active Members */}
            <section>
              <h2 className="text-lg font-semibold text-gray-900 mb-4">Active Members ({activeMembers.length})</h2>
              <div className="bg-white shadow rounded-lg overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      {['Member', 'Email', 'Role', 'Joined', 'Actions'].map((h) => (
                        <th key={h} className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-200">
                    {activeMembers.map((m) => {
                      const isSelf = m.email.toLowerCase() === String(session.user.email ?? '').toLowerCase();
                      const normalizedRole: Role = m.role === 'ADMIN' ? 'ADMIN' : 'MEMBER';
                      return (
                        <tr key={m.id} className="hover:bg-gray-50">
                          <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">{m.name}</td>
                          <td className="px-6 py-4 text-sm text-gray-500">{m.email}</td>
                          <td className="px-6 py-4">
                            <div className="flex items-center gap-2">
                              <select
                                value={normalizedRole}
                                onChange={(e) => handleRoleChange(m.id, e.target.value as Role)}
                                disabled={isSelf}
                                className={`px-3 py-1.5 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 ${isSelf ? 'bg-gray-100 text-gray-400 cursor-not-allowed' : ''}`}
                              >
                                <option value="ADMIN">Admin</option>
                                <option value="MEMBER">Member</option>
                              </select>
                              <span className={`px-2 py-1 text-xs font-medium rounded-full ${ROLE_COLORS[normalizedRole]}`}>
                                {normalizedRole}
                              </span>
                            </div>
                          </td>
                          <td className="px-6 py-4 text-sm text-gray-500">{m.joinedAt}</td>
                          <td className="px-6 py-4">
                            <button
                              onClick={() => setConfirmDeactivateMemberId(m.id)}
                              disabled={isSelf}
                              className={`px-3 py-1.5 text-xs font-medium rounded ${
                                isSelf
                                  ? 'bg-gray-100 text-gray-400 cursor-not-allowed'
                                  : 'bg-amber-100 text-amber-700 hover:bg-amber-200'
                              }`}
                            >
                              Deactivate
                            </button>
                          </td>
                        </tr>
                      );
                    })}
                    {activeMembers.length === 0 && (
                      <tr>
                        <td colSpan={5} className="px-6 py-10 text-center text-sm text-gray-500">No active members.</td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </section>

            {/* Inactive Members */}
            <section>
              <h2 className="text-lg font-semibold text-gray-900 mb-4">Inactive Members ({inactiveMembers.length})</h2>
              <div className="bg-white shadow rounded-lg overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      {['Member', 'Email', 'Status', 'Joined', 'Actions'].map((h) => (
                        <th key={h} className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-200">
                    {inactiveMembers.map((m) => (
                      <tr key={m.id} className="hover:bg-gray-50">
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">{m.name}</td>
                        <td className="px-6 py-4 text-sm text-gray-500">{m.email}</td>
                        <td className="px-6 py-4">
                          <span className={`px-2 py-1 text-xs font-medium rounded-full ${
                            m.status === 'blocked'
                              ? 'bg-red-100 text-red-800'
                              : 'bg-gray-100 text-gray-700'
                          }`}>
                            {m.status === 'blocked' ? 'Blocked' : 'Inactive'}
                          </span>
                        </td>
                        <td className="px-6 py-4 text-sm text-gray-500">{m.joinedAt}</td>
                        <td className="px-6 py-4">
                          <button
                            onClick={() => handleActivateMember(m.id)}
                            className="px-3 py-1.5 text-xs font-medium rounded bg-green-100 text-green-700 hover:bg-green-200"
                          >
                            Activate
                          </button>
                        </td>
                      </tr>
                    ))}
                    {inactiveMembers.length === 0 && (
                      <tr>
                        <td colSpan={5} className="px-6 py-10 text-center text-sm text-gray-500">No inactive members.</td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </section>
          </div>
        )}

        {activeTab === 'events' && (
          <div className="space-y-8">
            {isAdmin && (
            <section className="bg-white shadow rounded-lg p-6">
              <h2 className="text-lg font-semibold text-gray-900 mb-4">Add New Event</h2>
              {newEventMessage && (
                <p className="mb-3 text-sm text-blue-700">{newEventMessage}</p>
              )}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                <label className="text-sm text-gray-700">
                  <span className="mb-1 block font-medium">Event title</span>
                  <input
                    type="text"
                    value={newEventTitle}
                    onChange={(e) => setNewEventTitle(e.target.value)}
                    placeholder="Event title"
                    className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </label>
                <label className="text-sm text-gray-700">
                  <span className="mb-1 block font-medium">Date</span>
                  <input
                    type="date"
                    value={newEventDate}
                    onChange={(e) => setNewEventDate(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </label>
                <label className="text-sm text-gray-700">
                  <span className="mb-1 block font-medium">Time</span>
                  <input
                    type="time"
                    value={newEventTime}
                    onChange={(e) => setNewEventTime(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </label>
                <label className="text-sm text-gray-700">
                  <span className="mb-1 block font-medium">Location</span>
                  <input
                    type="text"
                    value={newEventLocation}
                    onChange={(e) => setNewEventLocation(e.target.value)}
                    placeholder="Location"
                    className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </label>
                <label className="text-sm text-gray-700">
                  <span className="mb-1 block font-medium">Event type</span>
                  <input
                    type="text"
                    value={newEventType}
                    onChange={(e) => setNewEventType(e.target.value)}
                    placeholder="Event type"
                    className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </label>
                <label className="text-sm text-gray-700">
                  <span className="mb-1 block font-medium">Cover image</span>
                  <select
                    value={newEventCoverImage}
                    onChange={(e) => setNewEventCoverImage(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    {coverImages.length === 0 ? (
                      <option value="">No cover images — add some in the Cover Images tab</option>
                    ) : (
                      coverImages.map((img) => (
                        <option key={img.key} value={img.key}>
                          {img.name}
                        </option>
                      ))
                    )}
                  </select>
                </label>
                <label className="md:col-span-3 text-sm text-gray-700">
                  <span className="mb-1 block font-medium">Description</span>
                  <textarea
                    rows={3}
                    value={newEventDescription}
                    onChange={(e) => setNewEventDescription(e.target.value)}
                    placeholder="Short event description for landing page card"
                    className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </label>
                <label className="flex items-center gap-2 px-3 py-2 border border-gray-300 rounded-md text-sm">
                  <input
                    type="checkbox"
                    checked={newEventIsPaid}
                    onChange={(e) => setNewEventIsPaid(e.target.checked)}
                  />
                  Paid Event
                </label>
                <label className="text-sm text-gray-700">
                  <span className="mb-1 block font-medium">Adult price</span>
                  <input
                    type="number"
                    min={0}
                    value={newEventAdultPrice}
                    onChange={(e) => setNewEventAdultPrice(Number(e.target.value))}
                    placeholder="Adult price"
                    disabled={!newEventIsPaid}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:bg-gray-100"
                  />
                </label>
                <label className="text-sm text-gray-700">
                  <span className="mb-1 block font-medium">Child price</span>
                  <input
                    type="number"
                    min={0}
                    value={newEventChildPrice}
                    onChange={(e) => setNewEventChildPrice(Number(e.target.value))}
                    placeholder="Child price"
                    disabled={!newEventIsPaid}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:bg-gray-100"
                  />
                </label>
                <label className="text-sm text-gray-700">
                  <span className="mb-1 block font-medium">Max attendees</span>
                  <input
                    type="number"
                    min={1}
                    value={newEventMaxAttendees}
                    onChange={(e) => setNewEventMaxAttendees(e.target.value)}
                    placeholder="No limit"
                    className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </label>
                <label className="text-sm text-gray-700">
                  <span className="mb-1 block font-medium">External event link</span>
                  <input
                    type="url"
                    value={newEventExternalLink}
                    onChange={(e) => setNewEventExternalLink(e.target.value)}
                    placeholder="https://... (optional)"
                    className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </label>
                <label className="text-sm text-gray-700 md:col-span-3">
                  <span className="mb-1 block font-medium">Payment instructions</span>
                  <textarea
                    rows={2}
                    value={newEventPaymentInstructions}
                    onChange={(e) => setNewEventPaymentInstructions(e.target.value)}
                    disabled={!newEventIsPaid}
                    placeholder="e.g. E-transfer to payments@abccanada.org with event name in the memo"
                    className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:bg-gray-100"
                  />
                </label>
                <div className="md:col-span-3">
                  <p className="mb-2 text-sm font-medium text-gray-700">Registration form fields</p>
                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                    {[
                      { label: 'Volunteering', value: newEventShowVolunteering, set: setNewEventShowVolunteering },
                      { label: 'Cultural Volunteering', value: newEventShowCulturalVolunteering, set: setNewEventShowCulturalVolunteering },
                      { label: 'Needs Ride Pickup', value: newEventShowNeedsRide, set: setNewEventShowNeedsRide },
                      { label: 'Photo Consent', value: newEventShowPhotoConsent, set: setNewEventShowPhotoConsent },
                      { label: 'Donation', value: newEventShowDonation, set: setNewEventShowDonation },
                      { label: 'Notes', value: newEventShowNotes, set: setNewEventShowNotes },
                    ].map(({ label, value, set }) => (
                      <label key={label} className="flex items-center gap-2 text-sm text-gray-700 cursor-pointer select-none">
                        <input type="checkbox" checked={value} onChange={(e) => set(e.target.checked)} className="w-4 h-4 rounded border-gray-300 text-blue-600" />
                        <span>{label}</span>
                      </label>
                    ))}
                  </div>
                </div>
                <div className="flex gap-2">
                  <label className="flex-1 text-sm text-gray-700">
                    <span className="mb-1 block font-medium">Event status</span>
                    <select
                      value={newEventStatus}
                      onChange={(e) => setNewEventStatus(e.target.value as EventStatus)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                    >
                      <option value="Upcoming">Upcoming</option>
                      <option value="Registration Started">Registration Started</option>
                      <option value="Event Ended">Event Ended</option>
                    </select>
                  </label>
                  <button
                    onClick={handleAddEvent}
                    className="self-end px-4 py-2 bg-blue-600 text-white text-sm font-medium rounded-md hover:bg-blue-700"
                  >
                    Add
                  </button>
                </div>
              </div>
            </section>
            )}

            {isAdmin ? (
            <section>
              <h2 className="text-lg font-semibold text-gray-900 mb-4">All Events</h2>
              <div className="bg-white shadow rounded-lg overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      {['Event', 'Date', 'Venue', 'Type', 'Pricing', 'Coordinator', 'Status', 'Details', 'Actions'].map((h) => (
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
                        <td className="px-6 py-4 text-sm text-gray-500">{event.date} {event.time}</td>
                        <td className="px-6 py-4 text-sm text-gray-500">{event.location}</td>
                        <td className="px-6 py-4 text-sm text-gray-500">{event.eventType}</td>
                        <td className="px-6 py-4 text-sm text-gray-500">
                          {event.isPaid ? `Paid ($${event.adultPrice} adult / $${event.childPrice} child)` : 'Free'}
                        </td>
                        <td className="px-6 py-4 text-sm text-gray-500">
                          {event.coordinators.length > 0
                            ? event.coordinators.map((c) => c.name).join(', ')
                            : <span className="text-gray-300">—</span>}
                        </td>
                        <td className="px-6 py-4">
                          <div className="flex items-center gap-2">
                            <select
                              value={event.status}
                              onChange={(e) => handleEventStatusChange(event.id, e.target.value as EventStatus)}
                              disabled={event.archived}
                              className="px-3 py-1.5 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                            >
                              <option value="Upcoming">Upcoming</option>
                              <option value="Registration Started">Registration Started</option>
                              <option value="Event Ended">Event Ended</option>
                            </select>
                            <span className={`px-2 py-1 text-xs font-medium rounded-full ${EVENT_STATUS_COLORS[event.status]}`}>
                              {event.status}
                            </span>
                            {event.archived && (
                              <span className="px-2 py-1 text-xs font-medium rounded-full bg-slate-200 text-slate-700">
                                Archived
                              </span>
                            )}
                          </div>
                        </td>
                        <td className="px-6 py-4">
                          <Link href={`/dashboard/events/${event.id}`} className="px-3 py-1.5 text-xs font-medium rounded bg-blue-100 text-blue-700 hover:bg-blue-200">
                            Open
                          </Link>
                        </td>
                        <td className="px-6 py-4">
                          <button
                            onClick={() => handleArchiveToggle(event.id, !event.archived)}
                            className={`px-3 py-1.5 text-xs font-medium rounded ${
                              event.archived
                                ? 'bg-emerald-100 text-emerald-700 hover:bg-emerald-200'
                                : 'bg-amber-100 text-amber-700 hover:bg-amber-200'
                            }`}
                          >
                            {event.archived ? 'Unarchive' : 'Archive'}
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </section>
            ) : (
            /* Coordinator view — simplified events list */
            <section>
              <h2 className="text-lg font-semibold text-gray-900 mb-4">My Events</h2>
              <div className="bg-white shadow rounded-lg overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      {['Event', 'Date', 'Location', 'Status', 'Actions'].map((h) => (
                        <th key={h} className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-200">
                    {events.map((event) => (
                      <tr key={event.id} className="hover:bg-gray-50">
                        <td className="px-6 py-4 text-sm font-medium text-gray-900">{event.title}</td>
                        <td className="px-6 py-4 text-sm text-gray-500">{event.date} {event.time}</td>
                        <td className="px-6 py-4 text-sm text-gray-500">{event.location}</td>
                        <td className="px-6 py-4">
                          <span className={`px-2 py-1 text-xs font-medium rounded-full ${EVENT_STATUS_COLORS[event.status]}`}>
                            {event.status}
                          </span>
                        </td>
                        <td className="px-6 py-4">
                          <Link href={`/dashboard/events/${event.id}`} className="px-3 py-1.5 text-xs font-medium rounded bg-blue-100 text-blue-700 hover:bg-blue-200">
                            Open
                          </Link>
                        </td>
                      </tr>
                    ))}
                    {events.length === 0 && (
                      <tr>
                        <td colSpan={5} className="px-6 py-10 text-center text-sm text-gray-500">No events assigned.</td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </section>
            )}
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
            <div className="bg-white shadow rounded-lg overflow-x-auto">
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
                          <button onClick={() => toggleCode(c.id, !c.active)} className={`px-3 py-1.5 text-xs font-medium rounded ${c.active ? 'bg-gray-100 text-gray-700 hover:bg-gray-200' : 'bg-green-100 text-green-700 hover:bg-green-200'}`}>
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

        {activeTab === 'cover-images' && (
          <div className="space-y-6">
            <h2 className="text-lg font-semibold text-gray-900">Cover Images</h2>

            {/* Upload section */}
            <div className="bg-gray-50 border-2 border-dashed border-gray-300 rounded-lg p-5">
              <p className="font-medium text-gray-800 mb-3">Upload New Cover Image</p>
              <div className="flex flex-col sm:flex-row gap-3 items-start sm:items-end">
                <label className="flex-1 text-sm text-gray-700">
                  <span className="mb-1 block font-medium">Name</span>
                  <input
                    type="text"
                    value={coverImageUploadName}
                    onChange={(e) => setCoverImageUploadName(e.target.value)}
                    placeholder="e.g. Ambedkar Jayanti 2025"
                    className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </label>
                <label className="flex-1 text-sm text-gray-700">
                  <span className="mb-1 block font-medium">Image File</span>
                  <input
                    key={coverImageInputKey}
                    type="file"
                    accept="image/*"
                    onChange={(e) => setCoverImageUploadFile(e.target.files?.[0] ?? null)}
                    className="w-full text-sm text-gray-700 file:mr-3 file:py-2 file:px-3 file:rounded file:border-0 file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100"
                  />
                </label>
                <button
                  disabled={coverImageUploading || !coverImageUploadName || !coverImageUploadFile}
                  onClick={async () => {
                    if (!coverImageUploadFile || !coverImageUploadName) return;
                    setCoverImageUploading(true);
                    setCoverImageUploadError('');
                    try {
                      const form = new FormData();
                      form.append('file', coverImageUploadFile);
                      form.append('name', coverImageUploadName);
                      const res = await fetch('/api/admin/cover-images', { method: 'POST', body: form });
                      if (!res.ok) {
                        const err = (await res.json()) as { error?: string };
                        setCoverImageUploadError(err.error ?? 'Upload failed');
                      } else {
                        await loadCoverImages();
                        setCoverImageUploadName('');
                        setCoverImageUploadFile(null);
                        setCoverImageInputKey((k) => k + 1);
                      }
                    } finally {
                      setCoverImageUploading(false);
                    }
                  }}
                  className="px-4 py-2 bg-blue-700 text-white rounded-md text-sm font-medium hover:bg-blue-800 disabled:opacity-50 disabled:cursor-not-allowed whitespace-nowrap"
                >
                  {coverImageUploading ? 'Uploading…' : 'Upload Image'}
                </button>
              </div>
              {coverImageUploadError && (
                <p className="mt-2 text-sm text-red-600">{coverImageUploadError}</p>
              )}
            </div>

            {/* Image grid */}
            {coverImages.length === 0 ? (
              <p className="text-sm text-gray-500">No cover images yet. Upload one above.</p>
            ) : (
              <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
                {coverImages.map((img) => (
                  <div
                    key={img.key}
                    className="border border-gray-200 rounded-lg overflow-hidden bg-white"
                  >
                    {/* Thumbnail */}
                    <div className="h-28 bg-gray-100 overflow-hidden">
                      <img
                        src={img.url}
                        alt={img.name}
                        loading="lazy"
                        className="w-full h-full object-cover"
                      />
                    </div>

                    <div className="p-3">
                      {coverImageRenameKey === img.key ? (
                        /* Rename mode */
                        <>
                          <input
                            type="text"
                            value={coverImageRenameDraft}
                            onChange={(e) => setCoverImageRenameDraft(e.target.value)}
                            className="w-full px-2 py-1 border border-blue-400 rounded text-sm mb-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                            autoFocus
                          />
                          <div className="flex gap-2">
                            <button
                              onClick={async () => {
                                if (!coverImageRenameDraft.trim()) return;
                                const filename = img.key.split('/').pop()!;
                                const res = await fetch(`/api/admin/cover-images/${encodeURIComponent(filename)}`, {
                                  method: 'PATCH',
                                  headers: { 'Content-Type': 'application/json' },
                                  body: JSON.stringify({ name: coverImageRenameDraft.trim() }),
                                });
                                if (res.ok) {
                                  await loadCoverImages();
                                  setCoverImageRenameKey(null);
                                }
                              }}
                              className="flex-1 px-2 py-1 bg-blue-700 text-white rounded text-xs font-medium hover:bg-blue-800"
                            >
                              Save
                            </button>
                            <button
                              onClick={() => setCoverImageRenameKey(null)}
                              className="flex-1 px-2 py-1 bg-gray-100 text-gray-700 border border-gray-300 rounded text-xs hover:bg-gray-200"
                            >
                              Cancel
                            </button>
                          </div>
                        </>
                      ) : coverImageDeleteConfirmKey === img.key ? (
                        /* Delete confirm mode */
                        <>
                          <p className="text-xs text-red-600 mb-2">Delete &ldquo;{img.name}&rdquo;?</p>
                          <div className="flex gap-2">
                            <button
                              onClick={async () => {
                                const filename = img.key.split('/').pop()!;
                                const res = await fetch(`/api/admin/cover-images/${encodeURIComponent(filename)}`, {
                                  method: 'DELETE',
                                });
                                if (res.ok) {
                                  await loadCoverImages();
                                  setCoverImageDeleteConfirmKey(null);
                                }
                              }}
                              className="flex-1 px-2 py-1 bg-red-600 text-white rounded text-xs font-medium hover:bg-red-700"
                            >
                              Delete
                            </button>
                            <button
                              onClick={() => setCoverImageDeleteConfirmKey(null)}
                              className="flex-1 px-2 py-1 bg-gray-100 text-gray-700 border border-gray-300 rounded text-xs hover:bg-gray-200"
                            >
                              Cancel
                            </button>
                          </div>
                        </>
                      ) : (
                        /* Default mode */
                        <>
                          <p className="text-sm font-medium text-gray-800 truncate mb-2">{img.name}</p>
                          <div className="flex gap-2">
                            <button
                              onClick={() => {
                                setCoverImageRenameKey(img.key);
                                setCoverImageRenameDraft(img.name);
                              }}
                              className="flex-1 px-2 py-1 bg-gray-100 text-gray-700 border border-gray-300 rounded text-xs hover:bg-gray-200"
                            >
                              Rename
                            </button>
                            <button
                              onClick={() => setCoverImageDeleteConfirmKey(img.key)}
                              className="flex-1 px-2 py-1 bg-red-50 text-red-600 border border-red-200 rounded text-xs hover:bg-red-100"
                            >
                              Delete
                            </button>
                          </div>
                        </>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {activeTab === 'messages' && (
          <div className="space-y-8">
            {/* Activation Requests */}
            {activationRequests.length > 0 && (
              <section>
                <h2 className="text-lg font-semibold text-gray-900 mb-4">Activation Requests ({activationRequests.length})</h2>
                <div className="bg-white shadow rounded-lg overflow-x-auto">
                  <table className="min-w-full divide-y divide-gray-200">
                    <thead className="bg-amber-50">
                      <tr>
                        {['Member', 'Email', 'Requested', 'Actions'].map((h) => (
                          <th key={h} className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">{h}</th>
                        ))}
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-200">
                      {activationRequests.map((m) => (
                        <tr key={m.id} className="hover:bg-gray-50">
                          <td className="px-6 py-4 text-sm font-medium text-gray-900">{m.name}</td>
                          <td className="px-6 py-4 text-sm text-gray-500">{m.email}</td>
                          <td className="px-6 py-4 text-sm text-gray-500">{m.createdAt}</td>
                          <td className="px-6 py-4 space-x-2">
                            <button
                              onClick={async () => {
                                await fetch('/api/admin/messages', {
                                  method: 'PATCH',
                                  headers: { 'Content-Type': 'application/json' },
                                  body: JSON.stringify({ id: m.id, action: 'accept' }),
                                });
                                await Promise.all([loadMessages(), loadMembers()]);
                              }}
                              className="px-3 py-1.5 text-xs font-medium rounded bg-green-100 text-green-700 hover:bg-green-200"
                            >
                              Accept
                            </button>
                            <button
                              onClick={async () => {
                                await fetch('/api/admin/messages', {
                                  method: 'PATCH',
                                  headers: { 'Content-Type': 'application/json' },
                                  body: JSON.stringify({ id: m.id, action: 'reject' }),
                                });
                                await Promise.all([loadMessages(), loadMembers()]);
                              }}
                              className="px-3 py-1.5 text-xs font-medium rounded bg-red-100 text-red-700 hover:bg-red-200"
                            >
                              Reject
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </section>
            )}

            <section>
              <h2 className="text-lg font-semibold text-gray-900 mb-4">Pending Messages</h2>
              <div className="bg-white shadow rounded-lg overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      {['Name', 'Subject', 'Contact', 'Received', 'Actions'].map((h) => (
                        <th key={h} className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          {h}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-200">
                    {pendingMessages.map((m) => (
                      <tr key={m.id} className="hover:bg-gray-50">
                        <td className="px-6 py-4 text-sm font-medium text-gray-900">{m.name}</td>
                        <td className="px-6 py-4 text-sm text-gray-700">{m.subject}</td>
                        <td className="px-6 py-4 text-sm text-gray-500">
                          <div>{m.email}</div>
                          {m.phone && <div>{m.phone}</div>}
                        </td>
                        <td className="px-6 py-4 text-sm text-gray-500">{m.createdAt}</td>
                        <td className="px-6 py-4 space-x-2">
                          <button
                            onClick={() => {
                              setSelectedMessage(m);
                              setMessageNoteDraft(m.adminNote ?? '');
                            }}
                            className="px-3 py-1.5 text-xs font-medium rounded bg-blue-100 text-blue-700 hover:bg-blue-200"
                          >
                            Open
                          </button>
                          <button
                            onClick={() => updateMessage(m.id, { status: 'RESOLVED' })}
                            className="px-3 py-1.5 text-xs font-medium rounded bg-green-100 text-green-700 hover:bg-green-200"
                          >
                            Mark Resolved
                          </button>
                        </td>
                      </tr>
                    ))}
                    {pendingMessages.length === 0 && (
                      <tr>
                        <td colSpan={5} className="px-6 py-10 text-center text-sm text-gray-500">
                          No pending messages.
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </section>

            <section>
              <h2 className="text-lg font-semibold text-gray-900 mb-4">Resolved Messages</h2>
              <div className="bg-white shadow rounded-lg overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      {['Name', 'Subject', 'Contact', 'Received', 'Actions'].map((h) => (
                        <th key={h} className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          {h}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-200">
                    {resolvedMessages.map((m) => (
                      <tr key={m.id} className="hover:bg-gray-50">
                        <td className="px-6 py-4 text-sm font-medium text-gray-900">{m.name}</td>
                        <td className="px-6 py-4 text-sm text-gray-700">{m.subject}</td>
                        <td className="px-6 py-4 text-sm text-gray-500">
                          <div>{m.email}</div>
                          {m.phone && <div>{m.phone}</div>}
                        </td>
                        <td className="px-6 py-4 text-sm text-gray-500">{m.createdAt}</td>
                        <td className="px-6 py-4 space-x-2">
                          <button
                            onClick={() => {
                              setSelectedMessage(m);
                              setMessageNoteDraft(m.adminNote ?? '');
                            }}
                            className="px-3 py-1.5 text-xs font-medium rounded bg-blue-100 text-blue-700 hover:bg-blue-200"
                          >
                            Open
                          </button>
                          <button
                            onClick={() => updateMessage(m.id, { status: 'PENDING' })}
                            className="px-3 py-1.5 text-xs font-medium rounded bg-yellow-100 text-yellow-700 hover:bg-yellow-200"
                          >
                            Move to Pending
                          </button>
                        </td>
                      </tr>
                    ))}
                    {resolvedMessages.length === 0 && (
                      <tr>
                        <td colSpan={5} className="px-6 py-10 text-center text-sm text-gray-500">
                          No resolved messages.
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </section>
          </div>
        )}

        {activeTab === 'settings' && (
          <div className="space-y-6">
            <div className="rounded-2xl overflow-hidden shadow-sm border border-gray-100">
              {/* Card header */}
              <div className="px-8 py-6 bg-gradient-to-r from-primary-blue to-[#7F56D9] flex items-center gap-4">
                <div className="w-12 h-12 rounded-xl bg-white/20 flex items-center justify-center flex-shrink-0">
                  <svg className="w-6 h-6 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                  </svg>
                </div>
                <div>
                  <h2 className="text-white font-bold text-xl leading-tight">Organization Details</h2>
                  <p className="text-white/70 text-sm mt-0.5">Displayed across the site and in member emails</p>
                </div>
              </div>

              <div className="bg-white px-8 py-8 space-y-8">
                {/* Identity */}
                <div>
                  <div className="flex items-center gap-2 mb-4">
                    <div className="w-1 h-5 rounded-full bg-primary-blue" />
                    <h3 className="text-sm font-bold text-gray-700 uppercase tracking-widest">Identity</h3>
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-5">
                    {([
                      { key: 'orgName', label: 'Organization Name', span: 'lg:col-span-2' },
                      { key: 'shortName', label: 'Short Name' },
                      { key: 'website', label: 'Website URL' },
                    ] as Array<{ key: keyof OrgSettings; label: string; span?: string }>).map(({ key, label, span }) => (
                      <label key={key} className={`block ${span ?? ''}`}>
                        <span className="block text-sm font-semibold text-gray-700 mb-1.5">{label}</span>
                        <input
                          type="text"
                          value={orgSettingsForm[key]}
                          onChange={(e) => setOrgSettingsForm((prev) => ({ ...prev, [key]: e.target.value }))}
                          className="w-full px-4 py-3 border border-gray-200 rounded-xl text-sm text-gray-900 bg-gray-50 placeholder-gray-400 focus:bg-white focus:outline-none focus:ring-2 focus:ring-primary-blue/25 focus:border-primary-blue transition"
                        />
                      </label>
                    ))}
                  </div>
                </div>

                <div className="border-t border-gray-100" />

                {/* Contact */}
                <div>
                  <div className="flex items-center gap-2 mb-4">
                    <div className="w-1 h-5 rounded-full bg-primary-saffron" />
                    <h3 className="text-sm font-bold text-gray-700 uppercase tracking-widest">Contact</h3>
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
                    {([
                      { key: 'email', label: 'Email Address', type: 'email' },
                      { key: 'phone', label: 'Phone Number' },
                      { key: 'altPhone', label: 'Alternative Phone' },
                    ] as Array<{ key: keyof OrgSettings; label: string; type?: string }>).map(({ key, label, type }) => (
                      <label key={key} className="block">
                        <span className="block text-sm font-semibold text-gray-700 mb-1.5">{label}</span>
                        <input
                          type={type ?? 'text'}
                          value={orgSettingsForm[key]}
                          onChange={(e) => setOrgSettingsForm((prev) => ({ ...prev, [key]: e.target.value }))}
                          className="w-full px-4 py-3 border border-gray-200 rounded-xl text-sm text-gray-900 bg-gray-50 placeholder-gray-400 focus:bg-white focus:outline-none focus:ring-2 focus:ring-primary-blue/25 focus:border-primary-blue transition"
                        />
                      </label>
                    ))}
                  </div>
                </div>

                <div className="border-t border-gray-100" />

                {/* Address */}
                <div>
                  <div className="flex items-center gap-2 mb-4">
                    <div className="w-1 h-5 rounded-full bg-purple-400" />
                    <h3 className="text-sm font-bold text-gray-700 uppercase tracking-widest">Address</h3>
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-5">
                    {([
                      { key: 'addressLine1', label: 'Address Line 1', span: 'md:col-span-2 lg:col-span-2' },
                      { key: 'addressLine2', label: 'Address Line 2', span: 'md:col-span-2 lg:col-span-2' },
                      { key: 'city', label: 'City' },
                      { key: 'province', label: 'Province' },
                      { key: 'postalCode', label: 'Postal Code' },
                      { key: 'country', label: 'Country' },
                    ] as Array<{ key: keyof OrgSettings; label: string; span?: string }>).map(({ key, label, span }) => (
                      <label key={key} className={`block ${span ?? ''}`}>
                        <span className="block text-sm font-semibold text-gray-700 mb-1.5">{label}</span>
                        <input
                          type="text"
                          value={orgSettingsForm[key]}
                          onChange={(e) => setOrgSettingsForm((prev) => ({ ...prev, [key]: e.target.value }))}
                          className="w-full px-4 py-3 border border-gray-200 rounded-xl text-sm text-gray-900 bg-gray-50 placeholder-gray-400 focus:bg-white focus:outline-none focus:ring-2 focus:ring-primary-blue/25 focus:border-primary-blue transition"
                        />
                      </label>
                    ))}
                  </div>
                </div>

                <div className="border-t border-gray-100" />

                {/* Description */}
                <div>
                  <div className="flex items-center gap-2 mb-4">
                    <div className="w-1 h-5 rounded-full bg-green-400" />
                    <h3 className="text-sm font-bold text-gray-700 uppercase tracking-widest">About</h3>
                  </div>
                  <label className="block">
                    <span className="block text-sm font-semibold text-gray-700 mb-1.5">Organization Description</span>
                    <textarea
                      rows={4}
                      value={orgSettingsForm.description}
                      onChange={(e) => setOrgSettingsForm((prev) => ({ ...prev, description: e.target.value }))}
                      className="w-full px-4 py-3 border border-gray-200 rounded-xl text-sm text-gray-900 bg-gray-50 placeholder-gray-400 focus:bg-white focus:outline-none focus:ring-2 focus:ring-primary-blue/25 focus:border-primary-blue transition resize-none"
                    />
                  </label>
                </div>
              </div>

              {/* Card footer */}
              <div className="bg-gray-50 border-t border-gray-100 px-8 py-5 flex items-center justify-between">
                <div>
                  {orgSettingsMessage && (
                    <p className={`text-sm font-semibold ${orgSettingsMessage.includes('Failed') ? 'text-red-600' : 'text-green-600'}`}>
                      {orgSettingsMessage.includes('Failed') ? '✗ ' : '✓ '}{orgSettingsMessage}
                    </p>
                  )}
                </div>
                <button
                  onClick={handleSaveOrgSettings}
                  disabled={orgSettingsSaving}
                  className="px-7 py-2.5 text-sm font-bold text-white rounded-xl disabled:opacity-50 transition shadow-sm hover:shadow-md"
                  style={{ background: 'linear-gradient(135deg, #2D4D9B, #7F56D9)' }}
                >
                  {orgSettingsSaving ? 'Saving…' : 'Save Settings'}
                </button>
              </div>
            </div>
          </div>
        )}
      </div>

      {confirmDeactivateMemberId && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-2xl w-full max-w-sm">
            <div className="px-6 py-5">
              <h3 className="text-base font-semibold text-gray-900 mb-2">Deactivate member?</h3>
              <p className="text-sm text-gray-600">
                This will deactivate the member&apos;s account. They will not be able to access the site until reactivated. The member can request reactivation, which you can approve or reject.
              </p>
            </div>
            <div className="px-6 py-4 border-t bg-gray-50 flex justify-end gap-3 rounded-b-xl">
              <button
                onClick={() => setConfirmDeactivateMemberId(null)}
                className="px-4 py-2 text-sm text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50"
              >
                Cancel
              </button>
              <button
                onClick={async () => {
                  await handleDeactivateMember(confirmDeactivateMemberId);
                  setConfirmDeactivateMemberId(null);
                }}
                className="px-4 py-2 text-sm font-medium text-white bg-amber-600 rounded-md hover:bg-amber-700"
              >
                Deactivate
              </button>
            </div>
          </div>
        </div>
      )}

      {selectedMessage && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-hidden">
            <div className="flex justify-between items-center px-6 py-4 border-b">
              <h3 className="text-lg font-semibold text-gray-900">Message Details</h3>
              <button
                onClick={() => setSelectedMessage(null)}
                className="text-gray-400 hover:text-gray-600 text-2xl leading-none"
              >
                &times;
              </button>
            </div>

            <div className="px-6 py-5 space-y-4 overflow-y-auto max-h-[70vh]">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <p className="text-xs uppercase tracking-wide text-gray-500 font-semibold">Name</p>
                  <p className="text-sm text-gray-900 mt-1">{selectedMessage.name}</p>
                </div>
                <div>
                  <p className="text-xs uppercase tracking-wide text-gray-500 font-semibold">Email</p>
                  <p className="text-sm text-gray-900 mt-1">{selectedMessage.email}</p>
                </div>
                <div>
                  <p className="text-xs uppercase tracking-wide text-gray-500 font-semibold">Phone</p>
                  <p className="text-sm text-gray-900 mt-1">{selectedMessage.phone || 'Not provided'}</p>
                </div>
                <div>
                  <p className="text-xs uppercase tracking-wide text-gray-500 font-semibold">Received</p>
                  <p className="text-sm text-gray-900 mt-1">{selectedMessage.createdAt}</p>
                </div>
              </div>

              <div>
                <p className="text-xs uppercase tracking-wide text-gray-500 font-semibold">Subject</p>
                <p className="text-sm text-gray-900 mt-1">{selectedMessage.subject}</p>
              </div>

              <div>
                <p className="text-xs uppercase tracking-wide text-gray-500 font-semibold">Message</p>
                <p className="text-sm text-gray-800 mt-1 whitespace-pre-wrap">{selectedMessage.message}</p>
              </div>

              <div>
                <label className="block text-xs uppercase tracking-wide text-gray-500 font-semibold mb-1">
                  Admin Note
                </label>
                <textarea
                  rows={4}
                  value={messageNoteDraft}
                  onChange={(e) => setMessageNoteDraft(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
            </div>

            <div className="px-6 py-4 border-t bg-gray-50 flex justify-between gap-2">
              <button
                onClick={async () => {
                  await updateMessage(selectedMessage.id, {
                    status: selectedMessage.status === 'PENDING' ? 'RESOLVED' : 'PENDING',
                    adminNote: messageNoteDraft,
                  });
                  setSelectedMessage(null);
                }}
                className={`px-4 py-2 text-sm font-medium rounded-md ${
                  selectedMessage.status === 'PENDING'
                    ? 'bg-green-600 text-white hover:bg-green-700'
                    : 'bg-yellow-500 text-white hover:bg-yellow-600'
                }`}
              >
                {selectedMessage.status === 'PENDING' ? 'Save & Mark Resolved' : 'Save & Move to Pending'}
              </button>
              <button
                onClick={() => setSelectedMessage(null)}
                className="px-4 py-2 text-sm text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

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
