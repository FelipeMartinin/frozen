(function ($) {
    var isInited = false;
    var options = {
        up: '#up',
        down: '#down',
        startEventType: 'mousedown',
        stopEventType: 'mouseup',
        scrollDelay: 500,
        maxHeight: 500
    };

    function enableArrow(arr) {
        arr.removeClass('disabled hidden')
			.addClass('enabled');
    }

    function disableArrow(arr) {
        arr.removeClass('enabled hidden')
			.addClass('disabled');
    }

    function hideArrow(arr) {
        arr.removeClass('enabled')
			.addClass('hidden disabled');
    }

    function isNotAtTop() {
        return $(s.$self.children()[0]).position().top < s.$self.position().top;
    }

    function isNotAtBottom() {
        return $(s.$self.children()[0]).position().top + s.$self.children().height() >= s.$self.height();
    }

    // use a private shortcut for a public namespace
    var s = $.scrollers = { defaults: options };
    var methods = {
        init: function (settings) {
            isInited = true;
            $.extend(options, settings);

            s.options = options;
            s.$self = $(this);
            s.$up = $(options.up);
            s.$down = $(options.down);
            if (s.$self.height() <= s.options.maxHeight) {
                hideArrow(s.$down);
                hideArrow(s.$up);
            }
            /// hide upper arrow on menu open roee ovadia 21.11.11
            else {
                hideArrow(s.$up);
            }

            s.keepScrolling;
            var $upParent = s.$up.parent(),
				$downParent = s.$down.parent();
            $upParent.delegate(options.up + ":not('.disabled')", options.startEventType, methods.startScrollUp);
            $downParent.delegate(options.down + ":not('.disabled')", options.startEventType, methods.startScrollDown);

            $upParent.delegate(options.up + ":not('.disabled')", options.stopEventType, methods.stopScroll);
            $downParent.delegate(options.down + ":not('.disabled')", options.stopEventType, methods.stopScroll);
        },
        update: function (settings, source) {
            if (settings) $.extend(s.options, settings);
            if (source === "menu") {
                s.$self.scrollTo('0%', 0, { axis: 'y' }); // reset axis position 
                if (s.$self.height() <= s.options.maxHeight) {
                    hideArrow(s.$down);
                    hideArrow(s.$up);
                }
                else {
                    hideArrow(s.$up);
                    enableArrow(s.$down);
                }
            }
            else {
                if (s.$self.height() < s.options.maxHeight) {
                    !isNotAtBottom() && hideArrow(s.$down);
                    !isNotAtTop() && hideArrow(s.$up);
                }
                else {
                    isNotAtBottom() && enableArrow(s.$down);
                    isNotAtTop() && enableArrow(s.$up);
                }
            }
        },
        startScrollUp: function (ev) {
            ev && ev.preventDefault();
            function scroll() {
                if (isNotAtTop()) {
                    s.$self.scrollTo('-=5px', s.options.scrollDelay, { axis: 'y' });
                    if (s.$down.hasClass('disabled')) {
                        enableArrow(s.$down);
                    }
                    s.keepScrolling = setTimeout(scroll, s.options.scrollDelay);
                }
                else {
                    disableArrow(s.$up);
                    clearTimeout(s.keepScrolling);
                }
            }
            scroll();
        },
        startScrollDown: function (ev) {
            ev && ev.preventDefault();
            function scroll() {
                if (isNotAtBottom()) {
                    s.$self.scrollTo('+=5px', s.options.scrollDelay, { axis: 'y' });
                    if (s.$up.hasClass('disabled')) {
                        enableArrow(s.$up);
                    }
                    s.keepScrolling = setTimeout(scroll, s.options.scrollDelay);
                }
                else {
                    s.$self.scrollTo('100%', s.options.scrollDelay, { axis: 'y' });
                    disableArrow(s.$down);
                    clearTimeout(s.keepScrolling);
                }
            }
            scroll();
        },
        scrollDownToElement: function (element) {
            s.$self.scrollTo(element, 200, { axis: 'y', offset: -s.options.maxHeight / 2, onAfter: methods.update });
        },
        stopScroll: function (ev) {
            ev && ev.preventDefault();
            clearTimeout(s.keepScrolling);
        },
        isInited: function () {
            return isInited;
        }
    };

    $.fn.scrollers = function (method) {
        if (methods[method]) {
            return methods[method].apply(this, Array.prototype.slice.call(arguments, 1));
        } else if (typeof method === 'object' || !method) {
            return methods.init.apply(this, arguments);
        } else {
            $.error('Method ' + method + ' does not exist on jQuery.tooltip');
        }

        return this;
    };
})(jQuery);