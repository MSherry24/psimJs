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
```
run(numProcesses, fileName)
inputs:
    [Number] numProcesses - The number of child processes to create
    [String] fileName - The path and name of the file that is to run by the child processes
outputs/callbacks: None
```
```
init(process, id, callback)
inputs:
    [Object] process - process is a keyword in Node.js and controls a number of message passing functions used by psimJS. Always pass in the variable process as this argument.
    [String] id - When run() starts new child processes, it passes in a unique id as a command line argument.  This value should be captured in the child processes and passed into the init function.
    [Function] callback - After all child processes have called init(), the callback function will be called for each child process
```
Example Initialization:
```
/*** worker.js
* In this example, id and childprocess are undefined the first time the program is run.  Since childProcess is undefined,
* psimJS.run() is called passing in 2 for the number of child processes to be created and 'worker.js' as the file to be run.
* It is assumed that the file shown below is worker.js, but run() and init() can, in theory, be in different files.
* run() will fork two child processes and pass in a unique id and a boolean true value as command line arguments.
* the id (argv[2]) is set to the variable id, and a boolean true (argv[3]) is set to the variable childProcess.  Since
* childProcess is no longer undefined, init() will be run instead of run() in the child processes.  They will pass in their
* own process object, their unique id, and the function doWork as arguments to init().  Once init() has been called by both
* child processes, doWork() will be run for every child process.  doWork will have access to the id object since it is a global
* variable.
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





## Authors

* **Mike Sherry** - *Initial work* - [psimJS](https://github.com/MikeSherry24/psimJS)

## Acknowledgments

* Massimo DiPierro wrote the original version of psim for Python that this is based on - [psim.py](https://dl.dropboxusercontent.com/u/18065445/DePaul/CSC503/psim.py)
