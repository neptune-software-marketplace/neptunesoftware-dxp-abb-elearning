// Globals
var helper;
var layout;
var groupedInbox;
var currTaskTitle = "";

jQuery.sap.require("sap.ui.core.format.FileSizeFormat");
jQuery.sap.require("sap.ui.layout.cssgrid.GridBoxLayout");

var oFileSizeFormat = sap.ui.core.format.FileSizeFormat.getInstance({
    binaryFilesize: false,
    decimals: 2
});

if (sap.n) {
    var localViewID = this.getId();

    sap.n.Shell.attachBeforeDisplay(function(startParams) {
        oButUpdate.firePress()
    });
}

// InitLoad
sap.ui.getCore().attachInit(function () {

    setTimeout(function () {

        // Initialize Layout helper
        InitButControl();
        jQuery.sap.require("sap.f.FlexibleColumnLayoutSemanticHelper");
        var oSettings = {
            defaultTwoColumnLayoutType: sap.f.LayoutType.TwoColumnsMidExpanded,
            defaultThreeColumnLayoutType: sap.f.LayoutType.ThreeColumnsMidExpanded
        };
        helper = new sap.f.FlexibleColumnLayoutSemanticHelper.getInstanceFor(oLayoutMain, oSettings);


        // Intial with Master Section only
        layout = helper.getNextUIState(0);
        oLayoutMain.setLayout(layout.layout);

        // Sort Inbox
        var oSorter = new sap.ui.model.Sorter("overDueDate", false, false);
        var binding = oListWorkflow.getBinding("items");
        binding.sort(oSorter);

        // Sort Notes
        var oSorter = new sap.ui.model.Sorter("createdAt", true, false);
        var binding = oListNotes.getBinding("items");
        binding.sort(oSorter);

        // Sort Log
        var oSorter = new sap.ui.model.Sorter("sort", false, false);
        var binding = tabLog.getBinding("items");
        binding.sort(oSorter);

        var boxLayout = new sap.ui.layout.cssgrid.GridBoxLayout({ boxMinWidth: "20rem" });
        oGridList.setCustomLayout(boxLayout);

    }, 200);
});



function isCordova() {
    if (window.hasOwnProperty("cordova") || typeof (cordova) == "object") {
        return true;
    } else {
        return false;
    }
}
