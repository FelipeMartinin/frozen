//****  Filename: toolbarAPI.js
//****  FilePath: main/js/toolbarAPI/
//****  Date: 21.09.11
//****  Author: Uri Weiler + Code from Niv Elad's FF toolbarApi at (AbstractionLayer\Firefox\Dev\FFSmartBar\js\shared\api\ToolbarApi.js)
//****
//****  Description: Used to communicate btw. the publisher's in-page toolbar Api (http://api.conduit.com/ToolbarApi.js) and the extension.
//****               Saves data on startup to internal structs so it can be accessed later on-synchronously + 
//****               contains a-synchronous methods which pass on messages to the extension (Application Layer).
//****
//****  Usage: ToolbarAPI() is instantiated after the document is ready by a call to the global TPIRegisterToolbarFF function.
//****
//****  Copyright: Realcommerce & Conduit.
//****

// Unified code for all toolbars - consists of communication protocol with the toolbar via hidden div + ToolbarApi proxy object.
if (!('__TPIInWindow' in window)) {
    window.__TPIInWindow = true; // Injecting ToolbarAPI.js only once inside a page.
    var chromeMessaging = {};
    var ToolbarAPI = {};
    var asyncAPIs = { RefreshToolbarByCTID: true,
        ForceRefreshToolbar: true,
        ForceRefreshServices: true,
        AddComponentByXML: true,
        AddRadioStation: true,
        AddAlert: true,
        SwitchToCommunity: true,
        AddUserLinkMenuItem: true,
        AddMyStuffComponent: true,
        AddMyStuffAlert: true,
        SendMessage: true
    };

    (function () {
        chromeMessaging = function (ctid) {
            var CUSTOM_DIV_ID = "__conduitCustomDivForTPI" + (ctid ? ctid : "");

            var createHiddenDiv = function () {
                // If the custom hidden DIV doesn't exist (not created by the injected script yet) - creating it.	
                var myCustomDiv = document.getElementById(CUSTOM_DIV_ID);
                if (!myCustomDiv) {
                    myCustomDiv = window.document.createElement("div");
                    myCustomDiv.setAttribute("id", CUSTOM_DIV_ID);
                    myCustomDiv.setAttribute("style", "display:none");
                    if (document.head) {
                        //console.error("TPI!111 Creating hiddenDiv:", CUSTOM_DIV_ID);
                        document.head.appendChild(myCustomDiv);
                    }
                }
            };

            createHiddenDiv();

            this.messages = {};

            // Sends an event to the extension. event data is contained inside the hidden DIV and read by the extension which shares the same DOM.
            var sendEventData = function (hiddenDiv, eventName, eventData) {
                try {
                    var customEvent = document.createEvent('Event');
                    customEvent.initEvent(eventName, true, true);
                    hiddenDiv.innerText = JSON.stringify(eventData);
                    hiddenDiv.dispatchEvent(customEvent);
                }
                catch (generalException) { }
            };

            // Listens for an event received from the extension and runs the listener callback with the data contained inside the hidden DIV.
            var addEventListener = function (hiddenDiv, eventName, listenerCallback, sender) {
                hiddenDiv.addEventListener(eventName, function () {
                    try {
                        var __message = JSON.parse(hiddenDiv.innerText);
                        if (__message.msgSender === sender) {
                            listenerCallback(__message, sender);
                        }
                        else {
                            //console.error("NOT RUNNING FUNCTION IN TOOLBARAPI - sender is not our sender: ", sender, __message.msgSender, __message);
                        }
                    }
                    catch (generalException) { 
                        console.error("ToolbarAPI Listener Exception: " + generalException + " " + (generalException.stack ? generalException.stack.toString() : "") + document.location, listenerCallback, sender, eventName, hiddenDiv ? hiddenDiv.innerText : "NOHIDDENDIV");
                    }
                });
            };

            this.messages.sendSysReq = function (dest, sender, data, callback) {
                var __sendMessage =
            {
                action: "sendSystemRequest",
                data:
                {
                    dest: dest,
                    sender: sender,
                    data: data,
                    type: "addListenerBack"
                }
            };
                try {
                    var hiddenDiv = document.getElementById(CUSTOM_DIV_ID);
                    if (hiddenDiv) {
                        // Adding listener from sendRequest response via DIV in order to run the callback at the end.
                        var myData = null;
                        var mySender = null;

                        try {
                            myData = JSON.parse(data);
                            mySender = myData ? myData.method : "";
                        } catch (e) { }

                        if (!myData) {
                            myData = data;
                            mySender = data;
                        }

                        var listenerCallback = function (result, listenerSender) {
                            if (listenerSender === mySender) {
                                var resultData = null;
                                try {
                                    resultData = result && result.data ? JSON.parse(result.data) : "{}";
                                }
                                catch (e) {
                                    try {
                                        // Special case in which no JSON object is returned - only a string.
                                        resultData = result && result.data ?  result.data: "{}";
                                    } catch(e2) {
                                        resultData = "{}";
                                    }
                                }
                                if (callback && typeof callback === 'function') {

                                    // Not running callback if callbackType exists (i.e. a listener was added via sendSysReq).
                                    if (resultData && !resultData._callbackType) {
                                        callback(resultData);
                                    }
                                }
                            }
                        };

                        // Adding listener for sysRequest future response
                        addEventListener(hiddenDiv, 'sysReqReceivedEvent', listenerCallback, mySender);

                        // Sending sys request.
                        sendEventData(hiddenDiv, 'sendSysReqEvent', __sendMessage);
                    }
                    else {
                        console.error("TPI: NO HIDDEN DIV IN " + document.location);
                        console.trace();
                    }
                }
                catch (generalException) {
                    console.error("ToolbarAPI Exception: " + generalException + " " + (generalException.stack ? generalException.stack.toString() : "") + document.location);
                    return {
                        result: '',
                        status: 9999,
                        description: "Exception: " + generalException
                    };
                }
            };
        };
    })();

    /**
    * Error codes.
    */
    var ToolbarApiConst =
    {
        Errors:
	    {
	        NO_TOOLBAR: 0,
	        SUCCESS: 1,
	        COMPONENT_EXISTS: 5,
	        ERROR_PARSE_XML: 4,
	        UNSUPPORTED: 2,
	        NO_RADIO_COMPONENT: 21,
	        RADIO_MEDIA_EXISTS: 7,
	        ALERT_ERROR: 8,
	        COMPONENT_BLOCKED: 9,
	        UN_TRUSTED_DOMAIN: 10,
	        MY_STUFF_DISABLED: 11,
	        MENU_ITEM_ALREADY_EXISTS: 12,
	        MENU_ITEM_COMP_ID_NOT_VALID: 13,
	        PRIVATE_MENU_LOAD_ERROR: 14,
	        PRIVATE_MENU_PARSE_ERROR: 15,
	        PRIVATE_MENU_INTERNAL_ERROR: 16,
	        OPERATION_ABORTED: 17,
	        COMMUNITY_NOT_FOUND: 18,
	        NO_MC_AND_GROUPING: 19,
	        ACCESS_DENIED: 20
	    },

        IsAddComponentAlertString: 'You are about to add a component to your toolbar. Click OK to allow this component.',
        IsAddAlertAlertString: 'You are about to add an alert, click ok to add this alert.\n\nAlerts are special messages that are sent to you because you installed a community toolbar.\nThe alerts usually include important news or special offers, and are sent only to members of the community.'
    };

    (function () {
        ToolbarApi = function (ctid, uniqueLocalId) {
            var self = this;
            self.ctid = ctid;
            self.uniqueLocalId = uniqueLocalId;
            var commons;
            var toolbarInfo;
            var supportedUserAddMenu;
            var installedApps;

            /**
            * toolbar info callback
            */
            this.getToolbarInfoCallBack = function (data) {
                toolbarInfo = data && data.data ? data.data : "<NOTOOLBARINFO></NOTOOLBARINFO>";
            };

            /**
            * supported user manu callback
            */
            this.getSupportedUserAddMenuCallBack = function (data) {
                supportedUserAddMenu = data && data.data ? data.data : "<NOTSUPPORTEDUSERADDMENU></NOTSUPPORTEDUSERADDMENU>";
            };

            /**
            * installed apps callback
            */
            this.getInstalledAppsCallBack = function (data) {
                installedApps = data && data.data ? data.data : [];
            };

            /**
            * an empty callback 
            */
            this.emptyCallBack = function (data) {
            };

            /**
            * default cotr.
            */
            this.init = function (objCTIDs) {
                //use the hidden div with the original ctid
                //use the registered toolbars with active ctid
                commons = new chromeMessaging(objCTIDs.original);

                commons.messages.sendSysReq('toolbarapisync', 'toolbarApi', 'getToolbarInfo', self.getToolbarInfoCallBack);
                commons.messages.sendSysReq('toolbarapisync', 'toolbarApi', 'getSupportedUserAddMenu', self.getSupportedUserAddMenuCallBack);
                commons.messages.sendSysReq('toolbarapisync', 'toolbarApi', 'getInstalledApps', self.getInstalledAppsCallBack);
                var myCtid = objCTIDs.active ? objCTIDs.active : objCTIDs.original;
                if (typeof window._TPIRegisterToolbarFF === "function" && myCtid) {
                    if (_RegistredToolbars && _RegistredToolbars.getToolbar && _RegistredToolbars.getToolbar(myCtid)) {
                        console.log("Toolbar: ", myCtid, " already exists in ", document.location.href, "... Not adding.");
                    }
                    else {
                        var selfi = self;
                        selfi.ctid = myCtid;
                        console.log("Adding toolbar : ", self, " to array with CTID: ", myCtid, " to document in: ", document.location.href);
                        window._TPIRegisterToolbarFF(selfi);

                        if (!window.wasTpiDocumentCompleteExecuted && window.TpiDocumentComplete) {
                            window.wasTpiDocumentCompleteExecuted = true;
                            window.TpiDocumentComplete(myCtid);
                        }
                    }
                } else {
                    console.log("Chrome TOOLBARAPI couldn't find _TPIRegisterToolbarFF in page " + document.location, ctid, window);
                }
            };

            /**
            *  the main entry point from apps page to the toolbar.
            *  This function gets one parameter, args which is array of strings. 
            *  The first string in the array is the name of the function to execute, 
            *  the rest of the strings in the array are the function's parameters. 
            */
            this.ExecuteApiFunction = function (args) {
                var strFuncName = args[0];
                var bCheckIsSupportedOnly = (strFuncName == "IsSupportedFunction");
                var bIsSupported;
                var errorCode;

                //check is supported manager function

                if (bCheckIsSupportedOnly) {
                    bIsSupported = this._ExecuteApiFunction(args[1], null, true);
                    errorCode = ToolbarApiConst.Errors.SUCCESS;
                    return this.GetResultXmlString(bIsSupported, errorCode);
                }
                else {
                    return this._ExecuteApiFunction(strFuncName, args, false);
                }
            };

            /**
            * return a structured XML of the response
            */
            this.GetResultXmlString = function (bResult, iErrorCode, strDataXml) {
                if (typeof strDataXml == "undefined") {
                    strDataXml = "";
                }

                var strResult = "<RETURN_OBJECT>";
                strResult += "<RETURN_VALUE>" + bResult.toString() + "</RETURN_VALUE>";
                strResult += "<ERROR_CODE>" + iErrorCode + "</ERROR_CODE>";
                strResult += "<DATA>" + strDataXml + "</DATA>";
                strResult += "</RETURN_OBJECT>";
                return strResult;
            };

            /**
            * generate a json parsm structure from the arguments
            */
            this.generateParamsUtil = function (args) {
                var params = [];
                for (i = 1; i < args.length; i++) {
                    params[i - 1] = args[i];
                }

                return params;
            };

            /**
            * This private ExecuteApiFunction is called by its public version to
            * verify which function in the proxy needs to be invoked.
            */
            this._ExecuteApiFunction = function (strFuncName, arrArguments, bCheckIsSupportedOnly) {

                if (asyncAPIs[strFuncName]) {
                    if (bCheckIsSupportedOnly) return true;
                    arrArguments ? arrArguments.shift() : "";
                    var message = { "targetMethod": strFuncName, "params": arrArguments }; // arrArguments includes the function name, so we shift it
                    commons.messages.sendSysReq('toolbarapiasync', 'toolbarApi', JSON.stringify(message), this.emptyCallBack);
                    return this.GetResultXmlString(true, 1, true);
                } else {

                    switch (strFuncName) {
                        case "IsSupportedFunction": if (bCheckIsSupportedOnly) return true;
                            break;
                        case "IsLatestApi": if (bCheckIsSupportedOnly) return true;
                            return this.IsLatestApi();
                            break;
                        case "GetToolbarInfo": if (bCheckIsSupportedOnly) return true;
                            return this.GetToolbarInfo();
                            break;
                        case "GetInfo": if (bCheckIsSupportedOnly) return true;
                            return this.GetToolbarInfo();
                            break;
                        case "GetAllToolbarsInfo": if (bCheckIsSupportedOnly) return true;
                            return this.GetToolbarInfo();
                            break;
                        case "IsToolbarVisible": if (bCheckIsSupportedOnly) return true;
                            return this.IsVisible();
                            break;
                        case "GetSupportedUserAddMenu": if (bCheckIsSupportedOnly) return true;
                            return this.GetSupportedUserAddMenu();
                            break;
                        case "IsAppInstalled": if (bCheckIsSupportedOnly) return true;
                            return this.IsAppInstalled(arrArguments);
                            break;
                        case "IsInstalled": if (bCheckIsSupportedOnly) return true;
                            return this.IsInstalled();
                            break;
                        case "IsHidden": if (bCheckIsSupportedOnly) return true;
                            return this.IsHidden();
                            break;
                        case "ShowHiddenToolbar": if (bCheckIsSupportedOnly) return true;
                            return this.ShowHiddenToolbar();
                            break;
                        case "HideShownToolbar": if (bCheckIsSupportedOnly) return true;
                            return this.HideShownToolbar();
                            break;
                        default: if (bCheckIsSupportedOnly) return false;
                            return this.UnsupportedFunction();
                            break;
                    }
                }
            };



            /**
            * check the version of the api
            */
            this.IsLatestApi = function () {
                var isIt = this.GetResultXmlString(true, 1, "");
                return isIt;
            };

            /**
            * get toolbar information
            */
            this.GetToolbarInfo = function () {
                return this.GetResultXmlString(true, 1, toolbarInfo);
            };


            /**
            * is the toolbar visible or not
            */
            this.IsVisible = function () {
                //var toolbarFrame = $('iframe[ctid|="' + this.ctid + '"]');
                var toolbarFrame = document.getElementById("main-iframe-wrapper");
                var myCtids = document.getElementsByClassName("TOOLBAR_IFRAME");
                var answer = false;

                for (var i = 0; i < myCtids.length; i++) {
                    if (myCtids[i] && myCtids[i].getAttribute && myCtids[i].getAttribute('ctid') === ctid) {
                        if (myCtids[i] && myCtids[i].style && myCtids[i].style.visibility !== 'hidden') {
                            answer = true;
                        }
                    }
                }

                return this.GetResultXmlString(answer, 1, true);
            };


            this.ShowHiddenToolbar = function () {
                var headID = document.getElementsByTagName("head")[0];
                var scriptNode;
                scriptNode = document.createElement('script');
                scriptNode.setAttribute('id', "showTB");
                scriptNode.setAttribute('type', 'text/javascript');
                var text = 'var evt = document.createEvent("CustomEvent");';
                var str = "showTB" + ctid;
                text += 'evt.initCustomEvent("' + str + '", true, true,false);';
                text += 'document.dispatchEvent(evt);';
                scriptNode.text = text;
                headID.appendChild(scriptNode);
            };


            this.HideShownToolbar = function () {
                var headID = document.getElementsByTagName("head")[0];
                var scriptNode;
                scriptNode = document.createElement('script');
                scriptNode.setAttribute('id', "hideTB");
                scriptNode.setAttribute('type', 'text/javascript');
                var text = 'var evt = document.createEvent("CustomEvent");';
                var str = "hideTB" + ctid;
                text += 'evt.initCustomEvent("' + str + '", true, true,false);';
                text += 'document.dispatchEvent(evt);';
                scriptNode.text = text;
                headID.appendChild(scriptNode);
            };
            


            this.IsHidden = function () {
                //var toolbarFrame = $('iframe[ctid|="' + this.ctid + '"]');
                var toolbarFrame = document.getElementById("main-iframe-wrapper");
                var myCtids = document.getElementsByClassName("TOOLBAR_IFRAME");
                var answer = false;

                for (var i = 0; i < myCtids.length; i++) {
                    if (myCtids[i] && myCtids[i].getAttribute && myCtids[i].getAttribute('ctid') === ctid) {
                        if (myCtids[i] && myCtids[i].style && myCtids[i].style.visibility == 'hidden') {
                            answer = true;
                        }
                    }
                }

                return this.GetResultXmlString(answer, 1, true);
            };


            /**
            *
            */
            this.GetSupportedUserAddMenu = function () {
                return this.GetResultXmlString(true, 1, supportedUserAddMenu);
            };

            /**
            *
            */
            this.IsAppInstalled = function (args) {
                for (var i = 0; i < installedApps.length; i++) {
                    if (installedApps[i] == args[1]) {
                        return this.GetResultXmlString(true, 1, "<SINGLE_VALUE>" + true + "</SINGLE_VALUE>");
                    }
                }
                return this.GetResultXmlString(true, 1, "<SINGLE_VALUE>" + false + "</SINGLE_VALUE>");
            };

            this.IsInstalled = function () {
                return this.GetResultXmlString(true, 1, true);
            };

            /**
            *
            */
            this.UnsupportedFunction = function () {
                return this.GetResultXmlString(false, ToolbarApiConst.Errors.UNSUPPORTED);
            };
        };
    })();
}

// Specific code for each toolbar - getting CTID, unique local id and initializing ToolbarApi proxy object.
(function () {
    var TPI__commonsInit = new chromeMessaging("");

    var myLocalId = '';
    try {
    	// Find the local id by going over all injected scripts and looking for the script
	    // that is currently running. go from end to start so we don't find toolbarAPI.js's of
	    // other toolbars who injected before us
        for (var idx=document.scripts.length-1; idx>=0; idx-=1) {
            var curr = document.scripts[idx];
            if ((curr.src || '').indexOf('toolbarAPI.js?uniqueLocalId=') !== -1) {
                var id = parseInt(curr.src.split('uniqueLocalId=')[1] || '', 10);
                if (!isNaN(id)) {
                    myLocalId = id;
                }
                break;
            }
        }
    } catch(e) {}


    var tpinit = function(objCTIDs){
        var myCtid = '';
            if (objCTIDs.original) {
                 myCtid = objCTIDs.original; //FOR MSGING TO WORK
            } else {
                myCtid = "CT3093681"; // Stub.
            }

            if(objCTIDs.active){
                _TPIUnregisterToolbar(objCTIDs.original);
            }
            // Initializing ToolbarAPI
            if (typeof _RegistredToolbars !== 'undefined' && _RegistredToolbars.isRegistred(myCtid)) {
                console.log("Not adding ctid: ", myCtid, " already registered!");
            }
            else {
                var api = new ToolbarApi(myCtid, myLocalId);
                api.init(objCTIDs);
            }
    };

    TPI__commonsInit.messages.sendSysReq('context.getActingCTID', 'toolbarApi', 'context.getCTID', function (objCTIDs) {
        tpinit(objCTIDs);
    });
    
     var onCTIDactivate = function (objMsg) {
        if (objMsg && objMsg.data && objMsg.data.type == "context.setActingCTID"  && objMsg.data.objCTIDs) {
           tpinit(objMsg.data.objCTIDs);
        }
    };
    window.addEventListener("message", onCTIDactivate);

}());
