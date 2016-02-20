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
