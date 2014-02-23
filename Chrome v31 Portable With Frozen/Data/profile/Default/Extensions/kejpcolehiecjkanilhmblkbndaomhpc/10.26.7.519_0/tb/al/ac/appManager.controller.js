/**
* @fileOverview:  [somedescription]
* FileName: appManager.controller.js.js
* FilePath: ..ApplicationLayer\Dev-Performance\src\main\js\appCore\control\js\appManager.controller.js
* Date: 25/7/2011 
* Copyright: 
*/

/**
@object: "applicationLayer.appManager.controller"
@description: a single controller for all toolbar front events.
@implements a delegate like behavior.
@runs on init. 
*/
conduit.register("applicationLayer.appManager.controller", (function () {

    var Controller = {

        eventsObj: {},

        //this object will be built dynamically, will hold all
        //webApp types , their events and events handlers.
        eventsManager: {},

        /**
        @function
        @description: builds the eventsManager object by looping
        over the webAppTypes object and all its functions.
        */
        addEventsToManagerObject: function () {

            var eventsManager = this.eventsManager;

            //run on all types in webAppTypes obj.
            for (webAppType in webAppTypes) {
                var currentWebAppType = webAppTypes[webAppType];

                //for each event on this type...
                for (var e in currentWebAppType) {
                    //we check if the eventsManager object has already
                    //created an object for this event.
                    var currentEvent = eventsManager[e];
                    if (!currentEvent)
                    //if no, we create it for the first time.
                        currentEvent = eventsManager[e] = {};

                    //we check if the event object has a property by this webAppType name.  
                    if (!currentEvent[webAppType]) {

                        //if no, we create it, type array, which will hold all relevant functions.
                        currentEvent[webAppType] = [];
                    }

                    //we run on all functions for the current events collection of this webApp type.
                    for (func in currentWebAppType[e]) {

                        currentEvent[webAppType].push(currentWebAppType[e][func]);

                    }
                }
            }
        },
        /**
        @function
        @description: take a target with an appView class, and run all its functions.
        @param: {string} target - htmlElement
        @param: {string} eventName - 
        @param: {object} e -
        */
        runAllTargetFuncs: function (target, eventName, e) {
            //get the type from the html data attribute.
            var webAppType = target.getAttribute('data-type');

            if (e.button == 2) {
                webAppType = 'contextMenu';
            }

            if (webAppType) {

                //we check if we have data on the eventsManager object with this eventName. 
                if (this.eventsManager[eventName]) {

                    var currEvent = this.eventsManager[eventName];

                    //we check if we have data with this webAppType. 
                    if (currEvent[webAppType]) {

                        //we make a reference to all this webApp functions relevant to this specific event.
                        var webAppFuncs = currEvent[webAppType];

                        //run all functions.
                        var len = webAppFuncs.length;

                        for (var i = 0; i < len; i++) {
                            webAppFuncs[i](target, e);
                        }
                    }
                }
            }

        },
        /**
        @function
        @description: iterate over the eventManager object events(click, mousedown... etc),
        and for each add event listener to the toolbar. then implements delegate behavior.
        */
        addHandlers: function () {
            var toolbar = document.getElementById('toolbar'),
                that = this;

            //iterate over all webAppp types and their events and add event handler.
            //each new event we add to the eventsObj with the value true to prevent duplication.

            for (var eventName in this.eventsManager) {

                for (var webAppType in this.eventsManager[eventName]) {

                    //we check if the current event already has a listener.
                    if (!this.eventsObj[eventName]) {

                        //self invoke function to handle closure side effect.
                        (function setEventHandler(eventName) {

                            cb_eventsHandler.addEventHandler(toolbar, eventName, function (e) {
                                //get the right event object according to browser in use.
                                var event = cb_eventsHandler.getEvent(e),
                                //get the actual html elemnt.
								target = cb_eventsHandler.getTarget(event);
                                if (target.getAttribute("data-avoidController"))
                                    return true;

                                cb_eventsHandler.stopPropagation(event);
                                cb_eventsHandler.preventDefault(event);
                                //performance measure:conduit.abstractionlayer.commons.storage.setPref("Perform_ToolbarClicked", String(+new Date()));

                                if (target.id == 'scrollPanelWrapper' && event.button == 2) {
                                    // right click event on the toolbar div (not on any app) 									
                                    that.runAllTargetFuncs(target, eventName, event);
                                }
                                else {
                                    //bubbling. We wish to catch events only on apps which has appView class, with the exception of right menu buttons ('+' and wrench)
                                    while ((!/(?:^|\s)appView(?:$|\s)/g.test(target.className) &&
											!(target.className && target.className.indexOf('rightMenuButton') != -1)) &&
											(target = target.parentNode));
                                    if (target) {
                                        //we have a target with a appView class, so we run all its functions.
                                        that.runAllTargetFuncs(target, eventName, event);
                                    }
                                }


                            }, true);
                        })(eventName)
                    }

                    this.eventsObj[eventName] = true;
                }
            }
            // prevent the browser default context menu to open when right clicking in the toolbar (in FF).
            cb_eventsHandler.addEventHandler(toolbar, "contextmenu", function (e) {
                var event = cb_eventsHandler.getEvent(e);
                cb_eventsHandler.preventDefault(event);
            }, true);
        },

        init: function () {
            this.addEventsToManagerObject();
            this.addHandlers();
        }
    }
    Controller.init();
})());

