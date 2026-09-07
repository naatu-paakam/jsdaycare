# Daycare Portal — Business Case

## Market Context

**Brightwheel** (the market leader for small daycares) charges ~$25/month for a basic plan.
That's the pricing floor we compete on — but we win on *features they don't have*, not price alone.

The target buyer: **small-to-mid family daycare** — 1–3 staff, 15–50 kids, typically owner-operated.
Their biggest pain points: parent communication, licensing paperwork, check-in logistics, and
state inspection prep.

---

## Key Differentiators

### 1. Single Check-in Code — Follows the Parent, Not the School

Most systems generate a PIN per school or per child. If a parent has two kids at two schools,
they juggle two PINs — neither of which they set.

**Our model:** One code per parent, globally unique, set by the parent themselves (easy to
remember — like a personal ATM PIN). Works across all schools their children attend.

**Why it matters:** Reduces friction at drop-off, reduces "forgot my PIN" calls to admin,
and makes multi-school families (e.g. siblings at different campuses) seamless.

---

### 2. AI-Enhanced Daily Stories & Weekly Summaries

Staff log quick activities: nap, meals, potty, observations. The AI layer converts these sparse
data points into warm, readable narratives — daily updates or weekly digest emails to parents.

> "Lily had a great nap today, woke up happy, and loved her afternoon snack. She spent time
> stacking blocks and showed real focus — her coordination is improving week by week."

Parents *emotionally* subscribe to this. A competitor who only shows a table of "nap: 90 min,
meal: 80%" loses to a product that makes parents feel connected to their child's day.

**Brightwheel has basic activity logging. It does not have AI narrative generation.**

---

### 3. License Governance & Remote Audit Support

**This is the biggest unaddressed gap in the market.**

State licensing agencies conduct physical inspections of daycare facilities. Inspectors review:
- Immunization records
- Emergency contact completeness
- Staff certifications
- Attendance logs
- Compliance forms and policies

Today, inspectors drive to the facility, ask staff to pull binders, and spend hours on-site.
Daycare owners spend weeks prepping paperwork before each inspection — time taken away from kids.

**Our model (R1):**
- A dedicated **auditor/inspector persona** with read-only access scoped to compliance data
- Inspectors can review immunization status, staff certifications, and forms *remotely*
- Daycares share a time-limited audit link — no login required for the agency
- Inspection prep time drops from days to minutes

**Business impact:**
- Daycare owners get more time with kids (their actual job)
- Licensing agencies complete more inspections per inspector per day
- Reduces friction between regulatory bodies and small daycares — which is a real relationship problem

**No competitor in the $25–99/month segment serves this use case.**

---

## Subscription Model

| Tier | Price | For |
|---|---|---|
| **Starter** | $25/mo | 1 location, up to 30 children |
| **Growth** | $49/mo | 1 location, up to 75 children, AI stories |
| **Multi-Site** | $99/mo | Up to 5 locations, audit access, full AI |
| **Enterprise** | Custom | Chains, 6+ locations, white-label, API |

Annual plans: 2 months free (locks in ARR, reduces churn).

---

## Why Daycares Switch

1. **Their kids are in two schools** — single code, set by themselves, works everywhere
2. **Parents want more than a log** — AI stories create emotional stickiness
3. **Inspection season is brutal** — remote audit access is a genuine time-saver
4. **Brightwheel doesn't do any of these three**

---

## R1 Roadmap Priorities (Revenue-Critical)

1. **AI story generation** — daily activity feed → warm parent narrative (Stories feature)
2. **Audit persona** — read-only inspector access, time-limited audit link
3. **Weekly digest emails** — AI summary sent to parents every Friday
4. **Tuition / invoicing** — once you collect money for them, churn drops to near zero

