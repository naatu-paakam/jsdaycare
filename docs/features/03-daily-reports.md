# Feature 3 — Daily Activity Reports

**Release:** MVP  
**Priority:** P0 — key parent-facing value

---

## Overview
Staff log activities throughout the day as a chronological event feed per child. The feed assembles into a Daily Report that parents see only after staff marks it Done.

---

## Feed View (staff + parent)
- Child name + photo header with dropdown to switch between children
- Date range filter (default: today)
- Action type filter (dropdown — filter by activity type)
- Two tabs:
  - **Today** — live chronological feed of all activity entries
  - **Daily Report** — assembled report view (what parent sees after Done)
- Each entry shows: activity icon, description, timestamp, Edit link
- Entries logged with staff name and room (e.g. "In JsJoyFamily3428 by Jaya Bijjala")
- Times shown in school timezone

---

## Activity Types (12)
Staff tap **+ Add Activity** and select from:

| Icon | Type | Description |
|---|---|---|
| 📷 | **Photo** | Upload photo(s) |
| 🎥 | **Video** | Upload video clip |
| 🍎 | **Food** | Meal or bottle entry |
| 😴 | **Nap** | Sleep session with sleep checks |
| 🚽 | **Potty** | Diaper or bathroom visit |
| 📝 | **Note** | Free-text note |
| 🏅 | **Kudos** | Positive shoutout for the child |
| 💊 | **Meds** | Medication administered |
| 👤 | **Name to Face** | Identity verification (used at pickup) |
| 🩹 | **Incident** | Injury or incident report |
| ❤️ | **Health Check** | Wellness check entry |
| 🔤 | **Observation** | Developmental or behavioral observation |

> **Learning / Curriculum** — deferred to R2 (AI-enabled)

---

## Add Activity — Common Fields (all types)
| Field | Notes |
|---|---|
| Room | Dropdown — which room the entry is for |
| Date | Required, defaults to today |
| Time | Required, defaults to current time |
| Note | Free-text note with optional photo attachment |
| Staff Only | Checkbox — if checked, entry is hidden from parent view |

---

## Activity-Specific Fields

### Food
| Field | Options |
|---|---|
| Food type | Food / Bottle (radio) |
| Food quantity | All / Most / Some / None |
| Meal type | Breakfast / Lunch / Snack / Dinner (dropdown) |
| Meal items | Dropdown (configurable by admin) |

### Nap
- Log nap start → nap end as separate events (or single entry with start/end times)
- **Sleep Checks** logged mid-nap (staff periodically check on sleeping child):
  - Time of check
  - Position: Back / Side / Stomach
  - Logged by staff name
- Duration auto-calculated from start to end

### Potty
| Field | Options |
|---|---|
| Type | Wet / BM / Dry / Used potty |

### Meds
| Field | Notes |
|---|---|
| Medication name | Text |
| Dose | Amount given |
| Time administered | Required |
| Administered by | Staff name (auto-filled) |

### Incident
- Captured here in the feed AND creates a formal incident report in Forms & Compliance
- See Feature 8 for full incident report fields

### Health Check
| Field | Options |
|---|---|
| Temperature | Optional numeric |
| Symptoms | Free text |
| Action taken | Free text |

### Observation
| Field | Notes |
|---|---|
| Area | e.g. Social, Motor, Language, Emotional |
| Description | Free text |

### Kudos
- Free-text shoutout, always visible to parents (Staff Only cannot be checked)

### Name to Face
- Used at pickup to confirm identity match; logs who was verified and by whom

---

## Daily Report
- Auto-assembled from all non-staff-only entries for the day
- Staff marks report **Done** → parent portal unlocks the report
- Parent view is read-only in MVP
- Parent can react ❤️ and reply (R1)

---

## Staff Only Flag
- Any entry can be marked Staff Only at time of logging
- Staff Only entries appear in the staff feed but are excluded from the parent Daily Report
- Useful for internal notes, health observations not ready to share

---

## Screenshots
> [x] Activity feed (chronological timeline) — added  
> [x] Add Activity modal (12 types) — added  
> [x] Food entry form — added  
> [ ] Nap entry with sleep checks  
> [ ] Potty / Meds entry  
