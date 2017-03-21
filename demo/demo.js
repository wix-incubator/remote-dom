importScripts(['require.js']);
requirejs.config({
//By default load any module IDs from js/lib
  paths: {
    RemoteDOM: '../dist/bundle',
    // react: './react.min',
    // reactDOM: './react-dom.min'
    react: './react.min',
    reactDOM: './react-dom.min',
    todo: './todo',
    dbmonster: './dbmonster',
    masonry: './masonry'
  }
});
require(['RemoteDOM'], function (RemoteDOM) {
  var remoteDOM = RemoteDOM.remote;
  self.window = remoteDOM.window;
  self.document = remoteDOM.document;
  remoteDOM.setChannel(self);
  require(['react', 'reactDOM', 'masonry'], function (React, ReactDOM, App) {
    remoteDOM.createContainer().then(container => ReactDOM.render(React.createElement(App), container))
  });
})
