window.menu = (function ($) {
    var maxHeight,
        topBorderLeft,
        topBorderRight,
        popupWidth,
        $menuWrap,
        mouseWheelTimeoutId,
        currentWheelDirection = 0;
    var preset = {
        'width': {
            'min': 75
                , 'max': 250
        }
    };
    var isIE = navigator.userAgent.indexOf("MSIE") != -1,
        SHADOW_WIDTH = isIE ? 2 : 10,
        SHADOW_HEIGHT = isIE ? 1 : 5;


    function isContextMenuAndSendUsage(itemappid) {
        var isContextMenu = false;
        if (conduit.currentApp.appId == 'toolbarContextMenu' || conduit.currentApp.appId == 'gottenAppsContextMenu' || conduit.currentApp.appId == 'otherAppsContextMenu') {
            isContextMenu = true;
            conduit.logging.usage.log("PUBLISHER_CONTEXT_MENU_ITEM_CLICK", { usageType: 'sendToolbarUsage', elementId: itemappid });
        }
        return isContextMenu;
    }

    function sendUsage(action, itemAppId) {
        conduit.logging.usage.log(action, { elementId: itemAppId });
    }

    function closeMenu() {
        closedByUserAction = true;
        conduit.app.menu.close();
    }

    function initMousewheel() {
        var mousewheelevt = (/Firefox/i.test(navigator.userAgent)) ? "DOMMouseScroll" : "mousewheel" //FF doesn't recognize mousewheel as of FF3.x
        if (document.attachEvent) //if IE (and Opera depending on user setting)
            document.attachEvent("on" + mousewheelevt, handleMousewheel)
        else if (document.addEventListener) //WC3 browsers
            document.addEventListener(mousewheelevt, handleMousewheel, false)

        function handleMousewheel(event) {
            var delta = 0;
            if (!event) /* For IE. */
                event = window.event;
            if (event.wheelDelta) { /* IE/Opera. */
                delta = event.wheelDelta / 120;
            } else if (event.detail) { /** Mozilla case. */
                delta = -event.detail / 3;
            }

            if (delta) {
                var dir = Math.round(delta / Math.abs(delta));

                if (currentWheelDirection !== dir) {
                    if (currentWheelDirection) {
                        clearTimeout(mouseWheelTimeoutId);
                        $menuWrap.scrollers("stopScroll");
                    }
                    currentWheelDirection = dir;
                    $menuWrap.scrollers(dir < 0 ? "startScrollDown" : "startScrollUp");
                    mouseWheelTimeoutId = setTimeout(function () { currentWheelDirection = 0; $menuWrap.scrollers("stopScroll"); }, 1500);
                }
            }
            else
                currentWheelDirection = 0;

            if (event.preventDefault)

                event.preventDefault();
            event.returnValue = false;
        }
    }

    return {
        init: function () {
            log.info({ "type": 'menu.js', "method": 'init', "text": '', "data": {} });
            var popup = conduit.currentApp,
                $popup = $('.popup'),
                $items = $('li');
            log.info({ "type": 'menu.js', "method": 'init', "text": 'get info', "data": {} });
            conduit.app.menu.getPosition(function (data) {
                log.info({ "type": 'menu.js', "method": 'init/get info callback', "text": '', "data": { 'data': data} });
                var currentPposition = data;
                $menuWrap = $('.menuWrap');
                if ($menuWrap.width() > preset.width.max && menuButtonWidth < preset.width.max) {
                    $popup.width(preset.width.max + 'px');
                    $popup = $('.popup');
                } else if ($menuWrap.width() < preset.width.min || $menuWrap.width() < menuButtonWidth) {
                    $popup.width(((preset.width.min > menuButtonWidth) ? preset.width.min : menuButtonWidth) + 'px');
                    $popup = $('.popup');
                } else {
                    $popup.width($menuWrap.width() + 'px');
                }
                log.info({ "type": 'menu.js', "method": 'init', "text": 'getScreenHeight', "data": {} });
                conduit.platform.getScreenHeight(function (height) {
                    log.info({ "type": 'menu.js', "method": 'init /get info callback / getScreenHeight callback', "text": 'getScreenHeight callback', "data": { 'height': height} });

                    maxHeight = height - currentPposition.top - 15 /* keep nice margins */;
                    var options = {
                        up: '.up',
                        down: '.down',
                        startEventType: 'mouseenter',
                        stopEventType: 'mouseleave',
                        scrollDelay: 12,
                        maxHeight: maxHeight
                    }
                    if (!$menuWrap.scrollers("isInited")) {
                        $menuWrap.scrollers(options);
                    }
                    else {
                        $menuWrap.scrollers("update", options, "menu");
                    }

                    var largerThanMax = ($popup.height() > maxHeight);
                    popupWidth = $popup.width();

                    if (largerThanMax) $('.menuWrap').height(maxHeight);
                    var dim = { width: popupWidth + SHADOW_WIDTH, height: (largerThanMax) ? maxHeight + SHADOW_HEIGHT : $popup.height() + SHADOW_HEIGHT };
                    log.info({ "type": 'menu.js', "method": 'init', "text": 'conduit.app.menu.resize', "data": { 'dimmension': dim} });
                    conduit.app.menu.resize(dim, function (response) {
                        log.info({ "type": 'menu.js', "method": 'init', "text": 'conduit.app.menu.resize callback', "data": { 'response': response} });
                        if ((typeof (response) === 'object') && response.offset) {
                            if (response.offset > 0) {
                                var leftBorderWidth = topBorderLeft.clientWidth + response.offset;
                                topBorderLeft.style.width = leftBorderWidth + "px";
                                var newWidth = popupWidth - leftBorderWidth - menuButtonWidth;
                                newWidth = newWidth > 0 ? newWidth : 0;
                                topBorderRight.style.width = newWidth + "px";
                            }
                            else {
                                var rightBorderWidth = topBorderRight.clientWidth + response.offset;
                                topBorderRight.style.width = rightBorderWidth + "px";
                                topBorderLeft.style.width = (popupWidth - rightBorderWidth - menuButtonWidth) + "px";
                            }
                        } else {
                            topBorderLeft.style.width = '0px';
                        }
                    });

                    topBorderLeft = document.getElementById("topBorderLeft");
                    topBorderRight = document.getElementById("topBorderRight");
                    topBorderRight.style.width = (popupWidth - menuButtonWidth) + "px";
                    $menuWrap.find('.text-wrap:visible:not("[data-isEllipsised]")').ellipsis();
                });
            });

            if (sameApp) {
                return;
            }

            $items.delegate('a[href]', 'click', menu.handleItemClick);
            $items.delegate('a[data-command]', 'click', menu.handleCommandClick);
            $items.delegate('a[data-popup]', 'click', menu.handlePopupClick);
            $items.delegate('a[appName]', 'click', menu.handleAppClick);
            $('ul').delegate('li.parent', 'click', menu.toggleSubMenu);

            initMousewheel();


            conduit.advanced.localization.getLocale(function (res) {
                var toolbar_direction = res.alignMode;
                var text_direction = res.languageAlignMode || toolbar_direction;
                if (!!toolbar_direction && toolbar_direction.toUpperCase() == 'RTL') {                    
                    $('body').removeClass('rtl').addClass('rtl');
                }
                if (!!text_direction && text_direction.toUpperCase() == 'RTL') $('.menuWrap').removeClass('rtl').addClass('rtl');
            });

        },
        toggleSubMenu: function (ev) {
            ev.stopPropagation();

            if ($(this).hasClass('opened')) {
                menu.closeSubMenu.call(this);
            } else {
                menu.openSubMenu.call(this);
            }
        },
        openSubMenu: function () {

            function getSubMenuData(item) {
                var index = item.index();

                if (item.parent().hasClass('root')) {
                    return menuData.data.menu.data.items[index];
                }
                data = getSubMenuData(item.parent());
                if (data && data.items) {
                    return data.items[index];
                }
                else {
                    return data.data;
                }
            }

            var $this = $(this);
            if ($this.children().length == 1) { //no items
                var direction = $('.menuWrap').hasClass('rtl') ? "right" : "left";
                $("#menuTemplate").tmpl(menu.getFirstLevel(getSubMenuData($this)).data, { nestingDepth: parseInt($this.attr('nestingDepth')) + 1, direction: direction }).appendTo($this);
            }

            var $subMenu = $this.children('.menu');

            // required height for the submenu
            var submenuHeight = $subMenu.height();
            if ($('.menuWrap').height() + submenuHeight + SHADOW_HEIGHT < maxHeight) {
                conduit.app.menu.resize({
                    width: $('.popup').width() + SHADOW_WIDTH,                  // horizontal shadow of 5px on both sides
                    height: $('.popup').height() + submenuHeight + SHADOW_HEIGHT // bottom shadow
                }, actuallyOpen);
            } else {
                $('.menuWrap').height(maxHeight);
                conduit.app.menu.resize({
                    width: $('.popup').width() + SHADOW_WIDTH,
                    height: maxHeight + SHADOW_HEIGHT // two scrollers and one vertical shadow (i removed 40 )
                }, actuallyOpen);
            }

            function actuallyOpen() {
                $this
                    .removeClass('closed').addClass('opened')
                    .children('a').addClass('active-parent');
                $subMenu.slideDown(0, function () {
                    $('.menuWrap').scrollers('scrollDownToElement', $this);
                    $('.text-wrap:visible:not("[data-isEllipsised]")', $subMenu).ellipsis();
                });
            }
        },
        closeSubMenu: function () {
            var $this = $(this);
            if (this == window.menu) {
                $this = $menuWrap.find('.parent.opened');
            }


            var menusToClose = $this.find('.parent.opened');

            $this.find('a').removeClass('active-parent');

            /* Close open sub menus on close */
            $.each(menusToClose, function (i, menu) {
                $(menu).removeClass('opened').addClass('closed');
                $(menu).children('.menu').slideUp(0);
                $(menu).children('.menu').css('display', 'none');

            });
            $this
                .removeClass('opened').addClass('closed')
                .children('.menu').slideUp(0, function () {
                    if ($('.menuWrap').children().height() < maxHeight) {
                        $('.menuWrap').height('100%');
                        $('.menuWrap').scrollers('update');
                    }
                    conduit.app.menu.resize({ width: $('.popup').width() + SHADOW_WIDTH, height: $('.popup').height() + SHADOW_HEIGHT });

                });
        },
        handleItemClick: function (ev) {
            ev.preventDefault();
            ev.stopPropagation();
            var $this = $(this),
            url = $this.attr('href'),
			itemappid = $this.attr('data-itemappid');
            if (/EBOpenPopHtml/.test(url)) { // to support old menus popups. format is : javascript:EBOpenPopHtml('some_url',width,height)
                var popupData = url.match(/\(+(.*?)\)/)[1].split(',');
                url = popupData[0].replace(new RegExp('\'|\"', 'g'), '');
                var width = popupData[1] || 400,
                height = popupData[2] || 400;
                var popupOptions = {
                    frameTitle: $this.find('.text-wrap').text(),
                    dimensions: { width: parseInt(width, 10), height: parseInt(height, 10) },
                    allowScrolls: true,
                    resizable: true,
                    saveSize: true,
                    itemappid: itemappid
                }
                conduit.app.popup.open(url, popupOptions);
                closeMenu();
            }
            else {
                if ($this.attr('target') === 'NEW') {
                    conduit.tabs.create({ url: url });
                } else {
                    conduit.tabs.update(null, { url: url });
                }

                var isContextMenu = isContextMenuAndSendUsage(itemappid);
                if (!isContextMenu) {
                    sendUsage("BUTTON_MENU_ITEM_CLICK", itemappid)
                }
                closeMenu();
            }
        },
        handleCommandClick: function (ev) {
            ev.preventDefault();
            ev.stopPropagation();
            var command = $(this).attr('data-command'),
			itemappid = $(this).attr('data-itemappid');
            var itemContext = $(this).attr('data-itemContext');

            if (command && command !== "WEBAPP_COMMAND") {
                if (command == "TOGGLE_COMMAND") {
                    command = $(this).attr('state-command');
                    id = $(this).attr('id');
                    conduit.storage.app.keys.get('isToggled_item' + id, function (value) {
                        if (value === 'true') {
                            conduit.storage.app.keys.remove('isToggled_item' + id);
                        }
                        else {
                            conduit.storage.app.keys.set('isToggled_item' + id, "true");
                        }
                    }, function (e) { conduit.storage.app.keys.set('isToggled_item' + id, "true"); });
                    conduit.messaging.postTopicMessage("menu_shrink_toggled");
                } else if (command == 'DELETE_SEARCH_HISTORY') {
                    //send to search
                    conduit.storage.global.keys.get('search.searchAppId', function (appId) {
                        conduit.messaging.sendRequest('app:' + appId, 'clearHistory');
                    });
                }
                conduit.advanced.messaging.sendRequestToModel(command);
            }
            else { // User-defined command, from API:
                var itemData = { 'data': { 'item': JSON.parse(itemContext)} };
                var positionData = ev.currentTarget.id.split("_");

                conduit.advanced.messaging.postTopicMessage("menuCommand_" + conduit.currentApp.appId + "_" + conduit.currentApp.menuId,
                JSON.stringify({
                    data: itemData.data.item.data.data.command.data,
                    item: {
                        text: itemData.data.item.data.caption,
                        index: parseInt(positionData[1], 10),
                        depth: parseInt(positionData[0], 10),
                        icon: itemData.data.item.data.iconUrl
                    }
                }));
            }
            var isContextMenu = isContextMenuAndSendUsage(itemappid);
            if (!isContextMenu) {
                sendUsage("BUTTON_MENU_ITEM_CLICK", itemappid)
            }
            closeMenu();
        },
        handlePopupClick: function (ev) {
            try {
                conduit.logging.logDebug("open popup start", { className: "menu", functionName: "handlePopupClick" });
                ev.preventDefault();
                ev.stopPropagation();
                var data = JSON.parse($(this).attr('data-popup'));
                var url = data.url;
                var offsetY = data.offsetY;
                var offsetX = data.offsetX;
                var isAbsolute = false;
                var itemappid = $(this).attr('data-itemappid');

                var isContextMenu = isContextMenuAndSendUsage(itemappid);
                if (isContextMenu) {
                    offsetX = parseInt(offsetX, 10) + ev.screenX;
                    offsetY = parseInt(offsetY, 10) + ev.screenY;
                    isAbsolute = true;
                }

                var popupOptions = {
                    itemappid: itemappid,
                    frameTitle: $(this).find('.text-wrap').text(),
                    dimensions: { width: parseInt(data.width, 10), height: parseInt(data.height, 10) },
                    openPosition: 'offset(' + offsetX + ',' + offsetY + ')',
                    isAbsolute: isAbsolute,
                    allowScrolls: data.scroll,
                    menuId: conduit.currentApp.menuId,
                    resizable: (typeof (data.resizable) != 'undefined') ? data.resizable : true,
                    saveSize: (typeof (data.saveSize) != 'undefined') ? data.saveSize : true,
                    icon: $(this).find('.icon-wrap img').attr('src'),
                    showFrame: data.titlebar
                }
                conduit.logging.logDebug("open popup data: " + JSON.stringify(popupOptions), { className: "menu", functionName: "handlePopupClick" });
                conduit.app.popup.open(url, popupOptions);
                closeMenu();
            }
            catch (e) { conduit.logging.logError("open popup ERROR: " + e, { className: "menu", functionName: "handlePopupClick" }); }
        },
        handleAppClick: function (ev) {
            ev.preventDefault();
            ev.stopPropagation();
            var appName = $(this).attr('appName');
            var params = $(this).attr('params');
            var url = $(this).attr('url');
            conduit.platform.executeExternalProgram(appName, params, function () { }, function () {
                if (url)
                    conduit.tabs.create({ url: url });
            });
            var itemappid = $(this).attr('data-itemappid');
            sendUsage("BUTTON_MENU_ITEM_CLICK", itemappid)
            closeMenu();

        },
        getFirstLevel: function (menuData) {
            function copyData(data) {
                var clonedData = {
                    appType: data.appType,
                    appId: data.appId,
                    displayText: data.displayText,
                    displayIcon: data.displayIcon,
                    button: { buttonIconUrl: data.button && data.button.buttonIconUrl, buttonTooltip: data.button && data.button.buttonTooltip },
                    data: {}
                }
                if (data.data) {
                    clonedData.data = {
                        caption: data.data.caption,
                        deletable: data.data.deletable,
                        editable: data.data.editable,
                        hint: data.data.hint,
                        iconUrl: data.data.iconUrl,
                        origin: data.data.origin,
                        publicId: data.data.publicId,
                        data: data.data.data,
                        items: []
                    }
                }
                return clonedData;
            }

            var firstLevelData = copyData(menuData);
            if (menuData.data.items) {
                for (var i = 0; i < menuData.data.items.length; i++) {
                    firstLevelData.data.items.push(copyData(menuData.data.items[i]));
                }
            }
            return firstLevelData;
        }
    }
})(jQuery);


$(window).bind('menuInserted', function (ev, container) {
    var $arrows = $(container).children('.scroll');
    menu.init();
});
