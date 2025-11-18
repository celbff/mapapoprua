/* ---------------------------
   CONFIGURAÇÃO DA FOTO
---------------------------- */
const PHOTO_BASE_URL = "https://raw.githubusercontent.com/celbff/mapapoprua/main/fotos/";

/* ---------------------------
   DADOS INICIAIS (com campo photo)
---------------------------- */
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
    photo: "centro-pop.jpg"
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
    photo: "assad-kan.jpg"
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
    photo: "cras-central.jpg"
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
    photo: "sao-pio-masc.jpg"
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
    photo: "sao-pio-fem.jpg"
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
    photo: "fundo-social.jpg"
  }
];

const categoryConfig = {
  "Serviços Públicos de Referência": { color: "#2b7cff" },
  "Pontos de Apoio e Parcerias": { color: "#28a745" },
  "Pontos de doação": { color: "#ff8c42" }
};

/* ---------------------------
   ESTADOS GLOBAIS
---------------------------- */
let map, markers = [], markerCluster;
let userLocation = null;
let userMarker = null;
let selectedMarker = null;
let previousView = null; // guarda posição/zoom antes de clicar

/* ---------------------------
   CRIA PIN SVG COLORIDO
---------------------------- */
function makeSvgPin(color, size = 36) {
  const svg =
    `<svg xmlns="http://www.w3.org/2000/svg" width="${size}" height="${size}" viewBox="0 0 24 24">
      <path d="M12 2C8 2 5 5 5 9c0 6.2 7 13 7 13s7-6.8 7-13c0-4-3-7-7-7z" fill="${color}" stroke="#fff" stroke-width="1.5"/>
      <circle cx="12" cy="9" r="2.5" fill="#fff"/>
    </svg>`;
  return "data:image/svg+xml;charset=UTF-8," + encodeURIComponent(svg);
}

/* ---------------------------
   INIT MAP
---------------------------- */
function initMap() {
  map = new google.maps.Map(document.getElementById("map"), {
    center: { lat: -21.79, lng: -48.185 },
    zoom: 13,
    mapTypeControl: false,
    fullscreenControl: true,
    streetViewControl: false,
    gestureHandling: "greedy"
  });

  createMarkers();
  initFilters();
  initListaLocais();
  initSearch();
  initBairroSearch();
  initGeoBtn();
  initDetailsPanel();
  initPanelToggle();

  fitToMarkers();
}

/* ---------------------------
   CRIA TODOS OS MARCADORES
---------------------------- */
function createMarkers() {
  markers.forEach(m => m.setMap(null));
  markers = [];

  pontos.forEach(p => {
    const iconUrl = makeSvgPin(categoryConfig[p.category].color);
    const marker = new google.maps.Marker({
      position: { lat: p.lat, lng: p.lng },
      map,
      icon: { url: iconUrl, scaledSize: new google.maps.Size(36, 36) },
      title: p.name,
      optimized: true
    });

    marker._data = p;
    marker._category = p.category;

    marker.addListener("click", () => openDetails(marker));

    markers.push(marker);
  });

  markerCluster = new markerClusterer.MarkerClusterer({ map, markers });
}

/* ---------------------------
   DESTACAR MARCADOR
---------------------------- */
function highlightMarker(marker) {
  markers.forEach(m => {
    if (m === marker) {
      const cfg = categoryConfig[m._category];
      m.setIcon({
        url: makeSvgPin(cfg.color, 48),
        scaledSize: new google.maps.Size(48, 48)
      });
      m.setOpacity(1);
    } else {
      m.setOpacity(0.25);
      const cfg = categoryConfig[m._category];
      m.setIcon({
        url: makeSvgPin(cfg.color, 36),
        scaledSize: new google.maps.Size(36, 36)
      });
    }
  });
}

/* ---------------------------
   ABRIR DETALHES
---------------------------- */
function openDetails(marker) {
  const p = marker._data;

  previousView = {
    center: map.getCenter(),
    zoom: map.getZoom()
  };

  map.panTo(marker.getPosition());
  map.setZoom(16);

  highlightMarker(marker);
  selectedMarker = marker;

  // Foto
  const photoUrl = p.photo ? PHOTO_BASE_URL + p.photo : "";
  const photoEl = document.getElementById("detailsPhoto");
  if (p.photo) {
    photoEl.src = photoUrl;
    photoEl.style.display = "block";
  } else {
    photoEl.style.display = "none";
  }

  document.getElementById("detailsName").textContent = p.name;
  document.getElementById("detailsCategory").textContent = p.category;
  document.getElementById("detailsAddress").textContent = p.address || "";
  document.getElementById("detailsDetails").textContent = p.details || "";
  document.getElementById("detailsPhone").textContent = p.phone || "";
  document.getElementById("detailsHours").textContent = p.hours || "";

  if (userLocation) {
    const dist = haversine(userLocation.lat, userLocation.lng, p.lat, p.lng);
    document.getElementById("detailsDistance").textContent =
      `Distância: ${dist.toFixed(1)} km`;
  } else {
    document.getElementById("detailsDistance").textContent = "";
  }

  loadExtraDetails(p);

  document.getElementById("detailsPanel").classList.add("open");
}

/* ---------------------------
   FECHAR DETALHES (MODO C)
---------------------------- */
function initDetailsPanel() {
  document.getElementById("closeDetails").addEventListener("click", () => {
    document.getElementById("detailsPanel").classList.remove("open");

    if (userLocation) {
      map.panTo(userLocation);
      map.setZoom(15);
    } else if (previousView) {
      map.panTo(previousView.center);
      map.setZoom(previousView.zoom);
    }

    markers.forEach(m => {
      const cfg = categoryConfig[m._category];
      m.setIcon({
        url: makeSvgPin(cfg.color, 36),
        scaledSize: new google.maps.Size(36, 36)
      });
      m.setOpacity(1);
    });
  });
}

/* ---------------------------
   EXTRA DETALHES (CACHE)
---------------------------- */
function loadExtraDetails(p) {
  const cacheKey = "detalhes_" + p.name.replace(/\s+/g, "_");
  const btn = document.getElementById("detailsMoreBtn");

  const cached = localStorage.getItem(cacheKey);
  if (cached) {
    btn.textContent = "Detalhes carregados (offline)";
    btn.onclick = () => alert(cached);
    return;
  }

  btn.textContent = "Carregar mais detalhes";

  btn.onclick = () => {
    const texto =
      `Informações adicionais sobre ${p.name}.\nEste é um resumo offline gerado automaticamente.`;
    localStorage.setItem(cacheKey, texto);
    alert(texto);
    btn.textContent = "Detalhes carregados (offline)";
  };
}

/* ---------------------------
   LISTA DE LOCAIS
---------------------------- */
function initListaLocais() { renderLista(); }

function renderLista() {
  const lista = document.getElementById("listaLocais");
  lista.innerHTML = "";

  let items = markers
    .filter(m => m.getVisible())
    .map(m => ({
      marker: m,
      data: m._data,
      distance: userLocation
        ? haversine(userLocation.lat, userLocation.lng, m._data.lat, m._data.lng)
        : null
    }));

  items.sort((a, b) => {
    if (userLocation) return a.distance - b.distance;
    if (a.data.category === b.data.category)
      return a.data.name.localeCompare(b.data.name);
    return a.data.category.localeCompare(b.data.category);
  });

  items.forEach(i => {
    const div = document.createElement("div");
    div.className = "place-item";

    div.innerHTML = `
      <span>${i.data.name}</span>
      <span class="place-distance">${
        i.distance ? i.distance.toFixed(1) + " km" : i.data.category
      }</span>
    `;

    div.onclick = () => openDetails(i.marker);
    lista.appendChild(div);
  });
}

/* ---------------------------
   FILTROS
---------------------------- */
function initFilters() {
  const box = document.getElementById("filters");
  box.innerHTML = "";

  Object.keys(categoryConfig).forEach(cat => {
    const id = "f_" + cat.replace(/\s+/g, "_");

    const div = document.createElement("div");
    div.className = "filter-item";

    div.innerHTML = `
      <input type="checkbox" id="${id}" data-cat="${cat}" checked />
      <label for="${id}">${cat}</label>
    `;

    div.querySelector("input").onchange = applyFilters;
    box.appendChild(div);
  });
}

function applyFilters() {
  const active = [...document.querySelectorAll("#filters input:checked")]
    .map(i => i.dataset.cat);

  markers.forEach(m => {
    m.setVisible(active.includes(m._category));
  });

  markerCluster.clearMarkers();
  markerCluster.addMarkers(markers.filter(m => m.getVisible()));

  renderLista();
}

/* ---------------------------
   BUSCA GLOBAL
---------------------------- */
function initSearch() {
  const box = document.getElementById("searchBox");
  const clear = document.getElementById("btnClearSearch");

  box.oninput = () => {
    const q = box.value.toLowerCase();

    markers.forEach(m => {
      const d = m._data;
      const txt = `${d.name} ${d.address} ${d.details}`.toLowerCase();
      m.setVisible(txt.includes(q));
    });

    markerCluster.clearMarkers();
    markerCluster.addMarkers(markers.filter(m => m.getVisible()));

    renderLista();
  };

  clear.onclick = () => {
    box.value = "";
    box.dispatchEvent(new Event("input"));
  };
}

/* ---------------------------
   BUSCA POR BAIRRO
---------------------------- */
function initBairroSearch() {
  const box = document.getElementById("bairroBox");
  box.oninput = () => {
    const q = box.value.toLowerCase();

    if (!q) return applyFilters();

    markers.forEach(m => {
      const txt = `${m._data.address} ${m._data.details}`.toLowerCase();
      m.setVisible(txt.includes(q));
    });

    markerCluster.clearMarkers();
    markerCluster.addMarkers(markers.filter(m => m.getVisible()));

    renderLista();
  };
}

/* ---------------------------
   BOTÃO GEOLOCALIZAÇÃO
---------------------------- */
function initGeoBtn() {
  const btn = document.getElementById("geoBtn");

  btn.onclick = () => {
    btn.textContent = "📍 buscando...";

    navigator.geolocation.getCurrentPosition(pos => {
      userLocation = {
        lat: pos.coords.latitude,
        lng: pos.coords.longitude
      };

      btn.textContent = "📍 Minha localização";

      if (!userMarker) {
        userMarker = new google.maps.Marker({
          map,
          position: userLocation,
          title: "Você está aqui",
          icon: {
            path: google.maps.SymbolPath.CIRCLE,
            scale: 10,
            fillColor: "#0b5ed7",
            fillOpacity: 1,
            strokeColor: "#fff",
            strokeWeight: 2
          }
        });
      } else {
        userMarker.setPosition(userLocation);
      }

      renderLista();

      map.panTo(userLocation);
      map.setZoom(15);
    });
  };
}

/* ---------------------------
   FIT
---------------------------- */
function fitToMarkers() {
  const bounds = new google.maps.LatLngBounds();
  markers.forEach(m => bounds.extend(m.getPosition()));
  map.fitBounds(bounds);
}

/* ---------------------------
   BOTTOM PANEL TOGGLE (MOBILE)
---------------------------- */
function initPanelToggle() {
  const btn = document.getElementById("togglePanel");
  const panel = document.getElementById("panel");

  btn.onclick = () => {
    const hidden = panel.style.display === "none";
    panel.style.display = hidden ? "block" : "none";
    btn.textContent = hidden ? "Filtros ▾" : "Filtros ▸";
  };

  if (window.innerWidth < 900) {
    panel.style.display = "none";
    btn.textContent = "Filtros ▸";
  }
}

/* ---------------------------
   FUNÇÕES ÚTEIS
---------------------------- */
function haversine(lat1, lon1, lat2, lon2) {
  function rad(v) { return v * Math.PI / 180; }
  const R = 6371;
  const dLat = rad(lat2-lat1);
  const dLon = rad(lon2-lon1);
  const a =
    Math.sin(dLat/2)**2 +
    Math.cos(rad(lat1)) *
    Math.cos(rad(lat2)) *
    Math.sin(dLon/2)**2;
  return R * (2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a)));
}
