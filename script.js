/* ============================================================
   script.js - Versão final com menu hambúrguer mobile
   Inclui:
   - Filtros, busca, busca por bairro
   - Lista lateral (ordenável por distância)
   - Geolocalização + "Locais próximos"
   - Painel inferior (detalhes) - desliza do rodapé (modo B)
   - Foto por local (RAW GitHub)
   - "Ver rotas" (abre Google Maps)
   - "Mais detalhes" com cache local (localStorage)
   - Destaque e animação dos pins
   - Restauração de mapa (Modo C)
   - Menu hambúrguer responsivo (slide-in)
   - Proteções se elementos estiverem ausentes
   ============================================================ */

/* ---------------------------
   Configs: ajuste conforme necessário
---------------------------- */
const PHOTO_BASE_URL = "https://raw.githubusercontent.com/celbff/mapapoprua/main/fotos/";
const PHOTO_DEFAULT = PHOTO_BASE_URL + "default.jpg";

/* ---------------------------
   Dados (edite conforme necessário)
---------------------------- */
const pontos = [
  {
    name: "Centro Pop",
    category: "Serviços Públicos de Referência",
    address: "Endereço exemplo, Centro",
    details: "Atendimento social, busca ativa e encaminhamentos.",
    phone: "(16) 0000-0000",
    hours: "Seg-Sex 08:00-17:00",
    photo: "centro-pop.jpg",
    lat: -21.7895843,
    lng: -48.1775678
  },
  {
    name: 'Casa de acolhida "Assad-Kan"',
    category: "Serviços Públicos de Referência",
    address: "Rua Exemplo, 123",
    details: "Acolhimento noturno e apoio.",
    phone: "",
    hours: "",
    photo: "assad-kan.jpg",
    lat: -21.7905161,
    lng: -48.1917449
  },
  {
    name: "CRAS Central",
    category: "Serviços Públicos de Referência",
    address: "Rua Gonçalves Dias, 468 - Centro",
    details: "Centro de Referência da Assistência Social - Unidade Central",
    phone: "",
    hours: "",
    photo: "cras-central.jpg",
    lat: -21.791522,
    lng: -48.173929
  },
  {
    name: "Associação São Pio (masculino)",
    category: "Pontos de Apoio e Parcerias",
    address: "",
    details: "Apoio social e reinserção",
    phone: "",
    hours: "",
    photo: "sao-pio-masc.jpg",
    lat: -21.824304,
    lng: -48.2037705
  },
  {
    name: "Associação São Pio (feminina)",
    category: "Pontos de Apoio e Parcerias",
    address: "",
    details: "Apoio social e reinserção",
    phone: "",
    hours: "",
    photo: "sao-pio-fem.jpg",
    lat: -21.7665622,
    lng: -48.1782641
  },
  {
    name: "Fundo Social de Solidariedade de Araraquara",
    category: "Pontos de doação",
    address: "",
    details: "Recebe doações e organiza distribuição",
    phone: "",
    hours: "",
    photo: "fundo-social.jpg",
    lat: -21.7788367,
    lng: -48.1921867
  }
];

/* ---------------------------
   Categorias / Cores
---------------------------- */
const categoryConfig = {
  "Serviços Públicos de Referência": { color: "#2b7cff" },
  "Pontos de Apoio e Parcerias": { color: "#28a745" },
  "Pontos de doação": { color: "#ff8c42" }
};

/* ---------------------------
   Estado global
---------------------------- */
let map;
let markers = [];
let markerCluster = null;
let userMarker = null;
let userLocation = null;
let selectedMarker = null;
let previousMapView = null; // salva center e zoom antes de abrir detalhes

/* ---------------------------
   Utility: cria SVG dataURL para ícone
---------------------------- */
function makeSvgPin(color, size = 36) {
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="${size}" height="${size}" viewBox="0 0 24 24">
    <path d="M12 2C8 2 5 5 5 9c0 6.2 7 13 7 13s7-6.8 7-13c0-4-3-7-7-7z" fill="${color}" stroke="#fff" stroke-width="1.5"/>
    <circle cx="12" cy="9" r="2.5" fill="#fff"/>
  </svg>`;
  return "data:image/svg+xml;charset=UTF-8," + encodeURIComponent(svg);
}

/* ---------------------------
   Inicializa o mapa (callback do Maps)
---------------------------- */
function initMap() {
  map = new google.maps.Map(document.getElementById("map"), {
    center: { lat: -21.79, lng: -48.185 },
    zoom: 13,
    streetViewControl: false,
    mapTypeControl: false,
    fullscreenControl: true,
    gestureHandling: "greedy"
  });

  createMarkers();
  fitToMarkers();

  initFilters();
  initSearch();
  initBairroSearch();
  initListaLocais();
  initGeoBtn();
  initNearbyBtn();
  initDetailsPanel();
  initPanelToggle(); // desktop fallback
  initMobileMenu(); // mobile hamburger
}

/* ---------------------------
   Cria marcadores e cluster
---------------------------- */
function createMarkers() {
  // limpar markers antigos
  markers.forEach(m => m.setMap(null));
  markers = [];

  for (const p of pontos) {
    const cfg = categoryConfig[p.category] || { color: "#666" };
    const iconUrl = makeSvgPin(cfg.color);

    const marker = new google.maps.Marker({
      position: { lat: p.lat, lng: p.lng },
      map,
      title: p.name,
      icon: { url: iconUrl, scaledSize: new google.maps.Size(36, 36) },
      optimized: true
    });

    marker._data = p;
    marker._category = p.category;

    marker.addListener("click", () => {
      openDetailsForMarker(marker);
      openBottomDetails(marker);
    });

    markers.push(marker);
  }

  if (markerCluster) markerCluster.clearMarkers();
  markerCluster = new markerClusterer.MarkerClusterer({ map, markers });
}

/* ---------------------------
   Abre pequeno InfoWindow (opcional) e destaca
---------------------------- */
function openDetailsForMarker(marker) {
  // InfoWindow simples (não obrigatório)
  const p = marker._data;
  const content = `
    <div style="font-family:Arial,Helvetica,sans-serif;min-width:200px">
      <strong>${escapeHtml(p.name)}</strong><br/>
      ${p.address ? `<div>${escapeHtml(p.address)}</div>` : ""}
      <div style="margin-top:6px"><a href="https://www.google.com/maps/dir/?api=1&destination=${p.lat},${p.lng}" target="_blank">Traçar rota</a></div>
    </div>
  `;
  const iw = new google.maps.InfoWindow({ content });
  iw.open(map, marker);

  highlightMarker(marker);
}

/* ---------------------------
   Highlight + animação de marker
---------------------------- */
function highlightMarker(marker) {
  // salvar previous icon state? aqui simplificamos resetando todos
  markers.forEach(m => {
    const cfg = categoryConfig[m._category] || { color: "#666" };
    m.setIcon({ url: makeSvgPin(cfg.color, 36), scaledSize: new google.maps.Size(36,36) });
    m.setOpacity(1);
    m.setAnimation(null);
  });

  // destacar atual
  const cfg = categoryConfig[marker._category] || { color: "#666" };
  marker.setIcon({ url: makeSvgPin(cfg.color, 48), scaledSize: new google.maps.Size(48,48) });
  marker.setAnimation(google.maps.Animation.BOUNCE);
  setTimeout(() => marker.setAnimation(null), 800);

  // reduzir opacidade dos demais
  markers.forEach(m => { if (m !== marker) m.setOpacity(0.25); });

  selectedMarker = marker;
}

/* ---------------------------
   Fit bounds para marcadores visíveis
---------------------------- */
function fitToMarkers() {
  const visible = markers.filter(m => m.getVisible());
  if (!visible.length) return;
  const bounds = new google.maps.LatLngBounds();
  visible.forEach(m => bounds.extend(m.getPosition()));
  map.fitBounds(bounds);
}

/* ---------------------------
   INIT FILTROS (checkboxes)
---------------------------- */
function initFilters() {
  const box = document.getElementById("filters");
  if (!box) return;

  box.innerHTML = "";
  const catsPresent = {};
  pontos.forEach(p => catsPresent[p.category] = true);

  Object.keys(categoryConfig).forEach(cat => {
    if (!catsPresent[cat]) return;
    const id = "chk-" + slug(cat);
    const div = document.createElement("div");
    div.className = "filter-item";
    div.innerHTML = `
      <input type="checkbox" id="${id}" data-cat="${escapeHtml(cat)}" checked />
      <label for="${id}"><span class="dot" style="background:${categoryConfig[cat].color};width:12px;height:12px;border-radius:50%;display:inline-block;margin-right:8px"></span>${cat}</label>
    `;
    box.appendChild(div);
    const chk = div.querySelector("input");
    chk.addEventListener("change", onFilterChange);
  });
}

function onFilterChange() {
  const active = [...document.querySelectorAll("#filters input:checked")].map(i => i.dataset.cat);
  markers.forEach(m => m.setVisible(active.includes(m._category)));
  if (markerCluster) {
    markerCluster.clearMarkers();
    markerCluster.addMarkers(markers.filter(m => m.getVisible()));
  }
  renderListaLocais();
}

/* ---------------------------
   BUSCA GLOBAL (nome / endereço)
---------------------------- */
function initSearch() {
  const box = document.getElementById("searchBox");
  const clearBtn = document.getElementById("btnClearSearch");
  if (!box) return;

  box.addEventListener("input", () => {
    const q = box.value.trim().toLowerCase();
    markers.forEach(m => {
      const d = m._data;
      const hay = `${d.name} ${d.address} ${d.details}`.toLowerCase();
      m.setVisible(!q || hay.includes(q));
    });
    if (markerCluster) {
      markerCluster.clearMarkers();
      markerCluster.addMarkers(markers.filter(m => m.getVisible()));
    }
    renderListaLocais();
  });

  if (clearBtn) clearBtn.addEventListener("click", () => {
    box.value = "";
    box.dispatchEvent(new Event("input"));
  });
}

/* ---------------------------
   LUPA POR BAIRRO / ENDEREÇO
---------------------------- */
function initBairroSearch() {
  const box = document.getElementById("bairroBox");
  if (!box) return;
  box.addEventListener("input", () => {
    const q = box.value.trim().toLowerCase();
    if (!q) {
      onFilterChange();
      fitToMarkers();
      return;
    }
    markers.forEach(m => {
      const hay = `${m._data.address || ""} ${m._data.details || ""}`.toLowerCase();
      m.setVisible(hay.includes(q));
    });
    if (markerCluster) {
      markerCluster.clearMarkers();
      markerCluster.addMarkers(markers.filter(m => m.getVisible()));
    }
    renderListaLocais();
    fitToMarkers();
  });
}

/* ---------------------------
   LISTA LATERAL (render)
---------------------------- */
function initListaLocais() { renderListaLocais(); }

function renderListaLocais() {
  const box = document.getElementById("listaLocais");
  if (!box) return;
  box.innerHTML = "";

  const activeChecks = [...document.querySelectorAll("#filters input:checked")].map(i => i.dataset.cat);
  let visiblePoints = markers.filter(m => m.getVisible() && activeChecks.includes(m._category)).map(m => ({ marker: m, data: m._data }));

  if (userLocation) {
    visiblePoints.forEach(v => {
      v.distance = haversine(userLocation.lat, userLocation.lng, v.data.lat, v.data.lng);
    });
    visiblePoints.sort((a,b) => (a.distance || 9999) - (b.distance || 9999));
  } else {
    visiblePoints.sort((a,b) => {
      if (a.data.category === b.data.category) return a.data.name.localeCompare(b.data.name);
      return a.data.category.localeCompare(b.data.category);
    });
  }

  visiblePoints.forEach(v => {
    const div = document.createElement("div");
    div.className = "place-item";
    div.innerHTML = `<span>${escapeHtml(v.data.name)}</span><span class="place-distance">${userLocation && v.distance ? v.distance.toFixed(1) + " km" : v.data.category}</span>`;
    div.addEventListener("click", () => {
      // abrir detalhes sem filtrar a lista
      map.panTo({ lat: v.data.lat, lng: v.data.lng });
      map.setZoom(16);
      highlightMarker(v.marker);
      openBottomDetails(v.marker);
    });
    box.appendChild(div);
  });
}

/* ---------------------------
   GEOLOCALIZAÇÃO (botão "Minha localização")
---------------------------- */
function initGeoBtn() {
  const btn = document.getElementById("geoBtn");
  if (!btn) return;
  btn.addEventListener("click", () => {
    if (!navigator.geolocation) return alert("Geolocalização não suportada neste navegador.");
    btn.textContent = "📍 buscando...";
    navigator.geolocation.getCurrentPosition(pos => {
      btn.textContent = "📍 Minha localização";
      userLocation = { lat: pos.coords.latitude, lng: pos.coords.longitude };

      if (!userMarker) {
        userMarker = new google.maps.Marker({
          position: userLocation,
          map,
          title: "Você está aqui",
          icon: {
            path: google.maps.SymbolPath.CIRCLE,
            scale: 8,
            fillColor: "#0b5ed7",
            fillOpacity: 1,
            strokeColor: "#fff",
            strokeWeight: 2
          }
        });
      } else {
        userMarker.setPosition(userLocation);
      }

      renderListaLocais();
      // ajustar bounds incluindo usuário
      const visible = markers.filter(m => m.getVisible());
      const bounds = new google.maps.LatLngBounds();
      visible.forEach(m => bounds.extend(m.getPosition()));
      bounds.extend(new google.maps.LatLng(userLocation.lat, userLocation.lng));
      map.fitBounds(bounds);
    }, err => {
      btn.textContent = "📍 Minha localização";
      alert("Não foi possível obter sua localização: " + err.message);
    }, { enableHighAccuracy: true, timeout: 8000 });
  });
}

/* ---------------------------
   BOTÃO "LOCais PRÓXIMOS"
---------------------------- */
function initNearbyBtn() {
  const btn = document.getElementById("nearbyBtn");
  if (!btn) return;
  btn.addEventListener("click", () => {
    if (!userLocation) {
      alert("Por favor, ative sua localização primeiro.");
      return;
    }
    // ordenar markers por distância e abrir os 5 mais próximos (exemplo)
    const list = markers.slice().filter(m => m.getVisible());
    list.forEach(m => m._dist = haversine(userLocation.lat, userLocation.lng, m._data.lat, m._data.lng));
    list.sort((a,b) => a._dist - b._dist);
    // destacar e abrir o primeiro
    if (list.length) {
      highlightMarker(list[0]);
      openBottomDetails(list[0]);
      // opcional: mostrar os 5 primeiros na lista lateral
      renderListaLocais(); // já ordena por distância quando userLocation existe
    }
  });
}

/* ---------------------------
   BOTTOM DETAILS PANEL (modo B - rodapé)
---------------------------- */
function openBottomDetails(marker) {
  if (!marker) return;
  const data = marker._data;

  // salva posição atual pra restaurar depois
  previousMapView = { center: map.getCenter(), zoom: map.getZoom() };

  // preencher painel
  const set = (id, value) => {
    const el = document.getElementById(id);
    if (!el) return;
    el.textContent = value || "";
  };

  set("detailsName", data.name);
  set("detailsCategory", data.category);
  set("detailsAddress", data.address);
  set("detailsDetails", data.details);
  set("detailsPhone", data.phone ? "Telefone: " + data.phone : "");
  set("detailsHours", data.hours ? "Horário: " + data.hours : "");

  const photoEl = document.getElementById("detailsPhoto");
  if (photoEl) {
    if (data.photo) {
      photoEl.src = PHOTO_BASE_URL + data.photo;
      photoEl.style.display = "block";
    } else {
      photoEl.src = PHOTO_DEFAULT;
      photoEl.style.display = "block";
    }
  }

  // distância
  const distEl = document.getElementById("detailsDistance");
  if (distEl) {
    if (userLocation) {
      const d = haversine(userLocation.lat, userLocation.lng, data.lat, data.lng);
      distEl.textContent = "Distância: " + d.toFixed(1) + " km";
    } else {
      distEl.textContent = "";
    }
  }

  // botão rotas
  const routeBtn = document.getElementById("routeBtn");
  if (routeBtn) {
    routeBtn.onclick = () => {
      // se houver localização do usuário, abrir rota; senão abrir destino no Maps
      let url;
      if (userLocation) {
        url = `https://www.google.com/maps/dir/?api=1&origin=${userLocation.lat},${userLocation.lng}&destination=${data.lat},${data.lng}&travelmode=walking`;
      } else {
        url = `https://www.google.com/maps/dir/?api=1&destination=${data.lat},${data.lng}&travelmode=walking`;
      }
      window.open(url, "_blank");
    };
  }

  // botão "mais detalhes" com cache local
  const moreBtn = document.getElementById("detailsMoreBtn");
  if (moreBtn) {
    const cacheKey = "detalhes_" + slug(data.name);
    const cached = localStorage.getItem(cacheKey);
    if (cached) {
      moreBtn.textContent = "Detalhes salvos (offline)";
      moreBtn.onclick = () => {
        alert(cached);
      };
    } else {
      moreBtn.textContent = "Carregar mais detalhes";
      moreBtn.onclick = () => {
        // gerar texto offline simples (fallback)
        const texto = generateOfflineSummary(data);
        localStorage.setItem(cacheKey, texto);
        alert(texto);
        moreBtn.textContent = "Detalhes salvos (offline)";
      };
    }
  }

  // abrir painel inferior
  const panel = document.getElementById("detailsPanel");
  if (panel) panel.classList.add("open");

  // centraliza no marcador
  if (marker.getPosition) {
    map.panTo(marker.getPosition());
    map.setZoom(16);
  }
}

/* Fechar painel e restaurar mapa (Modo C) */
function initDetailsPanel() {
  const close = document.getElementById("closeDetails");
  if (!close) return;
  close.addEventListener("click", () => {
    const panel = document.getElementById("detailsPanel");
    if (panel) panel.classList.remove("open");

    // Restaurar posição anterior (Modo C)
    if (userLocation) {
      map.panTo(userLocation);
      map.setZoom(15);
    } else if (previousMapView) {
      map.panTo(previousMapView.center);
      map.setZoom(previousMapView.zoom);
    }

    // reset icons
    markers.forEach(m => {
      const cfg = categoryConfig[m._category] || { color: "#666" };
      m.setIcon({ url: makeSvgPin(cfg.color, 36), scaledSize: new google.maps.Size(36, 36) });
      m.setOpacity(1);
      m.setAnimation(null);
    });
    selectedMarker = null;
  });
}

/* ---------------------------
   Gera resumo offline simples
---------------------------- */
function generateOfflineSummary(data) {
  let txt = `${data.name}. `;
  if (data.details) txt += data.details + ". ";
  txt += `Categoria: ${data.category}. `;
  if (data.address) txt += `Endereço: ${data.address}. `;
  if (data.phone) txt += `Contato: ${data.phone}. `;
  if (!data.details && !data.address) {
    txt += "Este local faz parte da rede de apoio e oferece serviços de assistência social.";
  }
  return txt.trim();
}

/* ---------------------------
   Mobile menu (hamburger) - slide panel
---------------------------- */
function initMobileMenu() {
  const btn = document.getElementById("menuBtn"); // botão hamburguer
  const panel = document.getElementById("panel");
  const overlay = document.getElementById("menuOverlay");

  // fallback: support old togglePanel
  const fallbackBtn = document.getElementById("togglePanel");

  if (btn && panel && overlay) {
    btn.addEventListener("click", () => {
      panel.classList.add("open");
      overlay.classList.remove("hidden");
    });

    overlay.addEventListener("click", () => {
      panel.classList.remove("open");
      overlay.classList.add("hidden");
    });
  } else if (fallbackBtn && panel) {
    // keep existing behavior for desktop or older HTML
    fallbackBtn.addEventListener("click", () => {
      const isHidden = panel.style.display === "none" || panel.classList.contains("hidden");
      if (isHidden) {
        panel.style.display = "block";
        fallbackBtn.textContent = "Filtros ▾";
      } else {
        panel.style.display = "none";
        fallbackBtn.textContent = "Filtros ▸";
      }
    });
  }
}

/* ---------------------------
   Panel toggle for desktop (kept for compatibility)
---------------------------- */
function initPanelToggle() {
  const btn = document.getElementById("togglePanel");
  const panel = document.getElementById("panel");
  if (!btn || !panel) return;

  btn.addEventListener("click", () => {
    const opened = panel.style.display !== "none" && !panel.classList.contains("hidden");
    if (opened) {
      panel.style.display = "none";
      btn.textContent = "Filtros ▸";
    } else {
      panel.style.display = "block";
      btn.textContent = "Filtros ▾";
    }
  });

  // initial state for small screens
  if (window.innerWidth < 900) {
    panel.style.display = "none";
    btn.textContent = "Filtros ▸";
  }
}

/* ---------------------------
   Utilitários
---------------------------- */
function slug(s) {
  return String(s || "").toLowerCase().replace(/\s+/g, "_").replace(/[^\w-]/g, "");
}

function escapeHtml(s) {
  if (!s) return "";
  return String(s).replace(/[&<>"']/g, m => ({ "&":"&amp;","<":"&lt;",">":"&gt;","\"":"&quot;","'":"&#39;" }[m]));
}

function haversine(lat1, lon1, lat2, lon2) {
  function toRad(v){ return v * Math.PI / 180; }
  const R = 6371;
  const dLat = toRad(lat2 - lat1);
  const dLon = toRad(lon2 - lon1);
  const a = Math.sin(dLat/2) * Math.sin(dLat/2) +
            Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) *
            Math.sin(dLon/2) * Math.sin(dLon/2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
  return R * c;
}

/* Alias used in some places */
const haversineDistance = haversine;

/* ---------------------------
   On load: expose initMap for Google API callback
---------------------------- */
/* Note: the Google Maps script should be loaded with &callback=initMap */
window.initMap = initMap;

/* End of script.js */
