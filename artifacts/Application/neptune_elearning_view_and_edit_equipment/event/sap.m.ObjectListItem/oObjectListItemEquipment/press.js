// Get Binding Context
var context = oEvent.oSource.getBindingContext();
// Get Entire Model
var data = JSON.parse(JSON.stringify(context.getObject()));

console.log("--- Page Data ---");
console.log(data);

// At this point, "data" = the information stored in the clicked ListItem

// Push it into the equipmentDetailPage - So bindings can be used
modelequipmentDetailPage.setData(data);

// --- PDF Handling ---
// If there is pdf data present in the listItem?
if (data.pdf){
    var pdfurl = createDataURL(data.pdf);
    oPDFViewer.setSource(pdfurl);
    oPanelDocuments.setVisible(true);
}

// --- IF assigned to an employee - Hide Assign control and show AssignedTo text
if (data.assigned_for_checking === true) {
    oTextAssignedTo.setText("Assigned to: " + data.assigned_to)

    oHBoxAssignedTo.setVisible(true);
    oHBoxAssignLockUpdate.setVisible(false);

} else {
    oHBoxAssignedTo.setVisible(false);
    oHBoxAssignLockUpdate.setVisible(true);
}

// Navigate
oApp.to(equipmentDetailPage);