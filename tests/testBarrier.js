var id = process.argv[2],
    childProcess = process.argv[3],
    psimJS = require("./../psimJS.js");

if (!childProcess) {
    var options = {
        topology: 'SWITCH'
    };
    psimJS.run(10, 'testBarrier.js', options);
} else {
    psimJS.init(process, id, doWork);
}

function doWork() {
    console.log('id: ' + id + ' - start Barrier');
    psimJS.barrier(function() {
        console.log('id: ' + id + ' - end Barrier');
        psimJS.finalize();
    });
}