if (typeof days_until_check === "undefined" || days_until_check === null || days_until_check === "") { return; }  

if (days_until_check > 1){
    var formattedText = "Success"
}
else {
    var formattedText = "Error"; 
}

return formattedText;