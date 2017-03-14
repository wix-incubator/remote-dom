const React = require('react');
const ReactDOM = require('react-dom');
const remoteDOM = require('../remote');
const localDOM = require('../local');
const testUtils = require('./testUtils');

const windowData = {
  screen: {
    width: 100,
    height: 200,
    orientation: {
      angle: 0,
      type: 'test-type'
    }
  },
  devicePixelRatio: 2,
  innerWidth: 50,
  innerHeight: 60
};

let domContainer,remoteContainer, localContainer;
let counter = 0;

beforeEach(() => {
  Object.assign(testUtils.jsdomDefaultView.window, windowData);
  testUtils.jsdomDefaultView.window.addEventListener = jest.fn();
  domContainer = testUtils.jsdomDefaultView.document.createElement('div');
  const id = 'container_' + counter++;
  testUtils.jsdomDefaultView.document.body.appendChild(domContainer);
  localContainer = localDOM.createContainer(testUtils.localQueue, domContainer, id);
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
    expect(testUtils.nativeInvocationMock).toHaveBeenLastCalledWith(domContainer.firstChild, true);
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

describe('initialization', () => {
  it('should update remote window properties from actual local window on initialization', function() {
    expect(remoteDOM.window).toMatchObject(windowData);
  });

  it('should register to relevant updates of actual local window properties', () => {
    expect(jsdomDefaultView.window.addEventListener.mock.calls[0][0]).toEqual('orientationchange');
  });
});
