// ===== CONFIG =====
const PAGE_SIZE = 48;
let allItems = [];
let filteredItems = [];
let displayedCount = 0;
let activeFilters = { type: null, country: null, category: null, tag: null };
let searchQuery = '';
let sortMode = 'default';

// ===== TYPE CONFIG =====
const TYPE_LABELS = {
  MUSHROOM: '🍄 蘑菇',
  FLOWER: '🌸 花卉',
  EXPLORATION: '🧭 探險',
  UNKNOWN: '❓ 未知',
};
const TYPE_COLORS = {
  MUSHROOM: '#a78bfa',
  FLOWER: '#f9a8d4',
  EXPLORATION: '#6ee7b7',
  UNKNOWN: '#94a3b8',
};

const CATEGORY_LABELS = {
  PUBLIC_ART: '公共藝術',
  SCENIC_VIEWPOINT: '景觀點',
  UNIQUE_ARCHITECTURE: '特色建築',
  MURAL_STREET_ART: '壁畫街藝',
  RELIGIOUS_SITE: '宗教場所',
  HISTORIC_BUILDING: '歷史建築',
  PARK_GARDEN: '公園花園',
  CAFE_RESTAURANT: '咖啡餐廳',
  BRIDGE: '橋梁',
  PIER_WHARF: '碼頭港口',
  MEMORIAL_MONUMENT: '紀念碑',
  TRAIL_ROUTE: '步道路線',
  PAVILION_GAZEBO: '亭台樓閣',
  FOUNTAIN_WATER_FEATURE: '噴泉水景',
  RUINS_HERITAGE: '遺跡遺產',
  PLAZA_SQUARE: '廣場',
  MUSEUM_GALLERY: '博物館',
  RAILWAY_STATION: '鐵路站',
  CLOCK_TOWER: '鐘樓',
  SPORTS_EXERCISE: '運動設施',
  TRAIL_MARKER: '步道標記',
  MARKET_BAZAAR: '市場集市',
  PLAYGROUND: '遊樂場',
  CIVIC_BUILDING: '市政建築',
  SWIMMING_POOL: '游泳池',
  PERFORMANCE_VENUE: '表演場地',
  COMMUNITY_CENTER: '社區中心',
  LIBRARY_BOOK_EXCHANGE: '圖書館',
  SURVEY_MARKER: '測量標記',
};

// ===== INIT =====
document.addEventListener('DOMContentLoaded', async () => {
  await loadData();
  setupSearch();
  setupFilters();
  setupSort();
  setupBackToTop();
  render();
});

async function loadData() {
  try {
    const res = await fetch('merged_data.json');
    const json = await res.json();
    allItems = json.items || [];
    filteredItems = [...allItems];
  } catch (e) {
    console.error('Failed to load data:', e);
  }
}

// ===== SEARCH =====
function setupSearch() {
  const input = document.getElementById('search-input');
  const clear = document.getElementById('search-clear');
  let debounceTimer;

  input.addEventListener('input', () => {
    searchQuery = input.value.trim().toLowerCase();
    clear.classList.toggle('hidden', searchQuery === '');
    clearTimeout(debounceTimer);
    debounceTimer = setTimeout(() => applyFilters(), 200);
  });
}

function clearSearch() {
  document.getElementById('search-input').value = '';
  document.getElementById('search-clear').classList.add('hidden');
  searchQuery = '';
  applyFilters();
}

// ===== FILTER CHIPS =====
function setupFilters() {
  const tabs = document.querySelectorAll('.filter-tab');
  tabs.forEach(tab => {
    tab.addEventListener('click', () => {
      tabs.forEach(t => t.classList.remove('active'));
      tab.classList.add('active');
      renderChips(tab.dataset.filter);
    });
  });
  renderChips('all');
}

function renderChips(filterType) {
  const container = document.getElementById('filter-chips-container');
  container.innerHTML = '';

  if (filterType === 'all') return;

  let entries = [];

  if (filterType === 'type') {
    const counter = countBy(allItems, i => i.postcardType);
    entries = Object.entries(counter).sort((a, b) => b[1] - a[1]);
    entries = entries.map(([k, v]) => ({
      key: k,
      label: `${TYPE_LABELS[k] || k} (${v})`,
      dim: 'type',
    }));
  } else if (filterType === 'country') {
    const counter = countBy(allItems, i => i.country || 'Unknown');
    entries = Object.entries(counter).sort((a, b) => b[1] - a[1]);
    entries = entries.map(([k, v]) => ({
      key: k,
      label: `${k} (${v})`,
      dim: 'country',
    }));
  } else if (filterType === 'category') {
    const counter = {};
    allItems.forEach(i => (i.categories || []).forEach(c => { counter[c] = (counter[c] || 0) + 1; }));
    entries = Object.entries(counter).sort((a, b) => b[1] - a[1]);
    entries = entries.map(([k, v]) => ({
      key: k,
      label: `${CATEGORY_LABELS[k] || k} (${v})`,
      dim: 'category',
    }));
  } else if (filterType === 'tag') {
    const counter = {};
    allItems.forEach(i => (i.tags || []).forEach(t => { counter[t] = (counter[t] || 0) + 1; }));
    entries = Object.entries(counter).sort((a, b) => b[1] - a[1]);
    entries = entries.map(([k, v]) => ({
      key: k,
      label: `${k} (${v})`,
      dim: 'tag',
    }));
  }

  entries.forEach(({ key, label, dim }) => {
    const chip = document.createElement('button');
    chip.className = 'chip' + (activeFilters[dim] === key ? ' active' : '');
    chip.textContent = label;
    chip.addEventListener('click', () => toggleFilter(dim, key, chip));
    container.appendChild(chip);
  });
}

function toggleFilter(dim, key, chipEl) {
  if (activeFilters[dim] === key) {
    activeFilters[dim] = null;
    chipEl.classList.remove('active');
  } else {
    // Deactivate other chips of same dim
    document.querySelectorAll('.chip.active').forEach(c => c.classList.remove('active'));
    activeFilters[dim] = key;
    chipEl.classList.add('active');
  }
  updateActiveFiltersBar();
  applyFilters();
}

function updateActiveFiltersBar() {
  // no dedicated bar in simplified version - handled by chip state
}

// ===== SORT =====
function setupSort() {
  document.getElementById('sort-select').addEventListener('change', e => {
    sortMode = e.target.value;
    applyFilters();
  });
}

// ===== APPLY FILTERS =====
function applyFilters() {
  let result = allItems.filter(item => {
    // type
    if (activeFilters.type && item.postcardType !== activeFilters.type) return false;
    // country
    if (activeFilters.country && (item.country || 'Unknown') !== activeFilters.country) return false;
    // category
    if (activeFilters.category && !(item.categories || []).includes(activeFilters.category)) return false;
    // tag
    if (activeFilters.tag && !(item.tags || []).includes(activeFilters.tag)) return false;
    // search
    if (searchQuery) {
      const hay = [
        item.title, item.city, item.country, item.state,
        item.placeName, ...(item.tags || []),
      ].join(' ').toLowerCase();
      if (!hay.includes(searchQuery)) return false;
    }
    return true;
  });

  // Sort
  if (sortMode === 'title-asc') result.sort((a, b) => (a.title || '').localeCompare(b.title || ''));
  else if (sortMode === 'title-desc') result.sort((a, b) => (b.title || '').localeCompare(a.title || ''));
  else if (sortMode === 'country-asc') result.sort((a, b) => (a.country || '').localeCompare(b.country || ''));

  filteredItems = result;
  displayedCount = 0;
  document.getElementById('gallery-grid').innerHTML = '';
  render();
}

// ===== RENDER =====
function render() {
  const grid = document.getElementById('gallery-grid');
  const noResults = document.getElementById('no-results');
  const loadMoreWrapper = document.getElementById('load-more-wrapper');

  if (filteredItems.length === 0) {
    noResults.classList.remove('hidden');
    loadMoreWrapper.classList.add('hidden');
    return;
  }

  noResults.classList.add('hidden');

  const slice = filteredItems.slice(displayedCount, displayedCount + PAGE_SIZE);
  slice.forEach((item, idx) => {
    const card = createCard(item, (displayedCount + idx));
    grid.appendChild(card);
  });
  displayedCount += slice.length;

  // Update count
  document.getElementById('results-count').textContent =
    `顯示 ${displayedCount} / ${filteredItems.length} 張明信片`;

  // Toggle load more
  if (displayedCount >= filteredItems.length) {
    loadMoreWrapper.classList.add('hidden');
  } else {
    loadMoreWrapper.classList.remove('hidden');
  }
}

function loadMore() {
  render();
}

// ===== CARD =====
function createCard(item, idx) {
  const card = document.createElement('div');
  card.className = 'card';
  card.style.animationDelay = `${(idx % PAGE_SIZE) * 0.03}s`;

  const typeColor = TYPE_COLORS[item.postcardType] || '#94a3b8';
  const typeLabel = TYPE_LABELS[item.postcardType] || item.postcardType;

  const locationParts = [item.city, item.country].filter(Boolean);
  const locationStr = item.placeName
    ? item.placeName
    : locationParts.join(', ');

  card.innerHTML = `
    <div class="card-image-wrapper">
      <img
        class="card-image"
        src="${item.displayImageUrl || item.imageUrl || ''}"
        alt="${escapeHtml(item.title || '')}"
        loading="lazy"
        onerror="this.src=''; this.parentElement.style.background='#1e293b';"
      >
      <span class="card-type-badge" style="border:1px solid ${typeColor}; color:${typeColor};">${typeLabel}</span>
    </div>
    <div class="card-body">
      <h3 class="card-title" title="${escapeHtml(item.title || '')}">
        ${escapeHtml(item.title || '（無標題）')}
      </h3>
      <p class="card-location">
        <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"/><circle cx="12" cy="10" r="3"/></svg>
        ${escapeHtml(locationStr || '未知地點')}
      </p>
    </div>
  `;

  card.addEventListener('click', () => openModal(item));
  return card;
}

// ===== MODAL =====
function openModal(item) {
  document.getElementById('modal-image').src = item.displayImageUrl || item.imageUrl || '';
  document.getElementById('modal-image').alt = item.title || '';
  document.getElementById('modal-title').textContent = item.title || '（無標題）';

  // Type badge
  const typeEl = document.getElementById('modal-type');
  const typeColor = TYPE_COLORS[item.postcardType] || '#94a3b8';
  typeEl.textContent = TYPE_LABELS[item.postcardType] || item.postcardType;
  typeEl.style.background = hexAlpha(typeColor, 0.2);
  typeEl.style.color = typeColor;
  typeEl.style.backdropFilter = 'blur(8px)';

  // Location
  const locParts = [item.placeName, item.city, item.state, item.country].filter(Boolean);
  document.getElementById('modal-location').textContent = '📍 ' + (locParts.join('、') || '未知地點');

  // Categories
  const catEl = document.getElementById('modal-categories');
  catEl.innerHTML = (item.categories || [])
    .map(c => `<span>${CATEGORY_LABELS[c] || c}</span>`).join('');

  // Tags
  const tagEl = document.getElementById('modal-tags');
  tagEl.innerHTML = (item.tags || [])
    .map(t => `<span>#${t}</span>`).join('');

  // Coords
  const coordEl = document.getElementById('modal-coords');
  if (item.latitude != null && item.longitude != null) {
    const lat = item.latitude.toFixed(6);
    const lng = item.longitude.toFixed(6);
    const coordStr = `${lat}, ${lng}`;
    coordEl.innerHTML = `
      <div class="coords-box">
        <div class="coords-label">🌐 GPS 座標</div>
        <div class="coords-row">
          <div class="coords-values">
            <span class="coord-item"><span class="coord-key">緯度</span><span class="coord-val">${lat}</span></span>
            <span class="coord-item"><span class="coord-key">經度</span><span class="coord-val">${lng}</span></span>
          </div>
          <button class="copy-coords-btn" id="copy-coords-btn" onclick="copyGPS('${coordStr}')" title="複製座標">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2"><rect x="9" y="9" width="13" height="13" rx="2"/><path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"/></svg>
            複製
          </button>
        </div>
      </div>
    `;
  } else {
    coordEl.innerHTML = '';
  }

  document.getElementById('modal-overlay').classList.add('active');
  document.body.style.overflow = 'hidden';
}

function closeModal(event) {
  if (event.target === document.getElementById('modal-overlay')) {
    closeModalDirect();
  }
}

function closeModalDirect() {
  document.getElementById('modal-overlay').classList.remove('active');
  document.body.style.overflow = '';
  document.getElementById('modal-image').src = '';
}

// Close on Escape
document.addEventListener('keydown', e => {
  if (e.key === 'Escape') closeModalDirect();
});

// ===== COPY GPS =====
function copyGPS(coordStr) {
  navigator.clipboard.writeText(coordStr).then(() => {
    const btn = document.getElementById('copy-coords-btn');
    if (!btn) return;
    btn.classList.add('copied');
    btn.innerHTML = `
      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><polyline points="20 6 9 17 4 12"/></svg>
      已複製！
    `;
    setTimeout(() => {
      btn.classList.remove('copied');
      btn.innerHTML = `
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2"><rect x="9" y="9" width="13" height="13" rx="2"/><path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"/></svg>
        複製
      `;
    }, 2000);
  }).catch(() => {
    // Fallback for older browsers
    const ta = document.createElement('textarea');
    ta.value = coordStr;
    document.body.appendChild(ta);
    ta.select();
    document.execCommand('copy');
    document.body.removeChild(ta);
  });
}

// ===== BACK TO TOP =====
function setupBackToTop() {
  const btn = document.getElementById('back-to-top');
  window.addEventListener('scroll', () => {
    btn.classList.toggle('visible', window.scrollY > 500);
  });
}

// ===== UTILS =====
function countBy(arr, keyFn) {
  const counter = {};
  arr.forEach(item => {
    const k = keyFn(item) || 'Unknown';
    counter[k] = (counter[k] || 0) + 1;
  });
  return counter;
}

function escapeHtml(str) {
  return String(str)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

function hexAlpha(hex, alpha) {
  const r = parseInt(hex.slice(1, 3), 16);
  const g = parseInt(hex.slice(3, 5), 16);
  const b = parseInt(hex.slice(5, 7), 16);
  return `rgba(${r},${g},${b},${alpha})`;
}
