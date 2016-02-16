var id = process.argv[2],
    childProcess = process.argv[3],
    psimJS = require("./../psimJS.js");

if (!childProcess) {
    var options = {
        topology: 'SWITCH',
    };
    psimJS.run(10, 'testOne2All.js', options);
} else {
    console.log('init process ' + id);
    psimJS.init(process, id, doWork);
}

function doWork() {
    console.log('process ' + id + ' starting dowork');
    psimJS.one2AllBroadcast(0, 'hello other functions!', function (data) {
        console.log('got message: ' + data);
        psimJS.finalize();
    });
    if (id === '0') {
        psimJS.finalize();
    }
}
/**
 * Created by Mike on 2/15/2016.
 */
