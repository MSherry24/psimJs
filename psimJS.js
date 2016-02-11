const child = require('child_process');
/**
 * @fileOverview An MPI Simulator for NodeJS
 * @author <a href="mikesherry24@gmail.com">Mike Sherry</a>
 * @version 1.0.0
 */
var _process,
    _id,
    _nprocs,
    _messages = {},
    _callbacks = {};

/** @namespace */
function finalize() {
    _process.exit(0);
}

function init(process, id, startFunction) {
    console.log(id + ' begin init');
    _process = process;
    _id = id;
    _process.on('message', function (m) {
        console.log('child ' + _id + ' got a message');
        var message = JSON.parse(m);
        if (message.ready) {
            console.log('starting child ' + _id);
            startFunction();
        } else {
            console.log(_id + ': got message - ' + message.data);
            handleMessage(message.from, message.data);
        }
    });
    var initReady = JSON.stringify({"ready" : true});
    _process.send(initReady);
    console.log(id + ' end init');
}
/**
 * Initializes the simulator by created the number of processes requested and running the requested file on each child process
 * @param numChildren {Integer} The number of child processes that will be created
 * @param fileName {String} The name of the file to run (usually the name of the file that is calling this function)
 * @example
 * // When this example program is first called, id will be null so psimJS.run() will run
 * // and create three child processes. Each process will run the file 'worker.js',
 * // which should be the file that contains this code. The child processes
 * // pass in their id as the argument process.argv[2]. Since the id variable
 * // is populated in the child processes, doWork() will be called instead of
 * // psimJS.run().
 *
 * var psimJS = require("./psimJS.js");
 * var id = process.argv[2];
 *
 * if (!id) {
 *     psimJS.run(3, 'worker.js');
 * } else {
 *     doWork();
 * }
 *
 * function doWork() { ... }
 * @returns null
 */
function run(numChildren, fileName) {
    var self = this,
        i = 1,
        _children = {},
        readyChildren = 0;
    self._nprocs = numChildren;
    for (i; i <= numChildren; i++) {
        _children[i] = child.fork(fileName, [i]);

        _children[i].on('close', function (code) {
            console.log('child process exited with code ' + code);
        });
        _children[i].on('error', function (err) {
            console.log('An Error Occured: ' + err + ' - ' + err.message);
        });
        // When the parent gets a message, immediately send it to its recipient
        _children[i].on('message', function (m) {
            var message = JSON.parse(m),
                toId = message.to;
            if (message.ready) {
                readyChildren +=  1;
                console.log('got ' + readyChildren + ' ready messages');
                if (readyChildren === numChildren) {
                    console.log('sending ready signal');
                    _startChildren(_children, numChildren);
                }
            } else {
                _children[toId].send(m);
                console.log('parent received message from child ' + message.from + ' to child ' + message.to + ': ' + message.data);
            }
        });
    }
}
function receive(j, callback) {
    console.log('receive ' + _id + ': start');
    if (_messages[j]) {
        console.log('receive ' + _id + ': existing message - ' + _messages[j][0]);
        var message = _messages[j].shift();
        callback(message);
    } else {
        console.log('receive ' + _id + ': no existing message');
        if (_callbacks[j]) {
            console.log('receive ' + _id + ': callback array exists');
            _callbacks[j].push(callback);
        } else {
            console.log('receive ' + _id + ': creating new callback array');
            _callbacks[j] = [callback];
        }
    }
}
/** Sends data to process #j
 * @param j {Number}
 * @param data
 * @example
 * // Sends a message from process 2 to process 0
 * var psimJS = require("./psimJS.js");
 * var id = process.argv[2];
 * ... initialize child processes ...
 *
 * function doWork() {
 *    if (id === 2) {
 *       psimJS.send(0, {message: 'hi'});
 *    }
 * }
 */
function send(j, data) {
    var message = {
        from: _id,
        to: j,
        data: data
    };
    console.log('send ' + _id + ': sending message from ' + message.from + ' to ' + message.to);
    _process.send(JSON.stringify(message));
}

function _startChildren(children, numChildren) {
    var i = 1;
    for (i; i <= numChildren; i++) {
        children[i].send(JSON.stringify({"ready": true}));
    }
}

function handleMessage(fromId, data) {
    console.log('handleMessage ' + _id + ': got data ' + data + ' from id ' + fromId);
    if (_callbacks[fromId]) {
        console.log('handleMessage ' + _id + ': callback exists');
        var callback = _callbacks[fromId].shift();
        callback(data);
    } else {
        console.log('handleMessage ' + _id + ': no callbacks');
        if (_messages[fromId]) {
            console.log('handleMessage ' + _id + ': pushing onto _messages');
            _messages[fromId].push(data);
        } else {
            console.log('handleMessage ' + _id + ': setting new messages array');
            _messages[fromId] = [data];
        }
    }
}

module.exports = {
    finalize: finalize,
    init: init,
    run: run,
    send: send,
    receive: receive
};
