/* ============================================================
   script.js — Rede de Apoio Araraquara
   Versão A — otimizada, completa e compatível com index.html
   Mantém todas as funcionalidades: markers, clusters, filtros,
   busca, painel lateral, bottom-sheet arrastável, geolocalização.
   ============================================================ */

/* ---------------------- DADOS DO MAPA ---------------------- */
const pontos = [
  {
    name: "Centro Pop",
    category: "Serviços Públicos de Referência",
    address: "",
    details: "",
    phone: "",
    hours: "",
    lat: -21.7895843,
    lng: -48.1775678,
    photo: "fotos/centro_pop.jpg"
  },
  {
    name: 'Casa de acolhida "Assad-Kan"',
    category: "Serviços Públicos de Referência",
    address: "",
    details: "",
    phone: "",
    hours: "",
    lat: -21.7905161,
    lng: -48.1917449,
    photo: "fotos/assad_kan.jpg"
  },
  {
    name: "CRAS Central",
    category: "Serviços Públicos de Referência",
    address: "Rua Gonçalves Dias, 468 Centro (antigo prédio da UMED, esquina com Av. Espanha)",
    details: "Centro de Referência da Assistência Social - Unidade Central",
    phone: "",
    hours: "",
    lat: -21.791522,
    lng: -48.173929,
    photo: "fotos/cras_central.jpg"
  },
  {
    name: "Associação São Pio (masculino)",
    category: "Pontos de Apoio e Parcerias",
    address: "",
    details: "Apoio social e reinserção",
    phone: "",
    hours: "",
    lat: -21.824304,
    lng: -48.2037705,
    photo: "fotos/sao_pio_m.jpg"
  },
  {
    name: "Associação São Pio (feminina)",
    category: "Pontos de Apoio e Parcerias",
    address: "",
    details: "Apoio social e reinserção",
    phone: "",
    hours: "",
    lat: -21.7665622,
    lng: -48.1782641,
    photo: "fotos/sao_pio_f.jpg"
  },
  {
    name: "Fundo Social de Solidariedade de Araraquara",
    category: "Pontos de doação",
    address: "",
    details: "",
    phone: "",
    hours: "",
    lat: -21.7788367,
    lng: -48.1921867,
    photo: "fotos/fundo_social.jpg"
  }
];

/* ----------------- CONFIGURAÇÃO DE CATEGORIAS ----------------- */
const categoryConfig = {
  "Serviços Públicos de Referência": { color: "#2b7cff" },
  "Pontos de Apoio e Parcerias": { color: "#28a745" },
  "Pontos de doação": { color: "#ff8c42" }
};

/* ---------------------- VARIÁVEIS GLOBAIS ---------------------- */
let map;
let infoWindow;
let markers = [];
let markerCluster = null;
let userLocation = null;
let userMarker = null;
let selectedMarker = null;
let previousMapCenter = null;
let previousMapZoom = null;

/* Helpers to read DOM elements (tolerant) */
const $ = id => document.getElementById(id);
const q = sel => document.querySelector(sel);

/* ---------------------- INICIALIZAÇÃO MAPA ---------------------- */
window.initMap = function initMap() {
  // Create map
  map = new google.maps.Map($("map"), {
    center: { lat: -21.79, lng: -48.185 },
    zoom: 13,
    streetViewControl: false,
    mapTypeControl: false,
    fullscreenControl: true,
    gestureHandling: "greedy"
  });

  infoWindow = new google.maps.InfoWindow();

  createMarkers();
  fitToMarkers();

  initFilters();
  initListaLocais();
  initSearch();
  initBairroSearch();
  initGeoBtn();
  initNearbyBtn();
  initHamburgerMenu();
  initDetailsPanel();
};

/* ---------------------- CRIAR MARCADORES ---------------------- */
function createMarkers() {
  // cleanup previous
  if (markerCluster) {
    try { markerCluster.clearMarkers(); } catch (e) {}
    markerCluster = null;
  }
  markers.forEach(m => m.setMap(null));
  markers = [];

  for (const p of pontos) {
    const color = categoryConfig[p.category]?.color || "#555";

    const marker = new google.maps.Marker({
      position: { lat: p.lat, lng: p.lng },
      title: p.name,
      icon: {
        url: makeSvgPin(color),
        scaledSize: new google.maps.Size(36, 36)
      },
      map
    });

    marker._data = p;
    marker._category = p.category;

    marker.addListener("click", () => openDetailsPanel(marker));
    markers.push(marker);
  }

  if (markers.length > 0) {
    markerCluster = new markerClusterer.MarkerClusterer({ map, markers });
  }
}

/* ---------------------- ÍCONE SVG ---------------------- */
function makeSvgPin(color) {
  const svg = `
    <svg xmlns="http://www.w3.org/2000/svg" width="36" height="36" viewBox="0 0 24 24">
      <path d="M12 2C8 2 5 5 5 9c0 6.2 7 13 7 13s7-6.8 7-13c0-4-3-7-7-7z"
        fill="${color}" stroke="#fff" stroke-width="1.5"/>
      <circle cx="12" cy="9" r="2.5" fill="#fff"/>
    </svg>`;
  return "data:image/svg+xml," + encodeURIComponent(svg);
}

/* ---------------------- FILTROS ---------------------- */
function initFilters() {
  const box = $("filters");
  if (!box) return;
  box.innerHTML = "";

  Object.keys(categoryConfig).forEach(cat => {
    const id = slug(cat);
    const color = categoryConfig[cat].color;

    const label = document.createElement("label");
    label.className = "filter-item";
    label.innerHTML = `<input type="checkbox" id="${id}" data-cat="${cat}" checked>
                       <span class="dot" style="background:${color}"></span> ${cat}`;
    box.appendChild(label);
  });

  document.querySelectorAll("#filters input").forEach(chk => chk.addEventListener("change", applyFilters));
}

function applyFilters() {
  const active = [...document.querySelectorAll("#filters input:checked")].map(i => i.dataset.cat);

  markers.forEach(m => {
    try { m.setVisible(active.includes(m._category)); } catch(e) {}
  });

  // rebuild cluster with visible markers
  const visible = markers.filter(m => m.getVisible && m.getVisible());
  if (markerCluster) {
    markerCluster.clearMarkers();
    markerCluster.addMarkers(visible);
  } else {
    markerCluster = new markerClusterer.MarkerClusterer({ map, markers: visible });
  }

  renderListaLocais();
}

/* ---------------------- BUSCA POR NOME ---------------------- */
function initSearch() {
  const box = $("searchBox");
  const clearBtn = $("btnClearSearch");
  if (!box || !clearBtn) return;

  box.addEventListener("input", () => {
    const q = box.value.toLowerCase();
    markers.forEach(m => {
      const d = m._data || {};
      const hay = (d.name + " " + (d.address || "") + " " + (d.details || "")).toLowerCase();
      try { m.setVisible(hay.includes(q)); } catch(e) {}
    });
    rebuildClusterVisible();
    renderListaLocais();
  });

  clearBtn.addEventListener("click", () => { box.value = ""; box.dispatchEvent(new Event("input")); });
}

/* ---------------------- BUSCA POR BAIRRO ---------------------- */
function initBairroSearch() {
  const box = $("bairroBox");
  if (!box) return;
  box.addEventListener("input", () => {
    const q = box.value.toLowerCase();
    markers.forEach(m => {
      const hay = ((m._data && m._data.address) || "").toLowerCase();
      try { m.setVisible(hay.includes(q)); } catch(e) {}
    });
    rebuildClusterVisible();
    renderListaLocais();
  });
}

/* rebuild cluster with visible markers helper */
function rebuildClusterVisible() {
  const visible = markers.filter(m => m.getVisible && m.getVisible());
  if (markerCluster) {
    markerCluster.clearMarkers();
    markerCluster.addMarkers(visible);
  } else {
    markerCluster = new markerClusterer.MarkerClusterer({ map, markers: visible });
  }
}

/* ---------------------- LISTA DE LOCAIS ---------------------- */
function initListaLocais() { renderListaLocais(); }

function renderListaLocais() {
  const box = $("listaLocais");
  if (!box) return;
  box.innerHTML = "";

  let vis = markers.filter(m => m.getVisible ? m.getVisible() : true);

  if (userLocation) {
    vis.forEach(m => {
      if (m._data && typeof m._data.lat === "number") {
        m._distance = haversineDistance(userLocation.lat, userLocation.lng, m._data.lat, m._data.lng);
      } else m._distance = Infinity;
    });
    vis.sort((a,b) => (a._distance || 0) - (b._distance || 0));
  }

  vis.forEach(m => {
    const d = m._data || {};
    const dist = (userLocation && m._distance !== Infinity && m._distance!==undefined) ? ` — ${m._distance.toFixed(1)} km` : "";
    const item = document.createElement("div");
    item.className = "lista-item";
    item.innerHTML = `<strong>${escapeHtml(d.name)}</strong><br><span>${escapeHtml(d.category || "")}${dist}</span>`;

    item.addEventListener("click", () => {
      // close side panel if open
      const panel = $("panel");
      const overlay = $("menuOverlay");
      if (panel && panel.classList.contains("open")) {
        panel.classList.remove("open");
        if (overlay) overlay.classList.add("hidden");
      }

      // pan & zoom
      if (d.lat && d.lng) {
        map.panTo({ lat: d.lat, lng: d.lng });
        map.setZoom(16);
      }

      // find marker
      const marker = markers.find(mm => mm._data && mm._data.name === d.name && mm._data.lat === d.lat && mm._data.lng === d.lng);
      if (marker) openDetailsPanel(marker);
    });

    box.appendChild(item);
  });
}

/* ---------------------- DETALHES (BOTTOM SHEET) ---------------------- */
/* panel states: closed, compact, mid, expanded */
function detailsPanelEl() {
  return $("detailsPanel") || q(".details-panel");
}
function sheetHandleEl() {
  return $("sheetHandle") || q(".sheet-handle");
}
function detailsExtraBlockEl() {
  return $("detailsExtraBlock") || q(".details-extra-block");
}

function setPanelState(state) {
  const panel = detailsPanelEl();
  if (!panel) return;

  panel.style.height = ""; // let CSS control heights
  panel.classList.remove("state-closed", "state-compact", "state-mid", "state-expanded");

  switch (state) {
    case 'closed':
      panel.classList.add("state-closed");
      panel.classList.add("hidden");
      panel.setAttribute("aria-hidden", "true");
      document.body.style.overflow = "";
      break;
    case 'compact':
      panel.classList.remove("hidden");
      panel.classList.add("state-compact");
      panel.setAttribute("aria-hidden", "false");
      document.body.style.overflow = "";
      break;
    case 'mid':
      panel.classList.remove("hidden");
      panel.classList.add("state-mid");
      panel.setAttribute("aria-hidden", "false");
      document.body.style.overflow = "hidden";
      break;
    case 'expanded':
      panel.classList.remove("hidden");
      panel.classList.add("state-expanded");
      panel.setAttribute("aria-hidden", "false");
      document.body.style.overflow = "hidden";
      break;
    default:
      panel.classList.add("state-compact");
      panel.setAttribute("aria-hidden", "false");
      document.body.style.overflow = "";
  }
}

/* Abre painel e popula */
function openDetailsPanel(marker) {
  // if side panel open, close it first to ensure map visibility
  const side = $("panel");
  const overlay = $("menuOverlay");
  if (side && side.classList.contains("open")) {
    side.classList.remove("open");
    if (overlay) overlay.classList.add("hidden");
    setTimeout(() => openDetailsPanel(marker), 180);
    return;
  }

  selectedMarker = marker;

  previousMapCenter = map.getCenter();
  previousMapZoom = map.getZoom();

  const p = marker._data || {};

  highlightMarker(marker);

  // Fill fields (keep DOM id names used in index.html)
  const nameEl = $("detailsName"); if (nameEl) nameEl.textContent = p.name || "";
  const catEl = $("detailsCategory"); if (catEl) catEl.textContent = p.category || "";
  const addrEl = $("detailsAddress"); if (addrEl) addrEl.textContent = p.address || "";
  const detEl = $("detailsDetails"); if (detEl) detEl.textContent = p.details || "";
  const phoneEl = $("detailsPhone"); if (phoneEl) phoneEl.textContent = p.phone || "";
  const hoursEl = $("detailsHours"); if (hoursEl) hoursEl.textContent = p.hours || "";

  // Photo handling with fallback
  const photoEl = $("detailsPhoto");
  if (photoEl) {
    photoEl.onerror = function() { this.src = "placeholder.jpg"; };
    photoEl.src = p.photo || "placeholder.jpg";
  }

  // Distance
  if (userLocation && p.lat && p.lng) {
    const dist = haversineDistance(userLocation.lat, userLocation.lng, p.lat, p.lng);
    const distEl = $("detailsDistance");
    if (distEl) distEl.textContent = `Distância: ${dist.toFixed(1)} km`;
  } else {
    const distEl = $("detailsDistance");
    if (distEl) distEl.textContent = "";
  }

  // route button
  const routeBtn = $("routeBtn");
  if (routeBtn) routeBtn.onclick = () => {
    if (p.lat && p.lng) window.open(`https://www.google.com/maps/dir/?api=1&destination=${p.lat},${p.lng}`, "_blank");
    else alert("Coordenadas não disponíveis.");
  };

  // hide extra block initially
  const extra = detailsExtraBlockEl();
  if (extra) { extra.classList.add("hidden"); extra.style.display = "none"; }

  // Start compact then nudge map so marker is visible
  setPanelState('compact');

  setTimeout(() => {
    try {
      const panelEl = detailsPanelEl();
      const panelHeight = (panelEl && panelEl.clientHeight) ? panelEl.clientHeight : Math.round(window.innerHeight * 0.15);
      const offset = Math.round(panelHeight / 2.2);
      // panBy expects pixel offsets; negative Y pans map up
      map.panBy(0, -offset);
    } catch (e) { /* ignore pan errors */ }
  }, 260);
}

/* init details panel listeners */
function initDetailsPanel() {
  const closeBtn = $("closeDetails");
  if (closeBtn) {
    closeBtn.addEventListener("click", () => {
      setPanelState('closed');
      markers.forEach(m => { try { m.setOpacity(1); } catch(e) {} });
      if (previousMapCenter) { map.panTo(previousMapCenter); map.setZoom(previousMapZoom); }
      closePanelCleanup();
    });
  }

  const moreBtn = $("detailsMoreBtn") || $("detailsMore");
  if (moreBtn) {
    moreBtn.addEventListener("click", () => {
      const block = detailsExtraBlockEl();
      if (!block) return;
      if (block.classList.contains("hidden")) {
        block.classList.remove("hidden");
        block.style.display = "block";
        setTimeout(() => block.scrollIntoView({ behavior: "smooth", block: "center" }), 120);
      } else {
        block.classList.add("hidden");
        block.style.display = "none";
      }
    });
  }

  initPanelDrag();
}

/* ----------------------
   Panel drag (touch + mouse)
   ---------------------- */
function initPanelDrag() {
  const panel = detailsPanelEl();
  const handle = sheetHandleEl();
  if (!panel || !handle) return;

  let startY = 0, currentY = 0, dragging = false, startHeight = 0;

  function decideStateFromHeight(h) {
    const vh = window.innerHeight;
    const ratio = h / vh;
    if (ratio >= 0.75) return 'expanded';
    if (ratio >= 0.3) return 'mid';
    return 'compact';
  }

  function onStart(e) {
    dragging = true;
    startY = (e.touches ? e.touches[0].clientY : e.clientY);
    currentY = startY;
    startHeight = panel.getBoundingClientRect().height || (window.innerHeight * 0.15);
    panel.style.transition = 'none';
    document.body.style.userSelect = 'none';
    e.preventDefault && e.preventDefault();
  }

  function onMove(e) {
    if (!dragging) return;
    currentY = (e.touches ? e.touches[0].clientY : e.clientY);
    const dy = currentY - startY;
    const newHeight = Math.max(80, startHeight - dy);
    panel.style.height = newHeight + 'px';
  }

  function onEnd(e) {
    if (!dragging) return;
    dragging = false;
    panel.style.transition = '';
    document.body.style.userSelect = '';
    const finalHeight = parseInt(panel.style.height || panel.getBoundingClientRect().height, 10);
    const snap = decideStateFromHeight(finalHeight);

    const delta = currentY - startY;
    if (delta > 140 && (panel.classList.contains('state-compact') || snap === 'compact')) {
      setPanelState('closed');
      panel.style.height = "";
      return;
    }

    setPanelState(snap);
    if (snap === 'expanded' || snap === 'mid') document.body.style.overflow = 'hidden';
    else document.body.style.overflow = '';
  }

  handle.addEventListener('touchstart', onStart, { passive: false });
  handle.addEventListener('touchmove', onMove, { passive: false });
  handle.addEventListener('touchend', onEnd);

  handle.addEventListener('mousedown', onStart);
  window.addEventListener('mousemove', onMove);
  window.addEventListener('mouseup', onEnd);

  // quick click toggles
  let lastStartY = 0;
  handle.addEventListener('click', () => {
    if (Math.abs(currentY - lastStartY) > 8) return;
    const panelEl = detailsPanelEl();
    if (!panelEl) return;
    const isClosed = panelEl.classList.contains('hidden') || panelEl.classList.contains('state-closed');
    if (isClosed) { setPanelState('compact'); return; }
    if (panelEl.classList.contains('state-compact')) setPanelState('mid');
    else if (panelEl.classList.contains('state-mid')) setPanelState('expanded');
    else setPanelState('compact');
  });
}

/* ---------------------- HIGHLIGHT ---------------------- */
function highlightMarker(marker) {
  markers.forEach(m => {
    try {
      if (m === marker) {
        m.setOpacity && m.setOpacity(1);
        m.setAnimation && m.setAnimation(google.maps.Animation.BOUNCE);
        setTimeout(() => m.setAnimation && m.setAnimation(null), 800);
      } else {
        m.setOpacity && m.setOpacity(0.25);
      }
    } catch (e) {}
  });
}

/* ---------------------- GEOLOCALIZAÇÃO ---------------------- */
function initGeoBtn() {
  const geoBtn = $("geoBtn");
  if (!geoBtn) return;
  geoBtn.addEventListener("click", () => {
    if (!navigator.geolocation) { alert("Seu navegador não suporta geolocalização."); return; }
    navigator.geolocation.getCurrentPosition(pos => {
      userLocation = { lat: pos.coords.latitude, lng: pos.coords.longitude };
      if (!userMarker) {
        userMarker = new google.maps.Marker({
          position: userLocation, map,
          icon: { path: google.maps.SymbolPath.CIRCLE, scale: 8, fillColor: "#0b5ed7", fillOpacity: 0.9, strokeColor: "#fff", strokeWeight: 2 },
          title: "Você está aqui"
        });
      } else userMarker.setPosition(userLocation);

      map.panTo(userLocation);
      map.setZoom(15);
      renderListaLocais();
    }, err => alert("Não foi possível acessar a localização: " + (err.message || "")));
  });
}

/* ---------------------- LOCAIS PRÓXIMOS ---------------------- */
function initNearbyBtn() {
  const nearby = $("nearbyBtn");
  if (!nearby) return;
  nearby.addEventListener("click", () => {
    if (!userLocation) { alert("Ative a localização primeiro."); return; }

    markers.forEach(m => {
      if (m._data && typeof m._data.lat === "number") {
        m._distance = haversineDistance(userLocation.lat, userLocation.lng, m._data.lat, m._data.lng);
      } else m._distance = Infinity;
    });

    const sorted = markers.slice().sort((a,b) => (a._distance || Infinity) - (b._distance || Infinity));
    fitToMarkers(sorted.slice(0,5));
    renderListaLocais();
  });
}

/* ---------------------- MENU HAMBURGUER + ONBOARD ---------------------- */
function initHamburgerMenu() {
  const btn = $("menuBtn");
  const sidePanel = $("panel");
  const overlay = $("menuOverlay");
  if (!btn || !sidePanel || !overlay) return;

  function openMenu() { sidePanel.classList.add("open"); overlay.classList.remove("hidden"); }
  function closeMenu() { sidePanel.classList.remove("open"); overlay.classList.add("hidden"); }

  btn.addEventListener("click", () => sidePanel.classList.contains("open") ? closeMenu() : openMenu());
  overlay.addEventListener("click", closeMenu);

  // onboarding animation once
  try {
    const key = 'mapapoprua_menu_onboard_v2';
    if (!localStorage.getItem(key)) {
      setTimeout(() => { openMenu(); setTimeout(() => { closeMenu(); localStorage.setItem(key,'1'); }, 820); }, 520);
    }
  } catch(e){}

  // close side when clicking a list item (delegation)
  const listaBox = $("listaLocais");
  if (listaBox) {
    listaBox.addEventListener("click", (ev) => {
      const el = ev.target.closest(".lista-item");
      if (!el) return;
      closeMenu();
    });
  }
}

/* ---------------------- AJUDARES ---------------------- */
function fitToMarkers(list = markers) {
  if (!map || !list || list.length === 0) return;
  const bounds = new google.maps.LatLngBounds();
  list.forEach(m => bounds.extend(m.getPosition()));
  map.fitBounds(bounds);
}

function slug(s) { return (s||"").toLowerCase().replace(/\s+/g, "-"); }

function haversineDistance(lat1, lon1, lat2, lon2) {
  const R = 6371;
  const dLat = (lat2 - lat1) * Math.PI / 180;
  const dLon = (lon2 - lon1) * Math.PI / 180;
  const a = Math.sin(dLat/2)**2 + Math.cos(lat1*Math.PI/180) * Math.cos(lat2*Math.PI/180) * Math.sin(dLon/2)**2;
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
}

/* ---------------------- UTIL ---------------------- */
function escapeHtml(unsafe) {
  if (unsafe === undefined || unsafe === null) return "";
  return String(unsafe).replace(/&/g,"&amp;").replace(/</g,"&lt;").replace(/>/g,"&gt;").replace(/"/g,"&quot;").replace(/'/g,"&#039;");
}

/* rebuild cluster helper */
function rebuildCluster() {
  const visible = markers.filter(m => m.getVisible ? m.getVisible() : true);
  if (markerCluster) { markerCluster.clearMarkers(); markerCluster.addMarkers(visible); }
  else markerCluster = new markerClusterer.MarkerClusterer({ map, markers: visible });
}

/* ---------------------- EXPORTS ---------------------- */
window.mapapoprua = { openDetailsPanel, setPanelState, fitToMarkers };

/* ---------------------- STARTUP / SETUPS ---------------------- */
document.addEventListener('DOMContentLoaded', () => {
  // ensure extra blocks hidden
  const extra = detailsExtraBlockEl();
  if (extra) { extra.classList.add("hidden"); extra.style.display = "none"; }

  // initial sheet closed
  setPanelState('closed');

  // If map script already loaded, Google will call initMap() via callback.
  // For local dev without the API, developer can call initMap() manually.
});
