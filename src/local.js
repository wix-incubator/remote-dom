import {Node, Commands, Constants, MessagesQueue, EventAttributes, EventDOMNodeAttributes, Pipe}  from './common'
class LocalContainer {
  constructor(queueIndex, domElement, name) {
    this.domElement = domElement;
    this.name = name;
    this.queueIndex = queueIndex;
    this.index = null;
  }
}

const containersByQueueAndName = {};
const queuesByIndex = {};
const elementsByQueue = {};
const eventsByQueueAndName = {};
const nativeInvocationsByQueue = {};
let win = null;
let doc = null;

function setWindow(windowObj) {
  win = windowObj;
  doc = windowObj.document;
}

if (typeof window !== 'undefined') {
  setWindow(window);
}

function createContainer(queueIndex, domElement, name) {
  name = name || Constants.DEFAULT_NAME;
  const res = new LocalContainer(queueIndex, domElement, name);
  containersByQueueAndName[queueIndex][name] = res;
  return res;
}

function serializeEventVal(queueIndex, val) {
  if (val === win) {
    return Constants.WINDOW;
  } else if (val === doc) {
    return Constants.DOCUMENT;
  } else if (val instanceof win.Node) {
    if (val[Constants.QUEUE_INDEX] === queueIndex) {
      return val[Constants.NODE_INDEX];
    }
    ;
  } else if (val instanceof Array) {
    return val.map((v) => serializeEventVal(queueIndex, v));
  } else if (typeof val === 'number' || typeof val === 'string' || typeof val === 'boolean') {
    return val;
  } else if (typeof val === 'function') {
    return null;
  }
  return;
}

function generalEventHandler(queueIndex, evtTarget, evtName, ev) {
  // console.log('generalEventHandler', arguments)
  const queue = queuesByIndex[queueIndex];
  const evtJSON = {extraData: {}};
  const path = ev.path || EventDOMNodeAttributes.map((field) => ev[field]).filter((x) => x);
  path.forEach(node => {
    evtJSON.extraData[serializeEventVal(queueIndex, node)] = {
      $value: node.value,
      type: node.type,
      checked: node.checked
    };
  });

  for (var field in ev) {
    evtJSON[field] = serializeEventVal(queueIndex, ev[field])
  }


  queuesByIndex[queueIndex].push([evtTarget, evtName, evtJSON]);
  // console.log('evtJSON',evtJSON.type, evtJSON);
  if (evtName === 'submit') {
    ev.preventDefault();
  }
}

function applyMessages(queueIndex, messages) {
  const elements = elementsByQueue[queueIndex];
  const containers = containersByQueueAndName[queueIndex];
  const events = eventsByQueueAndName[queueIndex];
  const nativeInvocations = nativeInvocationsByQueue[queueIndex];
  //console.log('applyMessages', queueIndex, messages);
  messages.forEach(msg => {
    const msgType = msg[0];
    //console.log('applyMessage:', msg);
    switch (msgType) {
      case (Commands.createContainer):
      elements[msg[1]] = containers[msg[2]].domElement;
      break;
      case (Commands.createElement):
        elements[msg[1]] = doc.createElement(msg[2].toLowerCase());
        elements[msg[1]][Constants.QUEUE_INDEX] = queueIndex;
        elements[msg[1]][Constants.NODE_INDEX] = msg[1];
        break;
      case (Commands.createTextNode):
      elements[msg[1]] = doc.createTextNode(msg[2]);
      elements[msg[1]][Constants.QUEUE_INDEX] = queueIndex;
      elements[msg[1]][Constants.NODE_INDEX] = msg[1];
      break;
      case (Commands.createComment):
      elements[msg[1]] = doc.createComment(msg[2]);
      elements[msg[1]][Constants.QUEUE_INDEX] = queueIndex;
      elements[msg[1]][Constants.NODE_INDEX] = msg[1];
      break;
      case (Commands.createDocumentFragment):
      elements[msg[1]] = doc.createDocumentFragment(msg[2]);
      break;
      case (Commands.appendChild):
      elements[msg[1]].appendChild(elements[msg[2]]);
      break;
      case (Commands.insertBefore):
      elements[msg[1]].insertBefore(elements[msg[2]], msg[3] ? elements[msg[3]] : null);
      break;
      case (Commands.removeChild):
      elements[msg[1]].removeChild(elements[msg[2]]);
      break;
        case (Commands.replaceChild):
          elements[msg[1]].replaceChild(elements[msg[2]], elements[msg[3]]);
        break;
      case (Commands.setAttribute):
      elements[msg[1]].setAttribute(msg[2], msg[3]);
      break;
      case (Commands.removeAttribute):
      elements[msg[1]].removeAttribute(msg[2]);
      break;
      case (Commands.setStyles):
      elements[msg[1]].style = msg[2];
      break;
      case (Commands.setStyle):
      elements[msg[1]].style[msg[2]] = msg[3];
      break;
      case (Commands.innerHTML):
      elements[msg[1]].innerHTML = msg[2];
      break;
      case (Commands.innerText):
      elements[msg[1]].innerText = msg[2];
      break;
      case (Commands.textContent):
      elements[msg[1]].textContent = msg[2];
      break;
      case (Commands.setValue):
      elements[msg[1]].value = msg[2];
      break;
      case (Commands.pause):
        elements[msg[1]].pause();
        break;
      case (Commands.play):
        elements[msg[1]].play();
        break;
      case (Commands.src):
        elements[msg[1]].src = msg[2];
      case (Commands.addEventListener):
      const func = generalEventHandler.bind(null, queueIndex, msg[1], msg[2]);
      events[msg[2]] = events[msg[2]] || {};
      events[msg[2]][msg[3]] = func;
      elements[msg[1]].addEventListener(msg[2], func, msg[4]);
      break;
      case (Commands.removeEventListener):
      events[msg[2]] = events[msg[2]] || {};
      const origFunc = events[msg[2]][msg[3]];
      elements[msg[1]].removeEventListener(msg[2], origFunc);
      break;
      case (Commands.initiated):
        handleRemoteInit(queueIndex);
        break;
      case (Commands.invokeNative):
      if (nativeInvocations[msg[2]]) {
        nativeInvocations[msg[2]](elements[msg[1]], msg[3]);
      }
      break;
    }
  });
}

function handleRemoteInit(queueIndex) {
  updateRemoteOnInit(queueIndex);
  registerToWindowChanges(() => updateRemoteOnInit(queueIndex));
}

function updateRemoteOnInit(queueIndex) {
  queuesByIndex[queueIndex].push([Constants.WINDOW, 'updateProperties', {
    extraData: {
      WINDOW: {
        screen: {
          width: win.screen.width,
          height: win.screen.height,
          deviceXDPI: win.screen.deviceXDPI,
          logicalXDPI: win.screen.logicalXDPI,
          orientation: {
            angle: win.screen.orientation && win.screen.orientation.angle,
            type: win.screen.orientation && win.screen.orientation.type
          }
        },
        devicePixelRatio: win.devicePixelRatio,
        innerWidth: win.innerWidth,
        innerHeight: win.innerHeight
      }
    }
  }]);
}

function registerToWindowChanges(callback) {
  win.addEventListener('orientationchange', callback);
  win.addEventListener('resize', callback);
}

function createMessageQueue(channel, timerFunction, nativeInvocations) {
  if (!win) {
    throw 'Please setWindow before create message queues';
  }
  const queue = new MessagesQueue();
  const queueIndex = queue.index;
  queuesByIndex[queueIndex] = queue;
  containersByQueueAndName[queueIndex] = {};
  elementsByQueue[queueIndex] = {};
  nativeInvocationsByQueue[queueIndex] = nativeInvocations || {};
  elementsByQueue[queueIndex][Constants.DOCUMENT] = doc;
  elementsByQueue[queueIndex][Constants.WINDOW] = win;
  eventsByQueueAndName[queueIndex] = {};
  queue.setPipe(channel, applyMessages.bind(null, queueIndex), timerFunction);
  return queueIndex;
}

module.exports = {
  createContainer,
  createMessageQueue,
  setWindow
}