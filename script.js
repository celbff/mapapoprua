/* ============================================================
   MAPA – Rede de Apoio – Araraquara/SP
   script.js — versão completa PWA + filtros + lista + detalhes
   ============================================================ */

/* ---------- DADOS (JSON) ---------- */
const pontos = [
  {
    name: "Centro Pop",
    category: "Serviços Públicos de Referência",
    address: "",
    details: "",
    phone: "",
    hours: "",
    photo: "https://raw.githubusercontent.com/celbff/mapapoprua/main/fotos/centro_pop.jpg",
    lat: -21.7895843,
    lng: -48.1775678
  },
  {
    name: 'Casa de acolhida "Assad-Kan"',
    category: "Serviços Públicos de Referência",
    address: "",
    details: "",
    phone: "",
    hours: "",
    photo: "https://raw.githubusercontent.com/celbff/mapapoprua/main/fotos/assad_kan.jpg",
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
    photo: "https://raw.githubusercontent.com/celbff/mapapoprua/main/fotos/cras_central.jpg",
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
    photo: "https://raw.githubusercontent.com/celbff/mapapoprua/main/fotos/sao_pio_masc.jpg",
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
    photo: "https://raw.githubusercontent.com/celbff/mapapoprua/main/fotos/sao_pio_fem.jpg",
    lat: -21.7665622,
    lng: -48.1782641
  },
  {
    name: "Fundo Social de Solidariedade de Araraquara",
    category: "Pontos de doação",
    address: "",
    details: "",
    phone: "",
    hours: "",
    photo: "https://raw.githubusercontent.com/celbff/mapapoprua/main/fotos/fundo_social.jpg",
    lat: -21.7788367,
    lng: -48.1921867
  }
];

/* ---------- Categorias e cores ---------- */
const categoryConfig = {
  "Serviços Públicos de Referência": { color: "#2b7cff" },
  "Pontos de Apoio e Parcerias": { color: "#28a745" },
  "Pontos de doação": { color: "#ff8c42" }
};

/* ---------- Estado global ---------- */
let map, infoWindow, markers = [], markerCluster;
let userMarker = null;
let userLocation = null;
let selectedMarker = null;
let mapLastPosition = null;

/* ---------- Gera ícone SVG ---------- */
function makeSvgPin(color, size = 36) {
  return (
    "data:image/svg+xml;charset=UTF-8," +
    encodeURIComponent(`
    <svg xmlns="http://www.w3.org/2000/svg" width="${size}" height="${size}" viewBox="0 0 24 24">
      <path d="M12 2C8 2 5 5 5 9c0 6.2 7 13 7 13s7-6.8 7-13c0-4-3-7-7-7z" fill="${color}" stroke="#fff" stroke-width="1.5"/>
      <circle cx="12" cy="9" r="3" fill="#fff"/>
    </svg>
  `)
  );
}

/* ============================================================
   Inicialização do Mapa
   ============================================================ */
function initMap() {
  map = new google.maps.Map(document.getElementById("map"), {
    center: { lat: -21.79, lng: -48.18 },
    zoom: 13,
    gestureHandling: "greedy",
    streetViewControl: false,
    mapTypeControl: false
  });

  infoWindow = new google.maps.InfoWindow();
  
  createMarkers();
  fitToMarkers();

  initFilters();
  initSearch();
  initListaLocais();
  initBairroSearch();
  initGeoBtn();
  initNearbyBtn();
  initPanelToggle();
  initDetailsPanel();
}
/* ---------------------------
   MENU HAMBURGUER / MOBILE
---------------------------- */
function initMobileMenu() {
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
}

/* Inicializar no final do initMap */

/* ============================================================
   Criação dos marcadores
   ============================================================ */
function createMarkers() {
  if (markerCluster) markerCluster.clearMarkers();
  markers.forEach(m => m.setMap(null));
  markers = [];

  pontos.forEach(p => {
    const iconUrl = makeSvgPin(categoryConfig[p.category].color);

    const marker = new google.maps.Marker({
      position: { lat: p.lat, lng: p.lng },
      title: p.name,
      icon: { url: iconUrl, scaledSize: new google.maps.Size(36, 36) },
      map
    });

    marker._data = p;
    marker._category = p.category;

    marker.addListener("click", () => openDetails(marker));
    markers.push(marker);
  });

  markerCluster = new markerClusterer.MarkerClusterer({ map, markers });
}

/* ============================================================
   Abrir painel de detalhes estilo Google Maps
   ============================================================ */
function openDetails(marker) {
  mapLastPosition = {
    center: map.getCenter(),
    zoom: map.getZoom()
  };

  selectedMarker = marker;

  animateMarker(marker);

  const p = marker._data;

  document.getElementById("detailsName").textContent = p.name;
  document.getElementById("detailsCategory").textContent = p.category;
  document.getElementById("detailsAddress").textContent = p.address || "";
  document.getElementById("detailsDetails").textContent = p.details || "";
  document.getElementById("detailsPhone").textContent = p.phone || "";
  document.getElementById("detailsHours").textContent = p.hours || "";

  document.getElementById("detailsPhoto").src =
    p.photo || "https://raw.githubusercontent.com/celbff/mapapoprua/main/fotos/default.jpg";

  // Exibir distância
  if (userLocation) {
    const dist = haversineDistance(
      userLocation.lat,
      userLocation.lng,
      p.lat,
      p.lng
    ).toFixed(1);

    document.getElementById("detailsDistance").textContent =
      "Distância: " + dist + " km";
  }

  // Botão de rotas
  document.getElementById("routeBtn").onclick = () => {
    const url = `https://www.google.com/maps/dir/?api=1&destination=${p.lat},${p.lng}&travelmode=walking`;
    window.open(url, "_blank");
  };

  // Mostrar painel
  document.getElementById("detailsPanel").classList.add("open");

  // Centrar no ponto
  map.panTo({ lat: p.lat, lng: p.lng });
  map.setZoom(16);
}

/* ============================================================
   Fechar painel e restaurar mapa
   ============================================================ */
function initDetailsPanel() {
  document.getElementById("closeDetails").addEventListener("click", () => {
    document.getElementById("detailsPanel").classList.remove("open");

    if (userLocation) {
      map.panTo(userLocation);
      map.setZoom(14);
    } else if (mapLastPosition) {
      map.panTo(mapLastPosition.center);
      map.setZoom(mapLastPosition.zoom);
    }

    markers.forEach(m => m.setIcon({
      url: makeSvgPin(categoryConfig[m._category].color),
      scaledSize: new google.maps.Size(36, 36)
    }));
  });
}

/* ============================================================
   Animação do PIN
   ============================================================ */
function animateMarker(marker) {
  markers.forEach(m => m.setOpacity(0.35));
  marker.setOpacity(1);

  marker.setAnimation(google.maps.Animation.BOUNCE);
  setTimeout(() => marker.setAnimation(null), 1000);

  marker.setIcon({
    url: makeSvgPin(categoryConfig[marker._category].color, 46),
    scaledSize: new google.maps.Size(46, 46)
  });
}

/* ============================================================
   Filtros
   ============================================================ */
function initFilters() {
  const filtersBox = document.getElementById("filters");
  filtersBox.innerHTML = "";

  Object.keys(categoryConfig).forEach(cat => {
    const id = "f-" + slug(cat);

    filtersBox.innerHTML += `
      <div class="filter-item">
        <input type="checkbox" id="${id}" data-cat="${cat}" checked>
        <label for="${id}">
          <span class="dot" style="background:${categoryConfig[cat].color}"></span>
          ${cat}
        </label>
      </div>
    `;
  });

  document.querySelectorAll("#filters input").forEach(chk => {
    chk.addEventListener("change", onFilterChange);
  });
}

function onFilterChange() {
  const activeCats = [...document.querySelectorAll("#filters input:checked")]
    .map(c => c.dataset.cat);

  markers.forEach(m => m.setVisible(activeCats.includes(m._category)));

  markerCluster.clearMarkers();
  markerCluster.addMarkers(markers.filter(m => m.getVisible()));

  renderListaLocais();
}

/* ============================================================
   Lista lateral
   ============================================================ */
function initListaLocais() {
  renderListaLocais();
}

function renderListaLocais() {
  const box = document.getElementById("listaLocais");
  box.innerHTML = "";

  const visibles = markers
    .filter(m => m.getVisible())
    .sort((a, b) => a._data.name.localeCompare(b._data.name));

  visibles.forEach(m => {
    const d = m._data;
    const div = document.createElement("div");
    div.className = "place-item";
    div.innerHTML = `
      <span>${d.name}</span>
      <span>${d.category}</span>
    `;
    div.addEventListener("click", () => openDetails(m));
    box.appendChild(div);
  });
}

/* ============================================================
   Buscar por texto
   ============================================================ */
function initSearch() {
  const box = document.getElementById("searchBox");
  const btn = document.getElementById("btnClearSearch");

  box.addEventListener("input", () => {
    const q = box.value.toLowerCase();

    markers.forEach(m => {
      const d = m._data;
      const text = `${d.name} ${d.address} ${d.details}`.toLowerCase();
      m.setVisible(text.includes(q));
    });

    markerCluster.clearMarkers();
    markerCluster.addMarkers(markers.filter(m => m.getVisible()));
    renderListaLocais();
  });

  btn.onclick = () => {
    box.value = "";
    box.dispatchEvent(new Event("input"));
  };
}

/* ============================================================
   Buscar por bairro
   ============================================================ */
function initBairroSearch() {
  const box = document.getElementById("bairroBox");

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

/* ============================================================
   Botão "Minha localização"
   ============================================================ */
function initGeoBtn() {
  document.getElementById("geoBtn").addEventListener("click", () => {
    if (!navigator.geolocation)
      return alert("Seu dispositivo não suporta geolocalização.");

    navigator.geolocation.getCurrentPosition(pos => {
      userLocation = {
        lat: pos.coords.latitude,
        lng: pos.coords.longitude
      };

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

      map.panTo(userLocation);
      map.setZoom(15);

      renderListaLocais();
    });
  });
}

/* ============================================================
   Botão "Locais próximos"
   ============================================================ */
function initNearbyBtn() {
  document.getElementById("nearbyBtn").addEventListener("click", () => {
    if (!userLocation) {
      alert("Ative primeiro sua localização.");
      return;
    }

    markers.sort((a, b) => {
      const distA = haversineDistance(
        userLocation.lat, userLocation.lng, a._data.lat, a._data.lng
      );
      const distB = haversineDistance(
        userLocation.lat, userLocation.lng, b._data.lat, b._data.lng
      );
      return distA - distB;
    });

    renderListaLocais();

    const nearest = markers[0];
    openDetails(nearest);
  });
}

/* ============================================================
   Mostrar / esconder painel (mobile)
   ============================================================ */
function initPanelToggle() {
  const btn = document.getElementById("togglePanel");
  const panel = document.getElementById("panel");

  btn.onclick = () => {
    panel.classList.toggle("hidden");
    btn.textContent = panel.classList.contains("hidden")
      ? "Filtros ▸"
      : "Filtros ▾";
  };
}

/* ============================================================
   Funções auxiliares
   ============================================================ */
function slug(s) {
  return s.toLowerCase().replace(/\s+/g, "-");
}

/* Distância Haversine (km) */
function haversineDistance(lat1, lon1, lat2, lon2) {
  const R = 6371;
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLon = ((lon2 - lon1) * Math.PI) / 180;

  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(lat1 * Math.PI / 180) *
    Math.cos(lat2 * Math.PI / 180) *
    Math.sin(dLon / 2) ** 2;

  return R * (2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a)));
}

/* Ajusta o mapa para exibir todos os marcadores visíveis */
function fitToMarkers() {
  const visibles = markers.filter(m => m.getVisible());
  if (!visibles.length) return;

  const bounds = new google.maps.LatLngBounds();
  visibles.forEach(m => bounds.extend(m.getPosition()));
  map.fitBounds(bounds);
}


