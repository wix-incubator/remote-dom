var worker = new Worker('dist/demo-bundle.js');
var localQueue = semiNative.createMessageQueue(worker, null, {});
var container = semiNative.createContainer(localQueue, document.getElementById('dom-target'));