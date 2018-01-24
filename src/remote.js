/* eslint-env worker */

import {Node, Commands, Constants, MessagesQueue, StyleAttributes, EventDOMNodeAttributes, SupportedEvents, generateGuid} from './common';

let eventListenersIndex = 0;
let initMsgPromiseResolver;

const queue = new MessagesQueue();
const eventsByTypeAndTarget = {};
const connectedElementsById = {};
const createContainerResolversByName = {};
const messenger = (() => {
  let isEnabled = true;

  return {
    disable: () => isEnabled = false,
    enable: () => isEnabled = true,
    addToQueue: (command, host, args) => {
      if (isEnabled) {
        queue.push([command, ...args, host]);
      }
    }
  };
})();

const INLINE_EVENT = 'INLINE_EVENT';

class RemoteStyle {
  constructor (id) {
    this.$id = id;
    this.$values = {};
  }
}

function deserializeDomNode(serializedNode) {
  const id = serializedNode.id;
  const element = createElementByType(serializedNode, id);
  element.className = serializedNode.className;
  element.nodeValue = serializedNode.nodeValue;
  element.value = serializedNode.value;
  Object.keys(serializedNode.attributes).forEach(i => {
    const attribute = serializedNode.attributes[i];
    element.setAttribute(attribute.name, attribute.value);
  });
  return element;
}

function deserializeDomTree(serializedNode, parentElement, element) {
  element = element || deserializeDomNode(serializedNode);
  const children = serializedNode.children;
  children.forEach(child => deserializeDomTree(child, element));
  parentElement && parentElement.appendChild(element);
  return element;
}

StyleAttributes.forEach((k) => {
  Object.defineProperty(RemoteStyle.prototype, k, {
    set: function (val) {
      messenger.addToQueue(Commands.setStyle, this.$host, [this.$id, k, val]);
      this.$values[k] = val;
    },
    get: function () {
      return this.$values[k];
    }
  });
});

class RemoteNodeInternal {
  constructor (nodeType, val, customId) {
    this.$id = customId === undefined ? generateGuid() : customId;
    this.nodeType = nodeType;
    this.$host = null;
    this.parentNode = null;
    this.childNodes = [];
    this.$value = val;
  }

  toString() {
    return `RemoteNode({nodeType:${this.nodeType},id:${this.$id}})`;
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
      connectedElementsById[this.$id] = this;
    } else {
      delete connectedElementsById[this.$id];
    }
    this.childNodes.forEach((child) => {
      child.host = host;
    });
  }
  appendChild (child) {
    messenger.addToQueue(Commands.appendChild, this.$host, [this.$id, child.$id]);

    const childrenToAppend = child.nodeType === Node.DOCUMENT_FRAGMENT_NODE ? child.childNodes : [child];
    this.childNodes.splice(this.childNodes.length, 0, ...childrenToAppend);
    childrenToAppend.forEach((childNode) => {
      childNode.parentNode = this;
      childNode.host = this.$host;
    });
  //add host recursively to all children
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

    messenger.addToQueue(Commands.insertBefore, this.$host, [this.$id, child.$id, refChild ? refChild.$id : null]);

    const childrenToInsert = child.nodeType === Node.DOCUMENT_FRAGMENT_NODE ? child.childNodes : [child];
    this.childNodes.splice(idx, 0, ...childrenToInsert);
    childrenToInsert.forEach((childNode) => {
      childNode.parentNode = this;
      childNode.host = this.$host;
    });

    return child;
  }

  removeChild (child) {
    messenger.addToQueue(Commands.removeChild, this.$host, [this.$id, child.$id]);
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

    messenger.addToQueue(Commands.replaceChild, this.$host, [this.$id, newChild.$id, oldChild.$id]);

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
    addEventListener(this.$id, this.$host, evtType, callback, capture);
  }

  removeEventListener (evtType, callback) {
    removeEventListener(this.$id, this.$host, evtType, callback);
  }

  dispatchEvent (event) {
    dispatchEvent(this.$id, this.$host, event);
  }

  set value (val) {
    this.$value = val;
    messenger.addToQueue(Commands.setValue, this.$host, [this.$id, val]);
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
    messenger.addToQueue(Commands.textContent, this.$host, [this.$id, val, this.childNodes[0].$id]);
  }

  invokeNative (name, args) {
    messenger.addToQueue(Commands.invokeNative, this.$host, [this.$id, name, args]);
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
      setEventListener(this.$id, this.$host, evtType.slice(2), evtHandler);
    }
  });
});

class RemoteTextualNode extends RemoteNode {
  constructor (nodeType, text, id) {
    super(nodeType, text, id);
    this.$value = text;
  }

  set nodeValue (val) {
    this.$value = val;
    messenger.addToQueue(Commands.textContent, this.$host, [this.$id, val]);
  }

  get nodeValue() {
    return this.$value;
  }
}

class RemoteComment extends RemoteTextualNode {
  constructor (text, id) {
    super(Node.COMMENT_NODE, text, id);
  }
}

class RemoteText extends RemoteTextualNode {
  constructor (text, id) {
    super(Node.TEXT_NODE, text, id);
  }
}

class RemoteElement extends RemoteNode {
  constructor (tagName, customId) {
    super(Node.ELEMENT_NODE, undefined, customId);
    this.tagName = tagName.toUpperCase();
    this.$style = new RemoteStyle(this.$id);
    this.$attr = {};
  }

  get nodeName () {
    return this.tagName;
  }

  setAttribute (k, v) {
    messenger.addToQueue(Commands.setAttribute, this.$host, [this.$id, k, v]);
    this.$attr[k] = {name: k, value: v};
    this[k] = v;
  }

  getAttribute (k) {
    return this.$attr[k] && this.$attr[k].value;
  }

  removeAttribute (k) {
    messenger.addToQueue(Commands.removeAttribute, this.$host, [this.$id, k]);
    delete this.$attr[k];
  }

  hasAttribute (k) {
    return this.$attr.hasOwnProperty(k);
  }

  focus () {
    messenger.addToQueue(Commands.focus, this.$host, [this.$id]);
  }

  setSelectionRange (selectionStart, selectionEnd, selectionDirection) {
    messenger.addToQueue(Commands.setSelectionRange, this.$host, [this.$id, selectionStart, selectionEnd, selectionDirection]);
  }

  get attributes () {
    return Object.keys(this.$attr).map(name => {
      return {
        name,
        value: this[this.$attr[name]]
      };
    });
    // const result = {...this.$attr};
    // result.length = Object.keys(result).length;
    // return result;
  }

  get style () {
    return this.$style;
  }

  set style (val) {
    messenger.addToQueue(Commands.setStyle, this.$host, [this.$id, val]);
  }

  set innerHTML (val) {
    messenger.addToQueue(Commands.innerHTML, this.$host, [this.$id, val]);
    this.$innerHTML = val;
  }

  get innerHTML () {
    return this.$innerHTML;
  }

  set innerText (val) {
    messenger.addToQueue(Commands.innerText, this.$host, [this.$id, val]);
  }
}

class RemoteContainer extends RemoteElement {
  constructor () {
    super('div');
    this.$host = this.$id;
  }
}

class RemoteFragment extends RemoteNode {
  constructor () {
    super(Node.DOCUMENT_FRAGMENT_NODE);
  }
}

class RemoteVideo extends RemoteElement {
  constructor (customId) {
    super('video', customId);
  }

  pause () {
    messenger.addToQueue(Commands.pause, this.$host, [this.$id]);
  }

  play () {
    messenger.addToQueue(Commands.play, this.$host, [this.$id]);
  }

  get src () {
    return this.$src;
  }

  set src (value) {
    this.$src = value;
    messenger.addToQueue(Commands.src, this.$host, [this.$id, value]);
  }
}

class RemoteImage extends  RemoteElement {
  constructor (customId) {
    super('img', customId);
  }

  get src () {
    return this.$src;
  }

  set src (value) {
    this.$src = value;
    messenger.addToQueue(Commands.src, this.$host, [this.$id, value]);
  }
}

class RemoteInput extends RemoteElement {
  constructor (customId) {
    super('input', customId);
  }

  set value (val) {
    this.$value = val;
    messenger.addToQueue(Commands.setValue, this.$host, [this.$id, val]);
  }

  get value () {
    return this.$value;
  }
}

class RemoteSelect extends RemoteElement {
  constructor (customId) {
    super('select', customId);
  }

  get options () {
    return Array.from(this.children).filter(child => child.tagName.toLowerCase() === 'option');
  }
}

function createElementByType(serializedNode, id) {
  switch (serializedNode.nodeType) {
    case Node.TEXT_NODE:
      return createTextNode(serializedNode.textContent, id);
    case Node.ELEMENT_NODE:
      return createElement(serializedNode.nodeName, id);
    case Node.COMMENT_NODE:
      return createComment(serializedNode.nodeName, id);
    default:
      return createElement(serializedNode.nodeName, id);
  }
}

function createElement (nodeName, customId) {
  let res;
  switch(nodeName) {
    case 'video':
      res = new RemoteVideo(customId);
      break;
    case 'img':
      res = new RemoteImage(customId);
      break;
    case 'input':
      res = new RemoteInput(customId);
      break;
    case 'select':
      res = new RemoteSelect(customId);
      break;
    default:
      res = new RemoteElement(nodeName, customId);
  }
  messenger.addToQueue(Commands.createElement, res.$host, [res.$id, res.tagName]);
  return res;
}

function createTextNode (text, id) {
  const res = new RemoteText(text, id);
  messenger.addToQueue(Commands.createTextNode, res.$host, [res.$id, text]);
  return res;
}

function createComment (text, id) {
  const res = new RemoteComment(text, id);
  messenger.addToQueue(Commands.createComment, res.$host, [res.$id, text]);
  return res;
}

function createDocumentFragment () {
  const res = new RemoteFragment();
  messenger.addToQueue(Commands.createDocumentFragment, res.$host, [res.$id]);
  return res;
}

function createContainer (name) {
  name = name || Constants.DEFAULT_NAME;
  const res = new RemoteContainer();
  connectedElementsById[res.$id] = res;
  messenger.addToQueue(Commands.createContainer, res.$host, [res.$id, name]);
  return new Promise(resolve => {
    createContainerResolversByName[name] = serializedTree => {
      if (serializedTree) {
        messenger.disable();
        deserializeDomTree(serializedTree, null, res);
        messenger.enable();
      }
      resolve(res);
    };
  });
}

function addEventListener (target, host, evtName, callback, capture) {
  eventListenersIndex++;
  eventsByTypeAndTarget[evtName] = eventsByTypeAndTarget[evtName] || {};
  eventsByTypeAndTarget[evtName][target] = eventsByTypeAndTarget[evtName][target] || {};
  eventsByTypeAndTarget[evtName][target][eventListenersIndex] = callback;
  messenger.addToQueue(Commands.addEventListener, host, [target, evtName, eventListenersIndex, capture]);
}

function removeEventListener (target, host, evtName, callback) {
  eventsByTypeAndTarget[evtName] = eventsByTypeAndTarget[evtName] || {};
  eventsByTypeAndTarget[evtName][target] = eventsByTypeAndTarget[evtName][target] || {};
  const evts = eventsByTypeAndTarget[evtName][target];
  const idx = Object.keys(evts).find((evtIndex) => {
    return evts[evtIndex] === callback;
  });
  delete evts[idx];
  messenger.addToQueue(Commands.removeEventListener, host, [target, evtName, eventListenersIndex]);
}

function setEventListener(target, host, evtName, evtHandler) {
  eventsByTypeAndTarget[evtName] = eventsByTypeAndTarget[evtName] || {};
  eventsByTypeAndTarget[evtName][target] = eventsByTypeAndTarget[evtName][target] || {};
  if (evtHandler && !eventsByTypeAndTarget[evtName][target][INLINE_EVENT]) {
    messenger.addToQueue(Commands.addEventListener, host, [target, evtName, INLINE_EVENT, false]);
  } else if (!evtHandler && eventsByTypeAndTarget[evtName][target][INLINE_EVENT]) {
    messenger.addToQueue(Commands.removeEventListener, host, [target, evtName, INLINE_EVENT]);
  }
  if (typeof evtHandler === 'string') {
    evtHandler = Function('event', evtHandler);
  }
  eventsByTypeAndTarget[evtName][target][INLINE_EVENT] = evtHandler;
}

function dispatchEvent (target, host, event) {
  messenger.addToQueue(Commands.dispatchEvent, host, [target, event._type, event._eventInit, event._isCustom || false]);
}

function updateConnectedElement(id, eventData) {
  if (connectedElementsById[id] && eventData[id]) {
    Object.assign(connectedElementsById[id], eventData[id]);
  }
}

function handleMessagesFromPipe(messages) {
  messages.forEach(msg => {
    const evtIntent = msg[0];
    switch (evtIntent) {
      case Constants.INIT: {
        initMsgPromiseResolver && initMsgPromiseResolver();
        const eventData = msg[1];
        Object.keys(eventData).forEach((id) => {
          updateConnectedElement(id, eventData);
        });
        break;
      }
      case Commands.createContainerAck: {
        const name = msg[1];
        const serializedTree = msg[2];
        createContainerResolversByName[name](serializedTree);
        break;
      }
      default: {
        const evtTarget = msg[1];
        const evtName = msg[2];
        const evtJSON = msg[3];
        Object.keys(evtJSON.extraData).forEach((id) => {
          updateConnectedElement(id, evtJSON.extraData);
        });
        EventDOMNodeAttributes.forEach((field) => {
          evtJSON[field] = (evtJSON[field] instanceof Array) ? evtJSON[field].map(val => connectedElementsById[val]) : connectedElementsById[evtJSON[field]];
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
  const initMsgPromise = new Promise(resolve => {initMsgPromiseResolver = resolve;});

  queue.setPipe(channel, handleMessagesFromPipe, timerFunction);
  queue.push([Commands.initiated]);

  return initMsgPromise;
}

function Image(width, height) {
  const imgNode = document.createElement('img');
  imgNode.setAttribute('width', width);
  imgNode.setAttribute('height', height);
  return imgNode;
}

function populateGlobalScope(scope) {
  scope.window = window;
  scope.document = document;
  scope.requestAnimationFrame = window.requestAnimationFrame;
  scope.Image = Image;
}

const document = {
  createElement,
  createTextNode,
  createComment,
  createDocumentFragment,
  addEventListener: addEventListener.bind(null, Constants.DOCUMENT, null),
  removeEventListener: removeEventListener.bind(null, Constants.DOCUMENT, null),
  documentElement: new RemoteElement('html'),
  dispatchEvent: dispatchEvent.bind(null, Constants.DOCUMENT, null)
};

SupportedEvents.forEach((e) => {
  document[e] = addEventListener.bind(null, Constants.DOCUMENT, null, e.substr(2));
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
  dispatchEvent: dispatchEvent.bind(null, Constants.WINDOW, null),
  addEventListener: addEventListener.bind(null, Constants.WINDOW, null),
  removeEventListener: removeEventListener.bind(null, Constants.WINDOW, null),
  document: document,
  location: {href: 'https://localhost', protocol: 'https:'},
  navigator: {
    userAgent: 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_12_1) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/54.0.2840.98 Safari/537.36'
  },
  history: {},
  requestAnimationFrame: setTimeout,
  cancelAnimationFrame: clearTimeout,
  Image: Image
};
window.top = window;

connectedElementsById[Constants.WINDOW] = window;
connectedElementsById[Constants.DOCUMENT] = document;

export {
  window,
  document,
  populateGlobalScope,
  createContainer,
  setChannel
};
