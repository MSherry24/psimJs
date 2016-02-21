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

Add additional notes about how to deploy this on a live system

## Authors

* **Mike Sherry** - *Initial work* - [psimJS](https://github.com/MikeSherry24/psimJS)

## Acknowledgments

* Massimo DiPierro who wrote the original version of psim for Python [psim.py](https://dl.dropboxusercontent.com/u/18065445/DePaul/CSC503/psim.py)
