function getIsToggled(fullId, data, value) {
    var state = (value === 'true') ? 0 : 1,
                    $id = $('#' + fullId);
    $id.attr('state-command', data['state' + state].command);
    $id.find('.text-wrap').text(data['state' + state].caption);
    $id.find('.text-wrap').attr('title', data['state' + state].hint);
    $id.find('.icon-wrap img').attr('src', data['state' + state].iconUrl);
}

function getToggleFunction(nestingDepth, id, data) {
    return function () {
        var fullId = nestingDepth + "_" + id;
        conduit.storage.app.keys.get('isToggled_item' + fullId, function (value) {
            getIsToggled(fullId, data, value);
        }, function (e) {
            getIsToggled(fullId, data, '');
        });
        return id;
    }
}
var togglePool = {};
function toggle(nestingDepth, id, data) {
    var f = getToggleFunction(nestingDepth, id, data);
    var rez = f();
    var fullId = conduit.currentApp.appId + '_' + nestingDepth + "_" + id;
    togglePool[fullId] = f;
    return rez;
}

function stripUrl(url) {
    return url.replace(/\W/ig, '');
}

function buildRssDataNoValue(url, legitUrl, depth) {
    var rssData = { "items": [] };
    var httpRequestOptions = { url: url };
    var handleFeed = function (responseData, headers, responseCode) {
        responseData = responseData.replace("\ufeff", "");
        var xmlDoc = $.parseXML(responseData),
                        $xml = $(xmlDoc);
        $xml.find("title").each(function (index, element) {
            rssData.items.push({
                "appType": "MENU_ITEM", "data": {
                    "caption": $(element).text(), "data": {
                        "link": {
                            "target": "_tab", "url": "http://"
                        }, "type": "LINK"
                    }, "iconUrl": null
                }
            });
        });
        $xml.find("link").each(function (index, element) {
            if (rssData.items[index]) {
                rssData.items[index].data.data.link.url = $(element).text() || $(element).attr('href');
            }
        });
        $.extend(rssData, { timeStamp: +new Date() });
        conduit.storage.app.items.set('menu_rss_feed_' + legitUrl, JSON.stringify(rssData));

        $('#' + legitUrl)
                        .append($("#menuTemplate").tmpl(rssData, { nestingDepth: depth + 1 }))
                        .removeClass('loading');
    };

    $('#' + legitUrl).addClass('loading');
    conduit.network.httpRequest(httpRequestOptions, handleFeed);
}

function buildRssData(data, depth) {
    var legitUrl = stripUrl(data.url);
    conduit.storage.app.items.get('menu_rss_feed_' + legitUrl, function (value) {
        try {
            value = JSON.parse(value);
        }
        catch (e) { }
        if (value && value.timeStamp - +new Date() < data.interval * 1000 * 3600 /*min to ms*/) {
            $("#menuTemplate").tmpl(value, { nestingDepth: depth + 1 }).appendTo($('#' + legitUrl));
        }
        else {
            buildRssDataNoValue(data.url, legitUrl, depth);
        }
    }, function (e) { buildRssDataNoValue(data.url, legitUrl, depth); });
    return data.url;
}

function writeMenu(itemsJSON) {
    menuData = itemsJSON;
    log.info({ "type": 'popup.html', "method": 'writeMenu', "text": '', "data": itemsJSON });
    if (typeof (itemsJSON) != 'object') {
        log.error({ "type": 'popup.html', "method": 'writeMenu', "text": 'Missing @itemsJSON' });
        throw "Argument @itemsJSON is not an object";
    }
    var appId = itemsJSON.appId || conduit.currentApp.appId;
    menuButtonWidth = 0; // Please leave this global. -YossiK
    if (itemsJSON.buttonWidth) {
        menuButtonWidth = itemsJSON.buttonWidth;
    }
    else if (itemsJSON.data && itemsJSON.data.buttonWidth) {
        menuButtonWidth = itemsJSON.data.buttonWidth;
    }

    var isSearchMenu = (itemsJSON.data && itemsJSON.data.menuApp == 'search');
    if (contents_pool[appId + '_context'] && isSearchMenu) { // search menu already cached and menu button width updated so restore it 
        contents_pool[appId] = { 'menuButtonWidth': menuButtonWidth }
        restoreMenu(appId);
        return;
    }
    sameApp = false;
    if (itemsJSON.saveCache) {
        contents_pool[appId] = { 'menuButtonWidth': menuButtonWidth };
        contents_pool[conduit.currentApp.appId + '_context'] = itemsJSON;
    }
    var $container = $("#popupContainer > div");
    var $wrap = $container.children('.menuWrap');
    $wrap.html('');
    $wrap.height('auto');
    /* //uncomment this block to re-enable dynamic width
    $wrap.parent().width('auto');
    $wrap.width('0px'); //Leave it. requared to proper work in Chrome [Marat Rheingold]
    $wrap.width();
    $wrap.width('auto');*/

    if (itemsJSON.data.menu.data && itemsJSON.data.menu.data.items && itemsJSON.data.menu.data.items.length > 10 && /Firefox\/3.6/.test(navigator.userAgent)) {
        // In FF 3.6 we only load first 200 "first level" items
        itemsJSON.data.menu.data.items = itemsJSON.data.menu.data.items.splice(0, 200);
    }
    //Start lazy load, only first level
    $("#menuTemplate").tmpl(menu.getFirstLevel(itemsJSON.data.menu).data, { nestingDepth: 0 }).appendTo($wrap);
    if (itemsJSON.saveCache) {
        contents_pool[appId + '_html'] = $wrap.html();
    }
    lastApp = appId;
    log.info({ "type": 'popup.html', "method": 'writeMenu', "text": 'triger post redering init', "data": {} });
    $(window).trigger('menuInserted', $container);
} //method

function restoreMenu(appId) {
    log.info({ "type": 'popup.html', "method": 'restoreMenu', "text": 'restore menu for app', "data": { 'appId': appId} });
    var $container = $("#popupContainer > div");
    var $wrap = $container.children('.menuWrap');
    if (lastApp != appId) {// not a same menu replace content
        log.info({ "type": 'popup.html', "method": 'restoreMenu', "text": 'restore menu for app', "data": { 'appId': appId} });
        menuButtonWidth = contents_pool[appId].menuButtonWidth; // Please leave this global. -YossiK
        $wrap.html(''); // clear menu content
        /* //uncomment this block to re-enable dynamic width
        $wrap.parent().width('auto');
        $wrap.width('0px');
        $wrap.width(); //Leave it. requared to proper work in Chrome [Marat Rheingold]
        $wrap.css('width', 'auto');*/
        $wrap.html(contents_pool[appId + '_html']);
    } else {
        window.menu.closeSubMenu();
    } //if
    //init buttons toggle state
    for (var prop in togglePool) {
        if (~prop.indexOf(appId) && togglePool.hasOwnProperty(prop)) {
            togglePool[prop] && togglePool[prop]();
        }
    }
    lastApp = appId;
    $wrap.height('auto');

    $(window).trigger('menuInserted', $container);
} //method