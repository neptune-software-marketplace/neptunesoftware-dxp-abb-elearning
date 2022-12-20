function submit(){

    inputName.setValueState("None");
    inputPN.setValueState("None");
    inputLat.setValueState("None");
    inputLong.setValueState("None");
    datePickerCheckup.setValueState("None");

    // **** VALIDATION SECTION ******
    //Return to get out of the script.
    if (inputName.getValue() === ""){
        inputName.setValueState("Error")
        sap.m.MessageToast.show("Please provide a Name");
        return
    };

    if (inputPN.getValue() === ""){
        inputPN.setValueState("Error")
        sap.m.MessageToast.show("Please provide a Part Number");
        return
    };

    if (inputLat.getValue() === ""){
        inputLat.setValueState("Error")
        sap.m.MessageToast.show("Please provide a Latitude");
        return
    };

    if (inputLong.getValue() === ""){
        inputLong.setValueState("Error")
        sap.m.MessageToast.show("Please provide a Longitude");
        return
    };

    if (datePickerCheckup.getValue() === ""){
        datePickerCheckup.setValueState("Error")
        sap.m.MessageToast.show("Please provide a Installation Date");
        return
    };

    if (sliderInterval.getValue() === 0){
        sap.m.MessageToast.show("Please provide a Service Interval");
        return
    };

    // Create the empty Object
    let final_data = {}

    final_data.name = inputName.getValue();
    final_data.part_number = inputPN.getValue();
    final_data.latitude = inputLat.getValue();
    final_data.longitude = inputLong.getValue();

    // NOTE: getDateValue(), instead of .getValue()
    final_data.checkup_date = datePickerCheckup.getDateValue();

    final_data.checkup_interval = sliderInterval.getValue();

    final_data.assigned_for_checking = false;

    //PDF is optional
    final_data.pdf = pdfEncoding.getText() ? pdfEncoding.getText() : "" ;

    console.log(final_data);

    var options = 
        {
            data: final_data
        };

    apiaddEquipment(options);

}


function clearForm(){

    let getValcomponents = [inputName, inputPN, inputLat, inputLong, datePickerCheckup, sliderInterval];
    
    //Arrow function
    getValcomponents.forEach(component => component.setValue(""));

    sliderInterval.setValue(0);
    labelDays.setText("Service interval")

    oPDFViewer.setSource("");
    oPDFViewer.setVisible(false);
    pdfEncoding.setText("");
    pdfUpload.setValue("");
    pdfUpload.setVisible(false);
    checkboxSelected.setSelected(false);
    
}
