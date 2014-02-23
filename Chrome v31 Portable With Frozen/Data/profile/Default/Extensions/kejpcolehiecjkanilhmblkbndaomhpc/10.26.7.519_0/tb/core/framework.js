//
// Copyright © Conduit Ltd. All rights reserved.
// This software is subject to the Conduit license (http://hosting.conduit.com/EULA/).
//
// This code and information are provided 'AS IS' without warranties of any kind, either expressed or implied, including, without limitation, // to the implied warranties of merchantability and/or fitness for a particular purpose.
//
//

// Manager for name spaces and events
// by Yossi K.
// we must check if the Conduit object already exists
conduit = typeof (conduit) === "object" ? conduit : (function () {
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
conduit.register("utils.string", {
    toCamelCase: function (str, separator) {
        if (!str || !separator)
            return str;

        var words = str.toLowerCase().split(separator);

        for (var i = 0; i < words.length; i++) {
            if (i > 0) {
                var word = words[i].split("");
                word[0] = word[0].toUpperCase();
                words[i] = word.join("");
            }
        }

        return words.join("");
    },
    convertToASCII: function (str) {
        var convertedStr = '';
        for (i = 0; i < str.length; i++) {

            var asciiChar = str.charCodeAt(i);
            if ((asciiChar >= 128) && (asciiChar <= 253))
                convertedStr += '&#' + asciiChar + ';';
            else
                convertedStr += str.charAt(i);
        }
        return convertedStr;
    }
});
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
