var id = process.argv[2],
    childProcess = process.argv[3],
    psimJS = require("./psimJS.js");

if (!childProcess) {
    var options = {
        //topology: 'BUS',
        //topology: 'SWITCH',
        //topology: 'TREE',
        //topology: 'MESH1',
        //topology: 'TORUS1',
        //topology: 'MESH2',
        topology: 'TORUS2',
        p: 3
    };
    psimJS.run(7, 'testTopology.js', options);
} else {
    console.log('init process ' + id);
    psimJS.init(process, id, doWork);
}

function doWork() {
    console.log('process ' + id + ' starting dowork');
    if (id === '3') {
        console.log('worker sending');
        psimJS.send(6, 'Hi Process 1!');
        psimJS.finalize();
    }
    if (id === '6') {
        console.log('process ' + id + ' calling receive');
        psimJS.receive(3, function (data) {
            console.log('callback called');
            console.log(data);
            psimJS.finalize();
        });
    } else {
        psimJS.finalize();
    }
}
