(function webpackUniversalModuleDefinition(root, factory) {
	if(typeof exports === 'object' && typeof module === 'object')
		module.exports = factory();
	else if(typeof define === 'function' && define.amd)
		define([], factory);
	else {
		var a = factory();
		for(var i in a) (typeof exports === 'object' ? exports : root)[i] = a[i];
	}
})(this, function() {
return /******/ (function(modules) { // webpackBootstrap
/******/ 	// The module cache
/******/ 	var installedModules = {};

/******/ 	// The require function
/******/ 	function __webpack_require__(moduleId) {

/******/ 		// Check if module is in cache
/******/ 		if(installedModules[moduleId])
/******/ 			return installedModules[moduleId].exports;

/******/ 		// Create a new module (and put it into the cache)
/******/ 		var module = installedModules[moduleId] = {
/******/ 			exports: {},
/******/ 			id: moduleId,
/******/ 			loaded: false
/******/ 		};

/******/ 		// Execute the module function
/******/ 		modules[moduleId].call(module.exports, module, module.exports, __webpack_require__);

/******/ 		// Flag the module as loaded
/******/ 		module.loaded = true;

/******/ 		// Return the exports of the module
/******/ 		return module.exports;
/******/ 	}


/******/ 	// expose the modules object (__webpack_modules__)
/******/ 	__webpack_require__.m = modules;

/******/ 	// expose the module cache
/******/ 	__webpack_require__.c = installedModules;

/******/ 	// __webpack_public_path__
/******/ 	__webpack_require__.p = "";

/******/ 	// Load entry module and return exports
/******/ 	return __webpack_require__(0);
/******/ })
/************************************************************************/
/******/ ([
/* 0 */
/***/ function(module, exports, __webpack_require__) {

	'use strict';

	function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

	var _require = __webpack_require__(1),
	    Node = _require.Node,
	    Commands = _require.Commands,
	    Constants = _require.Constants,
	    MessagesQueue = _require.MessagesQueue,
	    EventAttributes = _require.EventAttributes,
	    EventDOMNodeAttributes = _require.EventDOMNodeAttributes,
	    Pipe = _require.Pipe;
	// import {Node, Commands, Constants, MessagesQueue, EventAttributes, Pipe}  from './common'


	var LocalContainer = function LocalContainer(queueIndex, domElement, name) {
	  _classCallCheck(this, LocalContainer);

	  this.domElement = domElement;
	  this.name = name;
	  this.queueIndex = queueIndex;
	  this.index = null;
	};

	var containersByQueueAndName = {};
	var queuesByIndex = {};
	var elementsByQueue = {};
	var eventsByQueueAndName = {};
	var nativeInvocationsByQueue = {};
	var win = null;
	var doc = null;

	function setWindow(windowObj) {
	  win = windowObj;
	  doc = windowObj.document;
	}

	if (typeof window !== 'undefined') {
	  setWindow(window);
	}

	function createContainer(queueIndex, domElement, name) {
	  name = name || Constants.DEFAULT_NAME;
	  var res = new LocalContainer(queueIndex, domElement, name);
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
	    return val.map(function (v) {
	      return serializeEventVal(queueIndex, v);
	    });
	  } else if (typeof val === 'number' || typeof val === 'string' || typeof val === 'boolean') {
	    return val;
	  } else if (typeof val === 'function') {
	    return null;
	  }
	  return;
	}

	function generalEventHandler(queueIndex, evtTarget, evtName, ev) {
	  // console.log('generalEventHandler', arguments)
	  var queue = queuesByIndex[queueIndex];
	  var evtJSON = { extraData: {} };
	  var path = ev.path || EventDOMNodeAttributes.map(function (field) {
	    return ev[field];
	  }).filter(function (x) {
	    return x;
	  });
	  path.forEach(function (node) {
	    evtJSON.extraData[serializeEventVal(queueIndex, node)] = {
	      $value: node.value,
	      type: node.type,
	      checked: node.checked
	    };
	  });

	  for (var field in ev) {
	    evtJSON[field] = serializeEventVal(queueIndex, ev[field]);
	  }

	  queuesByIndex[queueIndex].push([evtTarget, evtName, evtJSON]);
	  // console.log('evtJSON',evtJSON.type, evtJSON);
	  if (evtName === 'submit') {
	    ev.preventDefault();
	  }
	}

	function applyMessages(queueIndex, messages) {
	  var elements = elementsByQueue[queueIndex];
	  var containers = containersByQueueAndName[queueIndex];
	  var events = eventsByQueueAndName[queueIndex];
	  var nativeInvocations = nativeInvocationsByQueue[queueIndex];
	  // console.log('applyMessages', queueIndex, messages);
	  messages.forEach(function (msg) {
	    var msgType = msg[0];
	    // console.log('applyMessage:', msg);
	    switch (msgType) {
	      case Commands.createContainer:
	        elements[msg[1]] = containers[msg[2]].domElement;
	        break;
	      case Commands.createElement:
	        elements[msg[1]] = doc.createElement(msg[2].toLowerCase());
	        elements[msg[1]][Constants.QUEUE_INDEX] = queueIndex;
	        elements[msg[1]][Constants.NODE_INDEX] = msg[1];
	        break;
	      case Commands.createTextNode:
	        elements[msg[1]] = doc.createTextNode(msg[2]);
	        elements[msg[1]][Constants.QUEUE_INDEX] = queueIndex;
	        elements[msg[1]][Constants.NODE_INDEX] = msg[1];
	        break;
	      case Commands.createComment:
	        elements[msg[1]] = doc.createComment(msg[2]);
	        elements[msg[1]][Constants.QUEUE_INDEX] = queueIndex;
	        elements[msg[1]][Constants.NODE_INDEX] = msg[1];
	        break;
	      case Commands.createDocumentFragment:
	        elements[msg[1]] = doc.createDocumentFragment(msg[2]);
	        break;
	      case Commands.appendChild:
	        elements[msg[1]].appendChild(elements[msg[2]]);
	        break;
	      case Commands.insertBefore:
	        elements[msg[1]].insertBefore(elements[msg[2]], msg[3] ? elements[msg[3]] : null);
	        break;
	      case Commands.removeChild:
	        elements[msg[1]].removeChild(elements[msg[2]]);
	        break;
	      case Commands.setAttribute:
	        elements[msg[1]].setAttribute(msg[2], msg[3]);
	        break;
	      case Commands.setStyles:
	        elements[msg[1]].style = msg[2];
	        break;
	      case Commands.setStyle:
	        elements[msg[1]].style[msg[2]] = msg[3];
	        break;
	      case Commands.innerHTML:
	        elements[msg[1]].innerHTML = msg[2];
	        break;
	      case Commands.innerText:
	        elements[msg[1]].innerText = msg[2];
	        break;
	      case Commands.textContent:
	        elements[msg[1]].textContent = msg[2];
	        break;
	      case Commands.setValue:
	        elements[msg[1]].value = msg[2];
	        break;
	      case Commands.addEventListener:
	        var func = generalEventHandler.bind(null, queueIndex, msg[1], msg[2]);
	        events[msg[2]] = events[msg[2]] || {};
	        events[msg[2]][msg[3]] = func;
	        elements[msg[1]].addEventListener(msg[2], func, msg[4]);
	        break;
	      case Commands.removeEventListener:
	        events[msg[2]] = events[msg[2]] || {};
	        var origFunc = events[msg[2]][msg[3]];
	        elements[msg[1]].removeEventListener(msg[2], origFunc);
	        break;
	      case Commands.invokeNative:
	        if (nativeInvocations[msg[2]]) {
	          nativeInvocations[msg[2]](elements[msg[1]], msg[3]);
	        }
	        break;
	    }
	  });
	}

	function createMessageQueue(channel, timerFunction, nativeInvocations) {
	  if (!win) {
	    throw 'Please setWindow before create message queues';
	  }
	  var queue = new MessagesQueue();
	  var queueIndex = queue.index;
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
	  createContainer: createContainer,
	  createMessageQueue: createMessageQueue,
	  setWindow: setWindow
	};

/***/ },
/* 1 */
/***/ function(module, exports) {

	"use strict";

	var _createClass = function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; }();

	function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

	var Node = {
	  "ELEMENT_NODE": 1,
	  "ATTRIBUTE_NODE": 2,
	  "TEXT_NODE": 3,
	  "CDATA_SECTION_NODE": 4,
	  "ENTITY_REFERENCE_NODE": 5,
	  "ENTITY_NODE": 6,
	  "PROCESSING_INSTRUCTION_NODE": 7,
	  "COMMENT_NODE": 8,
	  "DOCUMENT_NODE": 9,
	  "DOCUMENT_TYPE_NODE": 10,
	  "DOCUMENT_FRAGMENT_NODE": 11,
	  "NOTATION_NODE": 12,
	  "DOCUMENT_POSITION_DISCONNECTED": 1,
	  "DOCUMENT_POSITION_PRECEDING": 2,
	  "DOCUMENT_POSITION_FOLLOWING": 4,
	  "DOCUMENT_POSITION_CONTAINS": 8,
	  "DOCUMENT_POSITION_CONTAINED_BY": 16,
	  "DOCUMENT_POSITION_IMPLEMENTATION_SPECIFIC": 32
	};

	var Commands = {
	  createContainer: 'createContainer',
	  createElement: 'createElement',
	  createTextNode: 'createTextNode',
	  createComment: 'createComment',
	  createDocumentFragment: 'createDocumentFragment',
	  appendChild: 'appendChild',
	  insertBefore: 'insertBefore',
	  removeChild: 'removeChild',
	  setAttribute: 'setAttribute',
	  setStyles: 'setStyles',
	  setStyle: 'setStyle',
	  innerHTML: 'innerHTML',
	  innerText: 'innerText',
	  textContent: 'textContent',
	  setValue: 'setValue',
	  addEventListener: 'addEventListener',
	  removeEventListener: 'removeEventListener',
	  invokeNative: 'invokeNative'
	};

	var Constants = {
	  REMOTE_DOM: 'REMOTE_DOM',
	  DOCUMENT: 'DOCUMENT',
	  WINDOW: 'WINDOW',
	  DEFAULT_NAME: 'DEFAULT_NAME',
	  QUEUE_INDEX: 'QUEUE_INDEX',
	  NODE_INDEX: 'NODE_INDEX'
	};

	var index = 0;

	var Pipe = function () {
	  function Pipe(channel, handler) {
	    _classCallCheck(this, Pipe);

	    this.channel = channel;
	    this.channel.addEventListener('message', function (ev) {
	      var message = null;
	      // console.log("in Event Listener", ev)
	      try {
	        message = JSON.parse(ev.data);
	      } catch (e) {
	        return;
	      }
	      if (message[Constants.REMOTE_DOM]) {
	        handler(message[Constants.REMOTE_DOM]);
	      }
	    });
	  }

	  _createClass(Pipe, [{
	    key: "postMessage",
	    value: function postMessage(messages) {
	      this.channel.postMessage(JSON.stringify({ REMOTE_DOM: messages }));
	    }
	  }]);

	  return Pipe;
	}();

	var MessagesQueue = function () {
	  function MessagesQueue() {
	    _classCallCheck(this, MessagesQueue);

	    this.queue = [];
	    index--;
	    this.index = index;
	    this.pipe = null;
	    this.timer = null;
	  }

	  _createClass(MessagesQueue, [{
	    key: "push",
	    value: function push(message) {
	      // console.log(message);
	      this.queue.push(message);
	      this.schedule();
	    }
	  }, {
	    key: "setPipe",
	    value: function setPipe(channel, handler, timerFunction) {
	      this.pipe = new Pipe(channel, handler);
	      this.timerFunction = timerFunction || function (cb) {
	        setTimeout(cb, 0);
	      };
	      this.schedule();
	    }
	  }, {
	    key: "schedule",
	    value: function schedule() {
	      if (this.timer || !this.pipe) {
	        return;
	      }
	      this.timer = this.timerFunction(this.flushQueue.bind(this));
	    }
	  }, {
	    key: "flushQueue",
	    value: function flushQueue() {
	      this.timer = null;
	      if (!this.pipe) {
	        return;
	      }
	      this.pipe.postMessage(this.queue);
	      this.queue.length = 0;
	    }
	  }]);

	  return MessagesQueue;
	}();

	var EventDOMNodeAttributes = ['currentTarget', 'originalTarget', 'srcElement', 'target', 'toElement', 'path', 'view'];

	var StyleAttributes = ["alignContent", "alignItems", "alignSelf", "alignmentBaseline", "all", "animation", "animationDelay", "animationDirection", "animationDuration", "animationFillMode", "animationIterationCount", "animationName", "animationPlayState", "animationTimingFunction", "backfaceVisibility", "background", "backgroundAttachment", "backgroundBlendMode", "backgroundClip", "backgroundColor", "backgroundImage", "backgroundOrigin", "backgroundPosition", "backgroundPositionX", "backgroundPositionY", "backgroundRepeat", "backgroundRepeatX", "backgroundRepeatY", "backgroundSize", "baselineShift", "border", "borderBottom", "borderBottomColor", "borderBottomLeftRadius", "borderBottomRightRadius", "borderBottomStyle", "borderBottomWidth", "borderCollapse", "borderColor", "borderImage", "borderImageOutset", "borderImageRepeat", "borderImageSlice", "borderImageSource", "borderImageWidth", "borderLeft", "borderLeftColor", "borderLeftStyle", "borderLeftWidth", "borderRadius", "borderRight", "borderRightColor", "borderRightStyle", "borderRightWidth", "borderSpacing", "borderStyle", "borderTop", "borderTopColor", "borderTopLeftRadius", "borderTopRightRadius", "borderTopStyle", "borderTopWidth", "borderWidth", "bottom", "boxShadow", "boxSizing", "breakAfter", "breakBefore", "breakInside", "bufferedRendering", "captionSide", "clear", "clip", "clipPath", "clipRule", "color", "colorInterpolation", "colorInterpolationFilters", "colorRendering", "columnCount", "columnFill", "columnGap", "columnRule", "columnRuleColor", "columnRuleStyle", "columnRuleWidth", "columnSpan", "columnWidth", "columns", "contain", "content", "counterIncrement", "counterReset", "cursor", "cx", "cy", "d", "direction", "display", "dominantBaseline", "emptyCells", "fill", "fillOpacity", "fillRule", "filter", "flex", "flexBasis", "flexDirection", "flexFlow", "flexGrow", "flexShrink", "flexWrap", "float", "floodColor", "floodOpacity", "font", "fontFamily", "fontFeatureSettings", "fontKerning", "fontSize", "fontStretch", "fontStyle", "fontVariant", "fontVariantCaps", "fontVariantLigatures", "fontVariantNumeric", "fontWeight", "height", "imageRendering", "isolation", "justifyContent", "left", "letterSpacing", "lightingColor", "lineHeight", "listStyle", "listStyleImage", "listStylePosition", "listStyleType", "margin", "marginBottom", "marginLeft", "marginRight", "marginTop", "marker", "markerEnd", "markerMid", "markerStart", "mask", "maskType", "maxHeight", "maxWidth", "maxZoom", "minHeight", "minWidth", "minZoom", "mixBlendMode", "motion", "motionOffset", "motionPath", "motionRotation", "objectFit", "objectPosition", "opacity", "order", "orientation", "orphans", "outline", "outlineColor", "outlineOffset", "outlineStyle", "outlineWidth", "overflow", "overflowWrap", "overflowX", "overflowY", "padding", "paddingBottom", "paddingLeft", "paddingRight", "paddingTop", "page", "pageBreakAfter", "pageBreakBefore", "pageBreakInside", "paintOrder", "perspective", "perspectiveOrigin", "pointerEvents", "position", "quotes", "r", "resize", "right", "rx", "ry", "shapeImageThreshold", "shapeMargin", "shapeOutside", "shapeRendering", "size", "speak", "src", "stopColor", "stopOpacity", "stroke", "strokeDasharray", "strokeDashoffset", "strokeLinecap", "strokeLinejoin", "strokeMiterlimit", "strokeOpacity", "strokeWidth", "tabSize", "tableLayout", "textAlign", "textAlignLast", "textAnchor", "textCombineUpright", "textDecoration", "textIndent", "textOrientation", "textOverflow", "textRendering", "textShadow", "textSizeAdjust", "textTransform", "top", "touchAction", "transform", "transformOrigin", "transformStyle", "transition", "transitionDelay", "transitionDuration", "transitionProperty", "transitionTimingFunction", "unicodeBidi", "unicodeRange", "userSelect", "userZoom", "vectorEffect", "verticalAlign", "visibility", "webkitAppRegion", "webkitAppearance", "webkitBackgroundClip", "webkitBackgroundOrigin", "webkitBorderAfter", "webkitBorderAfterColor", "webkitBorderAfterStyle", "webkitBorderAfterWidth", "webkitBorderBefore", "webkitBorderBeforeColor", "webkitBorderBeforeStyle", "webkitBorderBeforeWidth", "webkitBorderEnd", "webkitBorderEndColor", "webkitBorderEndStyle", "webkitBorderEndWidth", "webkitBorderHorizontalSpacing", "webkitBorderImage", "webkitBorderStart", "webkitBorderStartColor", "webkitBorderStartStyle", "webkitBorderStartWidth", "webkitBorderVerticalSpacing", "webkitBoxAlign", "webkitBoxDecorationBreak", "webkitBoxDirection", "webkitBoxFlex", "webkitBoxFlexGroup", "webkitBoxLines", "webkitBoxOrdinalGroup", "webkitBoxOrient", "webkitBoxPack", "webkitBoxReflect", "webkitClipPath", "webkitColumnBreakAfter", "webkitColumnBreakBefore", "webkitColumnBreakInside", "webkitFontSizeDelta", "webkitFontSmoothing", "webkitHighlight", "webkitHyphenateCharacter", "webkitLineBreak", "webkitLineClamp", "webkitLocale", "webkitLogicalHeight", "webkitLogicalWidth", "webkitMarginAfter", "webkitMarginAfterCollapse", "webkitMarginBefore", "webkitMarginBeforeCollapse", "webkitMarginBottomCollapse", "webkitMarginCollapse", "webkitMarginEnd", "webkitMarginStart", "webkitMarginTopCollapse", "webkitMask", "webkitMaskBoxImage", "webkitMaskBoxImageOutset", "webkitMaskBoxImageRepeat", "webkitMaskBoxImageSlice", "webkitMaskBoxImageSource", "webkitMaskBoxImageWidth", "webkitMaskClip", "webkitMaskComposite", "webkitMaskImage", "webkitMaskOrigin", "webkitMaskPosition", "webkitMaskPositionX", "webkitMaskPositionY", "webkitMaskRepeat", "webkitMaskRepeatX", "webkitMaskRepeatY", "webkitMaskSize", "webkitMaxLogicalHeight", "webkitMaxLogicalWidth", "webkitMinLogicalHeight", "webkitMinLogicalWidth", "webkitPaddingAfter", "webkitPaddingBefore", "webkitPaddingEnd", "webkitPaddingStart", "webkitPerspectiveOriginX", "webkitPerspectiveOriginY", "webkitPrintColorAdjust", "webkitRtlOrdering", "webkitRubyPosition", "webkitTapHighlightColor", "webkitTextCombine", "webkitTextDecorationsInEffect", "webkitTextEmphasis", "webkitTextEmphasisColor", "webkitTextEmphasisPosition", "webkitTextEmphasisStyle", "webkitTextFillColor", "webkitTextOrientation", "webkitTextSecurity", "webkitTextStroke", "webkitTextStrokeColor", "webkitTextStrokeWidth", "webkitTransformOriginX", "webkitTransformOriginY", "webkitTransformOriginZ", "webkitUserDrag", "webkitUserModify", "webkitWritingMode", "whiteSpace", "widows", "width", "willChange", "wordBreak", "wordSpacing", "wordWrap", "writingMode", "x", "y", "zIndex", "zoom"];

	var SupportedEvents = ["onreadystatechange", "onpointerlockchange", "onpointerlockerror", "onbeforecopy", "onbeforecut", "onbeforepaste", "oncopy", "oncut", "onpaste", "onsearch", "onselectionchange", "onselectstart", "onwheel", "onwebkitfullscreenchange", "onwebkitfullscreenerror", "onabort", "onblur", "oncancel", "oncanplay", "oncanplaythrough", "onchange", "onclick", "onclose", "oncontextmenu", "oncuechange", "ondblclick", "ondrag", "ondragend", "ondragenter", "ondragleave", "ondragover", "ondragstart", "ondrop", "ondurationchange", "onemptied", "onended", "onerror", "onfocus", "oninput", "oninvalid", "onkeydown", "onkeypress", "onkeyup", "onload", "onloadeddata", "onloadedmetadata", "onloadstart", "onmousedown", "onmouseenter", "onmouseleave", "onmousemove", "onmouseout", "onmouseover", "onmouseup", "onmousewheel", "onpause", "onplay", "onplaying", "onprogress", "onratechange", "onreset", "onresize", "onscroll", "onseeked", "onseeking", "onselect", "onshow", "onstalled", "onsubmit", "onsuspend", "ontimeupdate", "ontoggle", "onvolumechange", "onwaiting"];

	module.exports = {
	  Commands: Commands,
	  Node: Node,
	  MessagesQueue: MessagesQueue,
	  Pipe: Pipe,
	  Constants: Constants,
	  StyleAttributes: StyleAttributes,
	  SupportedEvents: SupportedEvents,
	  EventDOMNodeAttributes: EventDOMNodeAttributes
	};

/***/ }
/******/ ])
});
;