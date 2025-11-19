// --- Get the details from the page
var detailPageData = modelequipmentDetailPage.getData();
console.log("--- detailsPageData ---");
console.log(detailPageData);

// --- Get the selected employee from the SelectEmployee selection box
console.log("--- Selected Employee ID + Name ---");
console.log(oSelectEmployee2.getSelectedKey());
console.log(oSelectEmployee2._getSelectedItemText());

// --- Create a new entry in the "inspections" table
// With Employee data + part_number
var options1 = {
    data: {
        "employeeID": oSelectEmployee2.getSelectedKey(),
        "employeeName": oSelectEmployee2._getSelectedItemText(),
        "part_number": detailPageData.part_number,
        "status": "Assigned",
    }
};
console.log(options1);

apiassignEquipmentToWorker(options1);
// ^^^ On success will close and navigate back to main page

// Update the "equipment" table for this piece of equipment
// Setting 'assigned_for_checking' to true
// and adding employee name to the equipment

var options2 = {
    parameters: {
        "where": JSON.stringify({"part_number": detailPageData.part_number})
    },
    data: {
        "assigned_for_checking": true,
        "assigned_to": oSelectEmployee2._getSelectedItemText()
    }
};
console.log(options2);

apiupdateEquipment(options2);