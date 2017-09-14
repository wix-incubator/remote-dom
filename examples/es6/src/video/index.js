
import { createMessageQueue, createContainer } from '../../../../src/local.js';

var worker = new Worker('dist/video-worker-bundle.js');
var localQueue = createMessageQueue(worker, null, {});
var container = createContainer(localQueue, document.getElementById('dom-target'));
