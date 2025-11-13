/**
 * Inspection Job Page — Robust Build (Designer + Launchpad)
 * ---------------------------------------------------------
 * Why this exists
 *  - UI5 rendering differs between Launchpad and Designer (iframe preview).
 *  - In Designer, jobLocationMap may not fire a second `onAfterRendering` after navigation,
 *    so the first Leaflet build can be skipped unless we add a fallback.
 *
 * What this code guarantees
 *  - One Leaflet map instance per page (global `map`).
 *  - Always builds when the host div is visible (non-zero size), regardless of runtime.
 *  - Works if Leaflet JS is present but CSS is missing in the iframe (injects CSS + inline fallback).
 *  - Safe re-entry: updates view and marker if the map already exists.
 *
 * Key components
 *  - ensureLeaflet(): Ensures Leaflet JS + CSS in the *current frame*; adds a minimal inline CSS fallback.
 *  - ensureHostDiv(): Creates a stable child div (`<controlId>-host`) for Leaflet to own.
 *  - waitUntilVisible(): Defers first build until container has real size (ResizeObserver + polling).
 *  - scheduleInitialBuild(): Sets `pendingView` then arms a unified fallback:
 *      MutationObserver (DOM attach), ResizeObserver (size changes), and a short poll.
 *    This complements `onAfterRendering` and makes Designer reliable.
 *  - performBuildOrUpdate(): Idempotent builder; creates or updates map + marker; fixes size after layout.
 *
 * Behavior summary
 *  - First load:
 *      - populateInspectionJobPage() sets model, sets tab, schedules initial build (or updates existing map).
 *      - Either `onAfterRendering` OR the fallback will trigger performBuildOrUpdate() once.
 *  - Subsequent loads:
 *      - performBuildOrUpdate() reuses the existing map and recenters/updates the marker.
 *
 * Operational notes
 *  - Toggle logs: set `const DBG = { enabled: false }` (default off).
 *  - CSP: if OSM tiles are blocked in preview, swap the tile URL to an allowed internal endpoint.
 *  - Memory safety: if the Leaflet container detaches (UI5 re-render), we remove and rebuild.
 *
 */

// ===========================================================

let map;
let markerLayer;
let hostId;
let pendingView = null;

// ---------- DEBUG ----------
const DBG = { enabled: false };
function dbg(label, data) {
  if (!DBG.enabled) return;
  try {
    const ts = new Date().toISOString().split("T")[1].replace("Z", "");
    console.log(`[eLearningDBG ${ts}] ${label}`, data ?? "");
  } catch {}
}

// ---------- UTILITIES ----------
function getContainerEl() {
  // Prefer rendered DOM of the control; fall back to ID lookup
  return jobLocationMap.getDomRef() || document.getElementById(jobLocationMap.getId());
}

function ensureHostDiv(containerEl) {
  hostId = jobLocationMap.getId() + "-host";
  let host = document.getElementById(hostId);
  if (!host) {
    host = document.createElement("div");
    host.id = hostId;
    host.style.height = "100%";
    host.style.width  = "100%";
    containerEl.appendChild(host);
    dbg("hostDiv", { action: "created", id: hostId });
  } else if (host.parentNode !== containerEl) {
    containerEl.appendChild(host);
    dbg("hostDiv", { action: "reparented", id: hostId });
  } else {
    dbg("hostDiv", { action: "exists", id: hostId });
  }
  return host;
}

function waitUntilVisible(el, cb) {
  const ready = () => el && el.isConnected && el.getBoundingClientRect().width > 0 && el.getBoundingClientRect().height > 0;
  if (ready()) return cb();

  // ResizeObserver to catch size changes
  let ro;
  try {
    ro = new ResizeObserver(() => { if (ready()) { ro.disconnect(); cb(); } });
    ro.observe(el);
  } catch {}

  // Poll as a safety net (Designer can throttle observers)
  let tries = 80;
  const t = setInterval(() => {
    if (ready()) { clearInterval(t); ro && ro.disconnect(); cb(); }
    else if (--tries <= 0) { clearInterval(t); ro && ro.disconnect(); }
  }, 50);
}

// ---------- Leaflet loader (CSS + inline minimal fallback) ----------
const LEAFLET_VER = "1.9.4";
const LEAFLET_JS  = `https://unpkg.com/leaflet@${LEAFLET_VER}/dist/leaflet.js`;
const LEAFLET_CSS = `https://unpkg.com/leaflet@${LEAFLET_VER}/dist/leaflet.css`;

function ensureLeafletCssInline() {
  if (document.getElementById("leaflet-css-inline")) return;
  const style = document.createElement("style");
  style.id = "leaflet-css-inline";
  // Minimal subset sufficient to render tiles/markers
  style.textContent = `
    .leaflet-container { position:relative; outline:0; height:100%; width:100%; }
    .leaflet-pane, .leaflet-tile, .leaflet-marker-icon, .leaflet-marker-shadow,
    .leaflet-tile-container, .leaflet-zoom-box { position:absolute; left:0; top:0; }
    .leaflet-pane { z-index: 400; }
    .leaflet-tile { visibility:hidden; }
    .leaflet-tile-loaded { visibility:inherit; }
    .leaflet-marker-pane { z-index: 600; }
    .leaflet-popup-pane { z-index: 700; }
    .leaflet-container img { max-width:none !important; }
  `;
  document.head.appendChild(style);
}

function ensureLeaflet(then) {
  // Ensure CSS in THIS frame (Designer runs in an iframe)
  let cssReady = !!document.getElementById("leaflet-css");
  if (!cssReady) {
    const link = document.createElement("link");
    link.id = "leaflet-css";
    link.rel = "stylesheet";
    link.href = LEAFLET_CSS;
    link.onload = () => { cssReady = true; dbg("leafletCSS", "loaded"); };
    link.onerror = () => { dbg("leafletCSS", "load-failed"); };
    document.head.appendChild(link);
  }
  // Always add inline fallback (harmless if link works)
  ensureLeafletCssInline();

  if (window.L) return cssReady ? then() : setTimeout(then, 0);

  // Load JS into THIS frame if missing
  if (!document.getElementById("leaflet-js")) {
    const s = document.createElement("script");
    s.id = "leaflet-js";
    s.src = LEAFLET_JS;
    s.onload = () => { dbg("leafletJS", "loaded"); then(); };
    s.onerror = () => dbg("leafletJS", "load-failed");
    document.head.appendChild(s);
  } else {
    (function wait(){ if (window.L) then(); else setTimeout(wait, 40); })();
  }
}

// ---------- Map build/update ----------
function performBuildOrUpdate(lat, lng) {
  const containerEl = getContainerEl();
  if (!containerEl) {
    dbg("map", "container missing; will navigate + retry");
    oApp.to(viewInspectionJob);
    requestAnimationFrame(() => performBuildOrUpdate(lat, lng));
    return;
  }

  ensureLeaflet(() => {
    const host = ensureHostDiv(containerEl);

    waitUntilVisible(host, () => {
      // If existing map's container got detached, rebuild cleanly
      if (map && map.getContainer && !map.getContainer().isConnected) {
        try { map.remove(); } catch {}
        map = null;
        markerLayer = null;
        dbg("map", "detached map container removed");
      }

      if (!map) {
        dbg("map", { build: "new", lat, lng });
        map = L.map(host).setView([lat, lng], 13);

        // If CSP blocks OSM in Designer, point this to an allowed internal URL
        L.tileLayer("https://tile.openstreetmap.org/{z}/{x}/{y}.png", {
          maxZoom: 19,
          attribution: "&copy; OpenStreetMap"
        }).addTo(map);

        markerLayer = L.layerGroup().addTo(map);
      } else {
        dbg("map", { build: "update", lat, lng });
        map.invalidateSize();
        map.setView([lat, lng], 13);
      }

      // Replace marker each time
      markerLayer.clearLayers();
      L.marker([lat, lng]).addTo(markerLayer);

      requestAnimationFrame(() => { if (map) map.invalidateSize(); });
    });
  });
}

// ---------- Scheduling (with unified fallback for Designer) ----------
let buildFallbackArmed = false;
function scheduleInitialBuild(lat, lng) {
  pendingView = { lat, lng };
  dbg("map", { scheduleInitialBuild: pendingView });

  // Fallback for Designer: observe DOM until the host appears & has size,
  // then trigger performBuildOrUpdate once. No-op if onAfterRendering fires first.
  if (buildFallbackArmed) return;
  buildFallbackArmed = true;

  const tryBuildIfReady = () => {
    if (!pendingView) return; // already built
    const containerEl = getContainerEl();
    if (!containerEl) return;
    const host = ensureHostDiv(containerEl);
    const r = host.getBoundingClientRect();
    if (r.width > 0 && r.height > 0) {
      const { lat, lng } = pendingView;
      pendingView = null;
      dbg("map", { fallback: "host visible -> perform initial build", lat, lng });
      performBuildOrUpdate(lat, lng);
    }
  };

  // MutationObserver: when jobLocationMap subtree changes (Designer nav)
  let mo;
  try {
    const root = document.body;
    mo = new MutationObserver(() => tryBuildIfReady());
    mo.observe(root, { childList: true, subtree: true });
  } catch {}

  // ResizeObserver on container (when it gets sized)
  let ro;
  try {
    const containerEl = () => getContainerEl();
    const watch = () => {
      const c = containerEl();
      if (!c) return;
      ro = new ResizeObserver(() => tryBuildIfReady());
      ro.observe(c);
    };
    // small delay to let container attach
    setTimeout(watch, 0);
  } catch {}

  // Short polling as last resort
  let ticks = 100;
  const iv = setInterval(() => {
    tryBuildIfReady();
    if (!pendingView || --ticks <= 0) {
      clearInterval(iv);
      mo && mo.disconnect();
      ro && ro.disconnect();
      buildFallbackArmed = false;
    }
  }, 60);
}

// ---------- Optional: still use onAfterRendering when it does fire ----------
(function attachAfterRenderingOnce() {
  if (!jobLocationMap || !jobLocationMap.addEventDelegate) return;
  let attached = false;
  if (!attached) {
    jobLocationMap.addEventDelegate({
      onAfterRendering: function () {
        dbg("onAfterRendering(jobLocationMap)");
        const containerEl = getContainerEl();
        if (!containerEl) return;
        ensureHostDiv(containerEl);
        if (pendingView) {
          const { lat, lng } = pendingView;
          pendingView = null;
          dbg("map", { afterRendering: "trigger initial build", lat, lng });
          requestAnimationFrame(() => performBuildOrUpdate(lat, lng));
        } else if (map) {
          requestAnimationFrame(() => map && map.invalidateSize());
        }
      }
    });
    attached = true;
  }
})();

// ===========================================================
// POPULATE PAGE FUNCTION
// ===========================================================
function populateInspectionJobPage(data) {
  dbg("enter populateInspectionJobPage");

  // Navigate to detail view (guarded)
  try {
    const current = oApp.getCurrentPage && oApp.getCurrentPage();
    if (!current || current.getId() !== viewInspectionJob.getId()) {
      oApp.to(viewInspectionJob);
      dbg("navigation", "navigating to viewInspectionJob");
    } else {
      dbg("navigation", "already on viewInspectionJob");
    }
  } catch (e) {
    dbg("navigation", { fallback: true, err: String(e) });
    oApp.to(viewInspectionJob);
  }

  dbg("after navigation");

  // Bind data
  modelviewInspectionJob.setData(data);

  // Start on Comments tab
  oIconTabBar.setSelectedKey("COMM");

  // Map build path
  const lat = Number(data.equip_latitude);
  const lng = Number(data.equip_longitude);
  dbg("coords", { lat, lng, valid: Number.isFinite(lat) && Number.isFinite(lng) });

  if (!Number.isFinite(lat) || !Number.isFinite(lng)) {
    dbg("map-skip", "invalid coords");
  } else if (!map) {
    scheduleInitialBuild(lat, lng);
  } else {
    performBuildOrUpdate(lat, lng);
  }

  // ----- Your original sections -----
  let isAllDataPresent = true;

  if (!data.inspections_comments) {
    oTextArea.setValue("");
    oButtonSaveComment.setType("Default");
    oButtonSaveComment.setEnabled(true);
    oTextArea.setEditable(true);
    tabComments.setIconColor("Default");
    isAllDataPresent = false;
  } else {
    oTextArea.setValue(data.inspections_comments);
    oButtonSaveComment.setType("Accept");
    oButtonSaveComment.setEnabled(false);
    oTextArea.setEditable(false);
    tabComments.setIconColor("Positive");
  }

  if (!data.inspections_attachments) {
    oImagePictureProvided.setSrc("");
    oButtonCameraUpload.setEnabled(true);
    oButtonSavePicture.setType("Default");
    oButtonSavePicture.setEnabled(true);
    tabPicture.setIconColor("Default");
    oButtonSavePicture.setEnabled(false);
    isAllDataPresent = false;
  } else {
    oImagePictureProvided.setSrc(data.inspections_attachments);
    oButtonCameraUpload.setEnabled(false);
    oButtonSavePicture.setType("Accept");
    oButtonSavePicture.setEnabled(false);
    tabPicture.setIconColor("Positive");
  }

  if (!data.inspections_equipment_barcode_scan) {
    oInputScanResult.setValue("");
    oButtonStartScan.setEnabled(true);
    tabBarcode.setIconColor("Default");
    isAllDataPresent = false;
  } else {
    oInputScanResult.setValue(data.inspections_equipment_barcode_scan);
    oButtonStartScan.setEnabled(false);
    tabBarcode.setIconColor("Positive");
  }

  if (!data.inspections_signature) {
    oImageExisitingSignature.setSrc("");
    oButtonSignatureClear.setEnabled(true);
    oButtonSignatureOK.setType("Default");
    oButtonSignatureOK.setEnabled(true);
    tabSign.setIconColor("Default");
    oHTMLObjectSignaturePad.setVisible(true);
    isAllDataPresent = false;
  } else {
    oImageExisitingSignature.setSrc(data.inspections_signature);
    oButtonSignatureClear.setEnabled(false);
    oButtonSignatureOK.setType("Accept");
    oButtonSignatureOK.setEnabled(false);
    oHTMLObjectSignaturePad.setVisible(false);
    tabSign.setIconColor("Positive");
  }

  oTextIsAllDataPresent.setText(isAllDataPresent ? "true" : "false");
  checkIfReadyToSubmit();

  dbg("exit populateInspectionJobPage");
}

// ===========================================================
// SUBMIT CHECK
// ===========================================================
function checkIfReadyToSubmit() {
  let ready = true;
  if (tabComments.getIconColor() === "Default") ready = false;
  if (tabPicture.getIconColor() === "Default") ready = false;
  if (tabBarcode.getIconColor() === "Default") ready = false;
  if (tabSign.getIconColor() === "Default") ready = false;

  if (ready) {
    sap.m.MessageToast.show("Ready to submit!");
    oButtonSubmitInspection.setEnabled(true);
  } else {
    oButtonSubmitInspection.setEnabled(false);
  }
}