// Match.js
// MINVERSION=10.11.40.0

// Inner Version: 9.4

var conduitEnv = conduitEnv || {};
(function setupNumberOfToolbars() {
    var checkLocalStorageAvailbility = function () {
        try {
            if (typeof (localStorage) !== "undefined") {
                return true;
            }
            return false;
        } catch (e) {
            return false;
        }
    };

    var getFromLocalStorage = function() {
        return checkLocalStorageAvailbility() && localStorage.getItem("numberOfToolbars");
    };

    conduitEnv.numberOfToolbars = conduitEnv.numberOfToolbars || (!chrome.storage && getFromLocalStorage()) || 1; // If no storage, get from localStorage as in old versions
    if (chrome.storage) {
        // If we have storage, always get from storage
        chrome.storage.local.get(["numberOfToolbars"], function (res) {
            if (res.numberOfToolbars){
                conduitEnv.numberOfToolbars=res.numberOfToolbars;
            }
        });
    }
}());

(function match() {

    if (!conduitEnv.compatibility) {
        conduitEnv.matchRunner = match;
        return;
    }

    var compatibility = conduitEnv.compatibility;

    var toolbarHeight = 35;
    var toolbarMargin = function () {
        return conduitEnv.numberOfToolbars * toolbarHeight;
    };


    function createAttrObserver(element, filter, callback) {
        if (typeof element === 'undefined' || !Array.isArray(filter) || typeof callback !== 'function') { return; }

        var observer = new WebKitMutationObserver(function (mutations) {
            if (callback && mutations && mutations[0]) {
                callback(mutations[0]);
            }
        });
        observer.observe(element, { attributes: true, attributeFilter: filter });
        return observer;
    }

    // Generic observer for an element that calls on mutation to style attribute
    function createStyleObserver(element, callback) {
        return createAttrObserver(element, ['style'], callback);
    }

    // Generic observer for an element that calls on mutation to class attribute
    function createClassObserver(element, callback) {
        return createAttrObserver(element, ['class'], callback);
    }

    // Generic observer that fires callback when an element is added to the document
    // Note: this function actually works as intended
    // TODO: move things to work with this function instead of createElementAddedObverser when we fix bugs in those sites that use it
    function createElementAddedObserver2(query, callback, keepAlive) {
        if (typeof query !== 'string' || typeof callback !== 'function') { return; }

        var prefix = new Date().getTime();
        function reportOnce(ele) {
            if (!ele[prefix+'_obsreported']) {
                ele[prefix+'_obsreported'] = true;
                callback(ele);
            }
        }

        var observer = new WebKitMutationObserver(function (mutations) {
            var elementsAdded;
            mutations.forEach(function (mutation) {
                if (mutation.addedNodes && mutation.addedNodes.length) {
                    elementsAdded = true;
                    return false;
                }
            });

            if (elementsAdded) {
                var eles = document.querySelectorAll(query);

                if (eles.length) {
                    if (!keepAlive) {
                        observer.disconnect();
                        reportOnce(eles[0]);
                        return false;
                    }

                    for (var i=0; i<eles.length; i++) {
                        if (eles[i]) {
                            reportOnce(eles[i]);
                        }
                    }
                }
            }
        });

        observer.observe(document.documentElement, { childList: true, subtree: true, attributes: false });
        return observer;
    }


    // TODO: the keepAlive mechanism in this function is not working as intended. it fires an added event when any node is added.
    // we should replace it with the working function when we can test next, until we can stop using this function alltogether
    function createElementAddedObverser(query, callback, keepAlive) {
        if (typeof query !== 'string' || typeof callback !== 'function') { return; }

        var observer = new WebKitMutationObserver(function (mutations) {
            mutations.forEach(function (mutation) {
                if (mutation.addedNodes && mutation.addedNodes.length) {
                    var ele = document.querySelector(query);
                    if (ele) {
                        if (!keepAlive) {
                            observer.disconnect();
                        }
                        callback(ele);
                        return false;
                    }
                }
            });
        });
        observer.observe(document.documentElement, { childList: true, subtree: true, attributes: false });
        return observer;
    }

    // Adds a custom css element
    function setCss(content, id) {
        var style = document.getElementById('conduitMatchCustomCss' + (id || ''));
        if (!style) {
            var style = document.createElement('style');
            style.id = 'conduitMatchCustomCss' + (id || '');
            (document.head || document.documentElement).appendChild(style);
        }
        style.innerHTML = content;
    }

    // Pricesparrow app injects its own toolbar creating lots of probelems. this pushes the extra toolbar down and the html as well (bug 38905)
    createClassObserver(document.documentElement, function() {
        if (document.documentElement.className.indexOf('pricesparrow-toolbar-visible') != -1) {
            document.documentElement.revertTo = document.documentElement.revertTo || document.documentElement.style.getPropertyValue('margin-top');
            document.documentElement.style.setProperty('margin-top', compatibility.calcCombinedToobarsInfo().combinedHeight + 30 + 'px', 'important');
        } else if (document.documentElement.revertTo) {
            document.documentElement.style.setProperty('margin-top', document.documentElement.revertTo, 'important');
            document.documentElement.revertTo = null;
        }
    });

    createElementAddedObverser('#pricesparrow-toolbar', function (ele) {
        var css = 'div#pricesparrow-toolbar { top: '+ compatibility.calcCombinedToobarsInfo().combinedHeight + 'px !important; z-index: 2147483640 !important; }'+
            'html.pricesparrow-toolbar-visible div#pricesparrow-toolbar { top: 0 !important; z-index: 2147483640 !important; }'

        setCss(css, 'pricesparrow');
    });

    createElementAddedObverser('.cashbar_toolbar_002', function (ele) {

        ele.style.setProperty('margin-top',getHtmlBodyOffset().combinedOffset +  'px', 'important');
    });

    //hot spot shield app injects itself on the toolbar and creating problems (bug 26882)
    var observer = new WebKitMutationObserver(function (mutations) {
        /*i want to make the fix after we have the hotspot elements and out iframe wrapper*/
        var elemenstArr=document.querySelectorAll("div[class^='AFc_all']");
        var mainWrapper= document.getElementById("main-iframe-wrapper");
        var numberOfWebToolbars=0;
        if (elemenstArr.length>0){
            numberOfWebToolbars=compatibility.calcCombinedToobarsInfo().numberOfWebToolbars;
            /*handle case of SB and OB together. The problem is that the old bar change the toolbar top all the time
             i am adding important to the element to stop this
             */
            if (numberOfWebToolbars>0){
                for (var i=0 ; i<elemenstArr.length;i++){
                    if (!elemenstArr[i].getAttribute('OB_with_hot_spot_fix')){
                        var currTop = parseInt(elemenstArr[i].style.getPropertyValue('top'));
                        elemenstArr[i].style.setProperty('top', currTop + 'px','important');
                        elemenstArr[i].setAttribute('OB_with_hot_spot_fix', true);
                    }
                }
            }
            if (mainWrapper){
                var currTop = parseInt(mainWrapper.style.getPropertyValue('top'));
                if (isNaN(currTop)) {
                    mainWrapper.style.setProperty('top', 0 + 'px');
                }else{
                    /*i want to handle the hot spot only once (90 - the hotspot sheild height)*/
                    if (!mainWrapper.getAttribute('hot_spot_fix')&&currTop!=0) {
                        var newTop= currTop - 90;
                        if (newTop<0){
                            newTop=0;
                        }
                        mainWrapper.setAttribute('hot_spot_fix', true);
                        mainWrapper.style.setProperty('top', newTop + 'px');
                    }
                }
            }
        }
        if (mainWrapper){
            /*This case is when the user closes the hotspot component then the wrapper top was negative
             - if i handled the mainIframe wrapper and the top of the main iframe wrapper is less then 0
             */
            if (mainWrapper.getAttribute('hot_spot_fix') && parseInt(mainWrapper.style.getPropertyValue('top'))<0){
                numberOfWebToolbars=compatibility.calcCombinedToobarsInfo().numberOfWebToolbars;
                mainWrapper.style.setProperty('top', numberOfWebToolbars*34 + 'px');
            }
        }
    });
    observer.observe(document.documentElement, { childList: true, subtree: true, attributes: false });


    compatibility.setSpecificSite([
        /^https?:\/\/docs\.google\.[^\/]+\/\w+\//,
        /^https?:\/\/www\.google\.[^\/]+\/(settings|offers|calendar)/,
        /^https?:\/\/[^\/]*skydrive\.live\.com/,
        /^https?:\/\/[^\/]*apps\.live\.com/,
        /^https?:\/\/plus\.google\./,
        /^https?:\/\/agoogleaday\./,
        /^https?:\/\/www\.blogger\./,
        /^https?:\/\/office\.microsoft\.com/,
        /^https?:\/\/profile\.live\.com/,               // Page sometimes doesn't load (bug 46830)
        /^https?:\/\/[^\/]*facebook\.com/,
        /^https?:\/\/[^\/]*amazon\./,
        /^https?:\/\/[^\/]*hao123\.com/,
        /^https?:\/\/[^\/]*bing\.com\/travel/,
        /^https?:\/\/([^\/]+\.)?calendar\.live\.com/,   // Complete page rewite (bug 46662)
        /^https?:\/\/www\.apple\.com/,
        /^https?:\/\/[^\/]*twitter\.com/,
        /^https?:\/\/[^\/]*swagbucks\.com/,
        /^https?:\/\/[^\/]*incredi(mail|bar)\.com/,
        /^https?:\/\/[^\/]*baidu\.com/,
        /^https?:\/\/(drive)\.google\./,
        'www.rr.com',
        /^https?:\/\/(www\.)?bbc\.co/,					// Mislocated search suggest in top right corner (bug 37776)
        /^https?:\/\/[^\/]*wordpress\.com\/?($|#|\?)/,  // Vertical scrollbar appears (bug 37434)
        /^https?:\/\/(\w+\.)*stylelist\.com/,           // Click on items (go to fullscreen) issue, bug 40681
        /^https?:\/\/([^\/]+\.)?focusatwill\.com/,      // Incorrect height calculation (bug 45366)
        /^https?:\/\/video\.soso\.com/,                 // Incorrect autocomplete location (bug 46661)
        /^https?:\/\/home\.mywebsearch\.com/,           // Broken layout (bug 46669)
        'www.cad-comic.com',                            // fix#44464
        /^https?:\/\/\w+\.walla\.co\.il/
    ], { setHtmlRelative: false });

    compatibility.setSpecificSite([
        /^https?:\/\/[^\/]*wordpress\.com\/?($|#|\?)/,      // Vertical scrollbar appears (bug 37434)
        /^https?:\/\/www\.bing\.com\/(account|explore)/,    // Vertical scrollbar appears (bug 37327, 37422)
        /^https?:\/\/featuredcontent\.utorrent\.com/        // Vertical scrollbar appears (bug 39489)
    ], {
        setBodyAbsoluteStyle: false
    });
    /*FIX 52537 - Compatibility >google maps won't work if the toolbar is installed*/
    compatibility.setSpecificSite(['https://www.google.com/maps/preview'], {
        setBodyAbsoluteStyle: false
        ,setHtmlRelative: false
    });

    /*Fix 48539- Compatibility->Incorrect place for pop up dialog on google+ site*/
    compatibility.setSpecificSite(['https://www.google.com/intl/en/+/business/get-started.html'], {        setBodyAbsoluteStyle: false        ,setHtmlRelative: false    });

    /*FIX 52537 - Compatibility >google maps won't work if the toolbar is installed*/
    compatibility.setSpecificSite(['https://www.google.com/maps/preview'], function () {
        setTimeout(function(){
            document.body.style.position='relative';
            fix100p();
        },5000)
    }, 'document');
    // Setting page to not relative and setting the gb to relative so it shows (bug 37338)
    compatibility.setSpecificSite([/^https?:\/\/www\.google\.[^\/]+\/offers/], function () {
        var gb = document.getElementById('gb');
        if (gb) {
            gb.style.setProperty('position', 'relative', 'important');
        }
    }, 'document');

    // scrollbar appears inside box (bug 37242)
    compatibility.setSpecificSite(/^https?:\/\/plus\.google\..+\/getstarted/, function() {
        var once, counter = 0;
        (function monitorLoc() {
            var el = document.getElementById('content');
            if (el) {
                el.parentNode.style.setProperty('padding-top', parseInt(getComputedStyle(el).getPropertyValue('margin-top'), 10) + toolbarHeight + 'px');
            } else {
                if (counter++ < 10) {
                    setTimeout(monitorLoc, 100);
                }
            }
        }());
    }, 'document');

    compatibility.setSpecificSite(/^https?:\/\/(www\.)?twitter\.com\/?$/,function(){
        document.documentElement.style.setProperty("height","auto");
    }, 'document');

    /*fix bug 39015*/
    compatibility.setSpecificSite(/^https?:\/\/baike\.baidu\.com\/?$/,function(){
        var elem=document.getElementsByClassName("pi-left")[0];
        if (elem){
            var currMtop = parseInt(elem.style.getPropertyValue('margin-top'));

            if (isNaN(currMtop)) {

                currMtop = 0;

            }
            elem.style.setProperty('margin-top', (currMtop+toolbarHeight) + 'px');
        }
    }, 'document');

    /*Fix bug 39005*/
    compatibility.setSpecificSite("http://map.baidu.com/search.html",function(){
        document.documentElement.style.setProperty("position","relative");
    }, 'document');

    // search margin gets overriden, bugfix 44719
    compatibility.setSpecificSite(/^https?:\/\/([^\/]+\.)?slacker.com/, function() {
        setCss('#search { margin-top: ' + compatibility.calcCombinedToobarsInfo().combinedHeight + 'px !important }');
    }, 'document');

    // temp fix for a bug - small margin of toolbar from page top, should be margin: 0 in generic way. bugfix 44723
    compatibility.setSpecificSite(/^https?:\/\/www\.google\.com\/enterprise/, function() {
        document.getElementById('main-iframe-wrapper').style.setProperty('margin', 0);
    }, 'document');

    // google already calculates position according to margin, bugfix 44732
    compatibility.setSpecificSite(/^https?:\/\/www\.google\.com\/analytics/, {
        skipFixedSelectors: ['#ID-headerPanel']
    });

    // #exit-bar is absolute positioned and relative html doesn't help, it remains hidden behind the toolbar - this manually moves it down
    compatibility.setSpecificSite(/^https?:\/\/agoogleaday\./, function () {
        var exitBar = document.getElementById('exit-bar');
        if (exitBar) {
            var valToSet = parseInt(exitBar.style.getPropertyValue('margin-top') || 0, 10) + toolbarHeight;
            exitBar.style.setProperty('margin-top', valToSet + 'px');
        }
    }, 'document');


    // blogger main screen is (at the time of writing this) a nightmare if you want to add a margin.
    // solution: make the whole html fixed positioned, and catch the popups it opens manually (they are not fixed and so not caught by our generic way)
    compatibility.setSpecificSite(/^https?:\/\/www\.blogger\.[^\/]+\/home/, function () {
        document.documentElement.style.setProperty('position', 'fixed', 'important');
        var popupObserver = new WebKitMutationObserver(function (mutations) {
            mutations.forEach(function (mutation) {
                if (mutation.addedNodes) {
                    var popup = document.querySelector('.popupContent');
                    if (popup) {
                        var oldMtop = parseInt(getComputedStyle(popup).getPropertyValue('margin-top'), 10);
                        popup.style.setProperty('margin-top', (oldMtop + toolbarHeight) + 'px');
                    }
                    return false;
                }
            });

        });
    }, 'instant');

    // Header z-index is higher than our popups', bug #32720
    compatibility.setSpecificSite(/https?:\/\/toolbar\.conduit\.com/, function () {
        var header = document.getElementById('conduit_ups');
        if (header) {
            header.style.setProperty('z-index', 2147483000);
        }
    }, 'document');

    // A margin pushes the bottom part of the document down, creating a scrollbar. setting fixed height on html helps, but scrollbar still appears
    // when page is resized, a scrollbar may be visisble anyway (because not all content fits)
    // We only attempt to fix this for 1 toolbar, with 2 the page is too big
    compatibility.setSpecificSite(/https?:\/\/mobile\.conduit\.com/, function () {
        function fixScroll() {
            var ele = document.getElementsByClassName('footer')[0];
            if (!ele) { return; }

            if (document.body.scrollHeight - document.body.clientHeight === toolbarHeight) {
                var eleBot = parseInt(getComputedStyle(ele).getPropertyValue('bottom'), 10);
                if (eleBot === 0) {
                    ele.style.setProperty('bottom', (toolbarHeight - 2) + 'px');
                    document.documentElement.style.setProperty('overflow-y', 'hidden');
                }
            } else {
                ele.style.removeProperty('bottom');
                document.documentElement.style.removeProperty('overflow-y');
            }
        }

        window.addEventListener('resize', fixScroll, false);
        window.addEventListener('load', fixScroll, false);
        fixScroll();
    }, 'document');

    // Bugfix 39066 using background-attachment breaks (its like fixed element, and we dont handle it in a generic way since its so rare)
    compatibility.setSpecificSite(/https?:\/\/(\w+\.)*avanquest\.com/, function () {
        setCss('#header { background-attachment: scroll !important; }');
    });

    // the page has a css margin-top:0px !important rule. this breaks the fixed elements moving code.
    // We could potentially solve it by using !important in generic compatibility but we want to deal with this bug inside the match file
    compatibility.setSpecificSite(/https?:\/\/blog\.swagbucks\.com/, function () {
        var currmtop = document.documentElement.style.getPropertyValue('margin-top');
        if (currmtop) {
            document.documentElement.style.setProperty('margin-top', currmtop, 'important');
        }
    });

    // bugfix 44681, 45885
    compatibility.setSpecificSite(/^https?:\/\/([^\/]+\.)?divx.com/, function() {
        function checkHashAndAdjustScroll() {
            var hash = (window.location.hash || '').slice(1);
            if (!hash) { return; }

            if (document.getElementById(hash) && document.body.scrollTop > 0) {
                document.body.scrollTop -= 35;
            }
        }
        checkHashAndAdjustScroll();

        document.addEventListener('click', function(e) {
            if (e.target.nodeName.toLowerCase() === 'a' && e.target.hash) {
                setTimeout(checkHashAndAdjustScroll, 100);
            }
        }, false);
    }, 'document');

    // Without this small fix the html is not fully visible
    compatibility.setSpecificSite(/^https?:\/\/www\.blogger\.[^\/]+\/home/, function () {
        var elemToSet;
        var candidates = document.querySelectorAll('body > div') || [];
        Array.prototype.forEach.call(candidates, function (item) {
            if ((item.className || '').indexOf('GPF') !== -1) {
                elemToSet = item;
                return false;
            }
        });

        if (elemToSet) {
            elemToSet.style.setProperty('bottom', compatibility.calcCombinedToobarsInfo().combinedHeight + 'px');
        }
    }, 'document');

    // chatbox position, right panel hover popup position, image fullscreen mode
    compatibility.setSpecificSite(/^https?:\/\/[^\/]*facebook\.com/, {
        skipFixedSelectors: ['.uiContextualLayerPositionerFixed', '.uiContextualDialogFixed', '.fbPhotoSnowlift.fullScreenAvailable']
    });

    // Generic skipped selectors list (because compatibility.start.js is a bad place to have a static list)
    compatibility.setSpecificSite(window.location.href.toLowerCase(), {
        skipFixedSelectors: [
            '.cashbar_toolbar',     // coupon buddy
            '#pricesparrow-toolbar' // price sparrow (bug 38905)
        ]
    });

    // bug 27514
    compatibility.setSpecificSite(/^https?:\/\/blogsofnote\.blogspot\.co\.il/, function () {
        document.documentElement.style.setProperty('margin-top', '0px', 'important');
    }, {
        skipFixedSelectors: ['*']
    });

    // Page doesnt appear (bug 32602), page is offset (bug 32706), pages dont appear (46829)
    compatibility.setSpecificSite(/^https?:\/\/account\.live\.com\//i, function () {
        // For some reason setting direct style property resulted in page deformation, but via css rule everything is fine
        document.body.style.setProperty('position', 'fixed');
    }, {
        setHtmlRelative: false
    }, 'body');

    // bugfix 46756
    compatibility.setSpecificSite(/^https?:\/\/([^\/]+\.)?calendar\.live\.com/,function(){
        createElementAddedObserver2('iframe[extensionid=' + chrome.i18n.getMessage('@@extension_id') + ']', function() {
            var tbH = compatibility.calcCombinedToobarsInfo().combinedHeight;
            setCss('#c_base { margin-top:' + tbH + 'px; } .CalendarOptionBody { margin-bottom: ' + tbH + 'px; }');
        });
    }, 'instant');

    // scrollbar fix
    compatibility.setSpecificSite(/^https?:\/\/[^\/]*mail\.live\.com/, function () {
        var lastChange = new Date();
        createStyleObserver(document.documentElement, function (mutation) {
            // Safety first
            if (new Date() - lastChange < 1000) { return; }

            var elm = document.documentElement;
            if (elm.style.marginTop !== toolbarMargin() + "px") {
                lastChange = new Date();
                elm.style.marginTop = toolbarMargin() + "px";
            }
        });

        // This is tricky: sometimes the whole thing is inside an iframe, sometimes in a div
        var createCalcHeightForItem = function (selector) {
            var elemToSet;
            return function calcHeight() {
                elemToSet = elemToSet || document.querySelector(selector);
                if (elemToSet) {
                    elemToSet.style.setProperty('height', (document.documentElement.clientHeight - toolbarMargin()) + 'px');
                }
            };
        };

        var calcFrameHeight = createCalcHeightForItem('#appFrame');
        var calcDivHeight = createCalcHeightForItem('.App.Managed .AppInner');
        var calcHeights = function () {
            calcFrameHeight();
            calcDivHeight();
        };

        window.addEventListener('resize', calcHeights, false);
        calcHeights();


    }, 'document');

    compatibility.setSpecificSite([/^https?:\/\/[^\/]*skydrive\.live\.com/,/^https?:\/\/[^\/]*apps\.live\.com/], function() {
        var docElementClassName = document.documentElement.className;
        function handleSiteHeight(){
            document.documentElement.style.setProperty('height', '100%');
            var elem= document.getElementById("c_base");
            if (elem){
                var currTop= parseInt(elem.style.top);
                if (isNaN(currTop)) {
                    currTop = 0;
                }
                elem.style.setProperty('top', (currTop + toolbarHeight) + 'px');

            }

        }
        handleSiteHeight();
        createStyleObserver(document.documentElement, function (mutation) {
            var currClassName = document.documentElement.className;
            if (currClassName!=docElementClassName){
                docElementClassName=currClassName;
                handleSiteHeight();

            }

        });

        var obs;
        function testit() {
            if (document.body.style.getPropertyValue('height') === '100%') {
                document.body.style.setProperty('height', (window.innerHeight - compatibility.calcCombinedToobarsInfo().combinedHeight)+'px', 'important');
                obs.disconnect();
            }
        }
        obs = createStyleObserver(document.body, testit);
        testit();

    }, {
        overrideHeightScript: true,
        enforceMarginTop: true
    },'document');


    // Hide vertical scroll on bing homepage (bug 32603)
    compatibility.setSpecificSite(/^https?:\/\/www\.bing\.com($|\/$|\/\W)/, function () {
        function onResize() {
            var shouldHideScroll = document.body.scrollHeight - document.body.clientHeight === compatibility.calcCombinedToobarsInfo().combinedHeight;
            if (shouldHideScroll) {
                document.documentElement.style.setProperty('overflow-y', 'hidden');
            } else {
                document.documentElement.style.removeProperty('overflow-y');
            }
        }
        window.addEventListener('resize', onResize, false);
        window.addEventListener('load', onResize, false);
        onResize();
    }, 'document');

    // Mislocated video preview in search results (bug 37773)
    compatibility.setSpecificSite(/^https?:\/\/www\.bing\.com\/search/, function() {
        createElementAddedObverser('.irhc', function (ele) {
            var currMtop = parseInt(ele.style.getPropertyValue('margin-top'));
            if (isNaN(currMtop)) {
                currMtop = 0;
            }
            ele.style.setProperty('margin-top', (currMtop - toolbarHeight) + 'px');
        });
    }, 'document');

    /*fix bug 38212*/
    compatibility.setSpecificSite(/^https?:\/\/www\.bing\.com\/videos/, function() {
        document.documentElement.style.removeProperty("height");

    }, 'document');

    // vertical scrollbar appears (bug 37422)
    compatibility.setSpecificSite(/^https?:\/\/www\.bing\.com\/account\/web/, function () {
        document.getElementById('sw_footL').style.setProperty('margin-bottom', '25px');
    }, 'document');

    // This section will be called only once per toolbar starting now (no control over older versions)
    if (compatibility.isHandlingMultipleToolbars) {
        // In yahoo main site the margin always causes a scrollbar to appear
        compatibility.setSpecificSite(/^https?:\/\/[^\/]*yahoo\.com/, function () {
            function hideScrollIfNeeded() {
                if (document.body.clientHeight <= window.innerHeight && document.body.scrollHeight - document.body.clientHeight === compatibility.calcCombinedToobarsInfo().combinedHeight) {
                    if (getComputedStyle(document.body).getPropertyValue('overflow-y') !== 'hidden') {
                        document.body.scrollTop = 0
                        document.body.style.setProperty('overflow-y', 'hidden');
                    }
                } else {
                    document.body.style.removeProperty('overflow-y');
                }
            }

            var scrollHObserver = new WebKitMutationObserver(hideScrollIfNeeded);
            setTimeout(function loop() {
                hideScrollIfNeeded();
                setTimeout(loop, 500);
            }, 1000);
            scrollHObserver.observe(document.body, { attributes: true });
        }, 'document');

        // fixes scrollbar, scroll down to down the top part
        compatibility.setSpecificSite(/^https?:\/\/mail\.google\./, function () {
            /*var firstTime = true;
             function onResize() {
             // This part is backwards compatibility
             if (firstTime) {
             document.body.style.removeProperty('height');
             firstTime = false;
             }
             document.body.scrollTop = 0;
             var toSet = document.documentElement.clientHeight - compatibility.calcCombinedToobarsInfo().combinedHeight + 'px';
             document.body.style.setProperty('height', toSet);
             document.documentElement.style.setProperty('height', toSet);
             }
             window.addEventListener('resize', onResize, false);
             onResize();

             var elem = document.getElementsByClassName("tq")[0];
             var observer = new WebKitMutationObserver(function (mutations) {
             elem = document.getElementsByClassName("tq")[0];
             if (elem) {
             observer.disconnect();
             var needToSet=true;
             var menuObserver = createStyleObserver(elem,function(mutation){
             if (parseInt(elem.style.top)<0){
             needToSet=true;
             }
             if(document.location.href.indexOf("#contact")!=-1){
             if (parseInt(elem.style.top)>0&&needToSet){
             if ((parseInt(elem.style.top)>0)){
             var currTop = parseInt(elem.style.getPropertyValue('top'));
             if (isNaN(currTop)) {
             currTop = 0;
             }
             needToSet=false;
             if (currTop<500){
             var newTop=(currTop - compatibility.calcCombinedToobarsInfo().combinedHeight);
             elem.style.removeProperty("top");
             setTimeout(function(){
             elem.style.setProperty("top", newTop + 'px');
             },50);
             }
             }

             }
             }
             });


             }
             });
             observer.observe(document.documentElement, { childList: true, subtree: true, attributes: false });*/



        }, 'document');
    }

    compatibility.setSpecificSite(/^https?:\/\/plus\.google\./, function () {
        // Find topmost parent of #gb that is not the body, and set it relative
        var gbParent = document.getElementById('gb');
        if (gbParent && gbParent !== document.body) {
            while (gbParent && gbParent.parentNode !== document.body) {
                gbParent = gbParent.parentNode;
            }
        }

        if (gbParent) {
            gbParent.style.setProperty('position', 'relative');
        }
    }, 'document');


    compatibility.setSpecificSite('facebook.com', (function () {
        createElementAddedObserver2('#timeline_sticky_header .uiIconText', function(ele) {
            var marginToPushTooltip = compatibility.calcCombinedToobarsInfo().combinedHeight;
            var statusCanceled;
            function onHover(firstTime) {
                if (!firstTime && statusCanceled) {	return;	}
                statusCanceled = false;

                // First time the element doesn't have an id
                if (!ele.id) {
                    createAttrObserver(ele, ['id'], function() {
                        onHover();
                    });
                    return;
                }

                function moveTooltip(tooltip) {
                    tooltip.style.setProperty('margin-top', marginToPushTooltip + 'px');
                }

                var existing = document.querySelector('.uiContextualLayerPositioner[data-ownerid="'+ele.id+'"]');
                if (existing) {
                    moveTooltip(existing);
                }
            }

            ele.addEventListener('mouseover', onHover, false);
            ele.addEventListener('mouseout', function () {
                statusCanceled = true;
            }, false);

            // Generated id is used to find the current element from the injected script
            var generatedId = Math.floor(new Date() / 1000 % 1 * 1000) + Math.floor(Math.random() * 1000000);
            ele.setAttribute('data-conduit-pushme', ''+generatedId);
            function toInject() {
                var id = REPLACEWITHID;
                var element = document.querySelector('[data-conduit-pushme="'+id+'"]');
                var prevFunc = element.getBoundingClientRect;
                element.getBoundingClientRect = function () {
                    var res = prevFunc.apply(this, arguments);

                    res.topVal = res.top - 35;
                    res.bottomVal = res.bottom - 35;
                    res.__defineGetter__('top', function () {
                        return this.topVal;
                    });
                    res.__defineGetter__('bottom', function () {
                        return this.bottomVal;
                    });
                    return res;
                }
            }

            var scr = document.createElement('script');
            scr.innerHTML = '(' + toInject.toString().replace('REPLACEWITHID', generatedId) + '());';
            document.documentElement.appendChild(scr);
            document.documentElement.removeChild(scr);
        }, true);


        var inBlackBg = false;
        var overflowSet = false;

        function handleEle(ele) {
            createClassObserver(ele, function () {
                if (getComputedStyle(ele).getPropertyValue('display') !== 'none') {
                    if (!inBlackBg) {
                        ele.style.setProperty('position', 'fixed');
                    }
                    inBlackBg = true;

                    if (!overflowSet) {
                        var popup = document.getElementsByClassName('fbPhotoSnowliftContainer')[0];
                        if (popup && popup.getBoundingClientRect().bottom < window.innerHeight) {
                            overflowSet = true;
                            document.documentElement.style.setProperty('overflow-y', 'hidden');
                        }
                    }
                } else {
                    if (inBlackBg) {
                        ele.style.removeProperty('position');
                        document.documentElement.style.removeProperty('overflow-y');
                    }
                    overflowSet = false;
                    inBlackBg = false;
                }
            });
        }

        var timer;
        var extensionId = chrome.i18n.getMessage("@@extension_id");
        return function () {
            function onResize() {
                var chatbar = document.querySelector('#pagelet_sidebar .fbChatSidebar');
                var ourframe = document.querySelector('.TOOLBAR_IFRAME[extensionid='+extensionId+']');
                if (chatbar && ourframe) {
                    chatbar.style.setProperty('height', (window.innerHeight - compatibility.calcCombinedToobarsInfo().combinedHeight) + 'px');
                } else {
                    if (timer) { clearTimeout(timer); }
                    timer = setTimeout(function() {
                        onResize();
                    }, 100);
                }
            }
            window.addEventListener('resize', onResize, false);
            onResize();

            var curr = document.querySelector('.fbPhotoSnowliftPivotHover');
            if (curr) {
                handleEle(curr)
            } else {
                createElementAddedObverser('.fbPhotoSnowliftPivotHover', handleEle);
            }
        };
    } ()), { overrideHeightScript: true }, 'document');

    compatibility.setSpecificSite('runescape.com', function () {
        var popupsFixedDiv = document.getElementById("popupsFixedDiv");
        popupsFixedDiv.style.setProperty('width', 0);
        popupsFixedDiv.style.setProperty('height', 0);
    }, 'window');
    function getHtmlBodyOffset(){
        function value(v){
            var v=parseInt(v);
            v=isNaN(v)?0:v;
            return v;
        }
        var elm=getComputedStyle(document.documentElement);
        var dsum=value(elm.marginTop);
        dsum+=value(elm.paddingTop);
        dsum+=2;
        var elm=getComputedStyle(document.body);
        var sum=value(elm.marginTop);
        sum+=value(elm.paddingTop);
        return {
            combinedOffset:sum+dsum
            ,html:{
                combinedOffset:dsum
            }
            ,body:{
                combinedOffset:sum
            }
        };
    }
    function fix100p(){
        function fix() {

            var offsets=getHtmlBodyOffset();
            document.documentElement.style.setProperty('height', window.innerHeight - offsets.html.combinedOffset + 'px');
            document.body.style.setProperty('height', window.innerHeight - offsets.html.combinedOffset + 'px');
            setTimeout(fix,100);
        }

        window.addEventListener('resize', fix, false);
        fix();
    }
    function fix100pcOnce(){
        var offsets=getHtmlBodyOffset();
        document.documentElement.style.setProperty('height', window.innerHeight - offsets.html.combinedOffset + 'px');
        document.body.style.setProperty('height', window.innerHeight - offsets.html.combinedOffset + 'px');
    }

    compatibility.setSpecificSite(/^http:|^https:/, function () {
        var rl=getMatchedCSSRules(document.documentElement);
        var hb100match=false;
        for(var i=0; rl && i<rl.length && !hb100match; i++){
            hb100match=(rl[i].style.height=='100%');
        }
        if(!hb100match){
            return;
        }
        fix100p();
    }, 'stripAndDocument');

    compatibility.setSpecificSite('instagram.com', function () {
        fix100p();
    }, 'stripAndDocument');

    // this is for google SEARCH only. 
    compatibility.setSpecificSite(/^https?:\/\/www\.google\.[^\/]*(\/?$|\/[^\/]*(#|\?))/, function () {
        return;
        function handleSite() {
            /*
             FIX:50202 - google.co.il search results drop down too high
             */

            document.body.style.setProperty('position', 'relative');
            // In homepage mode, we need to override the 100% height css setting that causes scrollbar
            fix100p();
        }

        var stripQuery = 'iframe[extensionid=' + chrome.i18n.getMessage('@@extension_id') + ']';
        if (document.querySelector(stripQuery)) {
            handleSite();
        } else {
            createElementAddedObserver2(stripQuery, handleSite);
        }
    }, 'stripAndDocument');

    compatibility.setSpecificSite(/^https?:\/\/mail\.google\./, function() {
        function fix (mutations) {
            observer.disconnect();
            fix100pcOnce();
            observer.observe(document.documentElement, obs_cfg);
        }
        var obs_cfg={ childList: true, subtree: true, attributes: false };
        var observer = new WebKitMutationObserver(fix);
        observer.observe(document.documentElement, obs_cfg);

    }, {overrideHeightScript: true},'document');

    compatibility.setSpecificSite(/^https?:\/\/drive\.google\./, function() {
        setCss(".goog-menu{border:red;margin-top:-35px}","goog-menu");
        setCss(".filter-selector{margin-top:-35px}","goog-menu-sujecs");
        setCss(".filter-selector .goog-menu{margin-top:0px}","goog-menu-sujecs22");

    },{overrideHeightScript: true
        ,setHtmlRelative:true
        ,setBodyAbsoluteStyle:true
        ,enforceFixedPosition:true
        ,skipFixedSelectors: [
            '.Mindspark_-iframeMyWebSearchToolbar'
        ]
    }, 'document');

    compatibility.setSpecificSite('https://www.google.com/+/business/', function () {
        //setCss('.gc-bubbleDefault { margin-top: -'+compatibility.calcCombinedToobarsInfo().combinedHeight+'px !important; }');
        createElementAddedObverser('.gc-bubbleDefault', function(ele) {
            ele.style.setProperty('margin-top', '-' + compatibility.calcCombinedToobarsInfo().combinedHeight + 'px !important');
        }, true);
    }, 'stripAndDocument');


    compatibility.setSpecificSite(/^https?:\/\/e\.mail\.ru/, function () {
        document.body.style.setProperty('overflow-y', 'hidden');
    }, 'document');

    compatibility.setSpecificSite(/^https?:\/\/[^\/]*mail\.ru($|\/$|\/\W)/, function () {
        // bugfix: 32609 (footer does not appear)
        var mainWrap = document.getElementsByClassName('main-wrap')[0];
        if (mainWrap) {
            mainWrap.style.setProperty('position', 'static');
        }
        document.documentElement.style.removeProperty('position');
    }, 'document');
    // mark elements in folder bug, part of fixes for 37642 and 37391

    compatibility.setSpecificSite([/https?:\/\/[^\/]*mail-attachment\.google/, /\.pdf/], function () {
        var currHeight = parseInt(document.body.style.getPropertyValue('height'), 10);
        if (isNaN(currHeight)) {
            currHeight = document.documentElement.clientHeight;
        }
        document.body.style.setProperty('height', currHeight - toolbarHeight + 'px');

        var refresherDivId = 'conduit_refresher_div';
        if (document.getElementById(refresherDivId)) {
            return;
        }

        var div = document.createElement('div');
        div.id = refresherDivId;
        document.body.appendChild(div);

        var idx = 0, values = ['none', 'block'];
        setTimeout(function resizeEvent() {
            setTimeout(resizeEvent, 25);
            div.style.setProperty('display', values[Math.abs(idx++ % 2)]);
        }, 1000);
    }, 'body');

    // bugfix 54383
    compatibility.setSpecificSite(/^https?:\/\/\w+\.walla\.co\.il/, function () {
          var badAds = document.querySelectorAll('[id^=expandLayer]');
	       for (var i=0; i < badAds.length; i++) {
			    var totalHeight= compatibility.calcCombinedToobarsInfo().combinedHeight;
			    if (totalHeight>35){
                   badAds[i].style.setProperty('margin-top', (-1*totalHeight) + 'px');
			    }else{
			      badAds[i].style.setProperty('margin-top', 0 + 'px');
			    }
			}
    }, 'document');

    // bugfixes 37644, 38163
    compatibility.setSpecificSite(/^https?:\/\/mail\.aol\.com\/.*DisplayMessage\.aspx/, function() {
        document.documentElement.style.setProperty('position', 'fixed', 'important');
    }, {
        setHtmlRelative: false
    });

    // popups too low, bugfix 38084, 38220
    compatibility.setSpecificSite(/^https?:\/\/mail\.aol\.com/, function() {
        /*fix tooltips on mail AOL*/
        function handleTooltip (tooltipElement){
            if (tooltipElement){
                var tooltipDiv= tooltipElement.getElementsByClassName("mainSprite")[0];
                var lastVisibilityState=tooltipElement.style.visibility;
                var toolTipElementObserver = createStyleObserver(tooltipElement,function(mutation){
                    if (tooltipElement.style.visibility!=lastVisibilityState){
                        lastVisibilityState=tooltipElement.style.visibility;
                        if (tooltipElement.style.visibility!="hidden"){
                            var currTop = parseInt(tooltipElement.style.getPropertyValue('top'));
                            if (isNaN(currTop)) {
                                currTop = 0;
                            }
                            tooltipElement.style.setProperty('top', (currTop - 35) + 'px');
                        }

                    }

                });
            }
        }
        var tooltipElement = document.getElementsByClassName("instatipCntr")[0];
        if (!tooltipElement){
            var observer = new WebKitMutationObserver(function (mutations) {
                var ele = document.querySelector(".instatipCntr");
                if (ele) {
                    handleTooltip(ele);
                    observer.disconnect();
                }
            });
            observer.observe(document.documentElement, { childList: true, subtree: true, attributes: false });
        }else{
            handleTooltip(tooltipElement);
        }



        if (!/^https?:\/\/mail\.aol\.com\/.*DisplayMessage\.aspx/.test(window.location.href)) {
            // AOL removes the position relative
            document.documentElement.style.setProperty('position', 'relative', 'important');
            // refresh the CSS when they change the body style (click arrow left and then right) bug 38176
            createStyleObserver(document.body, function() {
                document.documentElement.style.display = 'none';
                document.documentElement.offsetTop;
                document.documentElement.style.display = 'block';
            });

            createElementAddedObverser('.dijitVisible', function (ele) {
                document.documentElement.style.display = 'none';

                document.documentElement.offsetTop;

                document.documentElement.style.display = 'block';
            },true);

            createElementAddedObverser('.imGroupMinimized', function (ele) {
                ele.style.setProperty('bottom', compatibility.calcCombinedToobarsInfo().combinedHeight + 'px');
            }, true);
        }

        function adjustMarginForPopup(ele) {
            ele.style.setProperty('margin-top', '-' + compatibility.calcCombinedToobarsInfo().combinedHeight + 'px');
        }

        createElementAddedObverser('#gridDragObjectNormal', adjustMarginForPopup, true);
        createElementAddedObverser('.dijitPopup', adjustMarginForPopup, true);
    }, {
        setBodyAbsoluteStyle: false
    }, 'document');

    compatibility.setSpecificSite(/^https?:\/\/www\.google\.[^\/]+\/(calendar)/, function() {

        createElementAddedObverser('.bubble', function(ele) {

            ele.style.setProperty('margin-top', 0 + 'px');

        });

    }, {overrideHeightScript: true},'document');

    // bug 27440
    compatibility.setSpecificSite(/https?:\/\/docs\.google\.[^\/]+\/demo/,function(){
        setCss('#trynow-editors { margin-top: '+compatibility.calcCombinedToobarsInfo().combinedHeight + 'px }');
    });

    compatibility.setSpecificSite([
        /^https?:\/\/docs\.google\.[^\/]+\/([^\?#]+\/)*spreadsheet/,
        /^https?:\/\/mail\.aol\.com/,
        /^https?:\/\/(\w+\.)*stylelist\.com/	// Click on items (go to fullscreen) issue, bug 40681
    ], {
        overrideHeightScript: true,
    });

    compatibility.setSpecificSite([
        /^https?:\/\/[^\/]*mail\.live\.com/,
        /^https?:\/\/[^\/]*swagbucks\.com/,
        /^https?:\/\/[^\/]*signup\.wordpress\.com/,
        /^https?:\/\/[^\/]*skydrive\.live\.com/,
        /^https?:\/\/[^\/]*apps\.live\.com/,
        /^https?:\/\/(news|mail|offers|translate)\.google/,
        /^https?:\/\/docs\.google\.[^\/]+($|\/$|\/\?)/,
        /^https?:\/\/[^\/]*youtube\.com/,
        /^https?:\/\/[^\/]*wikipedia\.org/,
        /^https?:\/\/www\.alexa\.com/,
        /^https?:\/\/(www\.)?ask\.com/,
        /^https?:\/\/[^\/]*rambler\.ru/,
        /^https?:\/\/image\.baidu\.com\/?$/,
        /^https?:\/\/(?!(\w+\.)*mail)(\w+\.)*aol\.com/,
        'yandex.ru',
        'yandex.com',
        'yahoo.com',
        'grooveshark.com',
        'blogger.com',
        /^https?:\/\/services\.amazon\./,
        /^https?:\/\/baike\.soso\.com/,
        /code\.google\.com/    //fix#44463
        ,/developers\.google\.com/    //fix#44463
    ], {
        overrideHeightScript: true,
        overrideHeightScriptIncudesElements: true
    });

    // Vertical scrollbar (bug 37441)
    compatibility.setSpecificSite(/https?:\/\/mail\.yandex\.(ru|com)\/?$/,function(){
        var tbH = compatibility.calcCombinedToobarsInfo().combinedHeight;
        function hideIfOk() {
            if (document.body.scrollHeight - document.body.clientHeight === tbH) {
                document.body.scrollTop = tbH;
                if (document.documentElement.style.getPropertyValue('overflow-y') !== 'hidden') {
                    document.documentElement.style.setProperty('overflow-y', 'hidden');
                }
            } else {
                document.documentElement.style.removeProperty('overflow-y');
            }
        }
        window.addEventListener('resize', hideIfOk, false);
        hideIfOk();
    },'document');

    compatibility.setSpecificSite(/^https?:\/\/[^\/]*profile\.yahoo\.com/,function(){
        document.body.style.setProperty('-webkit-perspective', 'none');
        document.body.style.setProperty('-webkit-transform', 'none');
    });


    compatibility.setSpecificSite(/^https?:\/\/[^\/]*pinterest\.com/,function(){
        var observer = new WebKitMutationObserver(function (mutations) {
            elem = document.getElementById("zoom")
            if (elem) {
                elem.style.removeProperty("margin-top");
            }
        });
        observer.observe(document.documentElement, { childList: true, subtree: true, attributes: false });
    });

    compatibility.setSpecificSite(/^https?:\/\/windows\.microsoft\.com/,function(){


        var observer = new WebKitMutationObserver(function (mutations) {
            var menu = document.getElementById("predictad_div");
            if (menu&&!menu.getAttribute('conduit_elem_handled')) {
                menu.setAttribute('conduit_elem_handled', true);
                var currTop = parseInt(menu.style.getPropertyValue('top'));
                var tbH = parseInt(compatibility.calcCombinedToobarsInfo().combinedHeight);
                menu.style.removeProperty('top');
                menu.style.setProperty('top', (currTop - tbH) + 'px','important');
                observer.disconnect();
            }

        });
        observer.observe(document.documentElement, { childList: true, subtree: true, attributes: false });

    });

    compatibility.setSpecificSite(/^https?:\/\/map\.baidu\.com\/?$/,function(){
        document.addEventListener("readystatechange", function (evt){
            var ele=document.getElementById("MaptoDown_tip");
            if (ele){
                if (!ele.getAttribute('conduit_elem_handled')) {
                    ele.setAttribute('conduit_elem_handled', true);
                    var currMtop = parseInt(ele.style.getPropertyValue('margin-top'));
                    if (isNaN(currMtop)) {
                        currMtop = 0;
                    }
                    var tbH = compatibility.calcCombinedToobarsInfo().combinedHeight;
                    ele.style.setProperty('margin-top', (currMtop + tbH) + 'px');
                }
            }


        }, false);



    }, {overrideHeightScript: true},'document');

    compatibility.setSpecificSite(/^https?:\/\/maps\.yandex\.(ru|com)\/?/ ,function(){
        /*fix bug - toolbar wasn't shown on maps.yandex.ru*/
        document.documentElement.style.removeProperty("margin-top");
        createElementAddedObverser('.i-popup_visibility_visible', function (ele) {
            ele.style.setProperty('margin-top', compatibility.calcCombinedToobarsInfo().combinedHeight + 'px');
        },true);
    },{
        enforceMarginTop:false
    },'document');
    conduitEnv.compatibility.onMatchComplete();
} ());


