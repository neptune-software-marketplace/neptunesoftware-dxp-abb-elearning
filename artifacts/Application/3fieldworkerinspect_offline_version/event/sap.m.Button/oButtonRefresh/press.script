if (AppCache.isOffline) {
    sap.m.MessageToast.show("You are offline!");
} else {

    var inspectionData = modeloModelArrayOfflineStorage.getData();
    // Push offline data to DB
    for (let i = 0; i < inspectionData.length; i++) {

        var tempObj = {};

        tempObj.comments = inspectionData[i].inspections_comments;
        tempObj.attachments = inspectionData[i].inspections_attachments;
        tempObj.signature = inspectionData[i].inspections_signature;
        tempObj.equipment_barcode_scan = inspectionData[i].inspections_equipment_barcode_scan;

        var options = {
            parameters: {
                "where": JSON.stringify({"id": inspectionData[i].inspections_id})
            },
            data: tempObj
        };
    

        // Remove AjaxSuccess apigetInspectionList(); with this updated logic
        apipostToInspectionTable(options);

    }

    setTimeout(function() {

        apigetInspectionList();

    }, 100);

    sap.m.MessageToast.show("Data updated");
}