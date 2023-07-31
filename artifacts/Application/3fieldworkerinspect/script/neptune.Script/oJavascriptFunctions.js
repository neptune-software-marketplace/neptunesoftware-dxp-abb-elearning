// Map variable requires declaring!
var Map;

// IF in launchpad, get the ID
if (sap.n) {
    var localViewID = this.getId();
}

function populateInspectionJobPage(data) {

    // Set 'data' to the Page Model
    modelviewInspectionJob.setData(data);

    // Always start on the (first) Comments panel
    oIconTabBar.setSelectedKey("COMM");

    // ----- MAP -----
    // Check if Map component exists
    var jobLocationMapDiv = jobLocationMap.getDomRef()
    console.log("jobLocationMapDiv:")
    console.log(jobLocationMapDiv)
    
     // If NOT already rendered on the page...
    if (jobLocationMapDiv === null) {
        // --- Build Map ---
        console.log("Build Map");

        // Navigate to the page
        // (Need to load the page before we can set the map)
        oApp.to(oPageViewInspectionJob);

        // Check if running on a Launchpad...
        // Handle the localViewID prefix if so
        if (sap.n) {
            var reference = localViewID + "--jobLocationMap";
        } else {
            var reference = "jobLocationMap";
        }

        console.log(reference);

        setTimeout(function () {
            // setView(Lat, Long , Zoom level)
            map = L.map(reference).setView([data.equip_latitude, data.equip_longitude], 13);

            L.tileLayer("https://tile.openstreetmap.org/{z}/{x}/{y}.png", {
                maxZoom: 19,
                attribution:
                    '&copy; <a href="http://www.openstreetmap.org/copyright">OpenStreetMap</a>',
            }).addTo(map);

            L.marker([data.equip_latitude, data.equip_longitude]).addTo(map);
        }, 100);
    } else {
        // --- Update Map ---

        console.log("Update Map")


        setTimeout(function () {
            map.setView([data.equip_latitude, data.equip_longitude], 13);
            L.marker([data.equip_latitude, data.equip_longitude]).addTo(map);
        }, 100);
        // Navigate to the page
        oApp.to(oPageViewInspectionJob);
    }

    // ----- Inspection Data -----
    // Check if any inspection data is already present, if so, 
    // populate and the mark section complete

    // Flag - Will be set to false if any data 
    // (from the Comments, Attachments, Barcode & Signature)
    // isn't present..
    var isAllDataPresent = true;

    // For each section
    // If the data is missing, reset the page...
    // If the data is present, set it to the correct component!
    // 1/4 - Comments
    if (data.inspections_comments === null || data.inspections_comments === "") {
        oTextArea.setValue("")
        oButtonSaveComment.setType("Default")
        oButtonSaveComment.setEnabled(true);
        oTextArea.setEditable(true);
        tabComments.setIconColor("Default");

        isAllDataPresent = false;
    } else {
        oTextArea.setValue(data.inspections_comments)
        oButtonSaveComment.setType("Accept")
        oButtonSaveComment.setEnabled(false);
        oTextArea.setEditable(false);
        tabComments.setIconColor("Positive");
    }

    // 2/4 - Picture
    if (data.inspections_attachments === null || data.inspections_attachments === "") {
        oImagePictureProvided.setSrc("")
        oButtonCameraUpload.setEnabled(true);
        oButtonSavePicture.setType("Default")
        oButtonSavePicture.setEnabled(true);
        tabPicture.setIconColor("Default");
        oButtonSavePicture.setEnabled(false);

        isAllDataPresent = false;
    } else {
        oImagePictureProvided.setSrc(data.inspections_attachments)
        //ImageBase64InvisiblePlaceholder.setText(data.inspections_attachments)
        oButtonCameraUpload.setEnabled(false);
        oButtonSavePicture.setType("Accept")
        oButtonSavePicture.setEnabled(false);
        tabPicture.setIconColor("Positive");
    }

    // 3/4 - Barcode
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

    // 4/4 - Signature
    if (data.inspections_signature === null || data.inspections_signature === "") {
        oImageExisitingSignature.setSrc("");
        oButtonSignatureClear.setEnabled(true);
        oButtonSignatureOK.setType("Default")
        oButtonSignatureOK.setEnabled(true);
        tabSign.setIconColor("Default");
        oHTMLObjectSignaturePad.setVisible(true);

        isAllDataPresent = false;
    } else {
        oImageExisitingSignature.setSrc(data.inspections_signature);
        oButtonSignatureClear.setEnabled(false);
        oButtonSignatureOK.setType("Accept")
        oButtonSignatureOK.setEnabled(false);
        oHTMLObjectSignaturePad.setVisible(false);
        tabSign.setIconColor("Positive");
    }

    // After loading in the data, if all data is present
    // Set an invisible text element in the page footer to 'true'
    if (isAllDataPresent === true) {
        oTextIsAllDataPresent.setText("true");
    } else {
        oTextIsAllDataPresent.setText("false");
    }
    // This is so when navigating away from a complete inspection draft
    // No navigation confirmation box will be shown

    checkIfReadyToSubmit();

}

function checkIfReadyToSubmit() {

    var readyToSubmit = true;

    // Check state of each tab
    if (tabComments.getIconColor() === "Default") {readyToSubmit = false;}
    if (tabPicture.getIconColor() === "Default") {readyToSubmit = false;}
    if (tabBarcode.getIconColor() === "Default") {readyToSubmit = false;}
    if (tabSign.getIconColor() === "Default") {readyToSubmit = false;}

    if (readyToSubmit === true) {
        sap.m.MessageToast.show("Ready to submit!");
        oButtonSubmitInspection.setEnabled(true);
    } else {
        oButtonSubmitInspection.setEnabled(false);
    }
}

function collateInspectionData() {

    var inspectionObject = {}

    //Check if saved data present
    if (tabComments.getIconColor() === "Positive") {inspectionObject.comments = oTextArea.getValue()
    } else {inspectionObject.comments = null};

    // if (tabPicture.getIconColor() === "Positive") {inspectionObject.attachments2 = ImageBase64InvisiblePlaceholder.getText()
    // } else {inspectionObject.attachments2 = null}

    if (tabPicture.getIconColor() === "Positive") {inspectionObject.attachments = oImagePictureProvided.getSrc()
    } else {inspectionObject.attachments = null}


    if (tabBarcode.getIconColor() === "Positive") {inspectionObject.equipment_barcode_scan = oInputScanResult.getValue()
    } else {inspectionObject.equipment_barcode_scan = null}

    if (tabSign.getIconColor() === "Positive") {inspectionObject.signature = oImageExisitingSignature.getSrc()
    } else {inspectionObject.signature = null}

    return inspectionObject;

}

function savePartialInspectionAndNavigate() {

    sap.m.MessageToast.show("Saving draft...");

    var draftData = collateInspectionData();
    console.log("draftData:");
    console.log(draftData);

    var pageData = modelviewInspectionJob.getData();
    

    // Update inspection record with data
    var options = {
        parameters: {
            //"where": JSON.stringify({"part_number": oObjectAttributePartNumber.getText()})
            "where": JSON.stringify({"id": pageData.inspections_id})
        },
        data: draftData
    };
    apipostToInspectionTable(options);
    

    // Navigate and re-trigger getInspectionList
    oApp.to(myInspectionJobs);
    apigetInspectionList();

}

function submitInspection() {

    sap.m.MessageToast.show("Submitting Inspection...");

    var inspectionData = collateInspectionData();
    inspectionData.status = "Submitted";

    var pageData = modelviewInspectionJob.getData();

    // Update inspection record with data
    var options = {
        parameters: {
            //"where": JSON.stringify({"part_number": oObjectAttributePartNumber.getText()})
            "where": JSON.stringify({"id": pageData.inspections_id})
        },
        data: inspectionData
    };

    apipostToInspectionTable(options);

    // Navigate and re-trigger getInspectionList
    oApp.to(myInspectionJobs);

}