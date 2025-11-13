// Refer to this log ("System Logs" tool) to see the objectKey of the approved workflow
log.info(wfData);
// wfData.objectKey = Equipment Part Number

// First, grab the data for the given inspection
const inspection = await entities.inspections.createQueryBuilder()
    .where("part_number = :part_number", {part_number: wfData.objectKey})
    .andWhere("status = :status", {status: "Submitted"})
    .getOne();
// Hold submitted data in "inspection" variable


// Change the current "Submitted" Inspection 'status' to "Rejected"
const table = entities.inspections;
await table.createQueryBuilder().update()
    .set({"status":"Rejected"})
    .where("part_number = :part_number", {part_number: wfData.objectKey})
    .andWhere("status = :status", {status: "Submitted"})
    .execute();
// ---
log.info("Updated currently Submitted inspection to Rejected");



// CREATE A NEW Inspection with status "Assigned"
// But with blank fields for the 4 inspection data points
await entities.inspections.createQueryBuilder()
    .insert()
    .values({
        "employeeID":inspection.employeeID,
        "employeeName":inspection.employeeName,
        "part_number":inspection.part_number,
        "status":"Assigned",
        "equipment_barcode_scan":"",
        "comments":"",
        "attachments":"",
        "signature":"",
        "createdAt":Date.now(),
        "updatedAt":Date.now(),
        "createdBy":"system",
        "updatedBy":"system",
        "id":uuid()
        })
    .execute();

const entity = entities.inspections.create();

log.info("Inserted new Inspection record as Assigned");

complete();