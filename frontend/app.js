const app = document.getElementById('app');
const API_BASE = 'https://kfarmora.onrender.com/api/v1';

let authToken = localStorage.getItem('farmora_token');
let authUser = JSON.parse(localStorage.getItem('farmora_user') || 'null');

const state = {
  view: authUser ? authUser.role.toLowerCase() : 'home',
  role: authUser ? authUser.role.toLowerCase() : null,
  farmerTab: 'dashboard',
  buyerTab: 'dashboard',
  adminTab: 'dashboard',
  avatarStyle: localStorage.getItem('farmora_avatar_style') || 'initials', // 'initials' | 'silhouette'
  profileDropdownOpen: false,
  notifDropdownOpen: false,
  readNotifs: JSON.parse(localStorage.getItem('farmora_read_notifs') || '{}'),
  // Profile module state
  profileData: null,
  profileMode: 'view', // 'view' | 'edit'
  profileLoading: false,
  profileError: null,
  profilePhotoPreview: null,
  // Transport module state
  transportData: null,
  transportLoading: false,
  // AI grade verification state
  aiVerifyResult: null,
  aiVerifyLoading: false,
  aiVerifyImages: [], // array of {dataUrl, name} objects
  aiLotGradeOverride: null, // 'ai' | 'farmer' | null
  lots: [
    { id: 'LOT-KL-1024', crop: 'Tomato', qty: 1000, grade: 'A', price: 32, location: 'Hyderabad', status: 'Available', harvest: '02 Sep 2026' },
    { id: 'LOT-KL-1021', crop: 'Chilli', qty: 700, grade: 'A', price: 118, location: 'Warangal', status: 'Offer received', harvest: '31 Aug 2026' }
  ],
  offers: [
    { id: 'OF-3041', buyer: 'ABC Foods Pvt Ltd', crop: 'Tomato', qty: 500, price: 34, match: 94, status: 'Pending', payment: '3 days', verified: true },
    { id: 'OF-3019', buyer: 'FreshMart Retail', crop: 'Tomato', qty: 700, price: 33, match: 87, status: 'Pending', payment: '2 days', verified: true }
  ],
  transactions: [
    { id: 'TX-2018', crop: 'Chilli', buyer: 'Green Basket Foods', qty: 300, total: 35400, status: 'Delivered', payment: 'Payment received', step: 4 },
    { id: 'TX-2014', crop: 'Tomato', buyer: 'ABC Foods Pvt Ltd', qty: 500, total: 17000, status: 'Confirmed', payment: 'Pending', step: 1 }
  ],
  requirements: [
    { id: 'REQ-80', buyer: 'ABC Foods Pvt Ltd', crop: 'Tomato', qty: 5000, grade: 'A', max: 35, location: 'Hyderabad', terms: '3 days', verified: true },
    { id: 'REQ-77', buyer: 'FreshMart Retail', crop: 'Tomato', qty: 2000, grade: 'A/B', max: 34, location: 'Secunderabad', terms: '2 days', verified: true },
    { id: 'REQ-72', buyer: 'Deccan Processors', crop: 'Chilli', qty: 3000, grade: 'A', max: 126, location: 'Warangal', terms: '5 days', verified: true },
    { id: 'REQ-69', buyer: 'CottonTex Ltd', crop: 'Cotton', qty: 8000, grade: 'A', max: 76, location: 'Adilabad', terms: '5 days', verified: true },
    { id: 'REQ-65', buyer: 'JutePack Industries', crop: 'Jute', qty: 6000, grade: 'A', max: 59, location: 'Kolkata', terms: '4 days', verified: true }
  ],
  toast: null,
  marketCrop: 'Tomato',
  marketLocation: 'Hyderabad',
  counterOfferId: null,
  marketChannel: 'All'
};

const CROP_OPTIONS = ['Tomato', 'Chilli', 'Onion', 'Potato', 'Cotton', 'Jute', 'Wheat', 'Rice', 'Maize', 'Groundnut', 'Soybean', 'Sugarcane'];
const LOCATION_OPTIONS = ['Hyderabad', 'Warangal', 'Nalgonda', 'Adilabad', 'Nizamabad', 'Kolkata', 'Karimnagar', 'Mahbubnagar', 'Sangareddy'];

// Demo-only market intelligence. Values are illustrative prototype data, not live market quotes.
const marketData = {
  Tomato: { unit: 'kg', baseLabel: '₹/kg', prices: [28, 31, 29, 34, 33], arrivals: [620, 420, 310, 5000, 2000], locations: ['Hyderabad Mandi', 'Warangal Mandi', 'Nalgonda Mandi', 'ABC Foods', 'FreshMart'], distances: ['22 km', '145 km', '95 km', '38 km', '22 km'], types: ['Mandi', 'Mandi', 'Mandi', 'Buyer', 'Buyer'], trend: [27, 28, 29, 30, 32, 34], avg: 31, highest: 34, best: 'ABC Foods Pvt Ltd', net: 32.4, demand: 84, arrivalsScore: 58, storage: 42, saleWindow: 'Next 2–3 days', expected: '₹32–₹35/kg', recommendation: 'Buyer demand is stronger than nearby mandi arrivals. Selling in the next 2–3 days can capture the current demand spike.', factor: 'Demand ↑ while arrivals are easing.' },
  Chilli: { unit: 'kg', baseLabel: '₹/kg', prices: [118, 121, 116, 126, 123], arrivals: [410, 380, 520, 3000, 1800], locations: ['Warangal Mandi', 'Guntur Mandi', 'Khammam Mandi', 'Deccan Processors', 'SpiceTrade'], distances: ['145 km', '275 km', '160 km', '148 km', '150 km'], types: ['Mandi', 'Mandi', 'Mandi', 'Buyer', 'Buyer'], trend: [112, 115, 117, 116, 121, 124], avg: 120.8, highest: 126, best: 'Deccan Processors', net: 121.5, demand: 88, arrivalsScore: 51, storage: 55, saleWindow: 'Next 1–2 days', expected: '₹122–₹128/kg', recommendation: 'Processor demand is strong. Grade-A lots with consistent quality have the best chance of receiving the upper end of the current range.', factor: 'Processor demand ↑ with moderate arrivals.' },
  Onion: { unit: 'kg', baseLabel: '₹/kg', prices: [27, 30, 29, 32, 31], arrivals: [850, 740, 690, 4000, 2500], locations: ['Nizamabad Mandi', 'Hyderabad Mandi', 'Mahbubnagar Mandi', 'FreshMart', 'VegSource Foods'], distances: ['170 km', '22 km', '120 km', '22 km', '28 km'], types: ['Mandi', 'Mandi', 'Mandi', 'Buyer', 'Buyer'], trend: [25, 27, 28, 29, 31, 32], avg: 29.8, highest: 32, best: 'FreshMart', net: 30.1, demand: 76, arrivalsScore: 62, storage: 68, saleWindow: 'Next 3–5 days', expected: '₹30–₹33/kg', recommendation: 'Storage availability gives farmers more flexibility. Holding briefly can reduce distress selling when the lot is safely stored.', factor: 'Storage ↑; demand is steady.' },
  Potato: { unit: 'kg', baseLabel: '₹/kg', prices: [24, 26, 25, 28, 27], arrivals: [720, 680, 610, 4200, 1900], locations: ['Hyderabad Mandi', 'Medak Mandi', 'Sangareddy Mandi', 'ABC Foods', 'FreshKart'], distances: ['22 km', '70 km', '65 km', '38 km', '26 km'], types: ['Mandi', 'Mandi', 'Mandi', 'Buyer', 'Buyer'], trend: [22, 23, 24, 25, 26, 28], avg: 26, highest: 28, best: 'ABC Foods', net: 26.4, demand: 72, arrivalsScore: 60, storage: 79, saleWindow: 'Next 4–6 days', expected: '₹27–₹29/kg', recommendation: 'Cold storage is relatively strong, so short-term holding may improve net realisation if storage cost stays below the expected price gain.', factor: 'Storage ↑; gradual price rise.' },
  Cotton: { unit: 'kg', baseLabel: '₹/kg', prices: [68, 71, 69, 75, 73], arrivals: [1200, 980, 1100, 6500, 4200], locations: ['Adilabad Mandi', 'Warangal Mandi', 'Nizamabad Mandi', 'CottonTex Ltd', 'Deccan Textiles'], distances: ['300 km', '145 km', '170 km', '310 km', '280 km'], types: ['Mandi', 'Mandi', 'Mandi', 'Buyer', 'Buyer'], trend: [65, 67, 68, 70, 72, 75], avg: 71.2, highest: 75, best: 'CottonTex Ltd', net: 72.1, demand: 91, arrivalsScore: 47, storage: 61, saleWindow: 'Next 2–4 days', expected: '₹73–₹77/kg', recommendation: 'Textile-buyer demand is strong. Moisture control and uniform quality can move the lot toward the top of the current buyer range.', factor: 'Industrial demand ↑; arrivals are tightening.' },
  Jute: { unit: 'kg', baseLabel: '₹/kg', prices: [52, 55, 54, 58, 57], arrivals: [560, 490, 530, 2400, 1600], locations: ['Kolkata Jute Market', 'Burdwan Market', 'Hooghly Market', 'JutePack Industries', 'EcoFiber Buyers'], distances: ['1500 km', '1450 km', '1520 km', '1490 km', '1510 km'], types: ['Mandi', 'Mandi', 'Mandi', 'Buyer', 'Buyer'], trend: [49, 51, 52, 54, 56, 58], avg: 55.2, highest: 58, best: 'JutePack Industries', net: 55.6, demand: 82, arrivalsScore: 53, storage: 64, saleWindow: 'Next 3–4 days', expected: '₹56–₹59/kg', recommendation: 'Industrial buyer demand is healthy. FPO aggregation can improve bargaining power and reduce per-unit logistics cost.', factor: 'Industrial demand ↑ with lower arrivals.' },
  Wheat: { unit: 'kg', baseLabel: '₹/kg', prices: [26, 27, 27, 29, 28], arrivals: [1400, 1260, 1320, 5200, 3000], locations: ['Karimnagar Mandi', 'Nizamabad Mandi', 'Sangareddy Mandi', 'GrainMill Foods', 'FlourCo'], distances: ['180 km', '170 km', '65 km', '210 km', '190 km'], types: ['Mandi', 'Mandi', 'Mandi', 'Buyer', 'Buyer'], trend: [24, 25, 26, 27, 28, 29], avg: 27.4, highest: 29, best: 'GrainMill Foods', net: 27.1, demand: 79, arrivalsScore: 66, storage: 74, saleWindow: 'Next 4–7 days', expected: '₹28–₹30/kg', recommendation: 'Stable demand and good storage make planned sales practical instead of immediate selling.', factor: 'Stable demand; storage gives flexibility.' },
  Rice: { unit: 'kg', baseLabel: '₹/kg', prices: [34, 35, 33, 38, 37], arrivals: [920, 880, 1010, 6000, 4100], locations: ['Karimnagar Rice Market', 'Nalgonda Mandi', 'Suryapet Mandi', 'RiceMill Group', 'Institutional Foods'], distances: ['200 km', '95 km', '135 km', '220 km', '210 km'], types: ['Mandi', 'Mandi', 'Mandi', 'Buyer', 'Buyer'], trend: [32, 33, 34, 35, 36, 38], avg: 35.4, highest: 38, best: 'RiceMill Group', net: 36.2, demand: 86, arrivalsScore: 57, storage: 72, saleWindow: 'Next 2–3 days', expected: '₹36–₹39/kg', recommendation: 'Miller demand is high in this demo. Larger aggregated lots receive stronger quotes.', factor: 'Miller demand ↑; arrivals easing.' },
  Maize: { unit: 'kg', baseLabel: '₹/kg', prices: [21, 23, 22, 25, 24], arrivals: [1100, 970, 1030, 4700, 2800], locations: ['Warangal Mandi', 'Karimnagar Mandi', 'Jangaon Mandi', 'FeedPlus', 'CornProc Ltd'], distances: ['145 km', '180 km', '125 km', '160 km', '150 km'], types: ['Mandi', 'Mandi', 'Mandi', 'Buyer', 'Buyer'], trend: [20, 21, 22, 22, 24, 25], avg: 23, highest: 25, best: 'FeedPlus', net: 23.4, demand: 83, arrivalsScore: 59, storage: 66, saleWindow: 'Next 3–5 days', expected: '₹24–₹26/kg', recommendation: 'Feed and processor demand can support better prices for consistent moisture and volume.', factor: 'Feed demand ↑; arrival volume moderate.' },
  Groundnut: { unit: 'kg', baseLabel: '₹/kg', prices: [52, 55, 54, 59, 57], arrivals: [680, 610, 590, 2900, 2200], locations: ['Mahbubnagar Mandi', 'Wanaparthy Mandi', 'Kurnool Market', 'OilMill Foods', 'NutriOil Buyers'], distances: ['110 km', '150 km', '220 km', '180 km', '195 km'], types: ['Mandi', 'Mandi', 'Mandi', 'Buyer', 'Buyer'], trend: [49, 51, 53, 54, 57, 59], avg: 55.4, highest: 59, best: 'OilMill Foods', net: 56.1, demand: 81, arrivalsScore: 52, storage: 63, saleWindow: 'Next 2–4 days', expected: '₹57–₹60/kg', recommendation: 'Oil-mill buyers offer good demand; clean and graded lots can improve realisation.', factor: 'Processor demand ↑; supply tightening.' },
  Soybean: { unit: 'kg', baseLabel: '₹/kg', prices: [44, 46, 45, 49, 48], arrivals: [520, 480, 560, 2100, 1700], locations: ['Adilabad Mandi', 'Nirmal Mandi', 'Nizamabad Mandi', 'SoyProc Foods', 'AgroOil Buyers'], distances: ['300 km', '275 km', '170 km', '290 km', '280 km'], types: ['Mandi', 'Mandi', 'Mandi', 'Buyer', 'Buyer'], trend: [41, 43, 44, 46, 47, 49], avg: 46.4, highest: 49, best: 'SoyProc Foods', net: 46.8, demand: 80, arrivalsScore: 54, storage: 60, saleWindow: 'Next 3–4 days', expected: '₹47–₹50/kg', recommendation: 'Processor-linked selling is attractive when the lot meets moisture and quantity requirements.', factor: 'Processor demand ↑; arrivals lower.' },
  Sugarcane: { unit: 'kg', baseLabel: '₹/kg', prices: [3.2, 3.3, 3.2, 3.5, 3.4], arrivals: [2200, 2050, 2300, 8500, 6200], locations: ['Nizamabad Cane Yard', 'Nalgonda Cane Yard', 'Medak Cane Yard', 'SugarMill A', 'SugarMill B'], distances: ['170 km', '95 km', '70 km', '180 km', '130 km'], types: ['Mandi', 'Mandi', 'Mandi', 'Buyer', 'Buyer'], trend: [3.0, 3.1, 3.1, 3.2, 3.3, 3.5], avg: 3.32, highest: 3.5, best: 'SugarMill A', net: 3.21, demand: 90, arrivalsScore: 44, storage: 30, saleWindow: 'Today–next 1 day', expected: '₹3.4–₹3.6/kg', recommendation: 'Sugarcane is time-sensitive; nearby mills and pickup capacity matter more than headline price.', factor: 'Mill demand ↑; storage is limited.' }
};

const verifiedBuyers = [
  { name: 'ABC Foods Pvt Ltd', quality: ['A', 'A/B'], crops: ['Tomato', 'Potato', 'Onion', 'Rice'], location: 'Hyderabad', rel: 95, premium: 1.0, distance: 38, terms: '3 days' },
  { name: 'FreshMart Retail', quality: ['A', 'A/B'], crops: ['Tomato', 'Onion', 'Potato', 'Maize'], location: 'Secunderabad', rel: 91, premium: -0.4, distance: 22, terms: '2 days' },
  { name: 'Deccan Processors', quality: ['A'], crops: ['Chilli', 'Maize', 'Soybean', 'Groundnut'], location: 'Warangal', rel: 94, premium: 0.6, distance: 148, terms: '5 days' },
  { name: 'CottonTex Ltd', quality: ['A'], crops: ['Cotton'], location: 'Adilabad', rel: 96, premium: 0.8, distance: 310, terms: '5 days' },
  { name: 'JutePack Industries', quality: ['A'], crops: ['Jute'], location: 'Kolkata', rel: 93, premium: 0.5, distance: 1490, terms: '4 days' },
  { name: 'Green Basket Foods', quality: ['A', 'A/B', 'B'], crops: ['Tomato', 'Chilli', 'Onion', 'Rice', 'Wheat'], location: 'Hyderabad', rel: 86, premium: -0.8, distance: 15, terms: '4 days' },
  { name: 'GrainMill Foods', quality: ['A', 'A/B'], crops: ['Wheat', 'Rice', 'Maize'], location: 'Karimnagar', rel: 92, premium: 0.5, distance: 210, terms: '4 days' },
  { name: 'OilMill Foods', quality: ['A'], crops: ['Groundnut', 'Soybean'], location: 'Mahbubnagar', rel: 94, premium: 0.6, distance: 180, terms: '3 days' },
  { name: 'SugarMill A', quality: ['A', 'A/B'], crops: ['Sugarcane'], location: 'Nizamabad', rel: 95, premium: 0.2, distance: 180, terms: '2 days' }
];

function cropOptions(selected = '') { return CROP_OPTIONS.map(c => `<option value="${esc(c)}" ${c === selected ? 'selected' : ''}>${esc(c)}</option>`).join(''); }
function locationOptions(selected = '') { return LOCATION_OPTIONS.map(c => `<option value="${esc(c)}" ${c === selected ? 'selected' : ''}>${esc(c)}</option>`).join(''); }
function money(n) { return '₹' + Number(n).toLocaleString('en-IN'); }
function esc(s) { return String(s).replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#039;' }[c])); }
function toast(msg) { state.toast = msg; render(); setTimeout(() => { state.toast = null; render(); }, 2400) }
function unitText(crop) { return crop === 'Sugarcane' ? '₹/kg' : '₹/kg'; }
function bestPriceFor(crop) { const d = marketData[crop] || marketData.Tomato; return d.highest; }

function getUserInitials(name) {
  if (!name) return 'U';
  const parts = String(name).trim().split(/\s+/).filter(Boolean);
  if (parts.length >= 2) {
    return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
  }
  return name.slice(0, 2).toUpperCase();
}

function getPersonSilhouetteSvg() {
  return `<svg viewBox="0 0 24 24" fill="currentColor" aria-hidden="true"><path d="M12 12c2.4 0 4.35-1.95 4.35-4.35S14.4 3.3 12 3.3 7.65 5.25 7.65 7.65 9.6 12 12 12zm0 2.4c-2.9 0-8.7 1.45-8.7 4.35v1.95h17.4v-1.95c0-2.9-5.8-4.35-8.7-4.35z"/></svg>`;
}

function renderAvatarInner(user, role) {
  const photo = state.profilePhotoPreview || (state.profileData && state.profileData.profilePhotoUrl) || user?.profilePhotoUrl;
  if (photo) {
    return `<img src="${photo}" alt="Avatar">`;
  }
  if (state.avatarStyle === 'silhouette') {
    return getPersonSilhouetteSvg();
  }
  const name = user?.name || (role === 'farmer' ? 'Ramesh Kumar' : role === 'buyer' ? 'ABC Foods' : 'Admin');
  return `<span>${esc(getUserInitials(name))}</span>`;
}

const NOTIFICATIONS = {
  farmer: [
    { id: 'fn-1', title: 'New Offer Received', desc: 'ABC Foods offered ₹35.00/kg for your Tomato lot (LOT-KL-1024).', time: '10m ago', icon: '🤝', tab: 'offers', unread: true },
    { id: 'fn-2', title: 'Transport Scheduled', desc: 'Vehicle TS09 AB 1234 assigned for pickup at Hyderabad Farm Gate.', time: '1h ago', icon: '🚚', tab: 'transport', unread: true },
    { id: 'fn-3', title: 'Price Trend Alert', desc: 'Tomato modal price rose +₹3.20/kg across Hyderabad mandis today.', time: '3h ago', icon: '📈', tab: 'market', unread: false },
    { id: 'fn-4', title: 'Payment Confirmed', desc: '₹17,000 for TX-2014 will be settled in 2 business days.', time: '1d ago', icon: '💰', tab: 'transactions', unread: false }
  ],
  buyer: [
    { id: 'bn-1', title: 'New Crop Lot Available', desc: 'Grade-A Tomato lot (1,000 kg) listed near Hyderabad matching your requirements.', time: '15m ago', icon: '🌾', tab: 'farmerLots', unread: true },
    { id: 'bn-2', title: 'Offer Accepted by Farmer', desc: 'Farmer accepted offer OF-3041 for Tomato at ₹34.00/kg.', time: '45m ago', icon: '🤝', tab: 'offers', unread: true },
    { id: 'bn-3', title: 'Consolidated Delivery Update', desc: 'Shipment FG-TR-1024 arrived at Hyderabad Central Godown.', time: '2h ago', icon: '🚚', tab: 'transport', unread: false },
    { id: 'bn-4', title: 'Requirement Match Found', desc: '3 new farmer lots found matching active requirement REQ-80.', time: '1d ago', icon: '📋', tab: 'requirements', unread: false }
  ],
  admin: [
    { id: 'an-1', title: 'Buyer KYC Under Review', desc: 'JutePack Industries uploaded trade license documents for verification.', time: '5m ago', icon: '🛡️', tab: 'verify', unread: true },
    { id: 'an-2', title: 'New Dispute Flagged', desc: 'Quality dispute on TX-1998 requires administrative review.', time: '35m ago', icon: '⚑', tab: 'complaints', unread: true },
    { id: 'an-3', title: 'Escrow Settlement Pending', desc: 'Transaction TX-2018 marked Delivered, payment release pending.', time: '2h ago', icon: '💳', tab: 'transactions', unread: false },
    { id: 'an-4', title: 'New Users Registered', desc: '12 new farmers and 2 buyers onboarded in Telangana region.', time: '1d ago', icon: '👥', tab: 'users', unread: false }
  ]
};

function toggleNotifDropdown(e) {
  if (e) e.stopPropagation();
  state.profileDropdownOpen = false;
  state.notifDropdownOpen = !state.notifDropdownOpen;
  render();
}

function closeNotifDropdown() {
  if (state.notifDropdownOpen) {
    state.notifDropdownOpen = false;
    render();
  }
}

function markAllNotifsRead(role) {
  const notifs = NOTIFICATIONS[role] || [];
  state.readNotifs = state.readNotifs || {};
  notifs.forEach(n => { state.readNotifs[n.id] = true; });
  localStorage.setItem('farmora_read_notifs', JSON.stringify(state.readNotifs));
  toast('All notifications marked as read');
  render();
}

function clickNotif(role, notifId, targetTab) {
  state.readNotifs = state.readNotifs || {};
  state.readNotifs[notifId] = true;
  localStorage.setItem('farmora_read_notifs', JSON.stringify(state.readNotifs));
  state.notifDropdownOpen = false;
  if (targetTab) {
    tab(role, targetTab);
  } else {
    render();
  }
}

function toggleProfileDropdown(e) {
  if (e) e.stopPropagation();
  state.notifDropdownOpen = false;
  state.profileDropdownOpen = !state.profileDropdownOpen;
  render();
}

function closeProfileDropdown() {
  if (state.profileDropdownOpen) {
    state.profileDropdownOpen = false;
    render();
  }
}

function setAvatarStyle(style) {
  state.avatarStyle = style;
  localStorage.setItem('farmora_avatar_style', style);
  render();
}

function quickDemoLogin(targetRole) {
  const users = {
    farmer: {
      name: 'Ramesh Kumar',
      email: 'farmer@farmora.demo',
      phone: '9876543210',
      role: 'FARMER',
      location: 'Hyderabad'
    },
    buyer: {
      name: 'ABC Foods Pvt Ltd',
      email: 'buyer@farmora.demo',
      phone: '9876543211',
      role: 'BUYER',
      location: 'Hyderabad'
    },
    admin: {
      name: 'Akshay Kumar (Admin)',
      email: 'admin@farmora.demo',
      phone: '9876543212',
      role: 'ADMIN',
      location: 'Hyderabad'
    }
  };
  const u = users[targetRole] || users.farmer;
  authToken = 'demo-token-' + targetRole;
  authUser = u;
  localStorage.setItem('farmora_token', authToken);
  localStorage.setItem('farmora_user', JSON.stringify(authUser));
  state.role = targetRole;
  state.profileDropdownOpen = false;
  state.notifDropdownOpen = false;
  go(targetRole);
  toast(`Logged in as ${targetRole.toUpperCase()}`);
}

function navBar(type = 'public') {
  const currentRole = state.role || (authUser ? authUser.role.toLowerCase() : (type !== 'public' ? type : null));
  const logged = !!authToken || !!authUser || !!(currentRole && currentRole !== 'public');
  const roleKey = (authUser?.role ? authUser.role.toLowerCase() : (currentRole || 'farmer'));
  const user = authUser || (currentRole ? { name: roleKey === 'farmer' ? 'Ramesh Kumar' : roleKey === 'buyer' ? 'ABC Foods Pvt Ltd' : 'Akshay Kumar (Admin)', role: roleKey.toUpperCase(), email: `${roleKey}@farmora.demo` } : null);
  const roleLabel = roleKey === 'farmer' ? '🌾 Farmer' : roleKey === 'buyer' ? '🏢 Buyer' : '⚙️ Admin';
  const displayName = user?.name || (roleKey === 'farmer' ? 'Ramesh Kumar' : roleKey === 'buyer' ? 'ABC Foods' : 'Admin');
  const displayEmail = user?.email || user?.phone || `${roleKey}@farmora.demo`;
  const avatarInner = renderAvatarInner(user, roleKey);
  const roleNotifs = NOTIFICATIONS[roleKey] || NOTIFICATIONS.farmer;
  const unreadCount = roleNotifs.filter(n => (n.unread && !state.readNotifs?.[n.id])).length;

  return `<div class="nav"><div class="container nav-inner">
    <a class="brand" href="#" onclick="go('home')"><span class="brand-mark">K</span><span>Farmora</span></a>
    <div class="nav-actions">
      ${logged ? `
        <!-- Notification Bell -->
        <button class="nav-icon-btn ${state.notifDropdownOpen ? 'active' : ''}" id="navNotifTrigger" title="Notifications" onclick="toggleNotifDropdown(event)">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9"></path><path d="M13.73 21a2 2 0 0 1-3.46 0"></path></svg>
          ${unreadCount > 0 ? `<span class="nav-icon-badge"></span>` : ''}
        </button>

        <!-- Floating Notifications Dropdown Box -->
        ${state.notifDropdownOpen ? `
          <div class="nav-notif-dropdown" id="navNotifDropdown" onclick="event.stopPropagation()">
            <div class="dropdown-notif-header">
              <div class="dropdown-notif-title">
                <span>Notifications</span>
                ${unreadCount > 0 ? `<span class="dropdown-notif-badge">${unreadCount} new</span>` : ''}
              </div>
              ${unreadCount > 0 ? `<button class="dropdown-notif-action" onclick="markAllNotifsRead('${roleKey}')">Mark all as read</button>` : ''}
            </div>
            <div class="dropdown-notif-list">
              ${roleNotifs.length > 0 ? roleNotifs.map(n => {
    const isUnread = n.unread && !state.readNotifs?.[n.id];
    return `
                  <div class="dropdown-notif-item ${isUnread ? 'unread' : ''}" onclick="clickNotif('${roleKey}', '${n.id}', '${n.tab}')">
                    <div class="dropdown-notif-icon">${n.icon}</div>
                    <div class="dropdown-notif-content">
                      <div class="dropdown-notif-item-title">
                        <span>${esc(n.title)}</span>
                        ${isUnread ? `<span class="dropdown-notif-dot"></span>` : ''}
                      </div>
                      <div class="dropdown-notif-item-desc">${esc(n.desc)}</div>
                      <div class="dropdown-notif-time">${esc(n.time)}</div>
                    </div>
                  </div>
                `;
  }).join('') : `<div class="dropdown-notif-empty"><span>🔔</span>No notifications right now</div>`}
            </div>
          </div>
        ` : ''}

        <!-- Top-Right Single Profile Logo / Avatar with Initials, Silhouette, or Photo -->
        <div class="nav-avatar-trigger ${state.profileDropdownOpen ? 'active' : ''}" id="navAvatarTrigger" onclick="toggleProfileDropdown(event)" title="Account & Profile (${roleKey})">
          <div class="nav-avatar-circle role-${roleKey}">
            ${avatarInner}
          </div>
          <div class="nav-avatar-meta optional">
            <span class="nav-avatar-name">${esc(displayName)}</span>
            <span class="nav-avatar-role-tag">${roleKey}</span>
          </div>
          <span class="nav-avatar-caret">▾</span>
        </div>

        <!-- Floating Profile Dropdown Menu -->
        ${state.profileDropdownOpen ? `
          <div class="nav-user-dropdown" id="navUserDropdown" onclick="event.stopPropagation()">
            <div class="dropdown-user-header">
              <div class="dropdown-avatar-wrap role-${roleKey}" style="${user?.profilePhotoUrl ? '' : roleKey === 'farmer' ? 'background:linear-gradient(135deg,#1b5e3b,#2d8a56)' : roleKey === 'buyer' ? 'background:linear-gradient(135deg,#1e3a8a,#2563eb)' : 'background:linear-gradient(135deg,#431407,#b45309)'}">
                ${avatarInner}
              </div>
              <div class="dropdown-user-info">
                <div class="dropdown-user-name">${esc(displayName)}</div>
                <div class="dropdown-user-id">${esc(displayEmail)}</div>
                <span class="dropdown-role-pill role-${roleKey}">${roleLabel}</span>
              </div>
            </div>
            
            <div class="dropdown-menu-list">
              <div class="dropdown-menu-item" onclick="tab('${roleKey}','profile');closeProfileDropdown()">
                <span class="dmi-icon">👤</span>
                <span>My Profile</span>
                <span class="dmi-badge">View</span>
              </div>
              <div class="dropdown-menu-item" onclick="tab('${roleKey}','profile');state.profileMode='edit';closeProfileDropdown()">
                <span class="dmi-icon">✏️</span>
                <span>Edit Profile</span>
              </div>
              <div class="dropdown-menu-item" onclick="go('${roleKey}');closeProfileDropdown()">
                <span class="dmi-icon">⌂</span>
                <span>Workspace Dashboard</span>
              </div>
            </div>

            <div class="dropdown-divider"></div>

            <div class="dropdown-style-switcher">
              <span>Avatar style:</span>
              <div class="dropdown-style-btns">
                <button class="dropdown-style-btn ${state.avatarStyle === 'initials' ? 'active' : ''}" onclick="setAvatarStyle('initials')">Initials</button>
                <button class="dropdown-style-btn ${state.avatarStyle === 'silhouette' ? 'active' : ''}" onclick="setAvatarStyle('silhouette')">Silhouette</button>
              </div>
            </div>

            <div class="dropdown-divider"></div>

            <div class="dropdown-menu-list">
              <div class="dropdown-menu-item dropdown-logout-btn" onclick="closeProfileDropdown();logout()">
                <span class="dmi-icon">🚪</span>
                <span>Log out</span>
              </div>
            </div>
          </div>
        ` : ''}
      ` : `
        <button class="btn btn-outline optional" onclick="go('login')">Log in</button>
        <button class="btn btn-primary" onclick="go('register')">Register</button>
      `}
    </div>
  </div></div>`;
}

function pageShell(role, active, body) {
  const menus = role === 'farmer' ? [
    ['dashboard', '⌂', 'Dashboard'], ['market', '📈', 'Market Intelligence'], ['lot', '🌾', 'Create Crop Lot'], ['lots', '▦', 'My Lots'], ['offers', '🤝', 'Offers'], ['transactions', '✓', 'Transactions'], ['transport', '🚚', 'Transport'], ['profile', '👤', 'Profile']
  ] : role === 'buyer' ? [
    ['dashboard', '⌂', 'Dashboard'], ['requirements', '📋', 'Requirements'], ['createReq', '＋', 'Post Requirement'], ['farmerLots', '🌾', 'Farmer Lots'], ['offers', '🤝', 'Offers'], ['transactions', '✓', 'Transactions'], ['transport', '🚚', 'Transport'], ['profile', '👤', 'Profile']
  ] : [['dashboard', '⌂', 'Dashboard'], ['users', '👥', 'Users'], ['verify', '✓', 'Verify Buyers'], ['transactions', '↔', 'Transactions'], ['complaints', '⚑', 'Complaints'], ['profile', '👤', 'Profile']];
  return `${navBar(role)}<div class="shell"><aside class="sidebar"><div class="side-title">${role === 'farmer' ? 'Farmer workspace' : role === 'buyer' ? 'Buyer workspace' : 'Admin workspace'}</div><div class="side-nav">${menus.map(m => `<button class="side-btn ${active === m[0] ? 'active' : ''}" onclick="tab('${role}','${m[0]}')"><span>${m[1]}</span>${m[2]}</button>`).join('')}</div><div class="card" style="margin:24px 6px 0;padding:15px;box-shadow:none"><div style="font-size:12px;color:var(--muted);font-weight:700">Prototype intelligence</div><div style="font-size:13px;margin-top:5px;line-height:1.45">Demo market data powers the recommendation engine. Connect live APIs later.</div></div></aside><main class="main">${body}</main></div>${state.toast ? `<div class="toast">${esc(state.toast)}</div>` : ''}`;
}
function home() {
  return `${navBar()}<section class="hero"><div class="container"><span class="eyebrow">🌾 INTELLIGENT FARM-TO-MARKET PLATFORM</span><h1>Decide <span style="color:var(--brand)">WHERE</span>. <span style="color:var(--brand)">WHEN</span>. <span style="color:var(--brand)">TO WHOM</span> to sell.</h1><p>Farmora turns fragmented market information into a clear selling decision — then helps farmers find verified buyers and complete the transaction from offer to payment.</p><div class="hero-cta"><button class="btn btn-primary" onclick="go('login');state.role='farmer'">Explore as Farmer →</button><button class="btn btn-outline" onclick="go('login');state.role='buyer'">Explore as Buyer</button></div><div class="stat-strip"><div class="stat"><div class="kpi">📊 Local</div><div class="label">price intelligence</div></div><div class="stat"><div class="kpi">🧠 Smart</div><div class="label">sale-window recommendations</div></div><div class="stat"><div class="kpi">✅ Verified</div><div class="label">buyer matching</div></div><div class="stat"><div class="kpi">🚚 End-to-end</div><div class="label">transaction support</div></div></div></div></section>
  <section class="container" style="padding-bottom:42px"><div class="feature-grid"><div class="card"><div class="icon-box">📍</div><h3>Localized price intelligence</h3><p>Compare nearby mandis and buyer channels, not just a single headline price. See price spread, arrivals, demand and distance.</p></div><div class="card"><div class="icon-box">🕒</div><h3>Know when to sell</h3><p>Farmora converts trend, demand, arrivals and storage indicators into a plain-language selling-window recommendation.</p></div><div class="card"><div class="icon-box">🤝</div><h3>Match with trusted buyers</h3><p>Rank verified buyers using price fit, quantity, quality, location and payment reliability — with reasons you can understand.</p></div></div><div class="card" style="padding:28px;background:linear-gradient(135deg,#173f30,#245d43);color:#fff;border:0"><div style="display:grid;grid-template-columns:1.1fr .9fr;gap:24px;align-items:center"><div><div class="eyebrow" style="background:#d8f0e4;color:#19583f;border:0">FARMORA ADVANTAGE</div><h2 style="font-size:30px;margin:16px 0 10px;color:#fff">Not just a marketplace. A selling decision engine.</h2><p style="color:#d5ebe1;max-width:620px">Traditional marketplaces show listings. Farmora explains which option is likely to deliver better net realisation and helps execute that choice transparently.</p></div><div style="background:rgba(255,255,255,.09);border:1px solid rgba(255,255,255,.15);border-radius:16px;padding:18px"><div style="display:grid;gap:11px;font-size:13px"><div style="display:flex;justify-content:space-between"><span>Where?</span><b>Local market + buyer comparison</b></div><div style="display:flex;justify-content:space-between"><span>When?</span><b>Sale-window recommendation</b></div><div style="display:flex;justify-content:space-between"><span>To whom?</span><b>Verified buyer match</b></div><div style="display:flex;justify-content:space-between"><span>Then what?</span><b>Offer → logistics → payment</b></div></div></div></div></div></section><div class="container footer">Farmora · SIH prototype · Demo data only</div>`;
}

async function apiCall(endpoint, method = 'GET', body = null) {
  const headers = {
    'Content-Type': 'application/json',
  };
  if (authToken) headers['Authorization'] = `Bearer ${authToken}`;

  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), 30000); // 30s timeout for AI vision

  const options = { method, headers, signal: controller.signal };
  if (body) options.body = JSON.stringify(body);

  try {
    const res = await fetch(`${API_BASE}${endpoint}`, options);
    clearTimeout(timeoutId);
    const data = await res.json();
    if (!data.success && res.status === 401) {
      if (authToken) {
        logout();
      }
    }
    return data;
  } catch (err) {
    console.error('API Error:', err);
    return { success: false, error: { message: 'Network error or Server down' } };
  }
}

function login() {
  const role = state.role || 'farmer';
  const prefill = state.savedLoginId || '';
  return `${navBar()}<div class="auth-wrap"><div class="card auth-card"><h1>Welcome to Farmora</h1><p class="sub">Log in to your account.</p><form class="form" onsubmit="event.preventDefault();loginGo()"><div class="field"><label>Mobile or email</label><input id="loginId" value="${esc(prefill)}" placeholder="${role === 'farmer' ? 'farmer@farmora.demo' : role === 'buyer' ? 'buyer@farmora.demo' : 'admin@farmora.demo'}" required autofocus></div><div class="field"><label>Password</label><input id="loginPwd" type="password" placeholder="••••••••" required></div><button class="btn btn-primary" type="submit">Log in to dashboard →</button></form><div style="margin-top:18px;text-align:center;font-size:13px;color:var(--muted)">Don't have an account? <a href="#" onclick="go('register')" style="color:var(--brand);font-weight:700">Register here →</a></div></div></div>`;
}
function register() { return `${navBar()}<div class="auth-wrap"><div class="card auth-card"><h1>Create your Farmora account</h1><p class="sub">Enter your details to register as a Farmer, Buyer, or Manager.</p><form class="form" onsubmit="event.preventDefault();registerGo()"><div class="field"><label>Full name</label><input id="regName" placeholder="e.g. Ramesh Kumar" required></div><div class="field"><label>Phone number</label><input id="regPhone" type="tel" placeholder="10-digit mobile number" minlength="10" required></div><div class="field"><label>Email (optional)</label><input id="regEmail" type="email" placeholder="e.g. name@farmora.demo"></div><div class="field"><label>Role</label><select id="regRole"><option value="FARMER">Farmer / FPO</option><option value="BUYER">Buyer</option><option value="ADMIN">Manager (Admin)</option></select></div><div class="field"><label>Location</label><input id="regLoc" placeholder="Hyderabad, Telangana" required></div><div class="field"><label>Password</label><input id="regPwd" type="password" placeholder="At least 6 characters" minlength="6" required></div><button class="btn btn-primary" type="submit">Create account →</button></form><div style="margin-top:18px;text-align:center;font-size:13px;color:var(--muted)">Already have an account? <a href="#" onclick="go('login')" style="color:var(--brand);font-weight:700">Log in here →</a></div></div></div>`; }

async function loginGo() {
  const id = (document.getElementById('loginId')?.value || '').trim();
  const pwd = document.getElementById('loginPwd')?.value || '';
  if (!id || !pwd) {
    toast('Please enter your mobile/email and password');
    return;
  }
  const res = await apiCall('/auth/login', 'POST', { identifier: id, password: pwd });
  if (res.success) {
    authToken = res.data.token;
    authUser = res.data.user;
    localStorage.setItem('farmora_token', authToken);
    localStorage.setItem('farmora_user', JSON.stringify(authUser));
    state.role = authUser.role.toLowerCase();
    state.profileDropdownOpen = false;
    state.savedLoginId = null;
    toast(`Welcome back, ${authUser.name}!`);
    go(state.role);
  } else {
    let msg = 'Invalid mobile/email or password';
    if (typeof res.error?.message === 'string') {
      msg = res.error.message;
    } else if (Array.isArray(res.error?.message)) {
      msg = res.error.message.map(e => e.message || JSON.stringify(e)).join(', ');
    }
    toast('Login failed: ' + msg);
  }
}
async function registerGo() {
  const name = (document.getElementById('regName')?.value || '').trim();
  const phone = (document.getElementById('regPhone')?.value || '').trim();
  const email = (document.getElementById('regEmail')?.value || '').trim() || undefined;
  const role = document.getElementById('regRole')?.value || 'FARMER';
  const location = (document.getElementById('regLoc')?.value || '').trim() || 'Hyderabad';
  const password = document.getElementById('regPwd')?.value || '';

  if (!name || name.length < 2) {
    toast('Please enter a valid full name (at least 2 characters)');
    return;
  }
  if (!phone || phone.length < 10) {
    toast('Please enter a valid 10-digit mobile number');
    return;
  }
  if (!password || password.length < 6) {
    toast('Password must be at least 6 characters');
    return;
  }

  const data = { name, phone, email, role, location, password };
  const res = await apiCall('/auth/register', 'POST', data);
  if (res.success) {
    state.savedLoginId = phone;
    toast('Account created successfully! Please log in.');
    setTimeout(() => go('login'), 800);
  } else {
    let msg = 'Registration failed';
    if (typeof res.error?.message === 'string') {
      msg = res.error.message;
    } else if (Array.isArray(res.error?.message)) {
      msg = res.error.message.map(e => e.message || JSON.stringify(e)).join(', ');
    }
    toast(msg);
  }
}
function logout() {
  authToken = null; authUser = null;
  state.profileDropdownOpen = false;
  state.notifDropdownOpen = false;
  localStorage.removeItem('farmora_token'); localStorage.removeItem('farmora_user');
  state.role = null; go('home');
}

function farmerBody() {
  const t = state.farmerTab;
  if (t === 'market') return farmerMarket();
  if (t === 'lot') return farmerCreateLot();
  if (t === 'lots') return farmerLots();
  if (t === 'offers') return farmerOffers();
  if (t === 'counter') return farmerCounterOffer();
  if (t === 'transactions') return farmerTransactions();
  if (t === 'transport') return farmerTransport();
  if (t === 'profile') return profilePage('farmer');
  return farmerDashboard();
}

function farmerDashboard() {
  const crop = 'Tomato'; const d = marketData[crop];
  const firstName = authUser?.name ? authUser.name.split(' ')[0] : 'Farmer';
  return `<div class="page-head"><div><h1>Good evening, ${esc(firstName)} 👋</h1><p>Here is today's selling intelligence — not just a list of prices.</p></div><button class="btn btn-primary" onclick="tab('farmer','lot')">＋ Create crop lot</button></div>
  <div class="grid-4"><div class="card kpi-card"><div class="kpi-label">Best local price · ${crop}</div><div class="kpi-value">₹${d.highest}/kg</div><div class="trend">↑ ${((d.trend[5] - d.trend[0]) / d.trend[0] * 100).toFixed(1)}% over 6 days</div></div><div class="card kpi-card"><div class="kpi-label">Best buyer match</div><div class="kpi-value">94%</div><div class="trend">ABC Foods · Verified</div></div><div class="card kpi-card"><div class="kpi-label">Net realisation</div><div class="kpi-value">₹${d.net.toFixed(2)}/kg</div><div class="trend">After sample logistics</div></div><div class="card kpi-card"><div class="kpi-label">Pending payment</div><div class="kpi-value">₹17,000</div><div class="trend" style="color:var(--gold)">Due in 2 days</div></div></div>
  <div class="grid-2 mt"><div class="card reco"><div class="small">AI-assisted sale-window recommendation · demo</div><h3>What should I do?</h3><div class="reco-price">Sell in ${d.saleWindow}</div><div class="small">Expected price</div><div style="font-size:18px;font-weight:900;margin-top:3px">${d.expected}</div><div class="reco-row"><span>Why?</span><span>${esc(d.factor)}</span></div><div style="display:flex;justify-content:space-between;align-items:center;margin-top:14px"><span class="pill">Potential upside from waiting</span><button class="btn btn-soft btn-sm" onclick="tab('farmer','market')">See market evidence →</button></div></div><div class="card"><div class="section-title" style="margin-top:0"><h2>${crop} price trend</h2><span>Hyderabad region</span></div>${miniTrend(crop)}</div></div>
  <div class="grid-2 mt"><div class="card"><div class="section-title" style="margin-top:0"><h2>Recommended verified buyers</h2><span>Ranked by fit + net realisation</span></div>${buyerMatches(crop, 'Hyderabad', true)}</div><div class="card"><div class="section-title" style="margin-top:0"><h2>Transaction journey</h2><span>LOT-KL-1024</span></div>${transactionJourney('TX-2014')}</div></div>`;
}

function miniTrend(crop) {
  const d = marketData[crop]; const min = Math.min(...d.trend), max = Math.max(...d.trend); const pts = d.trend.map((v, i) => { const x = 45 + (520 / (d.trend.length - 1)) * i; const y = 165 - ((v - min) / Math.max(.01, max - min)) * 105; return `${x.toFixed(1)},${y.toFixed(1)}` }).join(' ');
  return `<div class="chart"><svg viewBox="0 0 600 210" preserveAspectRatio="none"><line class="axis" x1="35" y1="30" x2="35" y2="180"/><line class="axis" x1="35" y1="180" x2="580" y2="180"/><polyline class="line" points="${pts}"/>${d.trend.map((v, i) => { const x = 45 + (520 / (d.trend.length - 1)) * i; const y = 165 - ((v - min) / Math.max(.01, max - min)) * 105; return `<circle class="dot" cx="${x.toFixed(1)}" cy="${y.toFixed(1)}" r="5"><title>${esc(crop)} day ${i + 1}: ₹${v}/kg</title></circle>` }).join('')}<text x="38" y="201">Day 1</text><text x="140" y="201">2</text><text x="245" y="201">3</text><text x="348" y="201">4</text><text x="455" y="201">5</text><text x="550" y="201">6</text><text x="8" y="185">₹${min}</text><text x="8" y="85">₹${max}</text></svg></div>`;
}

function buyerMatches(crop, farmerLocation = 'Hyderabad', compact = false) {
  const d = marketData[crop] || marketData.Tomato;
  const matches = verifiedBuyers.filter(b => b.crops.includes(crop)).map(b => {
    const q = b.quality.includes('A') ? 20 : 12;
    const price = Math.max(0, d.highest + b.premium);
    const distScore = Math.max(0, 15 - Math.min(15, b.distance / 25));
    const score = Math.round(30 + q + distScore + b.rel / 12 + 8 + (b.premium >= 0 ? 7 : 2));
    return { ...b, price, score: Math.min(98, Math.max(62, score)) };
  }).sort((a, b) => b.score - a.score).slice(0, compact ? 3 : 5);
  return matches.map(x => `<div class="match" style="padding:13px 0;border-bottom:1px solid var(--line)"><div class="avatar">${x.name[0]}</div><div class="match-main"><div class="match-top"><span>${esc(x.name)} <span class="badge green" style="margin-left:5px">✓ Verified</span></span><span style="color:var(--brand)">${x.score}%</span></div><div class="match-sub"><b>₹${x.price.toFixed(2)}/kg</b> · ${x.distance} km · reliability ${x.rel}% · ${x.terms}</div><div class="progress"><div style="width:${x.score}%"></div></div><div class="match-sub" style="margin-top:6px">Price ${x.premium >= 0 ? 'fits strongly' : 'is competitive'} · quality match · payment history ${x.rel}%</div></div><button class="btn btn-soft btn-sm" onclick="openMakeOfferModal('${esc(x.name)}',${x.price},'${crop}')">Offer</button></div>`).join('');
}

function farmerMarket() {
  const crop = state.marketCrop || 'Tomato'; const loc = state.marketLocation || 'Hyderabad';
  return `<div class="page-head"><div><h1>Localized Market Intelligence</h1><p>Compare nearby markets, buyers, demand and storage to decide where and when to sell.</p></div><div style="display:flex;gap:9px;flex-wrap:wrap"><select id="marketLocationSelect" class="btn btn-outline" style="padding:10px 12px" onchange="setMarketLocation(this.value)">${locationOptions(loc)}</select><select id="marketCropSelect" class="btn btn-outline" style="padding:10px 12px" onchange="setMarketCrop(this.value)">${cropOptions(crop)}</select></div></div>
  <div id="market-intelligence-content">${marketIntelligenceContent(crop, loc)}</div>`;
}

function marketIntelligenceContent(crop, loc) {
  const d = marketData[crop] || marketData.Tomato;
  const maxPrice = Math.max(...d.prices), minPrice = Math.min(...d.prices); const trendMin = Math.min(...d.trend), trendMax = Math.max(...d.trend); const last = d.trend[d.trend.length - 1], first = d.trend[0]; const changePct = first ? (((last - first) / first) * 100).toFixed(1) : '0.0';
  const localBias = loc === 'Hyderabad' ? 1 : loc === 'Warangal' ? 0.6 : loc === 'Nalgonda' ? 0.3 : 0; const localBest = (d.highest + localBias).toFixed(2); const net = (d.net + localBias - 0.4).toFixed(2); const pts = d.trend.map((v, i) => { const x = 45 + (520 / (d.trend.length - 1)) * i; const y = 165 - ((v - trendMin) / Math.max(.01, trendMax - trendMin)) * 105; return `${x.toFixed(1)},${y.toFixed(1)}` }).join(' ');
  const rows = d.locations.map((name, i) => [name, (d.prices[i] + (d.types[i] === 'Buyer' ? localBias : 0)).toFixed(2), d.arrivals[i], d.distances[i], d.types[i]]);
  const bestChannel = `${d.best} · ${loc}`;
  return `<div class="notice" style="margin-bottom:15px">📍 <b>${esc(loc)} · ${esc(crop)}</b> demo data — crop selection changes the cards, trend, channel table, demand indicators and recommendation. Location adds a small illustrative local adjustment.</div>
  <div class="grid-4"><div class="card kpi-card"><div class="kpi-label">Best nearby price</div><div class="kpi-value">₹${localBest}/kg</div><div class="trend">${esc(d.best)}</div></div><div class="card kpi-card"><div class="kpi-label">Market average</div><div class="kpi-value">₹${d.avg.toFixed(1)}/kg</div><div class="trend">${rows.length} channels compared</div></div><div class="card kpi-card"><div class="kpi-label">Estimated net realisation</div><div class="kpi-value">₹${net}/kg</div><div class="trend">After demo logistics estimate</div></div><div class="card kpi-card"><div class="kpi-label">6-day trend</div><div class="kpi-value">₹${last}/kg</div><div class="trend" style="color:${Number(changePct) >= 0 ? 'var(--brand)' : 'var(--red)'}">${Number(changePct) >= 0 ? '↑' : '↓'} ${Math.abs(Number(changePct))}%</div></div></div>
  <div class="grid-2 mt"><div class="card"><div class="section-title" style="margin-top:0"><h2>${esc(crop)} price trend</h2><span>Last 6 days · ₹/kg</span></div><div class="chart"><svg viewBox="0 0 600 210" preserveAspectRatio="none"><line class="axis" x1="35" y1="30" x2="35" y2="180"/><line class="axis" x1="35" y1="180" x2="580" y2="180"/><line class="axis" x1="35" y1="130" x2="580" y2="130"/><line class="axis" x1="35" y1="80" x2="580" y2="80"/><polyline class="line" points="${pts}"/>${d.trend.map((v, i) => { const x = 45 + (520 / (d.trend.length - 1)) * i; const y = 165 - ((v - trendMin) / Math.max(.01, trendMax - trendMin)) * 105; return `<circle class="dot" cx="${x.toFixed(1)}" cy="${y.toFixed(1)}" r="5"><title>${esc(crop)} day ${i + 1}: ₹${v}/kg</title></circle>` }).join('')}<text x="38" y="201">Day 1</text><text x="140" y="201">2</text><text x="245" y="201">3</text><text x="348" y="201">4</text><text x="455" y="201">5</text><text x="550" y="201">6</text><text x="8" y="185">₹${trendMin}</text><text x="8" y="135">₹${((trendMin + trendMax) / 2).toFixed(1)}</text><text x="8" y="85">₹${trendMax}</text></svg></div><div class="notice" style="margin-top:12px">💡 <b>Sale-window recommendation:</b> Sell in <b>${esc(d.saleWindow)}</b>. ${esc(d.recommendation)}</div></div>
  <div class="card"><div class="section-title" style="margin-top:0"><h2>Decision factors</h2><span>Localized signal</span></div><div style="display:grid;gap:15px"><div><div style="display:flex;justify-content:space-between"><b style="font-size:13px">Buyer demand</b><b>${d.demand}%</b></div><div class="progress"><div style="width:${d.demand}%"></div></div></div><div><div style="display:flex;justify-content:space-between"><b style="font-size:13px">Arrival pressure</b><b>${d.arrivalsScore}%</b></div><div class="progress"><div style="width:${d.arrivalsScore}%"></div></div><div class="helper">Higher score here means tighter arrivals / more supportive conditions.</div></div><div><div style="display:flex;justify-content:space-between"><b style="font-size:13px">Storage availability</b><b>${d.storage}%</b></div><div class="progress"><div style="width:${d.storage}%"></div></div></div><div class="notice"><b>Best channel:</b> ${esc(bestChannel)}<br><span class="helper">Net realisation estimate: ₹${net}/kg</span></div></div></div></div>
  <div class="card mt"><div class="section-title" style="margin-top:0"><h2>Where can I sell?</h2><span>Nearby channels</span></div><div class="table-wrap"><table class="table"><thead><tr><th>Channel</th><th>Type</th><th>Price</th><th>Arrivals / demand</th><th>Distance</th><th>Action</th></tr></thead><tbody>${rows.map((r, i) => `<tr><td><b>${esc(r[0])}</b>${r[4] === 'Buyer' ? '<div class="helper">✓ Buyer channel</div>' : ''}</td><td>${esc(r[4])}</td><td><b>₹${r[1]}/kg</b></td><td>${Number(r[2]).toLocaleString('en-IN')}</td><td>${esc(r[3])}</td><td><button class="btn btn-soft btn-sm" onclick="toast('Channel selected for ${esc(crop)}')">Compare</button></td></tr>`).join('')}</tbody></table></div></div>
  <div class="grid-2 mt"><div class="card"><div class="section-title" style="margin-top:0"><h2>Verified buyers for ${esc(crop)}</h2><span>Match by price, quality, distance, reliability</span></div>${buyerMatches(crop, loc)}</div><div class="card"><div class="section-title" style="margin-top:0"><h2>Net realisation example</h2><span>Why headline price is not enough</span></div><div style="display:grid;gap:10px"><div class="net-row"><span>Best selling price</span><b>₹${localBest}/kg</b></div><div class="net-row"><span>Transport estimate</span><b>- ₹1.00</b></div><div class="net-row"><span>Storage / handling</span><b>- ₹0.40</b></div><div class="net-row total"><span>Estimated net realisation</span><b>₹${net}/kg</b></div></div><div class="notice" style="margin-top:14px">Farmora recommends the option with the strongest combination of <b>price + trust + logistics + timing</b>, not simply the highest visible price.</div></div></div>`;
}

function setMarketCrop(crop) { state.marketCrop = crop; state.marketChannel = 'All'; render(); }
function setMarketLocation(loc) { state.marketLocation = loc; render(); }

function farmerCreateLot() {
  const imgsHtml = state.aiVerifyImages.length > 0
    ? `<div class="image-previews">${state.aiVerifyImages.map((img, i) => `<div class="img-preview-item"><img src="${img.dataUrl}" alt="${esc(img.name)}"><div class="img-preview-remove" onclick="removeLotImage(${i})">×</div></div>`).join('')}</div>`
    : '';
  const uploadAreaCls = state.aiVerifyImages.length > 0 ? 'image-upload-area has-image' : 'image-upload-area';
  const aiPanel = renderAIVerifyPanel();
  const gradeMismatchWarning = (state.aiVerifyResult && !state.aiVerifyResult._error && !state.aiVerifyResult.gradeMatches && state.aiLotGradeOverride !== 'ai')
    ? `<div class="notice" style="background:var(--gold-soft);border:1px solid #e8c97e;margin-bottom:10px">⚠️ <b>Grade mismatch:</b> AI assessed Grade <b>${esc(state.aiVerifyResult.aiGrade || '')}</b> but you selected Grade <b>${esc(state.aiVerifyResult.farmerGrade || '')}</b>. The AI assessment will be recorded with this lot.</div>`
    : '';
  return `<div class="page-head"><div><h1>Create crop lot</h1><p>Give buyers enough information to price and match your produce.</p></div></div>
  <div class="card"><form class="form" style="max-width:820px" onsubmit="event.preventDefault();submitLot(this)">
    <div class="grid-2"><div class="field"><label>Crop</label><select id="lotCrop" onchange="if(state.aiVerifyImages.length){verifyGradeAI(this.value,document.getElementById('lotGrade').value)}">${cropOptions()}</select></div><div class="field"><label>Quantity (kg)</label><input id="lotQty" type="number" min="1" placeholder="1000" required></div></div>
    <div class="grid-2"><div class="field"><label>Quality grade</label><select id="lotGrade" onchange="if(state.aiVerifyImages.length){verifyGradeAI(document.getElementById('lotCrop').value,this.value)}"><option>A</option><option>A/B</option><option>B</option></select></div><div class="field"><label>Expected price (₹/kg)</label><input id="lotPrice" type="number" step="0.01" min="0.01" placeholder="32" required></div></div>
    <div class="grid-2"><div class="field"><label>Harvest date</label><input id="lotHarvest" type="date" required></div><div class="field"><label>Farm location</label><select id="lotLoc">${locationOptions('Hyderabad')}</select></div></div>
    <div class="field"><label>Quality notes</label><textarea id="lotNotes" placeholder="Moisture, size, visible defects, packaging..."></textarea></div>
    <div class="field">
      <label>Crop photos <span style="font-weight:400;color:var(--muted)">(triggers AI grade verification)</span></label>
      <label class="${uploadAreaCls}" for="lot-image-input">
        <input type="file" id="lot-image-input" accept="image/*" multiple style="display:none" onchange="handleLotImageUpload(this)">
        ${state.aiVerifyImages.length === 0
      ? `<div><div style="font-size:24px;margin-bottom:6px">📷</div><div style="font-weight:800;font-size:13px">Click to upload crop images</div><div style="font-size:11px;color:var(--muted);margin-top:3px">JPG, PNG — up to 3 images, max 5MB each</div></div>`
      : `<div style="font-size:13px;font-weight:700;color:var(--brand)">✓ ${state.aiVerifyImages.length} image${state.aiVerifyImages.length > 1 ? 's' : ''} uploaded</div>`}
      </label>
      ${imgsHtml}
    </div>
    ${aiPanel}
    ${gradeMismatchWarning}
    <button class="btn btn-primary" type="submit">Create lot &amp; find matching buyers →</button>
  </form></div>`;
}
async function submitLot(form) {
  const r = state.aiVerifyResult;
  // If there's an unresolved grade mismatch, require acknowledgment
  if (r && !r._error && !r.gradeMatches && !state.aiLotGradeOverride) {
    toast('Please review the AI grade mismatch before creating the lot.');
    return;
  }
  const data = {
    crop: document.getElementById('lotCrop').value,
    quantity: +document.getElementById('lotQty').value,
    grade: document.getElementById('lotGrade').value,
    expectedPrice: +document.getElementById('lotPrice').value,
    location: document.getElementById('lotLoc').value,
    harvestDate: document.getElementById('lotHarvest').value,
    qualityNotes: document.getElementById('lotNotes').value,
    // AI verification data
    cropImageUrl: state.aiVerifyImages[0]?.dataUrl || undefined,
    aiVerifiedGrade: r?.aiGrade || undefined,
    aiConfidence: r?.confidence || undefined,
    cropDetected: r?.cropDetected || undefined,
    cropMatches: r?.cropMatches,
    gradeMatches: r?.gradeMatches,
    aiQualityIndicators: r?.qualityIndicators ? JSON.stringify(r.qualityIndicators) : undefined,
    aiReason: r?.reason || undefined,
    verificationStatus: r?.verificationStatus || undefined,
    verificationTimestamp: r ? new Date().toISOString() : undefined,
  };
  const res = await apiCall('/lots', 'POST', data);
  if (res.success) {
    state.aiVerifyImages = [];
    state.aiVerifyResult = null;
    state.aiLotGradeOverride = null;
    toast('Crop lot created successfully');
    setTimeout(() => tab('farmer', 'lots'), 800);
  } else {
    toast('Failed to create lot');
  }
}
function farmerLots() {
  // Filter to show only current farmer's lots if we have the authUser info
  const myLots = authUser ? state.lots.filter(l => {
    // If lots have farmerProfile.user.name matching our user, or all lots (fallback for demo)
    return !l.farmerProfile || l.farmerProfile.user?.name === authUser.name || state.lots.length <= 5;
  }) : state.lots;
  const displayLots = myLots.length > 0 ? myLots : state.lots;
  return `<div class="page-head"><div><h1>My crop lots</h1><p>Every lot is ready to compare against buyer demand and verified buyers.</p></div><button class="btn btn-primary" onclick="tab('farmer','lot')">＋ New lot</button></div><div class="lot-grid">${displayLots.map(l => `<div class="card lot"><div class="top"><div><h3>${esc(l.crop)}</h3><div class="crop">${esc(l.lotNumber || l.id)} · ${esc(l.location)}</div></div><span class="badge ${l.status === 'AVAILABLE' ? 'green' : l.status === 'RESERVED' ? 'gold' : 'gray'}">${esc(l.status)}</span></div><div class="lot-price">₹${Number(l.expectedPrice || l.price).toFixed(2)}/kg</div><div class="crop">Farmer asking price · Grade ${esc(l.grade)}</div><div class="lot-meta"><div class="meta"><span>Quantity</span><b>${Number(l.quantity || l.qty).toLocaleString('en-IN')} kg</b></div><div class="meta"><span>Harvest</span><b>${esc(new Date(l.harvestDate || l.harvest).toLocaleDateString())}</b></div></div><button class="btn btn-soft" style="width:100%;margin-top:14px" onclick="state.marketCrop='${esc(l.crop)}';state.marketLocation='${esc(l.location)}';tab('farmer','market')">See market intelligence</button></div>`).join('')}</div>`;
}

function farmerOffers() { return `<div class="page-head"><div><h1>Offers & negotiation</h1><p>Compare verified buyer offers and negotiate digitally. Counter-offers are saved in the demo state.</p></div></div><div class="card"><div class="table-wrap"><table class="table"><thead><tr><th>Buyer</th><th>Crop</th><th>Qty</th><th>Offer</th><th>Match</th><th>Payment</th><th>Status</th><th>Actions</th></tr></thead><tbody>${state.offers.map(o => `<tr><td><b>${esc(o.buyerProfile?.user?.name || o.buyer)}</b><div class="helper">✓ Verified buyer</div></td><td>${esc(o.lot?.crop || o.crop)}</td><td>${o.quantity || o.qty} kg</td><td><b style="color:var(--soil)">₹${Number(o.price).toFixed(2)}/kg</b></td><td><span class="badge green">${o.matchScore || o.match}%</span></td><td>${esc(o.paymentTerms || o.payment)}</td><td><span class="badge ${o.status === 'ACCEPTED' ? 'green' : o.status === 'COUNTERED' ? 'gold' : 'gold'}">${esc(o.status)}</span></td><td>${o.status === 'PENDING' ? `<button class="btn btn-primary btn-sm" onclick="acceptOffer('${o.id}')">Accept</button> <button class="btn btn-outline btn-sm" onclick="openCounter('${o.id}')">Counter</button>` : ''}</td></tr>`).join('')}</tbody></table></div></div>` }
function openCounter(id) { state.counterOfferId = id; state.farmerTab = 'counter'; state.view = 'farmer'; render(); window.scrollTo({ top: 0, behavior: 'smooth' }); }
async function sendCounterOffer(e, id) { e.preventDefault(); const price = Number(document.getElementById('counterPrice').value); const qty = Number(document.getElementById('counterQty').value); const terms = document.getElementById('counterTerms').value; if (!(price > 0) || !(qty > 0)) return toast('Enter valid price and quantity'); toast('Counter-offer sent'); setTimeout(() => tab('farmer', 'offers'), 400) }
function farmerCounterOffer() { const o = state.offers.find(x => x.id === state.counterOfferId); if (!o) return `<div class="page-head"><div><h1>Counter Offer</h1><p>No offer selected.</p></div></div><div class="card"><div class="empty">Select an offer from Offers first.<br><button class="btn btn-soft" style="margin-top:12px" onclick="tab('farmer','offers')">Back to offers</button></div></div>`; return `<div class="page-head"><div><h1>Counter Offer</h1><p>Negotiate price, quantity and payment terms with the verified buyer.</p></div><button class="btn btn-outline" onclick="tab('farmer','offers')">← Back to offers</button></div><div class="grid-2"><div class="card"><div class="eyebrow">CURRENT BUYER OFFER</div><h2 style="color:var(--soil);margin:14px 0 5px">${esc(o.buyerProfile?.user?.name || o.buyer)}</h2><div class="helper">${esc(o.lot?.crop || o.crop)} · ${o.quantity || o.qty} kg · ${o.paymentTerms || o.payment}</div><div class="lot-price">₹${Number(o.price).toFixed(2)}/kg</div><div class="notice">✓ Verified buyer · Match score <b>${o.matchScore || o.match}%</b></div></div><div class="card"><h2 style="color:var(--soil);margin-top:0">Your counter-offer</h2><form class="form" onsubmit="sendCounterOffer(event,'${o.id}')"><div class="field"><label>Counter price (₹/kg)</label><input id="counterPrice" type="number" step="0.01" min="0.01" value="${(o.price + 1).toFixed(2)}" required></div><div class="field"><label>Quantity (kg)</label><input id="counterQty" type="number" min="1" value="${o.quantity || o.qty}" required></div><div class="field"><label>Payment terms</label><select id="counterTerms"><option>2 days</option><option ${(o.paymentTerms || o.payment) === '3 days' ? 'selected' : ''}>3 days</option><option ${(o.paymentTerms || o.payment) === '5 days' ? 'selected' : ''}>5 days</option><option ${(o.paymentTerms || o.payment) === '7 days' ? 'selected' : ''}>7 days</option></select></div><div class="field"><label>Message to buyer</label><textarea id="counterMessage" placeholder="Example: Uniform Grade A produce; requesting pickup within 24 hours."></textarea></div><button class="btn btn-primary" type="submit">Send counter-offer →</button></form></div></div>` }
async function acceptOffer(id) { const res = await apiCall(`/offers/${id}/accept`, 'POST'); if (res.success) { toast('Offer accepted. Transaction created.'); setTimeout(() => tab('farmer', 'transactions'), 800) } else { toast('Failed to accept offer: ' + (res.error?.message || 'Server error')) } }

// Modal for making offers from buyer side
function openMakeOfferModal(buyer, suggestedPrice, crop) {
  const lots = state.lots.filter(l => l.crop === crop && l.status === 'AVAILABLE');
  const lotOptions = lots.length > 0
    ? lots.map(l => `<option value="${esc(l.id)}">${esc(l.lotNumber)} · ${esc(l.crop)} · ${Number(l.quantity).toLocaleString('en-IN')} kg · ₹${l.expectedPrice}/kg</option>`).join('')
    : `<option value="">No available lots for ${esc(crop)}</option>`;

  const modal = document.createElement('div');
  modal.id = 'offer-modal-overlay';
  modal.style.cssText = 'position:fixed;inset:0;background:rgba(0,0,0,.5);z-index:1000;display:grid;place-items:center;padding:24px';
  modal.innerHTML = `<div class="card" style="width:min(520px,100%);padding:28px">
    <h2 style="margin:0 0 6px;color:var(--soil)">Submit offer to ${esc(buyer)}</h2>
    <p style="margin:0 0 20px;color:var(--muted);font-size:14px">Send a formal offer for a crop lot. The farmer will be notified.</p>
    <form class="form" onsubmit="submitMakeOffer(event,'${esc(buyer)}')">
      <div class="field"><label>Select lot</label><select id="offerLotId">${lotOptions}</select></div>
      <div class="field"><label>Offer price (₹/kg)</label><input id="offerPrice" type="number" step="0.01" min="0.01" value="${suggestedPrice.toFixed(2)}" required></div>
      <div class="field"><label>Quantity (kg)</label><input id="offerQty" type="number" min="1" value="500" required></div>
      <div class="field"><label>Payment terms</label><select id="offerTerms"><option>2 days</option><option selected>3 days</option><option>5 days</option><option>7 days</option></select></div>
      <div class="field"><label>Message (optional)</label><textarea id="offerMsg" placeholder="Add any details about your offer..."></textarea></div>
      <div style="display:flex;gap:10px;margin-top:4px">
        <button class="btn btn-primary" type="submit" style="flex:1">Submit offer →</button>
        <button class="btn btn-outline" type="button" onclick="document.getElementById('offer-modal-overlay').remove()">Cancel</button>
      </div>
    </form>
  </div>`;
  document.body.appendChild(modal);
  modal.addEventListener('click', e => { if (e.target === modal) modal.remove(); });
}
async function submitMakeOffer(e, buyer) {
  e.preventDefault();
  const lotId = document.getElementById('offerLotId').value;
  if (!lotId) { toast('Please select a lot first'); return; }
  const data = {
    lotId,
    price: +document.getElementById('offerPrice').value,
    quantity: +document.getElementById('offerQty').value,
    paymentTerms: document.getElementById('offerTerms').value,
    message: document.getElementById('offerMsg').value || undefined
  };
  const res = await apiCall('/offers', 'POST', data);
  document.getElementById('offer-modal-overlay')?.remove();
  if (res.success) { toast('Offer submitted to ' + buyer); setTimeout(() => tab('buyer', 'offers'), 800); }
  else { toast('Failed to submit offer: ' + (res.error?.message || 'Server error')); }
}
async function makeOffer(buyer, price, lotId) {
  if (!lotId) { openMakeOfferModal(buyer, price, 'Tomato'); return; }
  const data = { lotId, price: Number(price), quantity: 500, paymentTerms: '3 days' };
  const res = await apiCall('/offers', 'POST', data);
  if (res.success) { toast('Offer submitted successfully'); setTimeout(() => tab('buyer', 'offers'), 800); }
  else { toast('Failed to submit offer'); }
}

function transactionJourney(id) { const t = state.transactions.find(x => x.id === id) || state.transactions[0]; if (!t) return `<div class="notice">No active transactions.</div>`; const steps = [['Offer accepted', 'Digital offer agreed'], ['Transport scheduled', 'Vehicle & pickup confirmed'], ['In transit', 'Shipment moving to buyer'], ['Delivered', 'Buyer received the lot'], ['Payment received', 'Transaction closed']]; return `<div class="timeline">${steps.map((s, i) => `<div class="step ${i < (t.step || 0) ? 'done' : i === (t.step || 0) ? 'active' : ''}"><div class="step-dot">${i < (t.step || 0) ? '✓' : i === (t.step || 0) ? '•' : '○'}</div><div><b>${s[0]}</b><span>${s[1]}</span></div></div>`).join('')}</div><div class="notice" style="margin-top:14px"><b>${esc(t.offer?.buyerProfile?.user?.name || t.buyer)}</b> · ${esc(t.lot?.crop || t.crop)} · ${t.quantity || t.qty} kg · ${money(t.totalAmount || t.total)}<br>Payment: ${esc(t.paymentStatus || t.payment)}</div>`; }
function farmerTransactions() { return `<div class="page-head"><div><h1>End-to-end transactions</h1><p>Farmora keeps the full record visible from offer to payment.</p></div></div><div class="grid-2">${state.transactions.map(t => `<div class="card"><div class="section-title" style="margin-top:0"><h2>${esc(t.txNumber || t.id)}</h2><span>${esc(t.status)}</span></div><div style="font-size:14px"><b>${esc(t.lot?.crop || t.crop)}</b> · ${t.quantity || t.qty} kg<br>Buyer: ${esc(t.offer?.buyerProfile?.user?.name || t.buyer)}<br>Total: <b>${money(t.totalAmount || t.total)}</b></div>${transactionJourney(t.id)}<div style="display:flex;gap:8px;margin-top:15px"><button class="btn btn-soft btn-sm" onclick="advanceTransaction('${t.id}')">Advance status</button><button class="btn btn-outline btn-sm" onclick="toast('Grievance module opened for '+t.id)">Raise grievance</button></div></div>`).join('')}</div>` }
async function advanceTransaction(id) { const res = await apiCall(`/transactions/${id}/advance`, 'POST'); if (res.success) { toast('Transaction advanced'); setTimeout(() => tab(state.role, 'transactions'), 800) } else { toast('Failed to advance') } }

function buyerBody() { const t = state.buyerTab; if (t === 'requirements') return buyerRequirements(); if (t === 'createReq') return buyerCreateReq(); if (t === 'farmerLots') return buyerFarmerLots(); if (t === 'offers') return buyerOffers(); if (t === 'transactions') return buyerTransactions(); if (t === 'transport') return farmerTransport(); if (t === 'profile') return profilePage('buyer'); return buyerDashboard() }
function buyerDashboard() { return `<div class="page-head"><div><h1>Buyer dashboard</h1><p>Source consistent quality and volume from farmers with clearer trust signals.</p></div><button class="btn btn-primary" onclick="tab('buyer','createReq')">＋ Post requirement</button></div><div class="grid-4"><div class="card kpi-card"><div class="kpi-label">Active requirements</div><div class="kpi-value">${state.requirements.length}</div><div class="trend">Across multiple crops</div></div><div class="card kpi-card"><div class="kpi-label">Verified farmers/FPOs</div><div class="kpi-value">186</div><div class="trend">Ready for matching</div></div><div class="card kpi-card"><div class="kpi-label">Lots matching today</div><div class="kpi-value">42</div><div class="trend">Quality + quantity fit</div></div><div class="card kpi-card"><div class="kpi-label">On-time supplier rate</div><div class="kpi-value">95%</div><div class="trend">Platform benchmark</div></div></div><div class="grid-2 mt"><div class="card"><div class="section-title" style="margin-top:0"><h2>Post a precise requirement</h2></div><p>Specify crop, volume, quality and price ceiling so Farmora can surface stronger farmer matches.</p><button class="btn btn-soft" style="margin-top:14px" onclick="tab('buyer','createReq')">Create requirement →</button></div><div class="card"><div class="section-title" style="margin-top:0"><h2>Why Farmora for buyers?</h2></div><p>Instead of browsing a generic marketplace, buyers get structured lots, quality information, and traceable transaction records.</p></div></div>` }
function buyerRequirements() { return `<div class="page-head"><div><h1>Buyer requirements</h1><p>Your active demand becomes searchable by farmers and FPOs.</p></div><button class="btn btn-primary" onclick="tab('buyer','createReq')">＋ Post requirement</button></div><div class="lot-grid">${state.requirements.map(r => `<div class="card lot"><div class="top"><div><h3>${esc(r.crop)}</h3><div class="crop">${esc(r.id)} · ${esc(r.location)}</div></div><span class="badge green">✓ Verified buyer</span></div><div class="lot-price">Up to ₹${r.max}/kg</div><div class="crop">Required quantity: ${Number(r.qty).toLocaleString('en-IN')} kg</div><div class="lot-meta"><div class="meta"><span>Quality</span><b>Grade ${esc(r.grade)}</b></div><div class="meta"><span>Payment</span><b>${esc(r.terms)}</b></div></div></div>`).join('')}</div>` }
function buyerCreateReq() { return `<div class="page-head"><div><h1>Post buyer requirement</h1><p>Tell farmers exactly what volume, quality and price range you need.</p></div></div><div class="card"><form class="form" style="max-width:820px" onsubmit="event.preventDefault();const crop=document.getElementById('reqCrop').value,qty=+document.getElementById('reqQty').value,max=+document.getElementById('reqMax').value,loc=document.getElementById('reqLoc').value;state.requirements.unshift({id:'REQ-'+(90+state.requirements.length),buyer:'Demo Buyer',crop,qty,grade:document.getElementById('reqGrade').value,max,location:loc,terms:document.getElementById('reqTerms').value,verified:true});toast('Requirement published');setTimeout(()=>tab('buyer','requirements'),400)"><div class="grid-2"><div class="field"><label>Crop</label><select id="reqCrop">${cropOptions()}</select></div><div class="field"><label>Quantity needed (kg)</label><input id="reqQty" type="number" min="1" placeholder="5000" required></div></div><div class="grid-2"><div class="field"><label>Required quality</label><select id="reqGrade"><option>A</option><option>A/B</option><option>B</option></select></div><div class="field"><label>Maximum price (₹/kg)</label><input id="reqMax" type="number" min="0.01" step="0.01" placeholder="35" required></div></div><div class="grid-2"><div class="field"><label>Delivery location</label><select id="reqLoc">${locationOptions('Hyderabad')}</select></div><div class="field"><label>Payment terms</label><select id="reqTerms"><option>2 days</option><option>3 days</option><option>5 days</option><option>7 days</option></select></div></div><button class="btn btn-primary">Publish requirement</button></form></div>` }
function buyerFarmerLots() {
  const availableLots = state.lots.filter(l => l.status === 'AVAILABLE');
  const displayLots = availableLots.length > 0 ? availableLots : state.lots;
  return `<div class="page-head"><div><h1>Farmer lots</h1><p>Browse structured crop lots with quality and match signals.</p></div></div><div class="lot-grid">${displayLots.map(l => {
    const d = marketData[l.crop] || marketData.Tomato;
    const matchScore = Math.min(98, Math.max(72, Math.round(70 + (l.expectedPrice <= d.highest ? 15 : 5) + (l.grade === 'A' ? 10 : 5) + Math.random() * 5)));
    return `<div class="card lot"><div class="top"><div><h3>${esc(l.crop)}</h3><div class="crop">${esc(l.lotNumber || l.id)} · ${esc(l.location || l.farmerProfile?.user?.location || '')}</div></div><span class="badge green">${matchScore}% match</span></div><div class="lot-price">₹${Number(l.expectedPrice).toFixed(2)}/kg</div><div class="crop">Farmer: ${esc(l.farmerProfile?.user?.name || 'Farmer')}</div><div class="lot-meta"><div class="meta"><span>Quantity</span><b>${Number(l.quantity).toLocaleString('en-IN')} kg</b></div><div class="meta"><span>Quality</span><b>Grade ${esc(l.grade)}</b></div></div><button class="btn btn-primary" style="width:100%;margin-top:14px" onclick="openMakeOfferModal('${esc(l.farmerProfile?.user?.name || 'Farmer')}',${l.expectedPrice},'${esc(l.crop)}')">Make offer</button></div>`;
  }).join('')}</div>`;
}
function buyerOffers() { return `<div class="page-head"><div><h1>Offers</h1><p>Track outbound and received digital offers.</p></div></div><div class="card"><div class="empty">Buyer-side offers are simulated through the farmer workflow in this prototype.<br><button class="btn btn-soft" style="margin-top:12px" onclick="tab('buyer','farmerLots')">Browse farmer lots</button></div></div>` }
function buyerTransactions() { return `<div class="page-head"><div><h1>Transactions</h1><p>Purchase orders and supplier payment status.</p></div></div><div class="card"><div class="table-wrap"><table class="table"><thead><tr><th>Transaction</th><th>Supplier</th><th>Crop</th><th>Value</th><th>Status</th><th>Payment</th></tr></thead><tbody>${[{ id: 'PO-2081', supplier: 'Ramesh FPO', crop: 'Tomato', value: 17000, status: 'Confirmed', pay: 'Pending' }, { id: 'PO-2075', supplier: 'Warangal Producer Group', crop: 'Chilli', value: 82600, status: 'Delivered', pay: 'Paid' }].map(x => `<tr><td><b>${x.id}</b></td><td>${x.supplier}</td><td>${x.crop}</td><td>${money(x.value)}</td><td><span class="badge ${x.status === 'Delivered' ? 'green' : 'gold'}">${x.status}</span></td><td>${x.pay}</td></tr>`).join('')}</tbody></table></div></div>` }

function adminBody() { const t = state.adminTab; if (t === 'users') return adminUsers(); if (t === 'verify') return adminVerify(); if (t === 'transactions') return adminTx(); if (t === 'complaints') return adminComplaints(); if (t === 'profile') return profilePage('admin'); return adminDashboard() }
function adminDashboard() { return `<div class="page-head"><div><h1>Admin dashboard</h1><p>Monitor trust, users and transaction health.</p></div></div><div class="grid-4"><div class="card kpi-card"><div class="kpi-label">Farmers / FPOs</div><div class="kpi-value">1,250</div><div class="trend">+84 this month</div></div><div class="card kpi-card"><div class="kpi-label">Verified buyers</div><div class="kpi-value">185</div><div class="trend">92% verified</div></div><div class="card kpi-card"><div class="kpi-label">Active lots</div><div class="kpi-value">420</div><div class="trend">Across 12 districts</div></div><div class="card kpi-card"><div class="kpi-label">Open complaints</div><div class="kpi-value">12</div><div class="trend" style="color:var(--gold)">4 high priority</div></div></div><div class="grid-2 mt"><div class="card"><div class="section-title" style="margin-top:0"><h2>Trust & verification</h2></div><div style="display:grid;gap:12px"><div style="display:flex;justify-content:space-between"><span>Buyer KYC verification</span><b>92%</b></div><div class="progress"><div style="width:92%"></div></div><div style="display:flex;justify-content:space-between"><span>Transaction records complete</span><b>98%</b></div><div class="progress"><div style="width:98%"></div></div><div style="display:flex;justify-content:space-between"><span>Payment on-time rate</span><b>95%</b></div><div class="progress"><div style="width:95%"></div></div></div></div><div class="card"><div class="section-title" style="margin-top:0"><h2>Recent activity</h2><span>Today</span></div><div style="display:grid;gap:12px;font-size:13px"><div>✓ ABC Foods verified as buyer <span class="helper">10:24</span></div><div>✓ LOT-KL-1024 accepted offer <span class="helper">11:18</span></div><div>⚑ Payment complaint opened <span class="helper">12:05</span></div><div>✓ Green Basket completed delivery <span class="helper">13:42</span></div></div></div></div>` }
function adminUsers() { return `<div class="page-head"><div><h1>Users</h1><p>Sample trust directory for the prototype.</p></div></div><div class="card"><div class="table-wrap"><table class="table"><thead><tr><th>User</th><th>Role</th><th>Location</th><th>Status</th></tr></thead><tbody>${[['Ramesh Kumar', 'Farmer', 'Hyderabad', 'Active'], ['ABC Foods Pvt Ltd', 'Buyer', 'Hyderabad', 'Verified'], ['FreshMart Retail', 'Buyer', 'Secunderabad', 'Verified'], ['Warangal FPO', 'FPO', 'Warangal', 'Active']].map(x => `<tr><td><b>${x[0]}</b></td><td>${x[1]}</td><td>${x[2]}</td><td><span class="badge ${x[3] === 'Verified' ? 'green' : 'gray'}">${x[3]}</span></td></tr>`).join('')}</tbody></table></div></div>` }
function adminVerify() { return `<div class="page-head"><div><h1>Verify buyers</h1><p>Keep buyer credentials and payment behaviour visible to farmers.</p></div></div><div class="card"><div class="table-wrap"><table class="table"><thead><tr><th>Buyer</th><th>Documents</th><th>Payment reliability</th><th>Action</th></tr></thead><tbody>${[['ABC Foods Pvt Ltd', 'Complete', '95%'], ['FreshMart Retail', 'Complete', '91%'], ['Deccan Processors', 'Complete', '94%'], ['CottonTex Ltd', 'Complete', '96%'], ['JutePack Industries', 'Under review', '93%']].map(x => `<tr><td><b>${x[0]}</b></td><td>${x[1]}</td><td>${x[2]}</td><td>${x[1] === 'Complete' ? '<span class="badge green">Verified</span>' : '<button class="btn btn-primary btn-sm" onclick="toast(\'Buyer marked verified\')">Verify</button>'}</td></tr>`).join('')}</tbody></table></div></div>` }
function adminTx() { return `<div class="page-head"><div><h1>Transactions</h1><p>Platform-wide transaction monitoring.</p></div></div><div class="card"><div class="table-wrap"><table class="table"><thead><tr><th>ID</th><th>Crop</th><th>Value</th><th>Status</th><th>Payment</th></tr></thead><tbody>${state.transactions.map(t => `<tr><td><b>${esc(t.txNumber || t.id)}</b></td><td>${esc(t.lot?.crop || t.crop)}</td><td>${money(t.totalAmount || t.total)}</td><td><span class="badge ${t.status === 'Delivered' || t.status === 'Completed' ? 'green' : 'gold'}">${esc(t.status)}</span></td><td>${esc(t.paymentStatus || t.payment)}</td></tr>`).join('')}</tbody></table></div></div>` }
function adminComplaints() { return `<div class="page-head"><div><h1>Complaints & grievances</h1><p>Resolve issues with auditable records instead of informal calls.</p></div></div><div class="grid-2"><div class="card"><span class="badge red">High priority</span><h3 style="margin-top:12px">Payment delayed · TX-2014</h3><p>Farmer reports payment has not arrived after delivery confirmation.</p><div style="display:flex;gap:8px;margin-top:16px"><button class="btn btn-primary btn-sm" onclick="toast('Complaint assigned to support')">Assign support</button><button class="btn btn-outline btn-sm" onclick="toast('Complaint details opened')">View</button></div></div><div class="card"><span class="badge gold">Medium</span><h3 style="margin-top:12px">Quality dispute · TX-1998</h3><p>Buyer and FPO disagree about grade recorded at pickup.</p><div style="display:flex;gap:8px;margin-top:16px"><button class="btn btn-primary btn-sm" onclick="toast('Complaint assigned to quality team')">Assign</button><button class="btn btn-outline btn-sm" onclick="toast('Complaint details opened')">View</button></div></div></div>` }

function render() {
  if (state.view === 'home') app.innerHTML = `<div class="app">${home()}</div>`;
  else if (state.view === 'login') app.innerHTML = `<div class="app">${login()}</div>`;
  else if (state.view === 'register') app.innerHTML = `<div class="app">${register()}</div>`;
  else if (state.view === 'farmer') app.innerHTML = `<div class="app">${pageShell('farmer', state.farmerTab, farmerBody())}</div>`;
  else if (state.view === 'buyer') app.innerHTML = `<div class="app">${pageShell('buyer', state.buyerTab, buyerBody())}</div>`;
  else if (state.view === 'admin') app.innerHTML = `<div class="app">${pageShell('admin', state.adminTab, adminBody())}</div>`;
}
async function go(v) {
  state.profileDropdownOpen = false;
  state.notifDropdownOpen = false;
  state.view = v;
  if (v === 'farmer' || v === 'buyer' || v === 'admin') {
    await fetchTabData(v, state[`${v}Tab`]);
  }
  render();
  window.scrollTo({ top: 0, behavior: 'smooth' })
}
async function tab(role, t) {
  state.profileDropdownOpen = false;
  state.notifDropdownOpen = false;
  if (role === 'farmer') state.farmerTab = t;
  if (role === 'buyer') state.buyerTab = t;
  if (role === 'admin') state.adminTab = t;
  state.view = role;
  await fetchTabData(role, t);
  render();
  window.scrollTo({ top: 0, behavior: 'smooth' })
}

async function fetchTabData(role, tab) {
  if (tab === 'dashboard' || tab === 'lots' || tab === 'farmerLots') {
    const res = await apiCall('/lots');
    if (res.success) state.lots = res.data.lots;
  }
  if (tab === 'offers' || tab === 'dashboard') {
    const res = await apiCall('/offers');
    if (res.success) state.offers = res.data.offers;
  }
  if (tab === 'transactions' || tab === 'dashboard') {
    const res = await apiCall('/transactions');
    if (res.success) state.transactions = res.data.transactions;
  }
  if (role === 'buyer' && (tab === 'dashboard' || tab === 'farmerLots')) {
    const res = await apiCall('/lots');
    if (res.success) state.lots = res.data.lots;
  }
  if (tab === 'profile') {
    await loadProfile();
  }
  if (tab === 'transport') {
    await loadTransport();
  }
}
async function initApp() {
  if (state.view === 'farmer' || state.view === 'buyer' || state.view === 'admin') {
    await fetchTabData(state.view, state[`${state.view}Tab`]);
  }
  render();
}
initApp();

document.addEventListener('click', (e) => {
  let changed = false;
  if (state.profileDropdownOpen && !e.target.closest('#navAvatarTrigger') && !e.target.closest('#navUserDropdown')) {
    state.profileDropdownOpen = false;
    changed = true;
  }
  if (state.notifDropdownOpen && !e.target.closest('#navNotifTrigger') && !e.target.closest('#navNotifDropdown')) {
    state.notifDropdownOpen = false;
    changed = true;
  }
  if (changed) render();
});

// ═══════════════════════════════════════════════════════════════
// MODULE 1: PROFILE MANAGEMENT
// ═══════════════════════════════════════════════════════════════

async function loadProfile() {
  state.profileLoading = true;
  state.profileError = null;
  render();
  const res = await apiCall('/profile');
  state.profileLoading = false;
  if (res.success) {
    state.profileData = res.data.profile;
    state.profileMode = 'view';
  } else {
    const currentRole = state.role || (authUser ? authUser.role.toLowerCase() : 'farmer');
    state.profileData = state.profileData || {
      name: authUser?.name || (currentRole === 'farmer' ? 'Ramesh Kumar' : currentRole === 'buyer' ? 'ABC Foods Pvt Ltd' : 'Akshay Kumar (Admin)'),
      phone: authUser?.phone || '9876543210',
      email: authUser?.email || `${currentRole}@farmora.demo`,
      city: 'Hyderabad',
      state: 'Telangana',
      farmerProfile: {
        farmName: 'Kumar Organic Farms',
        farmLocation: 'Shadnagar, Hyderabad',
        landArea: 12,
        landAreaUnit: 'Acres',
        primaryCrops: 'Tomato, Chilli',
        farmingType: 'Organic',
        irrigationType: 'Drip',
        yearsOfExperience: 14
      },
      buyerProfile: {
        businessName: 'ABC Foods Pvt Ltd',
        businessType: 'Processor',
        registrationNumber: 'REG-TS-2024-88',
        gstNumber: '36AAACB1234F1Z0',
        procurementLocation: 'Hyderabad, Warangal'
      },
      managerProfile: {
        organization: 'Telangana State Agri Marketing Board',
        designation: 'Regional Procurement Officer',
        employeeId: 'EMP-HYD-4091',
        officeLocation: 'Hyderabad Hub',
        areaOfResponsibility: 'Quality, Mandi Linkages, Trust'
      }
    };
    state.profileMode = 'view';
  }
  render();
}

async function saveProfile() {
  const role = state.role;
  const p = state.profileData || {};
  const photo = state.profilePhotoPreview || p.profilePhotoUrl;
  const name = document.getElementById('pf-name')?.value?.trim();
  const email = document.getElementById('pf-email')?.value?.trim();
  const phone = document.getElementById('pf-phone')?.value?.trim();
  const pincode = document.getElementById('pf-pincode')?.value?.trim();
  const dob = document.getElementById('pf-dob')?.value;
  if (!name || name.length < 2) { toast('Please enter your full name'); return; }
  if (email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) { toast('Please enter a valid email address'); return; }
  if (phone && !/^\d{10,}$/.test(phone.replace(/\s/g, ''))) { toast('Mobile number must have at least 10 digits'); return; }
  if (pincode && !/^\d{4,10}$/.test(pincode)) { toast('Pincode must be 4–10 digits'); return; }
  if (dob && new Date(dob) > new Date()) { toast('Date of birth cannot be in the future'); return; }
  const payload = {
    name, email: email || undefined, phone: phone || undefined,
    gender: document.getElementById('pf-gender')?.value || undefined,
    dateOfBirth: dob || undefined,
    address: document.getElementById('pf-address')?.value || undefined,
    city: document.getElementById('pf-city')?.value || undefined,
    state: document.getElementById('pf-state')?.value || undefined,
    pincode: pincode || undefined,
    profilePhotoUrl: photo || undefined,
    accountStatus: document.getElementById('pf-status')?.value || undefined,
  };
  if (role === 'farmer') {
    payload.farmerProfile = {
      farmName: document.getElementById('pf-farmname')?.value || undefined,
      farmLocation: document.getElementById('pf-farmloc')?.value || undefined,
      landArea: parseFloat(document.getElementById('pf-landarea')?.value) || undefined,
      landAreaUnit: document.getElementById('pf-landunit')?.value || undefined,
      primaryCrops: document.getElementById('pf-primcrops')?.value || undefined,
      secondaryCrops: document.getElementById('pf-seccrops')?.value || undefined,
      farmingType: document.getElementById('pf-farmtype')?.value || undefined,
      irrigationType: document.getElementById('pf-irrig')?.value || undefined,
      yearsOfExperience: parseInt(document.getElementById('pf-exp')?.value) || undefined,
      farmerId: document.getElementById('pf-farmerid')?.value || undefined,
      fpo: document.getElementById('pf-fpo')?.value || undefined,
      preferredMarkets: document.getElementById('pf-markets')?.value || undefined,
      preferredSellingMethod: document.getElementById('pf-sellmethod')?.value || undefined,
    };
  } else if (role === 'buyer') {
    payload.buyerProfile = {
      businessName: document.getElementById('pf-bizname')?.value || undefined,
      businessType: document.getElementById('pf-biztype')?.value || undefined,
      registrationNumber: document.getElementById('pf-regno')?.value || undefined,
      gstNumber: document.getElementById('pf-gst')?.value || undefined,
      businessAddress: document.getElementById('pf-bizaddr')?.value || undefined,
      procurementLocation: document.getElementById('pf-procloc')?.value || undefined,
      cropsInterestedIn: document.getElementById('pf-crops')?.value || undefined,
      preferredQualityGrade: document.getElementById('pf-grade')?.value || undefined,
      preferredDeliveryLocation: document.getElementById('pf-delivloc')?.value || undefined,
    };
  } else if (role === 'admin') {
    payload.managerProfile = {
      organization: document.getElementById('pf-org')?.value || undefined,
      designation: document.getElementById('pf-desig')?.value || undefined,
      employeeId: document.getElementById('pf-empid')?.value || undefined,
      officeLocation: document.getElementById('pf-offloc')?.value || undefined,
      areaOfResponsibility: document.getElementById('pf-area')?.value || undefined,
      assignedRegion: document.getElementById('pf-region')?.value || undefined,
      assignedDistricts: document.getElementById('pf-districts')?.value || undefined,
      permissionLevel: document.getElementById('pf-permlevel')?.value || undefined,
    };
  }
  const res = await apiCall('/profile', 'PUT', payload);
  if (res.success) {
    state.profileData = res.data.profile;
    state.profileMode = 'view';
    state.profilePhotoPreview = null;
    toast('Profile updated successfully');
    render();
  } else {
    toast('Failed to update: ' + (res.error?.message || 'Server error'));
  }
}

function handleProfilePhotoChange(input) {
  if (!input.files || !input.files[0]) return;
  const file = input.files[0];
  if (!file.type.startsWith('image/')) { toast('Please select an image file'); return; }
  if (file.size > 2 * 1024 * 1024) { toast('Photo must be smaller than 2MB'); return; }
  const reader = new FileReader();
  reader.onload = (e) => { state.profilePhotoPreview = e.target.result; render(); };
  reader.readAsDataURL(file);
}

function profileField(label, id, value, type, edit, opts) {
  const display = value ? esc(String(value)) : `<span class="empty">Not provided</span>`;
  if (!edit) return `<div class="profile-field"><label>${esc(label)}</label><div class="profile-value">${display}</div></div>`;
  if (type === 'select' && opts) {
    const options = opts.map(o => `<option value="${esc(o)}" ${o === value ? 'selected' : ''}>${esc(o)}</option>`).join('');
    return `<div class="profile-field"><label>${esc(label)}</label><select id="${id}"><option value="">-- select --</option>${options}</select></div>`;
  }
  if (type === 'textarea') {
    return `<div class="profile-field"><label>${esc(label)}</label><textarea id="${id}" placeholder="${esc(label)}">${esc(value || '')}</textarea></div>`;
  }
  return `<div class="profile-field"><label>${esc(label)}</label><input id="${id}" type="${type || 'text'}" value="${esc(value || '')}" placeholder="${esc(label)}"></div>`;
}

function profilePage(role) {
  if (state.profileLoading) {
    return `<div class="page-head"><div><h1>My Profile</h1></div></div><div class="card"><div class="profile-loading"><div class="pl-spinner"></div><p>Loading profile...</p></div></div>`;
  }
  if (state.profileError) {
    return `<div class="page-head"><div><h1>My Profile</h1></div></div><div class="card"><div class="empty"><b>Unable to load your profile.</b><br>${esc(state.profileError)}<br><button class="btn btn-soft" style="margin-top:12px" onclick="loadProfile()">Retry</button></div></div>`;
  }
  const p = state.profileData || {};
  const fp = p.farmerProfile || {};
  const bp = p.buyerProfile || {};
  const mp = p.managerProfile || {};
  const edit = state.profileMode === 'edit';
  const roleEmoji = role === 'farmer' ? '🌾' : role === 'buyer' ? '🏢' : '⚙️';
  const roleName = role === 'farmer' ? 'FARMER' : role === 'buyer' ? 'BUYER' : 'MANAGER';
  const photo = state.profilePhotoPreview || p.profilePhotoUrl;
  const avatarHtml = photo ? `<img src="${photo}" alt="Profile">` : (state.avatarStyle === 'silhouette' ? getPersonSilhouetteSvg() : `<span>${esc(getUserInitials(p.name || authUser?.name || 'Your Name'))}</span>`);

  const photoInput = edit ? `<input type="file" id="pf-photo-input" accept="image/*" style="display:none" onchange="handleProfilePhotoChange(this)">` : '';
  const commonFields = `
    <div class="profile-section">
      <div class="profile-section-title">Personal Information</div>
      <div class="profile-grid">
        ${profileField('Full Name', 'pf-name', p.name, 'text', edit)}
        ${profileField('Gender', 'pf-gender', p.gender, 'select', edit, ['Male', 'Female', 'Other', 'Prefer not to say'])}
        ${profileField('Date of Birth', 'pf-dob', p.dateOfBirth ? new Date(p.dateOfBirth).toISOString().split('T')[0] : null, 'date', edit)}
        ${profileField('Mobile Number', 'pf-phone', p.phone, 'tel', edit)}
      </div>
    </div>
    <div class="profile-section">
      <div class="profile-section-title">Contact Information</div>
      <div class="profile-grid">
        ${profileField('Email Address', 'pf-email', p.email, 'email', edit)}
        ${profileField('City', 'pf-city', p.city, 'text', edit)}
        ${profileField('State / Province', 'pf-state', p.state, 'text', edit)}
        ${profileField('Pincode', 'pf-pincode', p.pincode, 'text', edit)}
      </div>
      <div style="margin-top:14px">${profileField('Address', 'pf-address', p.address, 'textarea', edit)}</div>
    </div>
  `;

  let roleSpecific = '';
  if (role === 'farmer') {
    roleSpecific = `
      <div class="profile-section">
        <div class="profile-section-title">🌾 Farming Information</div>
        <div class="profile-grid">
          ${profileField('Farm Name', 'pf-farmname', fp.farmName, 'text', edit)}
          ${profileField('Farm Location', 'pf-farmloc', fp.farmLocation, 'text', edit)}
          ${profileField('Land Area', 'pf-landarea', fp.landArea, 'number', edit)}
          ${profileField('Land Area Unit', 'pf-landunit', fp.landAreaUnit, 'select', edit, ['Acres', 'Hectares'])}
          ${profileField('Primary Crops', 'pf-primcrops', fp.primaryCrops, 'text', edit)}
          ${profileField('Secondary Crops', 'pf-seccrops', fp.secondaryCrops, 'text', edit)}
          ${profileField('Farming Type', 'pf-farmtype', fp.farmingType, 'select', edit, ['Organic', 'Conventional', 'Mixed'])}
          ${profileField('Irrigation Type', 'pf-irrig', fp.irrigationType, 'select', edit, ['Rainfed', 'Borewell', 'Canal', 'Drip', 'Other'])}
          ${profileField('Years of Experience', 'pf-exp', fp.yearsOfExperience, 'number', edit)}
          ${profileField('Farmer ID', 'pf-farmerid', fp.farmerId, 'text', edit)}
          ${profileField('FPO Name', 'pf-fpo', fp.fpo, 'text', edit)}
          ${profileField('Preferred Markets', 'pf-markets', fp.preferredMarkets, 'text', edit)}
          ${profileField('Preferred Selling Method', 'pf-sellmethod', fp.preferredSellingMethod, 'text', edit)}
        </div>
      </div>
    `;
  } else if (role === 'buyer') {
    roleSpecific = `
      <div class="profile-section">
        <div class="profile-section-title">🏢 Business Information</div>
        <div class="profile-grid">
          ${profileField('Business Name', 'pf-bizname', bp.businessName, 'text', edit)}
          ${profileField('Business Type', 'pf-biztype', bp.businessType, 'select', edit, ['Wholesaler', 'Retailer', 'Processor', 'Exporter', 'Institutional Buyer', 'Other'])}
          ${profileField('Registration Number', 'pf-regno', bp.registrationNumber, 'text', edit)}
          ${profileField('GST Number', 'pf-gst', bp.gstNumber, 'text', edit)}
          ${profileField('Procurement Location', 'pf-procloc', bp.procurementLocation, 'text', edit)}
        </div>
        <div style="margin-top:14px">${profileField('Business Address', 'pf-bizaddr', bp.businessAddress, 'textarea', edit)}</div>
      </div>
      <div class="profile-section">
        <div class="profile-section-title">📦 Procurement Preferences</div>
        <div class="profile-grid">
          ${profileField('Crops Interested In', 'pf-crops', bp.cropsInterestedIn, 'text', edit)}
          ${profileField('Preferred Quality Grade', 'pf-grade', bp.preferredQualityGrade, 'select', edit, ['A', 'A/B', 'B'])}
          ${profileField('Preferred Delivery Location', 'pf-delivloc', bp.preferredDeliveryLocation, 'text', edit)}
        </div>
      </div>
    `;
  } else {
    roleSpecific = `
      <div class="profile-section">
        <div class="profile-section-title">🏢 Organization Information</div>
        <div class="profile-grid">
          ${profileField('Organization', 'pf-org', mp.organization, 'text', edit)}
          ${profileField('Designation', 'pf-desig', mp.designation, 'text', edit)}
          ${profileField('Employee ID', 'pf-empid', mp.employeeId, 'text', edit)}
          ${profileField('Office Location', 'pf-offloc', mp.officeLocation, 'text', edit)}
          ${profileField('Area of Responsibility', 'pf-area', mp.areaOfResponsibility, 'text', edit)}
        </div>
      </div>
      <div class="profile-section">
        <div class="profile-section-title">⚙️ Management Information</div>
        <div class="profile-grid">
          ${profileField('Assigned Region', 'pf-region', mp.assignedRegion, 'text', edit)}
          ${profileField('Assigned Districts', 'pf-districts', mp.assignedDistricts, 'text', edit)}
          ${profileField('Permission Level', 'pf-permlevel', mp.permissionLevel, 'select', edit, ['Viewer', 'Coordinator', 'Manager', 'Administrator'])}
        </div>
      </div>
    `;
  }

  const accountSection = `
    <div class="profile-section">
      <div class="profile-section-title">Account Information</div>
      <div class="account-info-grid">
        <div class="account-field"><div class="af-label">User ID</div><div class="af-value" style="font-size:12px;word-break:break-all">${esc(p.id || '—')}</div></div>
        <div class="account-field"><div class="af-label">Role</div><div class="af-value">${roleName}</div></div>
        <div class="account-field"><div class="af-label">Member since</div><div class="af-value">${p.createdAt ? new Date(p.createdAt).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' }) : '—'}</div></div>
        <div class="account-field"><div class="af-label">Account Status</div><div class="af-value">${edit ? `<select id="pf-status"><option value="Active" ${p.accountStatus !== 'Inactive' ? 'selected' : ''}>Active</option><option value="Inactive" ${p.accountStatus === 'Inactive' ? 'selected' : ''}>Inactive</option></select>` : `<span style="color:${p.accountStatus === 'Inactive' ? 'var(--danger)' : 'var(--brand)'};font-weight:800">${esc(p.accountStatus || 'Active')}</span>`}</div></div>
      </div>
    </div>
  `;

  const actions = edit
    ? `<div class="profile-actions"><button class="btn btn-outline" onclick="state.profileMode='view';state.profilePhotoPreview=null;render()">Cancel</button><button class="btn btn-primary" onclick="saveProfile()">Save Changes</button></div>`
    : `<div class="profile-actions"><button class="btn btn-soft" onclick="logout()" style="margin-right:auto">Log out</button><button class="btn btn-primary" onclick="state.profileMode='edit';render()">Edit Profile</button></div>`;

  return `
    <div class="page-head"><div><h1>My Profile</h1><p>Manage your personal and role-specific information.</p></div></div>
    <div class="profile-header">
      <div class="profile-avatar-wrap">
        <div class="profile-avatar">${avatarHtml}</div>
        ${edit ? `<label class="profile-avatar-edit" for="pf-photo-input" title="Change photo">📷</label>` : ''}
      </div>
      <div class="profile-info">
        <div class="role-badge">${roleEmoji} ${roleName}</div>
        <h2>${esc(p.name || authUser?.name || 'Your Name')}</h2>
        <div class="profile-email">${esc(p.email || p.phone || '')}</div>
        <div class="profile-email" style="margin-top:3px">${esc(p.location || p.city || '')}</div>
        <div style="margin-top:10px;display:flex;gap:8px;align-items:center;flex-wrap:wrap">
          <span style="font-size:11px;color:#cce6da;font-weight:700">Avatar representation:</span>
          <button type="button" class="btn btn-sm" style="font-size:11px;padding:3px 8px;border-radius:6px;background:${state.avatarStyle === 'initials' ? '#ffffff' : 'transparent'};color:${state.avatarStyle === 'initials' ? '#173f30' : '#fff'};border:1px solid rgba(255,255,255,.4)" onclick="setAvatarStyle('initials')">Initials</button>
          <button type="button" class="btn btn-sm" style="font-size:11px;padding:3px 8px;border-radius:6px;background:${state.avatarStyle === 'silhouette' ? '#ffffff' : 'transparent'};color:${state.avatarStyle === 'silhouette' ? '#173f30' : '#fff'};border:1px solid rgba(255,255,255,.4)" onclick="setAvatarStyle('silhouette')">Silhouette</button>
        </div>
      </div>
    </div>
    <div class="card">
      ${photoInput}
      ${commonFields}
      ${roleSpecific}
      ${accountSection}
      ${actions}
    </div>
  `;
}


// ═══════════════════════════════════════════════════════════════
// MODULE 2: TRANSPORT & CONSOLIDATED DELIVERY TRACKING
// ═══════════════════════════════════════════════════════════════

async function loadTransport() {
  state.transportLoading = true;
  render();
  const res = await apiCall('/transport');
  state.transportLoading = false;
  if (res.success) state.transportData = res.data.shipments;
  render();
}

const TRANSPORT_STEPS = [
  { key: 'PICKUP_SCHEDULED', label: 'Pickup Scheduled', icon: '📋', pct: 10 },
  { key: 'PRODUCE_COLLECTED', label: 'Collected', icon: '✅', pct: 35 },
  { key: 'IN_TRANSIT_TO_GODOWN', label: 'To Godown', icon: '🚚', pct: 50 },
  { key: 'ARRIVED_AT_GODOWN', label: 'At Godown', icon: '🏭', pct: 65 },
  { key: 'QUALITY_VERIFICATION', label: 'Quality Check', icon: '🔍', pct: 75 },
  { key: 'CONSOLIDATED', label: 'Consolidated', icon: '📦', pct: 82 },
  { key: 'DISPATCHED_TO_BUYER', label: 'To Buyer', icon: '🚛', pct: 92 },
  { key: 'DELIVERED', label: 'Delivered', icon: '✓', pct: 100 },
];
const STATUS_PCT = { PICKUP_SCHEDULED: 10, PICKUP_ASSIGNED: 20, PRODUCE_COLLECTED: 35, IN_TRANSIT_TO_GODOWN: 50, ARRIVED_AT_GODOWN: 65, QUALITY_VERIFICATION: 75, CONSOLIDATED: 82, DISPATCHED_TO_BUYER: 92, OUT_FOR_DELIVERY: 96, DELIVERED: 100 };
const STATUS_LABEL = { PICKUP_SCHEDULED: 'Pickup Scheduled', PICKUP_ASSIGNED: 'Pickup Assigned', PRODUCE_COLLECTED: 'Produce Collected', IN_TRANSIT_TO_GODOWN: 'In Transit to Godown', ARRIVED_AT_GODOWN: 'Arrived at Godown', QUALITY_VERIFICATION: 'Quality Verification', CONSOLIDATED: 'Consolidated', DISPATCHED_TO_BUYER: 'Dispatched to Buyer', OUT_FOR_DELIVERY: 'Out for Delivery', DELIVERED: 'Delivered' };
const DEMO_TRANSPORT = { shipmentNumber: 'FG-TR-1024', buyerName: 'ABC Foods Pvt Ltd', buyerVerified: true, destination: 'ABC Foods Distribution Center', godownName: 'Hyderabad Central Godown', godownCity: 'Hyderabad', vehicleNumber: 'TS09 AB 1234', driverName: 'Ravi Kumar', status: 'ARRIVED_AT_GODOWN', totalQuantity: 800, items: [{ farmerName: 'Akshay Kumar', farmerLocation: 'Hyderabad', crop: 'Tomato', quantity: 500, pickupPoint: 'Hyderabad Farm Gate', status: 'IN_TRANSIT' }, { farmerName: 'Ravi Kumar', farmerLocation: 'Warangal', crop: 'Chilli', quantity: 300, pickupPoint: 'Warangal Collection Point', status: 'IN_TRANSIT' }] };
const CROP_ICONS = { Tomato: '🍅', Chilli: '🌶️', Onion: '🧅', Potato: '🥔', Cotton: '🌿', Wheat: '🌾', Rice: '🌾', Maize: '🌽', Groundnut: '🥜', Soybean: '🫘' };

function transportFlowDiagram(status) {
  const currentIdx = TRANSPORT_STEPS.findIndex(s => s.key === status);
  return `<div class="flow-diagram">${TRANSPORT_STEPS.map((s, i) => {
    const done = i < currentIdx, active = i === currentIdx;
    const cls = done ? 'done' : active ? 'active' : 'pending';
    return `<div class="flow-node ${cls}"><div class="flow-icon ${cls}">${done ? '✓' : s.icon}</div><div class="flow-label">${s.label}</div></div>${i < TRANSPORT_STEPS.length - 1 ? `<div class="flow-connector ${done ? 'done' : ''}"></div>` : ''}`;
  }).join('')}</div>`;
}

function consolidationDiagram(s) {
  const farmers = s.items || [];
  return `<div class="consolidation-visual">
    <div class="conv-farmers">${farmers.map(f => `<div class="conv-farmer-card"><div class="conv-farmer-icon">${CROP_ICONS[f.crop] || '🌱'}</div><div class="conv-farmer-info"><h4>${esc(f.farmerName)}</h4><div class="conv-crop">${esc(f.crop)} · ${Number(f.quantity).toLocaleString('en-IN')} kg · ${esc(f.farmerLocation)}</div></div></div>`).join('')}</div>
    <div class="conv-arrows"><div class="conv-arrow-line"></div><span style="font-size:22px;color:var(--brand)">→</span><div class="conv-arrow-line"></div></div>
    <div class="conv-godown"><div class="conv-godown-icon">🏭</div><h3>${esc(s.godownName || 'Farmora Godown')}</h3><div class="conv-city">${esc(s.godownCity || '')}</div><div style="margin-top:8px;font-size:11px;color:var(--brand);font-weight:800">Combined: ${Number(s.totalQuantity || 0).toLocaleString('en-IN')} kg</div><div style="margin-top:10px;border-top:1px solid var(--line);padding-top:8px;font-size:12px;font-weight:800;color:var(--soil)">${esc(s.buyerName)}</div><div style="font-size:10px;color:var(--muted)">${esc(s.destination || '')}</div></div>
  </div>`;
}

function farmerTransport() {
  if (state.transportLoading) return `<div class="page-head"><div><h1>Transport &amp; Logistics</h1></div></div><div class="card"><div class="empty">Loading shipments...</div></div>`;
  const shipments = state.transportData || [DEMO_TRANSPORT];
  const s = shipments[0] || DEMO_TRANSPORT;
  const status = s.status || 'ARRIVED_AT_GODOWN';
  const pct = STATUS_PCT[status] || 65;
  const label = STATUS_LABEL[status] || status;
  const farmers = s.items || [];
  const timeline = [
    { time: '10:15 AM', label: 'Pickup completed', sub: 'Hyderabad Farm Gate', done: true },
    { time: '11:05 AM', label: 'Vehicle departed', sub: esc(s.vehicleNumber || 'TS09 AB 1234'), done: true },
    { time: '2:20 PM', label: 'Arrived at consolidation center', sub: esc(s.godownName || 'Hyderabad Central Godown'), done: ['ARRIVED_AT_GODOWN', 'QUALITY_VERIFICATION', 'CONSOLIDATED', 'DISPATCHED_TO_BUYER', 'DELIVERED'].includes(status) },
    { time: '2:45 PM', label: 'Quality verification', sub: 'Currently processing', active: status === 'QUALITY_VERIFICATION' },
    { time: '4:00 PM', label: 'Consolidation', sub: 'Combining shipments for buyer', done: ['CONSOLIDATED', 'DISPATCHED_TO_BUYER', 'DELIVERED'].includes(status) },
    { time: '6:00 PM', label: 'Dispatch to ' + esc(s.buyerName || 'Buyer'), sub: 'Final delivery', done: ['DISPATCHED_TO_BUYER', 'DELIVERED'].includes(status) },
  ];
  return `
    <div class="page-head"><div><h1>Transport &amp; Logistics</h1><p>Track your produce from farm gate to buyer — including consolidated shipments.</p></div></div>
    <div class="grid-4">
      <div class="card kpi-card"><div class="kpi-label">Active Shipments</div><div class="kpi-value">${shipments.filter(x => x.status !== 'DELIVERED').length || 1}</div><div class="trend">Being tracked</div></div>
      <div class="card kpi-card"><div class="kpi-label">In Transit</div><div class="kpi-value">${shipments.filter(x => ['IN_TRANSIT_TO_GODOWN', 'DISPATCHED_TO_BUYER', 'OUT_FOR_DELIVERY'].includes(x.status)).length || 1}</div><div class="trend">Moving now</div></div>
      <div class="card kpi-card"><div class="kpi-label">At Godown</div><div class="kpi-value">${shipments.filter(x => ['ARRIVED_AT_GODOWN', 'QUALITY_VERIFICATION', 'CONSOLIDATED'].includes(x.status)).length || 1}</div><div class="trend">Consolidating</div></div>
      <div class="card kpi-card"><div class="kpi-label">Delivered</div><div class="kpi-value">${shipments.filter(x => x.status === 'DELIVERED').length || 3}</div><div class="trend" style="color:var(--brand)">Completed</div></div>
    </div>
    <div class="card mt"><div class="section-title" style="margin-top:0"><h2>Live Transport Path</h2><span>${esc(s.shipmentNumber || 'FG-TR-1024')}</span></div>${transportFlowDiagram(status)}</div>
    <div class="transport-status-card mt">
      <div class="ts-label">Current Status</div>
      <div class="ts-status">🚚 ${esc(label)}</div>
      <div class="ts-detail">Shipment <b>${esc(s.shipmentNumber || 'FG-TR-1024')}</b> · Buyer: <b>${esc(s.buyerName)}</b>${s.buyerVerified ? ' ✓ Verified' : ''}</div>
      <div class="transport-progress-bar"><div style="width:${pct}%"></div></div>
      <div class="progress-pct">Transport Progress: ${pct}%</div>
    </div>
    <div class="grid-2 mt">
      <div>
        <div class="card" style="margin-bottom:15px">
          <div class="section-title" style="margin-top:0"><h2>Consolidated Shipment</h2><span>Two farmers · One delivery</span></div>
          <div class="notice" style="margin-bottom:14px">Farmora combines compatible shipments from multiple farmers to reduce transportation costs.</div>
          ${consolidationDiagram(s)}
          <div class="table-wrap" style="margin-top:12px"><table class="table" style="min-width:auto"><thead><tr><th>Farmer</th><th>Crop</th><th>Qty</th></tr></thead><tbody>${farmers.map(f => `<tr><td><b>${esc(f.farmerName)}</b><div class="helper">${esc(f.farmerLocation)}</div></td><td>${CROP_ICONS[f.crop] || '🌱'} ${esc(f.crop)}</td><td>${Number(f.quantity).toLocaleString('en-IN')} kg</td></tr>`).join('')}</tbody></table></div>
          <div style="display:flex;justify-content:space-between;padding:10px 0 0;font-weight:800;font-size:14px;border-top:1px solid var(--line);margin-top:6px"><span>Total</span><span>${Number(s.totalQuantity || 800).toLocaleString('en-IN')} kg</span></div>
        </div>
        <div class="saving-card">
          <h3>Shared Transport Saving</h3>
          <div class="net-row"><span>Individual transport estimate</span><b>₹2,400</b></div>
          <div class="net-row"><span>Consolidated transport cost</span><b>₹1,600</b></div>
          <div class="net-row total"><span>Your estimated saving</span><b>₹400</b></div>
        </div>
      </div>
      <div>
        <div class="card" style="margin-bottom:15px">
          <div class="section-title" style="margin-top:0"><h2>My Produce in Transit</h2><span>Per-item status</span></div>
          ${farmers.map(f => `<div style="padding:12px 0;border-bottom:1px solid var(--line)"><div style="display:flex;align-items:center;gap:10px;margin-bottom:6px"><span style="font-size:20px">${CROP_ICONS[f.crop] || '🌱'}</span><div><div style="font-weight:800">${esc(f.crop)} · ${Number(f.quantity).toLocaleString('en-IN')} kg</div><div class="helper">Farmer: ${esc(f.farmerName)} · ${esc(f.farmerLocation)}</div></div></div><div style="font-size:12px;display:grid;gap:4px"><div><span style="color:var(--muted)">Pickup:</span> ${esc(f.pickupPoint || 'Farm gate')}</div><div><span style="color:var(--muted)">Current:</span> 🏭 ${esc(s.godownName || 'Godown')}</div><div><span style="color:var(--muted)">Buyer:</span> ${esc(s.buyerName)}</div></div><span class="badge ${f.status === 'IN_TRANSIT' ? 'gold' : 'green'}" style="margin-top:8px">${f.status === 'IN_TRANSIT' ? 'In Transit' : 'Collected'}</span></div>`).join('')}
        </div>
        <div class="card" style="margin-bottom:15px">
          <div class="section-title" style="margin-top:0"><h2>Shipment Details</h2><span>${esc(s.shipmentNumber || 'FG-TR-1024')}</span></div>
          <div class="shipment-meta">
            <div class="sm-item"><div class="sm-label">Vehicle</div><div class="sm-value">${esc(s.vehicleNumber || 'TS09 AB 1234')}</div></div>
            <div class="sm-item"><div class="sm-label">Driver</div><div class="sm-value">${esc(s.driverName || 'Ravi Kumar')}</div></div>
            <div class="sm-item"><div class="sm-label">Buyer</div><div class="sm-value">${esc(s.buyerName)}${s.buyerVerified ? ' ✓' : ''}</div></div>
            <div class="sm-item"><div class="sm-label">Destination</div><div class="sm-value">${esc(s.destination || 'ABC Foods DC')}</div></div>
          </div>
          <div class="section-title" style="margin-top:18px"><h2>Shipment Timeline</h2></div>
          <div class="transport-timeline">${timeline.map(t => `<div class="tt-step ${t.done ? 'tt-done' : t.active ? 'tt-active' : ''}"><div class="tt-time">${t.time}</div><div class="tt-dot">${t.done ? '✓' : t.active ? '●' : '○'}</div><div class="tt-content"><b>${t.label}</b><span>${t.sub}</span></div></div>`).join('')}</div>
        </div>
        <div class="card">
          <div class="section-title" style="margin-top:0"><h2>🔔 Notifications</h2></div>
          <div class="notif-list">
            ${[{ t: '10:15 AM', title: 'Pickup confirmed', body: 'Your Tomato lot was collected from the farm.' }, { t: '11:05 AM', title: 'Shipment moving', body: 'Produce is travelling to Hyderabad Central Godown.' }, { t: '2:20 PM', title: 'Arrived at Godown', body: 'Produce has reached the consolidation center.' }, { t: '2:45 PM', title: 'Quality check started', body: 'Your Tomato shipment is currently being verified.' }, { t: '3:30 PM', title: 'Shipment consolidated', body: "Produce combined with Ravi Kumar's shipment for ABC Foods." }].map(n => `<div class="notif-item"><div class="notif-dot"></div><div class="notif-body"><b>${esc(n.title)}</b>${esc(n.body)}</div><div class="notif-time">${n.t}</div></div>`).join('')}
          </div>
        </div>
      </div>
    </div>
  `;
}


// ═══════════════════════════════════════════════════════════════
// MODULE 3: AI CROP GRADE VERIFICATION (integrated into Create Lot)
// ═══════════════════════════════════════════════════════════════

function handleLotImageUpload(input) {
  if (!input.files || !input.files.length) return;
  const files = Array.from(input.files).slice(0, 3);
  state.aiVerifyImages = [];
  state.aiVerifyResult = null;
  state.aiLotGradeOverride = null;
  let loaded = 0;
  files.forEach(file => {
    if (!file.type.startsWith('image/')) return;
    if (file.size > 5 * 1024 * 1024) { toast('Image must be smaller than 5MB'); return; }
    const reader = new FileReader();
    reader.onload = (e) => {
      state.aiVerifyImages.push({ dataUrl: e.target.result, name: file.name, mimeType: file.type });
      loaded++;
      if (loaded === files.length) {
        render();
        const crop = document.getElementById('lotCrop')?.value || 'Tomato';
        const grade = document.getElementById('lotGrade')?.value || 'A';
        verifyGradeAI(crop, grade);
      }
    };
    reader.readAsDataURL(file);
  });
}

function removeLotImage(idx) {
  state.aiVerifyImages.splice(idx, 1);
  state.aiVerifyResult = null;
  state.aiLotGradeOverride = null;
  render();
}

async function verifyGradeAI(crop, farmerGrade) {
  if (!state.aiVerifyImages.length) return;
  state.aiVerifyLoading = true;
  state.aiVerifyResult = null;
  render();
  const primary = state.aiVerifyImages[0];
  const payload = {
    crop, farmerGrade,
    imageBase64: primary.dataUrl,
    mimeType: primary.mimeType,
    images: state.aiVerifyImages.length > 1 ? state.aiVerifyImages.map(i => i.dataUrl) : undefined,
  };
  const res = await apiCall('/ai/verify-crop-grade', 'POST', payload);
  state.aiVerifyLoading = false;
  state.aiVerifyResult = res.success ? res.data : { _error: res.error?.message || 'Verification failed' };
  render();
}

function useAIGrade() {
  if (!state.aiVerifyResult?.aiGrade) return;
  state.aiLotGradeOverride = 'ai';
  const sel = document.getElementById('lotGrade');
  if (sel) sel.value = state.aiVerifyResult.aiGrade;
  toast('AI grade applied: ' + state.aiVerifyResult.aiGrade);
  render();
}

function keepFarmerGrade() {
  state.aiLotGradeOverride = 'farmer';
  toast('Grade kept. AI mismatch will be recorded with the lot.');
  render();
}

function renderAIVerifyPanel() {
  const imgs = state.aiVerifyImages;
  if (imgs.length === 0) {
    return `<div class="ai-verify-wrap"><div class="ai-verify-header"><h3>🤖 AI Crop Grade Verification</h3><span class="ai-badge">Gemini Vision</span></div><div class="ai-body"><div style="font-size:13px;color:var(--muted)">Upload a crop image above to trigger AI grade verification.</div></div></div>`;
  }
  if (state.aiVerifyLoading) {
    return `<div class="ai-verify-wrap"><div class="ai-verify-header"><h3>🤖 AI Crop Grade Verification</h3><span class="ai-badge">Analyzing...</span></div><div class="ai-body"><div class="ai-loading"><div class="ai-spinner"></div><p>Analyzing crop image...</p><div class="ai-step-anim"><div class="ai-step-item done">🌱 Image received</div><div class="ai-step-item">🔎 Identifying crop...</div><div class="ai-step-item">📊 Checking visible quality...</div><div class="ai-step-item">✅ Comparing grade...</div></div></div></div></div>`;
  }
  const r = state.aiVerifyResult;
  if (!r) return '';
  if (r._error) {
    return `<div class="ai-verify-wrap"><div class="ai-verify-header"><h3>🤖 AI Crop Grade Verification</h3><span class="ai-badge">Error</span></div><div class="ai-body"><div class="ai-reason-box">⚠️ ${esc(r._error)}<br><br><button class="btn btn-soft btn-sm" onclick="verifyGradeAI(document.getElementById('lotCrop').value,document.getElementById('lotGrade').value)">Retry</button></div></div></div>`;
  }
  const vs = r.verificationStatus || 'UNVERIFIED';
  const conf = r.confidence || 0;
  const confClass = conf >= 80 ? 'high' : conf >= 60 ? 'medium' : 'low';
  const statusCls = vs === 'VERIFIED' ? 'verified' : vs === 'GRADE_MISMATCH' ? 'mismatch' : vs === 'CROP_MISMATCH' ? 'failed' : 'review';
  const statusText = vs === 'VERIFIED' ? '✅ Grade Verified' : vs === 'GRADE_MISMATCH' ? '⚠️ Grade Mismatch' : vs === 'CROP_MISMATCH' ? '❌ Crop Mismatch' : vs === 'NEEDS_REVIEW' ? '🔵 Needs Review' : '⚪ Unable to Verify';
  const qi = r.qualityIndicators || {};
  const qiHtml = Object.keys(qi).filter(k => qi[k]).map(k => `<div class="ai-ind-item"><div class="ai-ind-label">${esc(k)}</div><div class="ai-ind-value">${esc(qi[k])}</div></div>`).join('');
  return `<div class="ai-verify-wrap"><div class="ai-verify-header"><h3>🤖 AI Crop Grade Verification</h3><span class="ai-badge">Gemini Vision</span></div><div class="ai-body"><div class="ai-result">
    <div style="display:flex;align-items:center;gap:10px;flex-wrap:wrap">
      <span class="ai-verify-status ${statusCls}">${statusText}</span>
      <span style="font-size:12px;color:var(--muted)">Crop detected: <b>${esc(r.cropDetected || '—')}</b></span>
    </div>
    ${!r.cropMatches ? `<div class="ai-reason-box">❌ Image does not appear to contain the selected crop. Please upload a clear image of the correct crop.</div>` : ''}
    <div class="ai-grade-compare">
      <div class="agc-item"><div class="agc-label">You Selected</div><div class="agc-grade">${esc(r.farmerGrade || '—')}</div><div class="agc-sub">Farmer grade</div></div>
      <div class="agc-sep">${r.gradeMatches ? '✅' : '⚡'}</div>
      <div class="agc-item"><div class="agc-label">AI Assessed</div><div class="agc-grade" style="color:${r.gradeMatches ? 'var(--brand)' : 'var(--gold)'}">${esc(r.aiGrade || '—')}</div><div class="agc-sub">AI grade</div></div>
    </div>
    <div>
      <div style="display:flex;justify-content:space-between;font-size:12px;font-weight:800;margin-bottom:3px"><span>AI Confidence</span><span>${conf}%</span></div>
      <div class="ai-confidence-bar ${confClass}"><div style="width:${conf}%"></div></div>
      <div style="font-size:11px;color:var(--muted)">${conf >= 80 ? '✅ High confidence — reliable result' : conf >= 60 ? '🔵 Medium confidence — review recommended' : '⚪ Low confidence — unable to reliably verify'}</div>
    </div>
    ${qiHtml ? `<div class="ai-indicators">${qiHtml}</div>` : ''}
    ${r.reason ? `<div class="ai-reason-box">💡 ${esc(r.reason)}</div>` : ''}
    <div class="ai-action-btns">
      ${r.aiGrade && r.aiGrade !== r.farmerGrade ? `<button class="btn btn-primary btn-sm" onclick="useAIGrade()">Use AI Grade (${esc(r.aiGrade)})</button>` : ''}
      <button class="btn btn-outline btn-sm" onclick="keepFarmerGrade()">Keep My Grade</button>
      <button class="btn btn-soft btn-sm" onclick="state.aiVerifyImages=[];state.aiVerifyResult=null;state.aiLotGradeOverride=null;document.getElementById('lot-image-input').value='';render()">Re-upload Image</button>
    </div>
    <div class="ai-disclaimer">AI grade verification is based on visible crop characteristics from uploaded images. Final quality may require physical inspection.</div>
  </div></div></div>`;
}
