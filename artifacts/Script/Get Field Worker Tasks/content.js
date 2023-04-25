// User information
const user = req.user;
const userId = user.id;
log.info(userId);

const joinedTables = await entities.inspections.createQueryBuilder()

    .select(["inspections","equip"])

    .leftJoin("equipment", "equip", "inspections.part_number = equip.part_number")

    //.where("inspections.employeeID = :employeeID", { employeeID: userId })
    
    .getRawMany()

result = joinedTables;

console.log(joinedTables)
console.log(typeof joinedTables); // = Object
console.log(JSON.stringify(joinedTables))

complete();