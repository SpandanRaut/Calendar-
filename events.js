/* ============================================================
   events.js — event storage layer (localStorage)
   Schema:
     { id, title, date (YYYY-MM-DD), start (HH:MM), end (HH:MM),
       category, location, notes, completed }
   ============================================================ */

const APEX_EVENTS = (() => {

  const KEY = 'apex_calendar_events_v1';
  let cache = null;

  function load() {
    if (cache) return cache;
    try {
      const raw = localStorage.getItem(KEY);
      cache = raw ? JSON.parse(raw) : seedDemoEvents();
      if (!raw) save();
    } catch (e) {
      console.warn('Failed to load events:', e);
      cache = [];
    }
    return cache;
  }

  function save() {
    try {
      localStorage.setItem(KEY, JSON.stringify(cache));
    } catch (e) {
      console.warn('Failed to save events:', e);
    }
  }

  function uid() {
    return 'e_' + Date.now().toString(36) + '_' + Math.random().toString(36).slice(2, 8);
  }

  /* First-run demo events so the calendar isn't empty */
  function seedDemoEvents() {
    const today = new Date();
    const fmt = d => d.toISOString().slice(0, 10);
    const offset = n => { const d = new Date(today); d.setDate(d.getDate() + n); return fmt(d); };

    return [
      { id: uid(), title: 'Morning workout',         date: offset(0),  start: '06:30', end: '07:30', category: 'fitness',  location: 'Home gym',       notes: '', completed: false },
      { id: uid(), title: 'Team standup',            date: offset(0),  start: '09:30', end: '10:00', category: 'meeting',  location: 'Zoom',           notes: '', completed: false },
      { id: uid(), title: 'Deep work — quarterly plan', date: offset(0), start: '10:30', end: '12:30', category: 'work',     location: 'Office',         notes: '', completed: false },
      { id: uid(), title: 'Lunch',                   date: offset(0),  start: '13:00', end: '13:45', category: 'meal',     location: '',               notes: '', completed: false },
      { id: uid(), title: 'Client review',           date: offset(1),  start: '14:00', end: '15:30', category: 'meeting',  location: 'Conference Rm 2', notes: '', completed: false },
      { id: uid(), title: 'Run — 10km',              date: offset(2),  start: '07:00', end: '08:00', category: 'fitness',  location: 'Hyde Park',      notes: '', completed: false },
      { id: uid(), title: 'Dentist appointment',     date: offset(3),  start: '11:00', end: '12:00', category: 'health',   location: 'Smile Clinic',   notes: '', completed: false },
      { id: uid(), title: 'Flight to Munich',        date: offset(5),  start: '06:00', end: '09:30', category: 'travel',   location: 'LHR T5',         notes: 'Check-in 4:30am', completed: false }
    ];
  }

  return {

    all() { return load().slice(); },

    forDate(dateStr) {
      return load()
        .filter(e => e.date === dateStr)
        .sort((a, b) => a.start.localeCompare(b.start));
    },

    forRange(startStr, endStr) {
      return load()
        .filter(e => e.date >= startStr && e.date <= endStr)
        .sort((a, b) => a.date.localeCompare(b.date) || a.start.localeCompare(b.start));
    },

    get(id) { return load().find(e => e.id === id); },

    create(data) {
      const event = { id: uid(), completed: false, ...data };
      load().push(event);
      save();
      return event;
    },

    update(id, patch) {
      const list = load();
      const idx = list.findIndex(e => e.id === id);
      if (idx === -1) return null;
      list[idx] = { ...list[idx], ...patch };
      save();
      return list[idx];
    },

    remove(id) {
      cache = load().filter(e => e.id !== id);
      save();
    },

    /* Stats for the dashboard gauges */
    stats() {
      const today = new Date().toISOString().slice(0, 10);
      const weekStart = (() => {
        const d = new Date();
        d.setDate(d.getDate() - d.getDay());
        return d.toISOString().slice(0, 10);
      })();
      const weekEnd = (() => {
        const d = new Date();
        d.setDate(d.getDate() + (6 - d.getDay()));
        return d.toISOString().slice(0, 10);
      })();

      const todays = this.forDate(today);
      const weekly = this.forRange(weekStart, weekEnd);

      const now = new Date();
      const nowMin = now.getHours() * 60 + now.getMinutes();

      const upcoming = todays
        .map(e => ({ ...e, startMin: parseInt(e.start.slice(0,2))*60 + parseInt(e.start.slice(3,5)) }))
        .filter(e => e.startMin >= nowMin)
        .sort((a,b) => a.startMin - b.startMin)[0];

      const completed = todays.filter(e => {
        const endMin = parseInt(e.end.slice(0,2))*60 + parseInt(e.end.slice(3,5));
        return endMin <= nowMin;
      }).length;

      return {
        today: todays.length,
        week: weekly.length,
        next: upcoming ? `${upcoming.start} ${upcoming.title}` : '—',
        completed
      };
    }
  };
})();

window.APEX_EVENTS = APEX_EVENTS;
