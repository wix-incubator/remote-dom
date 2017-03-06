const React = require('react');
const ReactDOM = require('react-dom');
const remoteDOM = require('../remote');
const localDOM = require('../local');

global.document = remoteDOM.document;
global.window = remoteDOM.window;
global.navigator = {userAgent: 'Chrome'};
console.debug = console.log.bind(console);

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


it('dangerouslySetInnerHTML prop', () => {
  const statelessComp = (props) => (<span dangerouslySetInnerHTML={{__html: props.name}}></span>);
  ReactDOM.render(React.createElement(statelessComp, {name:'hello world'}), remoteContainer);
  expect(domContainer.textContent).toBe('hello world');
});

it('native invocation', () => {
    const statelessComp = (props) => (<span ref={(span)=> {
        span.invokeNative('native', true)
    }}>hello {props.name}</span>);
    ReactDOM.render(React.createElement(statelessComp, {name:'world'}), remoteContainer);
    expect(domContainer.textContent).toBe('hello world');
    expect(nativeInvocationMock).toHaveBeenLastCalledWith(domContainer.firstChild, true);
});

it('event click', () => {
    const clickHandler = jest.fn();
    const statelessComp = (props) => (<span onClick={clickHandler}>hello {props.name}</span>);
    ReactDOM.render(React.createElement(statelessComp, {name:'world'}), remoteContainer);
    expect(domContainer.textContent).toBe('hello world');
    expect(clickHandler).not.toHaveBeenCalled();
    domContainer.firstChild.click();
    expect(clickHandler).toHaveBeenCalled();
})

it('node removeAttribute', () => {
    const statelessComp = (props) => (<span style={{width: props.width}}>hello {props.name}</span>)
    ReactDOM.render(React.createElement(statelessComp, {width:'200px'}), remoteContainer)
    expect(domContainer.firstChild.attributes[1].value).toBe('width: 200px;')
    remoteContainer.firstChild.removeAttribute('style')
    expect(domContainer.firstChild.attributes[1]).toBeUndefined()
})

it('node replaceChild', () => {
    const statelessComp = (props) => (<div><span>hello span 1</span><span>hello span 2</span></div>)
    ReactDOM.render(React.createElement(statelessComp), remoteContainer)
    const children = remoteContainer.children[0].children
    remoteContainer.children[0].replaceChild(children[1], children[0])
    expect(domContainer.textContent).toBe('hello span 2')
})
