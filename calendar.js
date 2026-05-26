/* ============================================================
   calendar.js — view rendering (month / week / day)
   ============================================================ */

const APEX_CALENDAR = (() => {

  /* ---------- date helpers ---------- */
  const pad = n => String(n).padStart(2, '0');
  const fmtDate = d => `${d.getFullYear()}-${pad(d.getMonth()+1)}-${pad(d.getDate())}`;
  const parseDate = s => { const [y,m,d] = s.split('-').map(Number); return new Date(y, m-1, d); };

  const MONTHS = ['January','February','March','April','May','June','July','August','September','October','November','December'];
  const WEEKDAYS_SHORT = ['SUN','MON','TUE','WED','THU','FRI','SAT'];
  const WEEKDAYS_LONG = ['Sunday','Monday','Tuesday','Wednesday','Thursday','Friday','Saturday'];

  /* ---------- MONTH VIEW ---------- */
  function renderMonth(root, cursor, selectedDate, onSelect, onEventClick) {
    const year = cursor.getFullYear();
    const month = cursor.getMonth();
    const todayStr = fmtDate(new Date());
    const selectedStr = fmtDate(selectedDate);

    const first = new Date(year, month, 1);
    const startOffset = first.getDay();
    const daysInMonth = new Date(year, month + 1, 0).getDate();
    const daysInPrev = new Date(year, month, 0).getDate();

    /* Build 6×7 grid */
    const cells = [];
    for (let i = 0; i < startOffset; i++) {
      const day = daysInPrev - startOffset + i + 1;
      cells.push({ date: new Date(year, month - 1, day), otherMonth: true });
    }
    for (let d = 1; d <= daysInMonth; d++) {
      cells.push({ date: new Date(year, month, d), otherMonth: false });
    }
    while (cells.length < 42) {
      const d = cells.length - (startOffset + daysInMonth) + 1;
      cells.push({ date: new Date(year, month + 1, d), otherMonth: true });
    }

    root.innerHTML = `
      <div class="cal-weekdays">
        ${WEEKDAYS_SHORT.map(d => `<div class="cal-weekday">${d}</div>`).join('')}
      </div>
      <div class="cal-grid">
        ${cells.map(cell => {
          const dStr = fmtDate(cell.date);
          const evts = APEX_EVENTS.forDate(dStr);
          const isToday = dStr === todayStr;
          const isSelected = dStr === selectedStr;
          const classes = [
            'cal-day',
            cell.otherMonth ? 'is-other-month' : '',
            isToday ? 'is-today' : '',
            isSelected ? 'is-selected' : ''
          ].filter(Boolean).join(' ');

          const shown = evts.slice(0, 3);
          const extra = evts.length - shown.length;

          return `
            <div class="${classes}" data-date="${dStr}">
              <span class="cal-day__num">${cell.date.getDate()}</span>
              <div class="cal-day__events">
                ${shown.map(e => {
                  const cat = APEX_THEME.getCategory(e.category);
                  return `
                    <div class="cal-event" data-event-id="${e.id}"
                         style="border-left-color:${cat.color};background:${cat.color}1a">
                      <span class="cal-event__time">${e.start}</span>${escapeHTML(e.title)}
                    </div>
                  `;
                }).join('')}
                ${extra > 0 ? `<div class="cal-event__more">+${extra} more</div>` : ''}
              </div>
            </div>
          `;
        }).join('')}
      </div>
    `;

    /* Wire clicks */
    root.querySelectorAll('.cal-day').forEach(el => {
      el.addEventListener('click', (e) => {
        if (e.target.closest('.cal-event')) return;
        onSelect(el.dataset.date);
      });
    });

    root.querySelectorAll('.cal-event').forEach(el => {
      el.addEventListener('click', (e) => {
        e.stopPropagation();
        onEventClick(el.dataset.eventId);
      });
    });
  }

  /* ---------- WEEK VIEW ---------- */
  function renderWeek(root, cursor, onSlotClick, onEventClick) {
    const start = new Date(cursor);
    start.setDate(start.getDate() - start.getDay());
    const todayStr = fmtDate(new Date());

    const days = [];
    for (let i = 0; i < 7; i++) {
      const d = new Date(start);
      d.setDate(d.getDate() + i);
      days.push(d);
    }

    const hours = Array.from({ length: 24 }, (_, i) => i);

    let html = '<div class="week-view"><div class="week-header__cell"></div>';
    days.forEach(d => {
      const isToday = fmtDate(d) === todayStr;
      html += `
        <div class="week-header__cell ${isToday ? 'is-today' : ''}">
          <div class="week-header__day">${WEEKDAYS_SHORT[d.getDay()]}</div>
          <div class="week-header__date">${d.getDate()}</div>
        </div>
      `;
    });

    hours.forEach(h => {
      html += `<div class="week-hour-label">${pad(h)}:00</div>`;
      days.forEach(d => {
        html += `<div class="week-slot" data-date="${fmtDate(d)}" data-hour="${h}"></div>`;
      });
    });

    html += '</div>';
    root.innerHTML = html;

    /* Inject events into slots */
    days.forEach(d => {
      const dStr = fmtDate(d);
      const evts = APEX_EVENTS.forDate(dStr);
      evts.forEach(e => {
        const startH = parseInt(e.start.slice(0,2));
        const startM = parseInt(e.start.slice(3,5));
        const endH = parseInt(e.end.slice(0,2));
        const endM = parseInt(e.end.slice(3,5));
        const slot = root.querySelector(`.week-slot[data-date="${dStr}"][data-hour="${startH}"]`);
        if (!slot) return;
        const cat = APEX_THEME.getCategory(e.category);
        const heightPx = ((endH - startH) * 60 + (endM - startM)) * (40 / 60);
        const topPx = (startM / 60) * 40;
        const evEl = document.createElement('div');
        evEl.className = 'week-event';
        evEl.dataset.eventId = e.id;
        evEl.style.top = `${topPx}px`;
        evEl.style.height = `${Math.max(heightPx, 24)}px`;
        evEl.style.borderLeftColor = cat.color;
        evEl.style.background = cat.color + '22';
        evEl.innerHTML = `
          <div class="week-event__title">${escapeHTML(e.title)}</div>
          <div class="week-event__time">${e.start}–${e.end}</div>
        `;
        slot.appendChild(evEl);
      });
    });

    /* Slot clicks → new event */
    root.querySelectorAll('.week-slot').forEach(el => {
      el.addEventListener('click', (e) => {
        if (e.target.closest('.week-event')) return;
        onSlotClick(el.dataset.date, parseInt(el.dataset.hour));
      });
    });

    root.querySelectorAll('.week-event').forEach(el => {
      el.addEventListener('click', (e) => {
        e.stopPropagation();
        onEventClick(el.dataset.eventId);
      });
    });
  }

  /* ---------- DAY VIEW ---------- */
  function renderDay(root, cursor, onSlotClick, onEventClick) {
    const dStr = fmtDate(cursor);
    const hours = Array.from({ length: 24 }, (_, i) => i);

    let html = '<div class="day-view">';
    hours.forEach(h => {
      html += `
        <div class="day-view__hour">${pad(h)}:00</div>
        <div class="day-view__slot" data-date="${dStr}" data-hour="${h}"></div>
      `;
    });
    html += '</div>';
    root.innerHTML = html;

    const evts = APEX_EVENTS.forDate(dStr);
    evts.forEach(e => {
      const startH = parseInt(e.start.slice(0,2));
      const startM = parseInt(e.start.slice(3,5));
      const endH = parseInt(e.end.slice(0,2));
      const endM = parseInt(e.end.slice(3,5));
      const slot = root.querySelector(`.day-view__slot[data-hour="${startH}"]`);
      if (!slot) return;
      const cat = APEX_THEME.getCategory(e.category);
      const heightPx = ((endH - startH) * 60 + (endM - startM));
      const topPx = startM;
      const evEl = document.createElement('div');
      evEl.className = 'day-event';
      evEl.dataset.eventId = e.id;
      evEl.style.top = `${topPx}px`;
      evEl.style.height = `${Math.max(heightPx, 40)}px`;
      evEl.style.borderLeftColor = cat.color;
      evEl.style.background = cat.color + '1f';
      evEl.innerHTML = `
        <div class="day-event__title">${escapeHTML(e.title)}</div>
        <div class="day-event__time">${e.start} – ${e.end} · ${cat.label}</div>
        ${e.location ? `<div class="day-event__loc">${escapeHTML(e.location)}</div>` : ''}
      `;
      slot.appendChild(evEl);
    });

    root.querySelectorAll('.day-view__slot').forEach(el => {
      el.addEventListener('click', (e) => {
        if (e.target.closest('.day-event')) return;
        onSlotClick(el.dataset.date, parseInt(el.dataset.hour));
      });
    });

    root.querySelectorAll('.day-event').forEach(el => {
      el.addEventListener('click', (e) => {
        e.stopPropagation();
        onEventClick(el.dataset.eventId);
      });
    });
  }

  /* ---------- HELPERS ---------- */
  function escapeHTML(s) {
    return String(s).replace(/[&<>"']/g, ch => ({
      '&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'
    }[ch]));
  }

  function monthLabel(d) {
    return `${MONTHS[d.getMonth()]} ${d.getFullYear()}`;
  }

  function weekLabel(d) {
    const start = new Date(d);
    start.setDate(start.getDate() - start.getDay());
    const end = new Date(start);
    end.setDate(end.getDate() + 6);
    return `${MONTHS[start.getMonth()].slice(0,3)} ${start.getDate()} – ${MONTHS[end.getMonth()].slice(0,3)} ${end.getDate()}`;
  }

  function dayLabel(d) {
    return `${WEEKDAYS_LONG[d.getDay()]}, ${MONTHS[d.getMonth()]} ${d.getDate()}`;
  }

  return {
    renderMonth, renderWeek, renderDay,
    monthLabel, weekLabel, dayLabel,
    fmtDate, parseDate, escapeHTML,
    WEEKDAYS_LONG, MONTHS
  };
})();

window.APEX_CALENDAR = APEX_CALENDAR;
