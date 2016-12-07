importScripts(['require.js']);
requirejs.config({
//By default load any module IDs from js/lib
  paths: {
    remoteDOM: '../dist/remote',
    // react: './react.min',
    // reactDOM: './react-dom.min'
    react: './react.min',
    reactDOM: './react-dom.min'
  }
});
require(['remoteDOM'], function (remoteDOM) {
  self.window = remoteDOM.window;
  self.document = remoteDOM.document;

  require(['react', 'reactDOM'], function (React, ReactDOM) {
    self.React = React;
    remoteDOM.setChannel(self);
    importScripts(['todo.js']);
    ReactDOM.render(React.createElement(App), remoteDOM.createContainer())
  });
})
