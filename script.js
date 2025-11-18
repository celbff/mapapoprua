/* ============================================================
   MAPA REDE DE APOIO — ARARAQUARA/SP
   script.js — versão completa FINAL com bottom-sheet arrastável
   (preserva todo o comportamento original e adiciona melhorias)
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
let map, infoWindow, markers = [], markerCluster;
let userLocation = null;
let userMarker = null;
let selectedMarker = null;
let previousMapCenter = null;
let previousMapZoom = null;

/* ---------------------- INICIALIZAÇÃO MAPA ---------------------- */
function initMap() {
  map = new google.maps.Map(document.getElementById("map"), {
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
}

/* ---------------------- CRIAR MARCADORES ---------------------- */
function createMarkers() {
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

  markerCluster = new markerClusterer.MarkerClusterer({ map, markers });
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
  const box = document.getElementById("filters");
  box.innerHTML = "";

  Object.keys(categoryConfig).forEach(cat => {
    const id = slug(cat);
    const color = categoryConfig[cat].color;

    box.innerHTML += `
      <label class="filter-item">
        <input type="checkbox" id="${id}" data-cat="${cat}" checked>
        <span class="dot" style="background:${color}"></span> ${cat}
      </label>
    `;
  });

document.querySelectorAll('.lista-item').forEach(item => {
  item.addEventListener('click', () => {
    document.querySelector('.panel').classList.remove('open');
    document.querySelector('.menu-overlay').classList.add('hidden');
  });
});

}

function applyFilters() {
  const active = [...document.querySelectorAll("#filters input:checked")]
    .map(i => i.dataset.cat);

  markers.forEach(m => m.setVisible(active.includes(m._category)));

  markerCluster.clearMarkers();
  markerCluster.addMarkers(markers.filter(m => m.getVisible()));

  renderListaLocais();
}

/* ---------------------- BUSCA POR NOME ---------------------- */
function initSearch() {
  const box = document.getElementById("searchBox");
  const clearBtn = document.getElementById("btnClearSearch");

  if (!box) return;

  box.addEventListener("input", () => {
    const q = box.value.toLowerCase();

    markers.forEach(m => {
      const d = m._data;
      const hay = (d.name + " " + d.address + " " + d.details).toLowerCase();
      m.setVisible(hay.includes(q));
    });

    markerCluster.clearMarkers();
    markerCluster.addMarkers(markers.filter(m => m.getVisible()));
    renderListaLocais();
  });

  clearBtn.addEventListener("click", () => {
    box.value = "";
    box.dispatchEvent(new Event("input"));
  });
}

/* ---------------------- BUSCA POR BAIRRO ---------------------- */
function initBairroSearch() {
  const box = document.getElementById("bairroBox");
  if (!box) return;
  box.addEventListener("input", () => {
    const q = box.value.toLowerCase();
    markers.forEach(m => {
      const hay = (m._data.address || "").toLowerCase();
      m.setVisible(hay.includes(q));
    });
    markerCluster.clearMarkers();
    markerCluster.addMarkers(markers.filter(m => m.getVisible()));
    renderListaLocais();
  });
}

/* ---------------------- LISTA DE LOCAIS ---------------------- */
function initListaLocais() {
  renderListaLocais();
}

function renderListaLocais() {
  const box = document.getElementById("listaLocais");
  box.innerHTML = "";

  let vis = markers.filter(m => m.getVisible());

  if (userLocation) {
    vis.forEach(m => {
      m._distance = haversineDistance(
        userLocation.lat, userLocation.lng,
        m._data.lat, m._data.lng
      );
    });
    vis.sort((a, b) => a._distance - b._distance);
  }

  vis.forEach(m => {
    const d = m._data;
    const dist = userLocation ? ` — ${m._distance.toFixed(1)} km` : "";

    const item = document.createElement("div");
    item.className = "lista-item";
    item.innerHTML = `<strong>${d.name}</strong><br><span>${d.category}${dist}</span>`;

    item.addEventListener("click", () => {
      map.panTo({ lat: d.lat, lng: d.lng });
      map.setZoom(16);
      openDetailsPanel(m);
    });

    box.appendChild(item);
  });
}

/* ---------------------- DETALHES ---------------------- */

/* Estados do painel: 'closed', 'compact', 'mid', 'expanded' */
const detailsPanelEl = document.getElementById ? document.getElementById("detailsPanel") : null;
const sheetHandle = document.getElementById ? document.getElementById("sheetHandle") : null;
const detailsExtraBlock = document.getElementById ? document.getElementById("detailsExtraBlock") : null;

function setPanelState(state) {
  if (!detailsPanelEl) return;
  detailsPanelEl.classList.remove("state-closed", "state-compact", "state-mid", "state-expanded");
  switch (state) {
    case 'closed':
      detailsPanelEl.classList.add("state-closed");
      detailsPanelEl.classList.add("hidden");
      detailsPanelEl.setAttribute("aria-hidden", "true");
      break;
    case 'compact':
      detailsPanelEl.classList.remove("hidden");
      detailsPanelEl.classList.add("state-compact");
      detailsPanelEl.setAttribute("aria-hidden", "false");
      break;
    case 'mid':
      detailsPanelEl.classList.remove("hidden");
      detailsPanelEl.classList.add("state-mid");
      detailsPanelEl.setAttribute("aria-hidden", "false");
      break;
    case 'expanded':
      detailsPanelEl.classList.remove("hidden");
      detailsPanelEl.classList.add("state-expanded");
      detailsPanelEl.setAttribute("aria-hidden", "false");
      break;
    default:
      detailsPanelEl.classList.add("state-compact");
      detailsPanelEl.setAttribute("aria-hidden", "false");
  }
}

/* Abre o painel e popula com dados do marker */
function openDetailsPanel(marker) {
  selectedMarker = marker;

  previousMapCenter = map.getCenter();
  previousMapZoom = map.getZoom();

  const p = marker._data;

  // Destacar marcador
  highlightMarker(marker);

  document.getElementById("detailsName").textContent = p.name;
  document.getElementById("detailsCategory").textContent = p.category;
  document.getElementById("detailsAddress").textContent = p.address || "";
  document.getElementById("detailsDetails").textContent = p.details || "";
  document.getElementById("detailsPhone").textContent = p.phone || "";
  document.getElementById("detailsHours").textContent = p.hours || "";

  // Foto
  fetch(p.photo)
    .then(res => {
      document.getElementById("detailsPhoto").src = res.ok ? p.photo : "placeholder.jpg";
    })
    .catch(() => {
      document.getElementById("detailsPhoto").src = "placeholder.jpg";
    });

  // Distância
  if (userLocation) {
    const dist = haversineDistance(
      userLocation.lat, userLocation.lng,
      p.lat, p.lng
    );
    document.getElementById("detailsDistance").textContent =
      `Distância: ${dist.toFixed(1)} km`;
  } else {
    document.getElementById("detailsDistance").textContent = "";
  }

  // Rotas
  document.getElementById("routeBtn").onclick = () => {
    window.open(`https://www.google.com/maps/dir/?api=1&destination=${p.lat},${p.lng}`, "_blank");
  };

  // Mostrar painel: iniciar em estado mid (intermediário)
  setPanelState('mid');
}

/* Fechar painel */
function initDetailsPanel() {
  const closeBtn = document.getElementById("closeDetails");
  if (closeBtn) {
    closeBtn.addEventListener("click", () => {
      setPanelState('closed');

      // restaura marcadores
      markers.forEach(m => m.setOpacity(1));

      // Restaurar mapa
      if (previousMapCenter) {
        map.panTo(previousMapCenter);
        map.setZoom(previousMapZoom);
      }
    });
  }

  // Botão "Carregar mais detalhes" revela bloco extra (C)
  const moreBtn = document.getElementById("detailsMoreBtn");
  if (moreBtn && detailsExtraBlock) {
    moreBtn.addEventListener("click", () => {
      const block = document.getElementById("detailsExtraBlock");
      if (!block) return;
      if (block.classList.contains("hidden")) {
        block.classList.remove("hidden");
        block.style.display = "block";
        // smooth scroll para o bloco quando expandir
        setTimeout(() => {
          block.scrollIntoView({ behavior: "smooth", block: "center" });
        }, 120);
      } else {
        block.classList.add("hidden");
        block.style.display = "none";
      }
    });
  }

  // Inicializa drag/gesture do painel (versão A — touch/mouse pointer)
  initPanelDrag();
}

/* =======================
   Drag do painel de detalhes (touch + mouse)
   3 níveis: compact (pequeno), mid (médio), expanded (grande)
   Com thresholds e física simples.
   ======================= */
function initPanelDrag() {
  const panel = document.getElementById("detailsPanel");
  const handle = document.getElementById("sheetHandle");
  if (!panel || !handle) return;

  let startY = 0;
  let currentY = 0;
  let dragging = false;
  let startHeight = 0;

  // calcula altura baseada na janela para decidir snap
  function decideStateFromTranslate(translate) {
    // translate: negative quando arrasta pra cima
    // vamos usar porcentagens relativas à altura da viewport
    const vh = window.innerHeight;
    // converter translate em nova altura aproximada
    const panelRect = panel.getBoundingClientRect();
    // quando arrastando para cima, queremos maior altura (expanded)
    const heightPx = panelRect.height - translate; // translate negativo => maior
    const ratio = heightPx / vh;
    if (ratio >= 0.75) return 'expanded';
    if (ratio >= 0.3) return 'mid';
    return 'compact';
  }

  function onStart(e) {
    dragging = true;
    startY = (e.touches ? e.touches[0].clientY : e.clientY);
    currentY = startY;
    startHeight = panel.getBoundingClientRect().height;
    panel.style.transition = 'none';
    handle.setPointerCapture && handle.setPointerCapture(e.pointerId);
  }

  function onMove(e) {
    if (!dragging) return;
    currentY = (e.touches ? e.touches[0].clientY : e.clientY);
    const dy = currentY - startY;
    // Queremos mover visualmente o painel: limitar movimento
    // Ao arrastar pra cima, dy < 0 -> aumentar altura
    // Ao arrastar pra baixo, dy > 0 -> reduzir altura
    const newHeight = Math.max(100, startHeight - dy); // mínimo 100px
    panel.style.height = newHeight + 'px';
  }

  function onEnd(e) {
    if (!dragging) return;
    dragging = false;
    panel.style.transition = ''; // volta transição
    // decidir snap
    const dyTotal = currentY - startY;
    const snap = decideStateFromTranslate(dyTotal);
    setPanelState(snap);

    // se o painel estiver aberto em mid/expanded, bloquear o scroll do body
    if (snap === 'expanded' || snap === 'mid') {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
  }

  // touch events
  handle.addEventListener('touchstart', onStart, {passive:true});
  handle.addEventListener('touchmove', onMove, {passive:false});
  handle.addEventListener('touchend', onEnd);

  // mouse events
  handle.addEventListener('mousedown', onStart);
  window.addEventListener('mousemove', onMove);
  window.addEventListener('mouseup', onEnd);

  // clique rápido alterna entre compacto -> mid -> expanded (facilidade)
  handle.addEventListener('click', (ev) => {
    // se foi um clique sem arraste
    if (Math.abs(currentY - startY) > 8) return;
    // alterna
    const isClosed = panel.classList.contains('hidden') || panel.classList.contains('state-closed');
    if (isClosed) {
      setPanelState('compact');
      return;
    }
    if (panel.classList.contains('state-compact')) setPanelState('mid');
    else if (panel.classList.contains('state-mid')) setPanelState('expanded');
    else setPanelState('compact');
  });
}

/* Fechar/restaurar comportamento ao fechar (reset de overflow) */
function closePanelCleanup() {
  document.body.style.overflow = '';
}

/* ---------------------- HIGHLIGHT ---------------------- */
function highlightMarker(marker) {
  markers.forEach(m => {
    if (m === marker) {
      m.setOpacity(1);
      m.setAnimation(google.maps.Animation.BOUNCE);
      setTimeout(() => m.setAnimation(null), 800);
    } else {
      m.setOpacity(0.25);
    }
  });
}

/* ---------------------- GEOLOCALIZAÇÃO ---------------------- */
function initGeoBtn() {
  const geoBtn = document.getElementById("geoBtn");
  if (!geoBtn) return;
  geoBtn.addEventListener("click", () => {
    navigator.geolocation.getCurrentPosition(pos => {
      userLocation = {
        lat: pos.coords.latitude,
        lng: pos.coords.longitude
      };

      if (!userMarker) {
        userMarker = new google.maps.Marker({
          position: userLocation,
          map,
          icon: {
            path: google.maps.SymbolPath.CIRCLE,
            scale: 8,
            fillColor: "#0b5ed7",
            fillOpacity: 0.9,
            strokeColor: "#fff",
            strokeWeight: 2
          },
          title: "Você está aqui"
        });
      } else {
        userMarker.setPosition(userLocation);
      }

      map.panTo(userLocation);
      map.setZoom(15);

      renderListaLocais();
    }, err => {
      alert("Não foi possível acessar a localização: " + (err.message || ""));
    });
  });
}

/* ---------------------- LOCAIS PRÓXIMOS ---------------------- */
function initNearbyBtn() {
  const nearby = document.getElementById("nearbyBtn");
  if (!nearby) return;
  nearby.addEventListener("click", () => {
    if (!userLocation) {
      alert("Ative a localização primeiro.");
      return;
    }

    markers.forEach(m => {
      m._distance = haversineDistance(
        userLocation.lat, userLocation.lng,
        m._data.lat, m._data.lng
      );
    });

    markers.sort((a, b) => a._distance - b._distance);

    fitToMarkers(markers.slice(0, 5));

    renderListaLocais();
  });
}

/* ---------------------- MENU MOBILE SLIDE + ANIMAÇÃO ONBOARDING ---------------------- */
function initHamburgerMenu() {
  const btn = document.getElementById("menuBtn");
  const panel = document.getElementById("panel");
  const overlay = document.getElementById("menuOverlay");

  if (!btn || !panel || !overlay) return;

  btn.addEventListener("click", () => {
    panel.classList.add("open");
    overlay.classList.remove("hidden");
  });

  overlay.addEventListener("click", () => {
    panel.classList.remove("open");
    overlay.classList.add("hidden");
  });

  // Onboarding: animação sutil abrindo e fechando o painel uma vez
  try {
    const key = 'mapapoprua_menu_onboard_v2';
    if (!localStorage.getItem(key)) {
      setTimeout(() => {
        // abrir
        panel.classList.add("open");
        overlay.classList.remove("hidden");
        setTimeout(() => {
          // fechar
          panel.classList.remove("open");
          overlay.classList.add("hidden");
          localStorage.setItem(key, '1');
        }, 820);
      }, 520);
    }
  } catch (e) { /* se localStorage travar, ignora */ }
}

/* ---------------------- AJUDARES ---------------------- */
function fitToMarkers(list = markers) {
  if (!markers || markers.length === 0) return;
  const bounds = new google.maps.LatLngBounds();
  list.forEach(m => bounds.extend(m.getPosition()));
  map.fitBounds(bounds);
}

function slug(s) {
  return s.toLowerCase().replace(/\s+/g, "-");
}

function haversineDistance(lat1, lon1, lat2, lon2) {
  const R = 6371;
  const dLat = (lat2 - lat1) * Math.PI / 180;
  const dLon = (lon2 - lon1) * Math.PI / 180;
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(lat1 * Math.PI / 180) *
    Math.cos(lat2 * Math.PI / 180) *
    Math.sin(dLon / 2) ** 2;

  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

/* =======================
   Export helpers para console / outro script usar
   ======================= */
window.mapapoprua = {
  openDetailsPanel,
  setPanelState,
  fitToMarkers
};

/* =======================
   DOMContentLoaded: pequenos setups (inserir lista se vazia)
   ======================= */
document.addEventListener('DOMContentLoaded', () => {
  // Caso a lista esteja vazia no carregamento, renderiza itens de exemplo (igual antes)
  const listEl = document.getElementById("listaLocais");
  if (listEl && listEl.children.length === 0) {
    // reproduz a mesma lógica do initListaLocais
    // renderListaLocais será chamada no initMap após markers criados
  }

  // Garante que blocos extras iniciem escondidos
  const extra = document.getElementById("detailsExtraBlock");
  if (extra) {
    extra.classList.add("hidden");
    extra.style.display = "none";
  }

  // garante comportamento do painel fechado inicialmente
  setPanelState('closed');
});

