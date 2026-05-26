/* ============================================================
   theme.js — categories, colors, and shared visual constants
   ============================================================ */

const APEX_THEME = {
  categories: [
    { id: 'work',     label: 'Work',         color: '#ff6b1a', icon: '⚙' },
    { id: 'meeting',  label: 'Meeting',      color: '#5ab0ff', icon: '◇' },
    { id: 'fitness',  label: 'Fitness',      color: '#4ade80', icon: '▲' },
    { id: 'personal', label: 'Personal',     color: '#c084fc', icon: '●' },
    { id: 'travel',   label: 'Travel',       color: '#ffb547', icon: '➤' },
    { id: 'health',   label: 'Health',       color: '#f472b6', icon: '+' },
    { id: 'meal',     label: 'Meal',         color: '#fbbf24', icon: '◉' },
    { id: 'other',    label: 'Other',        color: '#94a3b8', icon: '•' }
  ],

  getCategory(id) {
    return this.categories.find(c => c.id === id) || this.categories[this.categories.length - 1];
  },

  /* Populate the category legend in the side rail */
  renderLegend(container) {
    if (!container) return;
    container.innerHTML = this.categories.map(c => `
      <li>
        <span class="legend__swatch" style="background:${c.color}22;border-left-color:${c.color}"></span>
        <span>${c.label}</span>
      </li>
    `).join('');
  },

  /* Populate the category <select> in the modal */
  renderSelect(select) {
    if (!select) return;
    select.innerHTML = this.categories.map(c =>
      `<option value="${c.id}">${c.label}</option>`
    ).join('');
  }
};

window.APEX_THEME = APEX_THEME;
