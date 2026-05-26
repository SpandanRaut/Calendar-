/* ============================================================
   app.js — orchestration: clock, gauges, view switching, modal
   ============================================================ */

(function () {

  /* ---------- state ---------- */
  let cursor = new Date();      // The date being viewed
  let selected = new Date();    // Currently selected day
  let view = 'month';           // 'month' | 'week' | 'day'

  /* ---------- DOM ---------- */
  const $ = sel => document.querySelector(sel);
  const calRoot = $('#calendar-root');
  const monthLabel = $('#month-label');
  const railDate = $('#rail-date');
  const railEvents = $('#rail-events');

  /* ---------- init theme ---------- */
  APEX_THEME.renderLegend($('#category-legend'));
  APEX_THEME.renderSelect($('#event-category'));

  /* ============================================================
     CLOCK + GAUGES — updates every second
     ============================================================ */
  function tickClock() {
    const now = new Date();
    const hh = String(now.getHours()).padStart(2, '0');
    const mm = String(now.getMinutes()).padStart(2, '0');
    const ss = String(now.getSeconds()).padStart(2, '0');
    $('#clock-time').textContent = `${hh}:${mm}:${ss}`;
    $('#clock-day').textContent = APEX_CALENDAR.WEEKDAYS_LONG[now.getDay()].toUpperCase();
    $('#clock-date').textContent =
      `${APEX_CALENDAR.MONTHS[now.getMonth()].toUpperCase()} ${now.getDate()}`;

    /* Animated bars — like an engine RPM strip */
    const bars = document.querySelectorAll('.clock__bars span');
    const sec = now.getSeconds();
    bars.forEach((b, i) => {
      const lit = (sec % 8) === i;
      b.classList.toggle('is-on', lit);
    });
  }

  function refreshGauges() {
    const stats = APEX_EVENTS.stats();
    $('#tach-value').textContent = stats.today;

    /* Tachometer arc: 0-10 events scales 0-360deg */
    const arc = document.getElementById('tach-arc');
    if (arc) {
      const pct = Math.min(stats.today / 10, 1);
      const total = 364;
      arc.style.strokeDashoffset = total - (total * pct);
    }

    $('#trip-week').textContent = stats.week;
    $('#trip-next').textContent = stats.next.length > 22 ? stats.next.slice(0, 22) + '…' : stats.next;
    $('#trip-done').textContent = stats.completed;
  }

  setInterval(tickClock, 1000);
  setInterval(refreshGauges, 30000);  // gauges refresh every 30s
  tickClock();

  /* ============================================================
     RENDER VIEW
     ============================================================ */
  function render() {
    /* Label */
    if (view === 'month') {
      monthLabel.textContent = APEX_CALENDAR.monthLabel(cursor).toUpperCase();
    } else if (view === 'week') {
      monthLabel.textContent = APEX_CALENDAR.weekLabel(cursor).toUpperCase();
    } else {
      monthLabel.textContent = APEX_CALENDAR.dayLabel(cursor).toUpperCase();
    }

    /* Calendar body */
    if (view === 'month') {
      APEX_CALENDAR.renderMonth(calRoot, cursor, selected,
        (dStr) => { selected = APEX_CALENDAR.parseDate(dStr); render(); },
        (eId) => openEditModal(eId)
      );
    } else if (view === 'week') {
      APEX_CALENDAR.renderWeek(calRoot, cursor,
        (dStr, hour) => openNewModal(dStr, hour),
        (eId) => openEditModal(eId)
      );
      injectNowLine();
    } else {
      APEX_CALENDAR.renderDay(calRoot, cursor,
        (dStr, hour) => openNewModal(dStr, hour),
        (eId) => openEditModal(eId)
      );
    }

    /* Side rail */
    renderRail();
    refreshGauges();
  }

  function renderRail() {
    const dStr = APEX_CALENDAR.fmtDate(selected);
    railDate.textContent = APEX_CALENDAR.dayLabel(selected).toUpperCase();
    const evts = APEX_EVENTS.forDate(dStr);

    if (evts.length === 0) {
      railEvents.innerHTML = `<div class="rail__empty">No events scheduled.</div>`;
      return;
    }

    railEvents.innerHTML = evts.map(e => {
      const cat = APEX_THEME.getCategory(e.category);
      return `
        <div class="rail__event" data-event-id="${e.id}"
             style="border-left-color:${cat.color};background:${cat.color}14">
          <div class="rail__event__title">${APEX_CALENDAR.escapeHTML(e.title)}</div>
          <div class="rail__event__time">${e.start} – ${e.end} · ${cat.label}</div>
          ${e.location ? `<div class="rail__event__loc">${APEX_CALENDAR.escapeHTML(e.location)}</div>` : ''}
        </div>
      `;
    }).join('');

    railEvents.querySelectorAll('.rail__event').forEach(el => {
      el.addEventListener('click', () => openEditModal(el.dataset.eventId));
    });
  }

  /* Now-line for week view (red, like a redline) */
  function injectNowLine() {
    const wv = document.querySelector('.week-view');
    if (!wv) return;
    const now = new Date();
    const startOfWeek = new Date(cursor);
    startOfWeek.setDate(startOfWeek.getDate() - startOfWeek.getDay());
    const endOfWeek = new Date(startOfWeek);
    endOfWeek.setDate(endOfWeek.getDate() + 7);
    if (now < startOfWeek || now >= endOfWeek) return;

    const headerH = 56; // approx header row
    const minutes = now.getHours() * 60 + now.getMinutes();
    const top = headerH + (minutes * (40 / 60));
    const line = document.createElement('div');
    line.className = 'now-line';
    line.style.top = `${top}px`;
    wv.style.position = 'relative';
    wv.appendChild(line);
  }

  /* ============================================================
     NAVIGATION
     ============================================================ */
  $('#btn-prev').addEventListener('click', () => {
    if (view === 'month') cursor.setMonth(cursor.getMonth() - 1);
    else if (view === 'week') cursor.setDate(cursor.getDate() - 7);
    else cursor.setDate(cursor.getDate() - 1);
    cursor = new Date(cursor);
    if (view === 'day') selected = new Date(cursor);
    render();
  });

  $('#btn-next').addEventListener('click', () => {
    if (view === 'month') cursor.setMonth(cursor.getMonth() + 1);
    else if (view === 'week') cursor.setDate(cursor.getDate() + 7);
    else cursor.setDate(cursor.getDate() + 1);
    cursor = new Date(cursor);
    if (view === 'day') selected = new Date(cursor);
    render();
  });

  $('#btn-today').addEventListener('click', () => {
    cursor = new Date();
    selected = new Date();
    render();
  });

  document.querySelectorAll('.view-toggle__btn').forEach(btn => {
    btn.addEventListener('click', () => {
      document.querySelectorAll('.view-toggle__btn').forEach(b => b.classList.remove('is-active'));
      btn.classList.add('is-active');
      view = btn.dataset.view;
      if (view === 'day') cursor = new Date(selected);
      render();
    });
  });

  /* ============================================================
     MODAL — create / edit / delete events
     ============================================================ */
  const modal = $('#event-modal');
  const form = $('#event-form');

  function openNewModal(dateStr, hour) {
    form.reset();
    $('#event-id').value = '';
    $('#modal-title').textContent = 'NEW EVENT';
    $('#btn-delete').hidden = true;

    const d = dateStr || APEX_CALENDAR.fmtDate(selected);
    $('#event-date').value = d;
    const h = (hour !== undefined) ? String(hour).padStart(2,'0') : '09';
    $('#event-start').value = `${h}:00`;
    $('#event-end').value = `${String((parseInt(h) + 1) % 24).padStart(2,'0')}:00`;
    $('#event-category').value = 'work';

    modal.classList.add('is-open');
    setTimeout(() => $('#event-title').focus(), 50);
  }

  function openEditModal(id) {
    const evt = APEX_EVENTS.get(id);
    if (!evt) return;
    form.reset();
    $('#event-id').value = evt.id;
    $('#modal-title').textContent = 'EDIT EVENT';
    $('#event-title').value = evt.title;
    $('#event-date').value = evt.date;
    $('#event-start').value = evt.start;
    $('#event-end').value = evt.end;
    $('#event-category').value = evt.category;
    $('#event-location').value = evt.location || '';
    $('#event-notes').value = evt.notes || '';
    $('#btn-delete').hidden = false;
    modal.classList.add('is-open');
  }

  function closeModal() { modal.classList.remove('is-open'); }

  modal.querySelectorAll('[data-close]').forEach(el => {
    el.addEventListener('click', closeModal);
  });

  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape' && modal.classList.contains('is-open')) closeModal();
  });

  form.addEventListener('submit', (e) => {
    e.preventDefault();
    const data = {
      title: $('#event-title').value.trim(),
      date: $('#event-date').value,
      start: $('#event-start').value,
      end: $('#event-end').value,
      category: $('#event-category').value,
      location: $('#event-location').value.trim(),
      notes: $('#event-notes').value.trim()
    };

    if (data.end <= data.start) {
      alert('End time must be after start time.');
      return;
    }

    const id = $('#event-id').value;
    if (id) APEX_EVENTS.update(id, data);
    else APEX_EVENTS.create(data);

    closeModal();
    render();
  });

  $('#btn-delete').addEventListener('click', () => {
    const id = $('#event-id').value;
    if (!id) return;
    if (!confirm('Delete this event?')) return;
    APEX_EVENTS.remove(id);
    closeModal();
    render();
  });

  $('#btn-add').addEventListener('click', () => openNewModal());

  /* ============================================================
     KICKOFF
     ============================================================ */
  render();

})();
