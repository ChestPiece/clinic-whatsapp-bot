# P2 dashboard design: The Ledger

Chosen direction for the P2 staff dashboard (Inbox, Calendar, Patients). Open `ledger.html` in a browser to see the live mock-up with motion.

Live artifact: https://claude.ai/artifact/AudmmLiUE3Ax9hPhZLmmZk

## Idea

The dashboard looks like the clinic's paper appointment book, writing itself. Reception staff already trust that tool, so the AI disappears into it. No sparkle icons or "AI" cues.

## Type

- Newsreader (serif): headings; Sara's messages in italics
- Onest: interface text
- IBM Plex Mono: times, phone numbers, counts

## Colour tokens

| Token | Light | Use |
|---|---|---|
| paper | `#f4efe5` | page background (4px dot texture) |
| card | `#fbf8f1` | slips, panels |
| ink | `#1d1b17` | text |
| muted | `#736c60` | secondary text |
| rule | `#ddd4c3` / `#e9e2d4` | dividers |
| red | `#c4512d` / `#f4dccf` | needs staff |
| sage | `#4f6f5c` / `#dfe8df` | WhatsApp channel |
| blue | `#33506e` / `#dbe3eb` | Website channel |

Dark: paper `#17150f`, card `#201d17`, ink `#efe8da`. Sage matches the existing Stone & Sage primary in `src/app/globals.css`.

## Layout

- Masthead: "The appointment book, writing itself."
- Tally row: booked by Sara, after hours, need staff. Counters bump with a spring on change.
- Conversation slip (340px, torn top edge, dashed dividers) with a "Take over" pill and an owner label (Sara / Needs you / Done).
- Week calendar, 9:00 to 19:00, 52px hour rows. Blocks colour-coded by channel with a 3px left border. Red "now" line.
- Mobile: calendar shows 3 days.

## Motion

- New appointment blocks drop in: `translateY(-40px) rotate(-3deg)` to rest, `cubic-bezier(.34,1.56,.64,1)`.
- Sara's replies type out with a caret.
- Respect `prefers-reduced-motion`.

## Still to do

Turn this into the full P2 spec: per-screen layouts for `/dashboard/inbox`, `/dashboard/calendar` and `/dashboard/patients`, shadcn component mapping, token additions to `globals.css`, and Arabic RTL rules.
