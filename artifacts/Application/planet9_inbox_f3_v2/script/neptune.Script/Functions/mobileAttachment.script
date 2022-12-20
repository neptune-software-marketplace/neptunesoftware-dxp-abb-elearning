// var attachmentDataArray = [];

// ---------------------------------------------------
// Common functions
// ---------------------------------------------------
function attachmentMakeBinary(fileData) {

    var raw = window.atob(fileData);
    var rawLength = raw.length;

    var array = new Uint8Array(rawLength);

    for (i = 0; i < rawLength; i++) {
        array[i] = raw.charCodeAt(i);
    }

    return array;

}


// ---------------------------------------------------
// Open mobile native PDF Reader
// ---------------------------------------------------
function attachmentNativeOpen(fileData, fileType, fileName) {

    var attachmentNativeDir = "";
    var attachmentDataArray = attachmentMakeBinary(fileData);

    // Set Directory
    switch (sap.ui.Device.os.name) {

        case 'Android':
            attachmentNativeDir = cordova.file.externalCacheDirectory;
            break;

        case 'iOS':
            attachmentNativeDir = cordova.file.tempDirectory;
            break;

        case 'winphone':
            attachmentNativeDir = cordova.file.externalCacheDirectory;
            break;

        case 'win':
            attachmentNativeDir = cordova.file.cacheDirectory;
            break;

        default:
            break;

    }

    // Create and Display File
    window.resolveLocalFileSystemURL(attachmentNativeDir, function(dir) {
        dir.getFile(fileName, {
            create: true
        }, function(file) {

            file.createWriter(function(fileWriter) {

                fileWriter.onwriteend = function(e) {
                    cordova.plugins.fileOpener2.open(
                        attachmentNativeDir + fileName,
                        fileType, {
                            error: function(e) {
                                console.log('Error open: ' + e.status + ' - Error message: ' + e.message);
                            }
                        }
                    );
                };

                fileWriter.onerror = function(e) {
                    console.log(e);
                };

                var blob = new Blob([attachmentDataArray], {
                    type: fileType
                });

                fileWriter.write(blob);

            }, function(e) {
                console.log('Error write: ' + e.status + ' - Error message: ' + e.message);
            });

        });
    });

}