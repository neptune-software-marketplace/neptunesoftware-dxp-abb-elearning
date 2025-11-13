var anySavedData = false;

if (tabComments.getIconColor() === "Positive") {anySavedData = true;}
if (tabPicture.getIconColor() === "Positive") {anySavedData = true;}
if (tabBarcode.getIconColor() === "Positive") {anySavedData = true;}
if (tabSign.getIconColor() === "Positive") {anySavedData = true;}

// If loading a complete draft, don't show the navigation warning
if (oTextIsAllDataPresent.getText() === "true") {
    var anySavedData = false;
}

// ---
if (anySavedData === true) {
    jQuery.sap.require("sap.m.MessageBox");
    sap.m.MessageBox.confirm(
        "Are you sure you want to exit this inspection?\n\nAny saved data will be stored as a draft.\nAny unsaved data will be discarded.", {
            actions: ["Yes", "Cancel"],
            onClose: function(sAction) {
                if (sAction === "Yes") {
                    savePartialInspectionAndNavigate();
                } else {
                    return;
                }
            }
        }
    );
} else {
    // Navigate and re-trigger getInspectionList
    oApp.to(myInspectionJobs);
    apigetInspectionList();
}

