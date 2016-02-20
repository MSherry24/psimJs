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
