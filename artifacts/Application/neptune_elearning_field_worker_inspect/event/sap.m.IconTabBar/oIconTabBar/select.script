if (oEvent.getParameters().key === 'PIC') {

    const fileInput = oFlexBoxCameraUpload.getDomRef();
    fileInput.addEventListener('change', (e) => handleFileSelect(e.target.files[0]));

}

if (oEvent.getParameters().key === 'SIGN') {

    var canvas = document.getElementById('signature-pad');
    signaturePad = new SignaturePad(canvas, {
        backgroundColor: 'rgba(255, 255, 255)',
        penColor: 'rgb(0, 0, 0)'
    });

}