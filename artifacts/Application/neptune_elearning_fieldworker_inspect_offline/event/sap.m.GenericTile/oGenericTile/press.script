// Replace yourField with FieldName
var context = oEvent.oSource.getBindingContext();  
// Get Entire Model
var data = context.getObject();
console.log("--- Tile Data ---");
console.log(data);

if (data.inspections_status === "Assigned") {
    populateInspectionJobPage(data);
} else {
    //populateInspectionJobPage(data);
    sap.m.MessageToast.show("This inspection can't be changed.");
}

