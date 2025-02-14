sap.ui.getCore().attachInit(function(data) {
    oHTMLObjectCameraUpload.setContent('<input type="file" accept="image/*" id="file-input"  style="display:none">')
});

// Event listener added in 'oIconTabBar-select' event

function handleFileSelect(f) {
    var reader = new FileReader();

    reader.onload = (function (theFile) {
        return function (e) {
            var binaryData = e.target.result;
            // Converting Binary Data to base 64
            var base64String = window.btoa(binaryData);

            var fullBase64picture = "data:image/png;base64," + base64String;

            //console.log(base64String)
            oImagePictureProvided.setSrc(fullBase64picture);

            oButtonSavePicture.setEnabled(true);
            //ImageBase64InvisiblePlaceholder.setText(fullBase64picture)

        };
    })(f);
    reader.readAsBinaryString(f);
}