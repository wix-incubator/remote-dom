/* eslint-env browser */

import {Commands, Constants, MessagesQueue, EventDOMNodeAttributes} from './common';
class LocalContainer {
  constructor (queueIndex, domElement, name) {
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
const pendingMessagesByQueue = {};
let win = null;
let doc = null;

function setWindow (windowObj) {
  win = windowObj;
  doc = windowObj.document;
}

if (typeof window !== 'undefined') {
  setWindow(window);
}

function createContainer (queueIndex, domElement, name) {
  name = name || Constants.DEFAULT_NAME;
  const res = new LocalContainer(queueIndex, domElement, name);
  containersByQueueAndName[queueIndex][name] = res;

  const pendingMessages = pendingMessagesByQueue[queueIndex];
  pendingMessagesByQueue[queueIndex] = [];
  applyMessages(queueIndex, pendingMessages);

  return res;
}

function serializeEventVal (queueIndex, val) {
  if (val === win) {
    return Constants.WINDOW;
  } else if (val === doc) {
    return Constants.DOCUMENT;
  } else if (val instanceof win.Node) {
    return val[Constants.QUEUE_INDEX] === queueIndex ? val[Constants.NODE_INDEX] : null;
  } else if (val instanceof Array) {
    return val.map((v) => serializeEventVal(queueIndex, v));
  } else if (typeof val === 'number' || typeof val === 'string' || typeof val === 'boolean') {
    return val;
  } else if (typeof val === 'function') {
    return null;
  }
  return val;
}

function generalEventHandler (queueIndex, evtTarget, evtName, ev) {
  const evtJSON = {extraData: {}};
  const path = ev.path || EventDOMNodeAttributes.map((field) => ev[field]).filter((x) => x);
  path.forEach(node => {
    evtJSON.extraData[serializeEventVal(queueIndex, node)] = {
      $value: node.value,
      type: node.type,
      checked: node.checked
    };
  });

  for (let field in ev) {
    evtJSON[field] = serializeEventVal(queueIndex, ev[field]);
  }

  queuesByIndex[queueIndex].push([Constants.EVENT, evtTarget, evtName, evtJSON]);
  // console.log('evtJSON',evtJSON.type, evtJSON);
  if (evtName === 'submit') {
    ev.preventDefault();
  }
}

function createHandleMsgOrQueueWrapper (handler) {
  return (queueIndex, msg) => {
    const wasMessageHandled = handler(queueIndex, msg);

    if (!wasMessageHandled) {
      pendingMessagesByQueue[queueIndex].push(msg);
    }
  };
}

function wrapAll (obj, wrapperFn) {
  return Object.keys(obj).reduce((res, fnName) => {
    res[fnName] = wrapperFn(obj[fnName]);
    return res;
  }, {});
}

const messageHandlers = wrapAll({
  [Commands.createContainer]: (queueIndex, msg) => {
    const elements = elementsByQueue[queueIndex];
    const containers = containersByQueueAndName[queueIndex];
    const containerName = msg[2];

    if (containers[containerName]) {
      elements[msg[1]] = containers[containerName].domElement;
      return true;
    }

    return false;
  },
  [Commands.createElement]: (queueIndex, msg) => {
    const elements = elementsByQueue[queueIndex];
    elements[msg[1]] = doc.createElement(msg[2].toLowerCase());
    elements[msg[1]][Constants.QUEUE_INDEX] = queueIndex;
    elements[msg[1]][Constants.NODE_INDEX] = msg[1];
    return true;
  },
  [Commands.createTextNode]: (queueIndex, msg) => {
    const elements = elementsByQueue[queueIndex];
    elements[msg[1]] = doc.createTextNode(msg[2]);
    elements[msg[1]][Constants.QUEUE_INDEX] = queueIndex;
    elements[msg[1]][Constants.NODE_INDEX] = msg[1];
    return true;
  },
  [Commands.createComment]: (queueIndex, msg) => {
    const elements = elementsByQueue[queueIndex];
    elements[msg[1]] = doc.createComment(msg[2]);
    elements[msg[1]][Constants.QUEUE_INDEX] = queueIndex;
    elements[msg[1]][Constants.NODE_INDEX] = msg[1];
    return true;
  },
  [Commands.createDocumentFragment]: (queueIndex, msg) => {
    const elements = elementsByQueue[queueIndex];
    elements[msg[1]] = doc.createDocumentFragment(msg[2]);
    return true;
  },
  [Commands.appendChild]: (queueIndex, msg) => {
    const elements = elementsByQueue[queueIndex];
    const parentId = msg[1];
    const childId = msg[2];

    if (elements[parentId]) {
      elements[parentId].appendChild(elements[childId]);
      return true;
    }

    return false;
  },
  [Commands.insertBefore]: (queueIndex, msg) => {
    const elements = elementsByQueue[queueIndex];
    const parentNodeId = msg[1];
    const newChildNodeId = msg[2];
    const referenceNodeId = msg[3];

    if (elements[parentNodeId]) {
      elements[parentNodeId].insertBefore(elements[newChildNodeId], referenceNodeId ? elements[referenceNodeId] : null);
      return true;
    }

    return false;
  },
  [Commands.removeChild]: (queueIndex, msg) => {
    const elements = elementsByQueue[queueIndex];
    const parentId = msg[1];
    const childId = msg[2];

    if (elements[parentId] && elements[childId]) {
      elements[parentId].removeChild(elements[childId]);
      return true;
    }

    return false;
  },
  [Commands.replaceChild]: (queueIndex, msg) => {
    const elements = elementsByQueue[queueIndex];
    const parentId = msg[1];
    const newChildId = msg[2];
    const oldChildId = msg[3];

    if (elements[parentId] && elements[newChildId] && elements[oldChildId]) {
      elements[parentId].replaceChild(elements[newChildId], elements[oldChildId]);
      return true;
    }

    return false;
  },
  [Commands.setAttribute]: (queueIndex, msg) => {
    const elements = elementsByQueue[queueIndex];

    if (elements[msg[1]]) {
      elements[msg[1]].setAttribute(msg[2], msg[3]);
      return true;
    }

    return false;
  },
  [Commands.removeAttribute]: (queueIndex, msg) => {
    const elements = elementsByQueue[queueIndex];

    if (elements[msg[1]]) {
      elements[msg[1]].removeAttribute(msg[2]);
      return true;
    }

    return false;
  },
  [Commands.setStyles]: (queueIndex, msg) => {
    const elements = elementsByQueue[queueIndex];

    if (elements[msg[1]]) {
      elements[msg[1]].style = msg[2];
      return true;
    }

    return false;
  },
  [Commands.setStyle]: (queueIndex, msg) => {
    const elements = elementsByQueue[queueIndex];

    if (elements[msg[1]]) {
      elements[msg[1]].style[msg[2]] = msg[3];
      return true;
    }

    return false;
  },
  [Commands.innerHTML]: (queueIndex, msg) => {
    const elements = elementsByQueue[queueIndex];

    if (elements[msg[1]]) {
      elements[msg[1]].innerHTML = msg[2];
      return true;
    }

    return false;
  },
  [Commands.innerText]: (queueIndex, msg) => {
    const elements = elementsByQueue[queueIndex];

    if (elements[msg[1]]) {
      elements[msg[1]].innerText = msg[2];
      return true;
    }

    return false;
  },
  [Commands.textContent]: (queueIndex, msg) => {
    const elements = elementsByQueue[queueIndex];

    if (elements[msg[1]]) {
      elements[msg[1]].textContent = msg[2];
      return true;
    }
    return false;
  },
  [Commands.setValue]: (queueIndex, msg) => {
    const elements = elementsByQueue[queueIndex];
    if (elements[msg[1]]) {
    elements[msg[1]].value = msg[2];
      return true;
    }
    return false;
  },
  [Commands.pause]: (queueIndex, msg) => {
    const elements = elementsByQueue[queueIndex];
    if (elements[msg[1]]) {
    elements[msg[1]].pause();
      return true;
    }
    return false;
  },
  [Commands.play]: (queueIndex, msg) => {
    const elements = elementsByQueue[queueIndex];
    if (elements[msg[1]]) {
    elements[msg[1]].play();
      return true;
    }
    return false;
  },
  [Commands.src]: (queueIndex, msg) => {
    const elements = elementsByQueue[queueIndex];
    if (elements[msg[1]]) {
    elements[msg[1]].src = msg[2];
      return true;
    }
    return false;
  },
  [Commands.addEventListener]: (queueIndex, msg) => {
    const elements = elementsByQueue[queueIndex];
    const events = eventsByQueueAndName[queueIndex];

    if (elements[msg[1]]) {
      const func = generalEventHandler.bind(null, queueIndex, msg[1], msg[2]);
      events[msg[2]] = events[msg[2]] || {};
      events[msg[2]][msg[3]] = func;
      elements[msg[1]].addEventListener(msg[2], func, msg[4]);
      return true;
    }

    return false;
  },
  [Commands.removeEventListener]: (queueIndex, msg) => {
    const elements = elementsByQueue[queueIndex];
    const events = eventsByQueueAndName[queueIndex];

    if (elements[msg[1]]) {
      events[msg[2]] = events[msg[2]] || {};
      const origFunc = events[msg[2]][msg[3]];
      elements[msg[1]].removeEventListener(msg[2], origFunc);
      return true;
    }

    return false;
  },
  [Commands.dispatchEvent]: (queueIndex, msg) => {
    const elements = elementsByQueue[queueIndex];

    if (elements[msg[1]]) {
      const evt = msg[4] ? new win.CustomEvent(msg[2], msg[3]) : new win.Event(msg[2], msg[3]);
      elements[msg[1]].dispatchEvent(evt);
      return true;
    }

    return false;
  },
  [Commands.initiated]: (queueIndex) => {
    handleRemoteInit(queueIndex);
  },
  [Commands.invokeNative]: (queueIndex, msg) => {
    const elements = elementsByQueue[queueIndex];
    const nativeInvocations = nativeInvocationsByQueue[queueIndex];

    if (elements[msg[1]]) {
      if (nativeInvocations[msg[2]]) {
        nativeInvocations[msg[2]](elements[msg[1]], msg[3]);
      }
      return true;
    }

    return false;
  }
}, createHandleMsgOrQueueWrapper);

function applyMessages (queueIndex, messages) {
  messages.forEach(msg => {
    const msgType = msg[0];
    messageHandlers[msgType](queueIndex, msg);
  });
}

function handleRemoteInit (queueIndex) {
  updateRemoteOnInit(queueIndex);
  registerToWindowChanges(() => updateRemoteOnInit(queueIndex));
}

function updateRemoteOnInit(queueIndex) {
  queuesByIndex[queueIndex].push([Constants.INIT, {
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
    },
    DOCUMENT: {
      body: {
        clientWidth: doc.body.clientWidth
      }
    }
  }]);
}

function registerToWindowChanges (callback) {
  win.addEventListener('orientationchange', callback);
  win.addEventListener('resize', callback);
}

function createMessageQueue (channel, timerFunction, nativeInvocations) {
  if (!win) {
    throw new Error('Please setWindow before create message queues');
  }
  const queue = new MessagesQueue();
  const queueIndex = queue.index;
  queuesByIndex[queueIndex] = queue;
  containersByQueueAndName[queueIndex] = {};
  elementsByQueue[queueIndex] = {};
  nativeInvocationsByQueue[queueIndex] = nativeInvocations || {};
  pendingMessagesByQueue[queueIndex] = [];
  elementsByQueue[queueIndex][Constants.DOCUMENT] = doc;
  elementsByQueue[queueIndex][Constants.WINDOW] = win;
  eventsByQueueAndName[queueIndex] = {};
  queue.setPipe(channel, applyMessages.bind(null, queueIndex), timerFunction);
  return queueIndex;
}

export {
  createContainer,
  createMessageQueue,
  setWindow
};
