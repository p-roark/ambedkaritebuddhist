'use client';

import { FormEvent, useEffect, useState } from 'react';

interface OrgInfo {
  email: string;
  phone: string | null;
  addressLine1: string | null;
  addressLine2: string | null;
  city: string | null;
  province: string | null;
  postalCode: string | null;
  country: string;
}

export default function ContactPage() {
  const [org, setOrg] = useState<OrgInfo | null>(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [message, setMessage] = useState('');
  const [form, setForm] = useState({
    name: '',
    email: '',
    phone: '',
    subject: '',
    message: '',
  });

  useEffect(() => {
    const loadContactData = async () => {
      try {
        const response = await fetch('/api/events?resource=org-settings');
        const data = (await response.json()) as { settings: OrgInfo };
        setOrg(data.settings);
      } catch (error) {
        console.error('Failed to load contact info:', error);
      } finally {
        setLoading(false);
      }
    };

    void loadContactData();
  }, []);

  const onSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    setMessage('');

    try {
      const res = await fetch('/api/contact/messages', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form),
      });

      const data = (await res.json()) as { error?: string };
      if (!res.ok) {
        setMessage(data.error ?? 'Failed to submit message');
        return;
      }

      setMessage('Your message was sent. An admin will respond soon.');
      setForm({ name: '', email: '', phone: '', subject: '', message: '' });
    } catch {
      setMessage('Unable to submit right now. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-white flex items-center justify-center">
        <p className="text-lg text-text-medium">Loading...</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-white">
      <section className="bg-gradient-to-br from-primary-blue via-accent-purple to-accent-orange py-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h1 className="text-4xl md:text-5xl font-bold text-white mb-4">Contact Us</h1>
          <p className="text-xl text-white/90 max-w-2xl mx-auto">
            Send your question, request, or feedback. Our admins review messages and respond directly.
          </p>
        </div>
      </section>

      <section className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-20 space-y-6">
        <div className="rounded-2xl border border-slate-200 bg-gradient-to-r from-blue-50 to-orange-50 shadow-sm p-6 md:p-8">
          <h2 className="text-2xl font-bold text-slate-900">Contact Information</h2>
          <div className="mt-4 grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="rounded-xl bg-white border border-slate-200 p-4">
              <p className="text-xs uppercase tracking-wide text-slate-500 font-semibold">Email</p>
              <a
                href={`mailto:${org?.email ?? ''}`}
                className="mt-1 block text-base text-primary-blue hover:text-primary-saffron transition-colors"
              >
                {org?.email ?? 'Not available'}
              </a>
            </div>
            {org?.phone && (
              <div className="rounded-xl bg-white border border-slate-200 p-4">
                <p className="text-xs uppercase tracking-wide text-slate-500 font-semibold">Phone</p>
                <a
                  href={`tel:${org.phone}`}
                  className="mt-1 block text-base text-primary-blue hover:text-primary-saffron transition-colors"
                >
                  {org.phone}
                </a>
              </div>
            )}
            {(org?.addressLine1 ?? org?.city) && (
              <div className="rounded-xl bg-white border border-slate-200 p-4 sm:col-span-2">
                <p className="text-xs uppercase tracking-wide text-slate-500 font-semibold">Address</p>
                <p className="mt-1 text-base text-slate-700">
                  {[org?.addressLine1, org?.addressLine2, org?.city, org?.province, org?.postalCode, org?.country]
                    .filter(Boolean)
                    .join(', ')}
                </p>
              </div>
            )}
          </div>
        </div>

        <form onSubmit={onSubmit} className="rounded-2xl border border-slate-200 bg-white shadow-sm p-6 md:p-8 space-y-4">
          <h2 className="text-2xl font-bold text-slate-900">Send a Message</h2>

          <label className="text-sm text-slate-700">
            <span className="mb-1 block font-medium">Full Name</span>
            <input
              required
              value={form.name}
              onChange={(e) => setForm((prev) => ({ ...prev, name: e.target.value }))}
              className="w-full px-3 py-2 border border-slate-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </label>

          <label className="text-sm text-slate-700">
            <span className="mb-1 block font-medium">Email</span>
            <input
              required
              type="email"
              value={form.email}
              onChange={(e) => setForm((prev) => ({ ...prev, email: e.target.value }))}
              className="w-full px-3 py-2 border border-slate-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </label>

          <label className="text-sm text-slate-700">
            <span className="mb-1 block font-medium">Phone (Optional)</span>
            <input
              value={form.phone}
              onChange={(e) => setForm((prev) => ({ ...prev, phone: e.target.value }))}
              className="w-full px-3 py-2 border border-slate-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </label>

          <label className="text-sm text-slate-700">
            <span className="mb-1 block font-medium">Subject</span>
            <input
              required
              value={form.subject}
              onChange={(e) => setForm((prev) => ({ ...prev, subject: e.target.value }))}
              className="w-full px-3 py-2 border border-slate-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </label>

          <label className="text-sm text-slate-700">
            <span className="mb-1 block font-medium">Message</span>
            <textarea
              required
              rows={7}
              value={form.message}
              onChange={(e) => setForm((prev) => ({ ...prev, message: e.target.value }))}
              className="w-full px-3 py-2 border border-slate-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </label>

          {message && <p className="text-sm text-blue-700">{message}</p>}

          <div className="flex justify-end">
            <button
              type="submit"
              disabled={submitting}
              className="px-5 py-2.5 rounded-md bg-blue-600 text-white text-sm font-medium hover:bg-blue-700 disabled:opacity-60"
            >
              {submitting ? 'Sending...' : 'Send Message'}
            </button>
          </div>
        </form>
      </section>
    </div>
  );
}
