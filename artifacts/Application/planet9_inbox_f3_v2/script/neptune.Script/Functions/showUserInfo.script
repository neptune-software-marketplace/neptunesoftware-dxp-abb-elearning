function showUserInfo(username, object) {
    
    var rec = {};
    rec.username = username;
    
    sap.n.Planet9.function({
        id: "User",
        method: "Show",
        data: rec,
        success: function(data) {
            modelpopUserInfo.setData(data);
            popUserInfo.openBy(object);
        },
        error: function(data) {

        }
    });
}