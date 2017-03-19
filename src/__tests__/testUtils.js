const React = require('react');
const ReactDOM = require('react-dom');
const remoteDOM = require('../remote');
const localDOM = require('../local');

global.document = remoteDOM.document;
global.window = remoteDOM.window;
global.navigator = {userAgent: 'Chrome'};
console.debug = console.log.bind(console);

function setup(windowOverrides) {
  const jsdom = require('jsdom');
  const jsdomDefaultView = jsdom.jsdom({
    features: {
      FetchExternalResources: false,
      ProcessExternalResources: false
    }
  }).defaultView;

  Object.assign(jsdomDefaultView.window, windowOverrides);
  localDOM.setWindow(jsdomDefaultView.window)

  let localHandler = null;
  let remoteHandler = null;
  function syncTimeout(cb) {
    cb();
  }

  const nativeInvocationMock = jest.fn();

  const localQueue = localDOM.createMessageQueue({
    postMessage: function(message) {
      //console.log(message);
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
      //console.log(message);
      if (localHandler) {
        localHandler({data: message});
      }
    },
    addEventListener: function(msgType, handler) {
      remoteHandler = handler;
    }
  }, syncTimeout);

  return {
    jsdomDefaultView,
    localQueue,
    nativeInvocationMock
  };
}

module.exports = {
    setup
}