var equipment = ["Air blaster","Air classifier","Ball mill","Beltweigher","Blowout preventer","Bowl feeder","Buell dryer","Cargo net","Case sealer","Check weigher","Choke manifold","Coiled tubing","Concrete mixer","Desalter","Disc mill","Drum handler","Drum heater","Electric tug","Electrospray","Flame programmer","Flat-panel display","Furnace roller","Glass crusher","Gravimetric blender","High viscosity mixer","High-frequency vibrating screens","Horn analyzer","Hydromill trench cutter","Impact mill","Induction heater","Industrial dryer","Industrial fan","Kaeser Compressors","Levelling stone","Material-handling equipment","Memo motion","Mezzanine","Multiple-effect evaporator","Optical comparator","Pallet inverter","Palletizer","Powder deaerator","Presence sensing device","Production equipment control","Production packer","Rail-Veyor","Reboiler","Recovery boiler","Recuperator","Rolling bed dryer","Run-around coil","Screw conveyor","Separator (oil production)","Shadow board","Single-ended recuperative burner","Starch mogul","Thermal wheel","Tool","Trickling filter","Tube tool","Turret lathe","Tygon tubing","Universal gateway","Vacuum truck","Vapor–liquid separator","Variable rate feeder","Wheel washing system","Whirlwind mill","Wire rope spooling technology"]

var outputArray = []

function getRandomInRange(from, to, fixed) {
    return (Math.random() * (to - from) + from).toFixed(fixed) * 1;
}


for (i = 0; i < equipment.length; i++) {

    //var lat = (Math.random()*360-180).toFixed(8);
    //var long = (Math.random()*180-90).toFixed(8);

    var lat = getRandomInRange(-90, 90, 3);
    var long = getRandomInRange(-180, 180, 3);


    var IDSt = equipment[i].substring(0,3);
    var IDStr = IDSt.toUpperCase();
    var IDNumber = Math.floor(100000 + Math.random() * 900000);
    var part_number_full = IDStr+IDNumber;

    var checkupIntv = Math.floor(Math.random() * 365) + 1;

    function randomDate(start, end) {
        return new Date(start.getTime() + Math.random() * (end.getTime() - start.getTime()));
    }

    var checkup_date = (randomDate(new Date(2020, 0, 1), new Date()));
        
    outputArray.push({
        "name":equipment[i],
        "part_number":part_number_full,
        "latitude":lat,
        "longitude":long,
        "checkup_date":checkup_date,
        "checkup_interval":checkupIntv
    })

    await entities.equipment.insert({
        "name":equipment[i],
        "part_number":part_number_full,
        "latitude":lat,
        "longitude":long,
        "checkup_date":checkup_date,
        "checkup_interval":checkupIntv
    })

}

console.log(outputArray)

complete();