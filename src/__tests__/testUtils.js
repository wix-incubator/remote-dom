const remoteDOM = require('../remote');
const localDOM = require('../local');

function setup (windowOverrides) {
  const jsdom = require('jsdom');
  const jsdomDefaultView = jsdom.jsdom({
    features: {
      FetchExternalResources: false,
      ProcessExternalResources: false
    }
  }).defaultView;

  Object.assign(jsdomDefaultView.window, windowOverrides);
  localDOM.setWindow(jsdomDefaultView.window);

  let localHandler = null;
  let remoteHandler = null;
  function syncTimeout (cb) {
    cb();
  }

  const nativeInvocationMock = jest.fn();

  const localQueue = localDOM.createMessageQueue({
    postMessage: function (message) {
      if (remoteHandler) {
        remoteHandler({data: message});
      }
    },
    addEventListener: function (msgType, handler) {
      localHandler = handler;
    }
  }, syncTimeout, {native: nativeInvocationMock});

  remoteDOM.setChannel({
    postMessage: function (message) {
      if (localHandler) {
        localHandler({data: message});
      }
    },
    addEventListener: function (msgType, handler) {
      remoteHandler = handler;
    }
  }, syncTimeout);

  return {
    jsdomDefaultView,
    localQueue,
    nativeInvocationMock
  };
}

export default {
  setup
};
