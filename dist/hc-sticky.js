/*!
 * HC-Sticky
 * =========
 * Version: 2.1.4
 * Author: Some Web Media
 * Author URL: http://somewebmedia.com
 * Plugin URL: https://github.com/somewebmedia/hc-sticky
 * Description: Cross-browser plugin that makes any element on your page visible while you scroll
 * License: MIT
 */

(function (global, factory) {
  'use strict';

  if (typeof module === 'object' && typeof module.exports === 'object') {
    if (global.document) {
      module.exports = factory(global);
    } else {
      throw new Error('HC-Sticky requires a browser to run.');
    }
  } else if (typeof define === 'function' && define.amd) {
    define('hcSticky', [], factory(global));
  } else {
    factory(global);
  }
})(typeof window !== 'undefined' ? window : this, function (window) {
  'use strict';

  var defaultOptions = {
    top: 0,
    bottom: 0,
    bottomEnd: 0,
    innerTop: 0,
    innerSticker: null,
    stickyClass: 'sticky',
    stickTo: null,
    followScroll: true,
    queries: null,
    queryFlow: 'down',
    onStart: null,
    onStop: null,
    onBeforeResize: null,
    onResize: null,
    resizeDebounce: 100,
    disable: false,
    spacer: true
  };

  var document = window.document;

  var hcSticky = function (elem, userSettings) {
    // use querySeletor if string is passed
    if (typeof elem === 'string') {
      elem = document.querySelector(elem);
    }

    // check if element exist
    if (!elem) {
      return false;
    }

    var stickyOptions = {};
    var Helpers = hcSticky.Helpers;
    var elemParent = elem.parentNode;

    // parent can't be static
    if (Helpers.getStyle(elemParent, 'position') === 'static') {
      elemParent.style.position = 'relative';
    }

    var setOptions = function () {
      var options = arguments.length > 0 && arguments[0] !== undefined ? arguments[0] : {};

      if (Helpers.isEmptyObject(options) && !Helpers.isEmptyObject(stickyOptions)) {
        // nothing to set
        return;
      }

      // extend options
      stickyOptions = Object.assign({}, defaultOptions, stickyOptions, options);
    };

    var resetOptions = function (options) {
      stickyOptions = Object.assign({}, defaultOptions, options || {});
    };

    var getOptions = function (option) {
      return option ? stickyOptions.option || null : Object.assign({}, stickyOptions);
    };

    var isDisabled = function () {
      return stickyOptions.disable;
    };

    var applyQueries = function () {
      if (stickyOptions.queries) {
        var window_width = window.innerWidth;
        var queryFlow = stickyOptions.queryFlow;
        var queries = stickyOptions.queries;

        // reset settings
        resetOptions(userSettings);

        if (queryFlow === 'up') {
          for (var width in queries) {
            if (window_width >= width && !Helpers.isEmptyObject(queries[width])) {
              setOptions(queries[width]);
            }
          }
        } else {
          var queries_arr = [];

          // convert to array so we can reverse loop it
          for (var b in stickyOptions.queries) {
            var q = {};

            q[b] = queries[b];
            queries_arr.push(q);
          }

          for (var i = queries_arr.length - 1; i >= 0; i--) {
            var query = queries_arr[i];
            var breakpoint = Object.keys(query)[0];

            if (window_width <= breakpoint && !Helpers.isEmptyObject(query[breakpoint])) {
              setOptions(query[breakpoint]);
            }
          }
        }
      }
    };

    // our helper function for getting necesery styles
    var getStickyCss = function (el) {
      var cascadedStyle = Helpers.getCascadedStyle(el);
      var computedStyle = Helpers.getStyle(el);

      var css = {
        height: el.offsetHeight + 'px',
        left: cascadedStyle.left,
        right: cascadedStyle.right,
        top: cascadedStyle.top,
        bottom: cascadedStyle.bottom,
        position: computedStyle.position,
        display: computedStyle.display,
        verticalAlign: computedStyle.verticalAlign,
        boxSizing: computedStyle.boxSizing,
        marginLeft: cascadedStyle.marginLeft,
        marginRight: cascadedStyle.marginRight,
        marginTop: cascadedStyle.marginTop,
        marginBottom: cascadedStyle.marginBottom,
        paddingLeft: cascadedStyle.paddingLeft,
        paddingRight: cascadedStyle.paddingRight
      };

      if (cascadedStyle['float']) {
        css['float'] = cascadedStyle['float'] || 'none';
      }

      if (cascadedStyle.cssFloat) {
        css['cssFloat'] = cascadedStyle.cssFloat || 'none';
      }

      // old firefox box-sizing
      if (computedStyle.MozBoxSizing) {
        css['MozBoxSizing'] = computedStyle.MozBoxSizing;
      }

      css['width'] = cascadedStyle.width !== 'auto' ? cascadedStyle.width : css.boxSizing === 'border-box' || css.MozBoxSizing === 'border-box' ? el.offsetWidth + 'px' : computedStyle.width;

      return css;
    };

    var Sticky = {
      css: {},
      position: null, // so we don't need to check css all the time
      stick: function () {
        var args = arguments.length > 0 && arguments[0] !== undefined ? arguments[0] : {};

        if (Helpers.hasClass(elem, stickyOptions.stickyClass)) {
          // check if element is already sticky
          return;
        }

        if (stickyOptions.spacer && Spacer.isAttached === false) {
          Spacer.attach();
        }

        Sticky.position = 'fixed';

        // apply styles
        elem.style.position = 'fixed';
        elem.style.left = Spacer.offsetLeft + 'px';
        elem.style.width = Spacer.width;

        if (typeof args.bottom === 'undefined') {
          elem.style.bottom = 'auto';
        } else {
          elem.style.bottom = args.bottom + 'px';
        }

        if (typeof args.top === 'undefined') {
          elem.style.top = 'auto';
        } else {
          elem.style.top = args.top + 'px';
        }

        // add sticky class
        if (elem.classList) {
          elem.classList.add(stickyOptions.stickyClass);
        } else {
          elem.className += ' ' + stickyOptions.stickyClass;
        }

        // fire 'start' event
        if (stickyOptions.onStart) {
          stickyOptions.onStart.call(elem, stickyOptions);
        }
      },
      reset: function () {
        var args = arguments.length > 0 && arguments[0] !== undefined ? arguments[0] : {};

        args.disable = args.disable || false;

        // check if we've already done this
        if (Sticky.position !== 'fixed' && Sticky.position !== null && (typeof args.top === 'undefined' && typeof args.bottom === 'undefined' || typeof args.top !== 'undefined' && (parseInt(Helpers.getStyle(elem, 'top')) || 0) === args.top || typeof args.bottom !== 'undefined' && (parseInt(Helpers.getStyle(elem, 'bottom')) || 0) === args.bottom)) {
          return;
        }

        if (stickyOptions.spacer) {
          if (args.disable === true) {
            // remove spacer
            if (Spacer.isAttached === true) {
              Spacer.detach();
            }
          } else {
            // check spacer
            if (Spacer.isAttached === false) {
              Spacer.attach();
            }
          }
        }

        var position = args.position || Sticky.css.position;

        // remember position
        Sticky.position = position;

        // apply styles
        elem.style.position = position;
        elem.style.left = args.disable === true ? Sticky.css.left : Spacer.positionLeft + 'px';
        elem.style.width = position !== 'absolute' ? Sticky.css.width : Spacer.width;

        if (typeof args.bottom === 'undefined') {
          elem.style.bottom = args.disable === true ? '' : 'auto';
        } else {
          elem.style.bottom = args.bottom + 'px';
        }

        if (typeof args.top === 'undefined') {
          elem.style.top = args.disable === true ? '' : 'auto';
        } else {
          elem.style.top = args.top + 'px';
        }

        // remove sticky class
        if (elem.classList) {
          elem.classList.remove(stickyOptions.stickyClass);
        } else {
          elem.className = elem.className.replace(new RegExp('(^|\\b)' + stickyOptions.stickyClass.split(' ').join('|') + '(\\b|$)', 'gi'), ' ');
        }

        // fire 'stop' event
        if (stickyOptions.onStop) {
          stickyOptions.onStop.call(elem, stickyOptions);
        }
      }
    };

    var Spacer = {
      el: document.createElement('div'),
      offsetLeft: null,
      positionLeft: null,
      width: null,
      isAttached: false,
      init: function () {
        // copy styles from element
        for (var prop in Sticky.css) {
          Spacer.el.style[prop] = Sticky.css[prop];
        }

        var elemStyle = Helpers.getStyle(elem);

        // get spacer offset and position
        Spacer.offsetLeft = Helpers.offset(elem).left - (parseInt(elemStyle.marginLeft) || 0);
        if (elem.offsetParent != null) {
          Spacer.positionLeft = Helpers.position(elem).left;
        } else {
          Spacer.positionLeft = Helpers.offset(elem).left;
        }

        // get spacer width
        Spacer.width = Helpers.getStyle(elem, 'width');
      },
      attach: function () {
        // insert spacer to DOM
        elemParent.insertBefore(Spacer.el, elem.nextSibling);
        Spacer.isAttached = true;
      },
      detach: function () {
        // remove spacer from DOM
        Spacer.el = elemParent.removeChild(Spacer.el);
        Spacer.isAttached = false;
      }
    };

    // define our private variables
    var stickTo_document = void 0;
    var container = void 0;
    var inner_sticker = void 0;

    var container_height = void 0;
    var container_offsetTop = void 0;

    var elemParent_offsetTop = void 0;

    var window_height = void 0;

    var options_top = void 0;
    var options_bottom = void 0;

    var stick_top = void 0;
    var stick_bottom = void 0;

    var top_limit = void 0;
    var bottom_limit = void 0;

    var largerSticky = void 0;
    var sticky_height = void 0;
    var sticky_offsetTop = void 0;

    var calcContainerHeight = void 0;
    var calcStickyHeight = void 0;

    var calcSticky = function () {
      // get/set element styles
      Sticky.css = getStickyCss(elem);

      // init or reinit spacer
      Spacer.init();

      // check if referring element is document
      stickTo_document = stickyOptions.stickTo && (stickyOptions.stickTo === 'document' || stickyOptions.stickTo.nodeType && stickyOptions.stickTo.nodeType === 9 || typeof stickyOptions.stickTo === 'object' && stickyOptions.stickTo instanceof (typeof HTMLDocument !== 'undefined' ? HTMLDocument : Document)) ? true : false;

      // select referred container
      container = stickyOptions.stickTo ? stickTo_document ? elemParent : typeof stickyOptions.stickTo === 'string' ? document.querySelector(stickyOptions.stickTo) : stickyOptions.stickTo : elemParent;

      // get sticky height
      calcStickyHeight = function () {
        var height = elem.offsetHeight + (parseInt(Sticky.css.marginTop) || 0) + (parseInt(Sticky.css.marginBottom) || 0);
        var h_diff = (sticky_height || 0) - height;

        if (h_diff >= -1 && h_diff <= 1) {
          // sometimes element height changes by 1px when it get fixed position, so don't return new value
          return sticky_height;
        } else {
          return height;
        }
      };

      sticky_height = calcStickyHeight();

      // get container height
      calcContainerHeight = function () {
        return !stickTo_document ? container.offsetHeight : Math.max(document.documentElement.clientHeight, document.body.scrollHeight, document.documentElement.scrollHeight, document.body.offsetHeight, document.documentElement.offsetHeight);
      };

      container_height = calcContainerHeight();

      container_offsetTop = Helpers.offset(container).top;
      elemParent_offsetTop = !stickyOptions.stickTo ? container_offsetTop // parent is container
      : Helpers.offset(elemParent).top;
      window_height = window.innerHeight;
      sticky_offsetTop = elem.offsetTop - (parseInt(Sticky.css.marginTop) || 0);

      // get inner sticker element
      inner_sticker = stickyOptions.innerSticker ? typeof stickyOptions.innerSticker === 'string' ? document.querySelector(stickyOptions.innerSticker) : stickyOptions.innerSticker : null;

      // top
      options_top = isNaN(stickyOptions.top) && stickyOptions.top.indexOf('%') > -1 ? parseFloat(stickyOptions.top) / 100 * window_height : stickyOptions.top;

      // bottom
      options_bottom = isNaN(stickyOptions.bottom) && stickyOptions.bottom.indexOf('%') > -1 ? parseFloat(stickyOptions.bottom) / 100 * window_height : stickyOptions.bottom;

      // calculate sticky breakpoints
      stick_top = inner_sticker ? inner_sticker.offsetTop : stickyOptions.innerTop ? stickyOptions.innerTop : 0;

      stick_bottom = isNaN(stickyOptions.bottomEnd) && stickyOptions.bottomEnd.indexOf('%') > -1 ? parseFloat(stickyOptions.bottomEnd) / 100 * window_height : stickyOptions.bottomEnd;

      top_limit = container_offsetTop - options_top + stick_top + sticky_offsetTop;
    };

    // store scroll position so we can determine scroll direction
    var last_pos = window.pageYOffset || document.documentElement.scrollTop;
    var diff_y = 0;
    var scroll_dir = void 0;

    var runSticky = function () {
      // always calculate sticky and container height in case of change
      sticky_height = calcStickyHeight();
      container_height = calcContainerHeight();

      bottom_limit = container_offsetTop + container_height - options_top - stick_bottom;

      // check if sticky is bigger than container
      largerSticky = sticky_height > window_height;

      var offset_top = window.pageYOffset || document.documentElement.scrollTop;
      var sticky_top = Math.round(Helpers.offset(elem).top);
      var sticky_window_top = sticky_top - offset_top;
      var bottom_distance = void 0;

      // get scroll direction
      scroll_dir = offset_top < last_pos ? 'up' : 'down';
      diff_y = offset_top - last_pos;
      last_pos = offset_top;

      if (offset_top > top_limit) {
        // http://geek-and-poke.com/geekandpoke/2012/7/27/simply-explained.html
        if (bottom_limit + options_top + (largerSticky ? options_bottom : 0) - (stickyOptions.followScroll && largerSticky ? 0 : options_top) <= offset_top + sticky_height - stick_top - (sticky_height - stick_top > window_height - (top_limit - stick_top) && stickyOptions.followScroll ? (bottom_distance = sticky_height - window_height - stick_top) > 0 ? bottom_distance : 0 : 0)) {
          // bottom reached end
          Sticky.reset({
            position: 'absolute',
            //top: bottom_limit - sticky_height - top_limit + stick_top + sticky_offsetTop
            bottom: elemParent_offsetTop + elemParent.offsetHeight - bottom_limit - options_top
          });
        } else if (largerSticky && stickyOptions.followScroll) {
          // sticky is bigger than container and follows scroll
          if (scroll_dir === 'down') {
            // scroll down
            if (Math.floor(sticky_window_top + sticky_height + options_bottom) <= window_height) {
              // stick on bottom
              Sticky.stick({
                //top: window_height - sticky_height - options_bottom
                bottom: options_bottom
              });
            } else if (Sticky.position === 'fixed') {
              // bottom reached window bottom
              Sticky.reset({
                position: 'absolute',
                top: sticky_top - options_top - top_limit - diff_y + stick_top
              });
            }
          } else {
            // scroll up
            if (Math.ceil(sticky_window_top + stick_top) < 0 && Sticky.position === 'fixed') {
              // top reached window top
              Sticky.reset({
                position: 'absolute',
                top: sticky_top - options_top - top_limit + stick_top - diff_y
              });
            } else if (sticky_top >= offset_top + options_top - stick_top) {
              // stick on top
              Sticky.stick({
                top: options_top - stick_top
              });
            }
          }
        } else {
          // stick on top
          Sticky.stick({
            top: options_top - stick_top
          });
        }
      } else {
        // starting point
        Sticky.reset({
          disable: true
        });
      }
    };

    var scrollAttached = false;
    var resizeAttached = false;

    var stopSticky = function () {
      if (scrollAttached) {
        // detach sticky from scroll
        Helpers.event.unbind(window, 'scroll', runSticky);

        // sticky is not attached to scroll anymore
        scrollAttached = false;
      }
    };

    var initSticky = function () {
      // calculate stuff
      calcSticky();

      // check if sticky is bigger than reffering container
      if (sticky_height >= container_height) {
        stopSticky();

        return;
      }

      // run
      runSticky();

      if (!scrollAttached) {
        // attach sticky to scroll
        Helpers.event.bind(window, 'scroll', runSticky);

        // sticky is attached to scroll
        scrollAttached = true;
      }
    };

    var resetSticky = function () {
      // remove inline styles
      elem.style.position = '';
      elem.style.left = '';
      elem.style.top = '';
      elem.style.bottom = '';
      elem.style.width = '';

      // remove sticky class
      if (elem.classList) {
        elem.classList.remove(stickyOptions.stickyClass);
      } else {
        elem.className = elem.className.replace(new RegExp('(^|\\b)' + stickyOptions.stickyClass.split(' ').join('|') + '(\\b|$)', 'gi'), ' ');
      }

      // reset sticky object data
      Sticky.css = {};
      Sticky.position = null;

      // remove spacer
      if (stickyOptions.spacer && Spacer.isAttached === true) {
        Spacer.detach();
      }
    };

    var reinitSticky = function () {
      resetSticky();
      applyQueries();

      if (isDisabled()) {
        stopSticky();
        return;
      }

      // restart sticky
      initSticky();
    };

    var resizeSticky = function () {
      // fire 'beforeResize' event
      if (stickyOptions.onBeforeResize) {
        stickyOptions.onBeforeResize.call(elem, stickyOptions);
      }

      // reinit sticky
      reinitSticky();

      // fire 'resize' event
      if (stickyOptions.onResize) {
        stickyOptions.onResize.call(elem, stickyOptions);
      }
    };

    var resize_cb = !stickyOptions.resizeDebounce ? resizeSticky : Helpers.debounce(resizeSticky, stickyOptions.resizeDebounce);

    // Method for updating options
    var Update = function (options) {
      setOptions(options);
      reinitSticky();
    };

    var Detach = function () {
      // detach resize reinit
      if (resizeAttached) {
        Helpers.event.unbind(window, 'resize', resize_cb);
        resizeAttached = false;
      }

      stopSticky();
    };

    var Destroy = function () {
      Detach();
      resetSticky();
    };

    var Attach = function () {
      // attach resize reinit
      if (!resizeAttached) {
        Helpers.event.bind(window, 'resize', resize_cb);
        resizeAttached = true;
      }

      applyQueries();

      if (isDisabled()) {
        stopSticky();
        return;
      }

      initSticky();
    };

    this.options = getOptions;
    this.reinit = reinitSticky;
    this.update = Update;
    this.attach = Attach;
    this.detach = Detach;
    this.destroy = Destroy;

    // init settings
    setOptions(userSettings);

    // start sticky
    Attach();

    // reinit on complete page load
    Helpers.event.bind(window, 'load', reinitSticky);
  };

  // jQuery Plugin
  if (typeof window.jQuery !== 'undefined') {
    var $ = window.jQuery;

    $.fn.extend({
      hcSticky: function (options) {
        // check if selected element exist
        if (!this.length) {
          return this;
        }

        return this.each(function () {
          var namespace = 'hcSticky';
          var instance = $.data(this, namespace);

          if (instance) {
            // already created
            instance.update(options);
          } else {
            // create new instance
            instance = new hcSticky(this, options);
            $.data(this, namespace, instance);
          }
        });
      }
    });
  }

  // browser global
  window.hcSticky = window.hcSticky || hcSticky;

  return hcSticky;
});
(function (window) {
  'use strict';

  var hcSticky = window.hcSticky;
  var document = window.document;

  /*
   * https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Object/assign
   */
  if (typeof Object.assign !== 'function') {
    Object.defineProperty(Object, 'assign', {
      value: function assign(target, varArgs) {
        'use strict';

        if (target == null) {
          throw new TypeError('Cannot convert undefined or null to object');
        }

        var to = Object(target);

        for (var index = 1; index < arguments.length; index++) {
          var nextSource = arguments[index];

          if (nextSource != null) {
            for (var nextKey in nextSource) {
              if (Object.prototype.hasOwnProperty.call(nextSource, nextKey)) {
                to[nextKey] = nextSource[nextKey];
              }
            }
          }
        }
        return to;
      },
      writable: true,
      configurable: true
    });
  }

  /*
   * https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Array/forEach
   */
  if (!Array.prototype.forEach) {
    Array.prototype.forEach = function (callback) {
      var T, k;

      if (this == null) {
        throw new TypeError('this is null or not defined');
      }

      var O = Object(this);
      var len = O.length >>> 0;

      if (typeof callback !== 'function') {
        throw new TypeError(callback + ' is not a function');
      }

      if (arguments.length > 1) {
        T = arguments[1];
      }

      k = 0;

      while (k < len) {
        var kValue;

        if (k in O) {
          kValue = O[k];
          callback.call(T, kValue, k, O);
        }

        k++;
      }
    };
  }

  /*
   * https://github.com/desandro/eventie
   */
  var event = function () {
    var docElem = document.documentElement;

    var bind = function () {};

    function getIEEvent(obj) {
      var event = window.event;
      // add event.target
      event.target = event.target || event.srcElement || obj;
      return event;
    }

    if (docElem.addEventListener) {
      bind = function (obj, type, fn) {
        obj.addEventListener(type, fn, false);
      };
    } else if (docElem.attachEvent) {
      bind = function (obj, type, fn) {
        obj[type + fn] = fn.handleEvent ? function () {
          var event = getIEEvent(obj);
          fn.handleEvent.call(fn, event);
        } : function () {
          var event = getIEEvent(obj);
          fn.call(obj, event);
        };
        obj.attachEvent("on" + type, obj[type + fn]);
      };
    }

    var unbind = function () {};

    if (docElem.removeEventListener) {
      unbind = function (obj, type, fn) {
        obj.removeEventListener(type, fn, false);
      };
    } else if (docElem.detachEvent) {
      unbind = function (obj, type, fn) {
        obj.detachEvent("on" + type, obj[type + fn]);
        try {
          delete obj[type + fn];
        } catch (err) {
          // can't delete window object properties
          obj[type + fn] = undefined;
        }
      };
    }

    return {
      bind: bind,
      unbind: unbind
    };
  }();

  // debounce taken from underscore
  var debounce = function (func, wait, immediate) {
    var timeout = void 0;

    return function () {
      var context = this;
      var args = arguments;
      var later = function () {
        timeout = null;
        if (!immediate) {
          func.apply(context, args);
        }
      };
      var callNow = immediate && !timeout;

      clearTimeout(timeout);
      timeout = setTimeout(later, wait);

      if (callNow) {
        func.apply(context, args);
      }
    };
  };

  // cross-browser get style
  var getStyle = function (el, style) {
    if (window.getComputedStyle) {
      return style ? document.defaultView.getComputedStyle(el, null).getPropertyValue(style) : document.defaultView.getComputedStyle(el, null);
    } else if (el.currentStyle) {
      return style ? el.currentStyle[style.replace(/-\w/g, function (s) {
        return s.toUpperCase().replace('-', '');
      })] : el.currentStyle;
    }
  };

  // check if object is empty
  var isEmptyObject = function (obj) {
    for (var name in obj) {
      return false;
    }

    return true;
  };

  // check if element has class
  var hasClass = function (el, className) {
    if (el.classList) {
      return el.classList.contains(className);
    } else {
      return new RegExp('(^| )' + className + '( |$)', 'gi').test(el.className);
    }
  };

  // like jQuery .offset()
  var offset = function (el) {
    var rect = el.getBoundingClientRect();
    var scrollTop = window.pageYOffset || document.documentElement.scrollTop;
    var scrollLeft = window.pageXOffset || document.documentElement.scrollLeft;

    return {
      top: rect.top + scrollTop,
      left: rect.left + scrollLeft
    };
  };

  // like jQuery .position()
  var position = function (el) {
    var offsetParent = el.offsetParent;
    var parentOffset = offset(offsetParent);
    var elemOffset = offset(el);
    var prentStyle = getStyle(offsetParent);
    var elemStyle = getStyle(el);

    parentOffset.top += parseInt(prentStyle.borderTopWidth) || 0;
    parentOffset.left += parseInt(prentStyle.borderLeftWidth) || 0;

    return {
      top: elemOffset.top - parentOffset.top - (parseInt(elemStyle.marginTop) || 0),
      left: elemOffset.left - parentOffset.left - (parseInt(elemStyle.marginLeft) || 0)
    };
  };

  // get cascaded instead of computed styles
  var getCascadedStyle = function (el) {
    // clone element
    var clone = el.cloneNode(true);

    clone.style.display = 'none';

    // remove name attr from cloned radio buttons to prevent their clearing
    Array.prototype.slice.call(clone.querySelectorAll('input[type="radio"]')).forEach(function (el) {
      el.removeAttribute('name');
    });

    // insert clone to DOM
    el.parentNode.insertBefore(clone, el.nextSibling);

    // get styles
    var currentStyle = void 0;

    if (clone.currentStyle) {
      currentStyle = clone.currentStyle;
    } else if (window.getComputedStyle) {
      currentStyle = document.defaultView.getComputedStyle(clone, null);
    }

    // new style oject
    var style = {};

    for (var prop in currentStyle) {
      if (isNaN(prop) && (typeof currentStyle[prop] === 'string' || typeof currentStyle[prop] === 'number')) {
        style[prop] = currentStyle[prop];
      }
    }

    // safari copy
    if (Object.keys(style).length < 3) {
      style = {}; // clear
      for (var _prop in currentStyle) {
        if (!isNaN(_prop)) {
          style[currentStyle[_prop].replace(/-\w/g, function (s) {
            return s.toUpperCase().replace('-', '');
          })] = currentStyle.getPropertyValue(currentStyle[_prop]);
        }
      }
    }

    // check for margin:auto
    if (!style.margin && style.marginLeft === 'auto') {
      style.margin = 'auto';
    } else if (!style.margin && style.marginLeft === style.marginRight && style.marginLeft === style.marginTop && style.marginLeft === style.marginBottom) {
      style.margin = style.marginLeft;
    }

    // safari margin:auto hack
    if (!style.margin && style.marginLeft === '0px' && style.marginRight === '0px') {
      var posLeft = el.offsetLeft - el.parentNode.offsetLeft;
      var marginLeft = posLeft - (parseInt(style.left) || 0) - (parseInt(style.right) || 0);
      var marginRight = el.parentNode.offsetWidth - el.offsetWidth - posLeft - (parseInt(style.right) || 0) + (parseInt(style.left) || 0);
      var diff = marginRight - marginLeft;

      if (diff === 0 || diff === 1) {
        style.margin = 'auto';
      }
    }

    // destroy clone
    clone.parentNode.removeChild(clone);
    clone = null;

    return style;
  };

  hcSticky.Helpers = {
    isEmptyObject: isEmptyObject,
    debounce: debounce,
    hasClass: hasClass,
    offset: offset,
    position: position,
    getStyle: getStyle,
    getCascadedStyle: getCascadedStyle,
    event: event
  };
})(window);