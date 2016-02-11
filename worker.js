var id = process.argv[2],
    psimJS = require("./psimJS.js"),
    self = this;

if (!id) {
    psimJS.run(2, 'worker.js');
} else {
    console.log('init process ' + id);
    psimJS.init(process, id, doWork);
}

function doWork() {
    console.log('process ' + id + 'starting dowork');
    if (id === '1') {
        console.log('worker sending');
        psimJS.send(2, 'Hi Process 2!');
        psimJS.finalize();
    } else {
        console.log('process ' + id + ' calling receive');
        psimJS.receive(1, function (data) {
            console.log('callback called');
            console.log(data);
            psimJS.finalize();
        });
    }
}
