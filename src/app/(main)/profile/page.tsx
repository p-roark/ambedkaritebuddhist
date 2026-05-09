'use client';

import { useEffect, useState } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';

type Profile = {
  id: string;
  name: string;
  email: string;
  image: string | null;
  phone: string | null;
  altPhone: string | null;
  addressLine1: string | null;
  addressLine2: string | null;
  city: string | null;
  province: string | null;
  postalCode: string | null;
  education: string | null;
  interests: string | null;
  notes: string | null;
};

type FamilyMember = {
  id: string;
  userId: string;
  name: string;
  relationship: string;
  age: number | null;
  notes: string | null;
  email: string | null;
  inviteStatus: string;
  linkedUserId: string | null;
};

const RELATIONSHIP_OPTIONS = [
  'Spouse',
  'Father',
  'Mother',
  'Son',
  'Daughter',
  'Brother',
  'Sister',
  'Grandparent',
  'Grandchild',
  'Other',
];

export default function ProfilePage() {
  const { data: session, status } = useSession();
  const router = useRouter();

  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState('');
  const [showDetails, setShowDetails] = useState(false);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [familyMembers, setFamilyMembers] = useState<FamilyMember[]>([]);

  const [newMember, setNewMember] = useState({
    name: '',
    relationship: '',
    age: '',
    notes: '',
    email: '',
  });

  useEffect(() => {
    if (status === 'unauthenticated') router.push('/auth/login');
  }, [status, router]);

  const loadData = async () => {
    const [profileRes, familyRes] = await Promise.all([
      fetch('/api/profile', { cache: 'no-store' }),
      fetch('/api/profile/family', { cache: 'no-store' }),
    ]);

    if (!profileRes.ok || !familyRes.ok) {
      throw new Error('Failed to load profile');
    }

    const profileData = (await profileRes.json()) as { profile: Profile };
    const familyData = (await familyRes.json()) as { familyMembers: FamilyMember[] };

    setProfile(profileData.profile);
    setFamilyMembers(familyData.familyMembers);
  };

  useEffect(() => {
    if (status !== 'authenticated') return;
    let alive = true;
    const run = async () => {
      try {
        await loadData();
      } catch (error) {
        console.error(error);
      } finally {
        if (alive) setLoading(false);
      }
    };
    void run();
    return () => {
      alive = false;
    };
  }, [status]);

  const saveProfile = async () => {
    if (!profile) return;
    setMessage('');
    const res = await fetch('/api/profile', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(profile),
    });
    const data = (await res.json()) as { error?: string };
    if (!res.ok) {
      setMessage(data.error ?? 'Failed to save profile');
      return;
    }
    setMessage('Profile saved.');
  };

  const addFamilyMember = async () => {
    if (!newMember.name.trim() || !newMember.relationship.trim()) {
      setMessage('Family member name and relationship are required.');
      return;
    }

    const res = await fetch('/api/profile/family', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        name: newMember.name.trim(),
        relationship: newMember.relationship.trim(),
        age: newMember.age ? Number(newMember.age) : null,
        notes: newMember.notes.trim(),
        email: newMember.email.trim() || undefined,
      }),
    });
    const data = (await res.json()) as { error?: string };
    if (!res.ok) {
      setMessage(data.error ?? 'Failed to add family member');
      return;
    }

    setNewMember({ name: '', relationship: '', age: '', notes: '', email: '' });
    await loadData();
    setMessage('Family member added.');
  };

  const saveFamilyMember = async (member: FamilyMember) => {
    const res = await fetch('/api/profile/family', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(member),
    });
    const data = (await res.json()) as { error?: string };
    if (!res.ok) {
      setMessage(data.error ?? 'Failed to update family member');
      return;
    }
    setMessage('Family member updated.');
  };

  const removeFamilyMember = async (id: string) => {
    const res = await fetch('/api/profile/family', {
      method: 'DELETE',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id }),
    });
    const data = (await res.json()) as { error?: string };
    if (!res.ok) {
      setMessage(data.error ?? 'Failed to remove family member');
      return;
    }
    await loadData();
    setMessage('Family member removed.');
  };

  if (status === 'loading' || loading || !profile) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background-light">
      {/* Page Header */}
      <div
        className="py-12 md:py-16 relative overflow-hidden"
        style={{ background: 'linear-gradient(135deg, #2D4D9B 0%, #7F56D9 55%, #FF6B35 100%)' }}
      >
        <div className="absolute -top-16 -right-16 w-64 h-64 rounded-full bg-white/5" />
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 flex items-center gap-5 relative z-10">
          {profile.image ? (
            <img
              src={profile.image}
              alt={profile.name}
              className="w-16 h-16 rounded-full object-cover ring-4 ring-white/30 flex-shrink-0"
            />
          ) : (
            <div className="w-16 h-16 rounded-full bg-white/20 flex items-center justify-center text-2xl font-bold text-white flex-shrink-0">
              {profile.name.charAt(0).toUpperCase()}
            </div>
          )}
          <div>
            <h1 className="text-2xl md:text-3xl font-bold text-white font-poppins">{profile.name}</h1>
            <p className="text-sm text-white/80 mt-0.5">Manage your profile settings and family members</p>
          </div>
        </div>
      </div>

      {session?.user?.pendingFamilyInvite && (
        <div className="bg-amber-50 border-b border-amber-200 px-4 py-3">
          <div className="max-w-6xl mx-auto flex items-center gap-3 text-sm text-amber-800">
            <svg className="w-4 h-4 flex-shrink-0" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" d="M13 16h-1v-4h-1m1-4h.01M12 2a10 10 0 100 20A10 10 0 0012 2z" />
            </svg>
            <span>You've been added as a family member.</span>
            <Link
              href={`/family/accept-invite?code=${session.user.pendingFamilyInvite}`}
              className="font-semibold underline hover:text-amber-900"
            >
              Click here to link your account
            </Link>
          </div>
        </div>
      )}

      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6">
        <div className="bg-white rounded-2xl border border-background-gray shadow-sm p-6">
          <div className="mb-5">
            <h2 className="text-xl font-bold text-text-dark">Personal Details</h2>
            <p className="text-sm text-text-medium mt-0.5">Update your contact and profile information.</p>
          </div>

          {message && <p className="mt-3 text-sm text-primary-blue bg-blue-50 px-4 py-2 rounded-lg border border-blue-100">{message}</p>}

          <div className="mt-5 grid grid-cols-1 md:grid-cols-2 gap-4">
            <label className="text-sm">
              <span className="mb-1 block font-medium text-slate-700">Full Name</span>
              <input value={profile.name ?? ''} onChange={(e) => setProfile({ ...profile, name: e.target.value })} className="w-full px-3 py-2 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary-blue/30 focus:border-primary-blue transition-colors" />
            </label>
            <label className="text-sm">
              <span className="mb-1 block font-medium text-slate-700">Email</span>
              <input value={profile.email ?? ''} disabled className="w-full px-3 py-2 border border-slate-200 rounded-xl text-sm bg-slate-50 text-slate-400 cursor-not-allowed" />
            </label>
          </div>

          <button
            type="button"
            onClick={() => setShowDetails((v) => !v)}
            className="mt-4 flex items-center gap-1.5 text-sm text-blue-600 hover:text-blue-800 font-medium"
          >
            <svg
              className={`w-4 h-4 transition-transform ${showDetails ? 'rotate-90' : ''}`}
              fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24"
            >
              <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
            </svg>
            {showDetails ? 'Hide details' : 'More details'}
          </button>

          {showDetails && (
            <div className="mt-4 grid grid-cols-1 md:grid-cols-2 gap-4">
              <label className="text-sm">
                <span className="mb-1 block font-medium text-slate-700">Phone</span>
                <input value={profile.phone ?? ''} onChange={(e) => setProfile({ ...profile, phone: e.target.value })} className="w-full px-3 py-2 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary-blue/30 focus:border-primary-blue transition-colors" />
              </label>
              <label className="text-sm">
                <span className="mb-1 block font-medium text-slate-700">Alternate Phone</span>
                <input value={profile.altPhone ?? ''} onChange={(e) => setProfile({ ...profile, altPhone: e.target.value })} className="w-full px-3 py-2 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary-blue/30 focus:border-primary-blue transition-colors" />
              </label>
              <label className="text-sm md:col-span-2">
                <span className="mb-1 block font-medium text-slate-700">Address Line 1</span>
                <input value={profile.addressLine1 ?? ''} onChange={(e) => setProfile({ ...profile, addressLine1: e.target.value })} className="w-full px-3 py-2 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary-blue/30 focus:border-primary-blue transition-colors" />
              </label>
              <label className="text-sm md:col-span-2">
                <span className="mb-1 block font-medium text-slate-700">Address Line 2</span>
                <input value={profile.addressLine2 ?? ''} onChange={(e) => setProfile({ ...profile, addressLine2: e.target.value })} className="w-full px-3 py-2 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary-blue/30 focus:border-primary-blue transition-colors" />
              </label>
              <label className="text-sm">
                <span className="mb-1 block font-medium text-slate-700">City</span>
                <input value={profile.city ?? ''} onChange={(e) => setProfile({ ...profile, city: e.target.value })} className="w-full px-3 py-2 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary-blue/30 focus:border-primary-blue transition-colors" />
              </label>
              <label className="text-sm">
                <span className="mb-1 block font-medium text-slate-700">Province/State</span>
                <input value={profile.province ?? ''} onChange={(e) => setProfile({ ...profile, province: e.target.value })} className="w-full px-3 py-2 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary-blue/30 focus:border-primary-blue transition-colors" />
              </label>
              <label className="text-sm">
                <span className="mb-1 block font-medium text-slate-700">Postal Code</span>
                <input value={profile.postalCode ?? ''} onChange={(e) => setProfile({ ...profile, postalCode: e.target.value })} className="w-full px-3 py-2 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary-blue/30 focus:border-primary-blue transition-colors" />
              </label>
              <label className="text-sm md:col-span-2">
                <span className="mb-1 block font-medium text-slate-700">Education</span>
                <input value={profile.education ?? ''} onChange={(e) => setProfile({ ...profile, education: e.target.value })} className="w-full px-3 py-2 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary-blue/30 focus:border-primary-blue transition-colors" />
              </label>
              <label className="text-sm md:col-span-2">
                <span className="mb-1 block font-medium text-slate-700">Hobbies / Interests</span>
                <input value={profile.interests ?? ''} onChange={(e) => setProfile({ ...profile, interests: e.target.value })} className="w-full px-3 py-2 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary-blue/30 focus:border-primary-blue transition-colors" />
              </label>
              <label className="text-sm md:col-span-2">
                <span className="mb-1 block font-medium text-slate-700">Other Notes</span>
                <textarea value={profile.notes ?? ''} onChange={(e) => setProfile({ ...profile, notes: e.target.value })} rows={3} className="w-full px-3 py-2 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary-blue/30 focus:border-primary-blue transition-colors" />
              </label>
            </div>
          )}

          <div className="mt-5 flex justify-end">
            <button onClick={saveProfile} className="px-6 py-2.5 rounded-xl bg-primary-blue text-white text-sm font-bold hover:bg-primary-blue/90 transition-colors">
              Save Profile
            </button>
          </div>
        </div>

        <div className="bg-white rounded-2xl border border-background-gray shadow-sm p-6">
          <h2 className="text-xl font-bold text-text-dark">Family Members</h2>
          <p className="text-sm text-text-medium mt-1">Add and manage family members for registrations and planning.</p>

          <div className="mt-4 rounded-xl border border-background-gray bg-background-light p-4">
            <h3 className="text-sm font-semibold text-text-dark mb-3">Add Family Member</h3>
            <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
              <label className="text-sm">
                <span className="mb-1 block font-medium text-slate-700">Full Name</span>
                <input
                  value={newMember.name}
                  onChange={(e) => setNewMember((prev) => ({ ...prev, name: e.target.value }))}
                  className="w-full px-3 py-2 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary-blue/30 focus:border-primary-blue transition-colors"
                />
              </label>
              <label className="text-sm">
                <span className="mb-1 block font-medium text-slate-700">Relationship</span>
                <select
                  value={newMember.relationship}
                  onChange={(e) => setNewMember((prev) => ({ ...prev, relationship: e.target.value }))}
                  className="w-full px-3 py-2 border border-slate-200 rounded-xl text-sm bg-white focus:outline-none focus:ring-2 focus:ring-primary-blue/30 focus:border-primary-blue transition-colors"
                >
                  <option value="">Select relationship</option>
                  {RELATIONSHIP_OPTIONS.map((option) => (
                    <option key={option} value={option}>
                      {option}
                    </option>
                  ))}
                </select>
              </label>
              <label className="text-sm">
                <span className="mb-1 block font-medium text-slate-700">Age</span>
                <input
                  type="number"
                  min={0}
                  value={newMember.age}
                  onChange={(e) => setNewMember((prev) => ({ ...prev, age: e.target.value }))}
                  className="w-full px-3 py-2 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary-blue/30 focus:border-primary-blue transition-colors"
                />
              </label>
              <div className="flex items-end">
                <button onClick={addFamilyMember} className="w-full px-4 py-2 bg-primary-blue text-white text-sm font-bold rounded-xl hover:bg-primary-blue/90 transition-colors">
                  Add Member
                </button>
              </div>
              <label className="text-sm md:col-span-2">
                <span className="mb-1 block font-medium text-slate-700">Email (Optional — sends a link invite)</span>
                <input
                  type="email"
                  value={newMember.email}
                  onChange={(e) => setNewMember((prev) => ({ ...prev, email: e.target.value }))}
                  placeholder="family.member@email.com"
                  className="w-full px-3 py-2 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary-blue/30 focus:border-primary-blue transition-colors"
                />
              </label>
              <label className="text-sm md:col-span-2">
                <span className="mb-1 block font-medium text-slate-700">Notes (Optional)</span>
                <input
                  value={newMember.notes}
                  onChange={(e) => setNewMember((prev) => ({ ...prev, notes: e.target.value }))}
                  className="w-full px-3 py-2 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary-blue/30 focus:border-primary-blue transition-colors"
                />
              </label>
            </div>
          </div>

          <div className="mt-5 space-y-3">
            {familyMembers.map((member, idx) => (
              <div key={member.id} className="border border-background-gray rounded-2xl p-4 bg-white">
                <div className="flex items-center gap-2 mb-3">
                  {member.linkedUserId && (
                    <span className="inline-flex items-center gap-1 text-xs font-semibold text-green-700 bg-green-50 border border-green-200 px-2 py-0.5 rounded-full">
                      <svg className="w-3 h-3" fill="none" stroke="currentColor" strokeWidth={2.5} viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" /></svg>
                      Linked
                    </span>
                  )}
                  {!member.linkedUserId && member.inviteStatus === 'pending' && (
                    <span className="text-xs font-semibold text-amber-700 bg-amber-50 border border-amber-200 px-2 py-0.5 rounded-full">
                      Invite Sent
                    </span>
                  )}
                </div>
                <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
                  <label className="text-sm">
                    <span className="mb-1 block font-medium text-slate-700">Full Name</span>
                    <input
                      value={member.name}
                      onChange={(e) =>
                        setFamilyMembers((prev) =>
                          prev.map((m, i) => (i === idx ? { ...m, name: e.target.value } : m)),
                        )
                      }
                      className="w-full px-3 py-2 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary-blue/30 focus:border-primary-blue transition-colors"
                    />
                  </label>
                  <label className="text-sm">
                    <span className="mb-1 block font-medium text-slate-700">Relationship</span>
                    <select
                      value={member.relationship}
                      onChange={(e) =>
                        setFamilyMembers((prev) =>
                          prev.map((m, i) => (i === idx ? { ...m, relationship: e.target.value } : m)),
                        )
                      }
                      className="w-full px-3 py-2 border border-slate-200 rounded-xl text-sm bg-white focus:outline-none focus:ring-2 focus:ring-primary-blue/30 focus:border-primary-blue transition-colors"
                    >
                      <option value="">Select relationship</option>
                      {RELATIONSHIP_OPTIONS.map((option) => (
                        <option key={option} value={option}>
                          {option}
                        </option>
                      ))}
                    </select>
                  </label>
                  <label className="text-sm">
                    <span className="mb-1 block font-medium text-slate-700">Age</span>
                    <input
                      type="number"
                      min={0}
                      value={member.age ?? ''}
                      onChange={(e) =>
                        setFamilyMembers((prev) =>
                          prev.map((m, i) => (i === idx ? { ...m, age: e.target.value ? Number(e.target.value) : null } : m)),
                        )
                      }
                      className="w-full px-3 py-2 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary-blue/30 focus:border-primary-blue transition-colors"
                    />
                  </label>
                  <div className="flex gap-2">
                    <button onClick={() => saveFamilyMember(member)} className="flex-1 px-3 py-2 text-xs bg-primary-blue text-white rounded-xl font-semibold hover:bg-primary-blue/90 transition-colors">
                      Save
                    </button>
                    <button onClick={() => removeFamilyMember(member.id)} className="flex-1 px-3 py-2 text-xs bg-red-50 text-red-600 border border-red-100 rounded-xl font-semibold hover:bg-red-100 transition-colors">
                      Remove
                    </button>
                  </div>
                  <label className="text-sm md:col-span-4">
                    <span className="mb-1 block font-medium text-slate-700">Notes (Optional)</span>
                    <input
                      value={member.notes ?? ''}
                      onChange={(e) =>
                        setFamilyMembers((prev) =>
                          prev.map((m, i) => (i === idx ? { ...m, notes: e.target.value } : m)),
                        )
                      }
                      className="w-full px-3 py-2 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary-blue/30 focus:border-primary-blue transition-colors"
                    />
                  </label>
                </div>
              </div>
            ))}
            {familyMembers.length === 0 && <p className="text-sm text-slate-500">No family members added yet.</p>}
          </div>
        </div>
      </div>
    </div>
  );
}
