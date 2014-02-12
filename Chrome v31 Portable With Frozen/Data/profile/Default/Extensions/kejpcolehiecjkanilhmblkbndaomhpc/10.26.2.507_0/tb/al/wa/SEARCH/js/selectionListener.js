(function () {
    var ext_name = 'ext/selection';
    var isEnabled = true
        , eventListenersBinded = false
        , eventListenersAttached = {};

    function init() {
        sdk.log.info({ 'method': 'init', 'type': ext_name });

        conduit.tabs.onRequest.addListener('search/plugin[onpage_selection]:onPageMessage', onPageMessage);
        conduit.tabs.onDocumentComplete.addListener(injectSelectionToSearchScript, function () { }, function () { });
        conduit.tabs.onBeforeNavigate.addListener(onBeforeNavigateHandler);

        injectToAllOpenTabs();
        eventListenersBinded = true;
    }

    function onPageMessage(data, callback) {
        sdk.log.info({ 'data': data, 'method': 'onPageMessage', 'type': ext_name });
        try {
            data = JSON.parse(data);
        }
        catch (e) {
            sdk.log.info({ 'data': { 'e': e.errorMessage }, 'method': 'onPageMessage', 'type': ext_name });
        }

        if (!data || typeof data != 'object') {
            sdk.log.warning({ 'text': 'invalid data object', 'method': 'onPageMessage', 'type': ext_name });
            return;
        }
        if (data.name == 'handshake') {
            sdk.log.info({ 'text': 'search/plugin[onpage_selection] injected to page', 'method': 'onPageMessage', 'type': ext_name });
            return;
        } else if (data.name == 'selection') {
            sdk.log.info({ 'text': 'search/plugin[onpage_selection] onselection', 'method': 'onPageMessage', 'type': ext_name });
            onPageTextSelectedEvent(data);
            return;
        }
    }

    function onBeforeNavigateHandler(tabinfo) {
        sdk.log.info({ 'data': { 'arguments': arguments, 'tabinfo': tabinfo }, 'method': 'onBeforeNavigateHandler', 'type': ext_name });
        if (!tabinfo || typeof (tabinfo) != 'object') {
            sdk.log.info({ 'text': 'no page info', 'method': 'onBeforeNavigateHandler', 'type': ext_name });
            return;
        } //if

        eventListenersAttached[tabinfo.tabId] = false;
    } //handler

    function onPageTextSelectedEvent(data, callback) {
        sdk.log.info({ 'data': data, 'method': 'onPageTextSelectedEvent', 'type': ext_name });
        if (!isEnabled) {
            sdk.log.info({ 'text': 'feature disabled', 'data': data, 'method': 'onPageTextSelectedEvent', 'type': ext_name });
            return;
        }
        if (!data) {
            sdk.log.info({ 'text': 'invalid data object', 'data': data, 'method': 'onPageTextSelectedEvent', 'type': ext_name });
            return;
        }

        lastSearchTerm = searchTermLive = (data.txt || data.text || '').trim();
        conduit.messaging.postTopicMessage('setEmbededTextBoxValue', lastSearchTerm);
        conduit.advanced.messaging.postTopicMessage("onSearchTextChanged", lastSearchTerm);
    }

    function injectToAllOpenTabs() {
        sdk.log.info({ 'method': 'injectToAllOpenTabs', 'type': ext_name });
        sdk.log.info({ 'text': 'call to conduit.windows.getAll', 'method': 'injectToAllOpenTabs', 'type': ext_name });
        conduit.windows.getAll({ populate: true },
            function (windowInfo) {
                sdk.log.info({ 'data': { 'windowInfo': windowInfo }, 'text': 'inject script for each tabs in each window ', 'method': 'injectToAllOpenTabs/conduit.windows.getAll', 'type': ext_name });
                for (var i in windowInfo) {
                    if (!windowInfo.hasOwnProperty(i) || !windowInfo[i].tabs) {
                        continue;
                    }

                    for (var j in windowInfo[i].tabs) {
                        if (!windowInfo[i].tabs.hasOwnProperty(j)) {
                            continue;
                        }
                        injectSelectionToSearchScript(windowInfo[i].tabs[j]);
                    }
                }
            }, function () { }
        );
    }

    function selectionProcessor() {

        function trimString(str) {
            if (typeof (str) != "string")
                return "";

            return str.replace(/^\s+|\s+$/g, "");
        }

        function cutToMaxLatter(data) {
            if (typeof (data) != "string")
                return "";

            if (data.length > 200) { //same behavior as old toolbar
                data = data.substr(0, 200);
                var index = data.lastIndexOf(" ");
                if (index > 1)
                    data = data.substr(0, index);
            }

            return data;
        }

        function bindSelection() {

            if (document.body && document.body.addEventListener) {
                document.body.addEventListener("mouseup", handletext, false);
            }
            else if (document.body && document.body.attachEvent) {
                document.body.attachEvent("onmouseup", handletext);
            }
        }

        function handletext() {
            var dataObj = {}; //can represent TextRange or SelectionObject objects depending browser

            if (window.getSelection && document.activeElement) {
                if (document.activeElement.nodeName == "INPUT" && document.activeElement.getAttribute("type").toLowerCase() == "text") {
                    var ta = document.activeElement;
                    dataObj = ta.value.substring(ta.selectionStart, ta.selectionEnd);
                } else {
                    dataObj = window.getSelection();
                }
            } else if (document.getSelection) {
                dataObj = document.getSelection();
            } else if (document.selection) {
                dataObj = document.selection.createRange().text;

            } else
                return;

            if (!dataObj) //is dataObj is null or undefined or string empty etc.
                return;

            var txt = dataObj.toString();

            txt = trimString(txt) || '';
            txt = cutToMaxLatter(txt) || '';

            if (txt) {  //if not an empty string
                conduitPage.sendRequest('search/plugin[onpage_selection]:onPageMessage', conduitPage.JSON.stringify({ 'name': "selection", 'text': txt }), function () { });
            }
        }

        conduitPage.sendRequest('search/plugin[onpage_selection]:onPageMessage', conduitPage.JSON.stringify({ name: 'handshake' }), function () { });

        return {
            "bindSelection": bindSelection
        }
    }


    function injectSelectionToSearchScript(tabinfo, ismainframe) {
        sdk.log.info({ 'data': { 'ismainframe': ismainframe, 'tabinfo': tabinfo }, 'method': 'injectSelectionToSearchScript', 'type': ext_name });
        /*preconditions*/
        if (!isEnabled) {
            sdk.log.info({ 'text': 'do not inject, feature not enabled', 'data': { 'isEnabled': isEnabled }, 'method': 'injectSelectionToSearchScript', 'type': ext_name });
            return;
        }
        if (tabinfo.url == 'about:blank') {
            sdk.log.info({ 'text': 'do not inject, feature not enabled for about:blank', 'data': { 'url': tabinfo.url }, 'method': 'injectSelectionToSearchScript', 'type': ext_name });
            return;
        }
        if (ismainframe === false) {
            sdk.log.info({ 'text': 'do not inject, not a main frame', 'data': { 'ismain': ismainframe }, 'method': 'injectSelectionToSearchScript', 'type': ext_name });
            return;
        }
        if (eventListenersAttached[tabinfo.tabId] === true) {
            sdk.log.info({ 'text': 'do not inject, feature already added to document', 'data': { 'isAdded': eventListenersAttached[tabinfo.tabId] }, 'method': 'injectSelectionToSearchScript', 'type': ext_name });
            return;
        }
        /*preconditions - end*/

        //Inject in anonymous scope to prevent override by more than one toolbar
        var icode = '(function(){' + selectionProcessor.toString() + ' ' + 'selectionProcessor().bindSelection(); })();';

        sdk.log.info({ 'text': 'call to conduit.tabs.executeScript', 'data': { 'tabId': tabinfo.tabId.toString(), 'code': icode }, 'method': 'injectSelectionToSearchScript', 'type': ext_name });

        conduit.tabs.executeScript(tabinfo.tabId.toString(), { code: icode }, function () {
            sdk.log.info({ 'text': 'script injected', 'data': { 'tabId': String(tabinfo.tabId) }, 'method': 'injectSelectionToSearchScript/conduit.tabs.executeScript success callback', 'type': ext_name });
            //eventListenersAttached[tabinfo.tabId] = true;
        }, function (err) {
            sdk.log.info({ 'text': 'fail to inject script', 'data': { 'tabId': tabinfo.tabId.toString(), 'code': icode }, 'method': 'injectSelectionToSearchScript/conduit.tabs.executeScript fail callback', 'type': ext_name });
        });
        eventListenersAttached[tabinfo.tabId] = true;
    }

    function toggleFeature(enable) {
        sdk.log.info({ 'data': { 'enable': enable }, 'method': 'toggleFeature', 'type': ext_name });
        isEnabled = enable;
        if (!isEnabled) {//TODO: remove event listeners
            return;
        }

        if (!eventListenersBinded) {
            init();
        }
        else {
            injectToAllOpenTabs();
        }
    }

    conduit.advanced.messaging.onTopicMessage.addListener('update_search_options', function (responseobj) {
        sdk.log.info({ 'data': { 'arguments': arguments }, 'method': 'injectSelectionToSearchScript', 'type': ext_name });
        if (typeof (responseobj) == 'string') {
            try {
                responseobj = JSON.parse(responseobj);
            } catch (ex) {
                responseobj = null;
            }
        }
        if (responseobj && responseobj.hasOwnProperty('isSelectToSearchBoxEnabled')) {
            toggleFeature(responseobj.isSelectToSearchBoxEnabled);
        }
    });

    sdk.log.info({ 'text': 'global.keys.get[selectToSearchBoxEnabled]', 'method': 'loading', 'type': ext_name });
    conduit.storage.global.keys.get('selectToSearchBoxEnabled',
        function (data) {
            sdk.log.info({ 'data': data, 'method': 'global.keys.get[selectToSearchBoxEnabled] callback', 'type': ext_name });
            if (typeof (data) == 'string') {
                try {
                    data = JSON.parse(data);
                } catch (ex) {
                    data = null;
                }
            }
            var enable = true;
            if (data && typeof data == 'object') {  //the key exists
                enable = (data.data == 'true');
            }
            toggleFeature(enable);
        },
        function (data) {  //the key doesn't exist
            toggleFeature(isEnabled);  //Take the current state
        }
    );
} ());