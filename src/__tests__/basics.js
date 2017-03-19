const React = require('react');
const ReactDOM = require('react-dom');
const remoteDOM = require('../remote');
const localDOM = require('../local');
const common = require('../common');

// global.document = remoteDOM.document;
// global.window = remoteDOM.window;
// global.navigator = {userAgent: 'Chrome'};
console.debug = console.log.bind(console);

const windowData = {
  screen: {
    width: 100,
    height: 200,
    orientation: {
      angle: 0,
      type: 'test-type'
    }
  },
  devicePixelRatio: 2
};
const jsdom = require('jsdom');
const jsdomDefaultView = jsdom.jsdom({
    features: {
        FetchExternalResources: false,
        ProcessExternalResources: false
    }
}).defaultView;
jsdomDefaultView.window.screen.width = windowData.screen.width;
jsdomDefaultView.window.screen.height = windowData.screen.height;
jsdomDefaultView.window.devicePixelRatio = windowData.devicePixelRatio;
jsdomDefaultView.window.screen.orientation = {
  angle: windowData.screen.orientation.angle,
  type: windowData.screen.orientation.type,
  shouldNotTakeThisProp: 100
};
localDOM.setWindow(jsdomDefaultView.window)

let localHandler = null;
let remoteHandler = null;
function syncTimeout(cb) {
  cb();
}

const nativeInvocationMock = jest.fn();

const localChannel = {
  postMessage: jest.fn(function(message) {
    if (remoteHandler) {
      remoteHandler({data: message});
    }
  }),
  addEventListener: jest.fn(function (msgType, handler) {
    localHandler = handler;
  })
};
const localQueue = localDOM.createMessageQueue(localChannel, syncTimeout, {native: nativeInvocationMock});

let domContainer,remoteContainer, localContainer;
let counter = 0;

function createPostMessage (messages) {
  return JSON.stringify({REMOTE_DOM: messages});
}

function createSingleLocalMessage(target, command, data) {
  return [target, command, data];
}

function createSingleRemoteMessage(command, node1, node2, node3) {
  const nodeIndices = [node1, node2, node3]
    .filter(node => node !== undefined)
    .map(node => {
      if (node && node.$index) {
        return node.$index
      }
      return node;
    });
  return [command].concat(nodeIndices);
}

let remoteChannel;

beforeEach(() => {
  remoteChannel = {
    postMessage: jest.fn(function (message) {
      if (localHandler) {
        localHandler({data: message});
      }
    }),
    addEventListener: jest.fn(function(msgType, handler) {
      remoteHandler = handler;
    })
  };
  remoteDOM.setChannel(remoteChannel, syncTimeout);

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

describe('initialization', () => {
  it('should notify local when remote channel is set', () => {
    expect(remoteChannel.postMessage.mock.calls[0][0]).toEqual(createPostMessage([['initiated']]));
  });

  it('should send an "updateProperties" message to remote when local gets the remote initiated message', () => {
    const updatePropertiesMessage = createSingleLocalMessage('WINDOW', 'updateProperties', {
      extraData: {
        WINDOW: windowData
      }});
    expect(localChannel.postMessage.mock.calls[0][0]).toEqual(createPostMessage([updatePropertiesMessage]));
  });

  it('should update window properties on remote side when it gets an updateProperties message', function() {
    expect(remoteDOM.window).toMatchObject(windowData);
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
  describe("not providing a ref node", () => {
    it("should insert the new child at the end", () => {
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

  describe("providing a ref node", () => {
    it("should insert the new child before the ref child", () => {
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

  describe("providing a ref node that is not a child of the parent node", () => {
    it("should throw error and not send a message", () => {
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
  describe("not providing a ref node", () => {
    it("should throw error and not send a message", () => {
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

  describe("providing a ref node", () => {
    it("should replace the old child with the new before the ref child", () => {
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

    it("should replace the old child with the children of a document fragment (and not the fragment itself)", () => {
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

  describe("providing a ref node that is not a child of the parent node", () => {
    it("should throw error and not send a message", () => {
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
