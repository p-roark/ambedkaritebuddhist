# Donate Modal Redesign + Admin Donor List

**Date:** 2026-04-13
**Status:** Approved

---

## Problem

The donate modal looks inconsistent with the event registration form — basic styling, smaller width, generic inputs. Admin has no way to view donors grouped by objective or record the Interac e-Transfer reference when confirming.

---

## Changes

### 1. Donate Modal — `src/components/layout/donate-modal.tsx`

Restyle to match the event registration modal quality:

- **Header:** gradient `from-primary-blue to-accent-purple` with white title text and section label, matching event reg header
- **Width:** `max-w-2xl` (up from `max-w-lg`)
- **Section labels:** blue left-bar accent (`w-1 h-5 rounded-full bg-primary-blue`) + `text-xs font-bold uppercase tracking-widest`
- **Inputs:** `bg-gray-50 focus:bg-white focus:ring-2 focus:ring-primary-blue/25 focus:border-primary-blue rounded-xl`, labels as `text-xs font-semibold text-gray-500 uppercase tracking-wide`
- **Interac box:** styled like event payment instructions (`border-amber-200 bg-amber-50`), more prominent with clear email display
- **Objective selection:** keep radio-card UI but align border/hover colors with the rest of the design system
- **Success screen:** cleaner layout with Interac email prominently displayed

No logic changes — only visual/style updates.

---

### 2. Admin Donor List Per Objective — `src/app/(main)/dashboard/page.tsx`

In the **Objectives** sub-tab, each objective card gets an expandable donors panel:

- **"Donors (n)" button** per objective — toggles open/close inline
- **Donor list:** table showing name, email, phone, amount (CAD), date, status
- Data sourced from already-loaded `donationRecords` filtered by `objectiveId` — no new API needed
- **Confirm flow (inline):** pending donations show a Confirm button that expands:
  - **Interac Reference** input (maps to `adminNote`)
  - **Confirmed Amount** input (pre-filled with donor-entered amount, editable)
  - Save → calls existing `PATCH /api/admin/donations` with `{ id, status: 'confirmed', confirmedAmount, adminNote }`
- Confirmed donations display their reference note inline

---

## Files Changed

| File | Change |
|------|--------|
| `src/components/layout/donate-modal.tsx` | Full visual restyle, no logic changes |
| `src/app/(main)/dashboard/page.tsx` | Add donor expand panel + inline confirm with Interac ref |

---

## Out of Scope

- Public donor list visibility (admin-only for now)
- Email notifications on donation confirmation
- New API endpoints (existing data sufficient)
