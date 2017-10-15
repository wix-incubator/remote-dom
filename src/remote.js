/* eslint-env worker */

import {Node, Commands, Constants, MessagesQueue, StyleAttributes, EventDOMNodeAttributes, SupportedEvents} from './common';

let index = 0;
let initMsgPromiseResolver;
let initMsgPromise;

const queue = new MessagesQueue();
const eventsByTypeAndTarget = {};
const connectedElementsByIndex = {};

const INLINE_EVENT = 'INLINE_EVENT';

class RemoteStyle {
  constructor ($index) {
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
  });
});

class RemoteNodeInternal {
  constructor (nodeType, val) {
    index++;
    this.nodeType = nodeType;
    this.$index = index;
    this.$host = null;
    this.parentNode = null;
    this.childNodes = [];
    this.$value = val;
  }

  toString() {
    return `RemoteNode({nodeType:${this.nodeType},index:${this.$index}})`;
  }

  get children () {
    return this.childNodes;
  }

  get firstChild () {
    return this.childNodes[0];
  }

  get nextSibling () {
    if (!this.parentNode) {
      return null;
    }
    const idx = this.parentNode.childNodes.indexOf(this);
    if (idx === -1 || idx === this.parentNode.childNodes.length - 1) {
      return null;
    }
    return this.parentNode.childNodes[idx + 1];
  }

  get prevSibling () {
    if (!this.parentNode) {
      return null;
    }
    const idx = this.parentNode.childNodes.indexOf(this);
    if (idx === -1 || idx === 0) {
      return null;
    }
    return this.parentNode.childNodes[idx - 1];
  }

  get ownerDocument () {
    return document;
  }

  set host (host) {
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
      child.host = host;
    });
  }

  appendChild (child) {
    queue.push([Commands.appendChild, this.$index, child.$index]);

    const childrenToAppend = child.nodeType === Node.DOCUMENT_FRAGMENT_NODE ? child.childNodes : [child];
    this.childNodes.splice(this.childNodes.length, 0, ...childrenToAppend);
    childrenToAppend.forEach((childNode) => {
      childNode.parentNode = this;
      childNode.host = this.$host;
    });

    return child;
  }

  insertBefore (child, refChild) {
    const idx = refChild ? this.childNodes.indexOf(refChild) : this.childNodes.length;
    if (!child) {
      throw new Error('no child');
    }
    if (idx === -1) {
      throw new Error("Failed to execute 'insertBefore' on 'Node': The node before which the new node is to be inserted is not a child of this node.");
    }

    queue.push([Commands.insertBefore, this.$index, child.$index, refChild ? refChild.$index : null]);

    const childrenToInsert = child.nodeType === Node.DOCUMENT_FRAGMENT_NODE ? child.childNodes : [child];
    this.childNodes.splice(idx, 0, ...childrenToInsert);
    childrenToInsert.forEach((childNode) => {
      childNode.parentNode = this;
      childNode.host = this.$host;
    });

    return child;
  }

  removeChild (child) {
    queue.push([Commands.removeChild, this.$index, child.$index]);
    const idx = this.childNodes.indexOf(child);
    if (idx !== -1) {
      this.childNodes.splice(idx, 1);
    }
    child.host = null;
  }

  replaceChild (newChild, oldChild) {
    const idx = this.childNodes.indexOf(oldChild);
    if (idx === -1) {
      throw new Error("Failed to execute 'replaceChild' on 'Node': The node to be replaced is not a child of this node.");
    }

    queue.push([Commands.replaceChild, this.$index, newChild.$index, oldChild.$index]);

    const childrenToInsert = newChild.nodeType === Node.DOCUMENT_FRAGMENT_NODE ? newChild.childNodes : [newChild];
    this.childNodes.splice(idx, 1, ...childrenToInsert);
    childrenToInsert.forEach((childNode) => {
      childNode.parentNode = this;
      childNode.host = this.$host;
    });
    oldChild.parentNode = null;
    oldChild.host = null;
  }

  addEventListener (evtType, callback, capture) {
    addEventListener(this.$index, evtType, callback, capture);
  }

  removeEventListener (evtType, callback) {
    removeEventListener(this.$index, evtType, callback);
  }

  dispatchEvent (event) {
    dispatchEvent(this.$index, event);
  }

  set value (val) {
    this.$value = val;
    queue.push([Commands.setValue, this.$index, val]);
  }

  get value () {
    return this.$value;
  }

  get textContent () {
    return this.$textContent;
  }

  set textContent (val) {
    if (this.childNodes.length !== 1 || this.childNodes[0].nodeType !== Node.TEXT_NODE) {
      const childTextNode = new RemoteTextualNode(val);
      childTextNode.parentNode = this;
      childTextNode.$host = this.$host;
      this.childNodes = [childTextNode];
    }
    queue.push([Commands.textContent, this.$index, val, this.childNodes[0].$index]);
  }

  invokeNative (name, args) {
    queue.push([Commands.invokeNative, this.$index, name, args]);
  }
}

class RemoteNode extends RemoteNodeInternal {}

SupportedEvents.forEach(evtType => {
  Object.defineProperty(RemoteNode.prototype, evtType, {
    get: function() {
      this.$eventHandlers = this.$eventHandlers || {};
      return this.$eventHandlers[evtType];
    },
    set: function(evtHandler) {
      this.$eventHandlers = this.$eventHandlers || {};
      this.$eventHandlers[evtType] = evtHandler;
      setEventListener(this.$index, evtType.slice(2), evtHandler);
    }
  });
});

class RemoteTextualNode extends RemoteNode {
  constructor (text) {
    super(Node.TEXT_NODE, text);
    this.$value = text;
  }

  set nodeValue (val) {
    this.$value = val;
    queue.push([Commands.textContent, this.$index, val]);
  }

  get nodeValue() {
    return this.$value;
  }
}

class RemoteComment extends RemoteTextualNode {
  constructor (text) {
    super(Node.COMMENT_NODE, text);
  }
}

class RemoteText extends RemoteTextualNode {
  constructor (text) {
    super(Node.TEXT_NODE, text);
  }
}

class RemoteElement extends RemoteNode {
  constructor (tagName) {
    super(Node.ELEMENT_NODE);
    this.tagName = tagName.toUpperCase();
    this.$style = new RemoteStyle(this.$index);
    this.$attr = {};
  }

  get nodeName () {
    return this.tagName;
  }

  setAttribute (k, v) {
    queue.push([Commands.setAttribute, this.$index, k, v]);
    this.$attr[k] = {name: k, value: v};
    this[k] = v;
  }

  removeAttribute (k) {
    queue.push([Commands.removeAttribute, this.$index, k]);
    delete this.$attr[k];
  }

  hasAttribute(k) {
    return this.$attr.hasOwnProperty(k);
  }

  focus () {
    queue.push([Commands.focus, this.$index]);
  }

  setSelectionRange (selectionStart, selectionEnd, selectionDirection) {
    queue.push([Commands.setSelectionRange, this.$index, selectionStart, selectionEnd, selectionDirection]);
  }

  get style() {
    return this.$style;
  }

  set style (val) {
    queue.push([Commands.setStyle, this.$index, val]);
  }

  set innerHTML (val) {
    queue.push([Commands.innerHTML, this.$index, val]);
    this.$innerHTML = val;
  }

  get innerHTML () {
    return this.$innerHTML;
  }

  set innerText (val) {
    queue.push([Commands.innerText, this.$index, val]);
  }
}

class RemoteContainer extends RemoteElement {
  constructor () {
    super('div');
    this.$host = this.$index;
  }
}

class RemoteFragment extends RemoteNode {
  constructor () {
    super(Node.DOCUMENT_FRAGMENT_NODE);
  }
}

class RemoteVideo extends RemoteElement {
  constructor () {
    super('video');
  }

  pause () {
    queue.push([Commands.pause, this.$index]);
  }

  play () {
    queue.push([Commands.play, this.$index]);
  }

  get src () {
    return this.$src;
  }

  set src (value) {
    this.$src = value;
    queue.push([Commands.src, this.$index, value]);
  }
}

class RemoteInput extends RemoteElement {
  constructor () {
    super('input');
  }

  set value (val) {
    this.$value = val;
    queue.push([Commands.setValue, this.$index, val]);
  }

  get value () {
    return this.$value;
  }
}

function createElement (nodeName) {
  let res;
  switch(nodeName) {
    case 'video':
      res = new RemoteVideo();
      break;
    case 'input':
      res = new RemoteInput();
      break;
    default:
      res = new RemoteElement(nodeName);
  }
  queue.push([Commands.createElement, res.$index, res.tagName]);
  return res;
}

function createTextNode (text) {
  const res = new RemoteText(text);
  queue.push([Commands.createTextNode, res.$index, text]);
  return res;
}

function createComment (text) {
  const res = new RemoteComment(text);
  queue.push([Commands.createComment, res.$index, text]);
  return res;
}

function createDocumentFragment () {
  const res = new RemoteFragment();
  queue.push([Commands.createDocumentFragment, res.$index]);
  return res;
}

function createContainer (name) {
  name = name || Constants.DEFAULT_NAME;
  const res = new RemoteContainer();
  connectedElementsByIndex[res.$index] = res;
  queue.push([Commands.createContainer, res.$index, name]);
  return res;
}

function addEventListener (target, evtName, callback, capture) {
  index++;
  eventsByTypeAndTarget[evtName] = eventsByTypeAndTarget[evtName] || {};
  eventsByTypeAndTarget[evtName][target] = eventsByTypeAndTarget[evtName][target] || {};
  eventsByTypeAndTarget[evtName][target][index] = callback;
  queue.push([Commands.addEventListener, target, evtName, index, capture]);
}

function removeEventListener (target, evtName, callback) {
  eventsByTypeAndTarget[evtName] = eventsByTypeAndTarget[evtName] || {};
  eventsByTypeAndTarget[evtName][target] = eventsByTypeAndTarget[evtName][target] || {};
  const evts = eventsByTypeAndTarget[evtName][target];
  const idx = Object.keys(evts).find((evtIndex) => {
    return evts[evtIndex] === callback;
  });
  delete evts[idx];
  queue.push([Commands.removeEventListener, target, evtName, index]);
}

function setEventListener(target, evtName, evtHandler) {
  eventsByTypeAndTarget[evtName] = eventsByTypeAndTarget[evtName] || {};
  eventsByTypeAndTarget[evtName][target] = eventsByTypeAndTarget[evtName][target] || {};
  if (evtHandler && !eventsByTypeAndTarget[evtName][target][INLINE_EVENT]) {
    queue.push([Commands.addEventListener, target, evtName, INLINE_EVENT, false]);
  } else if (!evtHandler && eventsByTypeAndTarget[evtName][target][INLINE_EVENT]) {
    queue.push([Commands.removeEventListener, target, evtName, INLINE_EVENT]);
  }
  if (typeof evtHandler === 'string') {
    evtHandler = Function('event', evtHandler);
  }
  eventsByTypeAndTarget[evtName][target][INLINE_EVENT] = evtHandler;
}

function dispatchEvent (target, event) {
  queue.push([Commands.dispatchEvent, target, event._type, event._eventInit, event._isCustom || false]);
}

function updateConnectedElement(index, eventData) {
  if (connectedElementsByIndex[index] && eventData[index]) {
    Object.assign(connectedElementsByIndex[index], eventData[index]);
  }
}

function handleMessagesFromPipe(messages) {
  messages.forEach(msg => {
    const evtIntent = msg[0];
    switch (evtIntent) {
      case (Constants.INIT): {
        initMsgPromiseResolver && initMsgPromiseResolver();
        const eventData = msg[1];
        Object.keys(eventData).forEach((index) => {
          updateConnectedElement(index, eventData);
        });
      }
        break;
      default: {
        const evtTarget = msg[1];
        const evtName = msg[2];
        const evtJSON = msg[3];
        Object.keys(evtJSON.extraData).forEach((index) => {
          updateConnectedElement(index, evtJSON.extraData);
        });
        EventDOMNodeAttributes.forEach((field) => {
          evtJSON[field] = (evtJSON[field] instanceof Array) ? evtJSON[field].map(val => connectedElementsByIndex[val]) : connectedElementsByIndex[evtJSON[field]];
        });

        if (eventsByTypeAndTarget[evtName] && eventsByTypeAndTarget[evtName][evtTarget]) {
          Object.keys(eventsByTypeAndTarget[evtName][evtTarget]).forEach((callbackIndex) => {
            eventsByTypeAndTarget[evtName][evtTarget][callbackIndex](evtJSON);
          });
        }
      }
    }
  });
}

function setChannel(channel, timerFunction) {
  initMsgPromise = new Promise(resolve => {initMsgPromiseResolver = resolve;});
  queue.setPipe(channel, handleMessagesFromPipe, timerFunction);
  queue.push([Commands.initiated]);
}

function onInit(cb) {
  initMsgPromise.then(() => cb());
}

const document = {
  createElement,
  createTextNode,
  createComment,
  createDocumentFragment,
  addEventListener: addEventListener.bind(null, Constants.DOCUMENT),
  removeEventListener: removeEventListener.bind(null, Constants.DOCUMENT),
  documentElement: new RemoteElement('html'),
  dispatchEvent: dispatchEvent.bind(null, Constants.DOCUMENT)
};

SupportedEvents.forEach((e) => {
  document[e] = addEventListener.bind(null, Constants.DOCUMENT, e.substr(2));
});

class Event {
  constructor (typeArg, eventInit) {
    this._type = typeArg;
    this._eventInit = eventInit;
  }
}

class CustomEvent extends Event {
  constructor (typeArg, customEventInit) {
    super(typeArg, customEventInit);
    this._isCustom = true;
  }
}

const window = {
  Event,
  CustomEvent,
  dispatchEvent: dispatchEvent.bind(null, Constants.WINDOW),
  addEventListener: addEventListener.bind(null, Constants.WINDOW),
  removeEventListener: removeEventListener.bind(null, Constants.WINDOW),
  document: document,
  location: {href: 'https://localhost', protocol: 'https:'},
  navigator: {
    userAgent: 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_12_1) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/54.0.2840.98 Safari/537.36'
  },
  history: {},
  requestAnimationFrame: setTimeout,
  cancelAnimationFrame: clearTimeout
};
window.top = window;

connectedElementsByIndex[Constants.WINDOW] = window;
connectedElementsByIndex[Constants.DOCUMENT] = document;

export {
  document,
  window,
  createContainer,
  setChannel,
  onInit
};
