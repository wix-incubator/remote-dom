const remoteDOM = require('../remote');
const localDOM = require('../local');

global.document = remoteDOM.document;
global.window = remoteDOM.window;
global.navigator = {userAgent: 'Chrome'};
console.debug = console.log.bind(console);

const React = require('react');
const ReactDOM = require('react-dom');

const jsdom = require('jsdom');
const jsdomDefaultView = jsdom.jsdom({
    features: {
        FetchExternalResources: false,
        ProcessExternalResources: false
    }
}).defaultView;
localDOM.setWindow(jsdomDefaultView.window)

let localHandler = null;
let remoteHandler = null;
function syncTimeout(cb) {
  cb();
}

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
}, syncTimeout);

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

let domContainer,remoteContainer, localContainer;
let counter = 0;

beforeEach(() => {
  domContainer = jsdomDefaultView.document.createElement('div');
  const id = 'container_' + counter++;
  jsdomDefaultView.document.body.appendChild(domContainer);
  localContainer = localDOM.createContainer(localQueue, domContainer, id);
  remoteContainer = remoteDOM.createContainer(id);
});

it('native innerHTML', () => {
  remoteContainer.innerHTML = '<h1>hello</h1>';
  expect(domContainer.innerHTML).toBe('<h1>hello</h1>');
});

it('native textContent', () => {
  remoteContainer.textContent = 'some text';
  expect(domContainer.textContent).toBe('some text');
});

it('basic react stateless comp', () => {
  const statelessComp = (props) => (<span>hello {props.name}</span>);
  ReactDOM.render(React.createElement(statelessComp, {name:'world'}), remoteContainer);
  expect(domContainer.textContent).toBe('hello world');
});

