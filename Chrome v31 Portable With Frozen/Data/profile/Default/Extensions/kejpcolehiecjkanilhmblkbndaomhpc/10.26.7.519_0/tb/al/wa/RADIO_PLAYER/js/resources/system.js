
var globalDebug = 'default value';

function sendUsage(type, extraData) {    
    conduit.logging.usage.log(type,extraData);
}

App = {
    openConduitTab: function () {
        //http://apps.conduit.com/search?SearchSourceOrigin=47&utm_source=RadioApp&utm_campaign=RadioApp&utm_medium=ConduitPowerBy
        conduit.tabs.create({ url: "http://www.conduit.com" });
    },

    close: function () {
        conduit.app.popup.close();
        //CloseFloatingWindow();                             
    },

    storeKey: function (key, value) {
        if (typeof (value) !== "string") {
            if (typeof (value) === "object") {
                value = JSON.stringify(value);
            } else {
                value = value.toString();
            }
        }
        conduit.storage.app.items.set(key, value);
    },

    retrieveKey: function (key, scb, fcb) {
        conduit.storage.app.items.get(key, scb, fcb || function (e) { scb(''); });
    },



    // *** should delete storeGlobalKey and retrieveGlobalKey?  ***
    // 1 - no one use them
    // 2 - storeGlobalKey does the same as storeKey
    // 3 - retrieveGlobalKey have bug - calling the not existing conduit.storage.items.keys.get (should probably be global.items or global.keys)



    storeGlobalKey: function (key, value) {
        if (typeof (value) !== "string") {
            if (typeof (value) === "object") {
                value = JSON.stringify(value);
            } else {
                value = value.toString();
            }
        }
        conduit.storage.app.items.set(key, value);
    },

    retrieveGlobalKey: function (key, cb) {
        conduit.storage.items.keys.get(key, cb);
    },

    deleteKey: function (key) {
        conduit.storage.app.items.remove(key);
    },
    changeWidth: function (width) {

        width = Math.ceil(width);
        ChangeWidth(width);

    },
    changeHeight: function (height) {

        height = Math.ceil(height);
        ChangeHeight(height);
    },
    closeFloatingWindow: function () {

        CloseFloatingWindow();
    },
    openGadget: function (url, width, height, params) {
        OpenGadget(url, width, height, params);
    }
};

