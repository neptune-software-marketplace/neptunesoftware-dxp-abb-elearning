

var binding = equipList.getBinding("items");
var filter = new sap.ui.model.Filter({
    filters: [
        new sap.ui.model.Filter("name", "Contains", this.getValue()),
        new sap.ui.model.Filter("part_number", "Contains", this.getValue())
    ],
    and: false
})
binding.filter([filter]);