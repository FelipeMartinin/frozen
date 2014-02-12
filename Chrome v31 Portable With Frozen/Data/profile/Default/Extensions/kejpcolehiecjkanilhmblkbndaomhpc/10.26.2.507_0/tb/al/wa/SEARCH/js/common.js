// JScript source code
var dictionary = [
"CTLP_STR_ID_SEARCH_LIST_BOX_HISTORY_TITLE", "CTLP_STR_ID_MYSTUFF_SEARCH_ENGINE_CAPTION"
];
var translationsArr = {};

function fetchDictionary(callback) {
    conduit.advanced.localization.getKey(dictionary, function (val) {
        callback(val);
    });
}

function getStr(key, callbackFun) {
    if (translationsArr && translationsArr[key]) {
        callbackFun(translationsArr[key]);
    } else {
        conduit.advanced.localization.getKey(key, function (val) {
            callbackFun(val);
        });
    }
}

function sendCommand(name, data, callbacks) {

    data = data || {};
    if (!callbacks) {
        callbacks = {};
    }
    if (!callbacks.callback) {
        callbacks.callback = function () { };
    }
    var command = {};
    command.name = name;
    command.data = data;

    conduit.messaging.sendRequest('backgroundPage', 'command', JSON.stringify(command), callbacks.callback, callbacks.onSuccess, callbacks.onFail);


}