
var AppNameObj = null;
function initAppName() {
    AppNameObj = function () {
        //////////////////////////////////////////////////////////////////////////////////////////////
        //                                PRIVATE AREA                                              //
        //////////////////////////////////////////////////////////////////////////////////////////////
        //

        /**********************************************
        ******************** Globals ******************
        ***********************************************/

        var arrNotifications = [],
            count,
            str = window.location.search,
            key = str.substring(str.indexOf('=') + 1).split('&')[0],
            isSettingsWinOpen = false,
            timeOut,
            notificationShowDuration,
            currentChannelId,
            paging = null,
            pagingFileName = null,
            isAttachedImageEvent = false,
            defaultCustomNotifObj = {
                size: {
                    width: 320,
                    height: 100
                },
                colors: {
                    bgColor: '#fbfbfb',
                    headerTextColor: '#000000'
                },
                content: {
                    url: '',
                    html: ''
                }
            },
            googleAnalyticsBaseUrl = 'http://client.conduit-storage.com/analytics/dialogs/ToolbarNotifications.html',
            callbackItemBody,
            callbackIframe,
            domElements = {},
            isIE = (navigator.userAgent.toLowerCase().indexOf('msie') > -1),
            notificationsHistoryKeyName = 'NotificationsHistory_',
            maxNotificationsToShow = 9;


        function cacheDomElements() {
            domElements.imgNext = document.getElementById("next");
            domElements.imgPrev = document.getElementById("prev");
            domElements.appLogoContainer = document.getElementById("appLogoContainer");
            domElements.appLogo = document.getElementById("appLogo");
            domElements.main = document.getElementById('main');
            domElements.header = document.getElementById('header');
            domElements.contentWrapper = document.getElementById('txtDiv');
            domElements.imgSettings = document.getElementById("settings");
            domElements.imgClose = document.getElementById("close");
            domElements.imgConduit = document.getElementById("conduit_logo");
            domElements.tracking = document.getElementById('conduitTraking');
        }

        function bindHandlers() {
            domElements.imgNext.onclick = function () { AppNameObj.next(); };
            domElements.imgNext.onmouseover = function () { AppNameObj.onMouseOver(true, 'next'); };
            domElements.imgNext.onmouseout = function () { AppNameObj.onMouseOver(false, 'next'); };

            domElements.imgPrev.onclick = function () { AppNameObj.prev(); };
            domElements.imgPrev.onmouseover = function () { AppNameObj.onMouseOver(true, 'prev'); };
            domElements.imgPrev.onmouseout = function () { AppNameObj.onMouseOver(false, 'prev'); };

            domElements.imgConduit.onclick = function () { window.open('http://www.conduit.com'); };
            domElements.imgClose.onclick = function () { AppNameObj.close(true); };
            domElements.imgSettings.onclick = function () { AppNameObj.openSettings(); };
        }

        /* called every time a notification needs to be displayed (first time and paging) */
        function changeHtml(Obj) {
            //Set next and prev buttons
            if (count == (arrNotifications.length - 1)) {
                domElements.imgNext.setAttribute('class', 'disable next button');
            } else {
                domElements.imgNext.setAttribute('class', 'next button');
            }
            if (count == 0) {
                domElements.imgPrev.setAttribute('class', 'disable previous button');
            } else {
                domElements.imgPrev.setAttribute('class', 'previous button');
            }

            //Set the title
            domElements.header.style.visibility = 'hidden';  //to prevent blinking if it there won't be place for it after the logo loads
            if (Obj.title) {
                if (isIE)
                    domElements.header.innerText = Obj.title;
                else
                    domElements.header.textContent = Obj.title;
            }
            else {
                if (isIE)
                    domElements.header.innerText = '';
                else
                    domElements.header.textContent = '';
            }

            //Only once - attach event when the logo image finished loading
            if (!isAttachedImageEvent) {
                isAttachedImageEvent = true;

                addEvent(domElements.appLogo, 'load', onAppLogoLoad);
            }

            //Set title image (if exists)
            if (Obj.imageurl) {
                domElements.appLogo.setAttribute("src", Obj.imageurl);
                domElements.appLogoContainer.style.display = 'block';
            }
            else {
                domElements.appLogo.setAttribute("src", '');
                domElements.appLogoContainer.style.display = 'none';
                onAppLogoLoad();  //it will not be called from the onload event
            }

            /****** Custom Notification Code *****/
            parseCustomNotification(Obj);
            //TODO: set single method of view render
            //send  HTML notification after custom notification (both API)
            if (!Obj.customNotifObj && !(typeof Obj.itemNotification == 'string' && Obj.itemNotification.length)) {
                Obj.customNotifObj = {};
                extend(Obj.customNotifObj, defaultCustomNotifObj);
            }
            if (Obj.customNotifObj) {
                if (!Obj.customNotifObj.htmlCreator || Obj.customNotifObj.htmlCreator != 0) {//api or publisher custom object
                    var width = +Obj.customNotifObj.size.width;
                    var height = +Obj.customNotifObj.size.height;
                    height = (isIE) ? (height - 1) : height;  //IE has 1px offset

                    //Set Colors
                    domElements.main.style.backgroundColor = Obj.customNotifObj.colors.bgColor;
                    domElements.header.style.color = Obj.customNotifObj.colors.headerTextColor;

                    if (Obj.customNotifObj.content.url || Obj.customNotifObj.htmlCreator) {//api- url or publisher creator
                        domElements.contentWrapper.setAttribute('class', 'iframeDiv');
                        width = '100%';
                        if (height === defaultCustomNotifObj.size.height || height === defaultCustomNotifObj.size.height - 1) {  //if it's the default height (height was not supplied by the user)
                            height += 26;  //add the height of padding which were removed
                        }
                    }
                    else {  //if the user provider html markup
                        domElements.contentWrapper.setAttribute('class', 'htmlDiv');
                        if (width === defaultCustomNotifObj.size.width) {  //if it's the default width (width was not supplied by the user)
                            width -= 40;
                        }

                        width += 'px';
                    }

                    //Set Height
                    domElements.contentWrapper.style.height = height + 'px';
                    domElements.contentWrapper.style.width = width;
                }
            }

            //Delete prev notification
            domElements.contentWrapper.innerHTML = '';

            var newIframe = document.createElement("iframe");
            newIframe.setAttribute("scrolling", "no");
            newIframe.setAttribute("frameborder", "0");
            newIframe.style.backgroundColor = "white";
            newIframe.style.width = '100%';
            newIframe.style.height = '100%';


            if (Obj.customNotifObj && Obj.customNotifObj.content.url) {
                newIframe.setAttribute("src", Obj.customNotifObj.content.url);
            }
            else if (Obj.customNotifObj && Obj.customNotifObj.hasOwnProperty('htmlCreator')) {//CP notification with custom notification - 'Server' or 'Publisher' creator
                newIframe.setAttribute("src", Obj.itemNotificationUrl);
            }
            else if (Obj.customNotifObj && (Obj.customNotifObj.content.html || Obj.customNotifObj.content.html == "")) {
                //We will edit the content only after the iframe will be added to the DOM
                newIframe.setAttribute("src", "about:blank");
                callbackItemBody = Obj.customNotifObj.content.html;
                callbackIframe = newIframe;
                if (newIframe.addEventListener)
                    newIframe.addEventListener("load", loadRawHtmlWrap, false);
                else if (newIframe.attachEvent)
                    newIframe.attachEvent("onload", loadRawHtmlWrap);
            }
            else if (Obj.itemNotificationUrl) {  //CP notification without custom notification
                newIframe.setAttribute("src", Obj.itemNotificationUrl);
                domElements.contentWrapper.setAttribute('class', 'htmlDivCP');
                //Remove these styles - the htmlDivCP class will take care of it
                domElements.contentWrapper.style.height = '';
                domElements.contentWrapper.style.width = '';
            }
            else {  //Old notification
                //We will edit the content only after the iframe will be added to the DOM
                newIframe.setAttribute("src", "about:blank");
                //Handles cases that a custom notification was sent without contet - an empty notification will appear
                callbackItemBody = (Obj.itemNotification) ? Obj.itemNotification : '';
                callbackIframe = newIframe;
                if (newIframe.addEventListener)
                    newIframe.addEventListener("load", loadRawHtmlWrap, false);
                else if (newIframe.attachEvent)
                    newIframe.attachEvent("onload", loadRawHtmlWrap);
            }

            //add iframe to the notification hierarchy
            domElements.contentWrapper.appendChild(newIframe);

            //Set the buttons colors by the background
            var darkBG = false;  //the default background is not dark
            if (Obj.customNotifObj) {
                darkBG = Obj.customNotifObj.isDarkBG;
            }
            setButtonsImages(darkBG);

            changePopupSizeAndPosition(Obj);
        }

        function loadRawHtmlWrap() {
            loadRawHtml(callbackIframe, callbackItemBody);
        }

        function loadRawHtml(iframe, notificationBody) {
            if (iframe.removeEventListener)
                iframe.removeEventListener("load", loadRawHtmlWrap, false);
            else if (iframe.detachEvent)
                iframe.detachEvent("onload", loadRawHtmlWrap);

            var iframeDoc;
            if (iframe.contentDocument) {
                iframeDoc = iframe.contentDocument;
            }
            else if (iframe.contentWindow) {
                iframeDoc = iframe.contentWindow.document;
            }

            iframeDoc.open();
            iframeDoc.write(notificationBody);
            iframeDoc.close();

            /* Adding *{margin:0} style */
            var style = document.createElement('style');
            style.type = 'text/css';
            style.innerHTML = '*{margin:0}';
            iframeDoc.getElementsByTagName("head")[0].appendChild(style);
        };

        function onAppLogoLoad() {
            var totalWidth = parseInt(domElements.appLogo.offsetWidth) + parseInt(domElements.header.offsetWidth) + 10;
            if (totalWidth >= 200)
                domElements.header.style.display = "none";
            else
                domElements.header.style.visibility = "visible";
        }

        function showNotification(item) {
            changeHtml(item);

            //Add the notification to history
            //!!!!!!!!!! IMPORTANT NOTICE !!!!!!!!!!!!
            //History notifications are not shown at the moment (there is no paging of old notification)
            //But, the following code still runs - it manages the history file
            //If and when should some decide to activate the history feature - uncommnect the code that reads the history file (init function)
            if (!item.addedToHistory) {
                var historyKey = notificationsHistoryKeyName + key.split('_')[1];
                conduit.storage.global.items.get(historyKey, function (historyArr) {
                    if (!historyArr) {
                        historyArr = [];
                    }
                    else {
                        if (typeof historyArr === 'string') {
                            historyArr = JSON.parse(historyArr);
                        }
                    }

                    //If the history file is full (can hold (maxNotificationsToShow - 1) items)
                    if (historyArr.length == (maxNotificationsToShow - 1)) {
                        historyArr.splice(0, 1);  //remove the first item (oldest)
                        conduit.storage.global.items.remove(item.fileName);  //also remove its file
                    }

                    //Add the current item
                    historyArr.push(item);

                    //sort the history items by their timestamp
                    historyArr.sort(sortByTimestamp(true));

                    //Save the history file
                    conduit.storage.global.items.set(historyKey, JSON.stringify(historyArr));

                    item.addedToHistory = true;  //So it won't be added to history each time it's shown (when paging the notifications)
                }, function (e) {
                    // no history array, so create empty one, push item and save history:
                    var historyArr = [];
                    historyArr.push(item);
                    conduit.storage.global.items.set(historyKey, JSON.stringify(historyArr));

                    item.addedToHistory = true;
                });
            }

            //Send paging usages
            if (paging) {
                var pagingReqObj = {
                    type: (paging == "FORWARD") ? "MESSAGE_FORWARD_CLICK" : "MESSAGE_BACKWARD_CLICK",
                    fileName: pagingFileName  //use the global variable because the item object contains the new item
                };

                sendUsage(pagingReqObj);
            }

            //Send viewed usage
            if (!item.viewed) {
                var viewedReqObj = {
                    type: "MESSAGE_VIEWED",
                    fileName: item.fileName,
                    version: item.version
                };
                sendUsage(viewedReqObj);
                GA_Tracking(buildGAUrl(item.customNotifObj, "View", "Notification"));
            }



            //Reset paging global vriables
            paging = null;
            pagingFileName = null;

            //Mark to notification as viewed
            if (!item.viewed) {
                conduit.storage.global.items.get(item.fileName, function (data) {
                    if (!data) return;
                    data = (typeof (data) === 'string') ? JSON.parse(data) : data;
                    if (data.viewed) return;  //if the attribute already exist
                    data.viewed = true;
                    conduit.storage.global.items.set(item.fileName, JSON.stringify(data));

                    item.viewed = true;
                });
            }

            setNotifocationTimeout(item.duration);
        }

        function changePopupSizeAndPosition(Obj) {
            conduit.messaging.sendRequest("backgroundPage", "Alerts", JSON.stringify({ method: 'GetSizeAndPosition', itemNotification: Obj.itemNotification }), function (data) {
                try {
                    data = JSON.parse(data);
                }
                catch (e) {
                    conduit.logging.logDebug('notificationApp/js/AppName.js - received wrong data: ' + data);
                }
                var size = data.size;
                var offset = data.offset;

                document.getElementById('prev').disabled = true;
                document.getElementById('next').disabled = true;
                conduit.app.popup.resize(null, size, function () {
                    conduit.app.popup.changePosition(null, offset.offsetY, offset.offsetX, function () {
                        document.getElementById('prev').disabled = false;
                        document.getElementById('next').disabled = false;
                    }, function (err) { });
                }, function (err) { });
            });
        }

        function onMessageFromFrame(msg) {
            switch (msg["topic"]) {
                case "openLink":
                    //Open the link
                    if (msg["target"] === 'NEW') {
                        conduit.windows.create({ url: msg["url"] });
                    } else if (msg["target"] === 'MAIN') {
                        conduit.tabs.update(null, { url: msg["url"] });
                    } else {
                        conduit.tabs.create({ url: msg["url"] });
                    }

                    //Send usage
                    var reqObj = {
                        type: "CLICK_ON_MESSAGE",
                        fileName: arrNotifications[count].fileName
                    };
                    sendUsage(reqObj);

                    AppNameObj.close();
                    break;

                case "openApp":
                    conduit.platform.openApp(msg["appGuid"]);
                    AppNameObj.close();
                    break;

                case "sendMessageToEmbeddedApp":
                    if (msg.value && msg.value === 'CLOSE_NOTIFICATION') {
                        AppNameObj.close();
                    }
                    else {
                        conduit.messaging.postTopicMessage("BC_API_" + msg.nickname, msg.value);
                    }
                    break;
            }
        }

        /**********************************************
        *********notification timeout functions********
        ***********************************************/

        function setNotifocationTimeout(duration) {
            notificationShowDuration = duration || 60;

            removeEvent(document.body, 'mouseover', onBodyMouseOver);
            removeEvent(document.body, 'mouseout', onBodyMouseOut);

            addEvent(document.body, 'mouseover', onBodyMouseOver);
            addEvent(document.body, 'mouseout', onBodyMouseOut);
        }

        function onBodyMouseOver() {
            clearTimeout(timeOut);
        }

        function onBodyMouseOut() {
            timeOut = setTimeout(AppNameObj.close, notificationShowDuration * 1000);
        }

        /**********************************************
        *******new custom notification functions*******
        ***********************************************/

        var parseCustomNotification = function (notification) {
            var customNotifObj = null;

            var objStr = notification.itemNotification;
            if (objStr.length > 1 && objStr[0] === '{') {
                try {
                    notification.customNotifObj = JSON.parse(objStr);

                    //Set Defaults
                    extend(notification.customNotifObj, defaultCustomNotifObj);

                    notification.customNotifObj.isDarkBG = isDarkBG(notification.customNotifObj.colors.bgColor);
                }
                catch (err) { }
            }
        };

        var extend = function (target, source) {
            if (typeof target === 'undefined') {
                target = source;
                return target;
            }
            for (var key in source) {
                if (typeof source[key] === 'object') {
                    target[key] = extend(target[key], source[key]);
                } else {
                    if (typeof target[key] === 'undefined' || target[key] === null || (target[key] === '' && source[key] !== '')) {
                        target[key] = source[key];
                    }
                }
            }
            return target;
        };

        var setButtonsImages = function (dark) {
            var folderName = (dark) ? 'dark' : 'light',
                path = "Images/" + folderName + '/';

            domElements.imgNext.src = path + 'Next.png';
            domElements.imgPrev.src = path + 'Prev.png';
            domElements.imgSettings.src = path + 'settings.png';
            domElements.imgClose.src = path + 'close.png';
            domElements.imgConduit.src = path + 'powered-by.png';
        };


        /****************************
        *******color functions*******
        ****************************/

        function hexToR(h) { return parseInt((cutHex(h)).substring(0, 2), 16) }
        function hexToG(h) { return parseInt((cutHex(h)).substring(2, 4), 16) }
        function hexToB(h) { return parseInt((cutHex(h)).substring(4, 6), 16) }
        function cutHex(h) { return (h.charAt(0) == "#") ? h.substring(1, 7) : h }
        function isDarkBG(color) {
            var R, G, B;
            try {
                if (color.length == 4) {
                    color += color.substring(1, 4);
                }
                R = hexToR(color);
                G = hexToG(color);
                B = hexToB(color);
            } catch (err) {
                return false;
            }

            return ((R + G + B) < 382) ? true : false;
        }

        /*******************************
        **tracking and usage functions**
        ********************************/

        function buildGAUrl(customNotifObj, action, label) {
            if (!customNotifObj || !customNotifObj.analytics || !customNotifObj.analytics.GA_Code || !customNotifObj.analytics.Category)
                return null;

            var url = googleAnalyticsBaseUrl
                      + '?gacode=' + customNotifObj.analytics.GA_Code
                      + '&cat=' + customNotifObj.analytics.Category
                      + '&act=' + action
                      + '&lbl=' + label
                      + '&pageView=1';
            return url;
        }

        function GA_Tracking(GAUrl) {
            if (!GAUrl)
                return;
            reqObj = {
                GAUrl: GAUrl
            };

            conduit.messaging.sendRequest("backgroundPage", "Alerts", JSON.stringify({ method: 'GA_Tracking', reqObj: reqObj }));
        }

        function sendUsage(reqObj, callback) {
            conduit.messaging.sendRequest("backgroundPage", "Alerts", JSON.stringify({ method: 'AlertUsage', reqObj: reqObj }), callback);
        }

        /*******************************
        ************ Utils *************
        ********************************/

        var addEvent = (function () {
            if (document.addEventListener) {
                return function (el, type, fn) {
                    if (el && el.nodeName || el === window) {
                        el.addEventListener(type, fn, false);
                    } else if (el && el.length) {
                        for (var i = 0; i < el.length; i++) {
                            addEvent(el[i], type, fn);
                        }
                    }
                };
            } else {
                return function (el, type, fn) {
                    if (el && el.nodeName || el === window) {
                        el.attachEvent('on' + type, function () { return fn.call(el, window.event); });
                    } else if (el && el.length) {
                        for (var i = 0; i < el.length; i++) {
                            addEvent(el[i], type, fn);
                        }
                    }
                };
            }
        })();

        var removeEvent = (function () {
            if (document.removeEventListener) {
                return function (el, type, fn) {  // all browsers except IE before version 9
                    el.removeEventListener(type, fn, false);
                }
            }
            else {
                return function (el, type, fn) {  // IE before version 9
                    el.detachEvent('on' + type, fn);
                }
            }
        })();

        var sortByTimestamp = function (reverse, primer) {
            reverse = (reverse) ? -1 : 1;

            return function (a, b) {
                a = a.timeStamp;
                b = b.timeStamp;

                if (a < b) return reverse * -1;
                if (a > b) return reverse * 1;
                return 0;
            }
        };

        //////////////////////////////////////////////////////////////////////////////////////////////
        //                                 PUBLIC AREA                                              //
        //////////////////////////////////////////////////////////////////////////////////////////////

        return {
            init: function () {
                cacheDomElements();

                bindHandlers();

                //Get the new notifications
                conduit.storage.global.items.get(key, function (arrNewNotifications) {
                    //!!!!!!!!!! IMPORTANT NOTICE !!!!!!!!!!!!
                    //TODO: The following code adds history paging capability
                    //      If and when should some decide to activate this feature - uncommnect this code

                    //Get the history
                    /*var historyKey = notificationsHistoryKeyName + key.split('_')[1];
                    conduit.storage.global.items.get(historyKey, function(arrHistoryNotifications){
                    arrNotifications = arrNewNotifications;

                    //Add history notifications
                    for(var i=0 ; i<arrHistoryNotifications.length ; i++) {
                    if(arrNotifications.length === maxNotificationsToShow) {
                    break;  //The array is full
                    }

                    arrHistoryNotifications[i].addedToHistory = true;  //So that it won't added again
                    arrNotifications.push(arrHistoryNotifications[i]);
                    }

                    //show first notification
                    count = 0;
                    showNotification(arrNotifications[count]);

                    //Remove the new notifications key
                    conduit.storage.global.items.remove(key);
                    });*/

                    try {
                        arrNewNotifications = JSON.parse(arrNewNotifications);
                    }
                    catch (e) {
                        conduit.logging.logDebug('notificationApp/js/AppName.js - received wrong array: ' + arrNewNotifications);
                        return;
                    }
                    //The following code prepares the notifications without history
                    arrNotifications = arrNewNotifications;

                    //Sort the items by their timestamp (show oldest first)
                    arrNotifications.sort(sortByTimestamp(false));

                    //Set the current channelId that this popup handles
                    currentChannelId = arrNotifications[0].channelId;

                    //Show first notification
                    count = 0;
                    showNotification(arrNotifications[count]);

                    //Remove the new notifications key
                    conduit.storage.global.items.remove(key);
                }, function (ex) {
                    conduit.logging.logDebug('Notification/AppName.js/init - can`t read key: ' + key + ' eroor: ' + ex);
                    AppNameObj.close();
                });

                conduit.messaging.onRequest.addListener("settingsWinClose", function (data, sender, callback) {
                    isSettingsWinOpen = false;
                });

                conduit.messaging.onTopicMessage.addListener('AddAlertToChannelPopup', function (dataObj) {
                    //If this message is for a different popup
                    try {
                        dataObj = JSON.parse(dataObj);
                    }
                    catch (e) {
                        conduit.logging.logDebug('Notification/AppName.js/init - received wrong data: ' + dataObj);
                    }
                    if (dataObj.key.split('_')[1] != currentChannelId) {
                        return;
                    }

                    conduit.storage.global.items.get(dataObj.key, function (arrNewNotifications) {
                        try {
                            arrNewNotifications = JSON.parse(arrNewNotifications);
                        }
                        catch (e) {
                            conduit.logging.logDebug('notificationApp/js/AppName.js - received wrong array: ' + arrNewNotifications);
                            arrNewNotifications = [];
                        }
                        //Sort the new notifications
                        arrNewNotifications.sort(sortByTimestamp(false));

                        //Add them to the global array
                        arrNotifications = arrNotifications.concat(arrNewNotifications);

                        //Show the 'next' button
                        domElements.imgNext.setAttribute('class', 'next button');

                        //Remove the new notifications key
                        conduit.storage.global.items.remove(dataObj.key);
                    });
                });


                if (window.addEventListener)
                    window.addEventListener("message", function (event) { onMessageFromFrame(JSON.parse(event.data)); }, false);
                else {
                    window.attachEvent("onmessage", function (event) { onMessageFromFrame(JSON.parse(event.data)); });
                }
            },

            next: function () {
                if (count == (arrNotifications.length - 1)) {
                    return;
                }
                else {
                    //if the user was looking at the last notification and a new one arrived
                    //count will drop to -1
                    paging = "FORWARD";
                    pagingFileName = arrNotifications[count].fileName;
                    count++;
                    showNotification(arrNotifications[count]);
                }
            },

            prev: function () {
                if (count == 0) {
                    return;
                }
                else {
                    paging = "BACKWARD";
                    pagingFileName = arrNotifications[count].fileName;
                    count--;
                    showNotification(arrNotifications[count]);
                }
            },

            close: function (closedByClick) {
                var popupCloseCallback = function () {
                    conduit.app.popup.close(null);
                };
                var callback = function () {
                    conduit.messaging.sendRequest("backgroundPage", "Alerts", JSON.stringify({ method: 'NotificationClosed', channelId: currentChannelId }), "", popupCloseCallback, popupCloseCallback);
                };
                if (closedByClick) {
                    var pagingReqObj = {
                        type: "CLICK_CLOSE",
                        fileName: arrNotifications[count].fileName
                    };
                    conduit.messaging.sendRequest("backgroundPage", "Alerts", JSON.stringify({ method: 'AlertUsage', reqObj: pagingReqObj }), "", callback, callback);
                }
                else {
                    callback();
                }
            },

            openSettings: function () {
                if (isSettingsWinOpen) {
                    return;
                }
                isSettingsWinOpen = true;
                var screenW = screen.width;
                var screenH = screen.height;
                var offsetX = (screenW - 333) / 2;
                var offsetY = (screenH - 345) / 2;

                conduit.app.popup.open("Settings.html?id=" + currentChannelId,
				{
				    width: 314,
				    height: 195,
				    titel: "title",
				    showFrame: false,
				    closeOnExternalClick: false,
				    saveLocation: false,
				    transparent: true,
				    isAbsolute: true,
				    isFocused: false,  //So it will open on top of the notification (if it's big)
				    openPosition: "offset(" + Math.round(offsetX) + "," + Math.round(offsetY) + ")"
				});
            },

            onMouseOver: function (isOver, buttonName) {
                var folderName = (document.getElementById('prev').src.indexOf('/dark/') !== -1) ? 'dark' : 'light',
                    path = "Images/" + folderName + '/';

                if (buttonName == 'prev')
                    if (isOver)
                        domElements.imgPrev.src = path + "Prev_hover.png";
                    else
                        domElements.imgPrev.src = path + "Prev.png";
                else
                    if (isOver)
                        domElements.imgNext.src = path + "Next_hover.png";
                    else
                        domElements.imgNext.src = path + "Next.png";

            }
        };
    } ();

    //Entry point
    AppNameObj.init();
}

window.onload = initAppName;