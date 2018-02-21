const remoteDOM = require('../remote');
const localDOM = require('../local');

const trace = false;

if (trace) {
  require('fs').writeFileSync('trace.log','');
}
function syncTimeout (cb) {
  cb();
}

function setup (windowOverrides, documentOverrides, timerFunc) {
  const jsdom = require('jsdom');
  const jsdomDefaultView = jsdom.jsdom({
    features: {
      FetchExternalResources: false,
      ProcessExternalResources: false
    }
  }).defaultView;

  remoteDOM.populateGlobalScope(global); // eslint-disable-line no-undef

  Object.assign(jsdomDefaultView.window, windowOverrides);
  localDOM.setWindow(jsdomDefaultView.window);

  let localHandler = null;
  let remoteHandler = null;

  const nativeInvocationMock = jest.fn();

  const localQueue = localDOM.createMessageQueue({
    postMessage: function (message) {
      if (trace) {
        require('fs').appendFileSync('trace.log', 'localDOM:'+message + '\n');
      }
      if (remoteHandler) {
        remoteHandler({data: message});
      }
    },
    addEventListener: function (msgType, handler) {
      localHandler = handler;
    }
  }, timerFunc || syncTimeout, {native: nativeInvocationMock});

  remoteDOM.setChannel({
    postMessage: function (message) {
      if (trace) {
        require('fs').appendFileSync('trace.log', 'remoteDOM:'+message + '\n');
      }
      if (localHandler) {
        localHandler({data: message});
      }
    },
    addEventListener: function (msgType, handler) {
      remoteHandler = handler;
    }
  }, timerFunc || syncTimeout);

  return {
    jsdomDefaultView,
    localQueue,
    nativeInvocationMock
  };
}

function setupRemote(timerFunc) {
  let remoteHandler;

  remoteDOM.setChannel({
    postMessage: function () {},
    addEventListener: function (msgType, handler) {
      remoteHandler = handler;
    }
  }, timerFunc || syncTimeout);

  return remoteHandler;
}

export default {
  setup,
  setupRemote
};
