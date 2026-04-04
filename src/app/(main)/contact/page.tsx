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
  const [success, setSuccess] = useState(false);
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
    setSuccess(false);

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

      setSuccess(true);
      setMessage('Your message was sent successfully. An admin will respond soon.');
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
        <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-primary-blue" />
      </div>
    );
  }

  const inputClass = 'w-full px-4 py-3 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary-blue/40 focus:border-primary-blue transition-colors bg-white';

  return (
    <div className="min-h-screen bg-white">
      {/* Hero */}
      <section
        className="relative py-28 md:py-36 overflow-hidden"
        style={{ background: 'linear-gradient(135deg, #2D4D9B 0%, #7F56D9 55%, #FF6B35 100%)' }}
      >
        <div className="absolute -top-24 -right-24 w-96 h-96 rounded-full bg-white/5" />
        <div className="absolute -bottom-16 -left-16 w-64 h-64 rounded-full bg-white/5" />
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center relative z-10">
          <p className="text-sm font-bold text-primary-saffron uppercase tracking-widest mb-4">Get In Touch</p>
          <h1 className="text-4xl md:text-6xl font-bold text-white mb-6 font-poppins">Contact Us</h1>
          <p className="text-lg md:text-xl text-white/90 max-w-2xl mx-auto leading-relaxed">
            Have a question, feedback, or want to get involved? Send us a message and our team will get back to you.
          </p>
        </div>
      </section>

      <section className="py-16 md:py-24 bg-background-light">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 lg:grid-cols-5 gap-8">

            {/* Contact Info Sidebar */}
            <div className="lg:col-span-2 space-y-4">
              <h2 className="text-2xl font-bold text-text-dark font-poppins mb-6">Contact Information</h2>

              {org?.email && (
                <div className="bg-white rounded-2xl border border-background-gray p-5 flex items-start gap-4 hover:shadow-md transition-shadow">
                  <div className="w-10 h-10 rounded-xl bg-blue-50 flex items-center justify-center flex-shrink-0 text-xl">✉️</div>
                  <div>
                    <p className="text-xs font-bold text-text-light uppercase tracking-wide mb-1">Email</p>
                    <a href={`mailto:${org.email}`} className="text-sm font-medium text-primary-blue hover:text-primary-saffron transition-colors break-all">
                      {org.email}
                    </a>
                  </div>
                </div>
              )}

              {org?.phone && (
                <div className="bg-white rounded-2xl border border-background-gray p-5 flex items-start gap-4 hover:shadow-md transition-shadow">
                  <div className="w-10 h-10 rounded-xl bg-orange-50 flex items-center justify-center flex-shrink-0 text-xl">📞</div>
                  <div>
                    <p className="text-xs font-bold text-text-light uppercase tracking-wide mb-1">Phone</p>
                    <a href={`tel:${org.phone}`} className="text-sm font-medium text-primary-blue hover:text-primary-saffron transition-colors">
                      {org.phone}
                    </a>
                  </div>
                </div>
              )}

              {(org?.addressLine1 ?? org?.city) && (
                <div className="bg-white rounded-2xl border border-background-gray p-5 flex items-start gap-4 hover:shadow-md transition-shadow">
                  <div className="w-10 h-10 rounded-xl bg-purple-50 flex items-center justify-center flex-shrink-0 text-xl">📍</div>
                  <div>
                    <p className="text-xs font-bold text-text-light uppercase tracking-wide mb-1">Address</p>
                    <p className="text-sm text-text-medium leading-relaxed">
                      {[org?.addressLine1, org?.addressLine2, org?.city, org?.province, org?.postalCode, org?.country]
                        .filter(Boolean)
                        .join(', ')}
                    </p>
                  </div>
                </div>
              )}

              {/* Decorative CTA */}
              <div
                className="rounded-2xl p-6 text-white mt-6"
                style={{ background: 'linear-gradient(135deg, #2D4D9B 0%, #7F56D9 100%)' }}
              >
                <p className="text-2xl mb-3">☸️</p>
                <p className="font-bold text-base mb-1">We&apos;d love to hear from you</p>
                <p className="text-sm text-white/80 leading-relaxed">Our volunteers review messages and respond as quickly as possible.</p>
              </div>
            </div>

            {/* Form */}
            <form onSubmit={onSubmit} className="lg:col-span-3 bg-white rounded-2xl border border-background-gray shadow-sm p-6 md:p-8 space-y-5">
              <h2 className="text-2xl font-bold text-text-dark font-poppins">Send a Message</h2>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <label className="text-sm">
                  <span className="mb-1.5 block font-semibold text-text-dark">Full Name <span className="text-red-400">*</span></span>
                  <input
                    required
                    value={form.name}
                    onChange={(e) => setForm((prev) => ({ ...prev, name: e.target.value }))}
                    placeholder="Your full name"
                    className={inputClass}
                  />
                </label>
                <label className="text-sm">
                  <span className="mb-1.5 block font-semibold text-text-dark">Email <span className="text-red-400">*</span></span>
                  <input
                    required
                    type="email"
                    value={form.email}
                    onChange={(e) => setForm((prev) => ({ ...prev, email: e.target.value }))}
                    placeholder="you@example.com"
                    className={inputClass}
                  />
                </label>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <label className="text-sm">
                  <span className="mb-1.5 block font-semibold text-text-dark">Phone <span className="text-text-light font-normal">(Optional)</span></span>
                  <input
                    value={form.phone}
                    onChange={(e) => setForm((prev) => ({ ...prev, phone: e.target.value }))}
                    placeholder="+1 (xxx) xxx-xxxx"
                    className={inputClass}
                  />
                </label>
                <label className="text-sm">
                  <span className="mb-1.5 block font-semibold text-text-dark">Subject <span className="text-red-400">*</span></span>
                  <input
                    required
                    value={form.subject}
                    onChange={(e) => setForm((prev) => ({ ...prev, subject: e.target.value }))}
                    placeholder="What is this about?"
                    className={inputClass}
                  />
                </label>
              </div>

              <label className="text-sm block">
                <span className="mb-1.5 block font-semibold text-text-dark">Message <span className="text-red-400">*</span></span>
                <textarea
                  required
                  rows={6}
                  value={form.message}
                  onChange={(e) => setForm((prev) => ({ ...prev, message: e.target.value }))}
                  placeholder="Tell us how we can help..."
                  className={inputClass}
                />
              </label>

              {message && (
                <p className={`text-sm px-4 py-3 rounded-xl ${success ? 'bg-green-50 text-green-700 border border-green-200' : 'bg-red-50 text-red-700 border border-red-200'}`}>
                  {message}
                </p>
              )}

              <div className="flex justify-end pt-2">
                <button
                  type="submit"
                  disabled={submitting}
                  className="px-8 py-3 rounded-xl bg-primary-blue text-white text-sm font-bold hover:bg-primary-blue/90 disabled:opacity-60 transition-colors shadow-sm"
                >
                  {submitting ? 'Sending...' : 'Send Message →'}
                </button>
              </div>
            </form>

          </div>
        </div>
      </section>
    </div>
  );
}
