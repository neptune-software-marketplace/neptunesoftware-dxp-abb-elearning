// Custom Init - Happens only once
sap.ui.getCore().attachInit(function(startParams) {
    
    setTimeout(setGPDData, 200);
    //apigetStatusCounts()

});

function setGPDData() {
    $.ajax({
        url: '/media/root/eLearningMedia/NorwayGDPData.json',
        complete: function(json) {
            data = JSON.parse(json.responseText);
            // set some variable to host data
            console.log(data);
            var arrayGDP = [];
            var year_list = [];

            $.each(data, function(i, data) {
                //Store indicator name
                country_name = data.country.value;
                // Store indicator label
                indicatorName = data.indicator.value;
                // fill the date array
                year_list.push(data.date);
                // fill the string data array 
                arrayGDP.push(data.value);
            });
            oHighchart.update(
                {
                    title: {
                        text: country_name
                    },
                    xAxis: {
                        categories: year_list.reverse() //.reverse() to have the min year on the left 
                    },
                    series: [{
                        name: country_name,
                        data: arrayGDP.reverse() //
                    }]
                }
            );
            },
        error: function() {
            console.log('there was an error!');
        }
    });
}
