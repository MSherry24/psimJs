(function (global) {
    'use strict';
    global.psimJS = global.psimJS || (function () {

        var callbacks = {},
            messages = {},
            _barrierCallbacks = {},
            _barrierCount = 0,
            _nprocs,
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

        function init(numChildren, options, callback) {
            var i = 0;
            console.log('begin init');
            _nprocs = numChildren;
            if (options && options.topology) {
                _topology = _topologyMap[options.topology](options.p);
            }
            for (i; i < numChildren; i++) {
                callbacks[i] = {};
                messages[i] = {};
            }
            for (i = 0; i < numChildren; i++) {
                callback(i);
            }
        }

        function send(id, destination, message) {
            if (_topology(destination, id)) {
                _send(id, destination, message);
            } else {
                throw new Error('Topology cannot send from ' + id + ' to ' + destination);
            }
        }

        function _send(id, destination, message) {
            var callback, returnArray;
            if (callbacks[destination][id] && id !== 'ALL2ONECOLLECT') {
                callback = callbacks[destination][id].shift();
                callback(message);
            } else {
                if (messages[destination][id]) {
                    messages[destination][id].push(message);
                }
                else {
                    messages[destination][id] = [message];
                }
                if (id === 'ALL2ONECOLLECT' && messages[destination][id].length === _nprocs && callbacks[destination][id]) {
                    returnArray = messages[destination][id].slice(0);
                    messages[destination][id] = [];
                    callback = callbacks[destination][id].shift();
                    callback(returnArray);
                }
            }
        }

        function receive(id, sender, callback) {
            var returnArray;
            if (messages[id][sender] && sender !== 'ALL2ONECOLLECT') {
                callback(messages[id][sender].shift());
            }
            else {
                if (callbacks[id][sender]) {
                    callbacks[id][sender].push(callback);
                } else {
                    callbacks[id][sender] = [callback];
                }
                if (sender === 'ALL2ONECOLLECT' && messages[id][sender].length === _nprocs && callbacks[id][sender]) {
                    returnArray = messages[id][sender].slice(0);
                    messages[id][sender] = [];
                    callback = callbacks[id][sender].shift();
                    callback(returnArray);
                }
            }
        }

        function one2AllBroadcast(id, source, data, callback) {
            var i = 0;
            if (id === source) {
                for (i;i<_nprocs;i++) {
                    _send(id, i, data);
                }
            } else {
                receive(id, source, callback);
            }
        }

        function all2OneCollect(id, destination, value, callback) {
            _all2OneCollect(id, destination, value, false, callback);
        }

        function _all2OneCollect(id, destination, value, callbackToNonDestination, callback) {
            send('ALL2ONECOLLECT', destination, value);
            if (id === destination) {
                receive(id, 'ALL2ONECOLLECT', callback);
            } else if (callbackToNonDestination) {
                callback(value);
            }
        }

        function all2AllBroadcast(id, value, callback) {
            _all2OneCollect(id, 0, value, true, function (response) {
                one2AllBroadcast(id, 0, response, function(vector) {
                    callback(vector);
                });
                if (id === 0) {
                    callback(response);
                }
            });
        }

        function all2OneReduce(id, destination, value, operation, callback) {
            var op = operation;
            if (!op) { op = SUM; }
            all2OneCollect(id, destination, value, function(result) {
                callback(result.reduce(op));
            });
        }

        function all2AllReduce(id, value, operation, callback) {
            var op = operation;
            if (!op) { op = SUM; }
            all2AllBroadcast(id, value, function(result) {
                callback(result.reduce(op));
            });
        }

        function barrier(id, callback) {
            var i = 0;
            _barrierCallbacks[id] = callback;
            _barrierCount += 1;
            if (_barrierCount === _nprocs) {
                for (i; i < _nprocs; i++) {
                    _barrierCallbacks[i]();
                }
            }
        }

        return {
            init: init,
            send: send,
            receive: receive,
            one2AllBroadcast: one2AllBroadcast,
            all2OneCollect: all2OneCollect,
            all2AllBroadcast: all2AllBroadcast,
            all2OneReduce: all2OneReduce,
            all2AllReduce: all2AllReduce,
            barrier: barrier
        };

    })();
}(this));