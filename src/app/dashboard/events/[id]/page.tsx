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
  paymentStatus: PaymentStatus;
  registrationStatus: RegistrationStatus;
  createdAt: string;
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

  const updateRegistration = async (
    registrationId: string,
    paymentStatus: PaymentStatus,
    registrationStatus: RegistrationStatus,
  ) => {
    const res = await fetch(`/api/admin/events/${eventId}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ action: 'updateRegistration', registrationId, paymentStatus, registrationStatus }),
    });
    if (!res.ok) return;
    await loadData();
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
  const isAdmin = session?.user?.role === 'ADMIN';
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

        {/* Coordinators section — admin or coordinator */}
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

        <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
          <div className="px-6 py-4 border-b border-slate-200">
            <h2 className="text-lg font-semibold text-slate-900">Registered Members ({registrations.length})</h2>
            <p className="text-sm text-slate-600 mt-1">Total attendees: {totalAttendees}</p>
          </div>
          <table className="min-w-full divide-y divide-slate-200">
            <thead className="bg-slate-50">
              <tr>
                {['Member', 'Volunteer', 'Family', 'Payment', 'Registration', 'Actions'].map((h) => (
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
                      'No'
                    )}
                  </td>
                  <td className="px-6 py-4 text-sm text-slate-700">
                    <p>{r.paymentStatus}</p>
                    <p className="text-xs text-slate-500">${r.totalAmount}</p>
                  </td>
                  <td className="px-6 py-4 text-sm text-slate-700">{r.registrationStatus}</td>
                  <td className="px-6 py-4 space-x-2">
                    <button
                      onClick={() => updateRegistration(r.id, 'Paid', 'Confirmed')}
                      className="px-3 py-1.5 text-xs font-medium rounded bg-green-100 text-green-700 hover:bg-green-200"
                    >
                      Confirm Payment
                    </button>
                    <button
                      onClick={() => updateRegistration(r.id, 'Unpaid', 'Pending Registration')}
                      className="px-3 py-1.5 text-xs font-medium rounded bg-yellow-100 text-yellow-700 hover:bg-yellow-200"
                    >
                      Set Pending
                    </button>
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
    </div>
  );
}
