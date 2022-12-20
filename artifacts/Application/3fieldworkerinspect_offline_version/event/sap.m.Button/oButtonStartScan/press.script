oDialogScan.open();

Quagga.init({
    inputStream: {
        name: "Live",
        type: "LiveStream",
        //target: oHBoxVideoContainer.getDomRef(),
        target: document.getElementById("reader"),
        constraints: {
            width: oHBoxVideoContainer.$().width()
        }

    },
    decoder: {
        readers: ["code_128_reader"]
    }
}, function (err) {
    if (err) {
        console.log(err);
        return
    }
    console.log("Initialization finished. Ready to start");
    Quagga.start();
});
