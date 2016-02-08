var psimJS = require("./psimJS.js");
var id = process.argv[2];

if (!id) {
    psimJS.run(3, 'worker.js');
} else {
    doWork();
}

function doWork() {
    process.on('message', function (m) {
        console.log(id + ' got message from parent:' + m.message);
    });
    process.send({ message: 'message from worker ' + id });
    process.exit(0);
}
