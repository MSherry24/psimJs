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
