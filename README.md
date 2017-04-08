# psimJS

psimJS is an MPI simulator for Node.js and regular old client side Javacript.

## Getting Started

Download psimJS.js and psimJSClient.js.  psimJS is the Node.js version and psimJSClient.js is the client side version.  

### Prerequisities

If you're using the Node.js version, make sure you have Node.js and npm installed on your computer.  psimJS uses Node's 'child-process' library, which should be globally available after you install Node.js.
If you're using the client version, all you need is a relatively up to date version of a modern browser.  psimJS was developed using Chrome, but it should also work in Firefox and the latest version of IE (probably) or Edge.

### Installing
No installation is necessary, simply reference the file from your own code.

#### Node.js Version
If using Node.js, this looks like
```
var psimJS = require("./../psimJS.js");
```

The variable psimJS will then allow you to reference all of the publicly available functions.  Here's an example:
```
 if (id === '0') {
        console.log('worker sending');
        psimJS.send(1, 'Hi Process 1!');
        psimJS.finalize();
    } else {
        psimJS.receive(0, function (data) {
            console.log(data);
            psimJS.finalize();
        });
    }
```

#### Client version
If using psimJSClient.js, simply reference the file in your DOM like this:
```
    <script src="../psimJSClient.js" ></script>
```

Then you can reference the publicly available functions in your other script files by using the psimJS namespace, like this:
```
if (id === 0) {
        psimJS.send(id, 1, 'Hi Process 1');
    }
    else {
        psimJS.receive(id, 0, function(message) {
            console.log(message);
        });
    }
```

## psimJS Documentation
Each version of psimJS provides eight public functions:
##### -send
##### -receive
##### -one2AllBroadcast
##### -all2OneCollect
##### -all2AllBroadcast
##### -all2OneReduce
##### -all2AllReduce
##### -barrier
As well as a few function for initialization and finalizing that are unique to each implementation. 
The functionality of the common functions is the same between both versions, but the arguments required are slightly different due to the different back end designs. The Node.js version also provides a few additional functions for creating and closing new processes, although most of the work is handled by psimJS behind the scenes. 
An important difference between the two versions is that the Client version is single threaded - since all Javascript processes are inherently single threaded - but the Node.js version will fork new child processes on your local machine.  Depending on the processor, this could mean that some code is run concurrently between processors.  Within a single process, however, Javascript's event loop still runs in normal single threaded fashion, which eliminates many of the common problems of concurrent software such as race conditions or non-deterministic execution order. 
### Node.js Version
#### Initializing
#####run()
```
run(numProcesses, fileName, options)
inputs:
    [Number] numProcesses - The number of child processes to create
    [String] fileName - The path and name of the file that the child process will run
    [Object] options - options is not a required argument.  If used, it had two
        feilds: topology and p.  Topology can be one of the topology options listed 
        below.  If no value is provided, SWITCH will be used as the default. Some toplogies
        require a value for p to set the dimensionality of the topology.
description: Creates a number of child processes that each run the file indicated by the 
    fileName argument.

Valid options.topology values [STRING]:
    BUS 
    SWITCH 
    TREE 
    MESH1 - requires p value
    TORUS1 - requires p value
    MESH2 - requires p value
    TORUS2 - requires p value
```
#####init()
```
init(process, id, callback)
inputs:
    [Object] process - process is a keyword in Node.js and controls a number of message passing 
        functions used by psimJS. Always pass in the variable process as this argument.
    [String] id - When run() starts new child processes, it passes in a unique id as a command line argument.  
        This value should be captured in the child processes and passed into the init function.
    [Function] callback - After all child processes have called init(), the callback function will be 
        called for each child process
outputs: None
descriptions: Passes child process id and process object to psimJS for internal use, then kicks
    off the callback function.
```
Example Initialization:
```
/*** worker.js
* In this example, id and childprocess are undefined the first time the program is run.  
* Since childProcess is undefined, psimJS.run() is called passing in 2 for the number of 
* child processes to be created and 'worker.js' as the file to be run. It is assumed that
* the file shown below is worker.js, but run() and init() can, in theory, be in different files.
* run() will fork two child processes and pass in a unique id and a boolean true value as 
* command line arguments. The id (argv[2]) is set to the variable id, and a boolean true 
* (argv[3]) is set to the variable childProcess.  Since childProcess is no longer undefined,
* init() will be run instead of run() in the child processes.  They will pass in their
* own process object, their unique id, and the function doWork as arguments to init().  
* Once init() has been called by both child processes, doWork() will be run for every 
* child process.  doWork will have access to the id object since it is a global variable.
***/
var id = process.argv[2],
    childProcess = process.argv[3],
    psimJS = require("./../psimJS.js");

if (!childProcess) {
    psimJS.run(2, 'worker.js');
} else {
    console.log('init process ' + id);
    psimJS.init(process, id, doWork);
}

function doWork() { ... }
```
#####finalize()
```
finalize()
inputs: None
description: Kills the current process.  Must be called at the end of each process or
    else program will never complete.
```
#### Public Functions
After initializing a child process, you can call any of these functions.
##### send()
```
send(j, data)
inputs: 
    [Number] j - id of the process that will receive the data
    [object] data - data that will be send to process j.  Can be any Javascript object.
description: Sends the data object from the calling process to process j
```
##### receive()
```
receive(j, callback)
inputs: 
    [Number] j - id of the process that is sending the data
    [Function] callback - function that will be called when the data is received from 
        process j.  The data object is passed into the callback function as its first
        argument.
description: The calling process will check for and/or wait for a message from 
    process j.  When the message is ready, the callback function will be called,
    with the message passed in as an argument.
```
Example Send and Receive
```
var id = process.argv[2],
    childProcess = process.argv[3],
    psimJS = require("./../psimJS.js");

if (!childProcess) {
    psimJS.run(2, 'worker.js');
} else {
    console.log('init process ' + id);
    psimJS.init(process, id, doWork);
}

function doWork() {
    console.log('process ' + id + ' starting dowork');
    if (id === '0') {
        console.log('worker sending');
        psimJS.send(1, 'Hi Process 1!');
        psimJS.finalize();
    } else {
        console.log('process ' + id + ' calling receive');
        psimJS.receive(0, function (data) {
            console.log('callback called');
            console.log(data);
            psimJS.finalize();
        });
    }
}
```

##### one2AllBroadcast()
```
one2AllBroadcast(source, data, callback)
inputs: 
    [Number] source - the id of process that is sending the data
    [Object] data - the data that will be send from the source to all
        other processes
    [Function] callback - the function that will be run by each receiving
        process. The data from the sending process will be passed into the
        callback function as an argument
description: The process whose id is equal to the source input argument will
    send the data object to all other processes.  If a process that is not the
    source calls this function, it will wait to receive a message from the source
    and then call the callback function.  The source object does not call the 
    callback function. 
```
one2AllBroadcast Example
```
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
    psimJS.one2AllBroadcast(0, 'hello other functions!', function (data) {
        console.log('got message: ' + data);
        psimJS.finalize();
    });
    if (id === '0') {
        psimJS.finalize();
    }
}
```

##### all2OneCollect()
```
all2OneCollect(destination, value, callback)
inputs: 
    [Number] destination - the id of process that will receive all the data
    [Object] value - the data that will be send from the processes to the
        destination
    [Function] callback - the function that will be run by the destination
        process. An array of the data from the sending processes will be 
        passed into the callback function as an argument
description: The process whose id is equal to the destination input argument will
    receive data from all other processes as an array. The sending objects do 
    not call the callback function. 
```
all2OneCollect Example
```
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
```
##### all2AllBroadcast()
```
all2AllBroadcast(value, callback)
inputs:
    [Object] value - The data that will be sent by the calling process to all
        other processes
    [Function] callback - This function is called once the values sent by all
        processes is collected into an array.  The array of all values will be
        passed into the callback function as an argument.
description: Must be called by all processes before any callbacks are run. The
    values passed by all of the processes are collected into an array and passed
    back to all the processes.
```
Example all2AllBroadcast
```
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
    psimJS.all2AllBroadcast(id, function (data) {
        console.log('end all2allbcast - id: ' + id + ' data = '  + data);
        psimJS.finalize();
    });
}
```
##### all2OneReduce()
```
all2OneReduce(destination, value, operation, callback)
inputs:
    [Number] destination - The id of the process that will receive the reduced data
    [Object] value - The data from the calling process that will be passed
        into the reduce operation
    [Function] operation - The function that will be used to reduce the data
        from all processes. This function must be compatible with Javascript's
        reduce() function.  If no operation is passed in, it defaults to a sum
        function
    [Function] callback - The function that is called by the destination process
        after all data has been received and reduced. The result of the operation
        function is passed in as an argument to the callback function
description: Must be called by all processes.  The values from each process
    are gathered in an array and then reduced to a single value using the 
    operation function.  That single value is then passed into the callback
    function by the destination process.
```
Example all2OneReduce
```
var id = process.argv[2],
    childProcess = process.argv[3],
    psimJS = require("./../psimJS.js");

if (!childProcess) {
    var options = {
        topology: 'SWITCH'
    };
    psimJS.run(10, 'testAll2OneReduce.js', options);
} else {
    psimJS.init(process, id, doWork);
}

function doWork() {
    psimJS.all2OneReduce(0, id, null, function (data) {
        console.log('SUM: ' + data); // should be 45
        console.log('Expected SUM: 45'); // should be 45
        psimJS.finalize();
    });
    if (id !== '0') {
        psimJS.finalize();
    }
}
```
##### all2AllReduce()
```
all2AllReduce(value, operation, callback)
inputs:
    [Object] value - The data from the calling process that will be passed
        into the reduce operation
    [Function] operation - The function that will be used to reduce the data
        from all processes. This function must be compatible with Javascript's
        reduce() function.  If no operation is passed in, it defaults to a sum
        function
    [Function] callback - The function that is called by the each process
        after all data has been received and reduced. The result of the operation
        function is passed in as an argument to the callback function
description: Must be called by all processes.  The values from each process
             are gathered in an array and then reduced to a single value using the 
             operation function.  That single value is then passed into the callback
             function by the all processes.
```
Example all2AllReduce
```
var id = process.argv[2],
    childProcess = process.argv[3],
    psimJS = require("./../psimJS.js");

if (!childProcess) {
    var options = {
        topology: 'SWITCH'
    };
    psimJS.run(10, 'testAll2AllReduce.js', options);
} else {
    psimJS.init(process, id, doWork);
}

function doWork() {
    psimJS.all2AllReduce(id, null, function (data) {
        console.log('SUM: ' + data); // should be 45
        console.log('Expected SUM: 45'); // should be 45
        psimJS.finalize();
    });
}
```

##### barrier()
```
barrier(callback)
inputs:
    [Function] callback - This function is called after all processes
        have run barrier().  No arguments are passed in to callback.
description: Must be called by all processes.  Once called, a process will
    wait until all other processes have called barrier() and then run the 
    callback function.
```
Example barrier
```
var id = process.argv[2],
    childProcess = process.argv[3],
    psimJS = require("./../psimJS.js");

if (!childProcess) {
    var options = {
        topology: 'SWITCH'
    };
    psimJS.run(10, 'testBarrier.js', options);
} else {
    psimJS.init(process, id, doWork);
}

function doWork() {
    console.log('id: ' + id + ' - start Barrier');
    psimJS.barrier(function() {
    /** No process will print this line until after all processes have called barrier **/
        console.log('id: ' + id + ' - end Barrier');
        psimJS.finalize();
    });
}
```
### Client Version
The client version of psimJS does not require Node.js and can be run in a browser.  It is single threaded and does not create and new processes. This documentation refers to "processes" in the client version as an abstract idea, not as a reference to actual processes running in the background.  That said, the functions provided still allow the user to run a reasonable simulation of a concurrent message passing system.
The main difference between the client and server versions of psimJS is that the id of the calling function must be passed in as an argument for all public functions in the client version.  This is required in the client version but not the server version because in the server version, there is a separate instence of psimJS for each child process, and the id is passed in and stored when init() is called.  In the client verison, there is a single instance of psimJS, so it must be told the id of the calling processes each time. 
#### Initializing
#####init()
```
init(numChildren, options, callback)
inputs:
    [Number] numChildren - The number of child processes to run
    [Object] options - options is not a required argument.  If used, it had two
            feilds: topology and p.  Topology can be one of the topology options listed 
            below.  If no value is provided, SWITCH will be used as the default. Some toplogies
            require a value for p to set the dimensionality of the topology.
    [Function] callback - the function that each child process will call when init finishes. 
        A unique id is passed in as an argument to the callback function for each process
        that is run
    description: Creates a number of child processes that will each run the callback function
        when the init() function completes
    
    Valid options.topology values [STRING]:
        BUS 
        SWITCH 
        TREE 
        MESH1 - requires p value
        TORUS1 - requires p value
        MESH2 - requires p value
        TORUS2 - requires p value
```
Example init
```
/** the jQuery $(document).ready() function is used here as an example, but
 *  jQuery is not required for psimJSClient.js
**/
$(document).ready(function() {
    var options = {
        topoLogy: 'SWITCH'
    }
    psimJS.init(3, options, doWork);
});

function doWork(id) { ... }
```
#### Public Functions
After initializing a child process, you can call any of these functions.
##### send()
```
send(id, destination, message)
inputs: 
    [Number] id - the id of the calling function
    [Number] j - id of the process that will receive the data
    [object] data - data that will be send to process j.  Can be any Javascript object.
description: Sends the data object from the id process to process j
```
##### receive()
```
receive(id, sender, callback)
inputs: 
    [Number] id - the id of the calling function
    [Number] sender - id of the process that is sending the data
    [Function] callback - function that will be called when the data is received from 
        process j.  The data object is passed into the callback function as its first
        argument.
description: The calling process will check for and/or wait for a message from 
    process j for process id.  When the message is ready, the callback function 
    will be called with the message passed in as an argument.
```
Example Send and Receive
```
$(document).ready(function() {
    var options = {
        topoLogy: 'SWITCH'
    }
    psimJS.init(3, options, doWork);
});

function doWork(id) {
    if (id === 0) {
        psimJS.send(id, 1, 'hi 1');
        psimJS.send(id, 2, 'hi 2');
    }
    else {
        psimJS.receive(id, 0, function(message) {
            console.log(message);
        });
    }
}
```

##### one2AllBroadcast()
```
one2AllBroadcast(id, source, data, callback)
inputs: 
    [Number] id - the id of the calling function
    [Number] source - the id of process that is sending the data
    [Object] data - the data that will be send from the source to all
        other processes
    [Function] callback - the function that will be run by each receiving
        process. The data from the sending process will be passed into the
        callback function as an argument
description: The process whose id is equal to the source input argument will
    send the data object to all other processes.  If a process that is not the
    source calls this function, it will wait to receive a message from the source
    and then call the callback function.  The source object does not call the 
    callback function. 
```
one2AllBroadcast Example
```
$(document).ready(function() {
    var options = {
        topoLogy: 'SWITCH'
    }
    psimJS.init(3, options, doWork);
});

function doWork(id) {
    psimJS.one2AllBroadcast(id, 0, id, function (data) {
        console.log('id: ' + id + ' message - ' + data);
    })
}
```

##### all2OneCollect()
```
all2OneCollect(id, destination, value, callback)
inputs: 
    [Number] id - the id of the calling function
    [Number] destination - the id of process that will receive all the data
    [Object] value - the data that will be send from the processes to the
        destination
    [Function] callback - the function that will be run by the destination
        process. An array of the data from the sending processes will be 
        passed into the callback function as an argument
description: The process whose id is equal to the destination input argument will
    receive data from all other processes as an array. The sending objects do 
    not call the callback function. 
```
all2OneCollect Example
```
$(document).ready(function() {
    var options = {
        topoLogy: 'SWITCH'
    }
    psimJS.init(3, options, doWork);
});

function doWork(id) {
    psimJS.all2OneCollect(id, 0, id, function (data) {
        console.log('id: ' + id + ' message - ' + data);
    })
}
```
##### all2AllBroadcast()
```
all2AllBroadcast(id, value, callback)
inputs:
    [Number] id - the id of the calling function
    [Object] value - The data that will be sent by the calling process to all
        other processes
    [Function] callback - This function is called once the values sent by all
        processes is collected into an array.  The array of all values will be
        passed into the callback function as an argument.
description: Must be called by all processes before any callbacks are run. The
    values passed by all of the processes are collected into an array and passed
    back to all the processes.
```
Example all2AllBroadcast
```
$(document).ready(function() {
    var options = {
        topoLogy: 'SWITCH'
    }
    psimJS.init(3, options, doWork);
});

function doWork(id) {
    psimJS.all2AllBroadcast(id, id, function (data) {
        console.log('id: ' + id + ' message - ' + data);
    })
}
```
##### all2OneReduce()
```
all2OneReduce(id, destination, value, operation, callback)
inputs:
    [Number] id - the id of the calling function
    [Number] destination - The id of the process that will receive the reduced data
    [Object] value - The data from the calling process that will be passed
        into the reduce operation
    [Function] operation - The function that will be used to reduce the data
        from all processes. This function must be compatible with Javascript's
        reduce() function.  If no operation is passed in, it defaults to a sum
        function
    [Function] callback - The function that is called by the destination process
        after all data has been received and reduced. The result of the operation
        function is passed in as an argument to the callback function
description: Must be called by all processes.  The values from each process
    are gathered in an array and then reduced to a single value using the 
    operation function.  That single value is then passed into the callback
    function by the destination process.
```
Example all2OneReduce
```
$(document).ready(function() {
    var options = {
        topology: 'SWITCH'
    };
    psimJS.init(10, options, doWork);
});

function doWork(id) {
    psimJS.all2OneReduce(id, 0, id, null, function(data) {
        console.log('id: ' + id + ' message - ' + data);
    });
}
```
##### all2AllReduce()
```
all2AllReduce(id, value, operation, callback)
inputs:
    [Number] id - the id of the calling function
    [Object] value - The data from the calling process that will be passed
        into the reduce operation
    [Function] operation - The function that will be used to reduce the data
        from all processes. This function must be compatible with Javascript's
        reduce() function.  If no operation is passed in, it defaults to a sum
        function
    [Function] callback - The function that is called by the each process
        after all data has been received and reduced. The result of the operation
        function is passed in as an argument to the callback function
description: Must be called by all processes.  The values from each process
             are gathered in an array and then reduced to a single value using the 
             operation function.  That single value is then passed into the callback
             function by the all processes.
```
Example all2AllReduce
```
$(document).ready(function() {
    var options = {
        topology: 'SWITCH'
    };
    psimJS.init(10, options, doWork);
});

function doWork(id) {
    psimJS.all2AllReduce(id, id, null, function(data) {
        console.log('id: ' + id + ' message - ' + data);
    });
}
```

##### barrier()
```
barrier(id, callback)
inputs:
    [Number] id - the id of the calling function
    [Function] callback - This function is called after all processes
        have run barrier().  No arguments are passed in to callback.
description: Must be called by all processes.  Once called, a process will
    wait until all other processes have called barrier() and then run the 
    callback function.
```
Example barrier
```
$(document).ready(function() {
    var options = {
        topology: 'SWITCH'
    };
    psimJS.init(10, options, doWork);
});

function doWork(id) {
    console.log('id: ' + id + ' calling barrier');
    psimJS.barrier(id, function() {
        console.log('id: ' + id + ' barrier ended');
    });
}
```

## Authors

* **Mike Sherry** - *Initial work* - [psimJS](https://github.com/MikeSherry24/psimJS)

## Acknowledgments

* Massimo DiPierro wrote the original version of psim for Python that this is based on - [psim.py](https://dl.dropboxusercontent.com/u/18065445/DePaul/CSC503/psim.py)
