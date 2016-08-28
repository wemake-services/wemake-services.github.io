(function e(t,n,r){function s(o,u){if(!n[o]){if(!t[o]){var a=typeof require=="function"&&require;if(!u&&a)return a(o,!0);if(i)return i(o,!0);var f=new Error("Cannot find module '"+o+"'");throw f.code="MODULE_NOT_FOUND",f}var l=n[o]={exports:{}};t[o][0].call(l.exports,function(e){var n=t[o][1][e];return s(n?n:e)},l,l.exports,e,t,n,r)}return n[o].exports}var i=typeof require=="function"&&require;for(var o=0;o<r.length;o++)s(r[o]);return s})({1:[function(require,module,exports){
'use strict';

var typewriter = require('typewriter-js');

document.addEventListener('DOMContentLoaded', function () {
  typewriter.prepare('.typewriter');
  typewriter.type('.typewriter', {
    duration: 1000
  });
});

},{"typewriter-js":9}],2:[function(require,module,exports){
/**
 * An even better animation frame.
 *
 * @copyright Oleg Slobodskoi 2015
 * @website https://github.com/kof/animationFrame
 * @license MIT
 */

module.exports = require('./lib/animation-frame')

},{"./lib/animation-frame":3}],3:[function(require,module,exports){
'use strict'

var nativeImpl = require('./native')
var now = require('./now')
var performance = require('./performance')

// Weird native implementation doesn't work if context is defined.
var nativeRequest = nativeImpl.request
var nativeCancel = nativeImpl.cancel

/**
 * Animation frame constructor.
 *
 * Options:
 *   - `useNative` use the native animation frame if possible, defaults to true
 *   - `frameRate` pass a custom frame rate
 *
 * @param {Object|Number} options
 */
function AnimationFrame(options) {
    if (!(this instanceof AnimationFrame)) return new AnimationFrame(options)
    options || (options = {})

    // Its a frame rate.
    if (typeof options == 'number') options = {frameRate: options}
    options.useNative != null || (options.useNative = true)
    this.options = options
    this.frameRate = options.frameRate || AnimationFrame.FRAME_RATE
    this._frameLength = 1000 / this.frameRate
    this._isCustomFrameRate = this.frameRate !== AnimationFrame.FRAME_RATE
    this._timeoutId = null
    this._callbacks = {}
    this._lastTickTime = 0
    this._tickCounter = 0
}

module.exports = AnimationFrame

/**
 * Default frame rate used for shim implementation. Native implementation
 * will use the screen frame rate, but js have no way to detect it.
 *
 * If you know your target device, define it manually.
 *
 * @type {Number}
 * @api public
 */
AnimationFrame.FRAME_RATE = 60

/**
 * Replace the globally defined implementation or define it globally.
 *
 * @param {Object|Number} [options]
 * @api public
 */
AnimationFrame.shim = function(options) {
    var animationFrame = new AnimationFrame(options)

    window.requestAnimationFrame = function(callback) {
        return animationFrame.request(callback)
    }
    window.cancelAnimationFrame = function(id) {
        return animationFrame.cancel(id)
    }

    return animationFrame
}

/**
 * Request animation frame.
 * We will use the native RAF as soon as we know it does works.
 *
 * @param {Function} callback
 * @return {Number} timeout id or requested animation frame id
 * @api public
 */
AnimationFrame.prototype.request = function(callback) {
    var self = this

    // Alawys inc counter to ensure it never has a conflict with the native counter.
    // After the feature test phase we don't know exactly which implementation has been used.
    // Therefore on #cancel we do it for both.
    ++this._tickCounter

    if (nativeImpl.supported && this.options.useNative && !this._isCustomFrameRate) {
        return nativeRequest(callback)
    }

    if (!callback) throw new TypeError('Not enough arguments')

    if (this._timeoutId == null) {
        // Much faster than Math.max
        // http://jsperf.com/math-max-vs-comparison/3
        // http://jsperf.com/date-now-vs-date-gettime/11
        var delay = this._frameLength + this._lastTickTime - now()
        if (delay < 0) delay = 0

        this._timeoutId = setTimeout(function() {
            self._lastTickTime = now()
            self._timeoutId = null
            ++self._tickCounter
            var callbacks = self._callbacks
            self._callbacks = {}
            for (var id in callbacks) {
                if (callbacks[id]) {
                    if (nativeImpl.supported && self.options.useNative) {
                        nativeRequest(callbacks[id])
                    } else {
                        callbacks[id](performance.now())
                    }
                }
            }
        }, delay)
    }

    this._callbacks[this._tickCounter] = callback

    return this._tickCounter
}

/**
 * Cancel animation frame.
 *
 * @param {Number} timeout id or requested animation frame id
 *
 * @api public
 */
AnimationFrame.prototype.cancel = function(id) {
    if (nativeImpl.supported && this.options.useNative) nativeCancel(id)
    delete this._callbacks[id]
}

},{"./native":4,"./now":5,"./performance":7}],4:[function(require,module,exports){
'use strict'

var global = window

// Test if we are within a foreign domain. Use raf from the top if possible.
try {
    // Accessing .name will throw SecurityError within a foreign domain.
    global.top.name
    global = global.top
} catch(e) {}

exports.request = global.requestAnimationFrame
exports.cancel = global.cancelAnimationFrame || global.cancelRequestAnimationFrame
exports.supported = false

var vendors = ['Webkit', 'Moz', 'ms', 'O']

// Grab the native implementation.
for (var i = 0; i < vendors.length && !exports.request; i++) {
    exports.request = global[vendors[i] + 'RequestAnimationFrame']
    exports.cancel = global[vendors[i] + 'CancelAnimationFrame'] ||
        global[vendors[i] + 'CancelRequestAnimationFrame']
}

// Test if native implementation works.
// There are some issues on ios6
// http://shitwebkitdoes.tumblr.com/post/47186945856/native-requestanimationframe-broken-on-ios-6
// https://gist.github.com/KrofDrakula/5318048

if (exports.request) {
    exports.request.call(null, function() {
        exports.supported = true
    });
}

},{}],5:[function(require,module,exports){
'use strict'

/**
 * Crossplatform Date.now()
 *
 * @return {Number} time in ms
 * @api private
 */
module.exports = Date.now || function() {
    return (new Date).getTime()
}

},{}],6:[function(require,module,exports){
'use strict'

var now = require('./now')

/**
 * Replacement for PerformanceTiming.navigationStart for the case when
 * performance.now is not implemented.
 *
 * https://developer.mozilla.org/en-US/docs/Web/API/PerformanceTiming.navigationStart
 *
 * @type {Number}
 * @api private
 */
exports.navigationStart = now()

},{"./now":5}],7:[function(require,module,exports){
'use strict'

var now = require('./now')
var PerformanceTiming = require('./performance-timing')

/**
 * Crossplatform performance.now()
 *
 * https://developer.mozilla.org/en-US/docs/Web/API/Performance.now()
 *
 * @return {Number} relative time in ms
 * @api public
 */
exports.now = function () {
    if (window.performance && window.performance.now) return window.performance.now()
    return now() - PerformanceTiming.navigationStart
}


},{"./now":5,"./performance-timing":6}],8:[function(require,module,exports){
module.exports = function(opts) {
  return new ElementClass(opts)
}

function indexOf(arr, prop) {
  if (arr.indexOf) return arr.indexOf(prop)
  for (var i = 0, len = arr.length; i < len; i++)
    if (arr[i] === prop) return i
  return -1
}

function ElementClass(opts) {
  if (!(this instanceof ElementClass)) return new ElementClass(opts)
  var self = this
  if (!opts) opts = {}

  // similar doing instanceof HTMLElement but works in IE8
  if (opts.nodeType) opts = {el: opts}

  this.opts = opts
  this.el = opts.el || document.body
  if (typeof this.el !== 'object') this.el = document.querySelector(this.el)
}

ElementClass.prototype.add = function(className) {
  var el = this.el
  if (!el) return
  if (el.className === "") return el.className = className
  var classes = el.className.split(' ')
  if (indexOf(classes, className) > -1) return classes
  classes.push(className)
  el.className = classes.join(' ')
  return classes
}

ElementClass.prototype.remove = function(className) {
  var el = this.el
  if (!el) return
  if (el.className === "") return
  var classes = el.className.split(' ')
  var idx = indexOf(classes, className)
  if (idx > -1) classes.splice(idx, 1)
  el.className = classes.join(' ')
  return classes
}

ElementClass.prototype.has = function(className) {
  var el = this.el
  if (!el) return
  var classes = el.className.split(' ')
  return indexOf(classes, className) > -1
}

ElementClass.prototype.toggle = function(className) {
  var el = this.el
  if (!el) return
  if (this.has(className)) this.remove(className)
  else this.add(className)
}

},{}],9:[function(require,module,exports){
var AnimationFrame = require('animation-frame');
AnimationFrame.shim();
var elementClass = require('element-class');

module.exports = {

	prepareElement: function(element) {

		// grab the text (as long as it doesn't have (&), (<), or (>) - see https://developer.mozilla.org/en-US/docs/Web/API/Element.innerHTML)
		var text = element.innerHTML;

		// split text into characters
		var characters = text.split('');

		var spans = '';

		for (var i = 0; i < characters.length; i++) {

			spans += '<span' + (characters[i] === ' ' ? ' class="whitespace"' : '') + '>' + characters[i] + '</span>';
		}

		element.innerHTML = spans;
	},

	prepare: function(selector) {

		var elements = document.querySelectorAll(selector);

		for (var i = 0; i < elements.length; i++) {
			this.prepareElement(elements[i]);
		}
	},

	toggleType: function(mode, selector, options) {

		return new Promise(function(resolve, reject) {

			var opts = {};
			options = options || {};

			// wait 10 ms before typing - not exactly sure why i have to do this :(
			setTimeout(function() {

				var children = document.querySelectorAll(selector + ' span');

				if (mode === "untype") {

					// reverse children
					children = Array.prototype.slice.call(children).reverse();

					// give 'show' class to all children immediately
					for (var j = 0; j < children.length; j++) {
						elementClass(children[j]).add('show');
					}

				}

				// use delay if present,
				// otherwise use duration if present,
				// otherwise provide default delay
				opts.delay = options.delay ? options.delay :
					options.duration ? options.duration / children.length :
					50;

				var i = 0;
				var rAF;

				function typeCharacter() {

					setTimeout(function() {

						// TODO: options.duration doesn't really work
						// atm it's limited by device refresh rate, e.g. 60
						// rewrite this to look at time delta since last call
						rAF = requestAnimationFrame(typeCharacter);

						if (i < children.length) {

							if (mode === "type") {
								elementClass(children[i]).add('show');
							} else {
								elementClass(children[i]).remove('show');
							}

						} else {

							cancelAnimationFrame(rAF);
							resolve();
						}

						i++;

					}, opts.delay);
				}

				typeCharacter();

			}, 10);

		});

	},

	type: function(selector, options) {

		return this.toggleType('type', selector, options);
	},

	untype: function(selector, options) {

		return this.toggleType('untype', selector, options);
	}
};

},{"animation-frame":2,"element-class":8}]},{},[1])
//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIm5vZGVfbW9kdWxlcy9icm93c2VyLXBhY2svX3ByZWx1ZGUuanMiLCJfanMvbWFpbi5qcyIsIm5vZGVfbW9kdWxlcy9hbmltYXRpb24tZnJhbWUvaW5kZXguanMiLCJub2RlX21vZHVsZXMvYW5pbWF0aW9uLWZyYW1lL2xpYi9hbmltYXRpb24tZnJhbWUuanMiLCJub2RlX21vZHVsZXMvYW5pbWF0aW9uLWZyYW1lL2xpYi9uYXRpdmUuanMiLCJub2RlX21vZHVsZXMvYW5pbWF0aW9uLWZyYW1lL2xpYi9ub3cuanMiLCJub2RlX21vZHVsZXMvYW5pbWF0aW9uLWZyYW1lL2xpYi9wZXJmb3JtYW5jZS10aW1pbmcuanMiLCJub2RlX21vZHVsZXMvYW5pbWF0aW9uLWZyYW1lL2xpYi9wZXJmb3JtYW5jZS5qcyIsIm5vZGVfbW9kdWxlcy9lbGVtZW50LWNsYXNzL2luZGV4LmpzIiwibm9kZV9tb2R1bGVzL3R5cGV3cml0ZXItanMvaW5kZXguanMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6IkFBQUE7OztBQ0NBLElBQU0sYUFBYSxRQUFRLGVBQVIsQ0FBbkI7O0FBRUEsU0FBUyxnQkFBVCxDQUEwQixrQkFBMUIsRUFBOEMsWUFBTTtBQUNsRCxhQUFXLE9BQVgsQ0FBbUIsYUFBbkI7QUFDQSxhQUFXLElBQVgsQ0FBZ0IsYUFBaEIsRUFBK0I7QUFDN0IsY0FBVTtBQURtQixHQUEvQjtBQUdELENBTEQ7OztBQ0hBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQ1RBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUNuSUE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUNsQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQ1hBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUNkQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUNsQkE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQzNEQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0EiLCJmaWxlIjoiZ2VuZXJhdGVkLmpzIiwic291cmNlUm9vdCI6IiIsInNvdXJjZXNDb250ZW50IjpbIihmdW5jdGlvbiBlKHQsbixyKXtmdW5jdGlvbiBzKG8sdSl7aWYoIW5bb10pe2lmKCF0W29dKXt2YXIgYT10eXBlb2YgcmVxdWlyZT09XCJmdW5jdGlvblwiJiZyZXF1aXJlO2lmKCF1JiZhKXJldHVybiBhKG8sITApO2lmKGkpcmV0dXJuIGkobywhMCk7dmFyIGY9bmV3IEVycm9yKFwiQ2Fubm90IGZpbmQgbW9kdWxlICdcIitvK1wiJ1wiKTt0aHJvdyBmLmNvZGU9XCJNT0RVTEVfTk9UX0ZPVU5EXCIsZn12YXIgbD1uW29dPXtleHBvcnRzOnt9fTt0W29dWzBdLmNhbGwobC5leHBvcnRzLGZ1bmN0aW9uKGUpe3ZhciBuPXRbb11bMV1bZV07cmV0dXJuIHMobj9uOmUpfSxsLGwuZXhwb3J0cyxlLHQsbixyKX1yZXR1cm4gbltvXS5leHBvcnRzfXZhciBpPXR5cGVvZiByZXF1aXJlPT1cImZ1bmN0aW9uXCImJnJlcXVpcmU7Zm9yKHZhciBvPTA7bzxyLmxlbmd0aDtvKyspcyhyW29dKTtyZXR1cm4gc30pIiwiXG5jb25zdCB0eXBld3JpdGVyID0gcmVxdWlyZSgndHlwZXdyaXRlci1qcycpO1xuXG5kb2N1bWVudC5hZGRFdmVudExpc3RlbmVyKCdET01Db250ZW50TG9hZGVkJywgKCkgPT4ge1xuICB0eXBld3JpdGVyLnByZXBhcmUoJy50eXBld3JpdGVyJyk7XG4gIHR5cGV3cml0ZXIudHlwZSgnLnR5cGV3cml0ZXInLCB7XG4gICAgZHVyYXRpb246IDEwMDAsXG4gIH0pO1xufSk7XG4iLCIvKipcbiAqIEFuIGV2ZW4gYmV0dGVyIGFuaW1hdGlvbiBmcmFtZS5cbiAqXG4gKiBAY29weXJpZ2h0IE9sZWcgU2xvYm9kc2tvaSAyMDE1XG4gKiBAd2Vic2l0ZSBodHRwczovL2dpdGh1Yi5jb20va29mL2FuaW1hdGlvbkZyYW1lXG4gKiBAbGljZW5zZSBNSVRcbiAqL1xuXG5tb2R1bGUuZXhwb3J0cyA9IHJlcXVpcmUoJy4vbGliL2FuaW1hdGlvbi1mcmFtZScpXG4iLCIndXNlIHN0cmljdCdcblxudmFyIG5hdGl2ZUltcGwgPSByZXF1aXJlKCcuL25hdGl2ZScpXG52YXIgbm93ID0gcmVxdWlyZSgnLi9ub3cnKVxudmFyIHBlcmZvcm1hbmNlID0gcmVxdWlyZSgnLi9wZXJmb3JtYW5jZScpXG5cbi8vIFdlaXJkIG5hdGl2ZSBpbXBsZW1lbnRhdGlvbiBkb2Vzbid0IHdvcmsgaWYgY29udGV4dCBpcyBkZWZpbmVkLlxudmFyIG5hdGl2ZVJlcXVlc3QgPSBuYXRpdmVJbXBsLnJlcXVlc3RcbnZhciBuYXRpdmVDYW5jZWwgPSBuYXRpdmVJbXBsLmNhbmNlbFxuXG4vKipcbiAqIEFuaW1hdGlvbiBmcmFtZSBjb25zdHJ1Y3Rvci5cbiAqXG4gKiBPcHRpb25zOlxuICogICAtIGB1c2VOYXRpdmVgIHVzZSB0aGUgbmF0aXZlIGFuaW1hdGlvbiBmcmFtZSBpZiBwb3NzaWJsZSwgZGVmYXVsdHMgdG8gdHJ1ZVxuICogICAtIGBmcmFtZVJhdGVgIHBhc3MgYSBjdXN0b20gZnJhbWUgcmF0ZVxuICpcbiAqIEBwYXJhbSB7T2JqZWN0fE51bWJlcn0gb3B0aW9uc1xuICovXG5mdW5jdGlvbiBBbmltYXRpb25GcmFtZShvcHRpb25zKSB7XG4gICAgaWYgKCEodGhpcyBpbnN0YW5jZW9mIEFuaW1hdGlvbkZyYW1lKSkgcmV0dXJuIG5ldyBBbmltYXRpb25GcmFtZShvcHRpb25zKVxuICAgIG9wdGlvbnMgfHwgKG9wdGlvbnMgPSB7fSlcblxuICAgIC8vIEl0cyBhIGZyYW1lIHJhdGUuXG4gICAgaWYgKHR5cGVvZiBvcHRpb25zID09ICdudW1iZXInKSBvcHRpb25zID0ge2ZyYW1lUmF0ZTogb3B0aW9uc31cbiAgICBvcHRpb25zLnVzZU5hdGl2ZSAhPSBudWxsIHx8IChvcHRpb25zLnVzZU5hdGl2ZSA9IHRydWUpXG4gICAgdGhpcy5vcHRpb25zID0gb3B0aW9uc1xuICAgIHRoaXMuZnJhbWVSYXRlID0gb3B0aW9ucy5mcmFtZVJhdGUgfHwgQW5pbWF0aW9uRnJhbWUuRlJBTUVfUkFURVxuICAgIHRoaXMuX2ZyYW1lTGVuZ3RoID0gMTAwMCAvIHRoaXMuZnJhbWVSYXRlXG4gICAgdGhpcy5faXNDdXN0b21GcmFtZVJhdGUgPSB0aGlzLmZyYW1lUmF0ZSAhPT0gQW5pbWF0aW9uRnJhbWUuRlJBTUVfUkFURVxuICAgIHRoaXMuX3RpbWVvdXRJZCA9IG51bGxcbiAgICB0aGlzLl9jYWxsYmFja3MgPSB7fVxuICAgIHRoaXMuX2xhc3RUaWNrVGltZSA9IDBcbiAgICB0aGlzLl90aWNrQ291bnRlciA9IDBcbn1cblxubW9kdWxlLmV4cG9ydHMgPSBBbmltYXRpb25GcmFtZVxuXG4vKipcbiAqIERlZmF1bHQgZnJhbWUgcmF0ZSB1c2VkIGZvciBzaGltIGltcGxlbWVudGF0aW9uLiBOYXRpdmUgaW1wbGVtZW50YXRpb25cbiAqIHdpbGwgdXNlIHRoZSBzY3JlZW4gZnJhbWUgcmF0ZSwgYnV0IGpzIGhhdmUgbm8gd2F5IHRvIGRldGVjdCBpdC5cbiAqXG4gKiBJZiB5b3Uga25vdyB5b3VyIHRhcmdldCBkZXZpY2UsIGRlZmluZSBpdCBtYW51YWxseS5cbiAqXG4gKiBAdHlwZSB7TnVtYmVyfVxuICogQGFwaSBwdWJsaWNcbiAqL1xuQW5pbWF0aW9uRnJhbWUuRlJBTUVfUkFURSA9IDYwXG5cbi8qKlxuICogUmVwbGFjZSB0aGUgZ2xvYmFsbHkgZGVmaW5lZCBpbXBsZW1lbnRhdGlvbiBvciBkZWZpbmUgaXQgZ2xvYmFsbHkuXG4gKlxuICogQHBhcmFtIHtPYmplY3R8TnVtYmVyfSBbb3B0aW9uc11cbiAqIEBhcGkgcHVibGljXG4gKi9cbkFuaW1hdGlvbkZyYW1lLnNoaW0gPSBmdW5jdGlvbihvcHRpb25zKSB7XG4gICAgdmFyIGFuaW1hdGlvbkZyYW1lID0gbmV3IEFuaW1hdGlvbkZyYW1lKG9wdGlvbnMpXG5cbiAgICB3aW5kb3cucmVxdWVzdEFuaW1hdGlvbkZyYW1lID0gZnVuY3Rpb24oY2FsbGJhY2spIHtcbiAgICAgICAgcmV0dXJuIGFuaW1hdGlvbkZyYW1lLnJlcXVlc3QoY2FsbGJhY2spXG4gICAgfVxuICAgIHdpbmRvdy5jYW5jZWxBbmltYXRpb25GcmFtZSA9IGZ1bmN0aW9uKGlkKSB7XG4gICAgICAgIHJldHVybiBhbmltYXRpb25GcmFtZS5jYW5jZWwoaWQpXG4gICAgfVxuXG4gICAgcmV0dXJuIGFuaW1hdGlvbkZyYW1lXG59XG5cbi8qKlxuICogUmVxdWVzdCBhbmltYXRpb24gZnJhbWUuXG4gKiBXZSB3aWxsIHVzZSB0aGUgbmF0aXZlIFJBRiBhcyBzb29uIGFzIHdlIGtub3cgaXQgZG9lcyB3b3Jrcy5cbiAqXG4gKiBAcGFyYW0ge0Z1bmN0aW9ufSBjYWxsYmFja1xuICogQHJldHVybiB7TnVtYmVyfSB0aW1lb3V0IGlkIG9yIHJlcXVlc3RlZCBhbmltYXRpb24gZnJhbWUgaWRcbiAqIEBhcGkgcHVibGljXG4gKi9cbkFuaW1hdGlvbkZyYW1lLnByb3RvdHlwZS5yZXF1ZXN0ID0gZnVuY3Rpb24oY2FsbGJhY2spIHtcbiAgICB2YXIgc2VsZiA9IHRoaXNcblxuICAgIC8vIEFsYXd5cyBpbmMgY291bnRlciB0byBlbnN1cmUgaXQgbmV2ZXIgaGFzIGEgY29uZmxpY3Qgd2l0aCB0aGUgbmF0aXZlIGNvdW50ZXIuXG4gICAgLy8gQWZ0ZXIgdGhlIGZlYXR1cmUgdGVzdCBwaGFzZSB3ZSBkb24ndCBrbm93IGV4YWN0bHkgd2hpY2ggaW1wbGVtZW50YXRpb24gaGFzIGJlZW4gdXNlZC5cbiAgICAvLyBUaGVyZWZvcmUgb24gI2NhbmNlbCB3ZSBkbyBpdCBmb3IgYm90aC5cbiAgICArK3RoaXMuX3RpY2tDb3VudGVyXG5cbiAgICBpZiAobmF0aXZlSW1wbC5zdXBwb3J0ZWQgJiYgdGhpcy5vcHRpb25zLnVzZU5hdGl2ZSAmJiAhdGhpcy5faXNDdXN0b21GcmFtZVJhdGUpIHtcbiAgICAgICAgcmV0dXJuIG5hdGl2ZVJlcXVlc3QoY2FsbGJhY2spXG4gICAgfVxuXG4gICAgaWYgKCFjYWxsYmFjaykgdGhyb3cgbmV3IFR5cGVFcnJvcignTm90IGVub3VnaCBhcmd1bWVudHMnKVxuXG4gICAgaWYgKHRoaXMuX3RpbWVvdXRJZCA9PSBudWxsKSB7XG4gICAgICAgIC8vIE11Y2ggZmFzdGVyIHRoYW4gTWF0aC5tYXhcbiAgICAgICAgLy8gaHR0cDovL2pzcGVyZi5jb20vbWF0aC1tYXgtdnMtY29tcGFyaXNvbi8zXG4gICAgICAgIC8vIGh0dHA6Ly9qc3BlcmYuY29tL2RhdGUtbm93LXZzLWRhdGUtZ2V0dGltZS8xMVxuICAgICAgICB2YXIgZGVsYXkgPSB0aGlzLl9mcmFtZUxlbmd0aCArIHRoaXMuX2xhc3RUaWNrVGltZSAtIG5vdygpXG4gICAgICAgIGlmIChkZWxheSA8IDApIGRlbGF5ID0gMFxuXG4gICAgICAgIHRoaXMuX3RpbWVvdXRJZCA9IHNldFRpbWVvdXQoZnVuY3Rpb24oKSB7XG4gICAgICAgICAgICBzZWxmLl9sYXN0VGlja1RpbWUgPSBub3coKVxuICAgICAgICAgICAgc2VsZi5fdGltZW91dElkID0gbnVsbFxuICAgICAgICAgICAgKytzZWxmLl90aWNrQ291bnRlclxuICAgICAgICAgICAgdmFyIGNhbGxiYWNrcyA9IHNlbGYuX2NhbGxiYWNrc1xuICAgICAgICAgICAgc2VsZi5fY2FsbGJhY2tzID0ge31cbiAgICAgICAgICAgIGZvciAodmFyIGlkIGluIGNhbGxiYWNrcykge1xuICAgICAgICAgICAgICAgIGlmIChjYWxsYmFja3NbaWRdKSB7XG4gICAgICAgICAgICAgICAgICAgIGlmIChuYXRpdmVJbXBsLnN1cHBvcnRlZCAmJiBzZWxmLm9wdGlvbnMudXNlTmF0aXZlKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICBuYXRpdmVSZXF1ZXN0KGNhbGxiYWNrc1tpZF0pXG4gICAgICAgICAgICAgICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICAgICAgICAgICAgICBjYWxsYmFja3NbaWRdKHBlcmZvcm1hbmNlLm5vdygpKVxuICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgfVxuICAgICAgICB9LCBkZWxheSlcbiAgICB9XG5cbiAgICB0aGlzLl9jYWxsYmFja3NbdGhpcy5fdGlja0NvdW50ZXJdID0gY2FsbGJhY2tcblxuICAgIHJldHVybiB0aGlzLl90aWNrQ291bnRlclxufVxuXG4vKipcbiAqIENhbmNlbCBhbmltYXRpb24gZnJhbWUuXG4gKlxuICogQHBhcmFtIHtOdW1iZXJ9IHRpbWVvdXQgaWQgb3IgcmVxdWVzdGVkIGFuaW1hdGlvbiBmcmFtZSBpZFxuICpcbiAqIEBhcGkgcHVibGljXG4gKi9cbkFuaW1hdGlvbkZyYW1lLnByb3RvdHlwZS5jYW5jZWwgPSBmdW5jdGlvbihpZCkge1xuICAgIGlmIChuYXRpdmVJbXBsLnN1cHBvcnRlZCAmJiB0aGlzLm9wdGlvbnMudXNlTmF0aXZlKSBuYXRpdmVDYW5jZWwoaWQpXG4gICAgZGVsZXRlIHRoaXMuX2NhbGxiYWNrc1tpZF1cbn1cbiIsIid1c2Ugc3RyaWN0J1xuXG52YXIgZ2xvYmFsID0gd2luZG93XG5cbi8vIFRlc3QgaWYgd2UgYXJlIHdpdGhpbiBhIGZvcmVpZ24gZG9tYWluLiBVc2UgcmFmIGZyb20gdGhlIHRvcCBpZiBwb3NzaWJsZS5cbnRyeSB7XG4gICAgLy8gQWNjZXNzaW5nIC5uYW1lIHdpbGwgdGhyb3cgU2VjdXJpdHlFcnJvciB3aXRoaW4gYSBmb3JlaWduIGRvbWFpbi5cbiAgICBnbG9iYWwudG9wLm5hbWVcbiAgICBnbG9iYWwgPSBnbG9iYWwudG9wXG59IGNhdGNoKGUpIHt9XG5cbmV4cG9ydHMucmVxdWVzdCA9IGdsb2JhbC5yZXF1ZXN0QW5pbWF0aW9uRnJhbWVcbmV4cG9ydHMuY2FuY2VsID0gZ2xvYmFsLmNhbmNlbEFuaW1hdGlvbkZyYW1lIHx8IGdsb2JhbC5jYW5jZWxSZXF1ZXN0QW5pbWF0aW9uRnJhbWVcbmV4cG9ydHMuc3VwcG9ydGVkID0gZmFsc2VcblxudmFyIHZlbmRvcnMgPSBbJ1dlYmtpdCcsICdNb3onLCAnbXMnLCAnTyddXG5cbi8vIEdyYWIgdGhlIG5hdGl2ZSBpbXBsZW1lbnRhdGlvbi5cbmZvciAodmFyIGkgPSAwOyBpIDwgdmVuZG9ycy5sZW5ndGggJiYgIWV4cG9ydHMucmVxdWVzdDsgaSsrKSB7XG4gICAgZXhwb3J0cy5yZXF1ZXN0ID0gZ2xvYmFsW3ZlbmRvcnNbaV0gKyAnUmVxdWVzdEFuaW1hdGlvbkZyYW1lJ11cbiAgICBleHBvcnRzLmNhbmNlbCA9IGdsb2JhbFt2ZW5kb3JzW2ldICsgJ0NhbmNlbEFuaW1hdGlvbkZyYW1lJ10gfHxcbiAgICAgICAgZ2xvYmFsW3ZlbmRvcnNbaV0gKyAnQ2FuY2VsUmVxdWVzdEFuaW1hdGlvbkZyYW1lJ11cbn1cblxuLy8gVGVzdCBpZiBuYXRpdmUgaW1wbGVtZW50YXRpb24gd29ya3MuXG4vLyBUaGVyZSBhcmUgc29tZSBpc3N1ZXMgb24gaW9zNlxuLy8gaHR0cDovL3NoaXR3ZWJraXRkb2VzLnR1bWJsci5jb20vcG9zdC80NzE4Njk0NTg1Ni9uYXRpdmUtcmVxdWVzdGFuaW1hdGlvbmZyYW1lLWJyb2tlbi1vbi1pb3MtNlxuLy8gaHR0cHM6Ly9naXN0LmdpdGh1Yi5jb20vS3JvZkRyYWt1bGEvNTMxODA0OFxuXG5pZiAoZXhwb3J0cy5yZXF1ZXN0KSB7XG4gICAgZXhwb3J0cy5yZXF1ZXN0LmNhbGwobnVsbCwgZnVuY3Rpb24oKSB7XG4gICAgICAgIGV4cG9ydHMuc3VwcG9ydGVkID0gdHJ1ZVxuICAgIH0pO1xufVxuIiwiJ3VzZSBzdHJpY3QnXG5cbi8qKlxuICogQ3Jvc3NwbGF0Zm9ybSBEYXRlLm5vdygpXG4gKlxuICogQHJldHVybiB7TnVtYmVyfSB0aW1lIGluIG1zXG4gKiBAYXBpIHByaXZhdGVcbiAqL1xubW9kdWxlLmV4cG9ydHMgPSBEYXRlLm5vdyB8fCBmdW5jdGlvbigpIHtcbiAgICByZXR1cm4gKG5ldyBEYXRlKS5nZXRUaW1lKClcbn1cbiIsIid1c2Ugc3RyaWN0J1xuXG52YXIgbm93ID0gcmVxdWlyZSgnLi9ub3cnKVxuXG4vKipcbiAqIFJlcGxhY2VtZW50IGZvciBQZXJmb3JtYW5jZVRpbWluZy5uYXZpZ2F0aW9uU3RhcnQgZm9yIHRoZSBjYXNlIHdoZW5cbiAqIHBlcmZvcm1hbmNlLm5vdyBpcyBub3QgaW1wbGVtZW50ZWQuXG4gKlxuICogaHR0cHM6Ly9kZXZlbG9wZXIubW96aWxsYS5vcmcvZW4tVVMvZG9jcy9XZWIvQVBJL1BlcmZvcm1hbmNlVGltaW5nLm5hdmlnYXRpb25TdGFydFxuICpcbiAqIEB0eXBlIHtOdW1iZXJ9XG4gKiBAYXBpIHByaXZhdGVcbiAqL1xuZXhwb3J0cy5uYXZpZ2F0aW9uU3RhcnQgPSBub3coKVxuIiwiJ3VzZSBzdHJpY3QnXG5cbnZhciBub3cgPSByZXF1aXJlKCcuL25vdycpXG52YXIgUGVyZm9ybWFuY2VUaW1pbmcgPSByZXF1aXJlKCcuL3BlcmZvcm1hbmNlLXRpbWluZycpXG5cbi8qKlxuICogQ3Jvc3NwbGF0Zm9ybSBwZXJmb3JtYW5jZS5ub3coKVxuICpcbiAqIGh0dHBzOi8vZGV2ZWxvcGVyLm1vemlsbGEub3JnL2VuLVVTL2RvY3MvV2ViL0FQSS9QZXJmb3JtYW5jZS5ub3coKVxuICpcbiAqIEByZXR1cm4ge051bWJlcn0gcmVsYXRpdmUgdGltZSBpbiBtc1xuICogQGFwaSBwdWJsaWNcbiAqL1xuZXhwb3J0cy5ub3cgPSBmdW5jdGlvbiAoKSB7XG4gICAgaWYgKHdpbmRvdy5wZXJmb3JtYW5jZSAmJiB3aW5kb3cucGVyZm9ybWFuY2Uubm93KSByZXR1cm4gd2luZG93LnBlcmZvcm1hbmNlLm5vdygpXG4gICAgcmV0dXJuIG5vdygpIC0gUGVyZm9ybWFuY2VUaW1pbmcubmF2aWdhdGlvblN0YXJ0XG59XG5cbiIsIm1vZHVsZS5leHBvcnRzID0gZnVuY3Rpb24ob3B0cykge1xuICByZXR1cm4gbmV3IEVsZW1lbnRDbGFzcyhvcHRzKVxufVxuXG5mdW5jdGlvbiBpbmRleE9mKGFyciwgcHJvcCkge1xuICBpZiAoYXJyLmluZGV4T2YpIHJldHVybiBhcnIuaW5kZXhPZihwcm9wKVxuICBmb3IgKHZhciBpID0gMCwgbGVuID0gYXJyLmxlbmd0aDsgaSA8IGxlbjsgaSsrKVxuICAgIGlmIChhcnJbaV0gPT09IHByb3ApIHJldHVybiBpXG4gIHJldHVybiAtMVxufVxuXG5mdW5jdGlvbiBFbGVtZW50Q2xhc3Mob3B0cykge1xuICBpZiAoISh0aGlzIGluc3RhbmNlb2YgRWxlbWVudENsYXNzKSkgcmV0dXJuIG5ldyBFbGVtZW50Q2xhc3Mob3B0cylcbiAgdmFyIHNlbGYgPSB0aGlzXG4gIGlmICghb3B0cykgb3B0cyA9IHt9XG5cbiAgLy8gc2ltaWxhciBkb2luZyBpbnN0YW5jZW9mIEhUTUxFbGVtZW50IGJ1dCB3b3JrcyBpbiBJRThcbiAgaWYgKG9wdHMubm9kZVR5cGUpIG9wdHMgPSB7ZWw6IG9wdHN9XG5cbiAgdGhpcy5vcHRzID0gb3B0c1xuICB0aGlzLmVsID0gb3B0cy5lbCB8fCBkb2N1bWVudC5ib2R5XG4gIGlmICh0eXBlb2YgdGhpcy5lbCAhPT0gJ29iamVjdCcpIHRoaXMuZWwgPSBkb2N1bWVudC5xdWVyeVNlbGVjdG9yKHRoaXMuZWwpXG59XG5cbkVsZW1lbnRDbGFzcy5wcm90b3R5cGUuYWRkID0gZnVuY3Rpb24oY2xhc3NOYW1lKSB7XG4gIHZhciBlbCA9IHRoaXMuZWxcbiAgaWYgKCFlbCkgcmV0dXJuXG4gIGlmIChlbC5jbGFzc05hbWUgPT09IFwiXCIpIHJldHVybiBlbC5jbGFzc05hbWUgPSBjbGFzc05hbWVcbiAgdmFyIGNsYXNzZXMgPSBlbC5jbGFzc05hbWUuc3BsaXQoJyAnKVxuICBpZiAoaW5kZXhPZihjbGFzc2VzLCBjbGFzc05hbWUpID4gLTEpIHJldHVybiBjbGFzc2VzXG4gIGNsYXNzZXMucHVzaChjbGFzc05hbWUpXG4gIGVsLmNsYXNzTmFtZSA9IGNsYXNzZXMuam9pbignICcpXG4gIHJldHVybiBjbGFzc2VzXG59XG5cbkVsZW1lbnRDbGFzcy5wcm90b3R5cGUucmVtb3ZlID0gZnVuY3Rpb24oY2xhc3NOYW1lKSB7XG4gIHZhciBlbCA9IHRoaXMuZWxcbiAgaWYgKCFlbCkgcmV0dXJuXG4gIGlmIChlbC5jbGFzc05hbWUgPT09IFwiXCIpIHJldHVyblxuICB2YXIgY2xhc3NlcyA9IGVsLmNsYXNzTmFtZS5zcGxpdCgnICcpXG4gIHZhciBpZHggPSBpbmRleE9mKGNsYXNzZXMsIGNsYXNzTmFtZSlcbiAgaWYgKGlkeCA+IC0xKSBjbGFzc2VzLnNwbGljZShpZHgsIDEpXG4gIGVsLmNsYXNzTmFtZSA9IGNsYXNzZXMuam9pbignICcpXG4gIHJldHVybiBjbGFzc2VzXG59XG5cbkVsZW1lbnRDbGFzcy5wcm90b3R5cGUuaGFzID0gZnVuY3Rpb24oY2xhc3NOYW1lKSB7XG4gIHZhciBlbCA9IHRoaXMuZWxcbiAgaWYgKCFlbCkgcmV0dXJuXG4gIHZhciBjbGFzc2VzID0gZWwuY2xhc3NOYW1lLnNwbGl0KCcgJylcbiAgcmV0dXJuIGluZGV4T2YoY2xhc3NlcywgY2xhc3NOYW1lKSA+IC0xXG59XG5cbkVsZW1lbnRDbGFzcy5wcm90b3R5cGUudG9nZ2xlID0gZnVuY3Rpb24oY2xhc3NOYW1lKSB7XG4gIHZhciBlbCA9IHRoaXMuZWxcbiAgaWYgKCFlbCkgcmV0dXJuXG4gIGlmICh0aGlzLmhhcyhjbGFzc05hbWUpKSB0aGlzLnJlbW92ZShjbGFzc05hbWUpXG4gIGVsc2UgdGhpcy5hZGQoY2xhc3NOYW1lKVxufVxuIiwidmFyIEFuaW1hdGlvbkZyYW1lID0gcmVxdWlyZSgnYW5pbWF0aW9uLWZyYW1lJyk7XG5BbmltYXRpb25GcmFtZS5zaGltKCk7XG52YXIgZWxlbWVudENsYXNzID0gcmVxdWlyZSgnZWxlbWVudC1jbGFzcycpO1xuXG5tb2R1bGUuZXhwb3J0cyA9IHtcblxuXHRwcmVwYXJlRWxlbWVudDogZnVuY3Rpb24oZWxlbWVudCkge1xuXG5cdFx0Ly8gZ3JhYiB0aGUgdGV4dCAoYXMgbG9uZyBhcyBpdCBkb2Vzbid0IGhhdmUgKCYpLCAoPCksIG9yICg+KSAtIHNlZSBodHRwczovL2RldmVsb3Blci5tb3ppbGxhLm9yZy9lbi1VUy9kb2NzL1dlYi9BUEkvRWxlbWVudC5pbm5lckhUTUwpXG5cdFx0dmFyIHRleHQgPSBlbGVtZW50LmlubmVySFRNTDtcblxuXHRcdC8vIHNwbGl0IHRleHQgaW50byBjaGFyYWN0ZXJzXG5cdFx0dmFyIGNoYXJhY3RlcnMgPSB0ZXh0LnNwbGl0KCcnKTtcblxuXHRcdHZhciBzcGFucyA9ICcnO1xuXG5cdFx0Zm9yICh2YXIgaSA9IDA7IGkgPCBjaGFyYWN0ZXJzLmxlbmd0aDsgaSsrKSB7XG5cblx0XHRcdHNwYW5zICs9ICc8c3BhbicgKyAoY2hhcmFjdGVyc1tpXSA9PT0gJyAnID8gJyBjbGFzcz1cIndoaXRlc3BhY2VcIicgOiAnJykgKyAnPicgKyBjaGFyYWN0ZXJzW2ldICsgJzwvc3Bhbj4nO1xuXHRcdH1cblxuXHRcdGVsZW1lbnQuaW5uZXJIVE1MID0gc3BhbnM7XG5cdH0sXG5cblx0cHJlcGFyZTogZnVuY3Rpb24oc2VsZWN0b3IpIHtcblxuXHRcdHZhciBlbGVtZW50cyA9IGRvY3VtZW50LnF1ZXJ5U2VsZWN0b3JBbGwoc2VsZWN0b3IpO1xuXG5cdFx0Zm9yICh2YXIgaSA9IDA7IGkgPCBlbGVtZW50cy5sZW5ndGg7IGkrKykge1xuXHRcdFx0dGhpcy5wcmVwYXJlRWxlbWVudChlbGVtZW50c1tpXSk7XG5cdFx0fVxuXHR9LFxuXG5cdHRvZ2dsZVR5cGU6IGZ1bmN0aW9uKG1vZGUsIHNlbGVjdG9yLCBvcHRpb25zKSB7XG5cblx0XHRyZXR1cm4gbmV3IFByb21pc2UoZnVuY3Rpb24ocmVzb2x2ZSwgcmVqZWN0KSB7XG5cblx0XHRcdHZhciBvcHRzID0ge307XG5cdFx0XHRvcHRpb25zID0gb3B0aW9ucyB8fCB7fTtcblxuXHRcdFx0Ly8gd2FpdCAxMCBtcyBiZWZvcmUgdHlwaW5nIC0gbm90IGV4YWN0bHkgc3VyZSB3aHkgaSBoYXZlIHRvIGRvIHRoaXMgOihcblx0XHRcdHNldFRpbWVvdXQoZnVuY3Rpb24oKSB7XG5cblx0XHRcdFx0dmFyIGNoaWxkcmVuID0gZG9jdW1lbnQucXVlcnlTZWxlY3RvckFsbChzZWxlY3RvciArICcgc3BhbicpO1xuXG5cdFx0XHRcdGlmIChtb2RlID09PSBcInVudHlwZVwiKSB7XG5cblx0XHRcdFx0XHQvLyByZXZlcnNlIGNoaWxkcmVuXG5cdFx0XHRcdFx0Y2hpbGRyZW4gPSBBcnJheS5wcm90b3R5cGUuc2xpY2UuY2FsbChjaGlsZHJlbikucmV2ZXJzZSgpO1xuXG5cdFx0XHRcdFx0Ly8gZ2l2ZSAnc2hvdycgY2xhc3MgdG8gYWxsIGNoaWxkcmVuIGltbWVkaWF0ZWx5XG5cdFx0XHRcdFx0Zm9yICh2YXIgaiA9IDA7IGogPCBjaGlsZHJlbi5sZW5ndGg7IGorKykge1xuXHRcdFx0XHRcdFx0ZWxlbWVudENsYXNzKGNoaWxkcmVuW2pdKS5hZGQoJ3Nob3cnKTtcblx0XHRcdFx0XHR9XG5cblx0XHRcdFx0fVxuXG5cdFx0XHRcdC8vIHVzZSBkZWxheSBpZiBwcmVzZW50LFxuXHRcdFx0XHQvLyBvdGhlcndpc2UgdXNlIGR1cmF0aW9uIGlmIHByZXNlbnQsXG5cdFx0XHRcdC8vIG90aGVyd2lzZSBwcm92aWRlIGRlZmF1bHQgZGVsYXlcblx0XHRcdFx0b3B0cy5kZWxheSA9IG9wdGlvbnMuZGVsYXkgPyBvcHRpb25zLmRlbGF5IDpcblx0XHRcdFx0XHRvcHRpb25zLmR1cmF0aW9uID8gb3B0aW9ucy5kdXJhdGlvbiAvIGNoaWxkcmVuLmxlbmd0aCA6XG5cdFx0XHRcdFx0NTA7XG5cblx0XHRcdFx0dmFyIGkgPSAwO1xuXHRcdFx0XHR2YXIgckFGO1xuXG5cdFx0XHRcdGZ1bmN0aW9uIHR5cGVDaGFyYWN0ZXIoKSB7XG5cblx0XHRcdFx0XHRzZXRUaW1lb3V0KGZ1bmN0aW9uKCkge1xuXG5cdFx0XHRcdFx0XHQvLyBUT0RPOiBvcHRpb25zLmR1cmF0aW9uIGRvZXNuJ3QgcmVhbGx5IHdvcmtcblx0XHRcdFx0XHRcdC8vIGF0bSBpdCdzIGxpbWl0ZWQgYnkgZGV2aWNlIHJlZnJlc2ggcmF0ZSwgZS5nLiA2MFxuXHRcdFx0XHRcdFx0Ly8gcmV3cml0ZSB0aGlzIHRvIGxvb2sgYXQgdGltZSBkZWx0YSBzaW5jZSBsYXN0IGNhbGxcblx0XHRcdFx0XHRcdHJBRiA9IHJlcXVlc3RBbmltYXRpb25GcmFtZSh0eXBlQ2hhcmFjdGVyKTtcblxuXHRcdFx0XHRcdFx0aWYgKGkgPCBjaGlsZHJlbi5sZW5ndGgpIHtcblxuXHRcdFx0XHRcdFx0XHRpZiAobW9kZSA9PT0gXCJ0eXBlXCIpIHtcblx0XHRcdFx0XHRcdFx0XHRlbGVtZW50Q2xhc3MoY2hpbGRyZW5baV0pLmFkZCgnc2hvdycpO1xuXHRcdFx0XHRcdFx0XHR9IGVsc2Uge1xuXHRcdFx0XHRcdFx0XHRcdGVsZW1lbnRDbGFzcyhjaGlsZHJlbltpXSkucmVtb3ZlKCdzaG93Jyk7XG5cdFx0XHRcdFx0XHRcdH1cblxuXHRcdFx0XHRcdFx0fSBlbHNlIHtcblxuXHRcdFx0XHRcdFx0XHRjYW5jZWxBbmltYXRpb25GcmFtZShyQUYpO1xuXHRcdFx0XHRcdFx0XHRyZXNvbHZlKCk7XG5cdFx0XHRcdFx0XHR9XG5cblx0XHRcdFx0XHRcdGkrKztcblxuXHRcdFx0XHRcdH0sIG9wdHMuZGVsYXkpO1xuXHRcdFx0XHR9XG5cblx0XHRcdFx0dHlwZUNoYXJhY3RlcigpO1xuXG5cdFx0XHR9LCAxMCk7XG5cblx0XHR9KTtcblxuXHR9LFxuXG5cdHR5cGU6IGZ1bmN0aW9uKHNlbGVjdG9yLCBvcHRpb25zKSB7XG5cblx0XHRyZXR1cm4gdGhpcy50b2dnbGVUeXBlKCd0eXBlJywgc2VsZWN0b3IsIG9wdGlvbnMpO1xuXHR9LFxuXG5cdHVudHlwZTogZnVuY3Rpb24oc2VsZWN0b3IsIG9wdGlvbnMpIHtcblxuXHRcdHJldHVybiB0aGlzLnRvZ2dsZVR5cGUoJ3VudHlwZScsIHNlbGVjdG9yLCBvcHRpb25zKTtcblx0fVxufTtcbiJdfQ==
