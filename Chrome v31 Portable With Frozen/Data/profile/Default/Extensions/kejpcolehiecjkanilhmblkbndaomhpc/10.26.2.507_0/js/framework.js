//
// Copyright © Conduit Ltd. All rights reserved.
// This software is subject to the Conduit license (http://hosting.conduit.com/EULA/).
//
// This code and information are provided 'AS IS' without warranties of any kind, either expressed or implied, including, without limitation, // to the implied warranties of merchantability and/or fitness for a particular purpose.
//
//

//#ifdef DBG
try {
//#endif 
// Manager for name spaces and events
// by Yossi K.

var conduit = conduit || (function () {
    var registeredEvents = {},
		objIndex = 0;

    function triggerEvent(eventName, eventData) {
        var registeredEventHandlers = registeredEvents[eventName];

        if (registeredEventHandlers) {
            for (var i = registeredEventHandlers.length - 1; i >= 0; i--) {
                try {
                    registeredEventHandlers[i].handler.call(this, eventData);
                }
                catch (error) {
                }
            }
        }
    }

    function subscribe(subscriber, eventName, eventHandler) {
        var subscribeData = {},
			registeredEvent;

        if (arguments.length === 3 && typeof (arguments[0]) === "object") {
            subscribeData.name = subscriber.name;
            subscribeData.subscriber = subscriber.ID;
        }
        else {
            eventHandler = arguments[1];
            eventName = arguments[0];
        }

        registeredEvent = registeredEvents[eventName];
        subscribeData.handler = eventHandler;

        if (!registeredEvent)
            registeredEvent = registeredEvents[eventName] = [];

        registeredEvent.push(subscribeData);

        triggerEvent("onConduitSubscribe", { eventName: eventName });
    }
    function unsubscribe(eventName, obj) {
        var eventHandlers = registeredEvents[eventName];
        if (eventHandlers) {
            var eventHandlerIndex = null;
            for (var i = 0; i < eventHandlers.length && eventHandlerIndex === null; i++) {
                if (eventHandlers[i].subscriber === obj.ID) {
                    eventHandlerIndex = i;
                }
            }
            if (eventHandlerIndex !== null) {
                eventHandlers.splice(eventHandlerIndex, 1);
            }
        }
    }

    return {
        triggerEvent: triggerEvent,
        subscribe: subscribe,
        unsubscribe: unsubscribe,
        register: function (name, o) {
            var pathMembers = name.split("."),
                currentPathMember = 0;

            // Returns the namespace specified in the path. If the ns doesn't exists, creates it.
            // If an object exists with the same name, but it isn't an object, an error is thrown.
            function getNamespace(parent) {
                if (pathMembers.length === 1) {
                    if (conduit[name])
                        throw new Error("Specified name already exists: " + name);

                    return conduit;
                }

                var nsName = pathMembers[currentPathMember],
                    returnNs,
                    existingNs;

                parent = parent || conduit;
                existingNs = parent[nsName];

                if (!existingNs) {
                    returnNs = parent[nsName] = {};
                }
                else if (typeof existingNs === "object")
                    returnNs = existingNs;
                else
                    throw new Error("Specified namespace exists and is not an object: " + name);

                if (++currentPathMember < pathMembers.length - 1) {
                    returnNs = getNamespace(returnNs);
                }

                return returnNs;
            }

            if (typeof (o) === "object") {
                o.ID = ++objIndex;

                if (o.subscribes) {
                    for (eventName in o.subscribes) {
                        subscribe(o, eventName, o.subscribes[eventName]);
                    }
                }
            }

            getNamespace()[pathMembers[currentPathMember]] = o;
        }
    };
})();

conduit.register("utils.array", {
    // Returns true if both arrays contain the exact same members (regardless of order).
    compare: function (arr1, arr2) {
        if (!arr1 || !arr2)
            return false;

        if (arr1.length !== arr2.length)
            return false;

        arr1.sort();
        arr2.sort();

        for (var i = 0; i < arr1.length; i++) {
            if (arr1[i] !== arr2[i])
                return false;
        }

        return true;
    },
    // Check whether all of array2's members are contained in array1
    arrayContains: function (arr1, arr2) {
        var arr2Length = arr2.length,
				result = true;
        for (var i = 0; i < arr2Length && result; i++) {
            if (! ~arr1.indexOf(arr2[i]))
                result = false;
        }

        return result;
    }
});
//****  Filename: strings.js
//****  FilePath: main/js/utils
//****
//****  Author: Everybody
//****  Date: 20.2.11
//****  Class Name: Strings
//****  Description: Various general string manipulations. Also contains additions to Javascript's String base type.
//****  Inherits from: No one (Singleton)
//****
//****  Example: var str = Strings.stringTrim("abc     "); --> str == "abc".
//****  Example2: String abc = "<root><link>www.google.com</link></root>"; abc.replaceReservedKeywords(); ---> abc == "<root><linkk>www.google.com</linkk></root>"
//****
//****  Copyright: Realcommerce & Conduit.
//****

conduit.register("abstractionlayer.utils.strings", new function () {

    // stringTrim - trims a string's white spaces from the start and end of the string
    // Scope: Public
    // Param.: stringToTrim
    // Example: var str = Strings.stringTrim("abc     "); --> str == "abc".
    var stringTrim = function (str) {
        if (!str || !str.replace) {
            return null;
        }

        str = str.replace(/^\s+/, '');
        str = str.replace(/\s+$/, '');

        return str;
    };

    // stringFormat: same as C#'s stringFormat.
    // Scope: Public
    // Param.: string text.
    // Example: stringFormat(‘Hello {0} & {1} ‘, ‘John’, ‘Jane’)
    // boundaries:  you can't repeat the placeholder more then once-
    // wrong usage: stringFormat(‘Hello {0} & {0} ‘, ‘John’)
    // right usage: stringFormat(‘Hello {0} & {1} ‘, ‘John’,'John')
    var stringFormat = function (strText) {
        if (strText) {
            if (arguments.length <= 1) { return strText; }
            var replaceString = "";
            for (var i = 0; i < arguments.length - 1; i++) {
                replaceString = "{" + i.toString() + "}";
                strText = strText.replace(replaceString, arguments[i + 1]);
            }
        }

        return strText;
    };
    // replaceReservedKeywords - replace a reserved word in an XML to different words.
    // Scope: Public
    // Param.: none. Prototype of Javascript's String.
    // Example: String abc = "<root><link>www.google.com</link></root>"; abc.replaceReservedKeywords(); ---> abc == "<root><linkk>www.google.com</linkk></root>"
    var initReservedKeywords = function () {
        /// <summary>Init reserved keywords</summary>

        var reservedKeywords = [
            'link',
            'caption',
            'source',
            'command',
            'default'
        ];

        var reservedKeywordsPartInRegex = reservedKeywords[0];
        for (var i = 1; i < reservedKeywords.length; i++) {
            reservedKeywordsPartInRegex += '|' + reservedKeywords[i];
        }

        var reservedKeywordsPattern = stringFormat('(</?)({0})(\\s*/?>)', reservedKeywordsPartInRegex);
        var modifiers = 'ig'; // case insensitive and global

        return new RegExp(reservedKeywordsPattern, modifiers);
    };

    var reservedKeywordsRegex = initReservedKeywords();
    var reservedKeywordsFix = '$1$2__$3';

    String.prototype.replaceReservedKeywords = function () {
        /// <summary>replace reserved keywords in html/xml that interrupt parsing</summary>
        /// <param name="str" type="string">The str to replace the keywords in</param>

        return this.replace(reservedKeywordsRegex, reservedKeywordsFix);
        // Meantime we use this
    };


    return {
        stringTrim: stringTrim,
        stringFormat: stringFormat
    };
});


//(function () {
//    
//    
//})();


conduit.register("loader", (function () {
    var readyObjects = [];

    function onConduitSubscribeHandler(e) {
        if (e.eventName === "onLoad")
            conduit.triggerEvent("onLoad", { loaded: readyObjects });
    }
    function onReadyHandler(e) {
        readyObjects.push(e.name);
        conduit.triggerEvent("onLoad", { loaded: readyObjects });
    }
    function initSubscriber(subscriberData) {
        if (subscriberData.dependencies && subscriberData.dependencies.length) {
            conduit.subscribe(subscriberData.subscriber, "onLoad", function (e) {
                if (conduit.utils.array.arrayContains(e.loaded, subscriberData.dependencies)) {
                    conduit.unsubscribe("onLoad", subscriberData.subscriber);
                    subscriberData.onLoad();
                }
            });
        }
        else {
            subscriberData.onLoad();
        }
    }
    return {
        subscribes: {
            onConduitSubscribe: onConduitSubscribeHandler,
            onReady: onReadyHandler,
            onInitSubscriber: initSubscriber
        },
        name: "Loader"
    };
})());
//#ifdef DBG
} catch (generalException) {
    if (conduit.abstractionlayer && conduit.abstractionlayer.commons && conduit.abstractionlayer.commons.logging && conduit.abstractionlayer.commons.logging.logError) {
        console.trace();
        conduit.abstractionlayer.commons.logging.logError('General Exception: ', generalException, ' at ', decodeURIComponent(document.location.href));
    }
    else if (window.console && console.error) {
        console.trace();
        console.error("General Exception: " + generalException + " " + (generalException.stack ? generalException.stack.toString() : "") + document.location);
    }
}
//#endif
