// -----

// For each piece of equipment, get the "checkup_date" and add the "checkup_interval" to it
// This gives the date the equipment needs to be checked next.

// Compare this date with the current date, to generate the "days_until_check" variable
// Update each piece of equipment with this variable.

// -----

// Import Moment
var moment = modules.moment;

// Use moment to get current day:
var currentDate = moment(new Date(), "YYYY-MM-DD");
console.log("Current date:",currentDate)


// Get all the records from the equipment database
const equipmentTable = await entities.equipment.createQueryBuilder("alias").getMany();

// For each record in the equipment database
for (i = 0; i < equipmentTable.length; i++) {
    console.log("-----");

    var checkup_date = moment(equipmentTable[i].checkup_date, "YYYY-MM-DD");
    var checkup_interval =  equipmentTable[i].checkup_interval;
    console.log(checkup_date);
    console.log(checkup_interval);

    var date_of_the_next_check = moment(checkup_date).add(checkup_interval, 'days');
    console.log(date_of_the_next_check);

    //Difference in number of days
    var days_left = Math.round(moment.duration(date_of_the_next_check.diff(currentDate)).asDays());
    console.log(days_left);

    await entities.equipment.update({part_number: equipmentTable[i].part_number}, {days_until_check: days_left});

}

complete();