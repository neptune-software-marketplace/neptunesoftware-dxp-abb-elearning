forwardProcess = "";

function openUserDialog(process) {

    if (!modeltabUsers.oData.length) {
        butUserUpdate.firePress();
    }

    forwardProcess = process;

    if (process === "Query") {
        objHeaderForward.setIcon("sap-icon://fa-regular/question-circle");
    } else {
        objHeaderForward.setIcon("sap-icon://forward");
    }

    objHeaderForward.setTitle(process);
    diaForward.open();

}