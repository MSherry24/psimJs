var id = process.argv[2],
    childProcess = process.argv[3],
    psimJS = require("./../psimJS.js");

if (!childProcess) {
    psimJS.run(2, 'worker.js');
} else {
    console.log('init process ' + id);
    psimJS.init(process, id, doWork);
}

function doWork() {
    console.log('process ' + id + ' starting dowork');
    if (id === '0') {
        console.log('worker sending');
        psimJS.send(1, 'Hi Process 1!');
        psimJS.finalize();
    } else {
        console.log('process ' + id + ' calling receive');
        psimJS.receive(0, function (data) {
            console.log('callback called');
            console.log(data);
            psimJS.finalize();
        });
    }
}
