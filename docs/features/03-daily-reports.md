# Feature 3 — Daily Activity Reports

**Release:** MVP  
**Priority:** P0 — key parent-facing value

---

## Overview
Staff log what happened with each child throughout the day. Report is visible to parents at end of day (or in real-time in R1 with push notifications).

---

## Log Categories

### Meals
- Breakfast / Lunch / Snack / Dinner
- What was offered
- How much eaten: All | Most | Some | Little | None
- Notes (e.g. "refused vegetables today")

### Nap / Sleep
- Start time, end time
- Quality: Good | Restless | Didn't sleep
- Notes

### Diapers / Bathroom
- Time
- Type: Wet | BM | Dry | Used potty
- Notes

### Mood & Behavior
- Overall mood: Happy | Fussy | Tired | Upset | Great day
- Free-text notes

### Activities
- Checkboxes: art, music, outdoor play, story time, sensory play, learning activity, etc.
- Staff can add custom activity notes

### Photos & Media
- Staff can attach up to 5 photos per day per child
- Stored in Supabase Storage

---

## Report Lifecycle
1. Staff add entries throughout the day (per category)
2. Report auto-assembles from entries
3. At end of day, report is marked "sent" — parent can view in their portal
4. Parent can react with a ❤️ or leave a note (R1)

---

## Screenshots to add
> [ ] Daily report feed (parent view)  
> [ ] Staff entry screen (meal log)  
> [ ] Staff entry screen (diaper log)  
> [ ] Photo upload in daily report  
