if (sap.n) {
    sap.n.Shell.attachInit(function (data) {
        console.log("WORKFLOW DATA IN APP:");

        var options = {
        parameters: {
            "where": JSON.stringify({"part_number": data.objectKey,"status": "Submitted"})
            }
        };
        


        apioRestAPIInspectionGet(options);
        jQuery.sap.addUrlWhitelist("blob");
})};