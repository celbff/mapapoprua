/* ============================================================
   script.js — Rede de Apoio Araraquara
   Versão Final — Otimizada, Estável e Completa
   100% compatível com index.html, responsiva em retrato e paisagem
   Mantém todas as features profissionais.
   ============================================================ */

const pontos = [
  { name:"Centro Pop", category:"Serviços Públicos de Referência", address:"", details:"", phone:"", hours:"", lat:-21.7895843, lng:-48.1775678, photo:"fotos/centro_pop.jpg" },
  { name:'Casa de acolhida "Assad-Kan"', category:"Serviços Públicos de Referência", address:"", details:"", phone:"", hours:"", lat:-21.7905161, lng:-48.1917449, photo:"fotos/assad_kan.jpg" },
  { name:"CRAS Central", category:"Serviços Públicos de Referência", address:"Rua Gonçalves Dias, 468 Centro (antigo prédio da UMED, esquina com Av. Espanha)", details:"Centro de Referência da Assistência Social - Unidade Central", phone:"", hours:"", lat:-21.791522, lng:-48.173929, photo:"fotos/cras_central.jpg" },
  { name:"Associação São Pio (masculino)", category:"Pontos de Apoio e Parcerias", address:"", details:"Apoio social e reinserção", phone:"", hours:"", lat:-21.824304, lng:-48.2037705, photo:"fotos/sao_pio_m.jpg" },
  { name:"Associação São Pio (feminina)", category:"Pontos de Apoio e Parcerias", address:"", details:"Apoio social e reinserção", phone:"", hours:"", lat:-21.7665622, lng:-48.1782641, photo:"fotos/sao_pio_f.jpg" },
  { name:"Fundo Social de Solidariedade de Araraquara", category:"Pontos de doação", address:"", details:"", phone:"", hours:"", lat:-21.7788367, lng:-48.1921867, photo:"fotos/fundo_social.jpg" }
];

const categoryConfig = {
  "Serviços Públicos de Referência": { color:"#2b7cff" },
  "Pontos de Apoio e Parcerias": { color:"#28a745" },
  "Pontos de doação": { color:"#ff8c42" }
};

let map, infoWindow, markers=[], markerCluster=null;
let userLocation=null, userMarker=null;
let selectedMarker=null;
let previousMapCenter=null, previousMapZoom=null;

const $ = id => document.getElementById(id);
const q = sel => document.querySelector(sel);

/* =============== MAPA =============== */

window.initMap = function() {
  map = new google.maps.Map($("map"), {
    center:{lat:-21.79, lng:-48.185},
    zoom:13,
    streetViewControl:false,
    mapTypeControl:false,
    fullscreenControl:true,
    gestureHandling:"greedy"
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

/* =============== MARCADORES =============== */

function createMarkers() {
  if (markerCluster) { try { markerCluster.clearMarkers(); } catch(e){} markerCluster=null; }
  markers.forEach(m => m.setMap(null));
  markers=[];

  for (const p of pontos) {
    const color = categoryConfig[p.category]?.color || "#555";

    const marker = new google.maps.Marker({
      position:{lat:p.lat, lng:p.lng},
      title:p.name,
      icon:{
        url:makeSvgPin(color),
        scaledSize:new google.maps.Size(36,36)
      },
      map
    });

    marker._data = p;
    marker._category = p.category;

    marker.addListener("click",()=>openDetailsPanel(marker));
    markers.push(marker);
  }

  if (markers.length>0)
    markerCluster = new markerClusterer.MarkerClusterer({ map, markers });
}

function makeSvgPin(color){
  const svg = `
  <svg xmlns="http://www.w3.org/2000/svg" width="36" height="36" viewBox="0 0 24 24">
    <path d="M12 2C8 2 5 5 5 9c0 6.2 7 13 7 13s7-6.8 7-13c0-4-3-7-7-7z"
    fill="${color}" stroke="#fff" stroke-width="1.5"/>
    <circle cx="12" cy="9" r="2.5" fill="#fff"/>
  </svg>`;
  return "data:image/svg+xml,"+encodeURIComponent(svg);
}

/* =============== FILTROS =============== */

function initFilters(){
  const box = $("filters");
  if(!box) return;
  box.innerHTML="";

  Object.keys(categoryConfig).forEach(cat=>{
    const id=slug(cat);
    const color=categoryConfig[cat].color;

    const label=document.createElement("label");
    label.className="filter-item";
    label.innerHTML=`
      <input type="checkbox" id="${id}" data-cat="${cat}" checked>
      <span class="dot" style="background:${color}"></span> ${cat}`;
    box.appendChild(label);
  });

  document.querySelectorAll("#filters input").forEach(chk =>
    chk.addEventListener("change", applyFilters)
  );
}

function applyFilters(){
  const active=[...document.querySelectorAll("#filters input:checked")]
    .map(i=>i.dataset.cat);

  markers.forEach(m=>{
    try{ m.setVisible(active.includes(m._category)); }catch(e){}
  });

  rebuildClusterVisible();
  renderListaLocais();
}

/* =============== BUSCA NOME =============== */

function initSearch(){
  const box=$("searchBox");
  const clear=$("btnClearSearch");
  if(!box||!clear) return;

  box.addEventListener("input",()=>{
    const q = box.value.toLowerCase();
    markers.forEach(m=>{
      const d = m._data || {};
      const hay = (d.name+" "+(d.address||"")+" "+(d.details||"")).toLowerCase();
      m.setVisible(hay.includes(q));
    });
    rebuildClusterVisible();
    renderListaLocais();
  });

  clear.addEventListener("click",()=>{
    box.value="";
    box.dispatchEvent(new Event("input"));
  });
}

/* =============== BUSCA BAIRRO =============== */

function initBairroSearch(){
  const box=$("bairroBox");
  if(!box) return;

  box.addEventListener("input",()=>{
    const q = box.value.toLowerCase();
    markers.forEach(m=>{
      const hay = ((m._data?.address)||"").toLowerCase();
      m.setVisible(hay.includes(q));
    });
    rebuildClusterVisible();
    renderListaLocais();
  });
}

function rebuildClusterVisible(){
  const visible = markers.filter(m=>m.getVisible());
  if(markerCluster){
    markerCluster.clearMarkers();
    markerCluster.addMarkers(visible);
  } else {
    markerCluster = new markerClusterer.MarkerClusterer({ map, markers:visible });
  }
}

/* =============== LISTA DE LOCAIS =============== */

function initListaLocais(){ renderListaLocais(); }

function renderListaLocais(){
  const box=$("listaLocais");
  if(!box) return;

  box.innerHTML="";

  let vis = markers.filter(m=>m.getVisible());

  if(userLocation){
    vis.forEach(m=>{
      const d=m._data;
      if(d?.lat) m._distance = haversineDistance(userLocation.lat,userLocation.lng,d.lat,d.lng);
      else m._distance = Infinity;
    });
    vis.sort((a,b)=>(a._distance)-(b._distance));
  }

  vis.forEach(m=>{
    const d=m._data||{};
    const dist=(userLocation&&m._distance!==Infinity)?
      ` — ${m._distance.toFixed(1)} km`:"";
    const item=document.createElement("div");
    item.className="lista-item";
    item.innerHTML=`<strong>${escapeHtml(d.name)}</strong><br>
                    <span>${escapeHtml(d.category)}${dist}</span>`;

    item.addEventListener("click",()=>{
      closeSidePanelIfOpen();

      if(d.lat&&d.lng){
        map.panTo({lat:d.lat,lng:d.lng});
        map.setZoom(16);
      }

      openDetailsPanel(m);
    });

    box.appendChild(item);
  });
}

function closeSidePanelIfOpen(){
  const side=$("panel"), overlay=$("menuOverlay");
  if(side?.classList.contains("open")){
    side.classList.remove("open");
    overlay?.classList.add("hidden");
  }
}

/* =============== DETALHES (BOTTOM SHEET) =============== */

function detailsPanelEl(){ return $("detailsPanel") || q(".details-panel"); }
function sheetHandleEl(){ return $("sheetHandle") || q(".sheet-handle"); }
function detailsExtraBlockEl(){ return $("detailsExtraBlock") || q(".details-extra-block"); }

function setPanelState(state){
  const panel=detailsPanelEl();
  if(!panel) return;

  panel.style.height="";
  panel.classList.remove("state-closed","state-compact","state-mid","state-expanded","hidden");

  panel.setAttribute("aria-hidden", state==="closed"?"true":"false");

  if(state==="closed"){
    panel.classList.add("hidden","state-closed");
    document.body.style.overflow="";
    return;
  }

  panel.classList.add("state-"+state);
  document.body.style.overflow=(state==="mid"||state==="expanded")?"hidden":"";
}

function openDetailsPanel(marker){
  const side=$("panel"), overlay=$("menuOverlay");
  if(side?.classList.contains("open")){
    side.classList.remove("open");
    overlay?.classList.add("hidden");
    setTimeout(()=>openDetailsPanel(marker),160);
    return;
  }

  selectedMarker=marker;
  previousMapCenter=map.getCenter();
  previousMapZoom=map.getZoom();

  highlightMarker(marker);

  const p=marker._data||{};
  $("detailsName").textContent=p.name||"";
  $("detailsCategory").textContent=p.category||"";
  $("detailsAddress").textContent=p.address||"";
  $("detailsDetails").textContent=p.details||"";
  $("detailsPhone").textContent=p.phone||"";
  $("detailsHours").textContent=p.hours||"";

  const photo=$("detailsPhoto");
  if(photo){
    photo.onerror=function(){ this.src="placeholder.jpg"; };
    photo.src=p.photo||"placeholder.jpg";
  }

  const distEl=$("detailsDistance");
  if(userLocation&&p.lat){
    const dist=haversineDistance(userLocation.lat,userLocation.lng,p.lat,p.lng);
    distEl.textContent=`Distância: ${dist.toFixed(1)} km`;
  } else distEl.textContent="";

  const routeBtn=$("routeBtn");
  if(routeBtn){
    routeBtn.onclick=()=>p.lat?window.open(`https://www.google.com/maps/dir/?api=1&destination=${p.lat},${p.lng}`,"_blank"):
    alert("Coordenadas não disponíveis.");
  }

  const extra=detailsExtraBlockEl();
  extra.classList.add("hidden");
  extra.style.display="none";

  setPanelState("compact");

  setTimeout(()=>{
    try{
      const h=detailsPanelEl().clientHeight||window.innerHeight*0.18;
      map.panBy(0, -Math.round(h/2));
    }catch{}
  },260);
}

/* =============== CONTROLES DO PAINEL =============== */

function initDetailsPanel(){
  const closeBtn=$("closeDetails");
  if(closeBtn){
    closeBtn.addEventListener("click",()=>{
      setPanelState("closed");
      markers.forEach(m=>m.setOpacity?.(1));
      if(previousMapCenter) map.panTo(previousMapCenter);
      if(previousMapZoom!==null) map.setZoom(previousMapZoom);
    });
  }

  const moreBtn=$("detailsMoreBtn")||$("detailsMore");
  if(moreBtn){
    moreBtn.addEventListener("click",()=>{
      const block=detailsExtraBlockEl();
      if(block.classList.contains("hidden")){
        block.classList.remove("hidden");
        block.style.display="block";
        setTimeout(()=>block.scrollIntoView({behavior:"smooth",block:"center"}),80);
      } else {
        block.classList.add("hidden");
        block.style.display="none";
      }
    });
  }

  initPanelDrag();
}

/* =============== DRAG DO PAINEL =============== */

function initPanelDrag(){
  const panel=detailsPanelEl();
  const handle=sheetHandleEl();
  if(!panel||!handle) return;

  let startY=0, currentY=0, dragging=false, startHeight=0;

  const decideState=h=>{
    const vh=window.innerHeight;
    const ratio=h/vh;
    if(ratio>=0.75) return "expanded";
    if(ratio>=0.32) return "mid";
    return "compact";
  };

  const onStart=e=>{
    dragging=true;
    startY=(e.touches?e.touches[0].clientY:e.clientY);
    currentY=startY;
    startHeight=panel.getBoundingClientRect().height || window.innerHeight*0.18;
    panel.style.transition="none";
    document.body.style.userSelect="none";
    e.preventDefault?.();
  };

  const onMove=e=>{
    if(!dragging) return;
    currentY=(e.touches?e.touches[0].clientY:e.clientY);
    const dy=currentY-startY;
    const nh=Math.max(80,startHeight-dy);
    panel.style.height = nh+"px";
  };

  const onEnd=()=>{
    if(!dragging) return;
    dragging=false;
    panel.style.transition="";
    document.body.style.userSelect="";

    const h=parseInt(panel.style.height||panel.getBoundingClientRect().height,10);
    const snap=decideState(h);

    const dragDist=currentY-startY;

    if(dragDist>140 && panel.classList.contains("state-compact")){
      setPanelState("closed");
      panel.style.height="";
      return;
    }

    setPanelState(snap);
    panel.style.height="";
  };

  handle.addEventListener("touchstart",onStart,{passive:false});
  handle.addEventListener("touchmove",onMove,{passive:false});
  handle.addEventListener("touchend",onEnd);

  handle.addEventListener("mousedown",onStart);
  window.addEventListener("mousemove",onMove);
  window.addEventListener("mouseup",onEnd);

  let lastStart=0;
  handle.addEventListener("click",()=>{
    if(Math.abs(currentY-lastStart)>10) return;
    const panelEl=detailsPanelEl();
    if(panelEl.classList.contains("hidden")) return setPanelState("compact");
    if(panelEl.classList.contains("state-compact")) return setPanelState("mid");
    if(panelEl.classList.contains("state-mid")) return setPanelState("expanded");
    setPanelState("compact");
  });
}

/* =============== DESTAQUE =============== */

function highlightMarker(marker){
  markers.forEach(m=>{
    if(m===marker){
      m.setOpacity?.(1);
      m.setAnimation?.(google.maps.Animation.BOUNCE);
      setTimeout(()=>m.setAnimation?.(null),800);
    } else {
      m.setOpacity?.(0.25);
    }
  });
}

/* =============== GEOLOCALIZAÇÃO =============== */

function initGeoBtn(){
  const btn=$("geoBtn");
  if(!btn) return;

  btn.addEventListener("click",()=>{
    if(!navigator.geolocation) return alert("Geolocalização não suportada.");

    navigator.geolocation.getCurrentPosition(pos=>{
      userLocation={ lat:pos.coords.latitude, lng:pos.coords.longitude };

      if(!userMarker){
        userMarker=new google.maps.Marker({
          position:userLocation, map,
          icon:{ path:google.maps.SymbolPath.CIRCLE, scale:8,
            fillColor:"#0b5ed7", fillOpacity:0.9,
            strokeColor:"#fff", strokeWeight:2 },
          title:"Você está aqui"
        });
      } else userMarker.setPosition(userLocation);

      map.panTo(userLocation);
      map.setZoom(15);
      renderListaLocais();
    },
    err=>alert("Não foi possível obter localização: "+err.message));
  });
}

/* =============== LOCAIS PRÓXIMOS =============== */

function initNearbyBtn(){
  const btn=$("nearbyBtn");
  if(!btn) return;

  btn.addEventListener("click",()=>{
    if(!userLocation) return alert("Ative a localização primeiro.");

    markers.forEach(m=>{
      const d=m._data;
      if(d?.lat) m._distance=haversineDistance(userLocation.lat,userLocation.lng,d.lat,d.lng);
      else m._distance=Infinity;
    });

    const sorted=markers.slice().sort((a,b)=>a._distance-b._distance);
    fitToMarkers(sorted.slice(0,5));
    renderListaLocais();
  });
}

/* =============== MENU HAMBURGUER =============== */

function initHamburgerMenu(){
  const btn=$("menuBtn"), panel=$("panel"), overlay=$("menuOverlay");
  if(!btn||!panel||!overlay) return;

  const open=()=>{ panel.classList.add("open"); overlay.classList.remove("hidden"); };
  const close=()=>{ panel.classList.remove("open"); overlay.classList.add("hidden"); };

  btn.addEventListener("click",()=>panel.classList.contains("open")?close():open());
  overlay.addEventListener("click",close);

  try{
    const key="onboard_menu_v3";
    if(!localStorage.getItem(key)){
      setTimeout(()=>{ open(); setTimeout(()=>{ close(); localStorage.setItem(key,"1"); },800); },400);
    }
  }catch{}

  $("listaLocais")?.addEventListener("click",ev=>{
    if(ev.target.closest(".lista-item")) close();
  });
}

/* =============== HERRAMENTAS =============== */

function fitToMarkers(list=markers){
  if(!map||list.length===0) return;
  const bounds=new google.maps.LatLngBounds();
  list.forEach(m=>bounds.extend(m.getPosition()));
  map.fitBounds(bounds);
}

function slug(s){ return (s||"").toLowerCase().replace(/\s+/g,"-"); }

function haversineDistance(lat1,lon1,lat2,lon2){
  const R=6371;
  const dLat=(lat2-lat1)*Math.PI/180;
  const dLon=(lon2-lon1)*Math.PI/180;
  const a=Math.sin(dLat/2)**2 + Math.cos(lat1*Math.PI/180)*Math.cos(lat2*Math.PI/180)*Math.sin(dLon/2)**2;
  return R * 2 * Math.atan2(Math.sqrt(a),Math.sqrt(1-a));
}

function escapeHtml(u){
  if(u===undefined||u===null) return "";
  return String(u).replace(/&/g,"&amp;")
                  .replace(/</g,"&lt;")
                  .replace(/>/g,"&gt;")
                  .replace(/"/g,"&quot;")
                  .replace(/'/g,"&#039;");
}

document.addEventListener("DOMContentLoaded",()=>{
  const extra=detailsExtraBlockEl();
  if(extra){ extra.classList.add("hidden"); extra.style.display="none"; }
  setPanelState("closed");
});

window.mapapoprua={ openDetailsPanel, setPanelState, fitToMarkers };
