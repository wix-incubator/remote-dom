const remoteDOM = require('./src/remote');
const localDOM = require('./src/local');

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
const container = jsdomDefaultView.document.createElement('div');
jsdomDefaultView.document.body.appendChild(container);
localDOM.setWindow(jsdomDefaultView.window)

const App = React.createClass({
    getInitialState: function () {
        return {counter: 0};
    },
    click: function () {
        this.setState({counter: this.state.counter + 1});
    },
    render: function () {
        var child;
        if ((this.state.counter % 3) === 0) {
            child = React.createElement('span', {}, "hello" + this.state.counter);
        } else {
            child = React.createElement('div', {}, '' + this.state.counter);
        }
        var props = {onClick: this.click}
        if (this.state.counter === 0) {
          props.style = {background:'red'};
        }
        return React.createElement('div', props, child);
    },
    componentDidMount: function () {
        setTimeout(function () {
            this.setState({counter: 1})
        }.bind(this), 100);
    }
});

let localHandler = null;
let remoteHandler = null;

const localQueue = localDOM.createMessageQueue({
  postMessage: function(message) {
    console.log(message);
    if (remoteHandler) {
      remoteHandler({data: message});
    }
  },
  addEventListener: function (msgType, handler) {
    localHandler = handler;
  }
})

console.log('---------')
const remoteC = remoteDOM.createContainer();
const localC = localDOM.createContainer(localQueue, container);
remoteDOM.setChannel({
  postMessage: function (message) {
    console.log(message);
    if (localHandler) {
      localHandler({data: message});
    }
  },
  addEventListener: function(msgType, handler) {
    remoteHandler = handler;
  }
})
console.log('---------')

// remoteC.ownerDocument = new Proxy(remoteC.ownerDocument, loggingProxyHandler('document'));

const inst = ReactDOM.render(React.createElement(App, {}), remoteC);
function printContainer() {
  console.log(container.innerHTML);
}
setTimeout(printContainer,30);
setTimeout(function () {
    console.log('after timeout');
    printContainer();
}, 200);

let counter = 5;

function simulateClick() {
    if (counter === 0) {
      return;
    }
    counter--;
    setTimeout(function () {
        container.firstChild.click();
        setTimeout(function () {
            console.log('after timeout2');
            console.log(container.innerHTML);
            simulateClick();
        }, 200);
    }, 1000);
}

simulateClick();
