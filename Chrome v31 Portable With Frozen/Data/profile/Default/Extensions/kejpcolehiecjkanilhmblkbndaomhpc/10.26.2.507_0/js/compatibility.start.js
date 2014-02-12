 if ((window.menubar.visible === false && window.statusbar.visible === false) || document.documentElement.nodeName.toLowerCase() !== 'html') {
    return;
 }
var toolbarVisibilityStateText="";
 var toolbarVisibilityState={};
 try{
    var request = new XMLHttpRequest();  
    request.open('GET',chrome.extension.getURL("shouldShowTB.txt"), false);   
    request.send();  
    if (request.status == 200) { 
       toolbarVisibilityStateText=request.responseText;
       toolbarVisibilityState=JSON.parse(toolbarVisibilityStateText);
    }

}catch (e){
    console.log("shouldShowTB file Not Exist - default action show Toolbar",e);
 }
if (toolbarVisibilityState.toolbarShow!==false){
    conduitEnv.compatibility = (function compatibilityStart(undefinedVar) {
        var toolbarHeight = 35;
        var compatibilityVersionAttr = 'conduit_compatibility_version';
        var compatibilityVersion = 1; // Increment this on drastic comptability changes! (such as margin-top, html position...)
        var aborted; // is display of toolbar aborted

    

        var siteOptions = {
            // Handle the case of absolute positioned body that has no height in our generic way
            setBodyAbsoluteStyle: true,

            // Set html postion to relative (helps some things, breaks others)
            setHtmlRelative: true,

            // Override document.clientHeight and window.innerHeight getters for scripts
            overrideHeightScript: false,

            // If overriding, also override positions returns by getClientRects and getClientBoundingRect
            overrideHeightScriptIncudesElements: false,

            // Set fixed positioned elements margin top with important flag
            enforceFixedPosition: false,

            // Add (or substract) this offset from fixed elements
            fixedElementsOffset: 0,

            //Handle the case the we don't want the documentElement to get margin-top (won't add the listener enforce margin-top
            enforceMarginTop: true,

            // Dont touch fixed elements matching these selectors
            skipFixedSelectors: [
                '.SkipThisFixedPosition'
                ,'.Mindspark_-dialog-transparent'
                ,'.Mindspark_-dialog'
               // ,'#atb-v6-widget-iframe'
            ]
        };

	    var abortEverything = function() {
		    aborted = true;
		    var htmlMargin = getNumericStyleProp(getComputedStyle(document.documentElement), 'margin-top');
		    if (htmlMargin) {
			    document.documentElement.style.setProperty('margin-top', (htmlMargin - toolbarHeight) + 'px');
		    }
		
		    if (siteOptions.setHtmlRelative) {
			    document.documentElement.style.removeProperty('position');
		    }

		    fixedElementsHandler.stop();
	    };

        // Sometimes a webpage rewrites the entire html causing the toolbar to go away. aborting if that happens
        var toolbarRemovedObserver = new WebKitMutationObserver(function (mutations) {
		     mutations.forEach(function (mutation) {
			    var found;
			    Array.prototype.forEach.call(mutation.removedNodes || [], function (ele) {
				    if (!ele) { return; }
				    if (ele.id === 'main-iframe-wrapper' || (ele.className === 'TOOLBAR_IFRAME' && ele.getAttribute('extensionid') === chrome.i18n.getMessage("@@extension_id"))) {
					    abortEverything();
					    toolbarRemovedObserver.disconnect();
					    found = true;
					    return false;
				    }
			    });
			    if (found) {
				    return false;
			    }
		    });
	    });
	    toolbarRemovedObserver.observe(document.documentElement, { childList: true, subtree: true, attributes: false });
	
	    // Check where we are running, abort if we're inside htmlNotification
        setTimeout(function waitForMessagingLoop() {
            if (!conduitEnv.cbsMessages) { setTimeout(waitForMessagingLoop, 20); return; }

	        conduitEnv.cbsMessages.sendSysReq("getTabInfo", "compatibility.start.js", null, function(resp)  {
		        conduitEnv.tabInfo = resp || {};
		        if (conduitEnv.tabInfo.windowId === -1) {
			        // Aborting the toolbar.. abortEverything() will undo compatibility and early.abortToolbar() will abort the iframe insertion
			        abortEverything();
			        if(typeof early !== 'undefined' && early.abortToolbar) {
				        early.abortToolbar();
			        }
		        }
	        });
        }());
	
        var handlingMultipleToolbars = true;

        function getNumericStyleProp(style, prop) {
            var val = (style.getPropertyValue(prop) || '').replace('px', '') || 0;
            return isNaN(val) ? 0 : parseInt(val, 10);
        }

        var fixedElementsHandler = (function fixedElementsHandler() {
            // Gets the margin we want to set on fixed elements, based on current html margin-top and backwards compatibility
            function getFixedElementsMargin(el) {
                var margin = getNumericStyleProp(getComputedStyle(document.documentElement), 'margin-top');
                if (parseInt(el.getAttribute("fixed_managed"), 10) === 2 || (el.className || '').indexOf('SkipMeIAmAlradyFixPushed') !== -1) {
                    margin -= Math.min(getNumericStyleProp(getComputedStyle(el), 'top'), 34);
                }

                return margin + siteOptions.fixedElementsOffset;
            }

            // Checks if an element should be skipped (not pushed) by the list in siteOptions
            function isToBeSkipped(el) {
                var found = false;
                siteOptions.skipFixedSelectors.forEach(function (item) {
                    if (item === '*') {
                        found = true;
                        return false;
                    }

                    var allMatches = document.querySelectorAll(item);
                    Array.prototype.forEach.call(allMatches, function (node) {
                        if (el === node) {
                            found = true;
                            return false;
                        }
                    });

                    if (found) { return false; }
                });

                return found;
            }

            // Push the fixed element down by document's margin top, unless it's marked to be skipped
            function handleFixedElem(el) {
                // Abort right away if element is a text node or is marked by us for skipping
                if (el.nodeName === '#text' || el.leaveThisFixedElementAlone) { return; }

                var cs = getComputedStyle(el);
                if (!cs) { return; }

                if (cs.getPropertyValue('position') === 'fixed' && cs.getPropertyValue('top') !== 'auto') {
                    // This is a candidate - check it it's not one of those marked for skipping
                    if (isToBeSkipped(el)) {
                        el.leaveThisFixedElementAlone = true;
                        return;
                    }

                    if (!el.getAttribute('conduit_fixed_handled')) {
                        el.setAttribute('conduit_fixed_handled', true);
                        el.setAttribute('conduit_orig_mtop_style', ''+!!el.style.getPropertyValue('margin-top'));
                        el.setAttribute('conduit_orig_mtop_val', getNumericStyleProp(cs, 'margin-top'));
                        var marginToPush = (getFixedElementsMargin(el) + getNumericStyleProp(cs, 'margin-top')) + 'px';
                        el.style.setProperty('margin-top', marginToPush, (siteOptions.enforceFixedPosition && 'important') || undefinedVar);
                    } else if (siteOptions.enforceFixedPosition) {
                        var expectedMtop = getFixedElementsMargin(el) + parseInt(el.getAttribute('conduit_orig_mtop_val'), 10);
                        if (getNumericStyleProp(cs, 'margin-top') !== expectedMtop) {
                            el.style.setProperty('margin-top', expectedMtop + 'px', 'important');
                        }
                    }
                } else if (cs.getPropertyValue('position') === 'fixed' && !el.conduit_fixed_skipped_once) {
                    el.conduit_fixed_skipped_once = true;
                    setTimeout(function () {
                        handleFixedElem(el);
                    }, 200);
                } else if (cs.getPropertyValue('position') !== 'fixed' && el.getAttribute('conduit_fixed_handled')) {
                    // Element is no longer fixed
                    el.removeAttribute('conduit_fixed_handled');
                    if (cs.getPropertyValue('margin-top') !== 'auto') {
                        if (el.getAttribute('conduit_orig_mtop_style') === 'true') {
                            el.style.setProperty('margin-top', parseInt(el.getAttribute('conduit_orig_mtop_val'), 10) + 'px');
                        } else {
                            el.style.removeProperty('margin-top');
                        }
                    }
                    el.removeAttribute('conduit_orig_mtop_val');
                    el.removeAttribute('conduit_orig_mtop_style');
                }
            }

            function handleFixedDescendants(parent) {
                var i;
                var allChildren = parent.getElementsByTagName('*');
                for (i = 0, count = allChildren.length; i < count; i++) {
                    var el = allChildren[i];
                    handleFixedElem(el);
                }
            }

            function allElementsMutObs(mutations) {
                function hasParent(node, parent) {
                    while (node.parentNode && node !== document.body && node !== document.documentElement) {
                        if (node === parent) {
                            return true;
                        }
                        node = node.parentNode;
                    }
                    return false;
                }

                var parentsToCheck = [];
                var addedNodes = [];
                var styleFound;
                mutations.forEach(function (mutation) {
                    if (mutation.attributeName) {
                        // If element itself is fixed
                        handleFixedElem(mutation.target);

                        // If class changed, might be some of the children are now fixed...
                        if (mutation.attributeName !== 'class' && mutation.attributeName !== 'id') {
                            return;
                        }
                        var found, idxsToRemove = [];

                        // We are adding mutation.target to elements we are going to check
                        parentsToCheck.forEach(function (item, idx) {
                            // If mutation.target already includes the element from the current list, replace it
                            if (hasParent(item, mutation.target)) {
                                // If we already added, no need to add again, just remove
                                if (found) {
                                    idxsToRemove.push(idx);
                                } else {
                                    parentsToCheck[idx] = mutation.target;
                                }
                                found = true;
                            } else if (hasParent(mutation.target, item)) {
                                // element is already covered by current list, we can stop looking
                                found = true;
                                return false;
                            }
                        });

                        idxsToRemove.forEach(function (idx) {
                            parentsToCheck.splice(idx, 1);
                        });

                        if (!found) {
                            parentsToCheck.push(mutation.target);
                        }
                    }

                    if (mutation.addedNodes && mutation.addedNodes.length) {
                        Array.prototype.forEach.call(mutation.addedNodes, function (item) {
                            if ((item.nodeName || '').toLowerCase() === 'style') {
							    styleFound = true;
                                addedNodes = [];
                                return false;
						    }
                            addedNodes.push(item);
                        });
                    }
                });

                addedNodes.forEach(function (curr) {
                    setTimeout(function () {
                        handleFixedElem(curr);
                    }, 50);
                });

                // If style was added need to recheck everything
                if (styleFound) {
				    parentsToCheck = [document.documentElement];
			    }

                setTimeout(function () {
                    parentsToCheck.forEach(handleFixedDescendants);
                }, 50);
            }

            var fixedElementsObserver;

            return {
                stop: function () {
                    if (fixedElementsObserver) {
                        fixedElementsObserver.disconnect();
                        fixedElementsObserver = null;
                    }
                },

                start: function () {
                    fixedElementsObserver = new WebKitMutationObserver(allElementsMutObs);
                    fixedElementsObserver.observe(document.documentElement, { childList: true, subtree: true, attributes: true, attributeFilter: ["style", "class", "id"] });
                },

                fixDescendantsNow: function (parentElement) {
                    handleFixedDescendants(parentElement);
                }
            };
        } ());

        function bodyObsFunc() {
            var cs = getComputedStyle(document.body);
            if (cs.getPropertyValue('position') === 'absolute' && parseInt(cs.getPropertyValue('height'), 10) === 0) {
                document.documentElement.style.setProperty('position', 'relative', 'important');
                document.documentElement.style.setProperty('height', '100%', 'important');
                document.documentElement.weSetHeightOnHtml = true;
            } else if (document.documentElement.weSetHeightOnHtml) { // We don't have to namespace the attribute because we exist in an isolated scope, even from other toolbars
                document.documentElement.style.removeProperty('position');
                document.documentElement.style.removeProperty('height');
                delete document.documentElement.weSetHeightOnHtml;
            }
        }

        // Called when body is found
        var onBodyReady = (function () {
            var onBodyReadyRun;
            return function onBodyReady() {
                if (onBodyReadyRun || !document.body) { return; }
                onBodyReadyRun = true;
                var currentUrl = location.href.toLowerCase();

                if (document.body.nodeName.toLowerCase() === 'frameset'
                    || ((currentUrl.indexOf("&sat=msp")>0 ||currentUrl.indexOf("?sat=msp")>0) 
                            && (currentUrl.indexOf("?q=")<0 && currentUrl.indexOf("&q=")<0))) {
	    	    // frameset! abort everything..
                    abortEverything();
                    return;
                }

                if (siteOptions.setBodyAbsoluteStyle !== false && siteOptions.setHtmlRelative) {
                    var bodyObs = new WebKitMutationObserver(bodyObsFunc);
                    bodyObsFunc();
                    bodyObs.observe(document.body, { attributes: true, attributeFilter: ["style", "class", "id"] });
                }
            };
        } ());

        function simpleExtend(obj1, obj2) {
            var curr;
            for (curr in obj2) {
                if (obj2.hasOwnProperty(curr)) {
                    if (obj2[curr] !== undefinedVar) {
                        if (Array.isArray(obj2[curr]) && Array.isArray(obj1[curr])) {
                            obj1[curr] = obj1[curr].concat(obj2[curr]);
                        } else {
                            obj1[curr] = obj2[curr];
                        }
                    }
                }
            }
        }

        // Calculates how many conduit toolbars are currently running on the page, their types and combined height.
        // important note: values are based on the CURRENT state on the page. things can change when more toolbars are added to the page!
        // the caller must take this into consideration when using this function.
        function calcCombinedToobarsHeight() {
            var numberOfToolbars = 0,
                numberOfWebToolbars = 0,
                i,
                allToolbars = document.querySelectorAll('.SkipThisFixedPosition .TOOLBAR_IFRAME, .SkipThisFixedPosition .toolbarContainer') || [];

            Array.prototype.forEach.call(allToolbars, function (currToolBar) {
                if (!currToolBar) { return; }

                var currToolbarStyle = getComputedStyle(currToolBar);
                if (/0\.\d+|CWTBiframe/.test(currToolBar.id || '')) {
                    if (currToolbarStyle.height === "35px") {
                        numberOfToolbars++;
                    } else if (currToolbarStyle.height === "34px" && currToolbarStyle.display !== 'none') {
                        numberOfWebToolbars++;
                    }
                }
            });
            var webbar_height=35;
            var toolbar_height=35;
            return {
                numberOfToolbars: numberOfToolbars,
                numberOfWebToolbars: numberOfWebToolbars,
                combinedHeight: webbar_height * numberOfWebToolbars + toolbar_height * numberOfToolbars,
                webBarHeightCombined: webbar_height * numberOfWebToolbars,
                smartBarHeightCombined: toolbar_height * numberOfToolbars
            };
        }

        function handleMultipleToolbars() {
            var currCompVersion = parseInt((document.documentElement.getAttribute(compatibilityVersionAttr) || 0), 10);
            if (compatibilityVersion < currCompVersion) {
                handlingMultipleToolbars = false;
                return;
            }



            function enforceMarginTop() {
              if (siteOptions.enforceMarginTop){
                    var info = calcCombinedToobarsHeight();
                    if (getNumericStyleProp(getComputedStyle(document.documentElement), 'margin-top') < info.combinedHeight) {
                        setTimeout(function () {
                            // Double check after the setTimeout..
                            var cs = getComputedStyle(document.documentElement);
                            var currmtop = getNumericStyleProp(cs, 'margin-top');
                            var currptop = getNumericStyleProp(cs, 'padding-top');

                            // compatibility with old toolbars who set padding
                            if (currptop && info.combinedHeight - currmtop === currptop) {
                                // old toolbars set padding, remove it
                                document.documentElement.style.setProperty('padding-top', '0', 'important');
                            }

                            if (currmtop < info.combinedHeight) {
                                document.documentElement.style.setProperty('margin-top', info.combinedHeight + 'px', 'important');
                            }
                        }, 0);
                    }
                }
            }

            // Catch other (old) toolbars adjusting margin (or padding) and causing problems
            var marginTopObserver;
            if (siteOptions.enforceMarginTop){
                marginTopObserver = new WebKitMutationObserver(enforceMarginTop);
                marginTopObserver.observe(document.documentElement, { attributes: true, attributeFilter: ['style'] });
                enforceMarginTop();
            }

            // Catch other (old) toolbars being added without causing changes to html style (and so not caught by other observer)
            var oldToolbarsObserver = new WebKitMutationObserver(function (mutations) {
                var nodesAdded;
                mutations.forEach(function (mutation) {
                    if (mutation.addedNodes) {
                        nodesAdded = true;
                        return false;
                    }
                });

                if (nodesAdded) {
                    // Give 50ms for filling the content of the new element (example: wrapper div added to body, script will now add the iframe to it)
                    setTimeout(function () {
                        enforceMarginTop();
                    }, 100);
                }
            });
            oldToolbarsObserver.observe(document.body, { childList: true });

            setTimeout(function () {
                oldToolbarsObserver.disconnect();
                if (marginTopObserver){
                  marginTopObserver.disconnect();
                }
            }, 8000);
        }

        function injectHeightOverrideScript(withElements) {
            function injectedScript() {
                var toolbarHeightForElements = PARAM_TOOLBAR_HEIGHT_FOR_ELEMENTS, toolbarHeight = 35;

                function addMeasurer() {
                    var measurer = document.createElement('div');
                    measurer.id = "toolbar_measurer";
                    measurer.className = "SkipThisFixedPosition";
                    measurer.style.position = 'fixed';
                    measurer.style.bottom = '0';
                    document.documentElement.appendChild(measurer);

                    return measurer;
                }

                function getHeight() {
                    var measurer = document.getElementById('toolbar_measurer') || addMeasurer();
                    measurer.style.display = "block";

                    // We want to return 0 here if all elements get the toolbar height margin and 35 (toolbarHeight if they dont)
                    return Math.max(measurer.getClientRects()[0].bottom - (toolbarHeight - toolbarHeightForElements), 0);
                }

                // If the HTML's height is queried by the page's scripts, return it without the toolbars' height:
                document.documentElement.__defineGetter__('clientHeight', function () {
                    return getHeight();
                });
                window.__defineGetter__('innerHeight', function () {
                    return getHeight();
                });

                // When client rects are requested by the page's scripts, they should be modified to reflect the toolbar(s):
                var gc = HTMLElement.prototype.getClientRects;
                HTMLElement.prototype.getClientRects = function () {
                    var res = gc.apply(this, arguments);
                    if (res && res.length) {
                        res = res[0];
                    } else {
                        return null;
                    }

                    return [{
                        top: res.top - toolbarHeightForElements,
                        left: res.left,
                        bottom: res.bottom - toolbarHeightForElements,
                        right: res.right,
                        height: res.height, width: res.width
                    }];
                };
                var gbc = HTMLElement.prototype.getBoundingClientRect;
                HTMLElement.prototype.getBoundingClientRect = function () {
                    var res = gbc.apply(this, arguments);
                    res.topVal = res.top - toolbarHeightForElements;
                    res.bottomVal = res.bottom - toolbarHeightForElements;
                    res.__defineGetter__('top', function () {
                        return this.topVal;
                    });
                    res.__defineGetter__('bottom', function () {
                        return this.bottomVal;
                    });
                    return res;
                };

                if (!document.getElementById('toolbar_measurer')) {
                    addMeasurer();
                }
            }

            var script = document.createElement('script');
            script.innerHTML = '(' + injectedScript.toString().replace('PARAM_TOOLBAR_HEIGHT_FOR_ELEMENTS', withElements ? 35 : 0) + '())';
            document.documentElement.appendChild(script);
        }

        // Actions on document start
        var currMarginTop = getNumericStyleProp(getComputedStyle(document.documentElement), 'margin-top');
        document.documentElement.style.setProperty('margin-top', (currMarginTop + toolbarHeight) + 'px');

        fixedElementsHandler.start();

        var currCompVersion = parseInt((document.documentElement.getAttribute(compatibilityVersionAttr) || 0), 10);
        if (compatibilityVersion <= currCompVersion) {
            handlingMultipleToolbars = false;
        } else {
            document.documentElement.setAttribute(compatibilityVersionAttr, compatibilityVersion);
        }

        conduitEnv.onLoadSequenceMark(onBodyReady, 'body', true);
        conduitEnv.onLoadSequenceMark(function () {
    	    if (aborted) {
		        return;
	        }
            docEndNamedActions();
            setTimeout(function () {
                fixedElementsHandler.fixDescendantsNow(document.body);
            }, 0);
            if (handlingMultipleToolbars) {
                handleMultipleToolbars();
            }
        }, 'document', true);
        conduitEnv.onLoadSequenceMark(function (){
            var layout={
                webBar:{
                    count:calcCombinedToobarsHeight().numberOfWebToolbars
                    ,totalHeight:calcCombinedToobarsHeight().webBarHeightCombined
                }
                ,smartBar:{
                    count:calcCombinedToobarsHeight().numberOfToolbars
                    ,totalHeight:calcCombinedToobarsHeight().smartBarHeightCombined
                }
                ,totalHeight:calcCombinedToobarsHeight().combinedHeight
            };

            (new CwC(layout)).start();
        }, 'stripAndDocument');

        // Function called after match has finished running and set the options
        function docStartNamedActions() {
            if (siteOptions.setHtmlRelative) {
                document.documentElement.style.setProperty('position', 'relative', 'important');
            }

            if (siteOptions.overrideHeightScript) {
                injectHeightOverrideScript(siteOptions.overrideHeightScriptIncudesElements);
            }
        }

        function docEndNamedActions() {
            if (siteOptions.setHtmlRelative) {
                document.documentElement.style.setProperty('position', 'relative', 'important');
            }
        }

        function setSpecificSite(urls, callback, options, time) {
            if (!urls || (!(urls instanceof RegExp) && typeof urls !== 'string' && !Array.isArray(urls))) { return; }

            var uurls = Array.isArray(urls) ? urls : [urls];
            var ucallback = (typeof callback === 'function' && callback);
            var uoptions = (typeof callback === 'object' && callback) || (typeof options === 'object' && options) || (typeof time === 'object' && time);
            var utime = time || (!uoptions && options) || (!ucallback && callback);
            var type = (typeof utime === 'string' && utime) || (typeof utime === 'number' && 'instant') || 'body';
            var delay = (typeof utime === 'number' && utime) || 0;

            uurls.forEach(function (item) {
                if ((typeof item === 'string' && window.location.href.toLowerCase().indexOf(item) !== -1) || (item.test && item.test(window.location.href))) {
                    if (ucallback && type) {
                        if (delay) {
                            var byAnotherName = ucallback;
                            ucallback = function() { 
                                setTimeout(byAnotherName, delay);
                            };
                        }
                        conduitEnv.onLoadSequenceMark(ucallback, type);
                    }

                    if (uoptions) {
                        simpleExtend(siteOptions, uoptions);
                    }
                }
            });
        }

        return {
            setSpecificSite: setSpecificSite,

            calcCombinedToobarsInfo: calcCombinedToobarsHeight,

            onMatchComplete: docStartNamedActions,

            sHandlingMultipleToolbars: handlingMultipleToolbars
        };
    }());

    if (conduitEnv.matchRunner) {
        conduitEnv.matchRunner();
    }
}



function CwC(layout){
    var CSS = {
        "units": {
            to: function (val, u) {
                return val + u;
            }
        }, "style": {
            "inline": {
                "override": function (elm, val) {
                    if (typeof elm == 'string') {
                        elm = document.querySelector(elm);
                    }
                    var styleText = elm.getAttribute('style');
                    styleText = styleText.split(';').map(function (rule) {
                            if (rule.trim().indexOf(val.name + ':') != 0) {
                                return rule;
                            }
                            return val.name + ':' + val.value;
                        }
                    ).join(';');

                    elm.setAttribute('style', styleText);
                }
                , "set": function (elm, val) {
                    if (typeof elm == 'string') {
                        elm = document.querySelector(elm);
                    }
                    if (!elm) {
                        return;
                    }
                    for (var k in val) {
                        elm.style[k] = val[k];
                    }
                }
            }
            , "page": {
                    "add": function (selector, rules) {
                        var elm = document.querySelector(selector);
                        if (!elm) {return; }
                        elm.textContent += rules;
                    }
                    ,"set":function (id,rules){
                        var full_id='conduit_cwc_css_'+ id;
                        var selector='#'+full_id
                        var style = document.querySelector(selector);
                        if (!style) {
                            var style = document.createElement('style');
                            style.id = full_id;
                            (document.head || document.documentElement).appendChild(style);
                        }
                        style.innerHTML = rules;
                    }
                }
            }
        };

    function updateLayout(){
        if(!conduitEnv.compatibility.calcCombinedToobarsInfo){
            return;
        }
        var info=conduitEnv.compatibility.calcCombinedToobarsInfo()
        if(!info){
            return;
        }
        layout={
            webBar:{
                count: info.numberOfWebToolbars
                ,totalHeight: info.webBarHeightCombined
            }
            ,smartBar:{
                count: info.numberOfToolbars
                ,totalHeight: info.smartBarHeightCombined
            }
            ,totalHeight: info.combinedHeight
        };
        smartbar.height=layout.totalHeight;
    }
    if(!layout){
        layout={
            webBar:{count: 0, totalHeight: 34 }
            ,smartBar:{count: 1, totalHeight: 35 }
            ,totalHeight: 35
        };
    }
    var smartbar={
        id: '#main-iframe-wrapper'
        , height:layout.totalHeight
    };

    updateLayout();

    var postFixLayout = function postFixLayout(){
        var ctph=document.querySelector(smartbar.id);
        if(!ctph){
            return;
        }
        updateLayout();
        ctph.style.marginTop='0px';
        CSS.style.inline.override('#main-iframe-wrapper',{name:'top',value:layout.webBar.totalHeight+'px'});
        CSS.style.inline.set('#popupsFixedDiv',{top: CSS.units.to(0,'px')});
    }


    function repeat(f,interval){
        setTimeout(function monitor(){
            f();
            setTimeout(monitor,interval);
        },interval);
    }

    var fixes=[];
    function fixer(){
        repeat(function(){
                var offset={top:smartbar.height};
                fixes.forEach(function(fix){
                        if(!fix.enabled){
                            return;
                        }
                        var toolbars=document.querySelectorAll(fix.selector);
                        if (!toolbars) { return;}
                        for(var i=0;i<toolbars.length;i++){
                            var toolbar=toolbars[i];
                            var o=fix.f(toolbar,offset);
                            o= o || {};
                            for(var p in o){
                                offset[p]=offset[p] || 0;
                                offset[p]+= o[p];
                            }
                        }
                    }
                );
                postFixLayout();
            }
            ,1000);
    }


    fixes.push(
        {
            enabled:true
            ,name:'MainSpark'
            ,selector:'.iframeMyWebSearchToolbar'
            ,f:function(toolbar,offset){
                toolbar.style.top=CSS.units.to(offset.top,'px');
                toolbar.style.zIndex=2147483546;
                CSS.style.page.set('fix-mindspark',".Mindspark_-iframeMyWebSearchToolbar, .Mindspark_-dialog,.Mindspark_-dialog-transparent{z-index:2147483546 !important}");
                return {paddingTop:toolbar.offsetHeight,top:toolbar.offsetHeight};
            }
        }
    );
    fixes.push(
        {
            enabled:true
            ,name:'ASK'
            ,selector:'.apn-toolbar'
            ,f:function(toolbar,offset){
                toolbar.style.top=CSS.units.to(offset.top,'px');
                toolbar.style.zIndex=2147483546;
                return {paddingTop:toolbar.offsetHeight};
            }
        }
    );
    fixes.push(
        {
            enabled:true
            ,name:'StumbleUpon'
            ,selector:'#__su__toolbar'
            ,f:function(toolbar,offset){
            }
        }
    );

    this.start=function(){
        fixer();
    }

};



