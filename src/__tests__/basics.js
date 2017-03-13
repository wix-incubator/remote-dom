const React = require('react');
const ReactDOM = require('react-dom');
const remoteDOM = require('../remote');
const localDOM = require('../local');

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
  devicePixelRatio: 2,
  innerWidth: 50,
  innerHeight: 60
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
jsdomDefaultView.window.innerWidth = windowData.innerWidth;
jsdomDefaultView.window.innerHeight = windowData.innerHeight;
jsdomDefaultView.window.addEventListener = jest.fn();
localDOM.setWindow(jsdomDefaultView.window);

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

function createSingleMessage(target, command, data) {
  return [target, command, data];
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
    const updatePropertiesMessage = createSingleMessage('WINDOW', 'updateProperties', {
      extraData: {
        WINDOW: windowData
      }});
    expect(localChannel.postMessage.mock.calls[0][0]).toEqual(createPostMessage([updatePropertiesMessage]));
  });

  it('should update window properties on remote side when it gets an updateProperties message', function() {
    expect(remoteDOM.window).toMatchObject(windowData);
  });

  it('should register to relevant updates of window properties', () => {
    expect(jsdomDefaultView.window.addEventListener.mock.calls[0][0]).toEqual('orientationchange');
  });
});
