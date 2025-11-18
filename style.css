:root {
  --bg:#f6f7f9;
  --primary:#0b5ed7;
  --muted:#6c757d;
  --panel:#ffffff;
  --shadow:0 6px 18px rgba(20,20,20,0.06);
  --max-width:1200px;

  /* Detalhes */
  --details-bg:#fff;
  --details-shadow:0 -4px 22px rgba(0,0,0,0.18);
}

* { box-sizing:border-box; }

html,body {
  height:100%;
  margin:0;
  font-family:Inter, Arial, sans-serif;
  background:var(--bg);
  color:#222;
}

.container {
  max-width:var(--max-width);
  margin:0 auto;
  padding:0 16px;
}

/* HEADER */
.site-header {
  background:white;
  border-bottom:1px solid #e6e9ee;
  position:sticky;
  top:0;
  z-index:30;
  box-shadow:var(--shadow);
}
.header-inner {
  display:flex;
  align-items:center;
  justify-content:space-between;
  padding:12px 0;
}

.brand {
  display:flex;
  gap:12px;
  align-items:center;
}
.brand h1 {
  font-size:18px;
  margin:0;
}
.brand .subtitle {
  margin:2px 0 0;
  color:var(--muted);
  font-size:13px;
}

.logo {
  width:54px;
  height:54px;
  object-fit:contain;
}

/* CONTROLS */
.controls {
  display:flex;
  gap:12px;
  align-items:center;
}

.search {
  display:flex;
  align-items:center;
  background:#f1f3f5;
  border-radius:8px;
  padding:6px;
  border:1px solid #e0e6ef;
}
.search input {
  border:0;
  background:transparent;
  padding:6px 8px;
  width:220px;
  outline:none;
}
.search button {
  background:transparent;
  border:0;
  cursor:pointer;
  font-size:14px;
  color:#777;
}

.search-bairro input {
  border:1px solid #e0e6ef;
  background:#f1f3f5;
  padding:6px 10px;
  border-radius:8px;
  outline:none;
}

.geo-btn {
  background:var(--primary);
  color:#fff;
  padding:8px 14px;
  border-radius:8px;
  cursor:pointer;
  border:0;
  font-weight:600;
}

.panel-toggle {
  background:transparent;
  border:0;
  color:var(--primary);
  cursor:pointer;
  font-weight:600;
}

/* GRID */
.main-grid {
  display:grid;
  grid-template-columns:320px 1fr;
  gap:16px;
  padding:18px 0;
  min-height:calc(100vh - 120px);
}
@media (max-width:900px){
  .main-grid { grid-template-columns:1fr; }
  .panel { order:2; }
  .map-section { order:1; }
}

/* PAINEL LATERAL */
.panel {
  background:var(--panel);
  padding:14px;
  border-radius:10px;
  box-shadow:var(--shadow);
  height:fit-content;
}
.panel h2 {
  margin:0 0 12px;
}

.filters {
  display:flex;
  flex-direction:column;
  gap:8px;
}
.filter-item {
  display:flex;
  align-items:center;
  gap:8px;
}
.filter-item input {
  transform:scale(1.1);
}
.filter-item label {
  font-size:14px;
  color:#222;
}

/* LISTA DE LOCAIS */
.lista {
  display:flex;
  flex-direction:column;
  gap:10px;
  margin-top:10px;
}

.place-item {
  background:#fff;
  border:1px solid #e5e7eb;
  padding:10px;
  border-radius:8px;
  cursor:pointer;
  display:flex;
  justify-content:space-between;
  align-items:center;
  transition:.2s;
}
.place-item:hover {
  background:#eef5ff;
}
.place-active {
  background:#d9e9ff !important;
  border-color:#0b5ed7;
}

/* MAPA */
.map {
  width:100%;
  height:75vh;
  border-radius:10px;
  overflow:hidden;
  box-shadow:var(--shadow);
}
@media (max-width:600px){
  .map { height:60vh; }
}

/* FOOTER */
.site-footer {
  padding:12px 0;
  text-align:center;
  color:var(--muted);
}

/* PANEL - DETALHES (BOTTOM SHEET) */
.details-panel {
  position:fixed;
  bottom:-100%;
  left:0;
  width:100%;
  background:var(--details-bg);
  border-radius:18px 18px 0 0;
  box-shadow:var(--details-shadow);
  padding:12px 16px 30px;
  transition:bottom .35s ease;
  z-index:50;
}

.details-panel.open {
  bottom:0;
}

.details-header {
  display:flex;
  justify-content:space-between;
  align-items:center;
}

.details-handle {
  width:45px;
  height:5px;
  background:#ccc;
  border-radius:4px;
  margin:0 auto 10px;
}

.close-details {
  background:transparent;
  border:0;
  font-size:18px;
  cursor:pointer;
  color:#555;
  margin-left:auto;
}

.details-content {
  margin-top:6px;
}

.details-photo {
  width:100%;
  height:180px;
  object-fit:cover;
  border-radius:10px;
  background:#ddd;
  margin-bottom:12px;
}

.details-cat {
  color:#0b5ed7;
  font-weight:600;
  margin-top:-6px;
}

.details-more {
  display:block;
  width:100%;
  margin-top:16px;
  padding:12px;
  background:#0b5ed7;
  color:white;
  border:0;
  border-radius:8px;
  font-weight:600;
  cursor:pointer;
}

/* HIDDEN CLASS */
.hidden {
  display:none;
}
