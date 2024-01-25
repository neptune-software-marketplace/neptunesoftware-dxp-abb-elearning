var wfData = {
    "id": "c90c723a-682f-ed11-a27c-0050f27989a1",
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
