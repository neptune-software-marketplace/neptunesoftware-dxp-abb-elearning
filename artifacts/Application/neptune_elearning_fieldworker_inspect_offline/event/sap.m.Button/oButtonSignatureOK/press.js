if (signaturePad.isEmpty()) {
    sap.m.MessageToast.show("Please sign!");
} else {

    var signatureBase64 = signaturePad.toDataURL();
    oImageExisitingSignature.setSrc(signatureBase64);
    sap.m.MessageToast.show("Signature saved into base64");

    oButtonSignatureClear.setEnabled(false);

    oButtonSignatureOK.setType("Accept")
    oButtonSignatureOK.setEnabled(false);

    oHTMLObjectSignaturePad.setVisible(false)

    tabSign.setIconColor("Positive");

    checkIfReadyToSubmit();
}
