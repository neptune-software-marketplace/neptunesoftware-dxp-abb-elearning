/**
 * Inspection Job Page — Map + Workflow Orchestration
 * --------------------------------------------------
 * Responsibilities
 *  - Initialise and maintain a single Leaflet map instance bound to `jobLocationMap`.
 *  - Work reliably in both Launchpad and App Designer (iframe) runtimes.
 *  - Populate the inspection detail page with data and UI state.
 *  - Collate partial inspection input and save as a draft.
 *  - Collate final inspection input and submit it.
 *  - Derive "ready to submit" state from the four sections:
 *      Comments, Picture, Barcode, Signature.
 *
 * Map handling
 *  - `getContainerEl()` resolves the UI5 control DOM for `jobLocationMap`.
 *  - `ensureHostDiv()` creates a stable `<div id="<controlId>-host">` for Leaflet
 *    so we are independent of UI5’s internal DOM.
 *  - `ensureLeaflet()` guarantees Leaflet JS + CSS exist in the current frame
 *    (Designer preview runs inside an iframe, so header tags are not enough).
 *  - `waitUntilVisible()` waits until the host has non-zero width/height before
 *    creating or updating the map to avoid the “zero-size map” problem.
 *  - `scheduleInitialBuild()` stores the target lat/lng and uses
 *    MutationObserver, ResizeObserver, and a short polling loop to trigger the
 *    first map build even when `onAfterRendering` does not fire as expected.
 *  - `performBuildOrUpdate()` (re)uses a single global `map` instance, recenters
 *    the view, and recreates the marker each time an inspection is opened.
 *
 * Page behaviour
 *  - `populateInspectionJobPage(data)`:
 *      - Navigates to the inspection detail page if needed.
 *      - Binds the `data` object to `modelviewInspectionJob`.
 *      - Selects the Comments tab by default.
 *      - Triggers initial map build or update based on `data.equip_latitude`
 *        and `data.equip_longitude`.
 *      - For each section (Comments, Picture, Barcode, Signature), sets the
 *        control values and icon colour (Positive/Default) based on whether
 *        data is present.
 *      - Sets `oTextIsAllDataPresent` to "true"/"false" as a simple flag.
 *      - Calls `checkIfReadyToSubmit()` to enable/disable the submit button.
 *
 * Draft and submit
 *  - `collateInspectionData()` reads current UI state and returns a plain object
 *    with `comments`, `attachments`, `equipment_barcode_scan` and `signature`
 *    (null when the relevant tab is not in a saved/Positive state).
 *  - `savePartialInspectionAndNavigate()`:
 *      - Builds the draft object.
 *      - Updates the inspection row via `apipostToInspectionTable`.
 *      - Navigates back to `myInspectionJobs` and refreshes the list.
 *  - `submitInspection()`:
 *      - Builds the final object.
 *      - Sets `status = "Submitted"`.
 *      - Updates the inspection row via `apipostToInspectionTable`.
 *      - Navigates back to `myInspectionJobs`.
 *
 * Readiness check
 *  - `checkIfReadyToSubmit()`:
 *      - Checks the icon colour of the four tabs.
 *      - Enables the Submit button and shows “Ready to submit!” only when all
 *        four sections are marked Positive.
 */

let map;
let markerLayer;
let hostId;
let pendingView = null;

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

// ---------- Leaflet loader (CSS + minimal inline fallback) ----------
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

// ---------- Map build/update ----------
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
      if (map && map.getContainer && !map.getContainer().isConnected) {
        try { map.remove(); } catch {}
        map = null;
        markerLayer = null;
      }

      if (!map) {
        map = L.map(host).setView([lat, lng], 13);
        L.tileLayer("https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png", {
          maxZoom: 20,
          attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors &copy; <a href="https://carto.com/attributions">CARTO</a>',
          subdomains: "abcd"
        }).addTo(map);

        markerLayer = L.layerGroup().addTo(map);
      } else {
        map.invalidateSize();
        map.setView([lat, lng], 13);
      }

      markerLayer.clearLayers();
      L.marker([lat, lng]).addTo(markerLayer);

      requestAnimationFrame(() => { if (map) map.invalidateSize(); });
    });
  });
}

// ---------- Scheduling (Designer fallback) ----------
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

  let mo;
  try {
    const root = document.body;
    mo = new MutationObserver(() => tryBuildIfReady());
    mo.observe(root, { childList: true, subtree: true });
  } catch {}

  let ro;
  try {
    const containerEl = () => getContainerEl();
    const watch = () => {
      const c = containerEl();
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

// ---------- onAfterRendering hook ----------
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
// POPULATE PAGE FUNCTION
// ===========================================================
function populateInspectionJobPage(data) {
  // Navigate to detail view
  try {
    const current = oApp.getCurrentPage && oApp.getCurrentPage();
    if (!current || current.getId() !== viewInspectionJob.getId()) {
      oApp.to(viewInspectionJob);
    }
  } catch (e) {
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

  // ----- Original sections -----
  let isAllDataPresent = true;

  // 1/4 - Comments
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

  // 2/4 - Picture
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

  // 3/4 - Barcode
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

  // 4/4 - Signature
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
}

// ===========================================================
// COLLATE + SAVE + SUBMIT
// ===========================================================
function collateInspectionData() {
  var inspectionObject = {};

  // 1/4 - Comments
  inspectionObject.comments =
    tabComments.getIconColor() === "Positive" ? oTextArea.getValue() : null;

  // 2/4 - Picture
  inspectionObject.attachments =
    tabPicture.getIconColor() === "Positive" ? oImagePictureProvided.getSrc() : null;

  // 3/4 - Barcode
  inspectionObject.equipment_barcode_scan =
    tabBarcode.getIconColor() === "Positive" ? oInputScanResult.getValue() : null;

  // 4/4 - Signature
  inspectionObject.signature =
    tabSign.getIconColor() === "Positive" ? oImageExisitingSignature.getSrc() : null;

  return inspectionObject;
}

function savePartialInspectionAndNavigate() {
  sap.m.MessageToast.show("Saving draft...");

  var draftData = collateInspectionData();
  var pageData = modelviewInspectionJob.getData();

  var options = {
    parameters: {
      "where": JSON.stringify({ id: pageData.inspections_id })
    },
    data: draftData
  };

  apipostToInspectionTable(options);

  oApp.to(myInspectionJobs);
  apigetInspectionList();
}

function submitInspection() {
  sap.m.MessageToast.show("Submitting Inspection...");

  var inspectionData = collateInspectionData();
  inspectionData.status = "Submitted";

  var pageData = modelviewInspectionJob.getData();

  var options = {
    parameters: {
      "where": JSON.stringify({ id: pageData.inspections_id })
    },
    data: inspectionData
  };

  apipostToInspectionTable(options);

  oApp.to(myInspectionJobs);
}

// ===========================================================
// SUBMIT CHECK
// ===========================================================
function checkIfReadyToSubmit() {
  var readyToSubmit = true;

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