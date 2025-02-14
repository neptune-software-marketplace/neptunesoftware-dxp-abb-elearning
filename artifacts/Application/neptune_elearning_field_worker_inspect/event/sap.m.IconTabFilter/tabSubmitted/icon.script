if (typeof inspections_status === "undefined" || inspections_status === null || inspections_status === "") { return; }  

if (inspections_status === "Assigned") {
    var formattedText = "sap-icon://activity-individual";
    this.setIconColor('Default');
}

if (inspections_status === "Submitted") {
    var formattedText = "sap-icon://pending"; 
    this.setIconColor('Critical');
}

if (inspections_status === "Complete") {
    var formattedText = "sap-icon://complete";
    this.setIconColor('Positive');
}

if (inspections_status === "Rejected") {
    var formattedText = "sap-icon://fa-regular/window-close"; 
    this.setIconColor('Negative');
}

return formattedText;