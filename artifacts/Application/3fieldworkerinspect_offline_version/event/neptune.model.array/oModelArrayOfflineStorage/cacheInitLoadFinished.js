var inspectionData = modeloModelArrayOfflineStorage.getData();

console.log("Offline inspectionData:");
console.log(inspectionData);
console.log("-----");

if (AppCache.isOffline) {

    console.log("Offline...");

    console.log("Setting data...")
    modeloListInspectionJobs.setData(inspectionData)

} else {

    console.log("Online...");

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

        //apigetInspectionList();

    }

    
    // Then fetch the DB
    apigetInspectionList();


    

}
