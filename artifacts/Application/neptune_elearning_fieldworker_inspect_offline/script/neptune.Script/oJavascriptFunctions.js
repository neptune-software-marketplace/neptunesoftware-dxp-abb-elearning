/**
 * Inspection Job Page — Map + Offline Workflow
 * --------------------------------------------
 * Responsibilities
 *  - Initialise and maintain a single Leaflet map instance bound to `jobLocationMap`.
 *  - Work reliably in Launchpad, Designer (iframe) and offline runtime.
 *  - Populate the inspection detail page with data and UI state.
 *  - Collate partial inspection input and save as a draft (offline-aware).
 *  - Collate final inspection input and submit it (online).
 *  - Derive "ready to submit" state from the four sections:
 *      Comments, Picture, Barcode, Signature.
 *
 * Map handling
 *  - Uses a stable host div `<jobLocationMapId>-host` for Leaflet.
 *  - Loads Leaflet JS + CSS into the current frame if missing, with a minimal
 *    inline CSS fallback so tiles/markers render in Designer if the header tags
 *    are not applied inside the iframe.
 *  - Waits until the host has non-zero width/height before building the map.
 *  - Schedules the first build via observers + polling so it is safe when
 *    `onAfterRendering` is not fired as expected.
 *
 * Offline behaviour
 *  - `savePartialInspectionAndNavigate()`:
 *      - If `AppCache.isOffline` is true, updates `oModelArrayOfflineStorage`
 *        and writes back via `setCacheoModelArrayOfflineStorage()`.
 *      - If online, posts to the backend and refreshes the inspection list.
 *  - `submitInspection()` always posts to the backend and navigates back.
 */

// ===========================================================
// Global map state
// ===========================================================
let map;
let markerLayer;
let hostId;
let pendingView = null;

// ===========================================================
// DOM helpers
// ===========================================================
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
    host.style.width = "100%";
    containerEl.appendChild(host);
  } else if (host.parentNode !== containerEl) {
    containerEl.appendChild(host);
  }
  return host;
}

function waitUntilVisible(el, cb) {
  const ready = () =>
    el &&
    el.isConnected &&
    el.getBoundingClientRect().width > 0 &&
    el.getBoundingClientRect().height > 0;

  if (ready()) {
    cb();
    return;
  }

  let ro;
  try {
    ro = new ResizeObserver(() => {
      if (ready()) {
        ro.disconnect();
        cb();
      }
    });
    ro.observe(el);
  } catch {}

  let tries = 80;
  const t = setInterval(() => {
    if (ready()) {
      clearInterval(t);
      ro && ro.disconnect();
      cb();
    } else if (--tries <= 0) {
      clearInterval(t);
      ro && ro.disconnect();
    }
  }, 50);
}

// ===========================================================
// Leaflet loader (iframe-safe)
// ===========================================================
const LEAFLET_VER = "1.9.4";
const LEAFLET_JS = `https://unpkg.com/leaflet@${LEAFLET_VER}/dist/leaflet.js`;
const LEAFLET_CSS = `https://unpkg.com/leaflet@${LEAFLET_VER}/dist/leaflet.css`;

function ensureLeafletCssInline() {
  if (document.getElementById("leaflet-css-inline")) return;
  const style = document.createElement("style");
  style.id = "leaflet-css-inline";
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
  let cssReady = !!document.getElementById("leaflet-css");
  if (!cssReady) {
    const link = document.createElement("link");
    link.id = "leaflet-css";
    link.rel = "stylesheet";
    link.href = LEAFLET_CSS;
    link.onload = () => { cssReady = true; };
    document.head.appendChild(link);
  }
  ensureLeafletCssInline();

  if (window.L) {
    cssReady ? then() : setTimeout(then, 0);
    return;
  }

  if (!document.getElementById("leaflet-js")) {
    const s = document.createElement("script");
    s.id = "leaflet-js";
    s.src = LEAFLET_JS;
    s.onload = then;
    document.head.appendChild(s);
  } else {
    (function wait() {
      if (window.L) then();
      else setTimeout(wait, 40);
    })();
  }
}

// ===========================================================
// Map build / update
// ===========================================================
function performBuildOrUpdate(lat, lng) {
  const containerEl = getContainerEl();
  if (!containerEl) {
    oApp.to(viewInspectionJob);
    requestAnimationFrame(() => performBuildOrUpdate(lat, lng));
    return;
  }

  ensureLeaflet(() => {
    const host = ensureHostDiv(containerEl);

    waitUntilVisible(host, () => {
      // If UI5 detached the container, rebuild cleanly
      if (map && map.getContainer && !map.getContainer().isConnected) {
        try { map.remove(); } catch {}
        map = null;
        markerLayer = null;
      }

      if (!map) {
        map = L.map(host).setView([lat, lng], 13);

        // OpenStreetMap tiles (no token needed)
        L.tileLayer("https://tile.openstreetmap.org/{z}/{x}/{y}.png", {
          maxZoom: 19,
          attribution: "&copy; OpenStreetMap contributors"
        }).addTo(map);

        markerLayer = L.layerGroup().addTo(map);
      } else {
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

// ===========================================================
// First build scheduling (Designer-safe fallback)
// ===========================================================
let buildFallbackArmed = false;
function scheduleInitialBuild(lat, lng) {
  pendingView = { lat, lng };

  if (buildFallbackArmed) return;
  buildFallbackArmed = true;

  const tryBuildIfReady = () => {
    if (!pendingView) return;
    const containerEl = getContainerEl();
    if (!containerEl) return;
    const host = ensureHostDiv(containerEl);
    const r = host.getBoundingClientRect();
    if (r.width > 0 && r.height > 0) {
      const { lat, lng } = pendingView;
      pendingView = null;
      performBuildOrUpdate(lat, lng);
    }
  };

  let mo, ro;
  try {
    mo = new MutationObserver(() => tryBuildIfReady());
    mo.observe(document.body, { childList: true, subtree: true });
  } catch {}

  try {
    const watch = () => {
      const c = getContainerEl();
      if (!c) return;
      ro = new ResizeObserver(() => tryBuildIfReady());
      ro.observe(c);
    };
    setTimeout(watch, 0);
  } catch {}

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

// ===========================================================
// onAfterRendering hook
// ===========================================================
(function attachAfterRenderingOnce() {
  if (!jobLocationMap || !jobLocationMap.addEventDelegate) return;
  let attached = false;
  if (!attached) {
    jobLocationMap.addEventDelegate({
      onAfterRendering: function () {
        const containerEl = getContainerEl();
        if (!containerEl) return;
        ensureHostDiv(containerEl);
        if (pendingView) {
          const { lat, lng } = pendingView;
          pendingView = null;
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
// Page logic (offline-aware)
// ===========================================================
function populateInspectionJobPage(data) {
  // Navigate to detail view
  try {
    const current = oApp.getCurrentPage && oApp.getCurrentPage();
    if (!current || current.getId() !== viewInspectionJob.getId()) {
      oApp.to(viewInspectionJob);
    }
  } catch {
    oApp.to(viewInspectionJob);
  }

  // Bind data
  modelviewInspectionJob.setData(data);

  // Start on Comments tab
  oIconTabBar.setSelectedKey("COMM");

  // Map build path
  const lat = Number(data.equip_latitude);
  const lng = Number(data.equip_longitude);
  if (Number.isFinite(lat) && Number.isFinite(lng)) {
    if (!map) {
      scheduleInitialBuild(lat, lng);
    } else {
      performBuildOrUpdate(lat, lng);
    }
  }

  // ----- Inspection Data -----
  var isAllDataPresent = true;

  // Comments
  if (data.inspections_comments === null || data.inspections_comments === "") {
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

  // Picture
  if (data.inspections_attachments === null || data.inspections_attachments === "") {
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

  // Barcode
  if (data.inspections_equipment_barcode_scan === null || data.inspections_equipment_barcode_scan === "") {
    oInputScanResult.setValue("");
    oButtonStartScan.setEnabled(true);
    tabBarcode.setIconColor("Default");
    isAllDataPresent = false;
  } else {
    oInputScanResult.setValue(data.inspections_equipment_barcode_scan);
    oButtonStartScan.setEnabled(false);
    tabBarcode.setIconColor("Positive");
  }

  // Signature
  if (data.inspections_signature === null || data.inspections_signature === "") {
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

  // Invisible “complete” flag
  oTextIsAllDataPresent.setText(isAllDataPresent ? "true" : "false");

  checkIfReadyToSubmit();
}

// ===========================================================
// Readiness / collate / save / submit (offline-aware)
// ===========================================================
function checkIfReadyToSubmit() {
  let readyToSubmit = true;

  if (tabComments.getIconColor() === "Default") readyToSubmit = false;
  if (tabPicture.getIconColor() === "Default") readyToSubmit = false;
  if (tabBarcode.getIconColor() === "Default") readyToSubmit = false;
  if (tabSign.getIconColor() === "Default") readyToSubmit = false;

  if (readyToSubmit) {
    sap.m.MessageToast.show("Ready to submit!");
    oButtonSubmitInspection.setEnabled(true);
  } else {
    oButtonSubmitInspection.setEnabled(false);
  }
}

function collateInspectionData() {
  var inspectionObject = {};

  // Comments
  inspectionObject.comments =
    tabComments.getIconColor() === "Positive" ? oTextArea.getValue() : null;

  // Picture
  inspectionObject.attachments =
    tabPicture.getIconColor() === "Positive" ? oImagePictureProvided.getSrc() : null;

  // Barcode
  inspectionObject.equipment_barcode_scan =
    tabBarcode.getIconColor() === "Positive" ? oInputScanResult.getValue() : null;

  // Signature
  inspectionObject.signature =
    tabSign.getIconColor() === "Positive" ? oImageExisitingSignature.getSrc() : null;

  return inspectionObject;
}

function savePartialInspectionAndNavigate() {
  sap.m.MessageToast.show("Saving draft...");

  var draftData = collateInspectionData();
  var pageData = modelviewInspectionJob.getData();

  if (AppCache && AppCache.isOffline) {
    // Fully offline: update cached inspection array
    var offlineRecord = ModelData.Find(
      oModelArrayOfflineStorage,
      "inspections_id",
      pageData.inspections_id
    );

    if (offlineRecord && offlineRecord[0]) {
      offlineRecord[0].inspections_comments = draftData.comments;
      offlineRecord[0].inspections_attachments = draftData.attachments;
      offlineRecord[0].inspections_signature = draftData.signature;
      offlineRecord[0].inspections_equipment_barcode_scan =
        draftData.equipment_barcode_scan;

      ModelData.Update(
        oModelArrayOfflineStorage,
        "inspections_id",
        pageData.inspections_id,
        offlineRecord[0]
      );
      setCacheoModelArrayOfflineStorage();

      modeloListInspectionJobs.setData(
        modeloModelArrayOfflineStorage.getData()
      );
    }
  } else {
    // Online: update backend and refresh list
    var options = {
      parameters: { where: JSON.stringify({ id: pageData.inspections_id }) },
      data: draftData
    };
    apipostToInspectionTable(options);
    setTimeout(function () {
      apigetInspectionList();
    }, 100);
  }

  oApp.to(myInspectionJobs);
}

function submitInspection() {
  sap.m.MessageToast.show("Submitting Inspection...");

  var inspectionData = collateInspectionData();
  inspectionData.status = "Submitted";

  var pageData = modelviewInspectionJob.getData();

  var options = {
    parameters: { where: JSON.stringify({ id: pageData.inspections_id }) },
    data: inspectionData
  };

  apipostToInspectionTable(options);

  oApp.to(myInspectionJobs);
}