import {Node, Commands, Constants, MessagesQueue, StyleAttributes, EventDOMNodeAttributes, SupportedEvents, Pipe}  from './common'

let index = 0;

const queue = new MessagesQueue();
const eventsByTypeAndTarget = {};
const connectedElementsByIndex = {};

class RemoteStyle {
  constructor($index) {
    this.$index = $index;
    this.$values = {};
  }
}

StyleAttributes.forEach((k) => {
  Object.defineProperty(RemoteStyle.prototype, k, {
    set: function (val) {
      queue.push([Commands.setStyle, this.$index, k, val]);
      this.$values[k] = val;
    },
    get: function () {
      return this.$values[k];
    }
  })
})


class RemoteNode {
  constructor(nodeType) {
    index++;
    this.nodeType = nodeType;
    this.$index = index;
    this.$host = null;
    this.parentNode = null;
    this.childNodes = [];
  }

  get children() {
    return this.childNodes;
  }

  get firstChild() {
    return this.childNodes[0];
  }

  get nextSibling() {
    if (!this.parentNode) {
      return null;
    }
    const idx = this.parentNode.childNodes.indexOf(this);
    if (idx === -1 || idx === this.parentNode.childNodes.length - 1) {
      return null;
    }
    return this.parentNode.childNodes[idx + 1];
  }

  get prevSibling() {
    if (!this.parentNode) {
      return null;
    }
    const idx = this.parentNode.childNodes.indexOf(this);
    if (idx === -1 || idx === 0) {
      return null;
    }
    return this.parentNode.childNodes[idx - 1];
  }

  get ownerDocument() {
    return document
  }

  set innerHTML(val) {
  }

  set host(host) {
    if (Boolean(host) === Boolean(this.$host)) {
      return;
    }
    this.$host = host;
    if (host) {
      connectedElementsByIndex[this.$index] = this;
    } else {
      delete connectedElementsByIndex[this.$index];
    }
    this.childNodes.forEach((child) => {
      child.host = host
    });
  }

  appendChild(child) {
    queue.push([Commands.appendChild, this.$index, child.$index]);
    child.parentNode = this;
    this.childNodes.push(child);
    child.host = this.$host;
  }

  insertBefore(child, refChild) {
    queue.push([Commands.insertBefore, this.$index, child.$index, refChild ? refChild.$index : null]);
    const idx = refChild ? this.childNodes.indexOf(refChild) : this.childNodes.length;
    child.parentNode = this;
    this.childNodes.splice(idx, 0, child);
    child.host = this.$host;
    return child;
  }

  removeChild(child) {
    queue.push([Commands.removeChild, this.$index, child.$index]);
    const idx = this.childNodes.indexOf(child)
    if (idx !== -1) {
      this.childNodes.splice(idx, 1);
    }
    child.host = null;
  }

  replaceChild(newChild, oldChild) {
    queue.push([Commands.replaceChild, this.$index, newChild.$index, oldChild.$index]);
    const idx = this.childNodes.indexOf(oldChild)
    if (idx !== -1) {
      this.childNodes.splice(idx, 1, newChild);
    }
    newChild.parentNode = this;
    newChild.host = this.$host;
    oldChild.host = null;
  }

  addEventListener(evtType, callback, capture) {
    addEventListener(this.$index, evtType, callback, capture);
  }

  removeEventListener(evtType, callback) {
    removeEventListener(this.$index, evtType, callback);
  }

  set value(val) {
    this.$value = val;
    queue.push([Commands.setValue, this.$index, val]);
  }

  get value() {
    return this.$value;
  }

  get textContent() {
    return this.$textContent;
  }

  set textContent(val) {
    queue.push([Commands.textContent, this.$index, val]);
  }

  invokeNative(name, args) {
    queue.push([Commands.invokeNative, this.$index, name, args]);
  }
}

class RemoteTextualNode extends RemoteNode {
  constructor(val) {
    super(Node.TEXT_NODE);
  }

  set nodeValue(val) {
    queue.push([Commands.textContent, this.$index, val]);
  }
}

class RemoteComment extends RemoteTextualNode {
  constructor(val) {
    super(Node.COMMENT_NODE, val);
  }
}

class RemoteText extends RemoteTextualNode {
  constructor(val) {
    super(Node.TEXT_NODE, val);
  }
}

class RemoteElement extends RemoteNode {
  constructor(tagName) {
    super(Node.ELEMENT_NODE);
    this.tagName = tagName.toUpperCase();
    this.$style = new RemoteStyle(this.$index);
    this.$attr = {};
  }

  get nodeName() {
    return this.tagName;
  }

  setAttribute(k, v) {
    queue.push([Commands.setAttribute, this.$index, k, v]);
    this.$attr[k] = {name: k, value: v};
    this[k] = v;
  }

  removeAttribute(k) {
    queue.push([Commands.removeAttribute, this.$index, k]);
    delete this.$attr[k];
  }

  get style() {
    return this.$style;
  }

  set style(val) {
    queue.push([Commands.setStyle, this.$index, val]);
  }

  set innerHTML(val) {
    queue.push([Commands.innerHTML, this.$index, val]);
  }

  set innerText(val) {
    queue.push([Commands.innerText, this.$index, val]);
  }
}


class RemoteContainer extends RemoteElement {
  constructor() {
    super('div');
    this.$host = this.$index;
  }
}

class RemoteFragment extends RemoteNode {
  constructor() {
    super(Node.DOCUMENT_FRAGMENT_NODE);
  }
}

class RemoteVideo extends RemoteElement {
    constructor() {
        super('video');
    }

    pause() {
      queue.push([Commands.pause, this.$index]);
    }

    play() {
      queue.push([Commands.play, this.$index]);
    }

    get src() {
      return this.$src;
    }

    set src(value) {
      this.$src =  value;
      queue.push([Commands.src, this.$index, value]);
    }
}

function createElement(tagName) {
  if (tagName === 'video') {
    return createVideoNode()
  }
  const res = new RemoteElement(tagName);
  queue.push([Commands.createElement, res.$index, res.tagName]);
  return res;
}

function createTextNode(val) {
  const res = new RemoteText();
  queue.push([Commands.createTextNode, res.$index, val]);
  return res;
}

function createComment(val) {
  const res = new RemoteNode();
  queue.push([Commands.createComment, res.$index, val]);
  return res;
}

function createVideoNode() {
  const res = new RemoteVideo();
  queue.push([Commands.createElement, res.$index, res.tagName]);
  return res;
}

function createDocumentFragment() {
    const res = new RemoteFragment();
    queue.push([Commands.createDocumentFragment, res.$index]);
    return res;
}

function createContainer(name) {
  name = name || Constants.DEFAULT_NAME;
  const res = new RemoteContainer();
  connectedElementsByIndex[res.$index] = res;
  queue.push([Commands.createContainer, res.$index, name]);
  return res;
}

function addEventListener(target, evtName, callback, capture) {
  index++;
  //console.log('addEventListener', target, evtName);
  eventsByTypeAndTarget[evtName] = eventsByTypeAndTarget[evtName] || {};
  eventsByTypeAndTarget[evtName][target] = eventsByTypeAndTarget[evtName][target] || {};
  eventsByTypeAndTarget[evtName][target][index] = callback;
  queue.push([Commands.addEventListener, target, evtName, index, capture]);
}

function removeEventListener(target, evtName, callback) {
  // console.log('addEventListener', target, evtName);
  eventsByTypeAndTarget[evtName] = eventsByTypeAndTarget[evtName] || {};
  eventsByTypeAndTarget[evtName][target] = eventsByTypeAndTarget[evtName][target] || {};
  const evts = eventsByTypeAndTarget[evtName][target];
  const idx = Object.keys(evts).find((evtIndex) => {
    evts[evtIndex] === callback;
  });
  delete evts[idx];
  queue.push([Commands.removeEventListener, target, evtName, index]);
}

function handleMessagesFromPipe(messages) {
  messages.forEach(msg => {
    const evtTarget = msg[0];
    const evtName = msg[1];
    const evtJSON = msg[2];
    Object.keys(evtJSON.extraData).forEach((index) => {
      if (connectedElementsByIndex[index] && evtJSON.extraData[index]) {
        Object.assign(connectedElementsByIndex[index], evtJSON.extraData[index]);
      }
    })
    EventDOMNodeAttributes.forEach((field) => {
      evtJSON[field] = (evtJSON[field] instanceof Array) ? evtJSON[field].map(val => connectedElementsByIndex[val]) : connectedElementsByIndex[evtJSON[field]];
    });
    // console.log(evtJSON);

    if (eventsByTypeAndTarget[evtName] && eventsByTypeAndTarget[evtName][evtTarget]) {
      Object.keys(eventsByTypeAndTarget[evtName][evtTarget]).forEach((callbackIndex) => {
        eventsByTypeAndTarget[evtName][evtTarget][callbackIndex](evtJSON);
      })
    }
  });
}

function setChannel(channel, timerFunction) {
  queue.setPipe(channel, handleMessagesFromPipe, timerFunction);
  onInit();
}

function onInit() {
  queue.push([Commands.initiated]);
}

const document = {
  createElement,
  createTextNode,
  createComment,
  createDocumentFragment,
  addEventListener: addEventListener.bind(null, Constants.DOCUMENT),
  removeEventListener: removeEventListener.bind(null, Constants.DOCUMENT),
  documentElement: new RemoteElement('html')
};

SupportedEvents.forEach((e) => {
  document[e] = addEventListener.bind(null, Constants.DOCUMENT, e.substr(2));
});

var window = {
  addEventListener: addEventListener.bind(null, Constants.WINDOW),
  removeEventListener: removeEventListener.bind(null, Constants.WINDOW),
  document: document,
  location: {href: 'https://localhost', protocol: 'https:'},
  navigator: {
    userAgent: 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_12_1) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/54.0.2840.98 Safari/537.36'
  },
  top: window
}

connectedElementsByIndex[Constants.WINDOW] = window;
connectedElementsByIndex[Constants.DOCUMENT] = document;


module.exports = {
  document,
  window,
  createContainer,
  setChannel
}
