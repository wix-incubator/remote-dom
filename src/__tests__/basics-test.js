import React from 'react';
import ReactDOM from 'react-dom';
import * as remoteDOM from '../remote';
import * as localDOM from '../local';
import testUtils from './testUtils';

const windowOverrides = {
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
  innerHeight: 60,
  addEventListener: jest.fn()
};

let domContainer,remoteContainer, localContainer;
let counter = 0;
let env;

beforeEach(() => {
  env = testUtils.setup(windowOverrides);
  domContainer = env.jsdomDefaultView.document.createElement('div');
  const id = 'container_' + counter++;
  env.jsdomDefaultView.document.body.appendChild(domContainer);
  localContainer = localDOM.createContainer(env.localQueue, domContainer, id);
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
    expect(env.nativeInvocationMock).toHaveBeenLastCalledWith(domContainer.firstChild, true);
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
    const windowOverridesWithoutMethods = Object.assign({}, windowOverrides);
    delete windowOverridesWithoutMethods.addEventListener;
    expect(remoteDOM.window).toMatchObject(windowOverridesWithoutMethods);
  });

  it('should register to relevant updates of actual local window properties', () => {
    expect(env.jsdomDefaultView.window.addEventListener).toHaveBeenCalledWith('orientationchange', expect.any(Function));
    expect(env.jsdomDefaultView.window.addEventListener).toHaveBeenCalledWith('resize', expect.any(Function));
  });
});

describe('dispatchEvent', () => {
  it('should dispatch a regular event with the requested type and init params', () => {
    const divNode = remoteDOM.document.createElement('div');
    const evt = new remoteDOM.window.Event('click', {
      bubbles: true,
      cancelable: true,
      scoped: true,
      composed: true
    });
    const listenerSpy = jest.fn();
    remoteContainer.appendChild(divNode);
    divNode.addEventListener('click', listenerSpy);

    divNode.dispatchEvent(evt);

    expect(listenerSpy).toHaveBeenCalledWith(expect.objectContaining({
      type: 'click',
      bubbles: true,
      cancelable: true
    }));
  });

  it('should dispatch a custom event with the requested type and init params', () => {
    const divNode = remoteDOM.document.createElement('div');
    const evt = new remoteDOM.window.CustomEvent('test-event', {
      bubbles: true,
      cancelable: true,
      scoped: true,
      composed: true
    });
    const listenerSpy = jest.fn();
    remoteContainer.appendChild(divNode);
    divNode.addEventListener('test-event', listenerSpy);

    divNode.dispatchEvent(evt);

    expect(listenerSpy).toHaveBeenCalledWith(expect.objectContaining({
      type: 'test-event',
      bubbles: true,
      cancelable: true
    }));
  });

  it('should dispatch event on window', () => {
    const evt = new remoteDOM.window.CustomEvent('test-event', {
      bubbles: true,
      cancelable: true,
      scoped: true,
      composed: true
    });
    const listenerSpy = jest.fn();
    remoteDOM.window.addEventListener('test-event', listenerSpy);
    env.jsdomDefaultView.window.dispatchEvent = jest.fn(); // this had to be done with a spy (opposed to the previous tests) since jsdom window does not function like a real window object

    remoteDOM.window.dispatchEvent(evt);

    expect(env.jsdomDefaultView.window.dispatchEvent).toHaveBeenCalled();
    expect(env.jsdomDefaultView.window.dispatchEvent.mock.calls[0][0].type).toBe('test-event');
  });
});
