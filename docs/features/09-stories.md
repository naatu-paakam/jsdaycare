# Feature 9 — Stories

**Release:** R1
**Priority:** P0 for R1

---

## Overview
Stories is a shared journal for the daycare community. Admins, staff, and parents can post short reflections about the day — a child's milestone, a funny moment, a group activity, or growth observation — optionally with photos.

**AI-assisted (R1+):** When a story is submitted, an AI call elaborates the draft into a richer paragraph and generates a short caption for the timeline card. Both the original draft and AI version are saved.

---

## Who can write / view

| Role | Write | View |
|---|---|---|
| Admin | ✅ All students | ✅ All stories |
| Staff | ✅ Students in their rooms | ✅ All stories |
| Parent | ✅ Their own children | ✅ Stories about their children only |

---

## Story structure

| Field | Notes |
|---|---|
| `id` | UUID |
| `school_id` | Which school |
| `student_id` | Optional — story can be about one student or the whole class |
| `room_id` | Optional — room-level story |
| `author_id` | profiles.id of the writer |
| `author_role` | admin / staff / parent |
| `draft_text` | Original text written by the human |
| `ai_text` | AI-elaborated version (blank until AI processes) |
| `ai_caption` | 1-sentence AI caption for timeline card |
| `media_urls` | Array of image/video URLs (Supabase Storage) |
| `status` | draft / published / archived |
| `published_at` | Timestamp when published |
| `created_at` | |

---

## Write flow (submit story)

1. Writer clicks **"+ New Story"** on the Stories page
2. Types a brief note (2-5 sentences) — *"Today Adrith learned to count to 10 with blocks! He was so proud 🥹"*
3. Optionally attaches up to 5 photos
4. Optionally tags a student (or "Class story" for all)
5. Clicks **"Share Story"**
6. Story saved as `status: published`, `draft_text` populated
7. **AI elaboration (async):** Background call to Claude API:
   - Input: `draft_text` + student name + school name
   - Output: `ai_text` (2-3 paragraphs, warm and professional), `ai_caption` (1 sentence)
   - Both saved back to the story record
8. Timeline refreshes — story card shows immediately with `draft_text`, then updates when AI version ready

---

## Timeline view

- **Latest story at top**, older scrollable below
- Each story card shows:
  - Author name + role badge + time ago ("2 hours ago")
  - Student name / "Class story"
  - **AI caption** (1 sentence, italic) — or draft_text excerpt if AI not done
  - Photos (thumbnail strip, click to enlarge)
  - **"Read full story"** expands to show `ai_text`
  - Edit ✏ / Delete 🗑 (author or admin only)
- Filter bar: All | My stories | Class stories | Student dropdown

---

## AI prompt (Claude API call)

```
System: You are a warm, professional early childhood educator writing daycare daily stories.
Human: A staff member/parent wrote this note about [student_name] at [school_name]:
"[draft_text]"

Please:
1. Write an elaborated version (2-3 short paragraphs) that's warm, celebratory, and specific
2. Generate a single-sentence caption (max 15 words) for a timeline preview

Respond in JSON: { "story": "...", "caption": "..." }
```

**Model:** claude-haiku-4-5 (fast, cheap for short text)
**Trigger:** Supabase Edge Function called after insert into `stories` table

---

## DB migration (R1)

```sql
create table stories (
  id            uuid primary key default gen_random_uuid(),
  school_id     uuid not null references schools(id) on delete cascade,
  student_id    uuid references students(id),
  room_id       uuid references rooms(id),
  author_id     uuid not null references profiles(id),
  author_role   text not null check (author_role in ('admin','staff','parent')),
  draft_text    text not null,
  ai_text       text,
  ai_caption    text,
  media_urls    text[] default '{}',
  status        text not null default 'published' check (status in ('draft','published','archived')),
  published_at  timestamptz default now(),
  created_at    timestamptz default now()
);

-- RLS: school scoped, parent sees only stories about their children
alter table stories enable row level security;
```

---

## R1+ ideas (beyond MVP of Stories)
- **Daily quote on check-in screen** — after PIN verified, show a rotating inspirational quote or "Good morning, Adrith! 🌞" — R2 feature, NOT in current scope
- Story reactions (❤️ 👏 🌟) from parents
- Weekly digest email to parents with their child's stories
- Story templates for staff ("Milestone", "Funny moment", "Group activity", "Growth observation")

---

## Screenshots to add
> [ ] Stories timeline view (mockup)
> [ ] Write story modal
> [ ] Story card with AI caption
