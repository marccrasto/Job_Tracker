// Frontend for the job tracker. Plain JavaScript, no framework.
// Everything talks to the Express API with fetch().

const STATUSES = ['applied', 'interview', 'offer', 'rejected'];

const rowsEl = document.getElementById('app-rows');
const emptyEl = document.getElementById('empty-state');
const listErrorEl = document.getElementById('list-error');
const formEl = document.getElementById('add-form');
const formErrorEl = document.getElementById('form-error');
const filterEl = document.getElementById('status-filter');

// The status currently picked in the "Show" dropdown ('' means all).
let currentFilter = '';

// ---------------------------------------------------------------------------
// Small fetch wrapper: sends JSON, parses JSON, throws a readable error on 4xx/5xx.
// ---------------------------------------------------------------------------
async function api(path, options = {}) {
  const res = await fetch(path, {
    headers: { 'Content-Type': 'application/json' },
    ...options,
  });

  if (res.status === 204) return null;

  const data = await res.json().catch(() => null);
  if (!res.ok) {
    throw new Error((data && data.error) || `Request failed (${res.status})`);
  }
  return data;
}

// ---------------------------------------------------------------------------
// Loading and rendering the list
// ---------------------------------------------------------------------------
async function loadApplications() {
  listErrorEl.textContent = '';
  try {
    const query = currentFilter ? `?status=${encodeURIComponent(currentFilter)}` : '';
    const apps = await api(`/api/applications${query}`);
    renderApplications(apps);
  } catch (err) {
    listErrorEl.textContent = `Couldn't load applications: ${err.message}`;
  }
}

function renderApplications(apps) {
  // Completely replaces children of rowsEl with new set of children. If called with no args, then empties child nodes
  rowsEl.replaceChildren();
  emptyEl.hidden = apps.length > 0;

  for (const app of apps) {
    const tr = document.createElement('tr');

    // Company (linked to the posting if there is one)
    const companyTd = document.createElement('td');
    if (app.link) {
      const a = document.createElement('a');
      a.href = app.link;
      a.target = '_blank';
      a.rel = 'noopener noreferrer';
      a.textContent = app.company;
      companyTd.append(a);
    } else {
      companyTd.textContent = app.company;
    }

    const roleTd = document.createElement('td');
    roleTd.textContent = app.role;

    const dateTd = document.createElement('td');
    dateTd.textContent = formatDate(app.applied_on);

    // Status dropdown: changing it should update the database (your TODO below)
    const statusTd = document.createElement('td');
    const select = document.createElement('select');
    select.className = 'status';
    select.dataset.status = app.status;
    select.setAttribute('aria-label', `Status for ${app.company}`);
    for (const s of STATUSES) {
      const opt = document.createElement('option');
      opt.value = s;
      opt.textContent = s[0].toUpperCase() + s.slice(1);
      opt.selected = s === app.status;
      select.append(opt);
    }
    select.addEventListener('change', () => updateStatus(app.id, select.value, select));
    statusTd.append(select);

    const notesTd = document.createElement('td');
    notesTd.className = 'notes';
    notesTd.textContent = app.notes || '';

    const actionsTd = document.createElement('td');
    const del = document.createElement('button');
    del.className = 'link';
    del.textContent = 'Delete';
    del.addEventListener('click', () => deleteApplication(app.id, app.company));
    actionsTd.append(del);

    tr.append(companyTd, roleTd, dateTd, statusTd, notesTd, actionsTd);
    rowsEl.append(tr);
  }
}

// Postgres DATE arrives as "2026-11-14T00:00:00.000Z"; show it as "Nov 14, 2026".
function formatDate(value) {
  if (!value) return '';
  const [y, m, d] = String(value).slice(0, 10).split('-').map(Number);
  return new Date(y, m - 1, d).toLocaleDateString(undefined, {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  });
}

// ---------------------------------------------------------------------------
// Stats cards at the top
// ---------------------------------------------------------------------------
async function loadStats() {
  try {
    const stats = await api('/api/stats');
    renderStats(stats);
  } catch (err) {
    // Stats are a nice-to-have, so a failure here shouldn't break the page.
    console.warn('Could not load stats:', err.message);
  }
}

function renderStats(stats) {
  // -------------------------------------------------------------------------
  // YOUR CODE GOES HERE
  //
  // `stats` looks like: { total: 12, applied: 8, interview: 3, offer: 1, rejected: 0 }
  // (that's whatever your GET /api/stats route returns).
  //
  // Goal: put each number into its card. The cards in index.html have ids
  //   stat-total, stat-applied, stat-interview, stat-offer, stat-rejected
  //
  // Hints:
  //   - document.getElementById(...) finds an element; set its .textContent.
  //   - Notice the ids are "stat-" + the key. Rather than five nearly identical
  //     lines, try looping over ['total', ...STATUSES] and building the id
  //     with a template string: `stat-${key}`.
  //   - Use ?? 0 so a missing key shows 0 instead of "undefined".
  // -------------------------------------------------------------------------
  ['total', ...STATUSES].forEach((key) => {
    const card = document.getElementById(`stat-${key}`);
    card.textContent = stats[key] ?? 0;
  });
}

// ---------------------------------------------------------------------------
// Create, update, delete
// ---------------------------------------------------------------------------
formEl.addEventListener('submit', async (event) => {
  event.preventDefault();
  formErrorEl.textContent = '';

  // FormData reads every named input in the form; Object.fromEntries turns it
  // into a plain object like { company: 'Shopify', role: 'Junior Dev', ... }
  const data = Object.fromEntries(new FormData(formEl));

  if (!data.company.trim() || !data.role.trim()) {
    formErrorEl.textContent = 'Company and role are required.';
    return;
  }

  try {
    await api('/api/applications', { method: 'POST', body: JSON.stringify(data) });
    formEl.reset();
    await refresh();
  } catch (err) {
    formErrorEl.textContent = err.message;
  }
});

async function updateStatus(id, newStatus, selectEl) {
  // -------------------------------------------------------------------------
  // YOUR CODE GOES HERE
  //
  // Called when someone changes a row's status dropdown.
  // Goal: save the new status through your PATCH /api/applications/:id route.
  //
  // Steps:
  //   1. Call the api() helper above with:
  //        - the path `/api/applications/${id}`
  //        - method 'PATCH'
  //        - a JSON body of { status: newStatus }
  //      Look at how the form submit handler calls api() with POST; it's
  //      almost the same call.
  //   2. On success, update selectEl.dataset.status = newStatus so the pill
  //      colour changes (the CSS keys off data-status), then call refresh()
  //      so the stats cards update and the row disappears if it no longer
  //      matches the current filter.
  //   3. Wrap it in try/catch. On failure, show the message in listErrorEl
  //      and put the dropdown back to its old value (selectEl.dataset.status
  //      still holds the old one until step 2 runs).
  // -------------------------------------------------------------------------
  const prevStatus = selectEl.dataset.status;
  try {
    await api(`/api/applications/${id}`, {method: 'PATCH', body: JSON.stringify({status: newStatus})});
    selectEl.dataset.status = newStatus;
    await refresh();
  }
  catch (err) {
    listErrorEl.textContent = err.message;
    selectEl.value = prevStatus;
  }
}

async function deleteApplication(id, company) {
  if (!confirm(`Delete the application for ${company}?`)) return;
  try {
    await api(`/api/applications/${id}`, { method: 'DELETE' });
    await refresh();
  } catch (err) {
    listErrorEl.textContent = err.message;
  }
}

// ---------------------------------------------------------------------------
// Filter dropdown
// ---------------------------------------------------------------------------
// ---------------------------------------------------------------------------
// YOUR CODE GOES HERE
//
// Goal: when the "Show" dropdown (filterEl) changes, show only that status.
//
// Steps:
//   1. Add a 'change' event listener to filterEl (see how the status <select>
//      in renderApplications does it).
//   2. In it, set currentFilter to filterEl.value.
//   3. Call loadApplications(). It already reads currentFilter and adds
//      ?status=... to the request; the backend filtering is done for you.
//
// Bonus: remember the choice across page reloads with localStorage
// (setItem when it changes, getItem on startup and set filterEl.value).
// ---------------------------------------------------------------------------
filterEl.addEventListener('change', () => {
  currentFilter = filterEl.value;
  try {
    localStorage.setItem('filter', currentFilter);
  }
  catch {
    // Stick to old filter
  }
  loadApplications();
});

function renderFilter() {
  try {
    currentFilter = localStorage.getItem('filter') ?? '';
  }
  catch {
    currentFilter = '';
  }
  filterEl.value = currentFilter;
}

// ---------------------------------------------------------------------------
// Startup
// ---------------------------------------------------------------------------
async function refresh() {
  await Promise.all([loadApplications(), loadStats()]);
}

renderFilter();
refresh();