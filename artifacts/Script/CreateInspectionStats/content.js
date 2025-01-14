var all = await entities.inspections.find();

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
