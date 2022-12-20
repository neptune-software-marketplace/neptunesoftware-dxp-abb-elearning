// Refer to this log ("System Logs" tool) to see the objectKey of the approved workflow
log.info(wfData);
// wfData.objectKey = Equipment Part Number


// Update the inspection record "Status" to "Complete", where the object key matches

// ----- //
// Regarding difference between 'QueryBuilder' and usage of our entities parsing. 
// Querybuilder is native typeorm without any layer from Neptune.

// The benefit of using our entity parser is audit logging.
// And some extra data formatting for different databases - that you will not have for querybuilder.
// This is a new feature in our LTS release 21.09. 

// Recommendation is to use our entities function if you don't need join etc. from querybuilder!
// ----- //

// *** QueryBuilder:
const inspectionsTable = entities.inspections;
await inspectionsTable.createQueryBuilder()
    .update()
    .set({"status":"Complete"})
    .where("part_number = :part_number", {part_number: wfData.objectKey})
    .execute();

// *** Alternative Method:
// await entities.inspections.update({"status": "Complete"}, {part_number: wfData.objectKey});



// Set the Equipments "assigned_to" reference to null
// Update the "checkup_date" for the equipment, to todays date
var currentDate = new Date();

// *** QueryBuilder:
const equipmentTable = entities.equipment;
await equipmentTable.createQueryBuilder()
    .update()
    .set({
        "assigned_to":null,
        "assigned_for_checking":false,
        "checkup_date":currentDate
        })
    .where("part_number = :part_number", {part_number: wfData.objectKey})
    .execute();

// *** Alternative Method:
// await entities.equipment.update({
//         "assigned_to":null,
//         "assigned_for_checking":false,
//         "checkup_date":currentDate
//     }, 
//     {
//         part_number: wfData.objectKey
//     });


complete();