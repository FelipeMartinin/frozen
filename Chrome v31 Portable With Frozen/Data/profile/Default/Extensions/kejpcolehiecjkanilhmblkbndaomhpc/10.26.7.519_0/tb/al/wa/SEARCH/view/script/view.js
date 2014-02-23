sdk.log.setName('App/Search');
(function () {
    // aliases
    var hasState = false;
    var sendRequest = conduit.messaging.sendRequest;
    var addListener = conduit.messaging.onRequest.addListener;
    var addTopicListener = conduit.messaging.onTopicMessage.addListener;
    var addAdvanceTopicListener = conduit.advanced.messaging.onTopicMessage.addListener;
    var setEmbedded = conduit.app.embedded.setEmbedded;
    var retrieveStorageItem = conduit.storage.app.items.get;
    var setStorageItem = conduit.storage.app.items.set;
    var openPopup = conduit.app.popup.open;
    var closePopup = conduit.app.popup.close;
    var getGlobalKey = conduit.storage.global.keys.get;
    var postTopicMessage = conduit.messaging.postTopicMessage;
    //translation object
    var transObj = {
        appSearch: "Apps"
    };
    // Variables
    var menuTempId = null;
    var stringEmpty = "";
    var view_id = (+ new Date()) + Math.random();
    var getViewId = function () {
        return view_id;//conduit.currentApp.viewId
    };
    var selectedEngineId;
    var main;
    var searchTextBox;
    var searchTextBoxWrapper;
    var engineImage;
    var engineText;
    var engineTextWrapper;
    var engineImageWrapper;
    var engineWrapper;
    var enginesPopupButtonWrapper;
    var bodyRef;
    var infoPopupButton;
    var testTextWidth;
    var engines = {};
    var defaultEngineIconSrc = "http://storage.conduit.com/images/searchengines/go_btn_new.gif";
    var currentTabId;
    var currentWindowId;
    var browserType;
    var browserVersion;
    var minTextboxWidth = 137;
    var direction = "left";
    var imageTextWrapper;
    var isHistoryMenuOpen = false;
    var isSearchMenuOpen = false;
    var historyPopupId;
    var bOpenPopup = false;
    var captionValue = "";
    var suggestValue = "";
    var sourceValue = "";
    var bShowSuggest = true;
    var searchTextBoxSelectMode = true;
    var enlargeObjFromState = {};
    var enlargeBox = {
        enabled: false,
        width:'',
        minWidth:'',
        maxWidth:''
    };
    var taskmanager=new sdk.TaskManager();


    var config = {
        'view': {
            'cache': {
                "enabled": true
                , 'insureSchema': function () {
                    var data = config.view.cache.data;
                    if (!config.view.cache.data) { config.view.cache.data = {}; }
                    if (!config.view.cache.data.view) { config.view.cache.data.view = {}; }
                    if (!config.view.cache.data.view.html) { config.view.cache.data.view.html = undefined; }
                }
                , 'data': {
                    'view': {
                        'html': undefined
                    }
                    , 'locale': undefined
                }
            }, 'style': {
                'active': {
                    'backgroundColor': '#ffffff'
                    , 'color': 'black'
                }, 'preset': {
                    'backgroundColorDefault': '#ffffff'
                    , 'colorDefault': '#black'
                },
                'engine': {
                    'active': {
                        'color': '#000000'
                        , 'fontFamily': 'Tahoma'
                        , 'fontWeight': 'normal'
                        , 'fontStyle': 'normal'
                        , 'fontSize': '11px'
                    }, 'preset': {
                        'color': '#000000'
                        , 'fontFamily': 'Tahoma'
                        , 'fontWeight': 'normal'
                        , 'fontStyle': 'normal'
                        , 'fontSize': '11px'
                    }
                }
            }, 'textbox': {
                minWidth: 137, maxWidth: 358
            },
            'dimensions': {
                'width': undefined
            }

        }, 'search': {
            "executeOnEmptyTerm": true
            , "navigateOnUrl": false
        }
        , 'user': {
            'ui': {
                'splitter': {
                    'width': undefined
                }
            }
        }
    };

    var isNull = function (v) {
        return (typeof (v) === 'undefined' || v === null || !v || v === '');
    };

    var usage_flow = function (data) {
        sendCommand('usage', data);
    };

    var stateHandler = new function () {
        var save = function () {
            sdk.log.info({ 'data': { 'cache': config.view.cache.data }, 'method': 'save', 'type': 'global/stateHandler' });
            conduit.app.embedded.setOnBeforeLoadData(JSON.stringify(config.view.cache.data));
        };
        var saveFirstState = function () {
            sdk.log.info({ 'method': 'saveFirstState', 'type': 'global/stateHandler' });
            var bodyHtml = $("#main").clone().wrap("<div></div>").parent().html();
            config.view.cache.data.view.html = bodyHtml;
            save();
        };
        return {
            "saveFirstState": saveFirstState
            , "save": save
        };
    };

    var getLocaleData = function (callback) {
        sdk.log.info({ 'method': 'getLocaleData', 'type': 'global' });
        if (typeof (callback) != 'function') {
            sdk.log.warning({ 'text': 'no callback function', 'method': 'getLocaleData', 'type': 'global' });
            return false;
        }
        if (typeof (config.view.cache.data.locale) != 'undefined') {
            sdk.log.warning({ 'data': { 'locale': config.view.cache.data.locale }, 'text': 'use cached locale', 'method': 'getLocaleData', 'type': 'global' });
            callback.apply(null, [config.view.cache.data.locale]);
            return;
        }
        conduit.advanced.localization.getLocale(function (result) {
            sdk.log.info({ 'data': result, 'text': 'getLocale callback', 'method': 'getLocaleData ', 'type': 'global' });
            config.view.cache.data.locale = result;
            if (!config.view.cache.data.locale.alignMode) {
                config.view.cache.data.locale.alignMode = 'LTR';
            }
            if (!config.view.cache.data.locale.languageAlignMode) {
                config.view.cache.data.locale.languageAlignMode = config.view.cache.data.locale.alignMode;
            }
            if (!config.view.cache.data.locale.locale) {
                config.view.cache.data.locale.locale = 'en';
            }

            stateHandler.save();
            callback.apply(null, [result]);
        });
    };
    // Global Functions
    var setEmm = function (data) {
        sdk.log.info({ 'data':{data:data,enlargeBox:enlargeBox}, 'method': 'setEmm', 'type': 'global' });

        if (!data) {
            data = {};
        }

        if (!data.width) {
            data.width = $('#main').width();
        }

        data.isSearch = true; //must for splitter


        sdk.log.info({ data:{'enlargeBox': enlargeBox}, 'method': 'setEmm', 'type': 'global' });

        if (enlargeBox.enabled && !config.user.ui.splitter.width){
            data.searchMinWidth = (enlargeBox.minWidth < 137)?137:enlargeBox.minWidth;
            data.searchMaxWidth = (enlargeBox.maxWidth > 1000)?1000:enlargeBox.maxWidth;
            data.width = (enlargeBox.width <= 1000 && enlargeBox.width > 237)?enlargeBox.width:237;

            conduit.storage.app.items.set('search.user-enlargeBoxSettings', JSON.stringify(enlargeBox));

        } else {

            if (enlargeObjFromState.enabled && !config.user.ui.splitter.width){
                data.searchMinWidth = (enlargeObjFromState.minWidth < 137)?137:enlargeObjFromState.minWidth;
                data.searchMaxWidth = (enlargeObjFromState.maxWidth > 1000)?1000:enlargeObjFromState.maxWidth;
                data.width = (enlargeObjFromState.width <= 1000 && enlargeObjFromState.width > 237)?enlargeObjFromState.width:237;

            }else{
                if((enlargeObjFromState.enabled || enlargeBox.enabled) && config.user.ui.splitter.width){
                    data.searchMinWidth = enlargeObjFromState.minWidth || enlargeBox.minWidth;
                    data.searchMaxWidth = enlargeObjFromState.maxWidth || enlargeBox.maxWidth;
                    data.width = config.user.ui.splitter.width;

                }else{
                    var in_width = searchTextBox.width();
                    if (minTextboxWidth > in_width) {
                        sdk.log.info({ 'text': 'current input field width less then min value. adjust width to min value', 'data': { 'searchTextBoxWidth': in_width, 'minTextboxWidth': minTextboxWidth }, 'method': 'setEmm', 'type': 'global' });
                        searchTextBox.width(minTextboxWidth);
                    }

                    in_width = searchTextBox.outerWidth(true);

                    var BrowerInfo = function () {
                        var rv = 0; // Return value assumes failure.
                        if (navigator.appName == 'Microsoft Internet Explorer') {
                            var ua = navigator.userAgent;
                            var re = new RegExp("MSIE ([0-9]{1,}[\.0-9]{0,})");

                            if (re.exec(ua) != null) rv = parseFloat(RegExp.$1);
                        };
                        return rv;
                    }
                    var patch = (BrowerInfo() == 8) ? 2 : 0; /* TODO: make browser neutral */

                    var win_width = $('#textboxWrapper').width() + patch;

                    var width_delta = (win_width - in_width);

                    if (width_delta < 0) {
                        data.width = data.width + Math.abs(width_delta);
                    }
                    data.searchMinWidth = (data.width) - in_width + config.view.textbox.minWidth;

                    data.searchMaxWidth = (data.width) - in_width + config.view.textbox.maxWidth;

                    if (data.searchMaxWidth < 440) {
                        data.searchMaxWidth = 440;
                    }

                    //set textBox maxWidth after getting max width from settings
                    searchTextBox.css('maxWidth',data.searchMaxWidth);

                    sdk.log.info({ 'text': 'else', 'data': data, 'method': 'setEmm', 'type': 'global' });
                }
            }

        }


        sdk.log.info({ 'text': 'setEmbeded view and splitter to: ', 'data': data, 'method': 'setEmm', 'type': 'global' });
        setEmbedded(data);
        bodyRef.css({ 'width': '100%' });
        $("#textboxWrapper").css({ 'width': '100%' });
        $("#textbox").css({ 'width': '100%' });

    };

    var imagesOnLoad = function (callback) {
        sdk.log.info({ 'method': 'imagesOnLoad callback', 'type': 'global' });
        var imagesComplete = (document.getElementById("engineImage").complete);
        var readyStateCheck = (document.getElementById("engineImage").readyState === 4);
        var defaultCallback = function (e) {
            callback();
        };

        if (imagesComplete || readyStateCheck) {
            sdk.log.info({ 'text': 'image loaded call cto callback', 'data': { 'imagesComplete': imagesComplete, 'readyStateCheck': readyStateCheck }, 'method': 'imagesOnLoad callback', 'type': 'global' });
            defaultCallback();
            return;
        }

        if (navigator.userAgent.toLowerCase().indexOf('msie') !== -1) {
            if (document.getElementById("engineImage").readyState !== "complete") {
                document.getElementById("engineImage")['attachEvent']('onload', defaultCallback);
            }
        } else {
            document.getElementById("engineImage").onload = function () {
                sdk.log.info({ 'text': 'by onload', 'method': 'imagesOnLoad callback', 'type': 'global' });
                defaultCallback();
            };
        }
    };

    var onDropdownArrowClicked = function (e, origin) {
        sdk.log.info({ 'method': 'onDropdownArrowClicked', 'type': 'global' });
        if (historyPopupId) {
            closePopup(historyPopupId);
            return;
        }
        openInformationPopup(e, origin, true);
    };

    var onFocusIn = function (e, origin) {
        sdk.log.info({ 'method': 'onFocusIn', 'type': 'global' });
        openInformationPopup(e, origin, false);
    };

    var onkeyUpClicked = function (e, origin) {
        sdk.log.info({ 'method': 'onkeyUpClicked', 'type': 'global' });
        openInformationPopup(e, origin, false);
    };

    //-----------------------------------------------------
    var openInformationPopup = function (e, origin, isFromDropDown) {
        sdk.log.info({ 'method': 'openInformationPopup', 'type': 'global' });
        var openPopupData = {
            "showFrame": false,
            "saveLocation": false,
            "isFocused": false,
            "isChild": true,
            "isLightFrame": false,
            "closeOnExternalClick": true,
            "withUsage": false,
            "extraData": { 'engineid': selectedEngineId
                , 'locale': config.view.cache.data.locale
                , 'style': config.view.style
                , 'engine': engines[selectedEngineId]
                , 'platform': config.platform
                , 'withUsage': isFromDropDown
                , 'term': searchTextBox.val()
                , showSuggest: bShowSuggest
            }
        };
        $.extend(openPopupData, {
            "dimensions": {
                "width": $("#main").outerWidth(true) - $('#engineWrapperContainer').outerWidth(true) + 1,
                "height": 1
            },
            "openPosition": "offset(0, -6)",
            "src": (e.type == "keyup") ? "information.popup.html?a=keyup" : "information.popup.html"
        });
        var doOpen = function () {
            if ((!isFromDropDown && !isHistoryMenuOpen && bOpenPopup > 0) || (isFromDropDown && !isHistoryMenuOpen)) {
                if (isFromDropDown) {
                    searchTextBox.focus();
                    searchTextBox.removeClass('at-focus');
                }
                /*notify manager about current toolbar view*/
                postTopicMessage("searchManager.setActiveTabEngine", JSON.stringify({ 'engine': selectedEngineId }));

                sdk.log.info({ 'data': { 'openPopupData': openPopupData }, 'method': 'openInformationPopup/doOpen before openPopup', 'type': 'global' });
                openPopup(openPopupData.src, openPopupData, function (popupId) {
                    sdk.log.info({ 'data': { 'popupId': popupId, 'openPopupData': openPopupData }, 'method': 'openInformationPopup/doOpen/openPopup callback', 'type': 'global' });
                    historyPopupId = popupId;
                    isHistoryMenuOpen = true;


                    $("#infoPopupButtonWrapper").unbind('click', textbox.dropDownClickHandle);
                    if (isFromDropDown) {
                        usage_flow({ 'flow': 'history', 'progress': 'progress', usage: { 'name': 'SEARCHBOX_OPEN_SUGGEST'} });
                    }
                    conduit.app.popup.onClosed.addListener(historyPopupId, function (popupId, sender, calback) {
                        sdk.log.info({ 'data': { 'popupId': popupId }, 'method': 'openInformationPopup/doOpen/popup.onClosed callback', 'type': 'global' });
                        setTimeout(function () {
                            $("#infoPopupButtonWrapper").click(textbox.dropDownClickHandle);
                        }, 500);
                        historyPopupId = undefined;
                        isHistoryMenuOpen = false;

                        if (isFromDropDown) {
                            usage_flow({ 'flow': 'history', 'progress': 'submit', usage: { 'name': 'SEARCHBOX_OPEN_SUGGEST'} });
                        }
                        captionValue = '';
                        resultType = '';
                        searchTextBoxWrapper.removeClass('active_no_radius');
                        searchTextBoxWrapper.removeClass('active');
                        searchTextBox.removeClass('active_no_radius');
                        searchTextBox.removeClass('active');
                        $("#infoPopupButtonWrapper").removeClass('active_no_radius');
                        $("#infoPopupButtonWrapper").removeClass('active');
                        searchTextBoxWrapper.css('border-right-color', '#a5a5a5');

                        setTimeout(function () {
                            isHistoryMenuOpen = false;
                        }, 100);
                        if (calback) {
                            calback()
                        }
                    });
                });
            }
            else {
                sdk.log.info({ 'method': 'openInformationPopup/doOpen BUT NOT before openPopup', 'type': 'global' });
                postTopicMessage("getSearchValueResponse", searchTextBox.val());
            }
        }; //function
        var q = {
            term: searchTextBox.val()
            , source: 'searchbox'
            , needdata: false,
            showSuggest: bShowSuggest
        }
        var taskinfo=taskmanager.create(function (result) {
            sdk.log.info({ 'method': 'sendRequest[content-manager:hasContent]', 'type': 'global/openInformationPopup' });
            if (typeof result == 'string') {
                result = JSON.parse(result);
            }

            if (!result.hasContent) {
                sdk.log.info({ 'text': 'Omit open search.suggest popup - is no history items ', 'method': 'sendRequest[historyStorageManager]', 'type': 'global/openInformationPopup' });
                return;
            }

            bOpenPopup = true;
            doOpen();
        });
        sendRequest("backgroundPage", "content-manager:content", q, taskinfo.task);
    };
    //-----------------------------------------------------

    var updateSearchSettings = function (callback) {
        sdk.log.info({ 'method': 'updateSearchSettings', 'type': 'global' });
        var obj = {};
        obj.logicalSender = "onUpdateSearchSettings";
        obj.result = getViewSettings();
        sendRequest("backgroundPage", "actionFromEmbdded", JSON.stringify(obj), callback || $.noop);
    };

    var getViewSettings = function () {
        sdk.log.info({ 'method': 'getViewSettings', 'type': 'global' });
        var data = {};
        data.embeddedWidth = main.outerWidth(true);
        data.textBoxWrapperWidth = searchTextBoxWrapper.outerWidth(true);
        data.searchTextBoxValue = searchTextBox.attr('value');
        return data;
    };

    var addAppsSearchEngine = function (settings) {
        sdk.log.info({ 'method': 'addAppsSearchEngine', 'type': 'global' });
        var newObgSearch = {};
        newObgSearch.bgText = null;
        newObgSearch.canBeDefault = false;
        newObgSearch.caption = transObj.appSearch;
        newObgSearch["default"] = false;
        newObgSearch.emptySearchUrl = "";
        newObgSearch.inputCharset = "UTF-8";
        newObgSearch.origin = "EB";
        newObgSearch.majorDefault = false;
        newObgSearch.postParams = null;
        newObgSearch.prefix = "http://apps.conduit.com/search?q=UCM_SEARCH_TERM&SearchSourceOrigin=29&ctid=EB_CTID&octid=EB_ORIGINAL_CTID";
        newObgSearch.searchTermToReplace = "UCM_SEARCH_TERM";
        newObgSearch.suggestUrl = null;
        newObgSearch.type = null;
        newObgSearch.uniqueCompId = "300";
        newObgSearch.uniqueId = "300";
        newObgSearch.imageUrl = "../../../al/wa/SEARCH/resources/menu.icon.apps.png";
        return newObgSearch;
    };

    var Search_Menu_Engines = new function () {
        sdk.log.info({ 'method': 'Search_Menu_Engines', 'type': 'global' });
        var settings = null;
        var prepareMenuData = function (menuData) {
            var buttonWidth = $("#engineWrapperContainer").outerWidth(true) - 1;
            var menuStruct = { data: { buttonWidth: buttonWidth, menu: { data: { items: []}}} },
                getMenuItemData = function (menuItem) {
                    var imgUrl = (menuItem.imageUrl == "@IMAGE_URL@")
                        ? defaultEngineIconSrc
                        : menuItem.imageUrl;
                    return {
                        "appType": "MENU_ITEM",
                        "data": {
                            "caption": menuItem.caption,
                            "iconUrl": imgUrl,
                            "data": {
                                "command": {
                                    "data": $.extend(menuItem, { viewId: getViewId(), engineId: menuItem.uniqueCompId }),
                                    "type": "WEBAPP_COMMAND"
                                },
                                "type": "COMMAND"
                            }
                        }
                    };
                };

            for (var i = 0; i < menuData.length; ++i) {
                menuStruct.data.menu.data.items.push(getMenuItemData(menuData[i]));
            }
            menuStruct.data.menuApp = 'search';
            return menuStruct;
        };
        var openMenu = function (menuCallback) {
            if (isSearchMenuOpen) {
                sdk.log.info({ 'text': 'menu is already open omit open request', 'method': 'openMenu', 'type': 'Search_Menu_Engines' });
                return;
            }
            var objPos = {};
            objPos.top = -5;
            objPos.left = Math.ceil($("#engineWrapperContainer").offset().left) + 1; // add  +1 for border
            if (direction === "left") {
            } else {
                objPos.right = -($("#main").outerWidth(true) - $('#engineWrapperContainer').outerWidth(true));
            }
            var menu = prepareMenuData(settings.data.listOfSearchEngines.searchEngine),
                currentAppData = {
                    appId: conduit.currentApp.appId,
                    windowId: conduit.currentApp.windowId,
                    viewId: conduit.currentApp.viewId,
                    position: objPos
                };
            conduit.app.menu.open(menu, currentAppData, menuCallback, function () { /*fFail*/ });
        };
        var initSettings = function (result) {
            settings = result;
        };
        var openMenuCallback = function (menuId) {
            sdk.log.info({ 'method': 'openMenuCallback', 'type': 'Search_Menu_Engines' });
            function changeStyleToNormal() {
                $("#engineWrapperContainer").removeClass('active');
                $('#engineText').css(config.view.style.engine.active);
                $("#enginesPopupButtonWrapper").addClass("hover");
                $("#imageTextWrapperContainer").addClass("active_border");
                searchTextBoxWrapper.css('border-right-color', '#a5a5a5');
                setTimeout(function () {
                    $("#engineWrapperContainer").removeClass('active');
                    $('#engineText').css(config.view.style.engine.active);
                    $("#textboxWrapper").css('border-right-color', '#a5a5a5');
                }, 30);
            };
            function changeStyleToActive() {
                $("#enginesPopupButtonWrapper,#enginesPopupButton").removeClass("active");
                $("#engineWrapperContainer").addClass("active");
                $("#enginesPopupButtonWrapper").removeClass("hover");
                $("#imageTextWrapperContainer").removeClass("active_border");
                $('#engineText').css({ 'color': 'black' });
            };

            isSearchMenuOpen = true;
            menuTempId = menuId;

            conduit.app.menu.onClose.addListener(menuId, function (result, sender, callback) {
                sdk.log.info({ 'method': 'menu.onClose listener ', 'type': 'Search_Menu_Engines' });
                isSearchMenuOpen = false;
                menuTempId = null;
                usage_flow({ 'flow': 'engine', 'progress': 'submit', usage: { 'name': 'SEARCHBOX_OPEN_ENGINES_MENU'} });
                changeStyleToNormal();
                callback && callback();

            });

            changeStyleToActive();

            var dataObj = {};
            dataObj.logicalSender = "onMenuOpen";
            dataObj.result = String(menuId);
            sendRequest("backgroundPage", "actionFromEmbdded", JSON.stringify(dataObj), $.noop);

            usage_flow({ 'flow': 'engine', 'progress': 'open', usage: { 'name': 'SEARCHBOX_OPEN_ENGINES_MENU'} });

        };
        var onSearchEngineMenuClick = function (e) {
            if (!e) var e = window.event;
            //e.cancelBubble = true;
            //if (e.stopPropagation) e.stopPropagation();
            if (e.which === 1) {
                openMenu(openMenuCallback);
            }
        };
        var updateLanguage = function () {
            if (!settings) { return; }
            var appEng = settings.data.listOfSearchEngines.searchEngine[settings.data.listOfSearchEngines.searchEngine.length - 1];
            if (appEng && appEng.uniqueId == '300') {
                appEng.caption = transObj.appSearch;
            }
        };
        return { openMenu: openMenu, init: initSettings, onClick: onSearchEngineMenuClick, updateLanguage: updateLanguage };
    };

    var setTextBoxAndTextBoxWrapperWidth = function (result) {
        sdk.log.info({ 'method': 'setTextBoxAndTextBoxWrapperWidth', 'type': 'global' });
        if (result.searchTextBoxValue === null || !result.searchTextBoxValue) {
            result.searchTextBoxValue = '';
        }
        searchTextBox.attr('value', result.searchTextBoxValue);
    };

    var updateSearchSettingsView = function (result, sender, callback) {
        sdk.log.info({ 'method': 'updateSearchSettingsView', 'type': 'global' });
        try {
            result = JSON.parse(result);
        }
        catch (e) {
            conduit.logging.logDebug('Search/view.js/updateSearchSettingsView - received wrong result: ' + result);
        }
        if (browserType == "Firefox" && currentWindowId != result.windowId) {
            setTextBoxAndTextBoxWrapperWidth(result);
        } else if (browserType == "IE" || browserType == "Chrome") {
            if (typeof (result.tabId) !== 'undefined' && parseInt(result.tabId) !== parseInt(currentTabId)) {
                setTextBoxAndTextBoxWrapperWidth(result);
            }
        }
    };

    var setHistoryState = function () {
        sdk.log.info({ 'method': 'setHistoryState', 'type': 'global' });

        var optionKeys = {
            enableHistory: 'ENABALE_HISTORY',
            disableHistory: 'DISABLE_HISTORY'
        };
        getGlobalKey(optionKeys.enableHistory, function (result) {

            try {
                result = JSON.parse(result);
            }
            catch (e) {
                conduit.logging.logDebug('Search/view.js/setHistoryState - received wrong result: ' + result);
                result = null;
            }



            if (result && result.data.toString() == "true") {
                initUiOptions(optionKeys.enableHistory);
            } else {
                initUiOptions(optionKeys.disableHistory);
            }
        }, function (e) {
            initUiOptions(optionKeys.disableHistory);
        });
    };

    var initUiOptions = function (key) {
        sdk.log.info({ 'method': 'initUiOptions', 'type': 'global' });

        var optionsInvoker = {
            'ENABALE_HISTORY': function () {
                $("#infoPopupButtonWrapper").css('display', 'table-cell');
                $("#infoPopupButton").css('display', 'block');

            },
            'DISABLE_HISTORY': function () {
                $("#infoPopupButtonWrapper").css('display', 'none');
                $("#infoPopupButton").css('display', 'none');
            }
            // TODO: save state
        };
        if (typeof (optionsInvoker[key]) !== 'function') {
            throw new TypeError('No such a function to invoke from search option');
        }
        optionsInvoker[key]();
    };

    function usage_navigate_from_search() {
        conduit.logging.usage.log('SEARCHBOX_NAVIGATE', { "searchUrl": query, "elementId": '1000009' }); //TODO: need to find out what is elementId
    }

    var executeSearch = function (query, viewId, newTab, isEnter) {

        conduit.logging.logDebug('SearchApp/Embeded/ - executeSearch(query=[{0}], viewId=[{1}], newTab=[{2}], isEnter=[{3}]) '.format(query, viewId, newTab, isEnter));
        sdk.log.info({ 'data': { 'arguments': arguments }, 'method': 'executeSearch', 'type': 'global' });

        taskmanager.purge();

        //closing popoup when making search
        historyPopupId && closePopup(historyPopupId);

        var queryTmp = query.trim();
        //search with spaces
        if ((queryTmp.length - query.length) < 0) {
            query = queryTmp;
        }
        // only execute search if there's a query
        var executeSearchData = {
            'query': query,
            'engine': selectedEngineId,
            'viewId': viewId,
            'newTab': newTab,
            //'sourceUsage':'SEARCH_SOURCE_GO_BUTTON'
            'sourceUsage': (isEnter) ? 'SEARCH_SOURCE_VK_RETURN' : 'SEARCH_SOURCE_GO_BUTTON'
        };

        if (suggestValue != '') {
            executeSearchData.suggest = suggestValue;
            suggestValue = '';
        }

        if (sourceValue != '') {
            executeSearchData.source = sourceValue;
            sourceValue = '';
        }

        /*if (isEnter) {
         executeSearchData.sourceUsage = 'SEARCH_SOURCE_VK_RETURN';
         }*/
        var obj = {};
        obj.result = executeSearchData;
        obj.logicalSender = 'executeSearch';
        sdk.log.info({ 'text': 'SearchApp/Embeded - executeSearch - send request to bg.page', 'data': { 'msg-data': obj }, 'method': 'executeSearch', 'type': 'global' });
        conduit.logging.logDebug('SearchApp/Embeded - executeSearch - send request to bg.page');
        sendRequest('backgroundPage', 'actionFromEmbdded', JSON.stringify(obj), $.noop);
    };

    // UI objects
    var textbox = new function () {
        var searchTextBoxWidth;
        var textboxWidthDifference;
        var minTextboxWidth;
        var maxTextBoxWrapperWidth;
        var activeClass = "active";
        //var hoverClass = "hover";

        var initTextBoxValue = function () {
            sdk.log.info({ 'method': 'initTextBoxValue', 'type': 'global' });
            var dataObj = {};
            dataObj.logicalSender = "getLastSearchValue";
            dataObj.result = ';-)';
            sendRequest('backgroundPage', 'actionFromEmbdded', JSON.stringify(dataObj), function (result) {
                if (!result) {
                    return;
                }
                if (typeof (result) == 'string') {
                    try {
                        result = JSON.parse(result);
                    }
                    catch (ex) {
                        return;
                    }
                }
                var type = typeof (result);
                if (type != 'object') {
                    return;
                }
                if (result.textBoxValue && result.textBoxValue.length) {
                    searchTextBox.attr('value', result.textBoxValue);
                }
            });
        };
        var initDynamicCss = function (settings) {
            sdk.log.info({ 'data': { 'settings': settings }, 'method': 'textbox/initDynamicCss', 'type': 'global' });
            try {
                if (settings && settings.design) {
                    config.view.style.engine.active.color = (settings.design.fontColor) ? settings.design.fontColor : config.view.style.engine.preset.color;
                    config.view.style.engine.active.fontFamily = (settings.design.fontFamily) ? settings.design.fontFamily : config.view.style.engine.preset.fontFamily;
                    config.view.style.engine.active.fontWeight = (settings.design.fontWeight) ? settings.design.fontWeight : config.view.style.engine.preset.fontWeight;
                    config.view.style.engine.active.fontStyle = (settings.design.fontStyle) ? settings.design.fontStyle : config.view.style.engine.preset.fontStyle;
                    config.view.style.engine.active.fontSize = (settings.design.fontSize) ? settings.design.fontSize : config.view.style.engine.preset.fontSize;
                }

                config.view.style.active.backgroundColor = ("#FFFFFF" == settings.data.bgColor.toUpperCase()) ? config.view.style.active.backgroundColor : settings.data.bgColor;

                $('#engineText').css(config.view.style.engine.active);

                $("#infoPopupButtonWrapper").css('background', config.view.style.active.backgroundColor);
                $("#textboxWrapper").css('background', config.view.style.active.backgroundColor);
                var dynamicCss = {
                    'color': sdk.ui.util.idealTextColor(config.view.style.active.backgroundColor)
                    , 'background': config.view.style.active.backgroundColor
                    , 'minWidth': config.view.textbox.minWidth
                    //, 'maxWidth': config.view.textbox.maxWidth
                };
                searchTextBox.css(dynamicCss);
            } catch (e) {
                sdk.log.error({ 'text': 'error', data: { 'exception': e }, 'method': 'textbox/initDynamicCss', 'type': 'global' });
            }
            sdk.log.info({ 'text': 'call conduit.platform.getInfo', 'method': 'textbox/initDynamicCss', 'type': 'global' });
            conduit.platform.getInfo(function (data1) {
                sdk.log.info({ 'text': 'conduit.platform.getInfo callback', 'data': data1, 'method': 'textbox/initDynamicCss', 'type': 'global' });
                config.platform = data1.platform;
                browserType = data1.platform.browser;
                browserVersion = data1.platform.browserVersion;
                switch (direction) {
                    case "left":
                        break;
                    case "right":
                        break;
                } //switch
            });
        };
        var initMembers = function () {
            searchTextBoxWidth = searchTextBox.width();
            maxTextBoxWrapperWidth = 300;
            textboxWidthDifference = 15;
            minTextboxWidth = 137;
        };

        var dropDownClickHandle = function (e) {
            e.preventDefault();
            if ($('#main').hasClass("hoverAll")) {
                $('#main').removeClass("hoverAll");
            }
            if (!searchTextBoxWrapper.hasClass('active_no_radius')) {
                searchTextBox.addClass('active_no_radius');
            }
            $("#infoPopupButtonWrapper").addClass('active');
            if (!(config.view.style.preset.backgroundColor === config.view.style.active.backgroundColor)) {
                $("#infoPopupButtonWrapper").css('background', config.view.style.active.backgroundColor);
            }
            onDropdownArrowClicked(e, 'textbox');
        };

        var initUiEvents = function () {
            //infoPopupButton.click(function (e) {// set click to whole cell roee ovadia 22.1.12
            $("#infoPopupButtonWrapper").click(dropDownClickHandle);

            main.mouseover(function () {
                if (!searchTextBoxWrapper.hasClass('active_no_radius')) {
                    $('#main').addClass('hoverAll');
                }
            });
            main.mouseout(function () {
                $('#main').removeClass('hoverAll');
            });

            searchTextBox.click(function(e){
                sdk.log.info({'method':'textbox/searchTextBox:click', 'type':'global'});
                onDropdownArrowClicked(e, 'textbox');
            });


            searchTextBox.focusout(function () {
                searchTextBox.removeClass('at-focus');
                searchTextBox.attr('disabled', 'disabled').removeAttr('disabled');
                $(document.body).focus();
            });

            searchTextBox.on('paste',function(event){
                sdk.log.info({ method:'textbox/paste', 'type': 'global' });
                setTimeout(function(){
                    var obj = {};
                    obj.logicalSender = 'updateLiveSearchTerm';
                    obj.result = searchTextBox.val() || "";
                    sendRequest("backgroundPage", "actionFromEmbdded", JSON.stringify(obj), $.noop);
                },100);
            });


            searchTextBox
                .focus(
                function (e) {
                    sdk.log.info({'text':'text input gain focus', 'method':'textbox/searchTextBox:focus', 'type':'global'});
                    searchTextBox.addClass('at-focus');
                    if (testTextWidth) { testTextWidth.text(''); }

                    $('#main').removeClass('hoverAll');
                    $('#main').removeClass('active');

                    searchTextBoxWrapper.addClass('active_border_class');
                    $("#engineWrapperContainer").addClass('active_border_class');
                    searchTextBoxWrapper.addClass(activeClass);
                    searchTextBox.addClass(activeClass);
                    $("#infoPopupButtonWrapper").addClass('active_border_class');
                    $("#infoPopupButtonWrapper").addClass(activeClass);

                }
            )
                .focusout(
                function (e) {
                    sdk.log.info({'text':'focus is bloored from text input', 'method':'textbox/searchTextBox:focusout', 'type':'global'});
                    //this.selectionStart = this.selectionEnd = -1;
                    searchTextBox.val(searchTextBox.val());
                    if (document.selection){
                        document.selection.empty();
                    }else						{
                        window.getSelection && window.getSelection().removeAllRanges && window.getSelection().removeAllRanges();
                    }
                    if (!searchTextBoxWrapper.hasClass('active_no_radius')) {
                        searchTextBoxWrapper.removeClass('active_border_class');
                        $("#engineWrapperContainer").removeClass('active_border_class');
                        searchTextBoxWrapper.removeClass(activeClass);
                        searchTextBox.removeClass(activeClass);
                        $("#infoPopupButtonWrapper").removeClass(activeClass);
                        $("#infoPopupButtonWrapper").removeClass('active_border_class');
                    }
                    $(document.body).focus();

                }
            );
            $("#engineWrapperContainer").mouseover(function () {
                if ($("#engineWrapperContainer").hasClass('active')) {
                    return;
                }
                $("#imageTextWrapperContainer").addClass("active_border");
            });
            $("#engineWrapperContainer").mouseout(function () {
                $("#imageTextWrapperContainer").removeClass("active_border");
            });
            $("#imageTextWrapperContainer").mouseover(function () {
                if ($("#engineWrapperContainer").hasClass('active')) {
                    return;
                }
                $("#imageTextWrapperContainer").addClass("hover");
                $(this).mousedown(function () {
                    $("#imageTextWrapperContainer").addClass("active");
                    $("#imageTextWrapperContainer").mouseout(function () {
                        $("#imageTextWrapperContainer").removeClass("active");
                    });
                });
                $(this).mouseup(function () {
                    $("#imageTextWrapperContainer").removeClass("active");
                });
            });
            $("#imageTextWrapperContainer").mouseout(function () {
                $("#imageTextWrapperContainer").removeClass("hover");
            });
            $("#enginesPopupButtonWrapper").mouseover(function () {

                if ($("#engineWrapperContainer").hasClass('active')) {
                    return;
                }
                $("#enginesPopupButtonWrapper").addClass("hover");

                $("#enginesPopupButtonWrapper").mouseout(function () {
                    $("#enginesPopupButtonWrapper").removeClass("active");
                });
            });
            $("#enginesPopupButtonWrapper").mousedown(function (e) {
                $("#enginesPopupButtonWrapper,#enginesPopupButton").addClass("active");

                if (!e) var e = window.event;
                if (e.which !== 1) {
                    return;
                }
            });
            $("#enginesPopupButtonWrapper").mouseout(function () {
                $("#enginesPopupButtonWrapper").removeClass("hover");
            });

            var sbKeyUpHandler = function (event) {
                var key = event.keyCode || event.which;
                var keyInt = parseInt(key, 10);

                searchTextBox.addClass('at-focus');
                sdk.log.info({ 'text': 'keycode is {0} historyPopupId = {1}'.format(keyInt, historyPopupId), 'method': 'textbox/onkeyup', 'type': 'global' });
                if (keyInt === 13) { // 'enter' key
                    sdk.log.info({ 'text': ' [enter] pressed', 'method': 'textbox/onkeyup', 'type': 'global' });
                    // execute search
                    //TODO : cause to error log in IE8 check this issue
                    //if (event.stopPropagation) event.stopPropagation();

                    executeSearch((captionValue == "") ? searchTextBox.val() : captionValue, getViewId(), false, true);
                    //  historyPopupId && closePopup(historyPopupId);
                }
                else if (keyInt === 27) { // esc

                    try {
                        sdk.log.info({ 'text': ' [esc] pressed - close info popup', 'method': 'textbox/onkeyup', 'type': 'global' });
                        historyPopupId && closePopup(historyPopupId);
                    } catch (e) {
                    }
                }
                else if (keyInt === 38 || keyInt === 40) { // arrows up and down
                    sdk.log.info({ 'text': ' [Arrow up|down] pressed ', 'method': 'textbox/onkeyup', 'type': 'global' });
                    event.type = 'ArrowClick';
                    if (!isHistoryMenuOpen) {
                        onkeyUpClicked(event, 'textbox');
                    } else {
                        postTopicMessage("ArrowClicked", '' + keyInt)
                    }
                }
                else if (keyInt === 8 || keyInt === 46) { // backspace=8 or delete keys
                    sdk.log.info({ 'text': ' [backspace| delete] pressed ', 'method': 'textbox/onkeyup', 'type': 'global' });
                    // narrow the textbox if not passed minimum textbox width
                    if (searchTextBox.val() != "") {
                        if (historyPopupId) {
                            postTopicMessage("getSearchValueResponse", searchTextBox.val());
                        } else {
                            onkeyUpClicked(event, 'textbox');
                        }
                    } else {
                        if (historyPopupId) {
                            sdk.log.info({ 'text': 'call to close popop', 'method': 'textbox/onkeyup', 'type': 'global' });
                            closePopup(historyPopupId);
                        } else {
                            sdk.log.info({ 'text': 'no historyPopupId no close pop BUG ', 'method': 'textbox/onkeyup', 'type': 'global' });
                        }
                    }
                } else {
                    if (isCharacterKeyPress(event)) {
                        sdk.log.info({ 'text': 'historyPopupId =' + historyPopupId, 'method': 'textbox/onkeyup/historyPopupId', 'type': 'global' });
                        if (!historyPopupId) {
                            onkeyUpClicked(event, 'textbox');
                        } else {
                            sdk.log.info({ 'text': 'in else', 'data': { 'searchTextBox.val': searchTextBox.val() }, 'method': 'textbox/onkeyup', 'type': 'global' });
                            postTopicMessage("getSearchValueResponse", searchTextBox.val());
                        }
                    }
                }
                //Update the search term onkeyup for conduit.platform.getTerm
                //sent topic to webAppApi for search
                conduit.advanced.messaging.postTopicMessage("onSearchTextChanged", searchTextBox.val());
                var dataObj = {};
                dataObj.viewId = getViewId();
                dataObj.value = searchTextBox.val();
                postTopicMessage("onSearchTextChanged", JSON.stringify(dataObj));
                var obj = {};
                obj.logicalSender = 'updateLiveSearchTerm';
                obj.result = searchTextBox.val() || "";
                sendRequest("backgroundPage", "actionFromEmbdded", JSON.stringify(obj), $.noop);
            };

            var keyupTimeoutId = 0;
            searchTextBox.keyup(function (event) {
                var getHandler = function () {
                    var key = event.keyCode || event.which;
                    var ev = {};
                    ev.keyCode = key;
                    ev.which = event.which;
                    ev.type = event.type;
                    ev.ctrlKey = event.ctrlKey;
                    ev.metaKey = event.metaKey;
                    ev.altKey = event.altKey;
                    return function () {
                        sbKeyUpHandler(ev);
                        keyupTimeoutId = 0;
                    };
                }
                if (keyupTimeoutId) {
                    clearTimeout(keyupTimeoutId);
                    keyupTimeoutId = 0;
                }
                keyupTimeoutId = setTimeout(getHandler(), 100);
            });
        };

        var initApiEvents = function () {
            sdk.log.info({ 'method': 'initApiEvents', 'type': 'global/textbox' });

            addTopicListener("clearHistory", function () {
                searchTextBox.val("");
            });
            addTopicListener('setEmbededTextBoxValue', changeTextBoxValue);
            addTopicListener("updateSearchSettings", updateSearchSettingsView);
            /*addTopicListener("getSearchValue", function (result, sender) {
             sdk.log.info({'method':'getSearchValue event', 'type':'global/textbox'});
             postTopicMessage("getSearchValueResponse", searchTextBox.val());
             });*/
            addTopicListener("captionValueChanged", function (result, sender) {

                if (!typeof (result) && result == null) {
                    return;
                }

                try {
                    result = JSON.parse(result);
                }
                catch (e) {
                    conduit.logging.logDebug('Search/view.js/initApiEvents - received wrong data: ' + result);
                }

                if(typeof(result) != 'object'){
                    return;
                }

                if (result.hasOwnProperty('captionValue') && typeof (result.captionValue) == 'string') {
                    captionValue = result.captionValue.toString();
                    searchTextBox.val(result.captionValue.toString());
                }

                if (result.hasOwnProperty('suggest') && typeof (result.suggest) == 'string') {
                    suggestValue = result.suggest;
                }

                if (result.hasOwnProperty('source') && typeof (result.source) == 'string') {
                    sourceValue = result.source;
                }

            });
            addTopicListener("onSearchTextChanged", function (data) {
                try {
                    data = JSON.parse(data);
                }
                catch (e) {
                    conduit.logging.logDebug('Search/view.js/initApiEvents - received wrong data: ' + data);
                }
                if (data.viewId !== getViewId()) {
                    changeTextBoxValue(data.value);
                }
            });
            addAdvanceTopicListener('conduit-toolbar-view-layout-change', function (argv) {
                sdk.log.info({ 'data': { 'arguments': arguments }, 'method': 'conduit-toolbar-view-layout-change event', 'type': 'global/textbox' });
                config.view.cache.data.view.width = bodyRef.width();
                stateHandler.save();
            });
            addAdvanceTopicListener('update_search_options', function (responseobj) {
                sdk.log.info({ 'method': 'update_search_options event', 'type': 'global/textbox' });
                setHistoryState();
            });
        };


        var isCharacterKeyPress = function (evt) {
            // http://stackoverflow.com/questions/4194163/detect-printable-keys
            if (typeof evt.which == "undefined") {
                // This is IE, which only fires keypress events for printable keys
                return true;
            } else if (typeof evt.which == "number" && evt.which > 0) {
                // In other browsers except old versions of WebKit, evt.which is
                // only greater than zero if the keypress is a printable key.
                // We need to filter out backspace and ctrl/alt/meta key combinations
                return !evt.ctrlKey && !evt.metaKey && !evt.altKey && evt.which != 8 && evt.which != 13;
            }
            return false;
        };

        var addToTextboxWidth = function (widthToAdd) {
            if (searchTextBoxWrapper.width() + widthToAdd > maxTextBoxWrapperWidth) {
                return;
            }
            var textBoxWrapperNewWidth;
            var mainWidth = main.outerWidth(true) + widthToAdd;
            if (searchTextBoxWrapper.width() + widthToAdd < minTextboxWidth) {
                textBoxWrapperNewWidth = (minTextboxWidth / mainWidth) * 100;
                return;
            } else {
                textBoxWrapperNewWidth = ((parseInt(searchTextBoxWrapper.outerWidth(true)) + parseInt(widthToAdd)) / main.outerWidth(true)) * 100;
            }
            searchTextBoxWrapper.css('width', textBoxWrapperNewWidth + "%");
            if (mainWidth < 320) {
                //setEmm({ width:mainWidth });
            }
        };

        var getTextWidth = function (text) {
            testTextWidth.html(text);
            return testTextWidth.outerWidth(true);
        };

        var changeTextBoxValue = function (result) {
            sdk.log.info({ 'data': { 'result': result }, 'method': 'init', 'type': 'global/textbox' });
            result = typeof (result) == 'string' ? result : '';
            if (!$("#textbox").hasClass("at-focus")) {
                searchTextBox.attr('value', result)
            }
        };

        var empty = function () {
            changeTextBoxValue(stringEmpty);
        };

        var init = function (settings,refresh) {
            sdk.log.info({ 'method': 'init', 'type': 'global/textbox' });
            initDynamicCss(settings);
            initMembers();
            (!refresh) && initUiEvents();
            (!refresh) && initApiEvents();

            initTextBoxValue();
        };
        return {
            "init": init,
            "empty": empty,
            "initUiEvents": initUiEvents
            , "dropDownClickHandle": dropDownClickHandle
        };
    };

    var engineContainer = new function () {
        var defaultEngineId = 0;
        var searchActiveCaption = "";
        var iconSearchActivateIsMirrorOnRtl;
        var searchActiveIcon = "";
        var showDefaultFlag = 'ENABLE_RETURN_WEB_SEARCH_ON_THE_PAGE';
        var executeSearchCallback = function (e) {
            if (!e) var e = window.event;
            e.cancelBubble = true;
            if (e.stopPropagation) e.stopPropagation();
            executeSearch(searchTextBox.attr('value'), getViewId(), false);
        };
        var initUiEvents = function () {
            enginesPopupButtonWrapper.mouseup().mousedown(Search_Menu_Engines.onClick);
            $('#imageTextWrapperContainer').on('click', executeSearchCallback);
        };
        var setEngine = function (setEngineData) {
            sdk.log.info({ 'data': { 'setEngineData': setEngineData }, 'method': 'setEngine', 'type': 'global/engineContainer' });
            if (typeof setEngineData !== "object") {
                return;
            }
            if (!engines[setEngineData.engineId]) {
                return;
            }
            selectedEngineId = setEngineData.engineId;
            setEngineUi(engines[setEngineData.engineId]);
        };
        var onEngineSelected = function (engineSelectedData) {
            sdk.log.info({ 'data': { 'engineSelectedData': engineSelectedData }, 'method': 'onEngineSelected', 'type': 'global/engineContainer' });
            // If the engine selection came from our tab, execute search
            try {
                engineSelectedData = JSON.parse(engineSelectedData);
            }
            catch (e) {
                conduit.logging.logDebug('Search/view.js/onEngineSelected - received wrong data: ' + engineSelectedData);
            }
            var doSelectedEngineAndNewTabSearch = (engineSelectedData.engineId != selectedEngineId);
            $(this).css({
                "border": "1px solid #5e6264"
            });
            if (doSelectedEngineAndNewTabSearch) {
                setEngine(engineSelectedData);
            }
            /*if (engineSelectedData.viewId === getViewId()) {
             if (searchTextBox.val().trim().length > 0) {
             executeSearch(searchTextBox.val(), getViewId(), doSelectedEngineAndNewTabSearch);
             }
             } */
        };
        var onGetSelectedEngineId = function (data, sender, callback) {
            callback(JSON.stringify({
                "selectedEngineId": selectedEngineId
            }));
        };

        var initApiEvents = function () {
            addTopicListener("engineSelected", onEngineSelected);
            addListener("getSelectedEngineId", onGetSelectedEngineId);
        };

        var flipImageCallback = function (url) {
            if (navigator.userAgent.toLowerCase().indexOf("chrome") !== -1) {
                engineImage.css("-webkit-transform", "scaleX(-1)");
            } else if (navigator.userAgent.toLowerCase().indexOf("firefox") !== -1) {
                engineImage.css("-moz-transform", "scaleX(-1)");
            } else if (navigator.userAgent.toLowerCase().indexOf("msie 9") !== -1) {
                engineImage.css("-ms-transform", "scaleX(-1)");
            } else if (navigator.userAgent.toLowerCase().indexOf("msie 8") !== -1 || navigator.userAgent.toLowerCase().indexOf("msie 7") !== -1) {
                engineImage.css("filter", "progid:DXImageTransform.Microsoft.Matrix(sizingMethod='auto expand',M11=-1);");
            }
        };

        var flipImageCallbackReverse = function (url) {
            if (navigator.userAgent.toLowerCase().indexOf("chrome") !== -1) {
                engineImage.css("-webkit-transform", "scaleX(1)");
            } else if (navigator.userAgent.toLowerCase().indexOf("firefox") !== -1) {
                engineImage.css("-moz-transform", "scaleX(1)");
            } else if (navigator.userAgent.toLowerCase().indexOf("msie 9") !== -1) {
                engineImage.css("-ms-transform", "scaleX(1)");
            } else if (navigator.userAgent.toLowerCase().indexOf("msie 8") !== -1 || navigator.userAgent.toLowerCase().indexOf("msie 7") !== -1) {
                engineImage.css("filter", "progid:DXImageTransform.Microsoft.Matrix(sizingMethod='auto expand',M11=1);");
            }
        };
        var setEngineUi = function (engineData) {
            sdk.log.info({ 'data': { 'engineData': engineData }, 'method': 'setEngineUi', 'type': 'global/engineContainer' });
            if (!engineData) {
                engineData = engines[defaultEngineId];
            }

            var isMajorDefault = !!((engineData.majorDefault == true));

            var eIcon = (isMajorDefault) ? searchActiveIcon : engineData.imageUrl;
            var eLabel = (isMajorDefault) ? searchActiveCaption : engineData.caption;

            if (engineData.majorDefault == true) {
                bShowSuggest = true
            } else {
                bShowSuggest = false
            }

            /* replace image tag html instead of src rewriting due Firefox not update img.comple in such case regardless to image state */
            var template = '<img style="display: block" id="engineImage" alt="" src="{0}" style="height: auto,padding-top:0px" onerror="javascript: this.src=\'http://storage.conduit.com/images/searchengines/go_btn_new.gif\'" />';
            $('#engineWrapper').html(template.format(eIcon));
            engineImage = $('#engineImage');

            if (direction === "right" && iconSearchActivateIsMirrorOnRtl) {
                flipImageCallback();
            }
            engineText.text(eLabel);
            engineText.attr('title', eLabel);
            if (isNull(eLabel)) {
                engineTextWrapper.css('display', 'none');
            } else {
                engineTextWrapper.css('display', 'table-cell');
            }

            imagesOnLoad(
                function () {
                    sdk.log.info({ 'method': 'setEngineUi - imagesOnLoad callback', 'type': 'global/engineContainer' });
                    if (parseInt(engineImage.css('height')) > 20) {
                        engineImage.css('height', '20px');
                    }
                    document.getElementById('engineImage').style.display = 'block';
                    document.getElementById('engineWrapper').style.display = 'table-cell';
                    //setEmm({ width:$("#main").outerWidth(true) });
                    setEmm();

                    if (!hasState) {
                        hasState = true;
                        stateHandler.saveFirstState();
                    }
                }
            );
        };
        var initEngines = function (settings) {
            sdk.log.info({ 'data': { 'settings': settings }, 'method': 'initEngines', 'type': 'global/engineContainer' });
            var enginesSettings = settings.data.listOfSearchEngines.searchEngine;
            $.each(enginesSettings, function (i, engine) {
                if (i == 0) { // set the Default  defaultEngineId id all the  engines has not set to Default
                    defaultEngineId = engine.uniqueCompId;
                }

                engines[engine.uniqueCompId] = engine;
                if (engine['default']) {
                    defaultEngineId = engine.uniqueCompId;
                }
            });

            iconSearchActivateIsMirrorOnRtl = (typeof (settings.data.iconSearchActivateIsMirrorOnRtl) == 'boolean')
                ? settings.data.mirrorActivateIconOnRtl
                : true;
            searchActiveCaption = (settings.data.searchActivateCaption) ? settings.data.searchActivateCaption : '';
            searchActiveIcon = (settings.data.iconSearchActivateUrl) ? settings.data.iconSearchActivateUrl : defaultEngineIconSrc;
            setEngineUi(engines[defaultEngineId]);
            // Show the last engine the user selected if there is one
            var engine = null;
            if (hasState) {
                sdk.log.info({ 'text': 'has state - no engine set requared', 'method': 'initEngines', 'type': 'global/engineContainer' });
                return;
            }

            function getShowDefaultFlag(result) {
                sdk.log.info({ 'data': { 'result': result }, 'method': 'initEngines - getGlobalKey callback', 'type': 'global/engineContainer' });
                try {
                    result = JSON.parse(result);
                }
                catch (e) {
                    conduit.logging.logDebug('Search/view.js/getShowDefaultFlag - received wrong result: ' + result);
                    result = null;
                }
                if (!result || result.data != "true") {
                    setEngineUi(engines[defaultEngineId]);
                    return;
                }

                var obj = { 'result': ':)' };
                obj.logicalSender = 'getSelectedEngine';
                sendRequest("backgroundPage", "actionFromEmbdded", JSON.stringify(obj), function (response) {
                    try {
                        response = JSON.parse(response);
                    }
                    catch (e) {
                        conduit.logging.logDebug('Search/view.js/getShowDefaultFlag - received wrong response: ' + response);
                    }
                    selectedEngineId = response.engineId;
                    setEngineUi(engines[response.engineId]);
                });
            }

            /*
             TODO:FIX - code bellow try to implement back to default engine
             */
            getGlobalKey(showDefaultFlag, function (result) {
                getShowDefaultFlag(result);
            }, function (e) { getShowDefaultFlag(''); });
        };
        var init = function (settings,refresh) {
            initEngines(settings);
            initApiEvents();
            if(!refresh){
                initUiEvents();
            }
        };
        return {
            "init": init,
            "initUiEvents": initUiEvents
        };
    };
    var hasSettings = false;

    var checkSettings = function () {
        sdk.log.info({ 'method': 'checkSettings', 'type': 'global' });
        retrieveStorageItem('search.settings', function (result) {
            sdk.log.info({ 'data': result, 'method': 'checkSettings/StorageItem[search.settings] callback', 'type': 'global' });
            try {
                result = JSON.parse(result);
            }
            catch (e) {
                conduit.logging.logDebug('Search/view.js/checkSettings - received wrong result: ' + result);
                result = "";
            }
            if (!isNull(result) && !hasSettings) {
                hasSettings = true;

                settingsConfiguration = result;
                //isEnlargeSearchBox(result);
                result.data && isEnlargeSearchBox(result.data);
                handleSettings(result);
            }
        }, function (e) { sdk.log.info({ 'data': '', 'method': 'checkSettings/StorageItem[search.settings] callback', 'type': 'global' }); });

        sdk.log.info({ 'method': 'checkSettings/getSettingsData', 'type': 'global' });
        conduit.app.getSettingsData(function (settings) {
            sdk.log.info({ 'data': settings, 'method': 'checkSettings/getSettingsData callback', 'type': 'global' });
            if (typeof (settings) != 'object') {
                return;
            }
            if (settings.result && settings.result == "false") {
                return;
            }
            if (!hasSettings) {
                hasSettings = true;
                setStorageItem("search.settings", JSON.stringify(settings));
                /* if(settings.hasOwnProperty('data')){
                 isEnlargeSearchBox(settings.data);
                 }*/

                settings.data && isEnlargeSearchBox(settings.data);

                handleSettings(settings);
            } else {
                setStorageItem("search.settings", JSON.stringify(settings));

                if (hasDifferences(settings, settingsConfiguration)) {
                    sdk.log.info({ 'text': 'changes in setting', 'method': 'checkSettings >> hasDifferences', 'type': 'global' });
                    /* if(settings.hasOwnProperty('data')){
                     isEnlargeSearchBox(settings.data);
                     }*/

                    settings.data && isEnlargeSearchBox(settings.data);

                    refreshSettings(settings);
                }

            }
        });
    };


    var isEnlargeSearchBox = function(data) {
        var DEFAULT_OFFSET = 50;

        sdk.log.info({ 'data': { 'data': data }, 'method': 'isEnlargeSearchBox', 'type': 'global' });
        if (!data.hasOwnProperty('enlargeBox')) {
            sdk.log.info({ 'text': 'enlargeBox property not exist', 'data': { 'data': data }, 'method': 'isEnlargeSearchBox', 'type': 'global' });
            return;
        }

        if (!data.enlargeBox.hasOwnProperty('enabled') || data.enlargeBox.enabled != true) {
            sdk.log.info({ 'text': 'invalid enabled property', 'data': { 'data': data.enlargeBox }, 'method': 'isEnlargeSearchBox', 'type': 'global' });
            conduit.storage.app.items.remove("search.user-enlargeBoxSettings"); //reset the elarge search box in case it disabled
            return;
        }

        if (!data.enlargeBox.hasOwnProperty('width') || isNaN(data.enlargeBox.width)) {
            sdk.log.info({ 'text': 'invalid width property', 'data': { 'data': data.enlargeBox }, 'method': 'isEnlargeSearchBox', 'type': 'global' });
            return;
        }

        enlargeBox.enabled = data.enlargeBox.enabled;
        enlargeBox.width = data.enlargeBox.width;
        enlargeBox.minWidth = data.enlargeBox.minWidth || (data.enlargeBox.width - DEFAULT_OFFSET);
        enlargeBox.maxWidth = data.enlargeBox.maxWidth || (data.enlargeBox.width + DEFAULT_OFFSET);

        sdk.log.info({ 'data': { 'enlargeBox': enlargeBox }, 'method': 'isEnlargeSearchBox', 'type': 'global' });
    };


    var hasDifferences = function (oldObj, newObj) {
        sdk.log.info({'data':{'oldObj':oldObj,'newObj':newObj}, 'method': 'hasDifferences', 'type': 'global' });
        return JSON.stringify(oldObj) != JSON.stringify(newObj);
    };


    var refreshSettings = function (settings) {
        sdk.log.info({ 'method': 'refreshSettings', 'type': 'global' });
        handleSettings(settings,true);
    };


    var handleSettings = function (settings,refresh) {
        sdk.log.info({ 'data': settings, 'method': 'handleSettings', 'type': 'global' });
        hasSettings = true;
        if (!settings.data.listOfSearchEngines.searchEngine.length) {
            //only one engine change it to array
            var enginesSettings = [];
            enginesSettings.push(settings.data.listOfSearchEngines.searchEngine);
            settings.data.listOfSearchEngines.searchEngine = enginesSettings;
        }

        conduit.advanced.getToolbarGeneralData(function (data) {
            if (!data) {
                return;
            }
            if (!data.hasOwnProperty('myStuffEnabled') || data.myStuffEnabled) {
                var engine_data_app = addAppsSearchEngine();
                settings.data.listOfSearchEngines.searchEngine[settings.data.listOfSearchEngines.searchEngine.length] = engine_data_app;
                engines[engine_data_app.uniqueCompId] = engine_data_app;
                Search_Menu_Engines.init(settings);
            }
        });

        textbox.init(settings,refresh);
        engineContainer.init(settings,refresh);
        Search_Menu_Engines.init(settings);
    };

    var initJqueryObjects = function () {
        main = $('#main');
        searchTextBox = $('#textbox');
        searchTextBoxWrapper = $('#textboxWrapper');
        engineWrapper = $("#engineWrapper");
        engineImage = $("#engineImage");
        engineImageWrapper = $("#engineImageWrapper");
        engineText = $("#engineText");
        enginesPopupButtonWrapper = $('#enginesPopupButtonWrapper');
        infoPopupButton = $('#infoPopupButton');
        testTextWidth = $('#testTextWidth');
        imageTextWrapper = $("#imageTextWrapper");
        engineTextWrapper = $("#engineTextWrapper");
        bodyRef = $(".body");
        engineImage.attr('onerror', "javascript: this.src='{0}';".format(defaultEngineIconSrc));
    };

    var firstInitNoState = function () {
        sdk.log.info({ 'method': 'firstInitNoState', 'type': 'global' });
        conduit.tabs.getSelected(function (tabResult) {
            currentTabId = tabResult.tabId;
            currentWindowId = tabResult.windowId;
        });

        var initLocaleCallback = function (data) {
            var mainWrapperRef = $(".mainwrapper");

            if (data && data.alignMode == "RTL") {
                bodyRef.addClass("rtl");
                //ie bug
                if (!bodyRef.hasClass("rtl")) {
                    bodyRef.attr("class", "body rtl")
                }
                direction = "right";
            }

            checkSettings();

            // handle app settings
            var stepsInterval = 50;
            var total = stepsInterval * 10;
            var currentInterval = 0;
            var cInterval = setInterval(function () {
                sdk.log.info({ 'text': 'setInterval callback', 'type': 'global', 'method': 'firstInitNoState' });
                if (!hasSettings && currentInterval <= total) {
                    sdk.log.info({ 'text': '!hasSettings - wait', 'data': { 'hasSettings': hasSettings, 'currentInterval': currentInterval, 'total': total }, 'type': 'embeded.js', 'method': 'firstInitNoState - setInterval callback' });
                    currentInterval += stepsInterval;
                    return;
                }
                clearInterval(cInterval);
                // setEmm({ width:$("#main").outerWidth(true) });
                setEmm();
            }, stepsInterval);
        };
        getLocaleData(initLocaleCallback);
    };

    function initFromState(html, width) {
        sdk.log.info({ 'method': 'initFromState', 'type': 'global' });
        if (typeof (width) != 'undefined') { //set estimated width based on cached value
            config.view.dimensions.width = width;
        }
        if (typeof (html) != 'string') {
            sdk.log.info({ 'text': 'No cached view html object', 'method': 'loadUICache', 'type': 'global' });
            return false;
        }
        document.body.innerHTML = html;
        hasState = true;
        return true;
    } //function

    function loadUICache() {
        sdk.log.info({ 'method': 'loadUICache', 'type': 'global' });
        var data = conduit.app.getData();
        if (!data || !data.user) {
            sdk.log.info({ 'text': 'No state object', 'data': { 'data': data }, 'method': 'loadUICache', 'type': 'global' });
            return false;
        }
        try {
            config.view.cache.data = JSON.parse(data.user);
            stateHandler.save();
        } catch (ex) {
            sdk.log.warning({ 'text': 'Unable parse state object', 'data': data.user, 'method': 'loadUICache', 'type': 'global' });
            return false;
        }
        config.view.cache.insureSchema();
        return initFromState(config.view.cache.data.view.html, config.view.cache.data.view.width);
    }
    var appReady = false;

    var init = function(){

        if (config.view.cache.enabled) {
            loadUICache();
        }

        setHistoryState();

        initJqueryObjects();
        getStr("CTLP_STR_ID_MYSTUFF_SEARCH_ENGINE_CAPTION", function (data) {
            transObj.appSearch = data;
            Search_Menu_Engines.updateLanguage();
        });

        retrieveStorageItem('search.user-settings', function (result) {
            getSearchUserSettings(result);
        }, function (e) { getSearchUserSettings(''); });


        retrieveStorageItem('search.user-enlargeBoxSettings', function (result) {
            try {
                enlargeObjFromState = JSON.parse(result);
            }
            catch (e) {
                conduit.logging.logDebug('Search/view.js/search.user-enlargeBoxSettings - received wrong result: ' + result);
                enlargeObjFromState = "";
            }
        });


        if (hasState){
            return;
        }

        sdk.log.info({ 'text': ' No previous state load first flow ', 'method': ' $(document).ready', 'type': 'global' });

        getStr("CTLP_STR_ID_MYSTUFF_SEARCH_ENGINE_CAPTION", function (data) {
            transObj.appSearch = data;
        });



        function getSearchUserSettings(result) {
            sdk.log.info({ 'data': result, 'method': '$(document).ready/repository[user-settings]', 'type': 'global' });
            try {
                result = JSON.parse(result);
            }
            catch (e) {
                conduit.logging.logDebug('Search/view.js/getSearchUserSettings - received wrong result: ' + result);
                result = null;
            }
            var userSet = result;

            if (!userSet || !userSet.ui || !userSet.ui.splitter || !userSet.ui.splitter.width) {
                sdk.log.info({ 'data': result, 'text': 'no user settings', 'method': '$(document).ready/repository[user-settings]', 'type': 'global' });
                return;
            }
            config.user.ui.splitter.width = userSet.ui.splitter.width;
            setEmm({ 'width': config.user.ui.splitter.width });
        }


        /*retrieveStorageItem('search.user-settings', function (result) {
         getSearchUserSettings(result);
         }, function (e) { getSearchUserSettings(''); });*/


    };

    $(document).ready(function () {
        sdk.log.info({ 'method': '$(document).ready', 'type': 'global' });


        //handshake with BG page - get event from BGPage when BG uploaded
        addTopicListener("onAppReady", function () {
            sdk.log.info({ 'method': ' $(document).ready / onTopic[onAppReady]', 'type': 'global' });

            if (!appReady) {
                appReady = true;
                firstInitNoState('onAppReady');
            } else {
                sdk.log.info({ 'text': 'app allready ready', 'method': ' $(document).ready / onTopic[onAppReady]', 'type': 'global' });
            }
        });
        init();

        //handshake with BG page - send event to BGPage when view uploaded
        sendCommand("view-ready");
    });
})();