* {
  box-sizing: border-box;
}

html,
body,
#root {
  margin: 0;
  padding: 0;
  width: 100%;
  min-height: 100%;
  font-family:
    Inter,
    ui-sans-serif,
    system-ui,
    -apple-system,
    BlinkMacSystemFont,
    "Segoe UI",
    sans-serif;
}

body {
  background: #f5f7fa;
  color: #0f172a;
}

button,
input {
  font: inherit;
}

button {
  cursor: pointer;
}

.app {
  min-height: 100vh;
  display: flex;
  background: #f5f7fa;
}

/* =========================================================
   SIDEBAR
   ========================================================= */

.sidebar {
  width: 238px;
  min-height: 100vh;
  background: #101827;
  color: white;
  display: flex;
  flex-direction: column;
  position: fixed;
  left: 0;
  top: 0;
  bottom: 0;
  z-index: 30;
}

.brand {
  min-height: 72px;
  padding: 18px 14px;
  display: flex;
  align-items: center;
  gap: 10px;
}

.brand-mark {
  width: 40px;
  height: 40px;
  background: white;
  color: #0f172a;
  border-radius: 10px;
  display: flex;
  align-items: center;
  justify-content: center;
  font-weight: 800;
  font-size: 13px;
  flex-shrink: 0;
}

.brand-mark.large {
  width: 52px;
  height: 52px;
  font-size: 15px;
  margin: 0 auto 18px;
}

.brand strong {
  display: block;
  font-size: 14px;
  line-height: 1.2;
}

.brand span {
  display: block;
  color: #94a3b8;
  font-size: 11px;
  margin-top: 4px;
}

.sidebar nav {
  padding: 8px 10px;
}

.nav-item {
  width: 100%;
  border: 0;
  background: transparent;
  color: #cbd5e1;
  min-height: 42px;
  border-radius: 8px;
  display: flex;
  align-items: center;
  gap: 11px;
  padding: 0 12px;
  text-align: left;
  margin-bottom: 4px;
  font-size: 13px;
}

.nav-item:hover {
  background: #182334;
  color: white;
}

.nav-item.active {
  background: #202c3e;
  color: white;
}

.sidebar-footer {
  margin-top: auto;
  padding: 14px 10px 18px;
}

.user-profile {
  display: flex;
  gap: 9px;
  align-items: center;
  padding: 10px 8px;
  margin-bottom: 10px;
  border-top: 1px solid #243043;
  border-bottom: 1px solid #243043;
}

.user-profile strong {
  display: block;
  color: white;
  font-size: 12px;
}

.user-profile span {
  display: block;
  color: #94a3b8;
  font-size: 10px;
  margin-top: 2px;
}

.connection {
  display: flex;
  align-items: center;
  gap: 7px;
  color: #94a3b8;
  font-size: 10px;
  padding: 7px 8px 12px;
}

.dot {
  width: 7px;
  height: 7px;
  border-radius: 50%;
  background: #64748b;
}

.dot.on {
  background: #22c55e;
}

/* =========================================================
   MAIN
   ========================================================= */

main {
  width: calc(100% - 238px);
  margin-left: 238px;
  min-height: 100vh;
}

.topbar {
  height: 72px;
  background: white;
  border-bottom: 1px solid #e2e8f0;
  padding: 0 38px;
  display: flex;
  align-items: center;
  justify-content: space-between;
}

.eyebrow {
  color: #64748b;
  font-size: 10px;
  font-weight: 700;
  letter-spacing: 0.15em;
  margin-bottom: 5px;
}

.topbar h1 {
  margin: 0;
  font-size: 21px;
  line-height: 1.1;
  color: #0f172a;
}

.topbar-actions {
  display: flex;
  align-items: center;
  gap: 12px;
}

.role-badge {
  background: #f1f5f9;
  color: #475569;
  border-radius: 20px;
  padding: 6px 10px;
  font-size: 10px;
  font-weight: 700;
}

.refresh {
  height: 38px;
  border: 1px solid #dbe2ea;
  background: white;
  border-radius: 9px;
  padding: 0 14px;
  color: #334155;
  display: flex;
  align-items: center;
  gap: 8px;
}

.refresh:hover {
  background: #f8fafc;
}

.refresh:disabled {
  opacity: 0.6;
  cursor: wait;
}

/* =========================================================
   CONTENT
   ========================================================= */

.content {
  padding: 34px 38px 50px;
}

.welcome {
  display: flex;
  justify-content: space-between;
  align-items: flex-end;
  margin-bottom: 24px;
}

.welcome h2 {
  margin: 0;
  font-size: 27px;
  color: #0f172a;
}

.welcome p {
  margin: 7px 0 0;
  color: #64748b;
  font-size: 13px;
}

.date {
  color: #64748b;
  font-size: 12px;
}

/* =========================================================
   KPIS
   ========================================================= */

.kpis {
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: 14px;
  margin-bottom: 22px;
}

.kpi {
  background: white;
  border: 1px solid #e2e8f0;
  border-radius: 12px;
  min-height: 130px;
  padding: 20px;
  display: flex;
  flex-direction: column;
}

.kpi > span {
  color: #64748b;
  font-size: 12px;
}

.kpi strong {
  margin-top: 12px;
  font-size: 28px;
  line-height: 1;
  color: #0f172a;
}

.kpi strong.healthy {
  color: #059669;
}

.kpi strong.attention {
  color: #c08400;
}

.kpi strong.critical {
  color: #dc2626;
}

.kpi small {
  margin-top: auto;
  color: #94a3b8;
  font-size: 10px;
}

/* =========================================================
   PANEL
   ========================================================= */

.panel {
  background: white;
  border: 1px solid #e2e8f0;
  border-radius: 13px;
  overflow: hidden;
}

.panel-head {
  min-height: 80px;
  padding: 18px 22px;
  border-bottom: 1px solid #e2e8f0;
  display: flex;
  align-items: center;
  justify-content: space-between;
}

.panel-head h3 {
  margin: 0;
  font-size: 14px;
}

.panel-head p {
  margin: 5px 0 0;
  color: #64748b;
  font-size: 11px;
}

.count {
  background: #f8fafc;
  color: #64748b;
  border-radius: 20px;
  padding: 7px 11px;
  font-size: 10px;
}

/* =========================================================
   TABLE
   ========================================================= */

.table-wrap {
  width: 100%;
  overflow-x: auto;
}

table {
  width: 100%;
  border-collapse: collapse;
}

thead {
  background: #f8fafc;
}

th {
  height: 40px;
  padding: 0 18px;
  text-align: left;
  color: #64748b;
  font-size: 9px;
  font-weight: 700;
  letter-spacing: 0.08em;
  text-transform: uppercase;
}

td {
  padding: 15px 18px;
  border-top: 1px solid #eef2f7;
  font-size: 12px;
  color: #334155;
}

tbody tr {
  transition: background 0.15s ease;
}

tbody tr:hover {
  background: #f8fafc;
  cursor: pointer;
}

.project strong {
  display: block;
  color: #0f172a;
  font-size: 12px;
}

.project span {
  display: block;
  color: #64748b;
  font-size: 10px;
  margin-top: 4px;
}

.health {
  display: inline-flex;
  align-items: center;
  gap: 7px;
  font-weight: 600;
}

.health i {
  width: 7px;
  height: 7px;
  border-radius: 50%;
  background: #64748b;
}

.health.healthy i {
  background: #10b981;
}

.health.attention i {
  background: #f59e0b;
}

.health.critical i {
  background: #ef4444;
}

.health.healthy {
  color: #059669;
}

.health.attention {
  color: #b77900;
}

.health.critical {
  color: #dc2626;
}

/* =========================================================
   PROGRESS
   ========================================================= */

.progress {
  display: flex;
  align-items: center;
  gap: 10px;
  min-width: 120px;
}

.progress > span {
  width: 32px;
  font-size: 11px;
}

.progress > div {
  width: 75px;
  height: 5px;
  background: #e2e8f0;
  border-radius: 20px;
  overflow: hidden;
}

.progress b {
  display: block;
  height: 100%;
  background: #64748b;
  border-radius: inherit;
}

.raid {
  min-width: 24px;
  display: inline-flex;
  justify-content: center;
  padding: 4px 7px;
  border-radius: 7px;
  background: #fff1f2;
  color: #dc2626;
  font-size: 10px;
  font-weight: 700;
}

.empty {
  min-height: 150px;
  display: flex;
  align-items: center;
  justify-content: center;
  color: #64748b;
  font-size: 13px;
}

/* =========================================================
   DRAWER
   ========================================================= */

.drawer-backdrop {
  position: fixed;
  inset: 0;
  background: rgba(15, 23, 42, 0.35);
  z-index: 100;
  display: flex;
  justify-content: flex-end;
}

.drawer {
  width: min(520px, 92vw);
  height: 100%;
  background: white;
  box-shadow: -10px 0 40px rgba(15, 23, 42, 0.15);
  padding: 28px;
  overflow-y: auto;
}

.drawer-head {
  display: flex;
  justify-content: space-between;
  gap: 20px;
}

.drawer-head h2 {
  margin: 0;
  font-size: 25px;
}

.drawer-head p {
  margin: 6px 0 0;
  color: #64748b;
  font-size: 12px;
}

.hero-status {
  margin-top: 28px;
  border-radius: 12px;
  padding: 18px;
  display: flex;
  align-items: center;
  justify-content: space-between;
}

.hero-status.healthy {
  background: #ecfdf5;
  color: #047857;
}

.hero-status.attention {
  background: #fffbeb;
  color: #b45309;
}

.hero-status.critical {
  background: #fef2f2;
  color: #b91c1c;
}

.hero-status span:first-child {
  display: block;
  font-size: 10px;
}

.hero-status strong {
  display: block;
  margin-top: 4px;
  font-size: 28px;
}

.pill {
  border-radius: 20px;
  padding: 6px 10px;
  background: rgba(255, 255, 255, 0.8);
  font-size: 10px;
  font-weight: 700;
}

.detail-grid {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 10px;
  margin-top: 20px;
}

.metric {
  border: 1px solid #e2e8f0;
  border-radius: 10px;
  padding: 15px;
}

.metric span {
  display: block;
  color: #64748b;
  font-size: 10px;
}

.metric strong {
  display: block;
  margin-top: 7px;
  font-size: 19px;
  color: #0f172a;
}

.next {
  margin-top: 20px;
  padding: 18px;
  background: #f8fafc;
  border-radius: 10px;
}

.next h3 {
  margin: 0;
  font-size: 13px;
}

.next p {
  color: #64748b;
  font-size: 11px;
  line-height: 1.6;
  margin-bottom: 0;
}

/* =========================================================
   BUTTONS
   ========================================================= */

.icon-btn {
  border: 0;
  background: transparent;
  color: inherit;
  width: 34px;
  height: 34px;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  border-radius: 8px;
}

.icon-btn:hover {
  background: #f1f5f9;
}

.mobile-menu,
.mobile-close {
  display: none;
}

/* =========================================================
   AUTH
   ========================================================= */

.auth-screen {
  min-height: 100vh;
  background: #f5f7fa;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 24px;
}

.auth-card {
  width: min(430px, 100%);
  background: white;
  border: 1px solid #e2e8f0;
  border-radius: 16px;
  padding: 35px;
  box-shadow:
    0 20px 50px rgba(15, 23, 42, 0.08);
}

.auth-brand {
  display: flex;
  align-items: center;
  gap: 12px;
  margin-bottom: 32px;
}

.auth-brand .brand-mark {
  margin: 0;
}

.auth-brand strong {
  display: block;
  font-size: 15px;
}

.auth-brand span {
  display: block;
  color: #64748b;
  font-size: 11px;
  margin-top: 3px;
}

.auth-title {
  display: flex;
  gap: 12px;
  align-items: flex-start;
  margin-bottom: 24px;
}

.auth-icon {
  width: 42px;
  height: 42px;
  border-radius: 10px;
  background: #f1f5f9;
  display: flex;
  align-items: center;
  justify-content: center;
  color: #475569;
}

.auth-title h1 {
  margin: 0;
  font-size: 21px;
}

.auth-title p {
  margin: 5px 0 0;
  color: #64748b;
  font-size: 12px;
  line-height: 1.5;
}

.auth-card form label {
  display: block;
  color: #334155;
  font-size: 11px;
  font-weight: 600;
  margin-bottom: 16px;
}

.auth-card input {
  width: 100%;
  height: 44px;
  margin-top: 7px;
  border: 1px solid #dbe2ea;
  border-radius: 8px;
  padding: 0 12px;
  outline: none;
  color: #0f172a;
  background: white;
}

.auth-card input:focus {
  border-color: #64748b;
  box-shadow: 0 0 0 3px rgba(100, 116, 139, 0.1);
}

.login-button {
  width: 100%;
  height: 44px;
  border: 0;
  border-radius: 8px;
  background: #111827;
  color: white;
  font-weight: 600;
  margin-top: 4px;
}

.login-button:hover {
  background: #1f2937;
}

.login-button:disabled {
  opacity: 0.6;
  cursor: wait;
}

.login-error {
  display: flex;
  gap: 8px;
  align-items: flex-start;
  background: #fef2f2;
  color: #b91c1c;
  border: 1px solid #fecaca;
  border-radius: 8px;
  padding: 11px;
  font-size: 11px;
  line-height: 1.4;
  margin-bottom: 15px;
}

.setup-banner {
  display: flex;
  gap: 10px;
  align-items: flex-start;
  padding: 14px;
  background: #fffbeb;
  border: 1px solid #fde68a;
  color: #92400e;
  border-radius: 9px;
  font-size: 11px;
}

.setup-banner strong,
.setup-banner span {
  display: block;
}

.setup-banner span {
  margin-top: 4px;
}

.auth-footer {
  margin-top: 25px;
  padding-top: 18px;
  border-top: 1px solid #eef2f7;
  display: flex;
  justify-content: center;
  gap: 8px;
  color: #94a3b8;
  font-size: 10px;
}

.auth-spinner {
  width: 26px;
  height: 26px;
  border: 3px solid #e2e8f0;
  border-top-color: #475569;
  border-radius: 50%;
  animation: spin 0.8s linear infinite;
  margin: 22px auto 0;
}

.spin {
  animation: spin 0.8s linear infinite;
}

@keyframes spin {
  to {
    transform: rotate(360deg);
  }
}

/* =========================================================
   RESPONSIVE
   ========================================================= */

@media (max-width: 900px) {

  .sidebar {
    transform: translateX(-100%);
    transition: transform 0.2s ease;
  }

  .sidebar.open {
    transform: translateX(0);
  }

  main {
    width: 100%;
    margin-left: 0;
  }

  .mobile-menu {
    display: inline-flex;
    color: #334155;
    margin-right: 8px;
  }

  .mobile-close {
    display: inline-flex;
    margin-left: auto;
  }

  .topbar {
    padding: 0 20px;
  }

  .content {
    padding: 25px 20px;
  }

  .kpis {
    grid-template-columns: repeat(2, 1fr);
  }

  .welcome {
    align-items: flex-start;
    gap: 20px;
  }

  .date {
    white-space: nowrap;
  }
}

@media (max-width: 600px) {

  .topbar {
    height: 64px;
  }

  .topbar h1 {
    font-size: 18px;
  }

  .role-badge {
    display: none;
  }

  .refresh {
    padding: 0 10px;
  }

  .content {
    padding: 22px 14px;
  }

  .welcome {
    display: block;
  }

  .date {
    margin-top: 12px;
  }

  .welcome h2 {
    font-size: 23px;
  }

  .kpis {
    grid-template-columns: 1fr 1fr;
    gap: 9px;
  }

  .kpi {
    min-height: 115px;
    padding: 15px;
  }

  .kpi strong {
    font-size: 24px;
  }

  .panel-head {
    padding: 16px;
  }

  th,
  td {
    padding-left: 12px;
    padding-right: 12px;
  }

  .auth-card {
    padding: 25px;
  }

  .drawer {
    width: 100%;
    padding: 22px;
  }
}
