# Cover Images Library — Design Spec

**Date:** 2026-03-14
**Status:** Approved
**Branch:** feat/auth-system

---

## Overview

Add a "Cover Images" tab to the admin dashboard that lets admins upload, rename, and delete reusable cover images. These images appear in a visual dropdown when creating or editing events, replacing the current hardcoded static file list.

---

## Goals

- Admins can upload cover images from the browser without a redeploy
- Uploaded images have human-readable names visible in the event form dropdown
- Admins can rename or delete cover images at any time
- Deleting a cover image does not break existing events (they fall back to a default)

---

## Non-Goals

- No role access for coordinators (admin only)
- No image cropping or resizing
- No ordering/sorting of the library

---

## Storage Approach: R2-only

Cover images are stored in the existing R2 bucket (`EVENT_IMAGES` / `EVENT_IMAGES_PROD`) under a `covers/` key prefix.

- **Key pattern:** `covers/{uuid}.{ext}`
- **Name:** stored as R2 custom metadata: `customMetadata.name`
- **No new DB table or migration required**

This follows the same R2 patterns already in use for event gallery images (`src/lib/r2.ts`).

---

## API Routes

All routes require admin auth (`requireAdmin(request)`), edge runtime, and `force-dynamic`.

### `GET /api/admin/cover-images`
List all cover images in the library.

**Response:**
```json
{
  "images": [
    { "key": "covers/abc123.jpg", "name": "Ambedkar Jayanti", "url": "/api/events/image?key=covers%2Fabc123.jpg" },
    ...
  ]
}
```

Implementation: `bucket.list({ prefix: 'covers/' })`, map each object to key + `customMetadata.name` + derived URL.

---

### `POST /api/admin/cover-images`
Upload a new cover image.

**Request:** `multipart/form-data`
- `file` — image file (must be `image/*` MIME type)
- `name` — display name (required, non-empty string)

**Behavior:**
- Generate UUID key: `covers/{uuid}.{ext}`
- Store in R2 with `customMetadata: { name }`
- Return the new image object: `{ key, name, url }`

---

### `PATCH /api/admin/cover-images`
Rename an existing cover image.

**Request body:** `{ "key": "covers/abc123.jpg", "name": "New Name" }`

**Behavior:**
- Fetch the existing R2 object using the full key (`covers/{uuid}.{ext}`)
- Re-put it with updated `customMetadata.name` (R2 does not support metadata-only updates; re-put is required)
- Return updated image object

> **Implementation note:** The dynamic route segment `[key]` captures only the filename portion (e.g., `abc123.jpg`). Reconstruct the full R2 key by prepending `covers/` in the handler.

---

### `DELETE /api/admin/cover-images`
Delete a cover image from the library.

**Request body:** `{ "key": "covers/abc123.jpg" }`

**Behavior:**
- Delete object from R2 using the full key
- Return `{ success: true }`
- Events referencing the deleted key are **not updated** — the UI falls back to a default image

> **Implementation note:** Same as PATCH — reconstruct the full key by prepending `covers/` from the `[key]` segment.

---

## Image Serving

Cover images are served through the existing `/api/events/image?key=...` route. No new serving infrastructure needed.

---

## Dashboard Tab

### Placement
New "Cover Images" tab added between "Events" and "Referral Codes" in the admin dashboard (`src/app/dashboard/page.tsx`). Visible to admins only (not coordinators).

### Upload Section
- Text input for name
- File input (`accept="image/*"`)
- Upload button (disabled while uploading)
- Inline error display for validation failures

### Image Grid
- Responsive grid of cards (2–4 columns)
- Each card: thumbnail preview, name label, Rename button, Delete button
- **Rename:** clicking Rename switches card to inline edit mode (text input + Save/Cancel)
- **Delete:** single confirmation step before calling the API
- Empty state message when library is empty

---

## Event Form Change

**File:** `src/app/dashboard/page.tsx` (create event form) and `src/app/dashboard/events/[id]/page.tsx` (edit event form)

**Current behavior:** Cover image field uses a hardcoded `EVENT_COVER_OPTIONS` array of 4 static file paths.

**New behavior:**
- On form load, fetch `/api/admin/cover-images`
- Render a visual dropdown: thumbnail + name per option
- If a stored `coverImage` key is not found in the library (image was deleted), display a "Default" placeholder option so the form remains valid

---

## Deletion Fallback

When an event's `coverImage` key no longer exists in R2:
- The image serving route (`/api/events/image`) returns a 404
- The event form shows a "Default" placeholder in the dropdown
- The public event display should gracefully handle a broken image (existing `<img>` fallback behavior or an `onError` handler)

---

## Error Handling

| Scenario | Behavior |
|---|---|
| Upload with no name | 400: "Name is required" |
| Upload with non-image file | 400: "Only image files are allowed" |
| Rename with empty name | 400: "Name is required" |
| Delete non-existent key | 404: "Image not found" |
| R2 unavailable | 500 with error message |

---

## Files Affected

| File | Change |
|---|---|
| `src/app/dashboard/page.tsx` | Add Cover Images tab, upload section, image grid |
| `src/app/dashboard/events/[id]/page.tsx` | Replace hardcoded cover options with API fetch |
| `src/app/api/admin/cover-images/route.ts` | New: GET + POST handlers |
| `src/app/api/admin/cover-images/[key]/route.ts` | New: PATCH + DELETE handlers (key is URL-encoded) |
| `src/lib/r2.ts` | No change needed |
| `src/app/api/events/image/route.ts` | No change needed |
