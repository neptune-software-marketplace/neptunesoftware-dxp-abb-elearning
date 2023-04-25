sap.n.Planet9.function({
    id: "WorkflowInbox",
    method: "List",
    success: function(data) {
        tileNumber.setText(data.length);
    }
});