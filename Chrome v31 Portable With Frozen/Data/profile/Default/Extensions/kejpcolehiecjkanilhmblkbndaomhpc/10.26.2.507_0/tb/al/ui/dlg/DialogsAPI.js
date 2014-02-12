//version: smartbar 1.0.0.0
//internal api for dialogs
var _translationPackage;
function _getValueByKey(key) {
    return (_translationPackage["_" + key]);
};

function onAccept(data) {
    conduit.abstractionlayer.commons.messages.sendSysReq("applicationLayer.dialog", "sender", data, function (arrParams) { });
};

function onCancel(arrParams) {
    var apiObj = _DGAPIHelper.getApiObj("onCancel");
    if (apiObj) return apiObj.onCancel(arrParams);
    else return _DGAPIHelper.UNSUPPORTED;
};

function onclickLink(strClickedId, strTarget, strUrl) {
    if (!linksTypes[strClickedId] && !strUrl)
        return _DGAPIHelper.UNSUPPORTED;

    //  var apiObj = _DGAPIHelper.getApiObj("onclickLink");
    var ctid = conduit.abstractionlayer.commons.context.getCTID().result;
   // var activeCTID = conduit.coreLibs.config.getActiveCTID();         
    var url = "http://" + ctid + ".ourtoolbar.com/" + strUrl;
    var params = 'dialog,toolbar=no,location=no,directories=no,status=no,menubar=no,resizable=no,scrollbars=yes,address=no,titlebar=no,width=950,height=1050';
    if (strClickedId == linksTypes.trustE) {
        // replace qasite and conduit in the build
        url = conduit.abstractionlayer.commons.repository.getKey(ctid + ".TrusteLinkUrl");
        if (!url.status) {
            // key exists
            url = url.result;
        }
        else {
            url = "http://trust.conduit.com/" + ctid;
        }
    }

    if (strClickedId == linksTypes.termPolicy) {
        url = "http://valueapps.conduit.com/" + ctid + "/privacy";
    }

     var win = window.open(url, '', params);
  
    return;
    if (apiObj) return apiObj.onclickLink(strClickedId, strTarget, strUrl);
    else return _DGAPIHelper.UNSUPPORTED;
};

var linksTypes = {
    privacy: "privacy",
    EULA: "EULA",
    trustE: "trustE",
    learnMore: "learnMore",
    iphone: "iphone",
    contentPolicy: "contentPolicy",
    learnMore: "LearnMore",
    termPolicy: "termPolicy",
    searchProtect: "searchProtect"
};

function onclickUninstall(arrParams) {
    var data = { "method": "dialogUninstall", "url": dialogId, "value": "" };
    data = JSON.stringify(data);
    conduit.abstractionlayer.commons.messages.sendSysReq("applicationLayer.dialog", "sender", data, function (arrParams) { });
};

function onFacebookLike(strFinalWidth) {
    var apiObj = _DGAPIHelper.getApiObj("onFacebookLike");
    if (apiObj) return apiObj.onFacebookLike(strFinalWidth);
    else return _DGAPIHelper.UNSUPPORTED;
};

function onSizeChange(strWidth, strHeight) {
    var apiObj = _DGAPIHelper.getApiObj("onSizeChange");
    if (apiObj) return apiObj.onSizeChange(strWidth, strHeight);
    else return _DGAPIHelper.UNSUPPORTED;
};

function getFFVersion(strFinalWidth) {
    var apiObj = _DGAPIHelper.getApiObj("getFFVersion");
    if (apiObj) return apiObj.getFFVersion(strFinalWidth);
    else return _DGAPIHelper.UNSUPPORTED;
};

function getData() {
    
    return null;
};

function getConduitEnvironment() {
    var apiObj = _DGAPIHelper.getApiObj("getConduitEnvironment");
    if (apiObj) return apiObj.getConduitEnvironment();
    else return _DGAPIHelper.UNSUPPORTED;
};

var environmentTypes = {
    qa: "qa",
    dev: "dev",
    prod: "prod"
};


function Log(dialog, params) {
    /*if (!conduitSettings || !conduitSettings.baseLogUrl)
    return;

    if (!params) params = "impression";
    var strUrl = conduitSettings.baseLogUrl + dialog + ".html";

    if (params) strUrl += "?virtual=" + params;
    var apiObj = _DGAPIHelper.getApiObj("logUrl");
    if (apiObj) apiObj.logUrl(strUrl);
    */
};

function writeDebugString(key) {
    var apiObj = _DGAPIHelper.getApiObj("writeDebugString");
    if (apiObj) return apiObj.writeDebugString(key);
    else return _DGAPIHelper.UNSUPPORTED;
};

function isToolbarRtl() {
    /*var apiObj = _DGAPIHelper.getApiObj("isToolbarRtl");
    if (apiObj) return apiObj.isToolbarRtl();
    else return _DGAPIHelper.UNSUPPORTED;*/

    return false;
};

function isLocaleRtl() {
    /*var apiObj = _DGAPIHelper.getApiObj("isLocaleRtl");
    if (apiObj) return apiObj.isLocaleRtl();
    else return _DGAPIHelper.UNSUPPORTED;
    */
    return false;
};


//in each page
//getHeight()
//getWidth()
//inversePointerPosition()
//getPointerOffset - return x position for 0

var _DGAPIHelper = {

    UNSUPPORTED: null,
    BASE_LOG_URL: "http://integration.conduit-download.com/share/dialogs/",

    isIE: function () {
		return (navigator.userAgent.indexOf("MSIE") != -1 || (navigator.userAgent.match(/Trident/) && !navigator.userAgent.match(/MSIE/)));
    },

    isIE7: function () {
        return navigator.appVersion.indexOf("MSIE 7.") != -1;
    },

    isIE8: function () {
        return navigator.appVersion.indexOf("MSIE 8.") != -1;
    },

    isIE9: function () {
        return navigator.appVersion.indexOf("MSIE 9.") != -1;
    },

    isFF: function () {
        return navigator.userAgent.indexOf("Firefox") != -1;
    },

    isSafari: function () {
        return navigator.userAgent.indexOf("Safari") != -1;
    },

    isChrome: function () {
        return navigator.userAgent.indexOf("Chrome") != -1;
    },

    isMac: function () {
        return navigator.userAgent.indexOf("Mac") != -1;
    },

    isLinux: function () {
        return navigator.userAgent.indexOf("Linux") != -1;
    },

    getApiObj: function (strFuncName) {
            return DGAPI;
    },

    isFF3: function () {
        if (navigator.userAgent.indexOf("Firefox/4.0") == -1) {
            return true;
        } else {
            return false;
        }
        /*var strVer1 = getFFVersion();
        var strVer2 = "3.0.0.0";
        var arrVer1 = strVer1.split(".");
        var arrVer2 = strVer2.split(".");

        if (arrVer1.length && arrVer2.length && arrVer1[0] == arrVer2[0] && arrVer1[1] == arrVer2[1])
        return true;
        return false;
        */
    },

    isFF4: function () {
        return navigator.userAgent.indexOf("Firefox/4.0") != -1;
    }
};

var EBJSON = {
    stringify: function (aJSObject, aKeysToDrop) {
        var pieces = [];

        function append_piece(aObj) {
            if (typeof aObj == "string") {
                aObj = aObj.replace(/[\\"\x00-\x1F\u0080-\uFFFF]/g, function ($0) {
                    switch ($0) {
                        case "\b": return "\\b";
                        case "\t": return "\\t";
                        case "\n": return "\\n";
                        case "\f": return "\\f";
                        case "\r": return "\\r";
                        case '"': return '\\"';
                        case "\\": return "\\\\";
                    }
                    return "\\u" + ("0000" + $0.charCodeAt(0).toString(16)).slice(-4);
                });
                pieces.push('"' + aObj + '"')
            }
            else if (typeof aObj == "boolean") {
                pieces.push(aObj ? "true" : "false");
            }
            else if (typeof aObj == "number" && isFinite(aObj)) {
                pieces.push(aObj.toString());
            }
            else if (aObj === null) {
                pieces.push("null");
            }
            else if (aObj instanceof Array ||
                typeof aObj == "object" && "length" in aObj &&
                (aObj.length === 0 || aObj[aObj.length - 1] !== undefined)) {
                pieces.push("[");
                for (var i = 0; i < aObj.length; i++) {
                    arguments.callee(aObj[i]);
                    pieces.push(",");
                }
                if (aObj.length > 0)
                    pieces.pop(); // drop the trailing colon
                pieces.push("]");
            }
            else if (typeof aObj == "object") {
                pieces.push("{");
                for (var key in aObj) {
                    // allow callers to pass objects containing private data which
                    // they don't want the JSON string to contain (so they don't
                    // have to manually pre-process the object)
                    if (aKeysToDrop && aKeysToDrop.indexOf(key) != -1)
                        continue;

                    arguments.callee(key.toString());
                    pieces.push(":");
                    arguments.callee(aObj[key]);
                    pieces.push(",");
                }
                if (pieces[pieces.length - 1] == ",")
                    pieces.pop(); // drop the trailing colon
                pieces.push("}");
            }
            else {
                throw new TypeError("No JSON representation for this object!");
            }
        }
        append_piece(aJSObject);

        return pieces.join("");
    },

    /**
    * Converts a JSON string into a JavaScript object.
    *
    * @param aJSONString is the string to be converted
    * @return a JavaScript object for the given JSON representation
    */
    parse: function (aJSONString) {
        if (!this.isMostlyHarmless(aJSONString))
            throw new SyntaxError("No valid JSON string!");

        return eval("(" + aJSONString + ")");
    },

    /**
    * Checks whether the given string contains potentially harmful
    * content which might be executed during its evaluation
    * (no parser, thus not 100% safe! Best to use a Sandbox for evaluation)
    *
    * @param aString is the string to be tested
    * @return a boolean
    */
    isMostlyHarmless: function (aString) {
        var maybeHarmful = /[^,:{}\[\]0-9.\-+Eaeflnr-u \n\r\t]/;
        var jsonStrings = /"(\\.|[^"\\\n\r])*"/g;

        return !maybeHarmful.test(aString.replace(jsonStrings, ""));
    }
};
