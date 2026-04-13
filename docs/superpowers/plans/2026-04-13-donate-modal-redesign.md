# Donate Modal Redesign + Admin Donor List Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Restyle the donate modal to match event registration quality and add per-objective donor list with Interac reference confirm flow in the admin dashboard.

**Architecture:** Two isolated UI changes — `donate-modal.tsx` gets a full visual restyle (header, inputs, layout) with no logic changes; `dashboard/page.tsx` gets new state + UI for an expandable donor list inside each objective card. No new APIs or DB migrations needed — donations data is already loaded.

**Tech Stack:** Next.js 14 App Router, TypeScript, Tailwind CSS, Drizzle ORM (D1). Package manager: pnpm. Type check: `pnpm type-check` (runs `tsc --noEmit`).

---

## File Map

| File | Change |
|------|--------|
| `src/components/layout/donate-modal.tsx` | Full visual restyle — header, objective cards, form inputs, payment box, success screen |
| `src/app/(main)/dashboard/page.tsx` | New state vars + expandable donor list per objective card + inline confirm with Interac ref |

---

### Task 1: Restyle donate-modal.tsx — header, container, objective step

**Files:**
- Modify: `src/components/layout/donate-modal.tsx`

The event registration modal uses a gradient header and wider container. Match that exactly.

- [ ] **Step 1: Update modal container + header**

In `donate-modal.tsx`, replace the `<div className="bg-white rounded-2xl ...">` container and its header:

```tsx
// OLD container
<div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg max-h-[90vh] overflow-y-auto">
  {/* Header */}
  <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100">
    <h2 className="text-xl font-bold text-text-dark">🪷 Make a Donation</h2>
    <button
      onClick={onClose}
      aria-label="Close"
      className="p-2 rounded-full text-gray-500 hover:bg-gray-100 transition-colors"
    >
      <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" viewBox="0 0 24 24">
        <line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" />
      </svg>
    </button>
  </div>
```

```tsx
// NEW container
<div className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto flex flex-col">
  {/* Header */}
  <div className="px-5 sm:px-8 py-4 sm:py-5 bg-gradient-to-r from-primary-blue to-accent-purple flex justify-between items-start gap-3 flex-shrink-0">
    <div>
      <p className="text-xs font-semibold text-white/70 uppercase tracking-widest mb-0.5">Support Our Community</p>
      <h2 className="text-base sm:text-xl font-bold text-white leading-snug">🪷 Make a Donation</h2>
    </div>
    <button
      onClick={onClose}
      aria-label="Close"
      className="text-white/80 hover:text-white text-2xl font-semibold leading-none flex-shrink-0 mt-0.5"
    >×</button>
  </div>
```

Also wrap the body div to allow scrolling:
```tsx
// OLD
<div className="px-6 py-5">
```
```tsx
// NEW
<div className="overflow-y-auto flex-1 px-5 sm:px-8 py-5 sm:py-6 space-y-5">
```

- [ ] **Step 2: Restyle the objective selection step**

Replace the intro text and objective card list inside `{step === 'select' && (...)}`:

```tsx
// OLD intro paragraph
<p className="text-sm text-gray-600 mb-4">
  Select a cause you'd like to support. Donations are made via <strong>Interac e-Transfer</strong> to{' '}
  <span className="text-primary-blue font-medium">{INTERAC_EMAIL}</span>.
</p>
```

```tsx
// NEW intro — section label + payment notice card
<>
  <div className="flex items-center gap-2 mb-3">
    <div className="w-1 h-5 rounded-full bg-primary-blue flex-shrink-0" />
    <h4 className="text-sm font-bold text-gray-700 uppercase tracking-widest">Select a Cause</h4>
  </div>
  <div className="rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 mb-4">
    <p className="text-sm font-semibold text-amber-800 mb-1">💛 Donation Method: Interac e-Transfer</p>
    <p className="text-sm text-amber-900">Send your transfer to <span className="font-bold">{INTERAC_EMAIL}</span> — instructions will follow after you submit.</p>
  </div>
</>
```

For the objective cards, replace the button className logic:

```tsx
// OLD button
<button
  key={obj.id}
  onClick={() => { setSelectedId(obj.id); setError('') }}
  className={`w-full text-left p-4 rounded-xl border-2 transition-all duration-150 ${
    selectedId === obj.id
      ? 'border-primary-saffron bg-amber-50'
      : 'border-gray-200 hover:border-primary-saffron/50 hover:bg-gray-50'
  }`}
>
```

```tsx
// NEW button — same logic, tightened style
<button
  key={obj.id}
  onClick={() => { setSelectedId(obj.id); setError('') }}
  className={`w-full text-left p-4 rounded-xl border-2 transition-all duration-150 ${
    selectedId === obj.id
      ? 'border-primary-blue bg-blue-50'
      : 'border-gray-200 hover:border-primary-blue/40 hover:bg-gray-50'
  }`}
>
```

And update the radio dot to use primary-blue:
```tsx
// OLD radio dot colors
<div className={`mt-0.5 w-5 h-5 rounded-full border-2 flex-shrink-0 flex items-center justify-center transition-colors ${
  selectedId === obj.id ? 'border-primary-saffron bg-primary-saffron' : 'border-gray-300'
}`}>
```

```tsx
// NEW radio dot colors
<div className={`mt-0.5 w-5 h-5 rounded-full border-2 flex-shrink-0 flex items-center justify-center transition-colors ${
  selectedId === obj.id ? 'border-primary-blue bg-primary-blue' : 'border-gray-300'
}`}>
```

Replace the Continue button:
```tsx
// OLD
<button
  onClick={handleProceed}
  className="w-full py-3 rounded-xl font-semibold text-white bg-primary-saffron hover:bg-primary-saffron/90 transition-colors"
>
  Continue →
</button>
```

```tsx
// NEW
<button
  onClick={handleProceed}
  className="w-full py-3 rounded-xl font-semibold text-white bg-primary-blue hover:bg-primary-blue/90 transition-colors"
>
  Continue →
</button>
```

- [ ] **Step 3: Type-check**

```bash
cd /workspace/ambedkaritebuddhist-auth && pnpm type-check
```

Expected: no errors on donate-modal.tsx

- [ ] **Step 4: Commit**

```bash
cd /workspace/ambedkaritebuddhist-auth
git add src/components/layout/donate-modal.tsx
git commit -m "style: restyle donate modal header and objective selection step"
```

---

### Task 2: Restyle donate-modal.tsx — form step + success screen

**Files:**
- Modify: `src/components/layout/donate-modal.tsx`

- [ ] **Step 1: Restyle the donor form step**

Inside `{step === 'form' && (...)}`, replace the selected objective banner:

```tsx
// OLD selected objective banner
<div className="mb-4 p-3 rounded-xl bg-amber-50 border border-amber-200">
  <p className="text-xs text-amber-700 font-medium uppercase tracking-wide">Donating towards</p>
  <p className="font-semibold text-text-dark mt-0.5">{selectedObjective.title}</p>
</div>
```

```tsx
// NEW — section label style
{selectedObjective && (
  <div className="mb-4 flex items-center gap-2">
    <div className="w-1 h-5 rounded-full bg-primary-saffron flex-shrink-0" />
    <div>
      <p className="text-xs font-semibold text-gray-500 uppercase tracking-widest">Donating towards</p>
      <p className="font-semibold text-text-dark">{selectedObjective.title}</p>
    </div>
  </div>
)}
```

Replace the payment instructions box:
```tsx
// OLD payment instructions box
<div className="mb-4 p-3 rounded-xl bg-blue-50 border border-blue-200 text-sm text-blue-800">
  <p className="font-semibold mb-1">📧 How to send your donation</p>
  <p>After submitting this form, please send your Interac e-Transfer to:</p>
  <p className="font-bold mt-1 break-all">{INTERAC_EMAIL}</p>
  <p className="mt-1 text-xs text-blue-700">Use your name as the message/note in the transfer.</p>
</div>
```

```tsx
// NEW — amber style matching event payment instructions
<div className="rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 mb-5">
  <p className="text-sm font-semibold text-amber-800 mb-1">Payment Instructions</p>
  <p className="text-sm text-amber-900">After submitting, send your <strong>Interac e-Transfer</strong> to:</p>
  <p className="font-bold text-amber-900 mt-1 break-all">{INTERAC_EMAIL}</p>
  <p className="text-xs text-amber-700 mt-1">Use your full name as the message/note in the transfer.</p>
</div>
```

Replace the form section label:
```tsx
// Add section label above the form fields (inside the <form> tag, before the first <div>):
<div className="flex items-center gap-2 mb-4">
  <div className="w-1 h-5 rounded-full bg-primary-blue flex-shrink-0" />
  <h4 className="text-sm font-bold text-gray-700 uppercase tracking-widest">Your Details</h4>
</div>
```

Replace ALL four input fields with upgraded style. Replace each `<input ... className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary-saffron focus:border-transparent"` with:
```tsx
className="w-full px-3 py-2.5 border border-gray-200 rounded-xl text-sm bg-gray-50 focus:bg-white focus:outline-none focus:ring-2 focus:ring-primary-blue/25 focus:border-primary-blue transition"
```

Replace the textarea className similarly:
```tsx
// OLD
className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary-saffron focus:border-transparent resize-none"
```
```tsx
// NEW
className="w-full px-3 py-2.5 border border-gray-200 rounded-xl text-sm bg-gray-50 focus:bg-white focus:outline-none focus:ring-2 focus:ring-primary-blue/25 focus:border-primary-blue transition resize-none"
```

Replace each `<label className="block text-sm font-medium text-text-dark mb-1"` with:
```tsx
<label className="block text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1.5"
```

Replace the Submit button:
```tsx
// OLD
<button
  type="submit"
  disabled={submitting}
  className="flex-1 py-2.5 rounded-xl font-semibold text-white bg-primary-saffron hover:bg-primary-saffron/90 transition-colors disabled:opacity-60"
>
  {submitting ? 'Submitting…' : 'Submit'}
</button>
```

```tsx
// NEW
<button
  type="submit"
  disabled={submitting}
  className="flex-1 py-2.5 rounded-xl font-semibold text-white bg-primary-blue hover:bg-primary-blue/90 transition-colors disabled:opacity-60"
>
  {submitting ? 'Submitting…' : 'Submit Donation'}
</button>
```

- [ ] **Step 2: Restyle the success screen**

Replace the `{step === 'success' && (...)}` block:

```tsx
{step === 'success' && (
  <div className="py-4">
    <div className="text-center mb-5">
      <div className="text-5xl mb-3">🙏</div>
      <h3 className="text-xl font-bold text-text-dark mb-1">Thank you for your generosity!</h3>
      <p className="text-sm text-gray-500">Your donation record has been submitted.</p>
    </div>

    <div className="rounded-xl border border-amber-200 bg-amber-50 px-4 py-4 mb-4">
      <p className="text-sm font-semibold text-amber-800 mb-2">Next Step — Send your Interac e-Transfer</p>
      <p className="text-sm text-amber-900 mb-2">Transfer your donation to:</p>
      <p className="font-bold text-amber-900 text-base break-all mb-2">{INTERAC_EMAIL}</p>
      <p className="text-xs text-amber-700">Use your full name as the message/note in the transfer so we can match it.</p>
    </div>

    {selectedObjective && (
      <p className="text-sm text-gray-500 mb-4 text-center">
        Towards: <span className="font-medium text-text-dark">{selectedObjective.title}</span>
      </p>
    )}

    <button
      onClick={onClose}
      className="w-full py-3 rounded-xl font-semibold text-white bg-primary-blue hover:bg-primary-blue/90 transition-colors"
    >
      Done
    </button>
  </div>
)}
```

- [ ] **Step 3: Type-check**

```bash
cd /workspace/ambedkaritebuddhist-auth && pnpm type-check
```

Expected: no errors

- [ ] **Step 4: Commit**

```bash
cd /workspace/ambedkaritebuddhist-auth
git add src/components/layout/donate-modal.tsx
git commit -m "style: restyle donate modal form step and success screen"
```

---

### Task 3: Admin dashboard — expandable donor list per objective

**Files:**
- Modify: `src/app/(main)/dashboard/page.tsx`

The dashboard already loads `donationRecords` (all donations). We add state to track which objective is expanded and which donation is in confirm-mode, then render the donor table inline inside each objective card.

- [ ] **Step 1: Add new state variables**

Find the existing donations state block (~line 201):
```tsx
// Donations state
const [donationObjectives, setDonationObjectives] = useState<DonationObjective[]>([]);
const [donationRecords, setDonationRecords] = useState<DonationRecord[]>([]);
const [donationSubTab, setDonationSubTab] = useState<'objectives' | 'records'>('objectives');
```

Add below it:
```tsx
const [expandedObjId, setExpandedObjId] = useState<string | null>(null);
const [confirmingDonationId, setConfirmingDonationId] = useState<string | null>(null);
const [confirmRef, setConfirmRef] = useState('');
const [confirmAmount, setConfirmAmount] = useState('');
```

- [ ] **Step 2: Add the donor list panel inside each objective card**

Find the objective card's non-edit view (~line 1948), which ends with:
```tsx
                        ) : (
                          <div className="flex items-start justify-between gap-3">
                            ...
                          </div>
                        )}
                      </div>
                    ))}
```

After the `</div>` that closes `<div className="flex items-start justify-between gap-3">`, add the expandable donors panel. The full non-edit view of each objective card should become:

```tsx
) : (
  <div>
    <div className="flex items-start justify-between gap-3">
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2 mb-0.5">
          <p className="font-semibold text-text-dark truncate">{obj.title}</p>
          <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${obj.active ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-500'}`}>
            {obj.active ? 'Active' : 'Inactive'}
          </span>
        </div>
        {obj.description && <p className="text-xs text-gray-500 mb-1 line-clamp-1">{obj.description}</p>}
        {obj.targetAmount > 0 && (
          <div className="mt-1">
            <div className="flex justify-between text-xs text-gray-500 mb-0.5">
              <span>${(obj.currentAmount / 100).toFixed(2)} raised</span>
              <span>Goal: ${(obj.targetAmount / 100).toFixed(2)}</span>
            </div>
            <div className="h-1.5 bg-gray-200 rounded-full overflow-hidden">
              <div
                className="h-full bg-primary-saffron rounded-full"
                style={{ width: `${Math.min(100, Math.round((obj.currentAmount / obj.targetAmount) * 100))}%` }}
              />
            </div>
          </div>
        )}
      </div>
      <div className="flex gap-1.5 flex-shrink-0 flex-wrap justify-end">
        <button
          onClick={() => setExpandedObjId(expandedObjId === obj.id ? null : obj.id)}
          className="px-2.5 py-1.5 text-xs text-gray-600 border border-gray-300 rounded-lg hover:bg-gray-50"
        >
          {(() => {
            const count = donationRecords.filter((r) => r.objectiveId === obj.id).length;
            return expandedObjId === obj.id ? 'Hide Donors' : `Donors (${count})`;
          })()}
        </button>
        <button
          onClick={() => {
            setEditObjId(obj.id);
            setEditObjTitle(obj.title);
            setEditObjDescription(obj.description);
            setEditObjTarget(String(obj.targetAmount / 100));
            setEditObjCurrent(String(obj.currentAmount / 100));
            setEditObjOrder(String(obj.displayOrder));
            setEditObjActive(obj.active);
          }}
          className="px-2.5 py-1.5 text-xs text-primary-blue border border-primary-blue rounded-lg hover:bg-blue-50"
        >Edit</button>
        <button
          onClick={async () => {
            if (!confirm(`Delete objective "${obj.title}"? This cannot be undone.`)) return;
            await fetch(`/api/admin/donations/objectives/${obj.id}`, { method: 'DELETE' });
            await loadDonations();
          }}
          className="px-2.5 py-1.5 text-xs text-red-600 border border-red-200 rounded-lg hover:bg-red-50"
        >Delete</button>
      </div>
    </div>

    {/* Expandable donor list */}
    {expandedObjId === obj.id && (() => {
      const objDonors = donationRecords.filter((r) => r.objectiveId === obj.id);
      return (
        <div className="mt-4 border-t border-gray-100 pt-4">
          {objDonors.length === 0 ? (
            <p className="text-xs text-gray-400 text-center py-3">No donations for this objective yet.</p>
          ) : (
            <div className="space-y-2">
              {objDonors.map((rec) => (
                <div key={rec.id} className="rounded-xl border border-gray-200 bg-gray-50 p-3">
                  <div className="flex items-start justify-between gap-3 flex-wrap">
                    <div className="min-w-0">
                      <p className="text-sm font-medium text-text-dark">{rec.donorName}</p>
                      <p className="text-xs text-gray-500">{rec.donorEmail}{rec.donorPhone ? ` · ${rec.donorPhone}` : ''}</p>
                      {rec.message && <p className="text-xs text-gray-500 italic mt-0.5">"{rec.message}"</p>}
                    </div>
                    <div className="text-right flex-shrink-0">
                      <p className="text-sm font-semibold text-text-dark">${(rec.amount / 100).toFixed(2)}</p>
                      <p className="text-xs text-gray-400">{new Date(rec.createdAt).toLocaleDateString('en-CA')}</p>
                      <span className={`text-xs px-2 py-0.5 rounded-full font-medium mt-0.5 inline-block ${rec.status === 'confirmed' ? 'bg-green-100 text-green-700' : 'bg-yellow-100 text-yellow-700'}`}>
                        {rec.status}
                      </span>
                    </div>
                  </div>
                  {rec.adminNote && (
                    <p className="text-xs text-gray-500 mt-1.5 border-t border-gray-200 pt-1.5">
                      <span className="font-medium">Interac Ref:</span> {rec.adminNote}
                    </p>
                  )}
                  {rec.status === 'pending' && confirmingDonationId !== rec.id && (
                    <button
                      onClick={() => {
                        setConfirmingDonationId(rec.id);
                        setConfirmRef('');
                        setConfirmAmount(String(rec.amount / 100));
                      }}
                      className="mt-2 px-3 py-1.5 text-xs font-medium text-white bg-green-600 hover:bg-green-700 rounded-lg transition-colors"
                    >
                      Confirm Receipt
                    </button>
                  )}
                  {rec.status === 'pending' && confirmingDonationId === rec.id && (
                    <div className="mt-3 border-t border-gray-200 pt-3 space-y-2">
                      <div className="grid grid-cols-2 gap-2">
                        <div>
                          <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1">Interac Reference</label>
                          <input
                            type="text"
                            value={confirmRef}
                            onChange={(e) => setConfirmRef(e.target.value)}
                            placeholder="e.g. ABC123XYZ"
                            className="w-full px-3 py-2 border border-gray-200 rounded-xl text-sm bg-white focus:outline-none focus:ring-2 focus:ring-primary-blue/25 focus:border-primary-blue transition"
                          />
                        </div>
                        <div>
                          <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1">Amount Received ($)</label>
                          <input
                            type="number"
                            min="0"
                            step="0.01"
                            value={confirmAmount}
                            onChange={(e) => setConfirmAmount(e.target.value)}
                            className="w-full px-3 py-2 border border-gray-200 rounded-xl text-sm bg-white focus:outline-none focus:ring-2 focus:ring-primary-blue/25 focus:border-primary-blue transition"
                          />
                        </div>
                      </div>
                      <div className="flex gap-2">
                        <button
                          onClick={async () => {
                            const amountCents = Math.round(parseFloat(confirmAmount) * 100);
                            await fetch('/api/admin/donations', {
                              method: 'PATCH',
                              headers: { 'Content-Type': 'application/json' },
                              body: JSON.stringify({
                                id: rec.id,
                                status: 'confirmed',
                                confirmedAmount: amountCents,
                                adminNote: confirmRef.trim() || null,
                              }),
                            });
                            setConfirmingDonationId(null);
                            setConfirmRef('');
                            setConfirmAmount('');
                            await loadDonations();
                          }}
                          className="px-3 py-1.5 text-xs font-medium text-white bg-green-600 hover:bg-green-700 rounded-lg transition-colors"
                        >
                          Confirm
                        </button>
                        <button
                          onClick={() => { setConfirmingDonationId(null); setConfirmRef(''); setConfirmAmount(''); }}
                          className="px-3 py-1.5 text-xs text-gray-600 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
                        >
                          Cancel
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      );
    })()}
  </div>
)}
```

- [ ] **Step 3: Type-check**

```bash
cd /workspace/ambedkaritebuddhist-auth && pnpm type-check
```

Expected: no errors

- [ ] **Step 4: Commit**

```bash
cd /workspace/ambedkaritebuddhist-auth
git add src/app/\(main\)/dashboard/page.tsx
git commit -m "feat: add expandable donor list per objective with Interac confirm flow"
```

---

### Task 4: Push both branches

- [ ] **Step 1: Push release**

```bash
cd /workspace/ambedkaritebuddhist-auth && git push origin release
```

- [ ] **Step 2: Cherry-pick all three commits into dev**

```bash
cd /workspace/ambedkaritebuddhist && git cherry-pick release~2..release
git push origin dev
```

(This cherry-picks the two modal style commits + the donor list commit. Adjust the range if the doc commit was also pushed first — use `git log --oneline release` to verify the right commit hashes.)
