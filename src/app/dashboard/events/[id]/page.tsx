'use client';

import { useSession } from 'next-auth/react';
import { useRouter, useParams } from 'next/navigation';
import { useEffect, useState } from 'react';

type EventStatus = 'Upcoming' | 'Registration Started' | 'Event Ended';
type RegistrationStatus = 'Pending Registration' | 'Confirmed' | 'Rejected';
type PaymentStatus = 'Paid' | 'Unpaid';

type EventDetail = {
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
  eventImages: string;
  status: EventStatus;
};

type FamilyMemberRow = { id: string; userId: string; name: string; age: number | null };
type GuestEntry = { name: string; age: string };

type Registration = {
  id: string;
  userId: string;
  name: string;
  email: string;
  volunteering: boolean;
  includeFamily: boolean;
  selectedFamilyMemberIds: string;
  nonMemberGuestDetails: string;
  selectedFamilyMembers?: Array<{ id: string; userId: string; name: string; age: number | null }>;
  nonMemberAdultGuests: number;
  nonMemberChildGuests: number;
  adultsCount: number;
  childrenCount: number;
  totalAmount: number;
  paidAmount: number;
  refundDue: number;
  paymentHistory: string;
  paymentStatus: PaymentStatus;
  registrationStatus: RegistrationStatus;
  createdAt: string;
};

type PaymentTx = { type: 'payment' | 'refund'; amount: number; reference: string; date: string };

type PaymentModalState = {
  reg: Registration;
  mode: 'payment' | 'refund';
  amount: string;
  reference: string;
  saving: boolean;
  error: string;
};

type HistoryModalReg = { name: string; email: string; paymentHistory: string };

type EditState = {
  reg: Registration;
  familyMembers: FamilyMemberRow[];
  selectedFamilyIds: string[];
  guests: GuestEntry[];
  volunteering: boolean;
  saving: boolean;
};

export default function AdminEventPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const params = useParams<{ id: string }>();
  const eventId = params.id;

  type CoordinatorInfo = { userId: string; name: string; email: string };
  type ActiveMember = { id: string; name: string; email: string };

  const [loading, setLoading] = useState(true);
  const [event, setEvent] = useState<EventDetail | null>(null);
  const [coordinators, setCoordinators] = useState<CoordinatorInfo[]>([]);
  const [activeMembers, setActiveMembers] = useState<ActiveMember[]>([]);
  const [addCoordinatorId, setAddCoordinatorId] = useState('');
  const [registrations, setRegistrations] = useState<Registration[]>([]);
  const [savingEvent, setSavingEvent] = useState(false);
  const [eventMessage, setEventMessage] = useState('');
  const [uploadingImages, setUploadingImages] = useState(false);
  const [pendingFiles, setPendingFiles] = useState<File[]>([]);
  const [editState, setEditState] = useState<EditState | null>(null);
  const [paymentModal, setPaymentModal] = useState<PaymentModalState | null>(null);
  const [historyModal, setHistoryModal] = useState<HistoryModalReg | null>(null);
  const [eventForm, setEventForm] = useState({
    title: '',
    description: '',
    coverImage: '',
    date: '',
    time: '18:00',
    location: '',
    eventType: '',
    isPaid: false,
    adultPrice: 0,
    childPrice: 0,
    status: 'Upcoming' as EventStatus,
    eventImages: [] as string[],
  });

  const getGuestDetails = (raw: string) => {
    try {
      const parsed = JSON.parse(raw || '[]') as unknown;
      if (!Array.isArray(parsed)) return [] as Array<{ name: string; age: number }>;
      return parsed
        .map((item) => ({
          name: String((item as { name?: unknown }).name ?? '').trim(),
          age: Number((item as { age?: unknown }).age ?? -1),
        }))
        .filter((item) => item.name.length > 0 && Number.isFinite(item.age) && item.age >= 0);
    } catch {
      return [];
    }
  };

  const totalAttendees = registrations.reduce(
    (sum, r) => sum + Number(r.adultsCount ?? 0) + Number(r.childrenCount ?? 0),
    0,
  );

  useEffect(() => {
    if (status === 'unauthenticated') router.push('/auth/login');
  }, [status, router]);

  const loadData = async () => {
    const res = await fetch(`/api/admin/events/${eventId}`, { cache: 'no-store' });
    if (res.status === 403) { router.push('/'); return; }
    if (!res.ok) throw new Error('Failed to load event');
    const data = (await res.json()) as { event: EventDetail; coordinators: CoordinatorInfo[]; registrations: Registration[]; isAdmin: boolean };
    setEvent(data.event);
    setCoordinators(data.coordinators ?? []);

    let parsedImages: string[] = [];
    try {
      parsedImages = JSON.parse(data.event.eventImages || '[]') as string[];
    } catch {
      parsedImages = [];
    }

    setEventForm({
      title: data.event.title,
      description: data.event.description || '',
      coverImage: data.event.coverImage || '',
      date: data.event.date,
      time: data.event.time || '18:00',
      location: data.event.location,
      eventType: data.event.eventType,
      isPaid: Boolean(data.event.isPaid),
      adultPrice: Number(data.event.adultPrice ?? 0),
      childPrice: Number(data.event.childPrice ?? 0),
      status: data.event.status,
      eventImages: parsedImages,
    });

    setRegistrations(data.registrations);
  };

  useEffect(() => {
    if (!eventId || status !== 'authenticated') return;
    let alive = true;
    const run = async () => {
      try {
        const tasks: Promise<void>[] = [
          loadData(),
          fetch('/api/admin/members', { cache: 'no-store' })
            .then((r) => r.json())
            .then((d: unknown) => {
              const { members } = d as { members: Array<{ id: string; name: string; email: string; status: string }> };
              setActiveMembers(members.filter((m) => m.status === 'active'));
            })
            .catch(() => undefined),
        ];
        await Promise.all(tasks);
      } finally {
        if (alive) setLoading(false);
      }
    };
    void run();
    return () => {
      alive = false;
    };
  }, [eventId, status, session?.user?.role]);

  const openEditModal = async (reg: Registration) => {
    let selectedFamilyIds: string[] = [];
    try {
      const parsed = JSON.parse(reg.selectedFamilyMemberIds || '[]') as unknown;
      if (Array.isArray(parsed)) selectedFamilyIds = parsed.map((s) => String(s));
    } catch { /* keep empty */ }

    const existingGuests = getGuestDetails(reg.nonMemberGuestDetails).map((g) => ({
      name: g.name,
      age: String(g.age),
    }));

    setEditState({
      reg,
      familyMembers: [],
      selectedFamilyIds,
      guests: existingGuests,
      volunteering: Boolean(reg.volunteering),
      saving: false,
    });

    // Fetch family members for this user
    try {
      const res = await fetch(`/api/admin/members?resource=family-members&userId=${reg.userId}`, { cache: 'no-store' });
      if (res.ok) {
        const data = (await res.json()) as { familyMembers: FamilyMemberRow[] };
        setEditState((prev) => prev ? { ...prev, familyMembers: data.familyMembers ?? [] } : null);
      }
    } catch { /* ignore */ }
  };

  const computeEditTotal = (state: EditState): number => {
    if (!event) return 0;
    if (!event.isPaid) return 0;
    const members = state.familyMembers.filter((m) => state.selectedFamilyIds.includes(m.id));
    const familyAdults = members.filter((m) => m.age == null || m.age >= 18).length;
    const familyChildren = members.filter((m) => m.age != null && m.age < 18).length;
    const validGuests = state.guests.filter((g) => g.name.trim().length > 0 && /^\d+$/.test(g.age));
    const guestAdults = validGuests.filter((g) => Number(g.age) >= 18).length;
    const guestChildren = validGuests.filter((g) => Number(g.age) < 18).length;
    const adults = 1 + familyAdults + guestAdults;
    const children = familyChildren + guestChildren;
    return adults * Number(event.adultPrice ?? 0) + children * Number(event.childPrice ?? 0);
  };

  const saveEditRegistration = async () => {
    if (!editState || !eventId) return;
    setEditState((prev) => prev ? { ...prev, saving: true } : null);

    const validGuests = editState.guests.filter((g) => g.name.trim().length > 0 && /^\d+$/.test(g.age));
    const nonMemberAdultGuests = validGuests.filter((g) => Number(g.age) >= 18).length;
    const nonMemberChildGuests = validGuests.filter((g) => Number(g.age) < 18).length;

    const res = await fetch(`/api/admin/events/${eventId}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        action: 'editRegistration',
        registrationId: editState.reg.id,
        volunteering: editState.volunteering,
        selectedFamilyMemberIds: editState.selectedFamilyIds,
        nonMemberAdultGuests,
        nonMemberChildGuests,
        nonMemberGuestDetails: JSON.stringify(
          validGuests.map((g) => ({ name: g.name.trim(), age: Number(g.age) })),
        ),
      }),
    });

    setEditState((prev) => prev ? { ...prev, saving: false } : null);
    if (res.ok) {
      setEditState(null);
      await loadData();
    }
  };

  const handleAddCoordinator = async () => {
    if (!addCoordinatorId || !eventId) return;
    await fetch(`/api/admin/events/${eventId}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ action: 'addCoordinator', userId: addCoordinatorId }),
    });
    setAddCoordinatorId('');
    await loadData();
  };

  const openPaymentModal = (reg: Registration, mode: 'payment' | 'refund') => {
    setPaymentModal({ reg, mode, amount: '', reference: '', saving: false, error: '' });
  };

  const savePayment = async () => {
    if (!paymentModal || !eventId) return;
    const amt = Number(paymentModal.amount);
    if (!amt || amt <= 0) {
      setPaymentModal((p) => p && ({ ...p, error: 'Enter a valid amount.' }));
      return;
    }
    setPaymentModal((p) => p && ({ ...p, saving: true, error: '' }));
    const res = await fetch(`/api/admin/events/${eventId}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        action: paymentModal.mode === 'payment' ? 'addPayment' : 'addRefund',
        registrationId: paymentModal.reg.id,
        amount: amt,
        referenceNumber: paymentModal.reference,
      }),
    });
    if (!res.ok) {
      setPaymentModal((p) => p && ({ ...p, saving: false, error: 'Failed to save. Try again.' }));
      return;
    }
    setPaymentModal(null);
    await loadData();
  };

  const handleRemoveCoordinator = async (userId: string) => {
    if (!eventId) return;
    await fetch(`/api/admin/events/${eventId}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ action: 'removeCoordinator', userId }),
    });
    await loadData();
  };

  const toImageSrc = (key: string) => `/api/events/image?key=${encodeURIComponent(key)}`;

  const saveEventDetails = async () => {
    if (!eventId) return;
    setSavingEvent(true);
    setEventMessage('');
    try {
      const res = await fetch(`/api/admin/events/${eventId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'updateEvent',
          ...eventForm,
          adultPrice: eventForm.isPaid ? Number(eventForm.adultPrice) : 0,
          childPrice: eventForm.isPaid ? Number(eventForm.childPrice) : 0,
        }),
      });
      const data = (await res.json()) as { error?: string };
      if (!res.ok) {
        setEventMessage(data.error ?? 'Failed to save event');
        return;
      }
      setEventMessage('Event updated successfully.');
      await loadData();
    } finally {
      setSavingEvent(false);
    }
  };

  const uploadImages = async () => {
    if (!eventId || pendingFiles.length === 0) return;
    if (eventForm.eventImages.length + pendingFiles.length > 25) {
      setEventMessage('Maximum 25 images are allowed per event.');
      return;
    }

    setUploadingImages(true);
    setEventMessage('');
    try {
      const formData = new FormData();
      for (const file of pendingFiles) {
        formData.append('images', file);
      }
      const res = await fetch(`/api/admin/events/${eventId}/images`, {
        method: 'POST',
        body: formData,
      });
      const data = (await res.json()) as { error?: string; imageKeys?: string[] };
      if (!res.ok) {
        setEventMessage(data.error ?? 'Failed to upload images');
        return;
      }
      setEventForm((prev) => ({ ...prev, eventImages: data.imageKeys ?? prev.eventImages }));
      setPendingFiles([]);
      setEventMessage('Images uploaded.');
    } finally {
      setUploadingImages(false);
    }
  };

  const removeUploadedImage = async (key: string) => {
    if (!eventId) return;
    const res = await fetch(`/api/admin/events/${eventId}/images`, {
      method: 'DELETE',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ key }),
    });
    const data = (await res.json()) as { error?: string; imageKeys?: string[] };
    if (!res.ok) {
      setEventMessage(data.error ?? 'Failed to remove image');
      return;
    }
    setEventForm((prev) => ({ ...prev, eventImages: data.imageKeys ?? prev.eventImages }));
  };

  if (status === 'loading' || loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }
  if (!session || !event) return null;

  return (
    <div className="min-h-screen bg-slate-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6">
        <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6">
          <div className="flex items-center justify-between mb-4">
            <h1 className="text-2xl font-bold text-slate-900">Edit Event</h1>
            <span className="text-xs font-medium px-2 py-1 rounded-full bg-blue-100 text-blue-700">
              {eventForm.status}
            </span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <label className="text-sm text-slate-700">
              <span className="mb-1 block font-medium">Title</span>
              <input
                type="text"
                value={eventForm.title}
                onChange={(e) => setEventForm((prev) => ({ ...prev, title: e.target.value }))}
                className="w-full px-3 py-2 border border-slate-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </label>
            <label className="text-sm text-slate-700">
              <span className="mb-1 block font-medium">Event Type</span>
              <input
                type="text"
                value={eventForm.eventType}
                onChange={(e) => setEventForm((prev) => ({ ...prev, eventType: e.target.value }))}
                className="w-full px-3 py-2 border border-slate-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </label>
            <label className="text-sm text-slate-700">
              <span className="mb-1 block font-medium">Date</span>
              <input
                type="date"
                value={eventForm.date}
                onChange={(e) => setEventForm((prev) => ({ ...prev, date: e.target.value }))}
                className="w-full px-3 py-2 border border-slate-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </label>
            <label className="text-sm text-slate-700">
              <span className="mb-1 block font-medium">Time</span>
              <input
                type="time"
                value={eventForm.time}
                onChange={(e) => setEventForm((prev) => ({ ...prev, time: e.target.value }))}
                className="w-full px-3 py-2 border border-slate-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </label>
            <label className="text-sm text-slate-700 md:col-span-2">
              <span className="mb-1 block font-medium">Location</span>
              <input
                type="text"
                value={eventForm.location}
                onChange={(e) => setEventForm((prev) => ({ ...prev, location: e.target.value }))}
                className="w-full px-3 py-2 border border-slate-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </label>
            <label className="text-sm text-slate-700 md:col-span-2">
              <span className="mb-1 block font-medium">Description</span>
              <textarea
                rows={3}
                value={eventForm.description}
                onChange={(e) => setEventForm((prev) => ({ ...prev, description: e.target.value }))}
                className="w-full px-3 py-2 border border-slate-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </label>
            <label className="text-sm text-slate-700 md:col-span-2">
              <span className="mb-1 block font-medium">Cover Image URL or Path</span>
              <input
                type="text"
                value={eventForm.coverImage}
                onChange={(e) => setEventForm((prev) => ({ ...prev, coverImage: e.target.value }))}
                className="w-full px-3 py-2 border border-slate-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </label>

            <label className="flex items-center gap-2 px-3 py-2 border border-slate-300 rounded-md text-sm">
              <input
                type="checkbox"
                checked={eventForm.isPaid}
                onChange={(e) => setEventForm((prev) => ({ ...prev, isPaid: e.target.checked }))}
              />
              Paid Event
            </label>
            <label className="text-sm text-slate-700">
              <span className="mb-1 block font-medium">Adult Fee</span>
              <input
                type="number"
                min={0}
                value={eventForm.adultPrice}
                disabled={!eventForm.isPaid}
                onChange={(e) => setEventForm((prev) => ({ ...prev, adultPrice: Number(e.target.value) }))}
                className="w-full px-3 py-2 border border-slate-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:bg-slate-100"
              />
            </label>
            <label className="text-sm text-slate-700">
              <span className="mb-1 block font-medium">Child Fee</span>
              <input
                type="number"
                min={0}
                value={eventForm.childPrice}
                disabled={!eventForm.isPaid}
                onChange={(e) => setEventForm((prev) => ({ ...prev, childPrice: Number(e.target.value) }))}
                className="w-full px-3 py-2 border border-slate-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:bg-slate-100"
              />
            </label>
            <label className="text-sm text-slate-700">
              <span className="mb-1 block font-medium">Current Status</span>
              <select
                value={eventForm.status}
                onChange={(e) => setEventForm((prev) => ({ ...prev, status: e.target.value as EventStatus }))}
                className="w-full px-3 py-2 border border-slate-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="Upcoming">Upcoming</option>
                <option value="Registration Started">Registration Started</option>
                <option value="Event Ended">Event Ended</option>
              </select>
            </label>
          </div>

          <div className="mt-5 flex items-center justify-between">
            {eventMessage ? <p className="text-sm text-blue-700">{eventMessage}</p> : <span />}
            <button
              onClick={saveEventDetails}
              disabled={savingEvent}
              className="px-4 py-2 rounded-md bg-blue-600 text-white text-sm font-medium hover:bg-blue-700 disabled:opacity-60"
            >
              {savingEvent ? 'Saving...' : 'Save Event Details'}
            </button>
          </div>
        </div>

        {/* Coordinators section */}
        <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6">
          <h2 className="text-lg font-semibold text-slate-900 mb-4">Coordinators</h2>

          {coordinators.length === 0 ? (
            <p className="text-sm text-slate-500 mb-4">No coordinators assigned.</p>
          ) : (
            <ul className="mb-4 space-y-2">
              {coordinators.map((c) => (
                <li key={c.userId} className="flex items-center justify-between bg-slate-50 rounded-lg px-4 py-2">
                  <div>
                    <span className="text-sm font-medium text-slate-900">{c.name}</span>
                    <span className="ml-2 text-xs text-slate-500">{c.email}</span>
                  </div>
                  <button
                    onClick={() => handleRemoveCoordinator(c.userId)}
                    className="px-3 py-1 text-xs font-medium rounded bg-red-100 text-red-700 hover:bg-red-200"
                  >
                    Remove
                  </button>
                </li>
              ))}
            </ul>
          )}

          <div className="flex gap-2">
            <select
              value={addCoordinatorId}
              onChange={(e) => setAddCoordinatorId(e.target.value)}
              className="flex-1 px-3 py-2 border border-slate-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="">— Select a member to add —</option>
              {activeMembers
                .filter((m) => !coordinators.some((c) => c.userId === m.id))
                .map((m) => (
                  <option key={m.id} value={m.id}>{m.name} ({m.email})</option>
                ))}
            </select>
            <button
              onClick={handleAddCoordinator}
              disabled={!addCoordinatorId}
              className="px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-md hover:bg-blue-700 disabled:opacity-40"
            >
              Add Coordinator
            </button>
          </div>
        </div>

        {/* Registrations table */}
        <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
          <div className="px-6 py-4 border-b border-slate-200">
            <h2 className="text-lg font-semibold text-slate-900">Registered Members ({registrations.length})</h2>
            <p className="text-sm text-slate-600 mt-1">Total attendees: {totalAttendees}</p>
          </div>
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-slate-200">
              <thead className="bg-slate-50">
                <tr>
                  {['Member', 'Volunteer', 'Attendees', 'Payment', 'Registration', 'Actions'].map((h) => (
                    <th key={h} className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200">
                {registrations.map((r) => (
                  <tr key={r.id}>
                    <td className="px-6 py-4">
                      <p className="text-sm font-medium text-slate-900">{r.name}</p>
                      <p className="text-xs text-slate-500">{r.email}</p>
                    </td>
                    <td className="px-6 py-4 text-sm text-slate-700">
                      <input type="checkbox" checked={r.volunteering} readOnly />
                    </td>
                    <td className="px-6 py-4 text-sm text-slate-700">
                      {r.includeFamily ? (
                        <div>
                          <p>{r.adultsCount} adult(s), {r.childrenCount} child(ren)</p>
                          <p className="text-xs text-slate-500 mt-1">
                            Family: {(r.selectedFamilyMembers ?? []).filter((m) => m.age == null || m.age >= 18).length} adult(s), {(r.selectedFamilyMembers ?? []).filter((m) => m.age != null && m.age < 18).length} child(ren)
                          </p>
                          {(r.selectedFamilyMembers ?? []).map((m) => (
                            <p key={m.id} className="text-xs text-slate-500">{m.name}{m.age != null ? ` (${m.age})` : ''}</p>
                          ))}
                          <p className="text-xs text-slate-500 mt-1">
                            Guests: {getGuestDetails(r.nonMemberGuestDetails).filter((g) => g.age >= 18).length} adult(s), {getGuestDetails(r.nonMemberGuestDetails).filter((g) => g.age < 18).length} child(ren)
                          </p>
                          {getGuestDetails(r.nonMemberGuestDetails).map((g, idx) => (
                            <p key={`${g.name}-${g.age}-${idx}`} className="text-xs text-slate-500">{g.name} ({g.age})</p>
                          ))}
                        </div>
                      ) : (
                        <span className="text-slate-500">1 adult</span>
                      )}
                    </td>
                    <td className="px-6 py-4">
                      {event.isPaid ? (
                        r.paymentStatus === 'Paid' ? (
                          <div className="space-y-1">
                            <span className="inline-flex items-center gap-1 text-xs font-semibold text-green-700 bg-green-50 px-2 py-0.5 rounded-full">
                              ✓ Paid · ${r.paidAmount}
                            </span>
                            {Number(r.refundDue) > 0 && (
                              <p className="inline-flex items-center gap-1 text-xs font-semibold text-amber-700 bg-amber-50 px-2 py-0.5 rounded-full">
                                ↩ ${r.refundDue} refund owed
                              </p>
                            )}
                          </div>
                        ) : (() => {
                          const due = Number(r.totalAmount) - Number(r.paidAmount ?? 0);
                          return (
                            <div className="space-y-1">
                              <span className="inline-flex items-center gap-1 text-xs font-semibold text-amber-700 bg-amber-50 px-2 py-0.5 rounded-full">
                                💰 ${due} due
                              </span>
                              {Number(r.paidAmount) > 0 && (
                                <p className="text-xs text-slate-500">
                                  paid ${r.paidAmount} of ${r.totalAmount}
                                </p>
                              )}
                            </div>
                          );
                        })()
                      ) : (
                        <span className="text-xs text-slate-500">Free</span>
                      )}
                    </td>
                    <td className="px-6 py-4 text-sm text-slate-700">{r.registrationStatus}</td>
                    <td className="px-6 py-4">
                      <div className="flex flex-wrap gap-2">
                        <button
                          onClick={() => void openEditModal(r)}
                          className="px-3 py-1.5 text-xs font-medium rounded bg-slate-100 text-slate-700 hover:bg-slate-200"
                        >
                          Edit
                        </button>
                        {event.isPaid && (
                          <>
                            <button
                              onClick={() => openPaymentModal(r, 'payment')}
                              className="px-3 py-1.5 text-xs font-medium rounded bg-green-100 text-green-700 hover:bg-green-200"
                            >
                              Add Payment
                            </button>
                            <button
                              onClick={() => openPaymentModal(r, 'refund')}
                              className="px-3 py-1.5 text-xs font-medium rounded bg-amber-100 text-amber-700 hover:bg-amber-200"
                            >
                              Add Refund
                            </button>
                            <button
                              onClick={() => setHistoryModal({ name: r.name, email: r.email, paymentHistory: r.paymentHistory })}
                              className="px-3 py-1.5 text-xs font-medium rounded bg-blue-50 text-blue-700 hover:bg-blue-100"
                            >
                              Transactions
                            </button>
                          </>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
                {registrations.length === 0 && (
                  <tr>
                    <td colSpan={6} className="px-6 py-10 text-center text-sm text-slate-500">
                      No registrations yet.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* Event Images */}
        <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6">
          <h2 className="text-lg font-semibold text-slate-900">Event Images</h2>
          <p className="text-sm text-slate-600 mt-1">Upload up to 25 images per event (stored in R2).</p>

          <div className="mt-4 flex gap-2">
            <input
              type="file"
              accept="image/*"
              multiple
              onChange={(e) => setPendingFiles(Array.from(e.target.files ?? []))}
              className="flex-1 px-3 py-2 border border-slate-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
            <button
              onClick={uploadImages}
              disabled={uploadingImages || pendingFiles.length === 0}
              className="px-4 py-2 rounded-md bg-slate-800 text-white text-sm font-medium hover:bg-slate-900 disabled:opacity-60"
            >
              {uploadingImages ? 'Uploading...' : `Upload ${pendingFiles.length > 0 ? `(${pendingFiles.length})` : ''}`}
            </button>
          </div>
          <p className="mt-2 text-xs text-slate-500">
            {eventForm.eventImages.length}/25 uploaded
          </p>

          <div className="mt-4 grid grid-cols-2 md:grid-cols-4 lg:grid-cols-5 gap-3">
            {eventForm.eventImages.map((key, index) => (
              <div key={`${key}-${index}`} className="border border-slate-200 rounded-md p-2">
                <div className="relative h-24 rounded overflow-hidden bg-slate-100">
                  <img
                    src={toImageSrc(key)}
                    alt={`Event image ${index + 1}`}
                    className="w-full h-full object-cover"
                    loading="lazy"
                  />
                </div>
                <p className="mt-1 text-[11px] text-slate-500 truncate">{key.split('/').pop()}</p>
                <button
                  onClick={() => removeUploadedImage(key)}
                  className="mt-1 w-full px-2 py-1 text-xs rounded bg-red-100 text-red-700 hover:bg-red-200"
                >
                  Remove
                </button>
              </div>
            ))}
            {eventForm.eventImages.length === 0 && (
              <p className="text-sm text-slate-500">No images uploaded yet.</p>
            )}
          </div>
        </div>
      </div>

      {/* Edit Registration Modal */}
      {editState && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl w-full max-w-lg shadow-xl flex flex-col max-h-[90vh]">
            {/* Header */}
            <div className="px-6 py-4 border-b border-slate-200 flex items-center justify-between flex-shrink-0">
              <div>
                <h3 className="text-base font-semibold text-slate-900">Edit Registration</h3>
                <p className="text-xs text-slate-500 mt-0.5">{editState.reg.name}</p>
              </div>
              <button
                onClick={() => setEditState(null)}
                className="text-slate-400 hover:text-slate-600 text-2xl leading-none"
              >
                ×
              </button>
            </div>

            {/* Body */}
            <div className="p-6 overflow-y-auto flex-1 space-y-5">
              {/* Volunteering */}
              <label className="flex items-center gap-3 text-sm text-slate-700 cursor-pointer">
                <input
                  type="checkbox"
                  checked={editState.volunteering}
                  onChange={(e) => setEditState((prev) => prev ? { ...prev, volunteering: e.target.checked } : null)}
                  className="w-4 h-4 rounded border-slate-300 text-blue-600"
                />
                <span className="font-medium">Volunteering</span>
              </label>

              {/* Family Members */}
              {editState.familyMembers.length > 0 && (
                <div>
                  <p className="text-sm font-medium text-slate-700 mb-2">Family Members</p>
                  <div className="space-y-1.5">
                    {editState.familyMembers.map((m) => (
                      <label key={m.id} className="flex items-center gap-3 text-sm text-slate-700 cursor-pointer">
                        <input
                          type="checkbox"
                          checked={editState.selectedFamilyIds.includes(m.id)}
                          onChange={(e) => {
                            setEditState((prev) => {
                              if (!prev) return null;
                              const ids = e.target.checked
                                ? [...prev.selectedFamilyIds, m.id]
                                : prev.selectedFamilyIds.filter((id) => id !== m.id);
                              return { ...prev, selectedFamilyIds: ids };
                            });
                          }}
                          className="w-4 h-4 rounded border-slate-300 text-blue-600"
                        />
                        <span>{m.name}</span>
                        {m.age != null && <span className="text-xs text-slate-500">age {m.age}</span>}
                      </label>
                    ))}
                  </div>
                </div>
              )}
              {editState.familyMembers.length === 0 && (
                <p className="text-xs text-slate-400">No family members on file for this member.</p>
              )}

              {/* Non-member Guests */}
              <div>
                <div className="flex items-center justify-between mb-2">
                  <p className="text-sm font-medium text-slate-700">Non-member Guests</p>
                  <button
                    onClick={() => setEditState((prev) => prev ? { ...prev, guests: [...prev.guests, { name: '', age: '' }] } : null)}
                    className="text-xs px-2 py-1 bg-slate-100 hover:bg-slate-200 rounded text-slate-700"
                  >
                    + Add Guest
                  </button>
                </div>
                {editState.guests.length === 0 && (
                  <p className="text-xs text-slate-400">No guests added.</p>
                )}
                <div className="space-y-2">
                  {editState.guests.map((g, idx) => (
                    <div key={idx} className="flex gap-2 items-center">
                      <input
                        type="text"
                        placeholder="Name"
                        value={g.name}
                        onChange={(e) => {
                          const val = e.target.value;
                          setEditState((prev) => {
                            if (!prev) return null;
                            const guests = prev.guests.map((guest, i) => i === idx ? { ...guest, name: val } : guest);
                            return { ...prev, guests };
                          });
                        }}
                        className="flex-1 px-2 py-1.5 text-sm border border-slate-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                      />
                      <input
                        type="number"
                        placeholder="Age"
                        min={0}
                        max={120}
                        value={g.age}
                        onChange={(e) => {
                          const val = e.target.value;
                          setEditState((prev) => {
                            if (!prev) return null;
                            const guests = prev.guests.map((guest, i) => i === idx ? { ...guest, age: val } : guest);
                            return { ...prev, guests };
                          });
                        }}
                        className="w-20 px-2 py-1.5 text-sm border border-slate-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                      />
                      <button
                        onClick={() => setEditState((prev) => prev ? { ...prev, guests: prev.guests.filter((_, i) => i !== idx) } : null)}
                        className="text-slate-400 hover:text-red-500 text-lg leading-none"
                      >
                        ×
                      </button>
                    </div>
                  ))}
                </div>
              </div>

              {/* Live total + payment impact warning */}
              {event.isPaid && (() => {
                const newTotal = computeEditTotal(editState);
                const paidAmount = Number(editState.reg.paidAmount ?? 0);
                const alreadyPaid = editState.reg.paymentStatus === 'Paid';
                const delta = newTotal - paidAmount;
                return (
                  <div className="rounded-lg border border-slate-200 bg-slate-50 px-4 py-3 space-y-2">
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-slate-600">New total</span>
                      <span className="font-semibold text-slate-900">${newTotal}</span>
                    </div>
                    <div className="flex items-center justify-between text-xs text-slate-500">
                      <span>Amount paid</span>
                      <span>${paidAmount}</span>
                    </div>
                    {alreadyPaid && delta < 0 && (
                      <div className="flex items-start gap-2 mt-1 bg-amber-50 border border-amber-200 rounded px-3 py-2 text-xs text-amber-800">
                        <span className="mt-0.5 flex-shrink-0">↩</span>
                        <span>Member paid ${paidAmount}. A <strong>${Math.abs(delta)} refund</strong> will be owed — payment stays Confirmed, please process manually.</span>
                      </div>
                    )}
                    {alreadyPaid && delta > 0 && (
                      <div className="flex items-start gap-2 mt-1 bg-red-50 border border-red-200 rounded px-3 py-2 text-xs text-red-800">
                        <span className="mt-0.5 flex-shrink-0">⚠</span>
                        <span>New total ${newTotal} exceeds amount paid ${paidAmount}. Payment status will reset to <strong>Unpaid</strong> and require re-confirmation.</span>
                      </div>
                    )}
                    {alreadyPaid && delta === 0 && (
                      <div className="flex items-start gap-2 mt-1 bg-green-50 border border-green-200 rounded px-3 py-2 text-xs text-green-800">
                        <span className="mt-0.5 flex-shrink-0">✓</span>
                        <span>Total matches amount paid — payment status stays Confirmed.</span>
                      </div>
                    )}
                    {!alreadyPaid && delta !== 0 && (
                      <div className="flex items-start gap-2 mt-1 bg-slate-100 border border-slate-200 rounded px-3 py-2 text-xs text-slate-700">
                        <span className="mt-0.5 flex-shrink-0">ℹ</span>
                        <span>Total updated to ${newTotal}. Registration remains Unpaid.</span>
                      </div>
                    )}
                  </div>
                );
              })()}
            </div>

            {/* Footer */}
            <div className="px-6 py-4 border-t border-slate-200 flex justify-end gap-3 flex-shrink-0">
              <button
                onClick={() => setEditState(null)}
                className="px-4 py-2 text-sm border border-slate-300 rounded-md hover:bg-slate-50 text-slate-700"
              >
                Cancel
              </button>
              <button
                onClick={() => void saveEditRegistration()}
                disabled={editState.saving}
                className="px-4 py-2 text-sm font-medium bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-60"
              >
                {editState.saving ? 'Saving...' : 'Save Changes'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Add Payment / Add Refund modal */}
      {paymentModal && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-xl shadow-xl w-full max-w-sm overflow-hidden">
            <div className={`px-6 py-4 flex justify-between items-center ${paymentModal.mode === 'payment' ? 'bg-green-600' : 'bg-amber-600'}`}>
              <h3 className="text-base font-semibold text-white">
                {paymentModal.mode === 'payment' ? 'Record Payment' : 'Record Refund'}
              </h3>
              <button onClick={() => setPaymentModal(null)} className="text-white/80 hover:text-white text-xl leading-none">×</button>
            </div>
            <div className="px-6 py-5 space-y-4">
              <div>
                <p className="text-sm text-slate-600 mb-1">{paymentModal.reg.name}</p>
                {paymentModal.mode === 'payment' ? (
                  <p className="text-xs text-slate-500">
                    Paid so far: ${paymentModal.reg.paidAmount} · Total due: ${paymentModal.reg.totalAmount}
                  </p>
                ) : (
                  <p className="text-xs text-slate-500">
                    Amount paid: ${paymentModal.reg.paidAmount}
                  </p>
                )}
              </div>
              <label className="block text-sm text-slate-700">
                <span className="font-medium">Amount ($)</span>
                <input
                  type="number"
                  min={1}
                  value={paymentModal.amount}
                  onChange={(e) => setPaymentModal((p) => p && ({ ...p, amount: e.target.value }))}
                  placeholder="0"
                  className="mt-1 w-full px-3 py-2 border border-slate-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </label>
              <label className="block text-sm text-slate-700">
                <span className="font-medium">Reference / Transaction #</span>
                <input
                  type="text"
                  value={paymentModal.reference}
                  onChange={(e) => setPaymentModal((p) => p && ({ ...p, reference: e.target.value }))}
                  placeholder="e.g. e-transfer ref, cheque #"
                  className="mt-1 w-full px-3 py-2 border border-slate-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </label>
              {paymentModal.error && <p className="text-xs text-red-600">{paymentModal.error}</p>}
            </div>
            <div className="px-6 py-4 border-t flex justify-end gap-3">
              <button
                onClick={() => setPaymentModal(null)}
                className="px-4 py-2 text-sm border border-slate-300 rounded-md hover:bg-slate-50 text-slate-700"
              >
                Cancel
              </button>
              <button
                onClick={() => void savePayment()}
                disabled={paymentModal.saving}
                className={`px-4 py-2 text-sm font-medium text-white rounded-md disabled:opacity-60 ${paymentModal.mode === 'payment' ? 'bg-green-600 hover:bg-green-700' : 'bg-amber-600 hover:bg-amber-700'}`}
              >
                {paymentModal.saving ? 'Saving...' : paymentModal.mode === 'payment' ? 'Record Payment' : 'Record Refund'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Transactions modal */}
      {historyModal && (() => {
        let history: PaymentTx[] = [];
        try { const p = JSON.parse(historyModal.paymentHistory || '[]') as unknown; if (Array.isArray(p)) history = p as PaymentTx[]; } catch { /* empty */ }
        const total = history.reduce((sum, tx) => tx.type === 'payment' ? sum + tx.amount : sum - tx.amount, 0);
        return (
          <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
            <div className="bg-white rounded-xl shadow-xl w-full max-w-md overflow-hidden">
              <div className="px-6 py-4 bg-slate-800 flex justify-between items-center">
                <div>
                  <h3 className="text-base font-semibold text-white">Transactions</h3>
                  <p className="text-xs text-slate-400 mt-0.5">{historyModal.name} · {historyModal.email}</p>
                </div>
                <button onClick={() => setHistoryModal(null)} className="text-white/80 hover:text-white text-xl leading-none">×</button>
              </div>
              <div className="px-6 py-4">
                {history.length === 0 ? (
                  <p className="text-sm text-slate-500 py-4 text-center">No transactions recorded yet.</p>
                ) : (
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="text-xs text-slate-500 border-b">
                        <th className="text-left pb-2 font-medium">Date</th>
                        <th className="text-left pb-2 font-medium">Type</th>
                        <th className="text-left pb-2 font-medium">Reference</th>
                        <th className="text-right pb-2 font-medium">Amount</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {history.map((tx, i) => (
                        <tr key={i}>
                          <td className="py-2 text-xs text-slate-500">{new Date(tx.date).toLocaleDateString()}</td>
                          <td className="py-2">
                            <span className={`text-xs font-medium ${tx.type === 'payment' ? 'text-green-700' : 'text-amber-700'}`}>
                              {tx.type === 'payment' ? 'Payment' : 'Refund'}
                            </span>
                          </td>
                          <td className="py-2 text-xs text-slate-500">{tx.reference || '—'}</td>
                          <td className={`py-2 text-xs font-semibold text-right ${tx.type === 'payment' ? 'text-green-700' : 'text-amber-700'}`}>
                            {tx.type === 'payment' ? '+' : '−'}${tx.amount}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                    <tfoot className="border-t border-slate-200">
                      <tr>
                        <td colSpan={3} className="pt-3 text-xs font-semibold text-slate-700">Net paid</td>
                        <td className={`pt-3 text-sm font-bold text-right ${total >= 0 ? 'text-green-700' : 'text-red-600'}`}>${total}</td>
                      </tr>
                    </tfoot>
                  </table>
                )}
              </div>
              <div className="px-6 py-4 border-t flex justify-end">
                <button onClick={() => setHistoryModal(null)} className="px-4 py-2 text-sm border border-slate-300 rounded-md hover:bg-slate-50 text-slate-700">
                  Close
                </button>
              </div>
            </div>
          </div>
        );
      })()}
    </div>
  );
}
