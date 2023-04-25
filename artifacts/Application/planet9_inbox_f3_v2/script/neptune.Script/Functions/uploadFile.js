function uploadFile(event) {

    $.each(event.target.files, function(i, data) {

        var file = {
            name: data.name,
            description: "",
            objectKey: modeloPageDetail.oData.id,
            objectType: "P9INBOX",
            fileType: data.type,
            fileSize: data.size
        };

        try {
            var fileReader = new FileReader();

            fileReader.onload = function(fileData) {

                file.content = fileData.target.result;

                sap.n.Planet9.function({
                    id: "Gos",
                    method: "Save",
                    data: file,
                    success: function(data) {
                        ModelData.Add(oListAttachment, data);
                        oSectionAttachment.setVisible(true);
                    },
                    error: function(data) {
                        console.log(data);
                    }
                });

                document.getElementById("_wf_fileUploader").value = '';

            };
            fileReader.readAsDataURL(data);
        } catch (e) {
            try {} catch (e) {}
        }
    });

}

window.uploadFile = uploadFile;