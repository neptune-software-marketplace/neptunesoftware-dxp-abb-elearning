if (sap.n) {
    neptune.Shell.attachBeforeDisplay((data) => {
        console.log("WORKFLOW DATA IN APP:");

        var options = {
        parameters: {
            "where": JSON.stringify({"part_number": data.objectKey,"status": "Submitted"})
            }
        };
        
        apioRestAPIInspectionGet(options);
        jQuery.sap.addUrlWhitelist("blob");
})};