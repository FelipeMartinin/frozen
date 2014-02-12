//****  Filename: JSONStringify.js
//****  FilePath: main/js/utils
//****
//****  Author: Thomas Frank
//****  Date: 20.2.11
//****  Class Name: JSONStringify
//****  Description: Creates a JSON object from a string and vice versa.
//****
//****  Example: var myNewJSONObject = JSONString.toObject(myString);
//****  Example2: var myNewString = JSONString.toJsonStringArray(myObject);
//****
//****  Copyright: Realcommerce & Conduit.
//****

/*
JSONstring v 1.02
copyright 2006-2010 Thomas Frank
(Small sanitizer added to the toObject-method, May 2008)
(Scrungus fix to some problems with quotes in strings added in July 2010)

This EULA grants you the following rights:

Installation and Use. You may install and use an unlimited number of copies of the SOFTWARE PRODUCT.

Reproduction and Distribution. You may reproduce and distribute an unlimited number of copies of the SOFTWARE PRODUCT either in whole or in part; each copy should include all copyright and trademark notices, and shall be accompanied by a copy of this EULA. Copies of the SOFTWARE PRODUCT may be distributed as a standalone product or included with your own product.

Commercial Use. You may sell for profit and freely distribute scripts and/or compiled scripts that were created with the SOFTWARE PRODUCT.

http://www.thomasfrank.se/json_stringify_revisited.html

Based on Steve Yen's implementation:
http://trimpath.com/project/wiki/JsonLibrary

Sanitizer regExp:
Andrea Giammarchi 2007
*/

JSONstring = {
        compactOutput: false,
        includeProtos: false,
        includeFunctions: false,
        detectCirculars: true,
        restoreCirculars: true,
        make: function (arg, restore) {
            this.restore = restore;
            this.mem = []; this.pathMem = [];
            return this.toJsonStringArray(arg).join('');
        },
        toObject: function (x) {
            if (!this.cleaner) {
                try { this.cleaner = new RegExp('^("(\\\\.|[^"\\\\\\n\\r])*?"|[,:{}\\[\\]0-9.\\-+Eaeflnr-u \\n\\r\\t])+?$') }
                catch (a) { this.cleaner = /^(true|false|null|\[.*\]|\{.*\}|".*"|\d+|\d+\.\d+)$/ }
            };
            try {
                if (!this.cleaner.test(x)) { return {} };
            } catch (e) { console.error('JSONstring error: RegExp to big, ', e); }
            eval("this.myObj=" + x);
            if (!this.restoreCirculars || !alert) { return this.myObj };
            if (this.includeFunctions) {
                var x = this.myObj;
                for (var i in x) {
                    if (typeof x[i] == "string" && !x[i].indexOf("JSONincludedFunc:")) {
                        x[i] = x[i].substring(17);
                        eval("x[i]=" + x[i])
                    }
                }
            };
            this.restoreCode = [];
            this.make(this.myObj, true);
            var r = this.restoreCode.join(";") + ";";
            eval('r=r.replace(/\\W([0-9]{1,})(\\W)/g,"[$1]$2").replace(/\\.\\;/g,";")');
            eval(r);
            return this.myObj
        },
        toJsonStringArray: function (arg, out) {
            if (!out) { this.path = [] };
            out = out || [];
            var u; // undefined
            switch (typeof arg) {
                case 'object':
                    this.lastObj = arg;
                    if (this.detectCirculars) {
                        var m = this.mem; var n = this.pathMem;
                        for (var i = 0; i < m.length; i++) {
                            if (arg === m[i]) {
                                out.push('"JSONcircRef:' + n[i] + '"'); return out
                            }
                        };
                        m.push(arg); n.push(this.path.join("."));
                    };
                    if (arg) {
                        if (arg.constructor == Array) {
                            out.push('[');
                            for (var i = 0; i < arg.length; ++i) {
                                this.path.push(i);
                                if (i > 0)
                                    out.push(',\n');
                                this.toJsonStringArray(arg[i], out);
                                this.path.pop();
                            }
                            out.push(']');
                            return out;
                        } else if (typeof arg.toString != 'undefined') {
                            out.push('{');
                            var first = true;
                            for (var i in arg) {
                                if (!this.includeProtos && arg[i] === arg.constructor.prototype[i]) { continue };
                                this.path.push(i);
                                var curr = out.length;
                                if (!first)
                                    out.push(this.compactOutput ? ',' : ',\n');
                                this.toJsonStringArray(i, out);
                                out.push(':');
                                this.toJsonStringArray(arg[i], out);
                                if (out[out.length - 1] == u)
                                    out.splice(curr, out.length - curr);
                                else
                                    first = false;
                                this.path.pop();
                            }
                            out.push('}');
                            return out;
                        }
                        return out;
                    }
                    out.push('null');
                    return out;
                case 'unknown':
                case 'undefined':
                case 'function':
                    if (!this.includeFunctions) { out.push(u); return out };
                    arg = "JSONincludedFunc:" + arg;
                    out.push('"');
                    var a = ['\\', '\\\\', '\n', '\\n', '\r', '\\r', '"', '\\"']; arg += "";
                    for (var i = 0; i < 8; i += 2) { arg = arg.split(a[i]).join(a[i + 1]) };
                    out.push(arg);
                    out.push('"');
                    return out;
                case 'string':
                    if (this.restore && arg.indexOf("JSONcircRef:") == 0) {
                        this.restoreCode.push('this.myObj.' + this.path.join(".") + "=" + arg.split("JSONcircRef:").join("this.myObj."));
                    };
                    out.push('"');
                    var a = ['\n', '\\n', '\r', '\\r', '"', '\\"'];
                    arg += ""; for (var i = 0; i < 6; i += 2) { arg = arg.split(a[i]).join(a[i + 1]) };
                    out.push(arg);
                    out.push('"');
                    return out;
                default:
                    out.push(String(arg));
                    return out;
            }
        }
    };
   

 
var Logger = new function () {

    //Keys names
    var Consts = {
        keys: {
            SmartBarLog_Trace: "SmartBarLogTrace",
            SmartBarLog_Error: "SmartBarLogError",
            SmartBarLog_Info: "SmartBarLogInfo",
            SmartBarLog_Debug: "SmartBarLogDebug"
        },
        registry: {
            path: "Software\\AppDataLow\\Software\\SmartBar\\CH",
            machine: "HKEY_CURRENT_USER"
        }
    };

    //Registry default/Dynamic flags value
    var repValue = {
        SmartBar_Log_Trace: false,
        SmartBar_Log_Error: false,
        SmartBar_Log_Info: false,
        SmartBar_Log_Debug: false
    };

    //Start save file Parameteres
    var loggerPath = "/logs/";
    var fileData = null;
    var isBinary = false;
    var overwrite = true;
    var appendToFile = true;
    var extensionId = chrome.i18n.getMessage("@@extension_id");
    var callbackFunctionName = "onFinishLog";
    var winPointer = window;
    var threadID = 0;
    var level = 0;
    var nameSpace = "NameSpace";
    var anonymous = "Anonymous";
    var noFunctionParams = "No Function Params";
    var noErrorObject = "No Error Object";

    var externalKeysPath = function () {
        var repositoryPath = "Software\\AppDataLow\\Software\\SmartBar\\CR\\";
        var strUserAgent = window.navigator.userAgent;
        var iStart = strUserAgent.indexOf('(');
        var iEnd = strUserAgent.indexOf(')');
        var strPlatformData = strUserAgent.substring(iStart, iEnd);
        var arrData = strPlatformData.split(';');
        var osName = arrData[0].replace(/\(/g, "");
        if (~["NT 5.1", "Windows NT 5.1"].indexOf(osName)) { //fox XP               
            repositoryPath = "Software\\SmartBar\\CR";
        }
        return repositoryPath;
    } ();

    var getExternalKey = function (key, callback) {
        var getKeyMsg = { namespace: "Repository", funcName: "getKey", parameters: ["HKEY_CURRENT_USER", externalKeysPath, key] };
        window.top.nativeMsgComm.sendMessage(getKeyMsg, function (response) {
            if (callback) {
                callback(response);
            };
        });
    };

    var isDebugLog_ErrorEnabled;
    var isDebugLog_InfoEnabled; ;
    var isDebugLog_TraceEnabled;
    var isDebugLog_DebugEnabled;

    //Init logging flags
    var initSettings = function () {
        //read keys 
        getExternalKey(Consts.keys.SmartBarLog_Error, function (res1) {
            isDebugLog_ErrorEnabled = res1;
            getExternalKey(Consts.keys.SmartBarLog_Info, function (res2) {
                isDebugLog_InfoEnabled = res2;
                getExternalKey(Consts.keys.SmartBarLog_Trace, function (res3) {
                    isDebugLog_TraceEnabled = res3;
                    getExternalKey(Consts.keys.SmartBarLog_Debug, function (res4) {
                        isDebugLog_DebugEnabled = res4;
                        repValue.SmartBar_Log_Error = isDebugLog_ErrorEnabled && isDebugLog_ErrorEnabled.result ? true : false;
                        repValue.SmartBar_Log_Info = isDebugLog_InfoEnabled && isDebugLog_InfoEnabled.result ? true : false;
                        repValue.SmartBar_Log_Trace = isDebugLog_TraceEnabled && isDebugLog_TraceEnabled.result ? true : false;
                        repValue.SmartBar_Log_Debug = isDebugLog_DebugEnabled && isDebugLog_DebugEnabled.result ? true : false;
                    });
                });

            });
        });

    };


    //Get formatted message
    var getMessageFormatted = function (errorData) {
        if (!errorData) return;

        var dateObject = new Date();
        var exceptionMessage = (errorData.errorObject && errorData.errorObject.message && errorData.errorObject.stack) ? errorData.errorObject.message + "|" + errorData.errorObject.stack : "";
        var data = ["[" + dateObject.getMonth() + 1 + "/" + dateObject.getDate() + "/" + dateObject.getFullYear() + "]",
                    "[" + dateObject.getHours() + ":" + dateObject.getMinutes() + ":" + dateObject.getSeconds() + "]",
                    "[" + threadID + "]",
                    "[" + level + "]",
                    "[" + (errorData.namespace ? errorData.namespace : nameSpace) + "]",
                    "[" + (errorData.functionName ? errorData.functionName : anonymous) + "]",
                    "[" + (errorData.functionParams && JSON.stringify(errorData.functionParams) ? JSON.stringify(errorData.functionParams) : noFunctionParams) + "]",
                    errorData.returnValue ? "[" + errorData.returnValue + "]" : "[]",
                    "[" + (errorData.errorMessage ? errorData.errorMessage : "") + "]",
                    "[" + (errorData.errorObject && JSON.stringify(errorData.errorObject) ? JSON.stringify(errorData.errorObject) : noErrorObject) + "]"
                   ];

        if (exceptionMessage) {
            data.push(exceptionMessage);
        }

        return data.join(" ") + "\n";
    };


    //Save log to file
    var save = function (absFlag) {
        return;
        var dateObject = new Date();
        var fileNameLog = "Log_" + (dateObject.getDate() < 10 ? "0" : "") + dateObject.getDate() + "-" +
                          (dateObject.getMonth() < 10 ? "0" : "") + dateObject.getMonth() + "-" +
                          dateObject.getFullYear() + (absFlag ? "_Abs.txt" : "_App.txt");
        var setDataMsg = { namespace: "Repository", funcName: "setData", parameters: [false, fileNameLog, fileData, false, "append"] };
        window.top.nativeMsgComm.sendMessage(setDataMsg, function (response) { });
    };


    var doFunction = function (errorData, key, type, absFlag) {
        return;
        if (!errorData || !key || key == "false") {
            return { result: '', status: 9000, description: 'Parameter is null' };
        }

        fileData = getMessageFormatted(errorData, type);
        if (absFlag) {
            switch (type) {
                case 'Info':
                    console.warn("Information", fileData);
                    break;
                case 'Error':
                    console.error("Error", fileData);
                    break;
                case 'Debug':
                    console.debug("Debug", fileData);
                    break;
                case 'Trace':
                    console.log("Trace Logs", fileData);
                    break;
                default: break;
            }
        }
        save(absFlag);
        return { result: true, status: 0, description: '' };
    };

    var trace = function (errorData) { return doFunction(errorData, repValue.SmartBar_Log_Trace, "Trace"); };
    var info = function (errorData) { return doFunction(errorData, repValue.SmartBar_Log_Info, "Info"); };
    var error = function (errorData) { return doFunction(errorData, repValue.SmartBar_Log_Error, "Error"); };
    var debug = function (errorData) { return doFunction(errorData, repValue.SmartBar_Log_Debug, "Debug"); };
    var internalTrace = function (errorData) { return doFunction(errorData, repValue.SmartBar_Log_Trace, "Trace", true); };
    var internalInfo = function (errorData) { return doFunction(errorData, repValue.SmartBar_Log_Info, "Info", true); };
    var internalError = function (errorData) { return doFunction(errorData, repValue.SmartBar_Log_Error, "Error", true); };
    var internalDebug = function (errorData) { return doFunction(errorData, repValue.SmartBar_Log_Debug, "Debug", true); };

    initSettings();

    return {
        logTrace: trace,
        logInfo: info,
        logError: error,
        logDebug: debug,
        internal: {
            logTrace: internalTrace,
            logInfo: internalInfo,
            logError: internalError,
            logDebug: internalDebug
        }
    };
};

