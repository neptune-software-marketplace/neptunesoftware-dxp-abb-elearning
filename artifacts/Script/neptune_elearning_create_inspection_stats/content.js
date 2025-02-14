var all = await entities.inspections.find();
//console.log("ALL:: ", all); //Interesting the this does not console.log all the data, only first 2
//console.log("ALL:: ", all.length); 

var inspection_ct = {
    complete : 0,
    submitted : 0,
    assigned : 0,
    rejected : 0
}

all.forEach(inspection => {
    if(inspection.status === "Complete"){
        inspection_ct.complete ++;
    }
    else if(inspection.status === "Assigned"){
        inspection_ct.assigned ++;
    }
    else if(inspection.status === "Submitted"){
        inspection_ct.submitted ++;
    }
    else{
        inspection_ct.rejected ++;
    }
})

result = inspection_ct;

console.log("Completion Dict:: ", inspection_ct);



// Pieces of equipment

//Could get them all individually like this, but thats no bueno. Muchas llamadas --JB
// var completed_ct = await entities.inspections.count({status: "Complete"});
// console.log("Complete Count:: ", completed_ct);