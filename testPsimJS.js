const child = require('child_process');

module.exports.run = function run(numChildren, worker) {
    var i = 0;
    for (i; i < numChildren; i++) {
        var ls = child.fork(worker, [i]);
        console.log('started child ' + 1);
        ls.on('close', function (code) {
            console.log('child process exited with code ' + code);
        });

        ls.on('message', function(message) {
            console.log('got message: ' + message.message);
        });

        ls.send({ message: 'go' });
    }
};
