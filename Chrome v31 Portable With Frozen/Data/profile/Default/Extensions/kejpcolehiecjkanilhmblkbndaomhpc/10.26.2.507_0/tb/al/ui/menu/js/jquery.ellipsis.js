// http://devongovett.wordpress.com/2009/04/06/text-overflow-ellipsis-for-firefox-via-jquery/
// With modifications to fit the menus and improve performance, by Ronny

(function ($) {
    $.fn.ellipsis = function (enableUpdating) {
        var s = document.documentElement.style;
        if (!('textOverflow' in s || 'OTextOverflow' in s)) {
            return this.each(function () {
                var el = $(this),
					container = el.parents('li:eq(0)');

                if (el.css("overflow") == "hidden") {
                    var originalText = el.html();
                    var w = el.width();

                    var t = $(this.cloneNode(true)).hide().css({
                        'position': 'absolute',
                        'width': 'auto',
                        'overflow': 'visible',
                        'max-width': 'inherit'
                    });
                    el.after(t);
                    var isRtl = $(".menuWrap").hasClass("rtl");
                    var offset = isRtl ? parseInt(el.parent().css("padding-right")) : el.offset().left;
                    var text = originalText,
						containerWidth = container.width() - (isRtl ? 30 : 15);  //To get 15px padding from the right
                    while (text.length > 0 && t.width() + offset > containerWidth) {
                        text = text.substr(0, text.length - 1);
                        t.html(text + "&hellip;");
                    }
                    el.html(t.html())
					  .attr('data-isEllipsised', 'true');

                    if (!el.attr('title')) el.attr('title', originalText);

                    t.remove();

                    if (enableUpdating == true) {
                        var oldW = el.width();
                        setInterval(function () {
                            if (el.width() != oldW) {
                                oldW = el.width();
                                el.html(originalText);
                                el.ellipsis();
                            }
                        }, 200);
                    }
                }
            });
        } else return this;
    };
})(jQuery);