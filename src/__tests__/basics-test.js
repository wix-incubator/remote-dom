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

let domContainer, remoteContainer;
let counter = 0;
let env;

beforeEach(() => {
  env = testUtils.setup(windowOverrides);
  domContainer = env.jsdomDefaultView.document.createElement('div');
  const id = 'container_' + counter++;
  env.jsdomDefaultView.document.body.appendChild(domContainer);
  localDOM.createContainer(env.localQueue, domContainer, id);
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
  ReactDOM.render(React.createElement(statelessComp, {name: 'world'}), remoteContainer);
  expect(domContainer.textContent).toBe('hello world');
});

it('dangerouslySetInnerHTML prop', () => {
  const statelessComp = (props) => (<span dangerouslySetInnerHTML={{__html: props.name}}></span>);
  ReactDOM.render(React.createElement(statelessComp, {name: 'hello world'}), remoteContainer);
  expect(domContainer.textContent).toBe('hello world');
});

it('native invocation', () => {
  const statelessComp = (props) => (<span ref={(span) => {
    span.invokeNative('native', true);
  }}>hello {props.name}</span>);
  ReactDOM.render(React.createElement(statelessComp, {name: 'world'}), remoteContainer);
  expect(domContainer.textContent).toBe('hello world');
  expect(env.nativeInvocationMock).toHaveBeenLastCalledWith(domContainer.firstChild, true);
});

it('event click', () => {
  const clickHandler = jest.fn();
  const statelessComp = (props) => (<span onClick={clickHandler}>hello {props.name}</span>);
  ReactDOM.render(React.createElement(statelessComp, {name: 'world'}), remoteContainer);
  expect(domContainer.textContent).toBe('hello world');
  expect(clickHandler).not.toHaveBeenCalled();
  domContainer.firstChild.click();
  expect(clickHandler).toHaveBeenCalled();
});

it('node removeAttribute', () => {
  const statelessComp = (props) => (<span style={{width: props.width}}>hello {props.name}</span>);
  ReactDOM.render(React.createElement(statelessComp, {width: '200px'}), remoteContainer);
  expect(domContainer.firstChild.attributes[1].value).toBe('width: 200px;');
  remoteContainer.firstChild.removeAttribute('style');
  expect(domContainer.firstChild.attributes[1]).toBeUndefined();
});

it('node replaceChild', () => {
  const statelessComp = () => (<div><span>hello span 1</span><span>hello span 2</span></div>);
  ReactDOM.render(React.createElement(statelessComp), remoteContainer);
  const children = remoteContainer.children[0].children;
  remoteContainer.children[0].replaceChild(children[1], children[0]);
  expect(domContainer.textContent).toBe('hello span 2');
});

describe('initialization', () => {
  it('should update remote window properties from actual local window on initialization', function () {
    const windowOverridesWithoutMethods = Object.assign({}, windowOverrides);
    delete windowOverridesWithoutMethods.addEventListener;
    expect(remoteDOM.window).toMatchObject(windowOverridesWithoutMethods);
  });

  it('should register to relevant updates of actual local window properties', () => {
    expect(env.jsdomDefaultView.window.addEventListener).toHaveBeenCalledWith('orientationchange', expect.any(Function));
    expect(env.jsdomDefaultView.window.addEventListener).toHaveBeenCalledWith('resize', expect.any(Function));
  });
});

describe('node appendChild', () => {
  it("should put the new child at the end and update the child's parent", () => {
    const parent = remoteDOM.document.createElement('div');

    const aNode = parent.appendChild(remoteDOM.document.createElement('a'));
    const imgNode = parent.appendChild(remoteDOM.document.createElement('img'));

    expect(parent.childNodes).toEqual([aNode, imgNode]);
    expect(aNode.parentNode).toBe(parent);
    expect(imgNode.parentNode).toBe(parent);
  });

  it("should append the children of a document fragment and update the children's parents", () => {
    const parent = remoteDOM.document.createElement('div');
    const docFragment = remoteDOM.document.createDocumentFragment();
    const aNode = docFragment.appendChild(remoteDOM.document.createElement('a'));
    const imgNode = docFragment.appendChild(remoteDOM.document.createElement('img'));

    parent.appendChild(docFragment);

    expect(parent.childNodes).toEqual([aNode, imgNode]);
    expect(aNode.parentNode).toBe(parent);
    expect(imgNode.parentNode).toBe(parent);
  });
});

describe('node insertBefore', () => {
  describe('not providing a ref node', () => {
    it('should insert the new child at the end', () => {
      const parent = remoteDOM.document.createElement('div');
      const aNode = parent.appendChild(remoteDOM.document.createElement('a'));
      const imgNode = remoteDOM.document.createElement('img');
      remoteContainer.appendChild(parent);

      parent.insertBefore(imgNode);

      const domChildren = domContainer.children[0].children;
      expect(parent.childNodes).toEqual([aNode, imgNode]);
      expect(aNode.parentNode).toBe(parent);
      expect(imgNode.parentNode).toBe(parent);
      expect(Array.from(domChildren).map(child => child.tagName.toLowerCase())).toEqual(['a', 'img']);
    });

    it("should insert a document fragment's children at the end (and not the fragment itself)", () => {
      const parent = remoteDOM.document.createElement('div');
      const aNode = parent.appendChild(remoteDOM.document.createElement('a'));
      const docFragment = remoteDOM.document.createDocumentFragment();
      const imgNode = docFragment.appendChild(remoteDOM.document.createElement('img'));
      const spanNode = docFragment.appendChild(remoteDOM.document.createElement('span'));
      remoteContainer.appendChild(parent);

      parent.insertBefore(docFragment);

      const domChildren = domContainer.children[0].children;
      expect(parent.childNodes).toEqual([aNode, imgNode, spanNode]);
      expect(aNode.parentNode).toBe(parent);
      expect(imgNode.parentNode).toBe(parent);
      expect(spanNode.parentNode).toBe(parent);
      expect(Array.from(domChildren).map(child => child.tagName.toLowerCase())).toEqual(['a', 'img', 'span']);
    });
  });

  describe('providing a ref node', () => {
    it('should insert the new child before the ref child', () => {
      const parent = remoteDOM.document.createElement('div');
      const aNode = remoteDOM.document.createElement('a');
      const imgNode = remoteDOM.document.createElement('img');
      remoteContainer.appendChild(parent);
      parent.appendChild(aNode);

      parent.insertBefore(imgNode, aNode);

      const domChildren = domContainer.children[0].children;
      expect(parent.childNodes).toEqual([imgNode, aNode]);
      expect(aNode.parentNode).toBe(parent);
      expect(imgNode.parentNode).toBe(parent);
      expect(Array.from(domChildren).map(child => child.tagName.toLowerCase())).toEqual(['img', 'a']);
    });

    it("should insert a document fragment's children before the ref child (and not the fragment itself)", () => {
      const parent = remoteDOM.document.createElement('div');
      const aNode = parent.appendChild(remoteDOM.document.createElement('a'));
      const docFragment = remoteDOM.document.createDocumentFragment();
      const imgNode = docFragment.appendChild(remoteDOM.document.createElement('img'));
      const spanNode = docFragment.appendChild(remoteDOM.document.createElement('span'));
      remoteContainer.appendChild(parent);

      parent.insertBefore(docFragment, aNode);

      const domChildren = domContainer.children[0].children;
      expect(parent.childNodes).toEqual([imgNode, spanNode, aNode]);
      expect(aNode.parentNode).toBe(parent);
      expect(imgNode.parentNode).toBe(parent);
      expect(spanNode.parentNode).toBe(parent);
      expect(Array.from(domChildren).map(child => child.tagName.toLowerCase())).toEqual(['img', 'span', 'a']);
    });
  });

  describe('providing a ref node that is not a child of the parent node', () => {
    it('should throw error and not send a message', () => {
      const parent = remoteDOM.document.createElement('div');
      const imgNode = remoteDOM.document.createElement('img');
      const aNode = remoteDOM.document.createElement('a');
      remoteContainer.appendChild(parent);

      expect(() => {
        parent.insertBefore(imgNode, aNode);
      }).toThrow();
      expect(domContainer.children[0].children.length).toBe(0);
    });
  });
});

describe('node replaceChild', () => {
  describe('not providing a ref node', () => {
    it('should throw error and not send a message', () => {
      const parent = remoteDOM.document.createElement('div');
      const aNode = remoteDOM.document.createElement('a');
      parent.appendChild(remoteDOM.document.createElement('img'));
      remoteContainer.appendChild(parent);

      expect(() => {
        parent.replaceChild(aNode);
      }).toThrow();
      expect(domContainer.children[0].children.length).toBe(1);
      expect(domContainer.children[0].children[0].tagName.toLowerCase()).toBe('img');
    });
  });

  describe('providing a ref node', () => {
    it('should replace the old child with the new before the ref child', () => {
      const parent = remoteDOM.document.createElement('div');
      const aNode = parent.appendChild(remoteDOM.document.createElement('a'));
      const imgNode = remoteDOM.document.createElement('img');
      remoteContainer.appendChild(parent);

      parent.replaceChild(imgNode, aNode);

      expect(parent.childNodes).toEqual([imgNode]);
      expect(aNode.parentNode).toBe(null);
      expect(imgNode.parentNode).toBe(parent);
      expect(domContainer.children[0].children.length).toBe(1);
      expect(domContainer.children[0].children[0].tagName.toLowerCase()).toBe('img');
    });

    it('should replace the old child with the children of a document fragment (and not the fragment itself)', () => {
      const parent = remoteDOM.document.createElement('div');
      const aNode = parent.appendChild(remoteDOM.document.createElement('a'));
      const docFragment = remoteDOM.document.createDocumentFragment();
      const imgNode = docFragment.appendChild(remoteDOM.document.createElement('img'));
      const spanNode = docFragment.appendChild(remoteDOM.document.createElement('span'));
      remoteContainer.appendChild(parent);

      parent.replaceChild(docFragment, aNode);

      const domChildren = domContainer.children[0].children;
      expect(parent.childNodes).toEqual([imgNode, spanNode]);
      expect(aNode.parentNode).toBe(null);
      expect(imgNode.parentNode).toBe(parent);
      expect(spanNode.parentNode).toBe(parent);
      expect(domContainer.children[0].children.length).toBe(2);
      expect(Array.from(domChildren).map(child => child.tagName.toLowerCase())).toEqual(['img', 'span']);
    });
  });

  describe('providing a ref node that is not a child of the parent node', () => {
    it('should throw error and not send a message', () => {
      const parent = remoteDOM.document.createElement('div');
      const imgNode = remoteDOM.document.createElement('img');
      const aNode = remoteDOM.document.createElement('a');
      remoteContainer.appendChild(parent);

      expect(() => {
        parent.replaceChild(imgNode, aNode);
      }).toThrow();
      expect(domContainer.children[0].children.length).toBe(0);
    });
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
      detail: {
        foo: 'bar'
      }
    });
    const listenerSpy = jest.fn();
    remoteContainer.appendChild(divNode);
    divNode.addEventListener('test-event', listenerSpy);

    divNode.dispatchEvent(evt);

    expect(listenerSpy).toHaveBeenCalledWith(expect.objectContaining({
      type: 'test-event',
      detail: {
        foo: 'bar'
      }
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
