var id = process.argv[2],
    childProcess = process.argv[3],
    psimJS = require("./../psimJS.js");

if (!childProcess) {
    var options = {
        topology: 'SWITCH',
    };
    psimJS.run(10, 'testAll2OneColl.js', options);
} else {
    psimJS.init(process, id, doWork);
}

function doWork() {
    psimJS.all2OneCollect(0, id, function (data) {
        var total = 0;
        data.forEach(function (x) {
            total += parseInt(x);
        });
        console.log('SUM: ' + total); // should be 45
        console.log('Expected SUM: 45'); // should be 45
        psimJS.finalize();
    });
    if (id !== '0') {
        psimJS.finalize();
    }
}
