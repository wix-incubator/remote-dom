var worker = new Worker('dist/demo-bundle.js');
var localQueue = remoteDOM.local.createMessageQueue(worker, null, {});
var container = remoteDOM.local.createContainer(localQueue, document.getElementById('dom-target'));