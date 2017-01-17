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

	var _createClass = function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; }();

	function _possibleConstructorReturn(self, call) { if (!self) { throw new ReferenceError("this hasn't been initialised - super() hasn't been called"); } return call && (typeof call === "object" || typeof call === "function") ? call : self; }

	function _inherits(subClass, superClass) { if (typeof superClass !== "function" && superClass !== null) { throw new TypeError("Super expression must either be null or a function, not " + typeof superClass); } subClass.prototype = Object.create(superClass && superClass.prototype, { constructor: { value: subClass, enumerable: false, writable: true, configurable: true } }); if (superClass) Object.setPrototypeOf ? Object.setPrototypeOf(subClass, superClass) : subClass.__proto__ = superClass; }

	function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

	var _require = __webpack_require__(1),
	    Node = _require.Node,
	    Commands = _require.Commands,
	    Constants = _require.Constants,
	    MessagesQueue = _require.MessagesQueue,
	    StyleAttributes = _require.StyleAttributes,
	    EventDOMNodeAttributes = _require.EventDOMNodeAttributes,
	    SupportedEvents = _require.SupportedEvents,
	    Pipe = _require.Pipe;

	var index = 0;

	var queue = new MessagesQueue();
	var eventsByTypeAndTarget = {};
	var connectedElementsByIndex = {};

	var RemoteStyle = function RemoteStyle($index) {
	  _classCallCheck(this, RemoteStyle);

	  this.$index = $index;
	  this.$values = {};
	};

	StyleAttributes.forEach(function (k) {
	  Object.defineProperty(RemoteStyle.prototype, k, {
	    set: function set(val) {
	      queue.push([Commands.setStyle, this.$index, k, val]);
	      this.$values[k] = val;
	    },
	    get: function get() {
	      return this.$values[k];
	    }
	  });
	});

	var RemoteNode = function () {
	  function RemoteNode(nodeType) {
	    _classCallCheck(this, RemoteNode);

	    index++;
	    this.nodeType = nodeType;
	    this.$index = index;
	    this.$host = null;
	    this.parentNode = null;
	    this.childNodes = [];
	  }

	  _createClass(RemoteNode, [{
	    key: 'appendChild',
	    value: function appendChild(child) {
	      queue.push([Commands.appendChild, this.$index, child.$index]);
	      child.parentNode = this;
	      this.childNodes.push(child);
	      child.host = this.$host;
	    }
	  }, {
	    key: 'insertBefore',
	    value: function insertBefore(child, refChild) {
	      queue.push([Commands.insertBefore, this.$index, child.$index, refChild ? refChild.$index : null]);
	      var idx = refChild ? this.childNodes.indexOf(refChild) : this.childNodes.length;
	      child.parentNode = this;
	      this.childNodes.splice(idx, 0, child);
	      child.host = this.$host;
	      return child;
	    }
	  }, {
	    key: 'removeChild',
	    value: function removeChild(child) {
	      queue.push([Commands.removeChild, this.$index, child.$index]);
	      var idx = this.childNodes.indexOf(child);
	      if (idx !== -1) {
	        this.childNodes.splice(idx, 1);
	      }
	      child.host = null;
	    }
	  }, {
	    key: 'addEventListener',
	    value: function addEventListener(evtType, callback, capture) {
	      _addEventListener(this.$index, evtType, callback, capture);
	    }
	  }, {
	    key: 'removeEventListener',
	    value: function removeEventListener(evtType, callback) {
	      _removeEventListener(this.$index, evtType, callback);
	    }
	  }, {
	    key: 'invokeNative',
	    value: function invokeNative(name, args) {
	      queue.push([Commands.invokeNative, this.$index, name, args]);
	    }
	  }, {
	    key: 'children',
	    get: function get() {
	      return this.childNodes;
	    }
	  }, {
	    key: 'firstChild',
	    get: function get() {
	      return this.childNodes[0];
	    }
	  }, {
	    key: 'nextSibling',
	    get: function get() {
	      if (!this.parentNode) {
	        return null;
	      }
	      var idx = this.parentNode.childNodes.indexOf(this);
	      if (idx === -1 || idx === this.parentNode.childNodes.length - 1) {
	        return null;
	      }
	      return this.parentNode.childNodes[idx + 1];
	    }
	  }, {
	    key: 'prevSibling',
	    get: function get() {
	      if (!this.parentNode) {
	        return null;
	      }
	      var idx = this.parentNode.childNodes.indexOf(this);
	      if (idx === -1 || idx === 0) {
	        return null;
	      }
	      return this.parentNode.childNodes[idx - 1];
	    }
	  }, {
	    key: 'ownerDocument',
	    get: function get() {
	      return document;
	    }
	  }, {
	    key: 'innerHTML',
	    set: function set(val) {}
	  }, {
	    key: 'host',
	    set: function set(host) {
	      if (Boolean(host) === Boolean(this.$host)) {
	        return;
	      }
	      this.$host = host;
	      if (host) {
	        connectedElementsByIndex[this.$index] = this;
	      } else {
	        delete connectedElementsByIndex[this.$index];
	      }
	      this.childNodes.forEach(function (child) {
	        child.host = host;
	      });
	    }
	  }, {
	    key: 'value',
	    set: function set(val) {
	      this.$value = val;
	      queue.push([Commands.setValue, this.$index, val]);
	    },
	    get: function get() {
	      return this.$value;
	    }
	  }, {
	    key: 'textContent',
	    get: function get() {
	      return this.$textContent;
	    },
	    set: function set(val) {
	      queue.push([Commands.textContent, this.$index, val]);
	    }
	  }]);

	  return RemoteNode;
	}();

	var RemoteTextualNode = function (_RemoteNode) {
	  _inherits(RemoteTextualNode, _RemoteNode);

	  function RemoteTextualNode(val) {
	    _classCallCheck(this, RemoteTextualNode);

	    return _possibleConstructorReturn(this, (RemoteTextualNode.__proto__ || Object.getPrototypeOf(RemoteTextualNode)).call(this, Node.TEXT_NODE));
	  }

	  _createClass(RemoteTextualNode, [{
	    key: 'nodeValue',
	    set: function set(val) {
	      queue.push([Commands.textContent, this.$index, val]);
	    }
	  }]);

	  return RemoteTextualNode;
	}(RemoteNode);

	var RemoteComment = function (_RemoteTextualNode) {
	  _inherits(RemoteComment, _RemoteTextualNode);

	  function RemoteComment(val) {
	    _classCallCheck(this, RemoteComment);

	    return _possibleConstructorReturn(this, (RemoteComment.__proto__ || Object.getPrototypeOf(RemoteComment)).call(this, Node.COMMENT_NODE, val));
	  }

	  return RemoteComment;
	}(RemoteTextualNode);

	var RemoteText = function (_RemoteTextualNode2) {
	  _inherits(RemoteText, _RemoteTextualNode2);

	  function RemoteText(val) {
	    _classCallCheck(this, RemoteText);

	    return _possibleConstructorReturn(this, (RemoteText.__proto__ || Object.getPrototypeOf(RemoteText)).call(this, Node.TEXT_NODE, val));
	  }

	  return RemoteText;
	}(RemoteTextualNode);

	var RemoteElement = function (_RemoteNode2) {
	  _inherits(RemoteElement, _RemoteNode2);

	  function RemoteElement(tagName) {
	    _classCallCheck(this, RemoteElement);

	    var _this4 = _possibleConstructorReturn(this, (RemoteElement.__proto__ || Object.getPrototypeOf(RemoteElement)).call(this, Node.ELEMENT_NODE));

	    _this4.tagName = tagName.toUpperCase();
	    _this4.$style = new RemoteStyle(_this4.$index);
	    _this4.$attr = {};
	    return _this4;
	  }

	  _createClass(RemoteElement, [{
	    key: 'setAttribute',
	    value: function setAttribute(k, v) {
	      queue.push([Commands.setAttribute, this.$index, k, v]);
	      this.$attr[k] = { name: k, value: v };
	    }
	  }, {
	    key: 'nodeName',
	    get: function get() {
	      return this.tagName;
	    }
	  }, {
	    key: 'style',
	    get: function get() {
	      return this.$style;
	    },
	    set: function set(val) {
	      queue.push([Commands.setStyle, this.$index, val]);
	    }
	  }, {
	    key: 'innerHTML',
	    set: function set(val) {
	      queue.push([Commands.innerHTML, this.$index, val]);
	    }
	  }, {
	    key: 'innerText',
	    set: function set(val) {
	      queue.push([Commands.innerText, this.$index, val]);
	    }
	  }]);

	  return RemoteElement;
	}(RemoteNode);

	var RemoteContainer = function (_RemoteElement) {
	  _inherits(RemoteContainer, _RemoteElement);

	  function RemoteContainer() {
	    _classCallCheck(this, RemoteContainer);

	    var _this5 = _possibleConstructorReturn(this, (RemoteContainer.__proto__ || Object.getPrototypeOf(RemoteContainer)).call(this, 'div'));

	    _this5.$host = _this5.$index;
	    return _this5;
	  }

	  return RemoteContainer;
	}(RemoteElement);

	var RemoteFragment = function (_RemoteNode3) {
	  _inherits(RemoteFragment, _RemoteNode3);

	  function RemoteFragment() {
	    _classCallCheck(this, RemoteFragment);

	    return _possibleConstructorReturn(this, (RemoteFragment.__proto__ || Object.getPrototypeOf(RemoteFragment)).call(this, Node.DOCUMENT_FRAGMENT_NODE));
	  }

	  return RemoteFragment;
	}(RemoteNode);

	function createElement(tagName) {
	  var res = new RemoteElement(tagName);
	  queue.push([Commands.createElement, res.$index, res.tagName]);
	  return res;
	}

	function createTextNode(val) {
	  var res = new RemoteText();
	  queue.push([Commands.createTextNode, res.$index, val]);
	  return res;
	}

	function createComment(val) {
	  var res = new RemoteNode();
	  queue.push([Commands.createComment, res.$index, val]);
	  return res;
	}

	function createDocumentFragment() {
	  var res = new RemoteFragment();
	  queue.push([Commands.createDocumentFragment, res.$index]);
	  return res;
	}

	function createContainer(name) {
	  name = name || Constants.DEFAULT_NAME;
	  var res = new RemoteContainer();
	  connectedElementsByIndex[res.$index] = res;
	  queue.push([Commands.createContainer, res.$index, name]);
	  return res;
	}

	function _addEventListener(target, evtName, callback, capture) {
	  index++;
	  // console.log('addEventListener', target, evtName);
	  eventsByTypeAndTarget[evtName] = eventsByTypeAndTarget[evtName] || {};
	  eventsByTypeAndTarget[evtName][target] = eventsByTypeAndTarget[evtName][target] || {};
	  eventsByTypeAndTarget[evtName][target][index] = callback;
	  queue.push([Commands.addEventListener, target, evtName, index, capture]);
	}

	function _removeEventListener(target, evtName, callback) {
	  // console.log('addEventListener', target, evtName);
	  eventsByTypeAndTarget[evtName] = eventsByTypeAndTarget[evtName] || {};
	  eventsByTypeAndTarget[evtName][target] = eventsByTypeAndTarget[evtName][target] || {};
	  var evts = eventsByTypeAndTarget[evtName][target];
	  var idx = Object.keys(evts).find(function (evtIndex) {
	    evts[evtIndex] === callback;
	  });
	  delete evts[idx];
	  queue.push([Commands.removeEventListener, target, evtName, index]);
	}

	function handleMessagesFromPipe(messages) {
	  messages.forEach(function (msg) {
	    var evtTarget = msg[0];
	    var evtName = msg[1];
	    var evtJSON = msg[2];
	    Object.keys(evtJSON.extraData).forEach(function (index) {
	      if (connectedElementsByIndex[index] && evtJSON.extraData[index]) {
	        Object.assign(connectedElementsByIndex[index], evtJSON.extraData[index]);
	      }
	    });
	    EventDOMNodeAttributes.forEach(function (field) {
	      evtJSON[field] = evtJSON[field] instanceof Array ? evtJSON[field].map(function (val) {
	        return connectedElementsByIndex[val];
	      }) : connectedElementsByIndex[evtJSON[field]];
	    });
	    // console.log(evtJSON);

	    Object.keys(eventsByTypeAndTarget[evtName][evtTarget]).forEach(function (callbackIndex) {
	      eventsByTypeAndTarget[evtName][evtTarget][callbackIndex](evtJSON);
	    });
	  });
	}

	function setChannel(channel, timerFunction) {
	  queue.setPipe(channel, handleMessagesFromPipe, timerFunction);
	}

	var document = {
	  createElement: createElement,
	  createTextNode: createTextNode,
	  createComment: createComment,
	  createDocumentFragment: createDocumentFragment,
	  addEventListener: _addEventListener.bind(null, Constants.DOCUMENT),
	  removeEventListener: _removeEventListener.bind(null, Constants.DOCUMENT),
	  documentElement: new RemoteElement('html')
	};

	SupportedEvents.forEach(function (e) {
	  document[e] = _addEventListener.bind(null, Constants.DOCUMENT, e.substr(2));
	});

	var window = {
	  addEventListener: _addEventListener.bind(null, Constants.WINDOW),
	  removeEventListener: _removeEventListener.bind(null, Constants.WINDOW),
	  document: document,
	  location: { href: 'https://localhost', protocol: 'https:' },
	  navigator: {
	    userAgent: 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_12_1) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/54.0.2840.98 Safari/537.36'
	  },
	  top: window
	};

	connectedElementsByIndex[Constants.WINDOW] = window;
	connectedElementsByIndex[Constants.DOCUMENT] = document;

	module.exports = {
	  document: document,
	  window: window,
	  createContainer: createContainer,
	  setChannel: setChannel
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