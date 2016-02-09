const child = require('child_process');
var public = {};

public.run = function run(numChildren, worker) {
    var i = 0,
        children = {};

    for (i; i < numChildren; i++) {
        children[i] = child.fork(worker, [i]);
        console.log('started child ' + 1);
        children[i].on('close', function (code) {
            console.log('child process exited with code ' + code);
        });

        children[i].on('message', function(message) {
            console.log('got message: ' + message.message);
        });

        children[i].send({ message: 'go' });
    }
};
