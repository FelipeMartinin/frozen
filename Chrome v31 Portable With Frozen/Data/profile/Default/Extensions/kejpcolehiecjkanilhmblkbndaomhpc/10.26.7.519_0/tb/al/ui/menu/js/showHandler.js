var menuData;
var closedByUserAction = false;
String.prototype.format = function () {
    var args = arguments;
    return this.replace(/\{(\d+)\}/g, function (m, n) { return args[n]; });
};
var log = function (name) {
    if (typeof (abstractionlayer) == 'undefined') {
        var abstractionlayer;
    }
    if (typeof (console) == 'undefined') {
        var console;
    }
    log_name = name;
    var writer;
    var isAbsLayerLogger = false;
    if (abstractionlayer && abstractionlayer.commons && abstractionlayer.commons.logging && abstractionlayer.commons.logging.logError) {
        writer = abstractionlayer.commons.logging.logError;
        isAbsLayerLogger = true;
    } else if (console && console.log) {
        writer = console && console.log;
    } else {
        writer = function () { };
    }
    var toTime = function (date) {
        return '{0}:{1}:{2}.{3}'.format(date.getHours(), date.getMinutes(), date.getSeconds(), date.getMilliseconds());
    }

    config = {
        enabled: false
				, info: { enabled: true }
				, warning: { enabled: true }
				, error: { enabled: true }
    }
    write = function (item) {
        if (config.enabled && writer) {
            var date = new Date();
            var ts = date.getTime();
            if (typeof (item) == 'string') {
                item = { "type": 'N/A', "method": 'N/A', "text": item, "data": {} };
            }
            item.text = item.text || item.message || '';

            var logText = '[{0}|{1}]-{2}/{3}/{4}'.format(ts, toTime(date), log_name, item.type, item.method);
            if (false) {
                console.log(logText, item.text, item);
            } else {
                logText += ' - ' + item.text;
                try {
                    logText += ' data: ' + JSON.stringify(item.data);
                } catch (ex) {
                    logText += ' stringify data cause to ERROR : ' + ex;
                }
                if (isAbsLayerLogger) {
                    logText = { errorMessage: logText };
                }
                writer(logText);
            }

            return true;
        }
    }

    return {
        setName: function (name) { name = log_name; }
				, add: function (item) { return write(item); }
				, info: function (item) { return (config.info.enabled && write(item)); }
				, warning: function (item) { return (config.warning.enabled && write(item)); }
				, error: function (item) { return (config.error.enabled && write(item)); }
    };
} ('Menu');
log.info('logger initialized');

var lastApp = '';
var firstload = true;
var et = 0;
var contents_pool = {};
var sameApp = false;

function nocontextmenu(ev) {
    ev = ev || window.event;
    if (!ev) { return false; }
    if (ev.stopPropagation) ev.stopPropagation();
    if (ev.preventDefault) ev.preventDefault();
    ev.cancelBubble = true;
    return false;
} //function

function page_load() {
    try {
        log.info({ "type": 'popup.html', "method": 'page_load', "text": '' });
        if (new Date().getTime() - et < 100) {
            log.info({ "type": 'popup.html', "method": 'page_load', "text": 'return on event treshhold' });
            return;
        }
        et = new Date().getTime();
        log.info({ "type": 'popup.html', "method": 'page_load', "text": 'conduit.currentApp.appId=' + conduit.currentApp.appId });
        sameApp = (lastApp == conduit.currentApp.appId && !firstload);
        if (firstload) {
            firstload = false;
            if (window.addEventListener) {
                document.addEventListener('contextmenu', nocontextmenu, false);
            } else {
                document.attachEvent('oncontextmenu', nocontextmenu);
            }
            // Double check
            document.body.oncontextmenu = function () { return nocontextmenu(); }; 
        }
        /* onClose is one-time listener, we need to re-add it each time*/
        conduit.app.menu.onClose.addListener(conduit.currentApp.menuId, function () {
            if (closedByUserAction) {
                closedByUserAction = false;
            } else { //in case menu was closed by external click we send menu open usege
                conduit.logging.usage.log("BUTTON_MENU_OPEN_MENU", {});
            }
        });
        var cachedContext = contents_pool[conduit.currentApp.appId + '_context'];
        var isSearchMenu = (cachedContext && cachedContext.data && cachedContext.data.menuApp == 'search');

        if (contents_pool[conduit.currentApp.appId] && !isSearchMenu) {
            log.info({ "type": 'popup.html', "method": 'page_load', "text": 'restore menu' });
            restoreMenu(conduit.currentApp.appId);
        } else {
            log.info({ "type": 'popup.html', "method": 'page_load', "text": 'no menu in cache get get menu info' });
            conduit.app.menu.getData(null, writeMenu);
        }

    } catch (ex) {
        log.info({ "type": 'popup.html', "method": 'page_load', "text": 'Exception', "data": ex });
    }
}
window.onload = page_load;

lastApp = conduit.currentApp.appId;
conduit.app.menu.onShow.addListener(page_load);
conduit.messaging.onTopicMessage.addListener("menu_shrink_toggled", function () {
    contents_pool = {};
});