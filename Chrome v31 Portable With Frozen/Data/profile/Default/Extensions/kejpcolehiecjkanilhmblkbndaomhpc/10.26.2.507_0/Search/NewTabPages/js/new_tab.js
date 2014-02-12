// Copyright (c) 2012 The Chromium Authors. All rights reserved.
// Use of this source code is governed by a BSD-style license that can be
// found in the LICENSE file.

/**
 * @fileoverview New tab page
 * This is the main code for the new tab page used by touch-enabled Chrome
 * browsers.  For now this is still a prototype.
 */

// Use an anonymous function to enable strict mode just for this file (which
// will be concatenated with other files when embedded in Chrome
cr.define('ntp', function () {
    'use strict';

    /**
    * NewTabView instance.
    * @type {!Object|undefined}
    */
    var newTabView;

    /**
    * The 'notification-container' element.
    * @type {!Element|undefined}
    */
    var notificationContainer;

    /**
    * If non-null, an info bubble for showing messages to the user. It points at
    * the Most Visited label, and is used to draw more attention to the
    * navigation dot UI.
    * @type {!Element|undefined}
    */
    var infoBubble;

    /**
    * If non-null, an bubble confirming that the user has signed into sync. It
    * points at the login status at the top of the page.
    * @type {!Element|undefined}
    */
    var loginBubble;

    /**
    * true if |loginBubble| should be shown.
    * @type {Boolean}
    */
    var shouldShowLoginBubble = false;

    /**
    * The 'other-sessions-menu-button' element.
    * @type {!Element|undefined}
    */
    var otherSessionsButton;

    /**
    * The time in milliseconds for most transitions.  This should match what's
    * in new_tab.css.  Unfortunately there's no better way to try to time
    * something to occur until after a transition has completed.
    * @type {number}
    * @const
    */
    var DEFAULT_TRANSITION_TIME = 500;

    /**
    * See description for these values in ntp_stats.h.
    * @enum {number}
    */
    var NtpFollowAction = {
        CLICKED_TILE: 11,
        CLICKED_OTHER_NTP_PANE: 12,
        OTHER: 13
    };

    /**
    * Creates a NewTabView object. NewTabView extends PageListView with
    * new tab UI specific logics.
    * @constructor
    * @extends {PageListView}
    */

    function NewTabView() {

        chrome.extension.onMessage.addListener(OnTabMessage);

        var pageSwitcherStart = null;
        var pageSwitcherEnd = null;
        //if (loadTimeData.getValue('showApps')) { //always need it
        pageSwitcherStart = getRequiredElement('page-switcher-start');
        pageSwitcherEnd = getRequiredElement('page-switcher-end');
        //}
        this.initialize(getRequiredElement('page-list'),
            getRequiredElement('dot-list'),
            getRequiredElement('card-slider-frame'),
            getRequiredElement('trash'),
            pageSwitcherStart, pageSwitcherEnd);
    }

    function setFocus() {
        if (conduit.newtab.currentPage == loadTimeData.getInteger("search_box_page_id")) {
            chrome.tabs.getCurrent(function (tab) {
                chrome.tabs.update(tab.id, { active: tab.active }, function () {
                    if (!tab.active || !tab.highlighted || !tab.selected) {
                        return;
                    }
                    newTabView.cardSlider.doTransform_(true); //deals with a "freezing effect after clicking BACK arrow after searching
                    //ntp.clickOnSearchbox(tab.active);
                });
            });
        }
    }


    function OnTabMessage(message, sender, callback) {
        if (message.type == "SetSearchBoxFocus") {
            if (ntp.getCardSlider().currentCard == 0) { //SearchBox is being shown on this tab
                chrome.tabs.getCurrent(function (tab) {
                    chrome.tabs.update(tab.id, { selected: true }, function () {
                        //ntp.clickOnSearchbox(true);
                    });
                });
            }
        }
        //		else if (message.type == "createOffscreenTab") {
        //			chrome.experimental.offscreenTabs.create({ url: message.url, width: 1000, height: 1000 }, function (tab) {
        //				var tabId = tab.id;
        //				window.setTimeout(function () {
        //					chrome.experimental.offscreenTabs.toDataUrl(tabId, function (c) {
        //						var imageData = c;
        //						if (imageData) {
        //							chrome.experimental.offscreenTabs.remove(tabId);
        //							callback({ imageData: imageData, language: "en" });
        //						}
        //						;
        //					});
        //				}, 3000);
        //			});
        //			return true;
        //			//return false;
        //		}
    }


    NewTabView.prototype = {
        __proto__: ntp.PageListView.prototype,

        /** @inheritDoc */
        appendTilePage: function (page, title, titleIsEditable, opt_refNode) {
            ntp.PageListView.prototype.appendTilePage.apply(this, arguments);

            if (infoBubble)
                window.setTimeout(infoBubble.reposition.bind(infoBubble), 0);
        }
    };

    //   // loader will 'load' items by calling thingToDo for each item,
    //   // before calling allDone when all the things to do have been done.
    //   function loader(items, thingToDo, allDone) {
    //      if (!items) {
    //         // nothing to do.
    //         return;
    //      }

    //      if ("undefined" === items.length) {
    //         // convert single item to array.
    //         items = [items];
    //      }

    //      var count = items.length;

    //      // this callback counts down the things to do.
    //      var thingToDoCompleted = function (items, i) {
    //         count--;
    //         if (0 == count) {
    //            allDone(items);
    //         }
    //      };

    //      for (var i = 0; i < items.length; i++) {
    //         // 'do' each thing, and await callback.
    //         thingToDo(items, i, thingToDoCompleted);
    //      }
    //   }

    //   function loadImage(items, i, onComplete) {

    //      var bg = getBackgroundPage();
    //      bg.getImage({ url: items[i].url }, function (imageUrl, properties) {

    //         if (properties.favicon) {
    //            items[i].favicon = properties.favicon;
    //         }
    //         if (properties.logo) {
    //            items[i].logo = properties.logo;
    //         }
    //         items[i].image = imageUrl;
    //         onComplete();

    //      });
    //      // notify that we're done.
    //   }

    function loadRecentlyClosed() {

        var recentlyClosed = conduit.newtab.recentlyClosed.getRecentlyClosed();
        try {

            ntp.setRecentlyClosedTabs(recentlyClosed);

        } catch (e) {
            exceptionHandler(e, getLineInfo());
        }


    }

    function isActiveTab(callback) {

        chrome.tabs.getCurrent(function (tab) {
            var isActive = tab.active;
            callback(isActive);
        });

    }
    /**
    * Invoked at startup once the DOM is available to initialize the app.
    */

    function onLoad() {
        if (!conduit.newtab.toolbar.isNewTabEnabled())
            return conduit.newtab.redirectToDefaultNewTab();

        $("#card-slider-frame").show();
        $("#footer").show();
        //debugger;
        sectionsToWaitFor = loadTimeData.getBoolean('showApps') && conduit.newtab.currentPage == loadTimeData.getInteger('apps_page_id') ? 3 : 2;
        measureNavDots();

        // Load the current theme colors.
        themeChanged();

        newTabView = new NewTabView();

        notificationContainer = getRequiredElement('notification-container');
        notificationContainer.addEventListener(
         'webkitTransitionEnd', onNotificationTransitionEnd);

        cr.ui.decorate(document.getElementById('recently-closed-menu-button'), ntp.RecentMenuButton);
        cr.ui.decorate(document.getElementById('search-history-title-menu-button'), ntp.SearchHistoryButton);

        loadRecentlyClosed();
        conduit.newtab.recentlyClosed.onChanged.addListener(loadRecentlyClosed);

        /*
        if (loadTimeData.getBoolean('showOtherSessionsMenu')) {
        otherSessionsButton = getRequiredElement('other-sessions-menu-button');
        cr.ui.decorate(otherSessionsButton, ntp.OtherSessionsMenuButton);
        otherSessionsButton.initialize(loadTimeData.getBoolean('isUserSignedIn'));
        }
        */
        //first do searchbox

        var searchBoxPageName = loadTimeData.getString('searchbox');
        var searchBox = new ntp.SearchBoxPage();
        newTabView.appendTilePage(searchBox, searchBoxPageName, false);
        searchBox.setHtml();

        var mostVisitedPageName = loadTimeData.getString('mostvisited');
        var mostVisited = new ntp.MostVisitedPage(mostVisitedPageName);
        // Move the footer into the most visited page if we are in "bare minimum"
        // mode.
        if (document.body.classList.contains('bare-minimum'))
            mostVisited.appendFooter(getRequiredElement('footer'));

        newTabView.appendTilePage(mostVisited, mostVisitedPageName, false,
         (newTabView.appsPages.length > 0) ?
            newTabView.appsPages[newTabView.appsPages.length] : null);


        //      getBackgroundPage().getTopSites(function (topSites) {

        //         //         var items = [{ image: null, url: "http://www.facebook.com/", title: "face book", direction: "left" },
        //         //                   { image: null, url: "http://www.conduit.com/", title: "Conduit", direction: "right"}];


        //         loader(topSites, loadImage, function () {

        //            ntp.setMostVisitedPages(topSites, "");

        //         });
        //      });


        //        conduit.newtab.mostVisited.getMostVisited(localStorage.option_topsites, function (topSites) {

        //            ntp.setMostVisitedPages(topSites, "");
        //        });
        //


        // KobyM
        //chrome.send('getMostVisited');
        //      var bg = chrome.extension.getBackgroundPage();
        //      var bg2 = bg.document.getElementById("NewTabIframe").contentWindow;
        //      bg2.getImage({ url: "http://www.facebook.com/" }, function (imageUrl, properties) {

        //         ntp.setMostVisitedPages([{ image: imageUrl, url: "http://www.facebook.com", title: "face book", direction: "left" }, { image: imageUrl, url: "http://www.conduit.com", title: "Conduit", direction: "right"}], "");
        //      });

        if (loadTimeData.getBoolean('isSuggestionsPageEnabled')) {
            var suggestions_script = document.createElement('script');
            suggestions_script.src = 'suggestions_page.js';
            suggestions_script.onload = function () {
                newTabView.appendTilePage(new ntp.SuggestionsPage(),
               loadTimeData.getString('suggestions'),
               false,
               (newTabView.appsPages.length > 0) ?
                  newTabView.appsPages[newTabView.appsPages.length] : null);
                // KobyM						  
                //chrome.send('getSuggestions');
            };
            document.querySelector('head').appendChild(suggestions_script);
        }

        var webStoreLink = loadTimeData.getString('webStoreLink');
        if (loadTimeData.getBoolean('isWebStoreExperimentEnabled')) {
            var url = appendParam(webStoreLink, 'utm_source', 'chrome-ntp-launcher');
            document.getElementById('chrome-web-store-href').href = url;
            document.getElementById('chrome-web-store-href').addEventListener('click',
            onChromeWebStoreButtonClick);

            document.getElementById('footer-content').classList.add('enable-cws-experiment');
        }

        if (loadTimeData.getBoolean('appInstallHintEnabled')) {
            var url = appendParam(webStoreLink, 'utm_source', 'chrome-ntp-plus-icon');
            document.getElementById('app-install-hint-template').href = url;
        }

        if (loadTimeData.getString('login_status_message')) {
            loginBubble = new cr.ui.Bubble;
            loginBubble.anchorNode = document.getElementById('login-container');
            loginBubble.setArrowLocation(cr.ui.ArrowLocation.TOP_END);
            loginBubble.bubbleAlignment =
            cr.ui.BubbleAlignment.BUBBLE_EDGE_TO_ANCHOR_EDGE;
            loginBubble.deactivateToDismissDelay = 2000;
            loginBubble.setCloseButtonVisible(false);

            document.getElementById('login-status-advanced').onclick = function () {
                // KobyM						  
                //chrome.send('showAdvancedLoginUI');
            };
            document.getElementById('login-status-dismiss').onclick = loginBubble.hide.bind(loginBubble);

            var bubbleContent = document.getElementById('login-status-bubble-contents');
            loginBubble.content = bubbleContent;

            // The anchor node won't be updated until updateLogin is called so don't
            // show the bubble yet.
            shouldShowLoginBubble = true;
        } else if (loadTimeData.valueExists('ntp4_intro_message')) {
            infoBubble = new cr.ui.Bubble;
            infoBubble.anchorNode = newTabView.mostVisitedPage.navigationDot;
            infoBubble.setArrowLocation(cr.ui.ArrowLocation.BOTTOM_START);
            infoBubble.handleCloseEvent = function () {
                this.hide();
                // KobyM						  
                //chrome.send('introMessageDismissed');
            };

            var bubbleContent = document.getElementById('ntp4-intro-bubble-contents');
            infoBubble.content = bubbleContent;

            bubbleContent.querySelector('div > div').innerHTML =
            loadTimeData.getString('ntp4_intro_message');

            var learnMoreLink = bubbleContent.querySelector('a');
            learnMoreLink.href = loadTimeData.getString('ntp4_intro_url');
            learnMoreLink.onclick = infoBubble.hide.bind(infoBubble);

            infoBubble.show();
            // KobyM						  
            //chrome.send('introMessageSeen');
        }

        var loginContainer = getRequiredElement('login-container');
        loginContainer.addEventListener('click', showSyncLoginUI);

        // Restore Dialog
        var restoreButton = getRequiredElement('restore');
        restoreButton.addEventListener('click', showDialog);

        var contactButton = getRequiredElement('contact');
        contactButton.addEventListener('click', redirectToContactUs);

        var privacyButton = getRequiredElement('privacy');
        privacyButton.addEventListener('click', redirectToPrivacy);

        var DevModeButton = getRequiredElement('DevMode');
        DevModeButton.addEventListener('click', devModeButton);

        var restoreOk = getRequiredElement('restore_dialog_ok');
        restoreOk.addEventListener('click', restoreToDefaultNewTab);
        restoreOk.addEventListener('mousedown', function () { buttonActive(this); });
        restoreOk.addEventListener('mouseout', function () { buttonInactive(this); });

        var restoreCancel = getRequiredElement('restore_dialog_cancel');
        restoreCancel.addEventListener('click', cancelRestore);
        restoreCancel.addEventListener('mousedown', function () { buttonActive(this); });
        restoreCancel.addEventListener('mouseout', function () { buttonInactive(this); });


        var restoreClose = getRequiredElement('restore_dialog_close');
        restoreClose.addEventListener('click', cancelRestore);
        restoreClose.addEventListener('mousedown', function () { buttonActive(this); });
        restoreClose.addEventListener('mouseout', function () { buttonInactive(this); });

        var copyright = getRequiredElement('cr_c');
        copyright.addEventListener('click', copyright_click);

        if (loadTimeData.getBoolean('showApps')) {
            // Request data on the apps so we can fill them in.
            // Note that this is kicked off asynchronously.  'getAppsCallback' will
            // be invoked at some point after this function returns.
            conduit.newtab.applications.getApplication(function (Apps) {
                ntp.getAppsCallback(Apps);
                newTabView.updateSliderCards(conduit.newtab.currentPageIndex);
                cr.dispatchSimpleEvent(document, 'sectionready', true, true, loadTimeData.getInteger('apps_page_id'));
            });
        }

        doWhenAllSectionsReady(function () {
            // Mark the current page.
            newTabView.cardSlider.currentCardValue.navigationDot.classList.add('selected');

            ntp.isActiveTab(function (isActive) {
                conduit.newtab.usage.CallUsage('Impression', 'ScreenType', newTabView.newPageName, 'isActive', isActive);
            });
            /*	  
            if (loadTimeData.valueExists('serverpromo')) {
            var promo = loadTimeData.getString('serverpromo');
            var tags = ['IMG'];
            var attrs = {
            src: function(node, value) {
            return node.tagName == 'IMG' &&
            /^data\:image\/(?:png|gif|jpe?g)/.test(value);
            },
            };
            showNotification(parseHtmlSubset(promo, tags, attrs), [], function() {
            // KobyM						  
            //chrome.send('closeNotificationPromo');
            }, 60000);
            // KobyM						  
            //chrome.send('notificationPromoViewed');
            }
            */
            cr.dispatchSimpleEvent(document, 'ntpLoaded', true, true);
            document.documentElement.classList.remove('starting-up');

            conduit.newtab.mostVisited.getMostVisited(localStorage.option_topsites, function (topSites) {
                ntp.setMostVisitedPages(topSites, "");
            }, function (index, image, href) {
                ntp.MostVisitedPage.prototype.updateTile_.call(ntp.getNewTabView().mostVisitedPage, index, image, href);
            });

            externalSetFocus();
            //document.getElementById('iframeSearchBox').contentWindow.onfocus = function () { si(); };
           // window.onfocus = function () { externalSetFocus(); };

            //console.log("setting initial focus");
            setFocus();
        });

        //conduit.newtab.applications.onAppAdded.addListener(onAppAddedAddListener);
        conduit.newtab.chromeMessageListender(RequestListener);
    }

    function externalSetFocus() {
        if (conduit.newtab.toolbar.hasAlternativeFocus())
            conduit.newtab.toolbar.alternativeFocus();
    }


    //   function onAppAddedAddListener(newApp) {

    //      ntp.appAdded(newApp, false);
    //   }

    function RequestListener(request) {
        if (typeof (request.type) != 'undefined') {
            if (request.type == "appAdded") {

                ntp.appAdded(request.app, false);
            } else if (request.type == "appRemoved") {

                ntp.appRemoved(request.app, true);
            }
        }
    }

    function copyright_click() {
        conduit.newtab.usage.CallUsage('Conduit_CopyRight_link');
        top.location.href = conduit.newtab.getConduitHomepage();
    }

    function redirectToContactUs() {
        conduit.newtab.usage.CallUsage('Click_ContactUs_link');
        top.location.href = conduit.newtab.getContactUsUrl();
    }

    function redirectToPrivacy() {
        conduit.newtab.usage.CallUsage('Click_ContactUs_link');
        top.location.href = conduit.newtab.getPrivacyUrl();
    }


    function devModeButton() {
        conduit.newtab.developerMode.loadIntoNewTab(document);
    }


    function showDialog() {
        var elemId = 'restoreDialogWrapper';
        var innerElemId = 'restoreDialogRestore';
        getRequiredElement(elemId).style.display = 'block';
        if (innerElemId) {
            getRequiredElement(innerElemId).style.display = 'block';
        }
        $("#restore_dialog_cancel").focus();
        conduit.newtab.usage.CallUsage('Click_Restore_link', 'ActionType', 'RestoreLink');
    }

    function cancelRestore() {
        var elemId = 'restoreDialogWrapper';
        var innerElemId = 'restoreDialogRestore';

        getRequiredElement(elemId).style.display = 'none';
        if (innerElemId) {
            getRequiredElement(innerElemId).style.display = 'none';
        }
    }

    function buttonInactive(elem) {
        elem.className = "clickable";
    }

    function buttonActive(elem) {
        elem.className = "clickable pressed";
    }

    function restoreToDefaultNewTab() {
        conduit.newtab.usage.CallUsage('Click_Restore_link', 'ActionType', 'Restore DialogButton');
        cancelRestore();
        conduit.newtab.toolbar.setIsNewTabEnabled(false);

        //conduit.newtab.redirectToDefaultNewTab();
    }

    /**
    * Launches the chrome web store app with the chrome-ntp-launcher
    * source.
    * @param {Event} e The click event.
    */

    function onChromeWebStoreButtonClick(e) {
        // KobyM						  
        //chrome.send('recordAppLaunchByURL',
        //            [encodeURIComponent(this.href),
        //             ntp.APP_LAUNCH.NTP_WEBSTORE_FOOTER]);
    }

    /*
    * The number of sections to wait on.
    * @type {number}
    */
    var sectionsToWaitFor = -1;

    /**
    * Queued callbacks which lie in wait for all sections to be ready.
    * @type {array}
    */
    var readyCallbacks = [];

    //var currentSectionReady = false;
    /**
    * Fired as each section of pages becomes ready.
    * @param {Event} e Each page's synthetic DOM event.
    */
    document.addEventListener('sectionready', function (e) {
        //		if (e.extraData == conduit.newtab.currentPage) {
        //			currentSectionReady = true;
        //		}

        //		if (--sectionsToWaitFor <= 0 && currentSectionReady) {
        //			while (readyCallbacks.length) {
        //				readyCallbacks.shift()();
        //			}
        //		}

        if (--sectionsToWaitFor <= 0) {
            while (readyCallbacks.length) {
                readyCallbacks.shift()();
            }
        }

    });

    /**
    * This is used to simulate a fire-once event (i.e. $(document).ready() in
    * jQuery or Y.on('domready') in YUI. If all sections are ready, the callback
    * is fired right away. If all pages are not ready yet, the function is queued
    * for later execution.
    * @param {function} callback The work to be done when ready.
    */

    function doWhenAllSectionsReady(callback) {
        assert(typeof callback == 'function');
        if (sectionsToWaitFor > 0)
            readyCallbacks.push(callback);
        else
            window.setTimeout(callback, 0); // Do soon after, but asynchronously.
    }

    /**
    * Fills in an invisible div with the 'Most Visited' string so that
    * its length may be measured and the nav dots sized accordingly.
    */

    function measureNavDots() {
        var measuringDiv = document.getElementById('fontMeasuringDiv');
        measuringDiv.textContent = loadTimeData.getString('mostvisited');
        // The 4 is for border and padding.
        var pxWidth = Math.max(measuringDiv.clientWidth * 1.50 + 4, 80);

        var styleElement = document.createElement('style');
        styleElement.type = 'text/css';
        // max-width is used because if we run out of space, the nav dots will be
        // shrunk.
        styleElement.textContent = '.dot { max-width: ' + pxWidth + 'px; }';
        document.querySelector('head').appendChild(styleElement);
    }

    function themeChanged(opt_hasAttribution) {

        //$('themecss').href = 'chrome://theme/css/new_tab_theme.css?' + Date.now();
        // KobyM
        document.getElementById('themecss').href = '../css/new_tab_theme.css';

        if (typeof opt_hasAttribution != 'undefined') {
            document.documentElement.setAttribute('hasattribution',
            opt_hasAttribution);
        }

        updateAttribution();
    }

    function setBookmarkBarAttached(attached) {
        document.documentElement.setAttribute('bookmarkbarattached', attached);
    }

    /**
    * Attributes the attribution image at the bottom left.
    */

    function updateAttribution() {
        var attribution = document.getElementById('attribution');
        if (document.documentElement.getAttribute('hasattribution') == 'true') {
            document.getElementById('attribution-img').src =
            'chrome://theme/IDR_THEME_NTP_ATTRIBUTION?' + Date.now();
            attribution.hidden = false;
        } else {
            attribution.hidden = true;
        }
    }

    /**
    * Timeout ID.
    * @type {number}
    */
    var notificationTimeout = 0;

    /**
    * Shows the notification bubble.
    * @param {string|Node} message The notification message or node to use as
    *     message.
    * @param {Array.<{text: string, action: function()}>} links An array of
    *     records describing the links in the notification. Each record should
    *     have a 'text' attribute (the display string) and an 'action' attribute
    *     (a function to run when the link is activated).
    * @param {Function} opt_closeHandler The callback invoked if the user
    *     manually dismisses the notification.
    */

    function showNotification(message, links, opt_closeHandler, opt_timeout) {
        window.clearTimeout(notificationTimeout);

        var span = document.querySelector('#notification > span');
        if (typeof message == 'string') {
            span.textContent = message;
        } else {
            span.textContent = ''; // Remove all children.
            span.appendChild(message);
        }

        var linksBin = document.getElementById('notificationLinks');
        linksBin.textContent = '';
        for (var i = 0; i < links.length; i++) {
            var link = linksBin.ownerDocument.createElement('div');
            link.textContent = links[i].text;
            link.action = links[i].action;
            link.onclick = function () {
                this.action();
                hideNotification();
            };
            link.setAttribute('role', 'button');
            link.setAttribute('tabindex', 0);
            link.className = 'link-button';
            linksBin.appendChild(link);
        }

        function closeFunc(e) {
            if (opt_closeHandler)
                opt_closeHandler();
            hideNotification();
        }

        function manualCloseFunc(e) {
            if (opt_closeHandler)
                opt_closeHandler();
            hideNotification(true);
        }

        document.querySelector('#notification button').onclick = manualCloseFunc;
        document.addEventListener('dragstart', closeFunc);

        notificationContainer.hidden = false;
        showNotificationOnCurrentPage();

        // don't show notification when moving around pages
        //newTabView.cardSlider.frame.addEventListener('cardSlider:card_change_ended', onCardChangeEnded);

        var timeout = opt_timeout || 10000;
        notificationTimeout = window.setTimeout(hideNotification, timeout);
    }

    /**
    * Hide the notification bubble.
    */

    function hideNotification(manuallyClosed) {
        if (manuallyClosed)
            conduit.newtab.usage.CallUsage('MostVisited_click_close');

        notificationContainer.classList.add('inactive');

        // don't show notification when moving around pages
        //newTabView.cardSlider.frame.removeEventListener('cardSlider:card_change_ended', onCardChangeEnded);
    }

    /**
    * Happens when 1 or more consecutive card changes end.
    * @param {Event} e The cardSlider:card_change_ended event.
    */

    function onCardChangeEnded(e) {
        // If we ended on the same page as we started, ignore.
        if (newTabView.cardSlider.currentCardValue.notification)
            return;

        // Hide the notification the old page.
        notificationContainer.classList.add('card-changed');

        showNotificationOnCurrentPage();
    }

    /**
    * Move and show the notification on the current page.
    */

    function showNotificationOnCurrentPage() {
        var page = newTabView.cardSlider.currentCardValue;
        doWhenAllSectionsReady(function () {
            if (page != newTabView.cardSlider.currentCardValue)
                return;

            // NOTE: This moves the notification to inside of the current page.
            page.notification = notificationContainer;

            // Reveal the notification and instruct it to hide itself if ignored.
            notificationContainer.classList.remove('inactive');

            // Gives the browser time to apply this rule before we remove it (causing
            // a transition).
            window.setTimeout(function () {
                notificationContainer.classList.remove('card-changed');
            }, 0);
        });
    }

    /**
    * When done fading out, set hidden to true so the notification can't be
    * tabbed to or clicked.
    * @param {Event} e The webkitTransitionEnd event.
    */

    function onNotificationTransitionEnd(e) {
        if (notificationContainer.classList.contains('inactive'))
            notificationContainer.hidden = true;
    }

    function setRecentlyClosedTabs(dataItems) {
        document.getElementById('recently-closed-menu-button').dataItems = dataItems;
    }

    function setSearchHistoryPopupTabs(dataItems) {
        document.getElementById('search-history-title-menu-button').dataItems = dataItems;
    }

    function setMostVisitedPages(data, hasBlacklistedUrls) {
        newTabView.mostVisitedPage.data = data;


        //conduit.newtab.thumbnails.getInitialThumbnail();
    }

    function setSuggestionsPages(data, hasBlacklistedUrls) {
        newTabView.suggestionsPage.data = data;
    }

    /**
    * Set the dominant color for a node. This will be called in response to
    * getFaviconDominantColor. The node represented by |id| better have a setter
    * for stripeColor.
    * @param {string} id The ID of a node.
    * @param {string} color The color represented as a CSS string.
    */

    function setStripeColor(id, color) {
        var node = document.getElementById(id);
        if (node)
            node.stripeColor = color;
    }

    /**
    * Updates the text displayed in the login container. If there is no text then
    * the login container is hidden.
    * @param {string} loginHeader The first line of text.
    * @param {string} loginSubHeader The second line of text.
    * @param {string} iconURL The url for the login status icon. If this is null
    then the login status icon is hidden.
    * @param {boolean} isUserSignedIn Indicates if the user is signed in or not.
    */

    function updateLogin(loginHeader, loginSubHeader, iconURL, isUserSignedIn) {
        if (loginHeader || loginSubHeader) {
            document.getElementById('login-container').hidden = false;
            document.getElementById('login-status-header').innerHTML = loginHeader;
            document.getElementById('login-status-sub-header').innerHTML = loginSubHeader;
            document.getElementById('card-slider-frame').classList.add('showing-login-area');

            if (iconURL) {
                document.getElementById('login-status-header-container').style.backgroundImage = url(iconURL);
                document.getElementById('login-status-header-container').classList.add('login-status-icon');
            } else {
                document.getElementById('login-status-header-container').style.backgroundImage = 'none';
                document.getElementById('login-status-header-container').classList.remove(
               'login-status-icon');
            }
        } else {
            document.getElementById('login-container').hidden = true;
            document.getElementById('card-slider-frame').classList.remove('showing-login-area');
        }
        if (shouldShowLoginBubble) {
            window.setTimeout(loginBubble.show.bind(loginBubble), 0);
            // KobyM						  
            //chrome.send('loginMessageSeen');
            shouldShowLoginBubble = false;
        } else if (loginBubble) {
            loginBubble.reposition();
        }
        if (otherSessionsButton)
            otherSessionsButton.updateSignInState(isUserSignedIn);
    }

    /**
    * Show the sync login UI.
    * @param {Event} e The click event.
    */

    function showSyncLoginUI(e) {
        var rect = e.currentTarget.getBoundingClientRect();
        // KobyM						  
        //chrome.send('showSyncLoginUI',
        //            [rect.left, rect.top, rect.width, rect.height]);
    }

    /**
    * Wrappers to forward the callback to corresponding PageListView member.
    */

    function appAdded() {
        return newTabView.appAdded.apply(newTabView, arguments);
    }

    function appMoved() {
        return newTabView.appMoved.apply(newTabView, arguments);
    }

    function appRemoved() {
        return newTabView.appRemoved.apply(newTabView, arguments);
    }

    function appsPrefChangeCallback() {
        return newTabView.appsPrefChangedCallback.apply(newTabView, arguments);
    }

    function appsReordered() {
        return newTabView.appsReordered.apply(newTabView, arguments);
    }

    function enterRearrangeMode() {
        return newTabView.enterRearrangeMode.apply(newTabView, arguments);
    }

    function setForeignSessions(sessionList, isTabSyncEnabled) {
        if (otherSessionsButton)
            otherSessionsButton.setForeignSessions(sessionList, isTabSyncEnabled);
    }

    function getAppsCallback() {
        return newTabView.getAppsCallback.apply(newTabView, arguments);
    }

    function getAppsPageIndex() {
        return newTabView.getAppsPageIndex.apply(newTabView, arguments);
    }

    function getCardSlider() {
        return newTabView.cardSlider;
    }

    function leaveRearrangeMode() {
        return newTabView.leaveRearrangeMode.apply(newTabView, arguments);
    }

    function saveAppPageName() {
        return newTabView.saveAppPageName.apply(newTabView, arguments);
    }

    function setAppToBeHighlighted(appId) {
        newTabView.highlightAppId = appId;
    }

    function clickOnSearchbox(isActive) {
        // this sets focus on the textbox in searchbox
        // return;
        var win = document.getElementById('iframeSearchBox').contentWindow;
        win.focus();
        var doc = win.document;
        var myField = doc.getElementById('q');

        if (myField) {
            myField.click();


            myField.value = myField.value;
            window.setTimeout("document.getElementById('iframeSearchBox').contentWindow.focus()", 1000);
        }
        if (!isActive) {
            $(doc).click();
        }
    }

    function getNewTabView() {
        return newTabView;
    }
    // Return an object with all the exports
    return {
        appAdded: appAdded,
        appMoved: appMoved,
        appRemoved: appRemoved,
        appsPrefChangeCallback: appsPrefChangeCallback,
        enterRearrangeMode: enterRearrangeMode,
        getAppsCallback: getAppsCallback,
        getAppsPageIndex: getAppsPageIndex,
        getCardSlider: getCardSlider,
        isActiveTab: isActiveTab,
        onLoad: onLoad,
        leaveRearrangeMode: leaveRearrangeMode,
        NtpFollowAction: NtpFollowAction,
        saveAppPageName: saveAppPageName,
        setAppToBeHighlighted: setAppToBeHighlighted,
        setBookmarkBarAttached: setBookmarkBarAttached,
        setForeignSessions: setForeignSessions,
        setMostVisitedPages: setMostVisitedPages,
        setSuggestionsPages: setSuggestionsPages,
        setRecentlyClosedTabs: setRecentlyClosedTabs,
        setSearchHistoryPopupTabs: setSearchHistoryPopupTabs,
        setStripeColor: setStripeColor,
        showNotification: showNotification,
        themeChanged: themeChanged,
        updateLogin: updateLogin,
        clickOnSearchbox: clickOnSearchbox,
        getNewTabView: getNewTabView,
        externalSetFocus: externalSetFocus
    };
});

document.addEventListener('DOMContentLoaded', ntp.onLoad);
