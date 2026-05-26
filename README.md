# APEX — Daily Calendar

Cinematic, automotive-themed daily calendar. Vanilla HTML/CSS/JS. No build step.

## Quick start

Open `index.html` in any modern browser. That's it. Events are saved in your browser's localStorage and persist across sessions.

## File map

| File | Role |
|---|---|
| `index.html` | Markup: instrument cluster, controls, calendar stage, modal |
| `styles.css` | All styling — dark cinematic palette, McLaren-papaya accent |
| `theme.js` | Category definitions (work, fitness, meeting, etc.) + colors |
| `events.js` | Event storage layer — CRUD on top of localStorage |
| `calendar.js` | View rendering — month grid, week timeline, day timeline |
| `app.js` | Orchestration — clock, gauges, navigation, modal, state |

## Features

- **Live instrument cluster header** — digital clock (updates every second), animated RPM-style bar strip, tachometer-style gauge counting today's events (the arc fills as your day fills up), trip computer showing week load / next event / completed events.
- **Three views** — Month (overview grid), Week (timeline with current-time redline), Day (zoomed timeline).
- **Event CRUD** — click any day or time slot to create. Click any event to edit or delete. Press Escape to close the modal.
- **Categories with color coding** — work (papaya), meeting (blue), fitness (green), personal (purple), travel (amber), health (pink), meal (yellow), other (slate).
- **Now-line** — red, like a tach redline, sweeps across the week view at the current time.
- **Persistence** — localStorage. Clear your browser data and your events will reset (with demo events seeded).
- **Keyboard** — Esc closes modal. Tab navigates form fields.

## Design rationale

The brief asked for cinematic + car-themed + functional. The tension between "themed" and "functional" is real — too much theming and the calendar becomes unreadable. The approach here:

- **The chrome carries the theme.** Instrument cluster header, gauge graphics, RPM bars, tach arc, redline marker, monospaced telemetry labels in spaced-out caps.
- **The content stays clean.** The calendar grid itself is restrained — no gauges in the cells, no faux-leather textures over event blocks. Information density wins.
- **The accent does the heavy lifting.** McLaren papaya orange (`#ff6b1a`) is the signature; everything else is grayscale plus muted category colors. This is how Singer, McLaren, and Porsche design product — restraint, not maximalism.

## Customization

- Change the accent color: edit `--accent` in `styles.css` (try `#00d4ff` for an EV / electric blue feel, or `#dc143c` for Ferrari rosso corsa).
- Add categories: edit the `categories` array in `theme.js`.
- Change demo seed data: edit `seedDemoEvents()` in `events.js`.
- Use a different storage key (e.g. for separate calendars): change `KEY` in `events.js`.

## Honest limitations

- **No sync** — this won't connect to Google Calendar, iCloud, or Outlook. That requires OAuth, a backend, and conflict resolution logic. Possible, but out of scope for a static file.
- **No notifications** — browsers can do push notifications, but reliably scheduling them requires either keeping the tab open or a service worker plus permission flow. Not implemented.
- **No recurring events** — every event is a single instance. Adding RRULE support (daily, weekly, etc.) is doable but I left it out rather than implementing it half-way. Ask if you want it.
- **No drag-to-reschedule** — you currently edit times via the modal. Drag-and-drop is nice but adds significant complexity.
- **No multi-day events** — each event lives within one day. Multi-day support means span rendering in the month grid, which is more work than it sounds.

Each of these is a real feature, not a checkbox. Tell me which matter and I'll build them properly rather than stubbing them.
