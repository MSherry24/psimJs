# psimJS

psimJS is an MPI simulator for Node.js and regular old client side Javacript.

## Getting Started

Download psimJS.js and psimJSClient.js.  psimJS is the Node.js version and psimJSClient.js is the client side version.  

### Prerequisities

If you're using the Node.js version, make sure you have Node.js and npm installed on your computer.  psimJS uses Node's 'child-process' library, which should be globally available after you install Node.js.
If you're using the client version, all you need is a relatively up to date version of a modern browser.  psimJS was developed using Chrome, but it should also work in Firefox and the latest version of IE (probably).

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
The functionality of the common functions is the same between both versions, but the arguments required a slightly different due to the different back end designs. The Node.js version also provides a few additional functions for creating and closing new processes, although most of the work is handled by psimJS behind the scenes.
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
After initializing s child 
process, you can call any of these functions.
##### send()
```
send(j, data)
inputs: 
    [Number] j - id of the process that will receive the data
    [object] data - data that will be send to process j.  Can be any Javascript object.
```
##### receive()
```
receive(j, callback)
inputs: 
    [Number] j - id of the process that is sending the data
    [Function] callback - function that will be called when the data is received from 
        process j.  The data object is passed into the callback function as its first
        argument.
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
##### all2AllReduce()
##### barrier()




## Authors

* **Mike Sherry** - *Initial work* - [psimJS](https://github.com/MikeSherry24/psimJS)

## Acknowledgments

* Massimo DiPierro wrote the original version of psim for Python that this is based on - [psim.py](https://dl.dropboxusercontent.com/u/18065445/DePaul/CSC503/psim.py)
