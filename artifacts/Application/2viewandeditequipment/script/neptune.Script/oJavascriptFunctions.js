// --- PDF Handling ---
//To display the pdf we need to represent it as a data URL.
function createDataURL(pdf){
    //Register BLOBs on the application.
    jQuery.sap.addUrlWhitelist("blob");
    //convert the base64 to binary and insert it in a byte array.
    var decodedPdfContent = atob(pdf);
    var byteArray = new Uint8Array(decodedPdfContent.length)
    for(var i=0; i<decodedPdfContent.length; i++){
        byteArray[i] = decodedPdfContent.charCodeAt(i);
    }
    //create a BLOB and a URL
    var blob = new Blob([byteArray.buffer], { type: 'application/pdf' });
    var pdfurl = URL.createObjectURL(blob);

    return pdfurl;
}

function updateEquipment(){
    
    // Clear all current ValueStates
    inputName.setValueState("None");
    inputPN.setValueState("None");
    inputLat.setValueState("None");
    inputLong.setValueState("None");
    datePickerCheckup.setValueState("None");

    // **** VALIDATION SECTION ******
    if (inputName.getValue() === ""){inputName.setValueState("Error"),sap.m.MessageToast.show("Please provide a Name");return};
    if (inputPN.getValue() === ""){inputPN.setValueState("Error"),sap.m.MessageToast.show("Please provide a Part Number");return};
    if (inputLat.getValue() === ""){inputLat.setValueState("Error"),sap.m.MessageToast.show("Please provide a Latitude");return};
    if (inputLong.getValue() === ""){inputLong.setValueState("Error"),sap.m.MessageToast.show("Please provide a Longitude");return};
    if (datePickerCheckup.getValue() === ""){datePickerCheckup.setValueState("Error"),sap.m.MessageToast.show("Please provide a Installation Date");return};
    if (sliderInterval.getValue() === 0){sap.m.MessageToast.show("Please provide a Service Interval");return};

    let final_data = {}

    // Get ID from the page model
    // (This is set when equipment is selected on the 'mainListPage')
    final_data.id = modelequipmentDetailPage.getData().id;

    // --- Including the ID in the data object, allows the API to know which record to update
    // --- If you don't include the ID, the PUT API won't find a record, so will create a new one!

    // Get the rest of the values from the SimpleForms
    final_data.name = inputName.getValue();
    final_data.part_number = inputPN.getValue();
    final_data.latitude = inputLat.getValue();
    final_data.longitude = inputLong.getValue();
    final_data.checkup_date = datePickerCheckup.getValue();
    final_data.checkup_interval = sliderInterval.getValue();

    console.log("--- final_data sent via Update API ---");
    console.log(final_data);

    var options = {
        data: final_data
    };

    apiupdateEquipment(options);

    lockUnlock();
}

// --- Used on equipmentDetailPage ---
function lockUnlock(){
    if (oButtonLockUnlock.getType() === "Reject") {

        oButtonLockUnlock.setType("Accept");
        oButtonLockUnlock.setIcon("sap-icon://fa-solid/lock-open");

        oButtonAssignCheckToWorker.setEnabled(false);
        equipmentDetailPage.setShowNavButton(false);

        inputName.setEditable(true);
        inputPN.setEditable(true);
        inputLat.setEditable(true);
        inputLong.setEditable(true);
        datePickerCheckup.setEditable(true);

        sliderInterval.setEnabled(true);
        buttonUpdateInformation.setEnabled(true);

    } else {

        oButtonLockUnlock.setType("Reject");
        oButtonLockUnlock.setIcon("sap-icon://fa-solid/lock");

        oButtonAssignCheckToWorker.setEnabled(true);
        equipmentDetailPage.setShowNavButton(true);

        inputName.setEditable(false);
        inputPN.setEditable(false);
        inputLat.setEditable(false);
        inputLong.setEditable(false);
        datePickerCheckup.setEditable(false);

        sliderInterval.setEnabled(false);
        buttonUpdateInformation.setEnabled(false);
    }
};

function findAllFieldWorkers(){
    var options = {
        data: {"id":"429dc3f7-4ee3-ed11-9f73-000d3a672630"}
    };

    apigetListOfFieldWorkers(options);

    oDialogAssign.open();
}