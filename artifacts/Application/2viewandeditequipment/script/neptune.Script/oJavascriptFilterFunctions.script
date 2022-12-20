// --- Filter Functions ---
function removeFilter(){
    var binding = equipList.getBinding("items");
        binding.filter([""]);
}

function showAssigned(){
    var binding = equipList.getBinding("items");
    var filter = new sap.ui.model.Filter("assigned_for_checking", "EQ", true);
    binding.filter([filter]);
}

function showUnassigned(){
    var binding = equipList.getBinding("items");
    var filter = new sap.ui.model.Filter("assigned_for_checking", "EQ", false);
    binding.filter([filter]);
}