const Node = {
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

const Commands = {
  createContainer: 'createContainer',
  createElement: 'createElement',
  createTextNode: 'createTextNode',
  createComment: 'createComment',
  createDocumentFragment: 'createDocumentFragment',
  appendChild: 'appendChild',
  insertBefore: 'insertBefore',
  removeChild: 'removeChild',
  replaceChild: 'replaceChild',
  setAttribute: 'setAttribute',
  removeAttribute: 'removeAttribute',
  setStyles: 'setStyles',
  setStyle: 'setStyle',
  innerHTML: 'innerHTML',
  innerText: 'innerText',
  textContent: 'textContent',
  setValue: 'setValue',
  addEventListener: 'addEventListener',
  removeEventListener: 'removeEventListener',
  invokeNative: 'invokeNative',
  updateProperties: 'updateProperties',
  initiated: 'initiated',
  pause: 'pause',
  play: 'play',
  src: 'src'
};

const Constants = {
  REMOTE_DOM: 'REMOTE_DOM',
  DOCUMENT: 'DOCUMENT',
  WINDOW: 'WINDOW',
  DEFAULT_NAME: 'DEFAULT_NAME',
  QUEUE_INDEX: 'QUEUE_INDEX',
  NODE_INDEX: 'NODE_INDEX'
};

let index = 0;

class Pipe {
  constructor(channel, handler) {
    this.channel = channel;
    this.channel.addEventListener('message', function (ev) {
      let message = null;
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

  postMessage(messages) {
    this.channel.postMessage(JSON.stringify({REMOTE_DOM: messages}));
  }
}


class MessagesQueue {
  constructor() {
    this.queue = [];
    index--;
    this.index = index;
    this.pipe = null;
    this.timer = null;
  }

  push(message) {
    // console.log(message);
    this.queue.push(message);
    this.schedule();
  }

  setPipe(channel, handler, timerFunction) {
    this.pipe = new Pipe(channel, handler);
    this.timerFunction = timerFunction || ((cb) => {
          setTimeout(cb, 0);
      });
    this.schedule();
  }

  schedule() {
    if (this.timer || !this.pipe) {
      return;
    }
    this.timer = this.timerFunction(this.flushQueue.bind(this));
  }

  flushQueue() {
    this.timer = null;
    if (!this.pipe) {
      return;
    }
    this.pipe.postMessage(this.queue);
    this.queue.length = 0;
  }
}

const EventDOMNodeAttributes = [
  'currentTarget',
  'originalTarget',
  'srcElement',
  'target',
  'toElement',
  'path',
  'view'
]

const StyleAttributes = ["alignContent", "alignItems", "alignSelf", "alignmentBaseline", "all", "animation", "animationDelay", "animationDirection", "animationDuration", "animationFillMode", "animationIterationCount", "animationName", "animationPlayState", "animationTimingFunction", "backfaceVisibility", "background", "backgroundAttachment", "backgroundBlendMode", "backgroundClip", "backgroundColor", "backgroundImage", "backgroundOrigin", "backgroundPosition", "backgroundPositionX", "backgroundPositionY", "backgroundRepeat", "backgroundRepeatX", "backgroundRepeatY", "backgroundSize", "baselineShift", "border", "borderBottom", "borderBottomColor", "borderBottomLeftRadius", "borderBottomRightRadius", "borderBottomStyle", "borderBottomWidth", "borderCollapse", "borderColor", "borderImage", "borderImageOutset", "borderImageRepeat", "borderImageSlice", "borderImageSource", "borderImageWidth", "borderLeft", "borderLeftColor", "borderLeftStyle", "borderLeftWidth", "borderRadius", "borderRight", "borderRightColor", "borderRightStyle", "borderRightWidth", "borderSpacing", "borderStyle", "borderTop", "borderTopColor", "borderTopLeftRadius", "borderTopRightRadius", "borderTopStyle", "borderTopWidth", "borderWidth", "bottom", "boxShadow", "boxSizing", "breakAfter", "breakBefore", "breakInside", "bufferedRendering", "captionSide", "clear", "clip", "clipPath", "clipRule", "color", "colorInterpolation", "colorInterpolationFilters", "colorRendering", "columnCount", "columnFill", "columnGap", "columnRule", "columnRuleColor", "columnRuleStyle", "columnRuleWidth", "columnSpan", "columnWidth", "columns", "contain", "content", "counterIncrement", "counterReset", "cursor", "cx", "cy", "d", "direction", "display", "dominantBaseline", "emptyCells", "fill", "fillOpacity", "fillRule", "filter", "flex", "flexBasis", "flexDirection", "flexFlow", "flexGrow", "flexShrink", "flexWrap", "float", "floodColor", "floodOpacity", "font", "fontFamily", "fontFeatureSettings", "fontKerning", "fontSize", "fontStretch", "fontStyle", "fontVariant", "fontVariantCaps", "fontVariantLigatures", "fontVariantNumeric", "fontWeight", "height", "imageRendering", "isolation", "justifyContent", "left", "letterSpacing", "lightingColor", "lineHeight", "listStyle", "listStyleImage", "listStylePosition", "listStyleType", "margin", "marginBottom", "marginLeft", "marginRight", "marginTop", "marker", "markerEnd", "markerMid", "markerStart", "mask", "maskType", "maxHeight", "maxWidth", "maxZoom", "minHeight", "minWidth", "minZoom", "mixBlendMode", "motion", "motionOffset", "motionPath", "motionRotation", "objectFit", "objectPosition", "opacity", "order", "orientation", "orphans", "outline", "outlineColor", "outlineOffset", "outlineStyle", "outlineWidth", "overflow", "overflowWrap", "overflowX", "overflowY", "padding", "paddingBottom", "paddingLeft", "paddingRight", "paddingTop", "page", "pageBreakAfter", "pageBreakBefore", "pageBreakInside", "paintOrder", "perspective", "perspectiveOrigin", "pointerEvents", "position", "quotes", "r", "resize", "right", "rx", "ry", "shapeImageThreshold", "shapeMargin", "shapeOutside", "shapeRendering", "size", "speak", "src", "stopColor", "stopOpacity", "stroke", "strokeDasharray", "strokeDashoffset", "strokeLinecap", "strokeLinejoin", "strokeMiterlimit", "strokeOpacity", "strokeWidth", "tabSize", "tableLayout", "textAlign", "textAlignLast", "textAnchor", "textCombineUpright", "textDecoration", "textIndent", "textOrientation", "textOverflow", "textRendering", "textShadow", "textSizeAdjust", "textTransform", "top", "touchAction", "transform", "transformOrigin", "transformStyle", "transition", "transitionDelay", "transitionDuration", "transitionProperty", "transitionTimingFunction", "unicodeBidi", "unicodeRange", "userSelect", "userZoom", "vectorEffect", "verticalAlign", "visibility", "webkitAppRegion", "webkitAppearance", "webkitBackgroundClip", "webkitBackgroundOrigin", "webkitBorderAfter", "webkitBorderAfterColor", "webkitBorderAfterStyle", "webkitBorderAfterWidth", "webkitBorderBefore", "webkitBorderBeforeColor", "webkitBorderBeforeStyle", "webkitBorderBeforeWidth", "webkitBorderEnd", "webkitBorderEndColor", "webkitBorderEndStyle", "webkitBorderEndWidth", "webkitBorderHorizontalSpacing", "webkitBorderImage", "webkitBorderStart", "webkitBorderStartColor", "webkitBorderStartStyle", "webkitBorderStartWidth", "webkitBorderVerticalSpacing", "webkitBoxAlign", "webkitBoxDecorationBreak", "webkitBoxDirection", "webkitBoxFlex", "webkitBoxFlexGroup", "webkitBoxLines", "webkitBoxOrdinalGroup", "webkitBoxOrient", "webkitBoxPack", "webkitBoxReflect", "webkitClipPath", "webkitColumnBreakAfter", "webkitColumnBreakBefore", "webkitColumnBreakInside", "webkitFontSizeDelta", "webkitFontSmoothing", "webkitHighlight", "webkitHyphenateCharacter", "webkitLineBreak", "webkitLineClamp", "webkitLocale", "webkitLogicalHeight", "webkitLogicalWidth", "webkitMarginAfter", "webkitMarginAfterCollapse", "webkitMarginBefore", "webkitMarginBeforeCollapse", "webkitMarginBottomCollapse", "webkitMarginCollapse", "webkitMarginEnd", "webkitMarginStart", "webkitMarginTopCollapse", "webkitMask", "webkitMaskBoxImage", "webkitMaskBoxImageOutset", "webkitMaskBoxImageRepeat", "webkitMaskBoxImageSlice", "webkitMaskBoxImageSource", "webkitMaskBoxImageWidth", "webkitMaskClip", "webkitMaskComposite", "webkitMaskImage", "webkitMaskOrigin", "webkitMaskPosition", "webkitMaskPositionX", "webkitMaskPositionY", "webkitMaskRepeat", "webkitMaskRepeatX", "webkitMaskRepeatY", "webkitMaskSize", "webkitMaxLogicalHeight", "webkitMaxLogicalWidth", "webkitMinLogicalHeight", "webkitMinLogicalWidth", "webkitPaddingAfter", "webkitPaddingBefore", "webkitPaddingEnd", "webkitPaddingStart", "webkitPerspectiveOriginX", "webkitPerspectiveOriginY", "webkitPrintColorAdjust", "webkitRtlOrdering", "webkitRubyPosition", "webkitTapHighlightColor", "webkitTextCombine", "webkitTextDecorationsInEffect", "webkitTextEmphasis", "webkitTextEmphasisColor", "webkitTextEmphasisPosition", "webkitTextEmphasisStyle", "webkitTextFillColor", "webkitTextOrientation", "webkitTextSecurity", "webkitTextStroke", "webkitTextStrokeColor", "webkitTextStrokeWidth", "webkitTransformOriginX", "webkitTransformOriginY", "webkitTransformOriginZ", "webkitUserDrag", "webkitUserModify", "webkitWritingMode", "whiteSpace", "widows", "width", "willChange", "wordBreak", "wordSpacing", "wordWrap", "writingMode", "x", "y", "zIndex", "zoom"];

const SupportedEvents = ["onreadystatechange", "onpointerlockchange", "onpointerlockerror", "onbeforecopy", "onbeforecut", "onbeforepaste", "oncopy", "oncut", "onpaste", "onsearch", "onselectionchange", "onselectstart", "onwheel", "onwebkitfullscreenchange", "onwebkitfullscreenerror", "onabort", "onblur", "oncancel", "oncanplay", "oncanplaythrough", "onchange", "onclick", "onclose", "oncontextmenu", "oncuechange", "ondblclick", "ondrag", "ondragend", "ondragenter", "ondragleave", "ondragover", "ondragstart", "ondrop", "ondurationchange", "onemptied", "onended", "onerror", "onfocus", "oninput", "oninvalid", "onkeydown", "onkeypress", "onkeyup", "onload", "onloadeddata", "onloadedmetadata", "onloadstart", "onmousedown", "onmouseenter", "onmouseleave", "onmousemove", "onmouseout", "onmouseover", "onmouseup", "onmousewheel", "onpause", "onplay", "onplaying", "onprogress", "onratechange", "onreset", "onresize", "onscroll", "onseeked", "onseeking", "onselect", "onshow", "onstalled", "onsubmit", "onsuspend", "ontimeupdate", "ontoggle", "onvolumechange", "onwaiting"];

export {
  Commands,
  Node,
  MessagesQueue,
  Pipe,
  Constants,
  StyleAttributes,
  SupportedEvents,
  EventDOMNodeAttributes
}
