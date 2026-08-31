# Feature 10 — School Website (Public)

**Release:** R1
**Priority:** P1 for R1

---

## Overview
Each school gets a public-facing website auto-generated from their DayCarePortal settings. The site uses the jsjoyfamily.netlify.app template as the base design and is hosted under the main domain at `/<school-slug>`.

**URL pattern:** `daycareportal.com/jsjoy-family-daycare`  
**Template reference:** https://jsjoyfamily.netlify.app/

---

## Pages / Sections (from template)

### Home page
| Section | Content source |
|---|---|
| Header | School name, logo, nav links |
| Hero | Tagline, CTA buttons ("Schedule a Visit", "View Programs") |
| Stats bar | Ages accepted (from rooms), Years experience, School size (from settings) |
| "What Makes Us Special" | 4 feature cards — text customizable by admin |
| Programs by age | Auto-populated from rooms (Infants 0–12mo, Toddlers 12–36mo, Pre-K 3–5yr) |
| About | School story / description — admin editable |
| Facility | Photos + description — admin editable |
| Testimonials | Pulled from a testimonials table (admin adds) |
| "Ready to Join Our Family?" CTA | Links to contact form |
| Footer | Address, phone, email, hours, quick links |

---

## School settings fields to add (Settings page)

Add a new "School Website" section to `My School → Settings`:

| Field | Notes |
|---|---|
| `tagline` | Hero headline, e.g. "Where Little Hearts Find Joy" |
| `description` | About paragraph (2-3 sentences) |
| `address` | Street, city, state, zip |
| `phone` | Contact phone |
| `email` | Contact email |
| `website_slug` | URL slug, auto-generated from school name, editable |
| `logo_url` | Upload via Supabase Storage |
| `hero_image_url` | Hero section background image |
| `accent_color` | Brand color (default: orange-500 `#F97316`) |
| `established_year` | "Licensed Family Daycare Since XXXX" badge |
| `capacity` | Max children for stats bar |
| `contact_form_url` | External form link (Google Form or built-in) |
| `facebook_url` | Optional |
| `instagram_url` | Optional |

---

## DB migration (R1)

```sql
-- Extend schools table with website fields
alter table schools
  add column if not exists tagline text,
  add column if not exists description text,
  add column if not exists address jsonb,   -- {street, city, state, zip}
  add column if not exists phone text,
  add column if not exists email text,
  add column if not exists website_slug text unique,
  add column if not exists logo_url text,
  add column if not exists hero_image_url text,
  add column if not exists accent_color text default '#F97316',
  add column if not exists established_year int,
  add column if not exists contact_form_url text,
  add column if not exists social_links jsonb;  -- {facebook, instagram}

-- Testimonials
create table if not exists testimonials (
  id          uuid primary key default gen_random_uuid(),
  school_id   uuid not null references schools(id) on delete cascade,
  author_name text not null,
  author_role text,          -- "Parent", "Guardian", etc.
  text        text not null,
  rating      int check (rating between 1 and 5),
  source      text,          -- "Google", "Yelp", etc.
  created_at  timestamptz default now()
);
```

---

## Route (R1)

```tsx
// Public route — no auth required
<Route path="/s/:slug" element={<SchoolWebsite />} />
```

The `SchoolWebsite` component:
1. Reads `:slug` from URL params
2. Fetches school by `website_slug`
3. Fetches rooms (for programs section)
4. Fetches testimonials
5. Reads `operating_hours` from existing `schools` table column
6. Renders the full website template

---

## Admin CMS (Settings page additions)

New "School Website" card in Settings with:
- Live preview link: `daycareportal.com/s/<slug>`
- All fields editable inline
- Photo upload for logo + hero image
- Preview button (opens in new tab)
- Testimonials management (add/edit/delete)

---

## Template design (from jsjoyfamily.netlify.app)

Key design elements to replicate:
- Orange primary color (`#F97316`) — overridable via `accent_color`
- Warm cream background
- Rounded cards
- Lucide icons for feature bullets
- Google Maps embed (optional) in footer
- Mobile-first responsive layout

Sections that auto-populate from DayCarePortal data:
- Programs — from `rooms` table (name, age range, ratio)
- Operating hours — from `schools.operating_hours`
- Staff count — from `profiles` where school + role=staff
- Student capacity — from `schools.capacity` or sum of rooms

---

## URL slugs

Auto-generated from school name:
- "JS Joy Family Daycare" → `js-joy-family-daycare`
- "Sunshine Daycare Center" → `sunshine-daycare-center`

Admin can customize the slug (validated: lowercase, hyphens, alphanumeric only).

Collision: if slug exists, append `-2`, `-3`, etc.

---

## Custom domain (R1+)
Future: allow mapping `jsjoy.com` → `daycareportal.com/s/js-joy-family-daycare` via a CNAME record. Requires Netlify Pro or custom server config.

---

## Screenshots to add
> [ ] Home page (template-based)
> [ ] Admin settings — School Website section
> [ ] Programs section (auto-populated from rooms)
> [ ] Footer with address, phone, hours
