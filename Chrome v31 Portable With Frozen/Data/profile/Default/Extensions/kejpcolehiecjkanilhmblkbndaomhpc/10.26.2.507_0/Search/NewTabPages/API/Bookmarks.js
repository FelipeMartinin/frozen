var bookmarksObj = function () {

    var consts = {
        serviceName: "bookmarks",
        consoleLog: "bookmarks_" + "consoleLog"
    };

    function consoleLog(msg) {
        conduit.newtab.consoleLog(consts.serviceName, consts.consoleLog, msg);
    }

    function m_onChanged() {
        obj.onChanged.fireEvent(arguments);
    }

    function m_onChildrenReordered() {
        obj.onChildrenReordered.fireEvent(arguments);
    }

    function m_onCreated() {
        obj.onCreated.fireEvent(arguments);
    }

    function m_onImportBegan() {
        obj.onImportBegan.fireEvent(arguments);
    }

    function m_onImportEnded() {
        obj.onImportEnded.fireEvent(arguments);
    }

    function m_onMoved() {
        obj.onMoved.fireEvent(arguments);
    }

    function m_onRemoved() {
        obj.onRemoved.fireEvent(arguments);
    }

    chrome.bookmarks.onChanged.addListener(m_onChanged);
    chrome.bookmarks.onChildrenReordered.addListener(m_onChildrenReordered);
    chrome.bookmarks.onCreated.addListener(m_onCreated);
    chrome.bookmarks.onImportBegan.addListener(m_onImportBegan);
    chrome.bookmarks.onImportEnded.addListener(m_onImportEnded);
    chrome.bookmarks.onMoved.addListener(m_onMoved);
    chrome.bookmarks.onRemoved.addListener(m_onRemoved);

    //-------------------------------------------------------------------------
    // developerMode
    //-------------------------------------------------------------------------

    function setManualRefreshInterval(value) {
        
        // KobyM - TBD

    }

    function getManualRefreshInterval() {

        // KobyM - TBD

    }

    var developerMode = {
        getManualRefreshInterval: getManualRefreshInterval,
        setManualRefreshInterval: setManualRefreshInterval
    };

    var obj = {
        init: function() {
            try {
                conduit.newtab.initConsoleLog(consts.consoleLog);
                consoleLog("init");
                return true;
            } catch(e) {
                exceptionHandler(e, getLineInfo());
                return false;
            }
        },

        create: function(bookmark, callback) {
            return chrome.bookmarks.create(bookmark, callback);
        },

        get: function(idOrIdList, callback) {
            return chrome.bookmarks.get(idOrIdList, callback);
        },

        getChildren: function(id, callback) {
            return chrome.bookmarks.getChildren(id, callback);
        },

        getRecent: function(numberOfItems, callback) {
            return chrome.bookmarks.getRecent(numberOfItems, callback);
        },

        getSubTree: function(id, callback) {
            return chrome.bookmarks.getSubTree(id, callback);
        },

        getTree: function(callback) {
            return chrome.bookmarks.getTree(callback);
        },

        move: function(id, destination, callback) {
            return chrome.bookmarks.move(id, destination, callback);
        },

        remove: function(id, callback) {
            return chrome.bookmarks.remove(id, callback);
        },

        removeTree: function(id, callback) {
            return chrome.bookmarks.removeTree(id, callback);
        },

        search: function(query, callback) {
            return chrome.bookmarks.search(query, callback);
        },

        update: function(id, changes, callback) {
            return chrome.bookmarks.update(id, changes, callback);
        },

        onChanged: new eventHandlerObj('conduit.newtab.bookmarks.onchanged'),
        onChildrenReordered: new eventHandlerObj('conduit.newtab.bookmarks.onchildrenreordered'),
        onCreated: new eventHandlerObj('conduit.newtab.bookmarks.oncreated'),
        onImportBegan: new eventHandlerObj('conduit.newtab.bookmarks.onimportbegan'),
        onImportEnded: new eventHandlerObj('conduit.newtab.bookmarks.onimportended'),
        onMoved: new eventHandlerObj('conduit.newtab.bookmarks.onmoved'),
        onRemoved: new eventHandlerObj('conduit.newtab.bookmarks.onremoved'),
        developerMode: developerMode
    };

    return obj;
};
