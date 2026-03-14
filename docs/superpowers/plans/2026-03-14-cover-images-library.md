# Cover Images Library Implementation Plan

> **For agentic workers:** REQUIRED: Use superpowers:subagent-driven-development (if subagents available) or superpowers:executing-plans to implement this plan. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add a Cover Images tab to the admin dashboard where admins can upload, rename, and delete reusable cover images stored in R2, which then appear as a visual dropdown when creating or editing events.

**Architecture:** Cover images are stored in the existing R2 bucket under a `covers/` prefix, with the image name saved as R2 custom metadata (`customMetadata.name`). No DB changes needed. Four new API routes handle CRUD. The dashboard gets a new tab and the event forms get their hardcoded options replaced with a live fetch.

**Tech Stack:** Next.js 14 App Router, TypeScript, Cloudflare R2 (`getEventImagesBucket()` from `src/lib/r2.ts`), NextAuth.js v5 (`requireAdmin` from `src/lib/admin-auth.ts`), Tailwind CSS. All API routes: `export const runtime = 'edge'` + `export const dynamic = 'force-dynamic'`.

---

## Chunk 1: API Routes

### Task 1: GET + POST `/api/admin/cover-images`

**Files:**
- Create: `src/app/api/admin/cover-images/route.ts`

- [ ] **Step 1: Create the file with GET handler**

```typescript
// src/app/api/admin/cover-images/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { requireAdmin } from '@/lib/admin-auth';
import { getEventImagesBucket } from '@/lib/r2';

export const dynamic = 'force-dynamic';
export const runtime = 'edge';

export type CoverImage = {
  key: string;
  name: string;
  url: string;
};

function toCoverImageUrl(key: string): string {
  return `/api/events/image?key=${encodeURIComponent(key)}`;
}

export async function GET(request: NextRequest) {
  const token = await requireAdmin(request);
  if (!token) return NextResponse.json({ error: 'Forbidden' }, { status: 403 });

  const bucket = getEventImagesBucket();
  const listed = await bucket.list({ prefix: 'covers/' });

  const images: CoverImage[] = listed.objects.map((obj) => ({
    key: obj.key,
    name: (obj.customMetadata?.name as string | undefined) ?? obj.key.split('/').pop() ?? obj.key,
    url: toCoverImageUrl(obj.key),
  }));

  return NextResponse.json({ images }, { status: 200 });
}
```

- [ ] **Step 2: Add POST handler to the same file**

Append after the GET function:

```typescript
function inferContentType(filename: string): string {
  const lower = filename.toLowerCase();
  if (lower.endsWith('.jpg') || lower.endsWith('.jpeg')) return 'image/jpeg';
  if (lower.endsWith('.png')) return 'image/png';
  if (lower.endsWith('.webp')) return 'image/webp';
  if (lower.endsWith('.gif')) return 'image/gif';
  if (lower.endsWith('.avif')) return 'image/avif';
  return 'application/octet-stream';
}

export async function POST(request: NextRequest) {
  const token = await requireAdmin(request);
  if (!token) return NextResponse.json({ error: 'Forbidden' }, { status: 403 });

  const form = await request.formData();
  const file = form.get('file');
  const name = String(form.get('name') ?? '').trim();

  if (!name) return NextResponse.json({ error: 'Name is required' }, { status: 400 });
  if (!(file instanceof File)) return NextResponse.json({ error: 'File is required' }, { status: 400 });
  if (!file.type.startsWith('image/')) return NextResponse.json({ error: 'Only image files are allowed' }, { status: 400 });

  const ext = file.name.includes('.') ? file.name.split('.').pop() : 'jpg';
  const key = `covers/${crypto.randomUUID()}.${ext}`;
  const contentType = file.type || inferContentType(file.name);

  const bucket = getEventImagesBucket();
  await bucket.put(key, await file.arrayBuffer(), {
    httpMetadata: { contentType },
    customMetadata: { name },
  });

  const image: CoverImage = { key, name, url: toCoverImageUrl(key) };
  return NextResponse.json({ image }, { status: 201 });
}
```

- [ ] **Step 3: Verify the file compiles**

```bash
cd "X:/projects/ambedkaritebuddhist" && pnpm type-check 2>&1 | grep -E "cover-images|error" | head -20
```

Expected: no errors referencing `cover-images/route.ts`

- [ ] **Step 4: Commit**

```bash
cd "X:/projects/ambedkaritebuddhist" && git add src/app/api/admin/cover-images/route.ts && git commit -m "feat: add GET/POST /api/admin/cover-images"
```

---

### Task 2: PATCH + DELETE `/api/admin/cover-images/[key]`

**Files:**
- Create: `src/app/api/admin/cover-images/[key]/route.ts`

> **Key encoding note:** The `[key]` route segment captures only the filename portion (e.g. `abc123.jpg`). Reconstruct the full R2 key by prepending `covers/` in the handler. The client must pass the encoded filename as the URL segment.

- [ ] **Step 1: Create the file with PATCH handler**

```typescript
// src/app/api/admin/cover-images/[key]/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { requireAdmin } from '@/lib/admin-auth';
import { getEventImagesBucket } from '@/lib/r2';
import type { CoverImage } from '../route';

export const dynamic = 'force-dynamic';
export const runtime = 'edge';

function toCoverImageUrl(key: string): string {
  return `/api/events/image?key=${encodeURIComponent(key)}`;
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ key: string }> },
) {
  const token = await requireAdmin(request);
  if (!token) return NextResponse.json({ error: 'Forbidden' }, { status: 403 });

  const { key: keySegment } = await params;
  const fullKey = `covers/${decodeURIComponent(keySegment)}`;

  const body = (await request.json()) as { name?: string };
  const name = String(body.name ?? '').trim();
  if (!name) return NextResponse.json({ error: 'Name is required' }, { status: 400 });

  const bucket = getEventImagesBucket();
  const existing = await bucket.get(fullKey);
  if (!existing) return NextResponse.json({ error: 'Image not found' }, { status: 404 });

  // R2 has no metadata-only update — re-put the object with new metadata
  await bucket.put(fullKey, existing.body, {
    httpMetadata: existing.httpMetadata,
    customMetadata: { name },
  });

  const image: CoverImage = { key: fullKey, name, url: toCoverImageUrl(fullKey) };
  return NextResponse.json({ image }, { status: 200 });
}
```

- [ ] **Step 2: Add DELETE handler to the same file**

Append after the PATCH function:

```typescript
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ key: string }> },
) {
  const token = await requireAdmin(request);
  if (!token) return NextResponse.json({ error: 'Forbidden' }, { status: 403 });

  const { key: keySegment } = await params;
  const fullKey = `covers/${decodeURIComponent(keySegment)}`;

  const bucket = getEventImagesBucket();
  const existing = await bucket.head(fullKey);
  if (!existing) return NextResponse.json({ error: 'Image not found' }, { status: 404 });

  await bucket.delete(fullKey);
  return NextResponse.json({ ok: true }, { status: 200 });
}
```

- [ ] **Step 3: Verify the file compiles**

```bash
cd "X:/projects/ambedkaritebuddhist" && pnpm type-check 2>&1 | grep -E "cover-images|error" | head -20
```

Expected: no errors

- [ ] **Step 4: Commit**

```bash
cd "X:/projects/ambedkaritebuddhist" && git add src/app/api/admin/cover-images/[key]/route.ts && git commit -m "feat: add PATCH/DELETE /api/admin/cover-images/[key]"
```

---

## Chunk 2: Dashboard Tab

### Task 3: Cover Images tab in `src/app/dashboard/page.tsx`

**Files:**
- Modify: `src/app/dashboard/page.tsx`

This file is large (~1264 lines). All changes are additive except replacing `EVENT_COVER_OPTIONS` usage in the cover image `<select>`. Follow the existing patterns exactly.

- [ ] **Step 1: Add `CoverImage` type and `coverImages` state**

At line 10, change the `Tab` type union:

```typescript
// Before:
type Tab = 'leadership' | 'members' | 'events' | 'referrals' | 'messages' | 'settings';

// After:
type Tab = 'leadership' | 'members' | 'events' | 'cover-images' | 'referrals' | 'messages' | 'settings';
```

After the `ContactMessage` type (around line 86), add:

```typescript
type CoverImage = {
  key: string;
  name: string;
  url: string;
};
```

After the `const [messages, setMessages] = useState` line (~line 123), add:

```typescript
const [coverImages, setCoverImages] = useState<CoverImage[]>([]);
const [coverImageUploading, setCoverImageUploading] = useState(false);
const [coverImageUploadName, setCoverImageUploadName] = useState('');
const [coverImageUploadFile, setCoverImageUploadFile] = useState<File | null>(null);
const [coverImageUploadError, setCoverImageUploadError] = useState('');
const [coverImageRenameKey, setCoverImageRenameKey] = useState<string | null>(null);
const [coverImageRenameDraft, setCoverImageRenameDraft] = useState('');
const [coverImageDeleteConfirmKey, setCoverImageDeleteConfirmKey] = useState<string | null>(null);
```

- [ ] **Step 2: Add `loadCoverImages` function**

After the `loadMessages` function (~line 213), add the following. This version also sets the default cover image for the create-event form when the library loads:

```typescript
const loadCoverImages = async () => {
  const res = await fetch('/api/admin/cover-images', { cache: 'no-store' });
  if (!res.ok) return;
  const data = (await res.json()) as { images: CoverImage[] };
  setCoverImages(data.images);
  if (data.images.length > 0) {
    setNewEventCoverImage(data.images[0].key);
  }
};
```

- [ ] **Step 3: Call `loadCoverImages` in the admin load effect**

Find the `useEffect` at ~line 215. Inside the `if (isAdmin)` branch, find this exact line:

```typescript
await Promise.all([loadOrgSettings(), loadLeadership(), loadMembers(), loadEvents(), loadReferralCodes(), loadMessages()]);
```

Change it to:

```typescript
await Promise.all([loadOrgSettings(), loadLeadership(), loadMembers(), loadEvents(), loadCoverImages(), loadReferralCodes(), loadMessages()]);
```

- [ ] **Step 4: Add "Cover Images" tab to the tabs array**

Find the `tabs` array (~line 264). Add the new tab between Events and Referrals:

```typescript
// Before:
{ id: 'events', label: `Events (${events.length})` },
{ id: 'referrals', label: 'Referral Codes' },

// After:
{ id: 'events', label: `Events (${events.length})` },
{ id: 'cover-images', label: `Cover Images (${coverImages.length})` },
{ id: 'referrals', label: 'Referral Codes' },
```

- [ ] **Step 5: Replace hardcoded cover options in the create-event form**

Find the cover image `<select>` in the create event form (~line 801):

```typescript
// Before:
{EVENT_COVER_OPTIONS.map((path) => (
  <option key={path} value={path}>
    {path.split('/').pop()}
  </option>
))}

// After:
{coverImages.length === 0 ? (
  <option value="">No cover images — add some in the Cover Images tab</option>
) : (
  coverImages.map((img) => (
    <option key={img.key} value={img.key}>
      {img.name}
    </option>
  ))
)}
```

Also update the `useState` initial value for `newEventCoverImage` at ~line 129. Change:

```typescript
const [newEventCoverImage, setNewEventCoverImage] = useState(EVENT_COVER_OPTIONS[0]);
```
to:
```typescript
const [newEventCoverImage, setNewEventCoverImage] = useState('');
```

Remove the now-unused `EVENT_COVER_OPTIONS` constant (lines 99–104). Update the `setNewEventCoverImage` reset after create (~line 390) to use `coverImages[0]?.key ?? ''`:

Find:
```typescript
setNewEventCoverImage(EVENT_COVER_OPTIONS[0]);
```
Replace with:
```typescript
setNewEventCoverImage(coverImages[0]?.key ?? '');
```

- [ ] **Step 6: Add Cover Images tab panel**

Find the last tab panel before the closing `</div>` of the tab content area. The settings tab ends around line 1251. Insert the Cover Images panel before the settings panel, after the referrals panel:

```tsx
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
            }
            setCoverImageUploading(false);
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
```

- [ ] **Step 7: Verify type-check passes**

```bash
cd "X:/projects/ambedkaritebuddhist" && pnpm type-check 2>&1 | grep -E "error|dashboard/page" | head -20
```

Expected: no errors

- [ ] **Step 8: Commit**

```bash
cd "X:/projects/ambedkaritebuddhist" && git add src/app/dashboard/page.tsx && git commit -m "feat: add Cover Images tab to admin dashboard"
```

---

## Chunk 3: Event Edit Page + Verification

### Task 4: Update cover image dropdown in event edit page

**Files:**
- Modify: `src/app/dashboard/events/[id]/page.tsx`

- [ ] **Step 1: Add `CoverImage` type and state**

At the top of the file, after the existing type definitions (~line 15), add:

```typescript
type CoverImage = {
  key: string;
  name: string;
  url: string;
};
```

After existing `useState` declarations, add:

```typescript
const [coverImages, setCoverImages] = useState<CoverImage[]>([]);
```

- [ ] **Step 2: Add `loadCoverImages` and call it on mount**

After the existing `loadData` function, add:

```typescript
const loadCoverImages = async () => {
  const res = await fetch('/api/admin/cover-images', { cache: 'no-store' });
  if (!res.ok) return;
  const data = (await res.json()) as { images: CoverImage[] };
  setCoverImages(data.images);
};
```

Find the `useEffect` at ~line 185 that builds a `tasks` array and calls `Promise.all(tasks)`. Add `loadCoverImages()` to the tasks array:

```typescript
// Before:
const tasks: Promise<void>[] = [
  loadData(),
  fetch('/api/admin/members', { cache: 'no-store' })
    ...
];

// After — add loadCoverImages() as a new entry:
const tasks: Promise<void>[] = [
  loadData(),
  loadCoverImages(),
  fetch('/api/admin/members', { cache: 'no-store' })
    ...
];
```

- [ ] **Step 3: Replace hardcoded cover options in the edit form**

Find the cover image `<select>` (~line 503):

```tsx
// Before:
{EVENT_COVER_OPTIONS.map((opt) => (
  <option key={opt} value={opt}>{opt.split('/').pop()}</option>
))}

// After:
{coverImages.length === 0 ? (
  <option value={eventForm.coverImage}>{eventForm.coverImage || 'No cover images available'}</option>
) : (
  coverImages.map((img) => (
    <option key={img.key} value={img.key}>{img.name}</option>
  ))
)}
```

- [ ] **Step 4: Remove the now-unused `EVENT_COVER_OPTIONS` constant**

Delete lines 9–14:
```typescript
const EVENT_COVER_OPTIONS = [
  '/images/events/covers/dcpd.jpg',
  '/images/events/covers/picnic.jpeg',
  '/images/events/covers/mahaparinirvan-din.jpg',
  '/images/events/covers/ambedkar-jayanti.jpg',
];
```

- [ ] **Step 5: Verify type-check passes**

```bash
cd "X:/projects/ambedkaritebuddhist" && pnpm type-check 2>&1 | grep -E "error|events/\[id\]" | head -20
```

Expected: no errors

- [ ] **Step 6: Commit**

```bash
cd "X:/projects/ambedkaritebuddhist" && git add src/app/dashboard/events/[id]/page.tsx && git commit -m "feat: replace hardcoded cover options with live library in event edit"
```

---

### Task 5: End-to-end smoke test

- [ ] **Step 1: Start dev server**

```bash
cd "X:/projects/ambedkaritebuddhist" && pnpm pages:dev
```

- [ ] **Step 2: Test Cover Images tab**

1. Log in as admin and navigate to `/dashboard`
2. Click the "Cover Images" tab
3. Upload an image with a name — verify it appears in the grid
4. Click Rename — verify inline edit works, saves correctly
5. Click Delete — verify confirm step appears, image removed on confirm

- [ ] **Step 3: Test event create form**

1. Click the Events tab → Create New Event
2. Verify the Cover Image dropdown shows the uploaded library images by name
3. Create an event with a library cover image — verify it saves correctly

- [ ] **Step 4: Test event edit form**

1. Open an existing event at `/dashboard/events/[id]`
2. Verify the Cover Image dropdown shows library images by name
3. Change the cover image and save — verify it updates

- [ ] **Step 5: Test deletion fallback**

1. Delete a cover image that is set on an existing event
2. Open that event's edit page — verify the dropdown still renders (shows the raw key or "No cover images available" gracefully, not a crash)

- [ ] **Step 6: Final lint check**

```bash
cd "X:/projects/ambedkaritebuddhist" && pnpm lint 2>&1 | grep -E "error|warning" | head -20
```

Expected: no new errors

- [ ] **Step 7: Final commit if any lint fixes were needed**

```bash
cd "X:/projects/ambedkaritebuddhist" && git add -p && git commit -m "fix: lint cleanup for cover images feature"
```
