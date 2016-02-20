const child = require('child_process');
var _process,
    _id,
    _messages = {},
    _callbacks = {},
    _barrierCallback = function() {},
    _topologyMap = {
        BUS: function () {
            return function(i,j) {
                return true;
            }
        },
        SWITCH: function() {
            return function (i,j) {
                return true;
            }
        },
        TREE: function() {
            return function(i,j) {
                var _i = parseInt(i),
                    _j = parseInt(j);
                return (_i === Math.floor((j-1)/2)) || (_j === Math.floor((i-1)/2));
            }
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
                var i = parseInt(i),
                    j = parseInt(j),
                    a = (i % _q - j % _q + _q) % _q,
                    b = (i / _q - j / _q + _q) % _q,
                    c = (j % _q - i % _q + _q) % _q,
                    d = (j / _q - i / _q + _q) % _q;
                return ((!a && b) || (a && !b)) || ((!c && d) || (c && !d));
            }
        }
    },
    _topology = _topologyMap.SWITCH;

function SUM(x,y) { return parseInt(x)+parseInt(y); }

function finalize() {
    _process.exit(0);
}

function init(process, id, startFunction) {
    _process = process;
    _id = parseInt(id);
    _process.on('message', function (m) {
        var message = JSON.parse(m);
        if (message.ready) {
            startFunction();
        } else if (message.endBarrier) {
            _barrierCallback();
        } else {
            _handleMessage(message.from, message.data);
        }
    });
    var initReady = JSON.stringify({"ready" : true});
    _process.send(initReady);
}

function run(numChildren, fileName, options) {
    var i = 0,
        _children = {},
        readyChildren = 0,
        barrierCount = 0,
        all2OneCollectVector = [];
    if (options && options.topology) {
        _topology = _topologyMap[options.topology](options.p);
    }
    for (i; i < numChildren; i++) {
        _children[i] = child.fork(fileName, [i, true]);

        _children[i].on('close', function (code) {
        });
        _children[i].on('error', function (err) {
        });
        // When the parent gets a message, immediately send it to its recipient
        _children[i].on('message', function (m) {
            var message = JSON.parse(m);
            if (message.ready) {
                readyChildren +=  1;
                if (readyChildren === numChildren) {
                    _startChildren(_children, numChildren);
                }
            } else if (message.type === 'BARRIER') {
                barrierCount += 1;
                if (barrierCount === numChildren) {
                    barrierCount = 0;
                    _endBarriers(_children, numChildren);
                }
            } else if (message.type === 'SEND') {
                _handleParentSend(m, message, _children[message.to]);
            } else if (message.type === 'ONE2ALLBCAST') {
                _handleOne2AllBroadcast(m, message, _children, numChildren);
            } else if (message.type === 'ALL2ONECOLLECT') {
                all2OneCollectVector.push(message.data);
                if (all2OneCollectVector.length === numChildren) {
                    _handleAll2OneCollect(message.to, all2OneCollectVector, _children[message.to]);
                    all2OneCollectVector = [];
                }
            }
        });
    }
}

function _startChildren(children, numChildren) {
    var i = 0;
    for (i; i < numChildren; i++) {
        children[i].send(JSON.stringify({"ready": true}));
    }
}

function _endBarriers(children, numChildren) {
    var i = 0;
    for (i; i < numChildren; i++) {
        children[i].send(JSON.stringify({"endBarrier": true}));
    }
}

function receive(j, callback) {
    if (_messages[j]) {
        var message = _messages[j].shift();
        callback(message);
    } else {
        if (_callbacks[j]) {
            _callbacks[j].push(callback);
        } else {
            _callbacks[j] = [callback];
        }
    }
}

function send(j, data) {
    _send(j, data, 'SEND');
}

function _send(j, data, type) {
    var message = {
        from: _id,
        to: j,
        data: data,
        type: type
    };
    _process.send(JSON.stringify(message));
}

function _handleParentSend(m, message, child) {
    if (_topology(message.to, message.from)) {
        child.send(m);
    } else {
        throw new Error('Topology cannot send from ' + message.from + ' to ' + message.to);
    }
}

function _handleMessage(fromId, data) {
    if (_callbacks[fromId]) {
        var callback = _callbacks[fromId].shift();
        callback(data);
    } else {
        if (_messages[fromId]) {
            _messages[fromId].push(data);
        } else {
            _messages[fromId] = [data];
        }
    }
}

function one2AllBroadcast(source, data, callback) {
    if (_id === source) {
        _send('', data, 'ONE2ALLBCAST');
    } else {
        receive(source, callback);
    }
}

function _handleOne2AllBroadcast(m, message, children, numChildren) {
    var i = 0;
    for (i; i < numChildren; i++) {
        if (parseInt(message.from) !== i) {
            children[i].send(m);
        }
    }
}

function all2OneCollect(destination, value, callback) {
    _all2OneCollect(destination, value, false, callback);
}

function _all2OneCollect(destination, value, callbackToNonDestination, callback) {
    _send(destination, value, 'ALL2ONECOLLECT');
    if (_id === destination) {
        receive('ALL2ONECOLLECT', callback);
    } else if (callbackToNonDestination) {
        callback(value);
    }
}

function _handleAll2OneCollect(toId, vector, child) {
    var message = {
        data : vector,
        to : toId,
        from : 'ALL2ONECOLLECT',
        type : 'ALL2ONECOLLECT'
    };
    child.send(JSON.stringify(message));
}

function all2AllBroadcast(value, callback) {
    _all2OneCollect(0, value, true, function (response) {
        one2AllBroadcast(0, response, function(vector) {
            callback(vector);
        });
        if (_id === 0) {
            callback(response);
        }
    });
}

function all2OneReduce(destination, value, operation, callback) {
    var op = operation;
    if (!op) { op = SUM; }
    all2OneCollect(destination, value, function(result) {
        callback(result.reduce(op));
    });
}

function all2AllReduce(value, operation, callback) {
    var op = operation;
    if (!op) { op = SUM; }
    all2AllBroadcast(value, function(result) {
        callback(result.reduce(op));
    });
}

function barrier(callback) {
    _barrierCallback = callback;
    _send('', _id, 'BARRIER');
}

module.exports = {
    finalize: finalize,
    init: init,
    run: run,
    send: send,
    receive: receive,
    one2AllBroadcast : one2AllBroadcast,
    all2OneCollect : all2OneCollect,
    all2AllBroadcast: all2AllBroadcast,
    all2OneReduce: all2OneReduce,
    all2AllReduce: all2AllReduce,
    barrier: barrier
};