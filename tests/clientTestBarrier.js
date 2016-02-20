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
