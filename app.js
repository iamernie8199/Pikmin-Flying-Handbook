// ===== CONFIG =====
const PAGE_SIZE = 48;
const SPOT_PAGE_SIZE = 40;

// Postcard State
let allItems = [];
let filteredItems = [];
let displayedCount = 0;
let activeFilters = { type: null, country: null, category: null, tag: null };
let searchQuery = '';

// Pure Spot State
let allSpots = [];
let filteredSpots = [];
let displayedSpotCount = 0;
let activeSpotCategory = null;
let spotSearchQuery = '';
let spotSortMode = 'default';

// App State
let currentView = 'postcard';

// ===== TYPE CONFIG (Postcards) =====
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

// ===== SPOT CONFIG (Pure Spots) =====
const SPOT_CATEGORY_LABELS = { movie: '🎬 電影院', laundry: '🧺 洗衣店', park: '🌳 公園', restaurant: '🍴 餐廳', minimart: '🏪 便利商店', station: '🚉 車站', bus: '🚌 公車站', ramen: '🍜 拉麵店', sweetshop: '🍰 甜點店', bridge: '🌉 橋樑', hotel: '🏨 飯店', forest: '🌲 森林', curry: '🍛 咖哩店', waterside: '💧 水邊', electronics: '🔌 電器行', hairsalon: '✂️ 理髮廳', sushi: '🍣 壽司店', italian: '🍝 義大利餐廳', cafe: '☕ 咖啡廳', roadside: '🚦 路邊', university: '🎓 大學', library: '📖 圖書館', pharmacy: '💊 藥局', postoffice: '📮 郵局', supermarket: '🛒 超市', clothesstore: '👕 服飾店', airport: '✈️ 機場', zoo: '🦁 動物園', museum: '🏛️ 博物館', bakery: '🥖 麵包店', artgallery: '🎨 美術館', cinema: '📽️ 電影院', burger: '🍔 漢堡店', bookstore: '📚 書店', mountain: '⛰️ 山頂', beach: '🏖️ 海灘' };

// ===== INIT =====
document.addEventListener('DOMContentLoaded', async () => {
  await loadData();
  setupPostcardSearch();
  setupPostcardFilters();
  setupSpotSearch();
  setupSpotSort();
  setupBackToTop();
  applyFilters();
  applySpotFilters();
});

async function loadData() {
  try {
    const [postcardRes, spotRes] = await Promise.all([fetch('merged_data.json'), fetch('pure.json')]);
    const postcardJson = await postcardRes.json();
    allItems = postcardJson.items || [];
    filteredItems = [...allItems];
    const spotJson = await spotRes.json();
    allSpots = spotJson.spots || [];
    filteredSpots = [...allSpots];
    renderSpotCategoryChips();
  } catch (e) {
    console.error('Failed to load data:', e);
  }
}

// ===== VIEW SWITCHING =====
function switchView(viewName) {
  currentView = viewName;
  document.querySelectorAll('.nav-link').forEach(btn => btn.classList.toggle('active', btn.dataset.view === viewName));
  document.querySelectorAll('.view-section').forEach(view => view.classList.toggle('active-view', view.id === `${viewName}-view`));
  window.scrollTo({ top: 0, behavior: 'smooth' });
}

// ===== POSTCARD LOGIC =====
function setupPostcardSearch() {
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

function setupPostcardFilters() {
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
    entries = Object.entries(counter).sort((a, b) => b[1] - a[1]).map(([k, v]) => ({ key: k, label: `${TYPE_LABELS[k] || k} (${v})`, dim: 'type' }));
  } else if (filterType === 'country') {
    const counter = countBy(allItems, i => i.country || 'Unknown');
    entries = Object.entries(counter).sort((a, b) => b[1] - a[1]).map(([k, v]) => ({ key: k, label: `${k} (${v})`, dim: 'country' }));
  } else if (filterType === 'category') {
    const counter = {};
    allItems.forEach(i => (i.categories || []).forEach(c => { counter[c] = (counter[c] || 0) + 1; }));
    entries = Object.entries(counter).sort((a, b) => b[1] - a[1]).map(([k, v]) => ({ key: k, label: `${CATEGORY_LABELS[k] || k} (${v})`, dim: 'category' }));
  } else if (filterType === 'tag') {
    const counter = {};
    allItems.forEach(i => (i.tags || []).forEach(t => { counter[t] = (counter[t] || 0) + 1; }));
    entries = Object.entries(counter).sort((a, b) => b[1] - a[1]).map(([k, v]) => ({ key: k, label: `${k} (${v})`, dim: 'tag' }));
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
    activeFilters[dim] = key;
    chipEl.parentElement.querySelectorAll('.chip').forEach(c => c.classList.remove('active'));
    chipEl.classList.add('active');
  }
  applyFilters();
}

function applyFilters() {
  filteredItems = allItems.filter(item => {
    if (activeFilters.type && item.postcardType !== activeFilters.type) return false;
    if (activeFilters.country && (item.country || 'Unknown') !== activeFilters.country) return false;
    if (activeFilters.category && !(item.categories || []).includes(activeFilters.category)) return false;
    if (activeFilters.tag && !(item.tags || []).includes(activeFilters.tag)) return false;
    if (searchQuery) {
      const hay = [item.title, item.city, item.country, item.placeName, ...(item.tags || [])].join(' ').toLowerCase();
      if (!hay.includes(searchQuery)) return false;
    }
    return true;
  });
  displayedCount = 0;
  document.getElementById('gallery-grid').innerHTML = '';
  render();
}

function render() {
  const grid = document.getElementById('gallery-grid');
  const loadMoreWrapper = document.getElementById('load-more-wrapper');
  if (filteredItems.length === 0) {
    document.getElementById('no-results').classList.remove('hidden');
    loadMoreWrapper.classList.add('hidden');
    document.getElementById('results-count').textContent = '顯示 0 張明信片';
    return;
  }
  document.getElementById('no-results').classList.add('hidden');
  const slice = filteredItems.slice(displayedCount, displayedCount + PAGE_SIZE);
  slice.forEach((item, idx) => grid.appendChild(createCard(item, (displayedCount + idx))));
  displayedCount += slice.length;
  document.getElementById('results-count').textContent = `顯示 ${displayedCount} / ${filteredItems.length} 張明信片`;
  loadMoreWrapper.classList.toggle('hidden', displayedCount >= filteredItems.length);
}

function createCard(item, idx) {
  const card = document.createElement('div');
  card.className = 'card';
  card.style.animationDelay = `${(idx % PAGE_SIZE) * 0.03}s`;
  
  const typeColor = TYPE_COLORS[item.postcardType] || '#94a3b8';
  const typeLabel = TYPE_LABELS[item.postcardType] || item.postcardType;
  const locationStr = item.placeName || [item.city, item.country].filter(Boolean).join(', ') || '未知地點';
  const coordStr = (item.latitude != null && item.longitude != null) 
    ? `${Number(item.latitude).toFixed(6)}, ${Number(item.longitude).toFixed(6)}` 
    : '';

  card.innerHTML = `
    <div class="card-image-wrapper">
      <img class="card-image" src="${item.displayImageUrl || item.imageUrl || ''}" alt="${escapeHtml(item.title || '')}" loading="lazy">
      <span class="card-type-badge" style="border:1px solid ${typeColor}; color:${typeColor}; font-weight:700;">${typeLabel}</span>
    </div>
    <div class="card-body">
      <h3 class="card-title">${escapeHtml(item.title || '（無標題）')}</h3>
      <p class="card-location">📍 ${escapeHtml(locationStr)}</p>
      <div class="card-footer" style="margin-top: 1rem; display: flex; justify-content: flex-end;">
        ${coordStr ? `
          <button class="copy-spot-btn" onclick="copyGPS('${coordStr}', this)" style="width: 100%;">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><rect x="9" y="9" width="13" height="13" rx="2"/><path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"/></svg>
            複製座標
          </button>
        ` : `<span style="font-size: 0.8rem; color: var(--text-muted);">無座標資料</span>`}
      </div>
    </div>
  `;
  return card;
}

// ===== SPOT LOGIC (Pure Spots) =====
function setupSpotSearch() {
  const input = document.getElementById('spot-search-input');
  const clear = document.getElementById('spot-search-clear');
  let debounceTimer;
  input.addEventListener('input', () => {
    spotSearchQuery = input.value.trim().toLowerCase();
    clear.classList.toggle('hidden', spotSearchQuery === '');
    clearTimeout(debounceTimer);
    debounceTimer = setTimeout(() => applySpotFilters(), 200);
  });
}

function setupSpotSort() {
  const select = document.getElementById('spot-sort-select');
  if (!select) return;
  select.addEventListener('change', e => { spotSortMode = e.target.value; applySpotFilters(); });
}

function renderSpotCategoryChips() {
  const container = document.getElementById('spot-category-chips');
  container.innerHTML = '';
  const counter = countBy(allSpots, s => s.category);
  const sortedCats = Object.entries(counter).sort((a, b) => b[1] - a[1]);
  const allChip = document.createElement('button');
  allChip.className = 'chip' + (activeSpotCategory === null ? ' active' : '');
  allChip.textContent = `全部 (${allSpots.length})`;
  allChip.onclick = () => { activeSpotCategory = null; document.querySelectorAll('#spot-category-chips .chip').forEach(c => c.classList.remove('active')); allChip.classList.add('active'); applySpotFilters(); };
  container.appendChild(allChip);
  sortedCats.forEach(([cat, count]) => {
    const chip = document.createElement('button');
    chip.className = 'chip' + (activeSpotCategory === cat ? ' active' : '');
    chip.textContent = `${SPOT_CATEGORY_LABELS[cat] || cat} (${count})`;
    chip.onclick = () => {
      if (activeSpotCategory === cat) { activeSpotCategory = null; chip.classList.remove('active'); allChip.classList.add('active'); }
      else { activeSpotCategory = cat; document.querySelectorAll('#spot-category-chips .chip').forEach(c => c.classList.remove('active')); chip.classList.add('active'); }
      applySpotFilters();
    };
    container.appendChild(chip);
  });
}

function applySpotFilters() {
  let result = allSpots.filter(spot => {
    if (activeSpotCategory && spot.category !== activeSpotCategory) return false;
    if (spotSearchQuery) {
      const s = spotSearchQuery;
      return [spot.name, spot.address, spot.region, spot.category].some(v => (v || '').toLowerCase().includes(s));
    }
    return true;
  });
  if (spotSortMode === 'north-to-south') result.sort((a, b) => (Number(b.lat) || 0) - (Number(a.lat) || 0));
  else if (spotSortMode === 'south-to-north') result.sort((a, b) => (Number(a.lat) || 0) - (Number(b.lat) || 0));
  filteredSpots = result;
  displayedSpotCount = 0;
  const grid = document.getElementById('spot-grid');
  if (grid) grid.innerHTML = '';
  renderSpots();
}

function renderSpots() {
  const grid = document.getElementById('spot-grid');
  const loadMoreWrapper = document.getElementById('spot-load-more-wrapper');
  if (!grid) return;
  if (filteredSpots.length === 0) {
    document.getElementById('spot-no-results').classList.remove('hidden');
    if (loadMoreWrapper) loadMoreWrapper.classList.add('hidden');
    document.getElementById('spot-results-count').textContent = '顯示 0 個純點';
    return;
  }
  document.getElementById('spot-no-results').classList.add('hidden');
  const slice = filteredSpots.slice(displayedSpotCount, displayedSpotCount + SPOT_PAGE_SIZE);
  slice.forEach((spot, idx) => grid.appendChild(createSpotCard(spot, (displayedSpotCount + idx))));
  displayedSpotCount += slice.length;
  document.getElementById('spot-results-count').textContent = `顯示 ${displayedSpotCount} / ${filteredSpots.length} 個純點`;
  if (loadMoreWrapper) loadMoreWrapper.classList.toggle('hidden', displayedSpotCount >= filteredSpots.length);
}

function createSpotCard(spot, idx) {
  const card = document.createElement('div');
  card.className = 'spot-card';
  card.style.animation = `fadeInUp 0.5s ease forwards ${ (idx % SPOT_PAGE_SIZE) * 0.05 }s`;
  const categoryLabel = SPOT_CATEGORY_LABELS[spot.category] || spot.category;
  const coordStr = `${Number(spot.lat).toFixed(6)}, ${Number(spot.lng).toFixed(6)}`;
  card.innerHTML = `
    <div class="spot-card-header"><span class="spot-category-badge">${categoryLabel}</span><span class="spot-status"><svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3"><polyline points="20 6 9 17 4 12"/></svg> ${spot.status === 'verified' ? '已驗證' : spot.status}</span></div>
    <div class="spot-name">${escapeHtml(spot.name || '未命名純點')}</div>
    <div class="spot-address"><svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"/><circle cx="12" cy="10" r="3"/></svg><span>${escapeHtml(spot.address || '無詳細地址')}</span></div>
    <div class="spot-region">${escapeHtml(spot.region || '')}</div>
    <div class="spot-footer"><div class="spot-stats"><span class="stat" title="確認次數">👍 ${spot.confirms || 0}</span><span class="stat" title="回報問題">⚠️ ${spot.issues || 0}</span></div><button class="copy-spot-btn" onclick="copyGPS('${coordStr}', this)"><svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><rect x="9" y="9" width="13" height="13" rx="2"/><path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"/></svg>複製座標</button></div>
  `;
  return card;
}

// ===== UI HELPERS =====
function copyGPS(coordStr, btn) {
  navigator.clipboard.writeText(coordStr).then(() => {
    const originalContent = btn.innerHTML;
    btn.classList.add('copied');
    btn.innerHTML = `<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3"><polyline points="20 6 9 17 4 12"/></svg> 已複製`;
    setTimeout(() => { btn.classList.remove('copied'); btn.innerHTML = originalContent; }, 2000);
  });
}

function closeModalDirect() { document.getElementById('modal-overlay').classList.remove('active'); document.body.style.overflow = ''; }
document.addEventListener('keydown', e => { if (e.key === 'Escape') closeModalDirect(); });

function setupBackToTop() { const btn = document.getElementById('back-to-top'); window.addEventListener('scroll', () => btn.classList.toggle('visible', window.scrollY > 500)); }
function countBy(arr, keyFn) { const counter = {}; arr.forEach(item => { const k = keyFn(item) || 'Unknown'; counter[k] = (counter[k] || 0) + 1; }); return counter; }
function escapeHtml(str) { return String(str || '').replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;').replace(/'/g, '&#39;'); }
function hexAlpha(hex, alpha) { const r = parseInt(hex.slice(1, 3), 16), g = parseInt(hex.slice(3, 5), 16), b = parseInt(hex.slice(5, 7), 16); return `rgba(${r},${g},${b},${alpha})`; }
function clearSpotSearch() { document.getElementById('spot-search-input').value = ''; document.getElementById('spot-search-clear').classList.add('hidden'); spotSearchQuery = ''; applySpotFilters(); }
function loadMoreSpots() { renderSpots(); }
function loadMore() { render(); }
