const child = require('child_process');
var _process,
    _id,
    _nprocs,
    _messages = {},
    _callbacks = {},
    _topologyMap = {
        BUS: function (i,j) {
            return true;
        },
        SWITCH: function (i,j) {
            return true;
        },
        MESH1: function (p) {
            return function(i,j) {
                return Math.pow(i-j, 2) === 1;
            }
        },
        TORUS1: function TORUS1(p) {
            if (!p) {
                throw new Error('Torus Topology needs a p value');
            }
            return function (i,j) {
                return (i-j+p) % p === 1 || (j-i+p) % p === 1;
            }
        },
        MESH2: function (p) {
            if (!p) {
                throw new Error('Mesh Topology needs a p value');
            }
            var _q = Math.floor((Math.sqrt(p)+0.1));
            return function (i,j) {
                var a = Math.pow((i%_q-j%_q),2),
                    b = Math.pow((i/_q-j/_q),2);
                return (!a && b) || (a && !b);
            }
        },
        TORUS2: function(p) {
            if (!p) {
                throw new Error('Torus Topology needs a p value');
            }
            var _q = Math.floor((Math.sqrt(p) + 0.1));
            return function (i, j) {
                var a = (i % _q - j % _q + _q) % _q,
                    b = (i / _q - j / _q + _q) % _q,
                    c = (j % _q - i % _q + _q) % _q,
                    d = (j / _q - i / _q + _q) % _q;
                return ((!a && b) || (a && !b)) || ((!c && d) || (c && !d));
            }
        },
        TREE: function(i,j) {
            return (i === Math.floor((j-1)/2)) || (j === Math.floor((i-1)/2));
        }
    },
    _topology = _topologyMap.SWITCH;

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

function run(numChildren, fileName, options) {
    var self = this,
        i = 0,
        _children = {},
        readyChildren = 0;
    self._nprocs = numChildren;
    if (options && options.topology) {
        _topology = _topologyMap[options.topology](options.p);
    }
    for (i; i < numChildren; i++) {
        _children[i] = child.fork(fileName, [i, true]);

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
                _handleParentSend(m, message, _children[toId]);
            }
        });
    }
}

function _handleParentSend(m, message, child) {
    if (_topology(message.to, message.from)) {
        child.send(m);
        console.log('Parent received message from child ' + message.from + ' to child ' + message.to + ': ' + message.data);
    } else {
        throw new Error('Topology cannot send from ' + message.from + ' to ' + message.to);
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
    var i = 0;
    for (i; i < numChildren; i++) {
        children[i].send(JSON.stringify({"ready": true}));
    }
}

function topology(i,j) {
    return self._topology(i,j);
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
    receive: receive,
    topology: topology
};
