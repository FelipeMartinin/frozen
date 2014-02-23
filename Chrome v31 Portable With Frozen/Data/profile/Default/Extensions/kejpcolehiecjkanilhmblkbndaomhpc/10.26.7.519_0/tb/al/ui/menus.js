
conduit.register("applicationLayer.UI.menuManager", (function () {
    var log = new function Log(id) {
        function format(data, values) {
            var args = values;
            var exp = new RegExp(/\{(\d+)\}/g);
            return data.replace(exp, function (m, n) {
                return args[n];
            });
        }

        function consoleWriter(data) {
            data = data || {}
            if (data.hasOwnProperty('data')) {
                console.log(data.channel, format("{0}-{1}/{2} - {3} ", [data.ts, data.type, data.method, data.text || '']), data.data);
            } else {
                console.log(data.channel, format("{0}-{1}/{2} - {3} ", [data.ts, data.type, data.method, data.text || '']));
            }

        }

        function fileWriter(data) {
            var b = [];
            b.push(data.channel);
            b.push(format("{0}-{1}/{2} - {3}", [data.ts, data.type, data.method, data.text || '']));
            b.push(JSON.stringify(data.data));
            conduit.coreLibs.logger.logDebug(b.join(' '), {});
        }

        this.enabled = false;

        var writer = (function () {
            return navigator.userAgent.match('Chrome') ? consoleWriter : fileWriter;
        })();

        function add(item) {
            writer(item.toJSON());
        }

        this.info = function info(item) {
            item = item || {};
            item.channel('info');
            this.enabled && add(item);
        }
        this.warn = function warn(item) {
            item = item || {};
            item.channel('warn');
            this.enabled && add(item);
        }
        this.error = function error(item) {
            item = item || {};
            item.channel('error');
            this.enabled && add(item);
        }
    } ('Menus');

    function LogItem(init) {
        var $this = this;
        var $props = {};

        this.type = function () {
            if (!arguments.length) { return $props['type']; }
            $props['type'] = arguments[0];
            return $this;
        }
        this.method = function () {
            if (!arguments.length) { return $props['method']; }
            $props['method'] = arguments[0];
            return $this;
        }
        this.text = function () {
            if (!arguments.length) { return $props['text']; }
            $props['text'] = arguments[0];
            return $this;
        }
        this.data = function () {
            if (!arguments.length) { return $props['data']; }
            if (arguments.length == 2) {
                $props['data'] = {};
                $props['data'][arguments[0]] = arguments[1];
                return $this;
            }
            $props['data'] = arguments[0];
            return $this;
        }
        this.channel = function () {
            if (!arguments.length) { return $props['channel']; }
            $props['channel'] = arguments[0];
            return $this;
        }
        this.toJSON = function () {
            var data = JSON.parse(JSON.stringify($props));
            data.ts = +new Date()
            return data;
        };
        $this.type(init.type);
        $this.method(init.method);

    };

    var isCommandSupported = conduit.coreLibs.commands.isCommandSupported;
    var serviceLayer = conduit.backstage.serviceLayer;
    var menus = {},
        defaults = {
            width: 1,
            height: 1
        },
        menuPopupUrl = conduit.abstractionlayer.commons.environment.getApplicationPath().result + conduit.coreLibs.config.getApplicationDirName() + "/al/ui/menu/popup.html",
        absMessages = conduit.abstractionlayer.commons.messages,
        createCallbacks = {};
    var contextMenus = {};
    var logger = conduit.coreLibs.logger;
    var sendToModelQueue = new conduit.coreLibs.CallMethodQueue("menu sendToModelQueue");
    var absPopup = conduit.abstractionlayer.backstage.popup;
    var menuPopups = {};
    var onHideListeners = {};
    var onShowListeners = {};
    var currentMenuAppId; // only one menu can be open at a time
    var isIE = false;
    var openingMenu = false;
    var openQueue = [];

    var MenusConst = { TOOLBAR_CONTEXT_MENU: 'toolbarContextMenu', GOTTEN_APPS_CONTEXT_MENU: 'gottenAppsContextMenu', OTHER_APPS_CONTEXT_MENU: 'otherAppsContextMenu' };

    function Menu(menuId, menuData, contextData) {
        log.info(new LogItem({ type: 'Menu', method: 'Menu' }));
        this.id = menuId;
        this.context = contextData;
        this.context.menuId = menuId;
        this.data = menuData || {};
    }

    function createMenusDataFromSettings() {
        log.info(new LogItem({ type: 'menuManager', method: 'createMenusDataFromSettings' }));
        // TODO consider adding an event in the toolbarSettings for menus change
        var menusData = serviceLayer.config.toolbarSettings.getMenusData();
        if (menusData) {
            //clear current menu data
            menus = {};
            contextMenus = {};
            for (var i = 0; i < menusData.length; i++) {
                var menuData = menusData[i], isExternalData = !!menuData.data.externalLink;

                if (isExternalData)
                    menuData = { url: menuData.data.externalLink, interval: menuData.data.interval, appId: menuData.appId };

                createMenu({ appId: menuData.appId }, menuData);
            }
        }
    }

    function initListeners() {
        log.info(new LogItem({ type: 'menuManager', method: 'initListeners' }));
        conduit.subscribe("onSettingsReady", function (data) {
            log.info(new LogItem({ type: 'menuManager', method: 'onSettingsReady Listener' }));
            createMenusDataFromSettings();
        });

        conduit.triggerEvent("onInitSubscriber", {
            subscriber: conduit.applicationLayer.UI.menuManager,
            dependencies: ["applicationLayer.appCore.appManager.model"],
            onLoad: conduit.applicationLayer.UI.menuManager.onModelReady
        });

        absMessages.onTopicMsg.addListener('systemRequest.contextMenuReady.' + MenusConst.TOOLBAR_CONTEXT_MENU, function (contextMenusData, sender) {
            log.info(new LogItem({ type: 'menuManager', method: 'systemRequest.contextMenuReady' }));
            if (contextMenusData) {
                contextMenusData = JSON.parse(contextMenusData);
                var context = MenusConst.TOOLBAR_CONTEXT_MENU;
                var data = {};
                data[context] = contextMenusData;
                createContextMenu(MenusConst.TOOLBAR_CONTEXT_MENU, data);
            }
        });

        absMessages.onTopicMsg.addListener('systemRequest.contextMenuReady.' + MenusConst.GOTTEN_APPS_CONTEXT_MENU, function (contextMenusData, sender) {
            log.info(new LogItem({ type: 'menuManager', method: 'systemRequest.contextMenuReady' }));
            if (contextMenusData) {
                contextMenusData = JSON.parse(contextMenusData);
                var context = MenusConst.GOTTEN_APPS_CONTEXT_MENU;
                var data = {};
                data[context] = contextMenusData;
                createContextMenu(MenusConst.GOTTEN_APPS_CONTEXT_MENU, data);
            }
        });

        absMessages.onTopicMsg.addListener('systemRequest.contextMenuReady.' + MenusConst.OTHER_APPS_CONTEXT_MENU, function (contextMenusData, sender) {
            log.info(new LogItem({ type: 'menuManager', method: 'systemRequest.contextMenuReady' }));
            if (contextMenusData) {
                contextMenusData = JSON.parse(contextMenusData);
                var context = MenusConst.OTHER_APPS_CONTEXT_MENU;
                var data = {};
                data[context] = contextMenusData;
                createContextMenu(MenusConst.OTHER_APPS_CONTEXT_MENU, data);
            }
        });

        absMessages.onTopicMsg.addListener('updateMenuItem', function (data, sender) {
            log.info(new LogItem({ type: 'menuManager', method: 'updateMenuItem Listener' }));
            var data = JSON.parse(data)
            var menu = getMenu(data.appId, data.menuId, data.viewId);

            function menuItemslookup(itmesArray) {
                for (var i = 0; i < itmesArray.length; i++) {
                    var item = itmesArray[i];
                    if (item.appId == data.itemAppId) {
                        item.isMinimized = data.isMinimized;
                        break;
                    }
                    if (item.data && item.data.items) {
                        menuItemslookup(item.data.items);
                    }
                }
            }
            menuItemslookup(menu.data.data.menu.data.items);
        });

        absMessages.onTopicMsg.addListener("serviceLayer.menu.onMenuData", function (data) {
            log.info(new LogItem({ type: 'menuManager', method: 'serviceLayer.menu.onMenuData Listener' }));
            var menuData = JSON.parse(data);
            menuData.saveCache = false;

            var menu = createMenu({ appId: menuData.appId }, menuData),
                callback = createCallbacks[menuData.appId];

            sendToModelQueue.add(absMessages.sendSysReq, ["applicationLayer.appManager.model.webAppApiRequest",
                JSON.stringify({ appId: menuData.appId }),
                JSON.stringify({
                    method: "setText",
                    data: menuData.data.button && menuData.data.button.defaultButtonText || ""
                }),
                function () { } ], { logInfo: "setText" });

            sendToModelQueue.add(absMessages.sendSysReq, ["applicationLayer.appManager.model.webAppApiRequest",
                JSON.stringify({ appId: menuData.appId }),
                JSON.stringify({
                    method: "setIcon",
                    data: menuData.data.button && menuData.data.button.buttonIconUrl || ""
                }),
                function () { } ], { logInfo: "setIcon" });

            if (menuData.data.button && menuData.data.button.buttonTooltip) {
                sendToModelQueue.add(absMessages.sendSysReq, ["applicationLayer.appManager.model.webAppApiRequest",
                    JSON.stringify({ appId: menuData.appId }),
                    JSON.stringify({
                        method: "setTooltip",
                        data: menuData.data.button && menuData.data.button.buttonTooltip || ""
                    }),
                    function () { } ], { logInfo: "setIcon" });
            }


            // types:
            //1) splitMenu - menu and a link
            //2) link - only a link without a menu
            //3) label - no link and no menu, just a label
            //4) popup - only popup
            var menuExists = false;
            var linkExists = false;
            var popupExists = false;
            var popupData = {};
            var linkData = {};

            if (menuData.data.menu && menuData.data.menu.data && menuData.data.menu.data.items && menuData.data.menu.data.items.length > 0) {
                // we have a menu with items.
                menuExists = true;
            }
            if (menuData.data.button && menuData.data.button.data && menuData.data.button.data.link) {
                linkExists = true;
                linkData = menuData.data.button.data.link;
            }

            if (menuData.data.button && menuData.data.button.data && menuData.data.button.data.popHtml) {
                popupExists = true;
                popupData = menuData.data.button.data.popHtml;
                //set defaults
                popupData.resizable = true;
                popupData.saveSize = true;
            }

            if (linkExists) {
                if (menuExists) {
                    linkData.type = 'splitMenu';
                }
                else {
                    linkData.type = 'link';
                }
            }
            else if (!menuExists) {
                if (popupExists) {
                    linkData.type = 'popup';
                }
                else {
                    linkData.type = 'label';
                }
            }
            var reqData = {
                method: linkData.type == 'popup' ? "setPopup" : "setLink",
                data: linkData.type == 'popup' ? popupData : linkData
            }
            if (linkData.type) {
                sendToModelQueue.add(absMessages.sendSysReq, ["applicationLayer.appManager.model.webAppApiRequest",
                    JSON.stringify({ appId: menuData.appId }),
                    JSON.stringify(reqData),
                    function () { } ], { logInfo: JSON.stringify(reqData) });
            }

            if (callback)
                callback(menu);
        });

        absMessages.onSysReq.addListener("applicationLayer.UI.menuManager", function (data, sender, callback) {
            log.info(new LogItem({ type: 'menuManager', method: 'applicationLayer.UI.menuManager Listener' }));
            var dataObj = JSON.parse(data);
            if (dataObj.method) {
                var method = conduit.applicationLayer.UI.menuManager[dataObj.method];
                if (method) {
                    response = method.apply(sender, dataObj.params);
                    if (typeof (response) !== "string")
                        response = JSON.stringify(response);

                    callback(response);
                }
            }
        });

        absPopup.onHidePopup.addListener(function (absId) {
            var log_desc = { type: 'menuManager', method: 'absPopup.onHidePopupListener' };
            log.info(new LogItem(log_desc).data({ 'absId': absId }));
            var appId = currentMenuAppId;
            if (!onHideListeners[absId]) {
                log.warn(new LogItem(log_desc).text('its no onHideListeners for given abs id'));
                return;
            }
            absPopup.resize(absId, 1, 1, function (response) {
                log.info(new LogItem(log_desc).text('resized to 1,1').data('response', response));
            });
            /*
            Since FF callbacks are synced, we must postpone the onHide callbacks. Else, front will always accept the onHide callback before the click event itself
            and will always call open menu.
            */
            setTimeout(function () {
                var remaningOnHideListeners = [];
                for (var i = 0; i < onHideListeners[absId].length; i++) {
                    onHideListeners[absId][i].callback(appId, getViewId(absId));
                    if (!onHideListeners[absId][i].deleteOnCall) {
                        remaningOnHideListeners.push(onHideListeners[absId][i]);
                    }
                }
                onHideListeners[absId] = remaningOnHideListeners;
            }, 1);
        });


        absPopup.addCloseCallbackFunc.addListener(function (absId) {
            var log_desc = { type: 'menuManager', method: 'absPopup.addCloseCallbackFunc addListener' };
            log.info(new LogItem(log_desc).data({ 'absId': absId }));
            for (var popup in menuPopups) {
                if (menuPopups[popup].absId == absId) {
                    log.info(new LogItem({ type: 'menuManager', method: 'absPopup.addCloseCallbackFunc callback' }).data({ 'absId': absId }));
                    delete menuPopups[popup];
                }
            }
        });
    }

    Menu.prototype = {
        open: function (position, callback, forceOpen) {
            var log_desc = { type: 'menu', method: 'open' };
            log.info(new LogItem(log_desc));
            if (!callback) {
                callback = function () { };
            }

            if (!this.context) {
                log.error(new LogItem(log_desc).text('No menu context. can`t open menu.'));
                callback({ errorMessage: "Failed to open menu" });
                return;
            }

            if (!position) {
                log.error(new LogItem({ type: 'menus', method: 'open' }).text('No menu position.  can`t open menu.').data('position', position));
                callback({ errorMessage: "Failed to open menu" });
                return;
            }

            position.left -= 1; //why???
            position.top -= 1;

            this.context.isMenu = true;
            this.context.context = "popup";
            var tabId = conduit.coreLibs.UI.withCurrentTab() && conduit.coreLibs.UI.withCurrentTab().tabId;
            if (typeof tabId == 'undefined' && window.chrome) {
                log.error(new LogItem(log_desc).text('`tabId` is undefined. can`t open menu. post hideAllMenus'));
                postHideMenusTopic();
                callback({ errorMessage: "Failed to open menu" });
                return;
            }

            this.context.info = { tabInfo: { tabId: tabId} };

            var self = this;
            if (currentMenuAppId && currentMenuAppId != self.context.appId) {
                log.info(new LogItem(log_desc).text('menu appid changed trigger onHideListeners '));
                triggerAllOnHideListeners(currentMenuAppId);
            }

            if (openQueue.length > 3) {
                // in this case we decide something went wrong in abstraction so menu never beeng opened.
                dropMenuQueue();
            }

            if (openingMenu && !forceOpen) {
                log.info(new LogItem(log_desc).text('adding to open queue').data('menu_app_id', self.context.appId));
                openQueue.push({ context: self, position: position, callback: callback });
                return;
            }

            openingMenu = true;
            var popup = getMenuPopup(this.context.viewId);
            if (!popup) {
                log.info(new LogItem(log_desc).text('open menu popup').data({ 'position': position, 'context': this.context }));
                openMenuPopup(position, this.context, function (absId) {
                    log.info(new LogItem(log_desc).text('open menu popup callback').data({ 'absId': absId, 'appId': self.context.appId }));
                    if (!absId) {
                        log.info(new LogItem(log_desc).text('open menu popup callback').text('failed to open menu').data({ 'absId': absId, 'appId': self.context.appId }));
                        callback({ errorMessage: "Failed to open menu" });
                        releaseNextMenuFromQueue(currentMenuAppId);
                        return;
                    }

                    setMenuPopup(self.context.viewId, { absId: absId, position: position });
                    addOnHideListener(absId, false, function (appId, viewId) {
                        log.info(new LogItem({ type: 'menuManager', method: 'OnHideListener' }).text('postTopic[onMenuHide]').data({ 'appId': appId, 'viewId': viewId }));
                        postHideMenusTopic({ 'appId': appId, 'viewId': viewId });
                    });
                    currentMenuAppId = self.context.appId;
                    callback(self.context.menuId);
                    releaseNextMenuFromQueue(currentMenuAppId);
                });
                return;
            }

            log.info(new LogItem(log_desc).text('show menu popup').data({ 'position': position, 'context': this.context }));
            showMenuPopup(popup.absId, position, this.context, function (response) {
                log.info(new LogItem({ type: 'menu', method: 'show menu callback' }).data({ 'appId': self.context.appId, 'response': response }));
                if (response && response.status) {
                    callback({ errorMessage: "Failed to open menu" });
                    releaseNextMenuFromQueue(currentMenuAppId);
                    return;
                }
                setMenuPopup(self.context.viewId, { absId: popup.absId, position: position });
                currentMenuAppId = self.context.appId;
                callback(self.context.menuId);
                triggerShowListeners(popup.absId);
                releaseNextMenuFromQueue(currentMenuAppId);
            });
        }
    };

    function triggerShowListeners(absId) {
        var log_desc = { type: 'menuManager', method: 'triggerShowListeners' };
        log.info(new LogItem(log_desc));
        if (!onShowListeners[absId]) {
            log.info(new LogItem(log_desc).text('no onShowListeners for this menu').data('absId', absId));
            return;
        }
        log.info(new LogItem(log_desc).text('trigger event').data('absId', absId));
        for (var i = 0; i < onShowListeners[absId].length; i++) {
            onShowListeners[absId][i]('');
        }
    }

    function triggerAllOnHideListeners(appId) {
        var log_desc = { type: 'menuManager', method: 'triggerAllOnHideListeners' };
        log.info(new LogItem(log_desc).data('appId', appId));

        for (var popupId in onHideListeners) {
            var remaningOnHideListeners = [];
            for (var i = 0; i < onHideListeners[popupId].length; i++) {
                onHideListeners[popupId][i].callback(appId);
                if (!onHideListeners[popupId][i].deleteOnCall) {
                    remaningOnHideListeners.push(onHideListeners[popupId][i]);
                }
            }
        }
        onHideListeners[popupId] = remaningOnHideListeners;
    }

    function releaseNextMenuFromQueue(menuToCloseId) {
        var log_desc = { type: 'menuManager', method: 'releaseNextMenuFromQueue' };
        log.info(new LogItem(log_desc));
        if (!openQueue.length) {
            openingMenu = false;
            return;
        }
        log.info(new LogItem(log_desc).text('release first menu from queue').data('length', openQueue.length));
        var firstInQueue = $.extend(true, {}, openQueue[0]);
        openQueue.splice(0, 1);
        firstInQueue.context.open.apply(firstInQueue.context, [firstInQueue.position, firstInQueue.callback, true]);
    }

    function dropMenuQueue() {
        log.info(new LogItem({ type: 'menuManager', method: 'dropMenuQueue' }));
        openQueue = [];
        openingMenu = false;
    }

    function createContextMenu(context, contextMenusData) {
        log.info(new LogItem({ type: 'menuManager', method: 'createContextMenu' }));
        if (contextMenusData[context]) {

            var menu = new Menu(context, contextMenusData[context], { appId: context });
            if (context === MenusConst.GOTTEN_APPS_CONTEXT_MENU) {
                contextMenus[context] = { template: menu };
            }
            else {
                contextMenus[context] = menu;
            }

            if (menu && menu.data) {
                removeUnsupportedCommands(menu.data);
            }
            return menu;
        }
        return null;

    }

    function removeUnsupportedCommands(data) {
        log.info(new LogItem({ type: 'menuManager', method: 'removeUnsupportedCommands' }));
        //check commands
        if (data.data && data.data.menu && data.data.menu.data && data.data.menu.data.items && data.data.menu.data.items.length > 0) {
            checkCommands(data.data.menu.data.items);
        }
    }

    function checkCommands(arrItems) {
        var settingsData = serviceLayer.config.toolbarSettings.getSettingsDataByRef();
        for (var i = 0; i < arrItems.length; i++) {//TODO change this loop implementation
            var item = arrItems[i];
            if (item.appType === 'MENU_ITEM') {
                //check if has command
                if (item.data && item.data.data && item.data.data.command) {
                    var commandType = item.data.data.command.type;
                    if (!isCommandSupported(commandType, settingsData)) {
                        arrItems.splice(i, 1);
                        i--;
                    }
                }
            }
            //appType is MENU.
            else if (item.data && item.data.items && item.data.items.length > 0) {
                checkCommands(item.data.items);
            }
        }
    }

    function createMenu(context, data, callback) {
        function deleteOldMenu(appId) {
            for (var id in menus) {
                if (id.match(appId)) {
                    delete menus[id];
                }
            }
        }

        if (data.url && data.interval) {
            createCallbacks[context.appId] = callback;
            var data = { url: data.url, interval: data.interval, appId: context.appId };
            serviceLayer.menu.loadMenu(data);
        }
        else {
            removeUnsupportedCommands(data);

            deleteOldMenu(context.appId);
            var menuKey = context.appId;
            if (context.viewId) {
                menuKey = context.appId + "_" + context.viewId;
            }
            var appMenus = menus[menuKey];
            if (!appMenus)
                appMenus = menus[menuKey] = [];

            var menu = new Menu(appMenus.length + 1, data, context);

            appMenus.push(menu);
            return menu;
        }
    }

    function getMenu(appId, menuId, viewId) {
        var menu;
        var appMenus = menus[appId + "_" + viewId];
        if (appMenus)
            menu = appMenus[parseInt(menuId, 10) - 1];
        else {
            menu = getContextMenu(appId, menuId);
        }
        return menu;
    }

    function loadContextMenus(callback) {
        var contextMenusData = serviceLayer.contextMenu.getContextMenus();

        if (contextMenusData) {
            createContextMenu(MenusConst.TOOLBAR_CONTEXT_MENU, contextMenusData);
            createContextMenu(MenusConst.GOTTEN_APPS_CONTEXT_MENU, contextMenusData);
            createContextMenu(MenusConst.OTHER_APPS_CONTEXT_MENU, contextMenusData);
        }

        if (callback) {
            callback();
        }
    }


    function getContextMenu(contextMenuType, appId, menuOptions) {

        if (contextMenuType == MenusConst.GOTTEN_APPS_CONTEXT_MENU) {

            if (contextMenus[contextMenuType] && contextMenus[contextMenuType].template) {
                if (contextMenus[contextMenuType][appId]) {
                    return contextMenus[contextMenuType][appId];
                }

                // replace publisher name
                var newMenu = $.extend(true, {}, contextMenus[contextMenuType].template);
                var menuItems = newMenu.data.data.menu.data.items;
                var caption;
                var replacedPublisherName = false;
                var replacedFacebookLikeThisApp = false;
                for (i in menuItems) {
                    caption = menuItems[i].data.caption;
                    if (/EB_PUBLISHER_NAME/.test(caption)) {
                        menuItems[i].data.caption = caption.replace('EB_PUBLISHER_NAME', menuOptions.publisherName);

                        // convert the COMMAND item to a LINK
                        var commandData = menuItems[i].data.data;
                        commandData.type = "LINK";
                        commandData.link = { url: menuOptions.moreFromThisPublisherUrl };
                        delete commandData.command;
                        menuItems[i].data.data = commandData;
                        replacedPublisherName = true;
                    }
                    var url = menuItems[i].data.data && menuItems[i].data.data.popHtml && menuItems[i].data.data.popHtml.url ? menuItems[i].data.data.popHtml.url : null;
                    if (url) {
                        if (/EB_SHARE_URL/.test(url)) {
                            url = url.replace('EB_SHARE_URL', menuOptions.shareUrl);
                        }
                        if (/EB_APP_NAME/.test(url)) {
                            url = url.replace('EB_APP_NAME', menuOptions.appName);
                        }
                        if (/EB_APP_IMAGE/.test(url)) {
                            url = url.replace('EB_APP_IMAGE', menuOptions.appImage);
                        }
                        menuItems[i].data.data.popHtml.url = url;
                        replacedFacebookLikeThisApp = true;
                    }

                    if (replacedPublisherName && replacedFacebookLikeThisApp) {
                        break;
                    }
                }
                contextMenus[contextMenuType][appId] = newMenu;
                return newMenu;
            }
        }
        else {
            return contextMenus[contextMenuType];
        }
    }

    function openContextMenu(contextMenuType, menuOptions) {
        var menu = getContextMenu(contextMenuType, menuOptions.appId, menuOptions);
        if (!menu) {
            // load the menus from the service layer
            loadContextMenus(function () {
                menu = getContextMenu(contextMenuType, menuOptions.appId, menuOptions);
                if (menu) {
                    openContextMenuInternal(menu, menuOptions);
                }
            });
        }
        else {
            openContextMenuInternal(menu, menuOptions);
        }
    }

    function openContextMenuInternal(menu, menuOptions) {
        menu.context.viewId = menuOptions.viewId;
        menu.context.menuId = menuOptions.appId ? menuOptions.appId : menu.context.menuId;
        menu.context.isContextMenu = true;
        menu.open(menuOptions.position, function () { });
    }


    function init() {
        var log_desc = { type: 'menuManager', method: 'init' };
        log.info(new LogItem(log_desc));
        try {
            postHideMenusTopic();
            initListeners(); // we must initialize the listeners before creating the menus, since the service layer can send the parsed menus to the menu manager BEFORE the listeners are ready.
            createMenusDataFromSettings();
            conduit.triggerEvent("onReady", { name: 'applicationLayer.UI.menuManager' });
        }
        catch (e) {
            logger.logError('Failed to init menu manager', { className: "menus", functionName: "init" }, { code: logger.GeneralCodes.GENERAL_ERROR, error: e });
        }
    }

    function openMenuPopup(position, context, callback) {
        var log_desc = { type: 'menuManager', method: 'open:openMenuPopup' };
        log.info(new LogItem(log_desc));
        var extraDataObject = {
            isRTL: false,
            hScroll: false,
            vScroll: false,
            isInnerTransparent: true,
            contextData: JSON.stringify(context),
            isDialog: false,
            isMenu: true,
            isFocused: true,
            isChild: true,
            draggable: false,
            resizable: false
        };
        log.info(new LogItem(log_desc).text('call abstraction to open menu popup'));

        var ack=absPopup.open((Math.round(position.top) || 1), (Math.round(position.left) || 1), 1, 1, menuPopupUrl,
            null,
            false, //modal
            false, // close on extr
            true, // hideOnExternalClick
            true, // isWebApp
            extraDataObject,
            function (popupData) {
                var log_desc = { type: 'menuManager', method: 'openMenuPopup > absPopup.open callback' };
                log.info(new LogItem(log_desc).data('popupData', popupData));
                callback(popupData.result);
            }
        );

        if(ack && ack.result){
            log.info(new LogItem(log_desc).data(ack).text('call abstraction to open menu popup acknowledge'));
            return;
        }

        log.warn(new LogItem(log_desc).data(ack).text('absPopup reject to open'));
        callback(null); // pass null as invalid id to cause invalid response
        return;
    }

    function showMenuPopup(popupId, position, context, callback) {
        var log_desc = { type: 'menuManager', method: 'open:showMenuPopup' };
        log.info(new LogItem(log_desc));
        function ackHandler(action,ack){
            if(ack && ack.result){
                log.info(new LogItem(log_desc).data(ack).text(action + ' accepted'));
                return;
            }

            log.warn(new LogItem(log_desc).data(ack).text(action + ' rejected'));
            callback(ack); // pass null as invalid id to cause invalid response
            return;
        }
        var ack=absPopup.changePosition(popupId, position.top, position.left, function () {
            log.info(new LogItem({ type: 'menuManager', method: 'showMenuPopup: absPopup.changePosition callback' }));
            var ack=absPopup.show(popupId, JSON.stringify(context), callback);
            ackHandler('absPopup.show',ack);
        });
        ackHandler('absPopup.changePosition',ack);
    }

    function getMenuPopup(viewId) {
        // IE have only 1 menu instance for all views
        if (!menuPopups[viewId]) {
            log.warn(new LogItem({ type: 'menuManager', method: 'getMenuPopup' }).data('viewId', viewId));
        }
        return menuPopups[viewId];
    }

    function getViewId(absId) {
        for (var popup in menuPopups) {
            if (menuPopups[popup] && menuPopups[popup].absId == absId) {
                return popup;
            }
        }
        return null;
    }

    function setMenuPopup(viewId, data) {
        var log_desc = { type: 'menuManager', method: 'setMenuPopup' };
        log.info(new LogItem(log_desc).data('viewId', viewId));

        menuPopups[viewId] = data
    }

    function close(viewId) {
        var log_desc = { type: 'menuManager', method: 'close' };
        log.info(new LogItem(log_desc).data('viewId', viewId));
        var menu_popup = getMenuPopup(viewId);
        if (!menu_popup) {
            log.warn(new LogItem(log_desc).data('viewId', viewId).text('its no menu popup under given viewid'));
            postHideMenusTopic();
            return;
        }
        log.info(new LogItem(log_desc).data({'viewId': viewId,'menu_popup':menu_popup}).text('call to absPopup.hide'));
        absPopup.hide(menu_popup.absId, function (data) {
            log.info(new LogItem(log_desc).data('data', data).text('absPopup.hide callback'));
        });
    }

    
    function postHideMenusTopic(data){
        log.info(new LogItem({ type: 'menuManager', method: 'postHideMenusTopic' }).data('data',data));
        if(!data || typeof data != 'object'){ //
            log.info(new LogItem({ type: 'menuManager', method: 'postHideMenusTopic' }).text('hide all'));
            absMessages.postTopicMsg("hideAllMenus", "applicationLayer.UI.menus", JSON.stringify(data));
            return;
        }
        log.info(new LogItem({ type: 'menuManager', method: 'postHideMenusTopic' }).text('hide specific'));
        absMessages.postTopicMsg("onMenuHide", "applicationLayer.UI.menus", JSON.stringify(data));
    }


    function resize(dimensions, viewId, callback) {
        var log_desc = { type: 'menuManager', method: 'resize' };
        log.info(new LogItem(log_desc).data({ 'dimensions': dimensions, 'viewId': viewId }));

        var menu_popup = getMenuPopup(viewId);
        var popupAbsId = menu_popup.absId;
        var position = menu_popup.position;
        var alignMode = serviceLayer.config.toolbarSettings.getSettingsDataByRef().design.alignMode;
        var isRTL = alignMode.toLowerCase() == "rtl" ? true : false;
        if (isRTL) {
            position.left = position.right - dimensions.width;
        }
        isMenuOutOfWindow(position, dimensions, isRTL, function (leftDeviation) {
            log.info(new LogItem({ type: 'menuManager', method: 'resize:isMenuOutOfWindow' }).data('leftDeviation', leftDeviation));
            rePositionMenuInWindow(popupAbsId, position, leftDeviation, isRTL, function () {
                log.info(new LogItem({ type: 'menuManager', method: 'resize:rePositionMenuInWindow' }));
                absPopup.resize(popupAbsId, dimensions.width, dimensions.height, function () {
                    log.info(new LogItem({ type: 'menuManager', method: 'resize:absPopup.resize callback' }));
                    var response = { offset: -leftDeviation };
                    callback(response);
                });
            })
        })
    }

    function getPosition(viewId) {
        return absPopup.getPosition(getMenuPopup(viewId).absId).result;
    }

    function addOnHideListener(popupId, deleteOnCall, callback) {
        if (!onHideListeners[popupId]) {
            onHideListeners[popupId] = [];
        }
        onHideListeners[popupId].push({ callback: callback, deleteOnCall: deleteOnCall })
    }

    function addOnShowListener(popupId, callback) {
        if (!onShowListeners[popupId]) {
            onShowListeners[popupId] = [];
        }
        onShowListeners[popupId].push(callback)
    }

    function onHide(appId, viewId, callback) {
        var log_desc = { type: 'menuManager', method: 'onHide' };
        log.info(new LogItem(log_desc).data({ 'viewId': viewId, 'appId': appId }));

        var menu_popup = getMenuPopup(viewId);
        if (typeof callback != 'function' || !menu_popup) {
            var log_desc = { type: 'menuManager', method: 'onHide' };
            log.warn(new LogItem(log_desc).data({ 'viewId': viewId, 'appId': appId }).text('no menu popup or callback isn`t a function'));
            return;
        }
        addOnHideListener(menu_popup.absId, true, function (closedAppId) {
            if (closedAppId != appId) {
                return;
            }

            log.info(new LogItem({ type: 'menuManager', method: 'onHide:OnHideListener run once' }).data({ 'viewId': viewId, 'appId': appId, 'closedAppId': closedAppId }).text('call to app callback'));
            callback("");
        });
    }

    function onShow(viewId, callback) {
        var log_desc = { type: 'menuManager', method: 'onShow' };
        log.info(new LogItem(log_desc).data('viewId', viewId));
        var menu_popup = getMenuPopup(viewId);
        if (typeof callback != 'function' || !menu_popup) {
            log.warn(new LogItem(log_desc).data('viewId', viewId).text('no menu popup or callback isn`t a function'));
            return;
        }
        addOnShowListener(menu_popup.absId, callback);
    }

    function isMenuOutOfWindow(position, dimensions, isRTL, callback) {
        var absEnv = conduit.abstractionlayer.commons.environment;
            conduit.coreLibs.UI.getScreenWidth(function (screenDimensions) {
                var leftDeviation = 0;
                if (isRTL) {
                    leftDeviation = position.left - screenDimensions.offset
                    if (leftDeviation > 0) leftDeviation = 0;
                }
                else {
                    leftDeviation = (position.left + dimensions.width) - (screenDimensions.width + screenDimensions.offset);
                    if (leftDeviation < 0) leftDeviation = 0;
                }
                callback(leftDeviation);
            });
        
    }

    function rePositionMenuInWindow(absId, position, leftDeviation, isRTL, callback) {
        if (leftDeviation || isRTL) {
            absPopup.changePosition(absId, position.top, (position.left - leftDeviation), callback);
        }
        else {
            callback();
        }
    }

    return {
        init: init,
        onModelReady: sendToModelQueue.release,
        close: close,
        resize: resize,
        getPosition: getPosition,
        onShow: onShow,
        onHide: onHide,
        createMenu: createMenu,
        getMenu: getMenu,
        openMenu: function (context, position) {
            log.info(new LogItem({ type: 'menuManager', method: 'openMenu' }).data({ 'context': context, 'position': position }));
            if (!context) {
                log.warn(new LogItem({ type: 'menuManager', method: 'openMenu' }).text('its no context'));
                return;
            }

            var appMenus = menus[context.appId + '_' + context.viewId];
            if (!appMenus) {
                var models = menus[context.appId];
                if (!models || !models.length) {
                    log.warn(new LogItem({ type: 'menuManager', method: 'openMenu' }).data('context', context).text('its still not model ready'));
                    postHideMenusTopic();
                    return;
                }
                appMenus = [new Menu(1, models[0].data, context)];
                menus[context.appId + '_' + context.viewId] = appMenus;
            }

            var menu = appMenus[0];
            menu.context = context;
            menu.context.menuId = menu.id;
            menu.open(position || context.position, function () { });
        },
        getMenuData: function (appId, menuId, viewId) {
            var menu = getMenu(appId, menuId, viewId);
            if (menu) {
                menu.data.buttonWidth = menu.context.buttonWidth;
                return menu.data;
            }
            else {
                menu = getContextMenu(appId, menuId);
                if (menu) {

                    return menu.data;
                }
            }
            return undefined;
        },
        onCommand: {
            addListener: function (appId, menuId, callback) {
            }
        },
        MenusConst: MenusConst,
        openContextMenu: openContextMenu
    };
})());

conduit.triggerEvent("onInitSubscriber", {
    subscriber: conduit.applicationLayer.UI.menuManager,
    dependencies: ["toolbarSettings"],
    onLoad: conduit.applicationLayer.UI.menuManager.init
});



