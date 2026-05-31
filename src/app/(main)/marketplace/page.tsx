'use client';

import { useEffect, useState } from 'react';
import { useSession } from 'next-auth/react';

const CATEGORIES = ['All', 'Books', 'Idols', 'Clothing', 'Art', 'Educational', 'Other'];

type MarketplaceItem = {
  id: string;
  title: string;
  description: string;
  category: string;
  price: string | null;
  imageUrl: string | null;
  contactInfo: string | null;
  status: string;
  createdAt: string;
};

function PriceTag({ price }: { price: string | null }) {
  if (!price) return <span className="text-sm text-gray-500 italic">Price on request</span>;
  if (price === '0') return <span className="text-sm font-semibold text-green-700">Free</span>;
  return <span className="text-sm font-semibold text-primary-blue">${price}</span>;
}

function ItemCard({ item }: { item: MarketplaceItem }) {
  const [expanded, setExpanded] = useState(false);

  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden hover:shadow-md transition-shadow">
      {item.imageUrl ? (
        <div className="h-48 bg-gray-100 overflow-hidden">
          <img
            src={item.imageUrl}
            alt={item.title}
            className="w-full h-full object-cover"
            loading="lazy"
          />
        </div>
      ) : (
        <div className="h-48 bg-gradient-to-br from-primary-saffron/20 to-primary-blue/10 flex items-center justify-center">
          <span className="text-4xl">{getCategoryEmoji(item.category)}</span>
        </div>
      )}

      <div className="p-4">
        <div className="flex items-start justify-between gap-2 mb-2">
          <h3 className="font-semibold text-gray-900 text-sm leading-snug">{item.title}</h3>
          <span className="shrink-0 text-xs px-2 py-0.5 rounded-full bg-blue-50 text-primary-blue font-medium">
            {item.category}
          </span>
        </div>

        {item.description && (
          <p className="text-sm text-gray-600 mb-3 line-clamp-2">{item.description}</p>
        )}

        <div className="flex items-center justify-between">
          <PriceTag price={item.price} />
          <button
            onClick={() => setExpanded(true)}
            className="text-xs text-primary-blue hover:underline font-medium"
          >
            View details
          </button>
        </div>
      </div>

      {expanded && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50"
          onClick={() => setExpanded(false)}
        >
          <div
            className="bg-white rounded-2xl shadow-xl max-w-lg w-full p-6 relative"
            onClick={(e) => e.stopPropagation()}
          >
            <button
              onClick={() => setExpanded(false)}
              className="absolute top-4 right-4 text-gray-400 hover:text-gray-700"
              aria-label="Close"
            >
              ✕
            </button>

            {item.imageUrl && (
              <img
                src={item.imageUrl}
                alt={item.title}
                className="w-full h-56 object-cover rounded-xl mb-4"
              />
            )}

            <div className="flex items-center gap-2 mb-3">
              <span className="text-xs px-2 py-0.5 rounded-full bg-blue-50 text-primary-blue font-medium">
                {item.category}
              </span>
              <PriceTag price={item.price} />
            </div>

            <h2 className="text-xl font-bold text-gray-900 mb-2">{item.title}</h2>

            {item.description && (
              <p className="text-sm text-gray-600 mb-4">{item.description}</p>
            )}

            {item.contactInfo && (
              <div className="bg-blue-50 rounded-lg p-3 border border-primary-blue/20">
                <p className="text-xs font-semibold text-primary-blue mb-1">How to get this item</p>
                <p className="text-sm text-gray-700 whitespace-pre-line">{item.contactInfo}</p>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

function getCategoryEmoji(category: string) {
  const map: Record<string, string> = {
    Books: '📚',
    Idols: '🙏',
    Clothing: '👗',
    Art: '🎨',
    Educational: '🎓',
    Other: '☸️',
  };
  return map[category] ?? '☸️';
}

type RequestFormState = {
  submitterName: string;
  submitterEmail: string;
  submitterPhone: string;
  itemTitle: string;
  itemDescription: string;
  itemCategory: string;
  askingPrice: string;
  message: string;
};

const EMPTY_FORM: RequestFormState = {
  submitterName: '',
  submitterEmail: '',
  submitterPhone: '',
  itemTitle: '',
  itemDescription: '',
  itemCategory: 'Other',
  askingPrice: '',
  message: '',
};

export default function MarketplacePage() {
  const { data: session } = useSession();
  const [items, setItems] = useState<MarketplaceItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeCategory, setActiveCategory] = useState('All');
  const [showRequestForm, setShowRequestForm] = useState(false);
  const [form, setForm] = useState<RequestFormState>(EMPTY_FORM);
  const [submitting, setSubmitting] = useState(false);
  const [submitMessage, setSubmitMessage] = useState('');

  useEffect(() => {
    const url = activeCategory === 'All' ? '/api/marketplace' : `/api/marketplace?category=${activeCategory}`;
    fetch(url)
      .then((r) => r.json() as Promise<{ items: MarketplaceItem[] }>)
      .then((data) => setItems(data.items ?? []))
      .catch(() => setItems([]))
      .finally(() => setLoading(false));
  }, [activeCategory]);

  useEffect(() => {
    if (session?.user) {
      setForm((f) => ({
        ...f,
        submitterName: f.submitterName || session.user?.name || '',
        submitterEmail: f.submitterEmail || session.user?.email || '',
      }));
    }
  }, [session]);

  const handleSubmitRequest = async () => {
    setSubmitMessage('');
    if (!form.submitterName.trim() || !form.submitterEmail.trim() || !form.itemTitle.trim()) {
      setSubmitMessage('Please fill in your name, email, and item title.');
      return;
    }
    setSubmitting(true);
    try {
      const res = await fetch('/api/marketplace', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...form, userId: session?.user?.id ?? null }),
      });
      if (res.ok) {
        setSubmitMessage('Your request has been submitted! An admin will review it shortly.');
        setForm(EMPTY_FORM);
        setTimeout(() => {
          setShowRequestForm(false);
          setSubmitMessage('');
        }, 3000);
      } else {
        const data = (await res.json()) as { error?: string };
        setSubmitMessage(data.error ?? 'Failed to submit request. Please try again.');
      }
    } catch {
      setSubmitMessage('An error occurred. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Hero */}
      <div className="bg-gradient-to-r from-primary-blue to-primary-blue/80 text-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-14">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div>
              <h1 className="text-3xl md:text-4xl font-bold mb-2">☸️ Community Marketplace</h1>
              <p className="text-white/80 text-sm md:text-base max-w-xl">
                Browse Ambedkarite Buddhist books, idols, art, and community items. All listings are curated by ABCC admins.
              </p>
            </div>
            <button
              onClick={() => setShowRequestForm(true)}
              className="shrink-0 px-5 py-2.5 bg-primary-saffron hover:bg-primary-saffron/90 text-white font-semibold rounded-lg transition-colors text-sm"
            >
              + Request a Listing
            </button>
          </div>
        </div>
      </div>

      {/* Category filter */}
      <div className="bg-white border-b shadow-sm sticky top-20 z-30">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 overflow-x-auto scrollbar-none">
          <div className="flex gap-2 py-3 min-w-max">
            {CATEGORIES.map((cat) => (
              <button
                key={cat}
                onClick={() => { setActiveCategory(cat); setLoading(true); }}
                className={`px-4 py-1.5 rounded-full text-sm font-medium transition-colors ${
                  activeCategory === cat
                    ? 'bg-primary-blue text-white'
                    : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                }`}
              >
                {getCategoryEmoji(cat)} {cat}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Items grid */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
        {loading ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {Array.from({ length: 8 }).map((_, i) => (
              <div key={i} className="bg-white rounded-xl h-64 animate-pulse border border-gray-100" />
            ))}
          </div>
        ) : items.length === 0 ? (
          <div className="text-center py-20">
            <p className="text-4xl mb-4">☸️</p>
            <h2 className="text-xl font-semibold text-gray-700 mb-2">No items yet in this category</h2>
            <p className="text-gray-500 text-sm mb-6">
              Be the first to request a listing — admins will review and publish it.
            </p>
            <button
              onClick={() => setShowRequestForm(true)}
              className="px-5 py-2.5 bg-primary-blue text-white font-medium rounded-lg hover:bg-primary-blue/90 transition-colors text-sm"
            >
              Request a Listing
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {items.map((item) => (
              <ItemCard key={item.id} item={item} />
            ))}
          </div>
        )}
      </div>

      {/* Request Listing Modal */}
      {showRequestForm && (
        <div
          className="fixed inset-0 z-50 flex items-start justify-center p-4 pt-20 bg-black/50 overflow-y-auto"
          onClick={() => setShowRequestForm(false)}
        >
          <div
            className="bg-white rounded-2xl shadow-xl max-w-lg w-full p-6 relative my-4"
            onClick={(e) => e.stopPropagation()}
          >
            <button
              onClick={() => setShowRequestForm(false)}
              className="absolute top-4 right-4 text-gray-400 hover:text-gray-700"
              aria-label="Close"
            >
              ✕
            </button>

            <h2 className="text-xl font-bold text-gray-900 mb-1">Request a Listing</h2>
            <p className="text-sm text-gray-500 mb-5">
              Submit your item for admin review. Once approved, it will appear in the marketplace.
            </p>

            {submitMessage && (
              <p className={`mb-4 text-sm p-3 rounded-lg ${submitMessage.includes('submitted') ? 'bg-green-50 text-green-700' : 'bg-red-50 text-red-700'}`}>
                {submitMessage}
              </p>
            )}

            <div className="space-y-3">
              <div className="grid grid-cols-2 gap-3">
                <label className="text-sm text-gray-700">
                  <span className="mb-1 block font-medium">Your name <span className="text-red-500">*</span></span>
                  <input
                    type="text"
                    value={form.submitterName}
                    onChange={(e) => setForm((f) => ({ ...f, submitterName: e.target.value }))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-primary-blue"
                    placeholder="Full name"
                  />
                </label>
                <label className="text-sm text-gray-700">
                  <span className="mb-1 block font-medium">Email <span className="text-red-500">*</span></span>
                  <input
                    type="email"
                    value={form.submitterEmail}
                    onChange={(e) => setForm((f) => ({ ...f, submitterEmail: e.target.value }))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-primary-blue"
                    placeholder="you@example.com"
                  />
                </label>
              </div>

              <label className="text-sm text-gray-700">
                <span className="mb-1 block font-medium">Phone (optional)</span>
                <input
                  type="tel"
                  value={form.submitterPhone}
                  onChange={(e) => setForm((f) => ({ ...f, submitterPhone: e.target.value }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-primary-blue"
                  placeholder="+1 (xxx) xxx-xxxx"
                />
              </label>

              <label className="text-sm text-gray-700">
                <span className="mb-1 block font-medium">Item title <span className="text-red-500">*</span></span>
                <input
                  type="text"
                  value={form.itemTitle}
                  onChange={(e) => setForm((f) => ({ ...f, itemTitle: e.target.value }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-primary-blue"
                  placeholder="e.g. Dr. Ambedkar: The Life and Mission"
                />
              </label>

              <div className="grid grid-cols-2 gap-3">
                <label className="text-sm text-gray-700">
                  <span className="mb-1 block font-medium">Category</span>
                  <select
                    value={form.itemCategory}
                    onChange={(e) => setForm((f) => ({ ...f, itemCategory: e.target.value }))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm bg-white focus:outline-none focus:ring-2 focus:ring-primary-blue"
                  >
                    {CATEGORIES.filter((c) => c !== 'All').map((c) => (
                      <option key={c} value={c}>{c}</option>
                    ))}
                  </select>
                </label>
                <label className="text-sm text-gray-700">
                  <span className="mb-1 block font-medium">Asking price (optional)</span>
                  <input
                    type="text"
                    value={form.askingPrice}
                    onChange={(e) => setForm((f) => ({ ...f, askingPrice: e.target.value }))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-primary-blue"
                    placeholder="e.g. $20 or Free"
                  />
                </label>
              </div>

              <label className="text-sm text-gray-700">
                <span className="mb-1 block font-medium">Item description</span>
                <textarea
                  rows={3}
                  value={form.itemDescription}
                  onChange={(e) => setForm((f) => ({ ...f, itemDescription: e.target.value }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-primary-blue"
                  placeholder="Describe the item — condition, author, etc."
                />
              </label>

              <label className="text-sm text-gray-700">
                <span className="mb-1 block font-medium">Additional message (optional)</span>
                <textarea
                  rows={2}
                  value={form.message}
                  onChange={(e) => setForm((f) => ({ ...f, message: e.target.value }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-primary-blue"
                  placeholder="Anything else you'd like the admin to know"
                />
              </label>
            </div>

            <div className="flex gap-3 mt-5">
              <button
                onClick={() => setShowRequestForm(false)}
                className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg text-sm font-medium hover:bg-gray-50"
              >
                Cancel
              </button>
              <button
                onClick={handleSubmitRequest}
                disabled={submitting}
                className="flex-1 px-4 py-2 bg-primary-blue text-white rounded-lg text-sm font-semibold hover:bg-primary-blue/90 disabled:opacity-50"
              >
                {submitting ? 'Submitting…' : 'Submit Request'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
