var id = process.argv[2],
    childProcess = process.argv[3],
    psimJS = require("./../psimJS.js");

if (!childProcess) {
    var options = {
        topology: 'SWITCH',
    };
    psimJS.run(10, 'testAll2AllBcast.js', options);
} else {
    psimJS.init(process, id, doWork);
}

function doWork() {
    //console.log('id: ' + id + ' startdowork')
    psimJS.all2AllBroadcast(id, function (data) {
        console.log('end all2allbcast - id: ' + id + ' data = '  + data);
        psimJS.finalize();
    });
}
