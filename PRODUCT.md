# PRODUCT.md — Haviv Academy

## What it is

A Hebrew-first (RTL) learning portal where the **lab is the product and the academy is the shelf**.
A lab is an interactive system you operate, break and diagnose — a simulator with consequences.
Courses, lessons and tutorials exist to earn trust and search traffic; they are not the offer.

Live at `academy.haviv.pro`. Repo `elad-haviv/academy`. Rebuilt from scratch Oct 2026.

## Who it is for

**Learner (broad):** Israeli electrical engineers and electricians, airfield-lighting and genset
technicians, maintenance crews. Hebrew is the working language. They are practitioners, not
students: they already do the job and need to be right, not certified for its own sake.

**Payer (narrow):** employers, contractors, vocational colleges, airport/port maintenance
departments, licensing bodies. Dozens of payers is a viable business because each one has a
training budget and liability exposure. A hundred thousand free readers is not.

First test audience: IAF personnel (Elad's own domain).

## The offer

- Individual: ₪349/year (default) or ₪39/month, VAT included, 7-day trial without a card,
  14-day refund.
- Free tier: all tutorials, the first lesson of every course, the catalog.
- Paid tier: full lesson bodies, labs, attachments.
- Labs are included but gated behind a `lab:<slug>` entitlement so they can be sold separately
  later without a data migration.
- Employers: seat plans and VAT invoices — a lead form for now, not checkout.

## Launch labs

1. **AGL Field Course** — airfield lighting: short-circuit and disconnection fault-finding.
2. **Genset Academy** — generator set operation and diagnosis.

Both are Elad's own designs, executed under his direction. Never describe them as
"generated with AI": the ideation is the asset.

## The rule that governs the roadmap

A lab ships only where **correctness can be judged** — by Elad or a named credentialed expert.
A plausible-but-wrong safety simulation teaches a confident wrong habit and is worse than
shipping nothing. Every lab carries `correctnessOwner` and `validatedOn`; absent means unpublished.

Next vertical is chosen by: can correctness be judged · are the failure modes interesting ·
does someone with a budget feel the pain. Never by build ease.

## Why anyone should care

YouTube owns video lessons and an LLM summarises any tutorial. What cannot be copied is a system
you can break safely, and institutional endorsement from an engineer with a name. Endorsement
cannot be cloned; content can.

## Non-goals

- A broad course marketplace. Breadth arrives as separate labs behind separate front doors.
- A video library, a community feed, or a mobile app before the payer page works.
- English-first UI. English exists only as a shell for institutional buyers.

## Technical truth

Next.js App Router + TypeScript, hand-written CSS (no Tailwind), `node:sqlite` on a persistent
`/data` volume, scrypt + session-cookie auth. Deploy: Dockerfile → Coolify app
`tp0mlohzj4wd1wsqfajcrkqe`, port 3000. No push-to-deploy hook: trigger `/deploy?uuid=` explicitly.
