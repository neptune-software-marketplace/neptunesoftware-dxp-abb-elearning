if (AppCache.isOffline) {

    sap.m.MessageToast.show("You are offline!");
    
} else {

    var wfData = {
        "id": "fc364970-4898-41e3-89ee-53e1a5f41eb5",
        "objectType": oObjectAttributeEquipmentName.getText(),
        "objectKey": oObjectAttributePartNumber.getText(),
        "amount": oObjectAttributeEquipmentName.getText(),
        "currency": "",
        "approver": ""
    }
    $.ajax({
        type: "POST",
        contentType: "application/json",
        url: "/api/functions/WorkflowInbox/Start",
        data: JSON.stringify(wfData),

        success: function(data) {
            submitInspection()
        },
        error: function(result, status) {
            sap.m.MessageToast.show("Failed to submit...");
        }

    });

}
