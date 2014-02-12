if (typeof (String.prototype.trim) === 'undefined') {
    String.prototype.trim = function () {
        return this.replace(/^\s+/, "").replace(/\s+$/, "");
    };
}
var Highlighter_Embeded = new function () {
    var getSettingsData = conduit.app.getSettingsData,
		setEmbedded = conduit.app.embedded.setEmbedded,
		sendRequest = conduit.messaging.sendRequest,
		openPopup = conduit.app.popup.open;

    var icon = null,
		arrow = null,
		iconWrapper = null,
		$container = null,
		openPopupLink = null;

    var settings = null,
		searchTerm = null;

    var onSettingsGet = function (settings, callback) {
        callback.apply(null, [settings]);
    };

    var settingsCallback = function (settingsResult) {
        settings = settingsResult;

        icon = document.getElementById("icon");
        arrow = document.getElementById("arrow");
        iconWrapper = $("#icon_wrapper");
        $container = $('.higlighter_container'),
			openPopupLink = $(".arrow");

        //fallback for icon image
        icon.src = settingsResult.data.unhighlightIcon;

        conduit.platform.search.getTerm(function (getTerm) {
            searchTerm = getTerm;

            if (searchTerm !== "" && searchTerm.length >= 3) {
                icon.src = settingsResult.data.highlightIcon;
                openPopupLink.attr('class', openPopupLink.attr('class').replace("disable", ""));

            } else if (searchTerm === "0" || searchTerm.length < 3) {

                icon.src = settingsResult.data.unhighlightIcon;
                if (!openPopupLink.hasClass("disable")) {
                    openPopupLink.addClass("disable");
                }
            }
        });

        var iconCompleteCallback = function () {
            var arrowWidth = openPopupLink.outerWidth(true);
            var iconContainerWidth = this.width,
					iconContainerHeight = 18,
					totalWidth = iconContainerWidth + (arrowWidth > 0 && !isNaN(arrowWidth) ? arrowWidth : 10);


            this.style.marginLeft = 5 + 'px';
            this.style.marginTop = 5 + 'px';

            iconWrapper.width(totalWidth - 12);
            iconWrapper.height(iconContainerHeight + 7);



            setEmbedded({ width: totalWidth - 10, height: 34 });
        }

        if (icon.complete) {
            $(icon).show();
            iconCompleteCallback.apply(icon, []);
        } else {//ie suppurt
            $(icon).show();
            icon.onload = iconCompleteCallback;
        }

        // alert('Adding search changed listener');
        conduit.platform.search.onTextChanged.addListener(function (textChanged) {
            //alert('Got search changed');

            if (textChanged.length >= 3) {
                searchTerm = textChanged;
                icon.src = settingsResult.data.highlightIcon;
                openPopupLink.attr('class', openPopupLink.attr('class').replace("disable", ""));
                updateSearchTerm(searchTerm, $.noop)
            } else if (textChanged.length < 3) {
                searchTerm = null;
                icon.src = settingsResult.data.unhighlightIcon;
                if (!openPopupLink.hasClass("disable")) {
                    openPopupLink.addClass("disable");
                }
            }


        });

        initEvents();
    };
    var settingsInterval = null;
    var isDone = false;

    var init = function () {
        //settingsInterval = setInterval(function () {
        getSettingsData(function (settings) {
            /*if (typeof (settings) !== 'undefined') {
            clearInterval(settingsInterval);
            delete settingsInterval;
            if (!isDone) {*/
            onSettingsGet(settings, settingsCallback);
            //isDone = true;
            // }
            //}
        });
        //}, 200);
    };

    var updateSearchTerm = function (searchTerm, callback) {
        sendRequest('backgroundPage', 'Highlighter.Invoker', JSON.stringify({ method: 'updateSearchTerm', params: [searchTerm.toLowerCase()] }), callback);
    };

    var initEvents = function () {
        iconWrapper.mouseover(function () {

            $(this).addClass('iconWrapper_hover');
        });

        iconWrapper.mouseout(function () {
            $(this).removeClass('iconWrapper_hover');
        });

        iconWrapper.mousedown(function () {

            $(this).addClass('iconWrapper_active');
        });

        iconWrapper.mouseup(function (e) {
            $(this).removeClass('iconWrapper_active');

            if (e.target.className && e.target.className === "arrow") return false;

            if (typeof (searchTerm) === 'string' && searchTerm.length > 0) {
                var executeCallback = function () {

                    var requestMessage = {
                        params: [searchTerm],
                        method: 'execute'
                    };
                    sendRequest('backgroundPage', 'Highlighter.Invoker', JSON.stringify(requestMessage), function (response) { });
                };

                updateSearchTerm(searchTerm, executeCallback);
            }
        });

        openPopupLink.click(function (openPopupClickEvent) {
            openPopupClickEvent.preventDefault();
            if (searchTerm && searchTerm.trim() === '' || !searchTerm) return false;

            var offsetX = $(".higlighter_container").offset().left - 48,
				offsetY = -36;

            if (navigator.userAgent.toLowerCase().indexOf("msie")) {
                offsetY += 34;
            }

            conduit.app.popup.open('popup.html', {
                dimensions: {
                    width: 100,
                    height: 1
                },
                openPosition: "offset(" + offsetX + "," + offsetY + ")",
                showFrame: false,
                saveLocation: false,
                isFocused: false,
                closeOnExternalClick: true
            }, function (response) { });

            conduit.logging.usage.log('HIGHLIGHTER_OPEN_MENU');
        });
    };

    $(document).ready(function (readyEvent) {
        init();

        conduit.advanced.localization.getLocale(function (data) {
            if (data && data.alignMode && data.alignMode == "RTL") {
                $(".body").addClass("rtl");
            }
        });
    });
};