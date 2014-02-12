//ver:1.0.0.1
var canvas = document.getElementById('deck_tip');
var ltr = true;
var isReversedPointer = false;
var arrPersonalComps = null;
var isCanvasVisible = true;
var gToolbarName = "";
var attempsToConnectToServer = 0;
var isMac = false;
var isLinux = false;
var counterHiddingFooter = 0;
var generatedLinkCounter = 0;
var dialogId = "toolbarFirstTime";
var toolbarData = { name: "" };
var absRepository = conduit.abstractionlayer.commons.repository;
var localKey = "en_US";
var browserInfo = conduit.abstractionlayer.commons.environment.getBrowserInfo().result;
var isIE = (browserInfo.type == "IE");
var isFF = (browserInfo.type == "Firefox");
var isChrome = (browserInfo.type == "Chrome");
var isSafari = (browserInfo.type == "Safari");
var um;

$(function () {
    var setupAPIData;
    //get the toolbar direction param from the query string.
    var dir = window.location.search.substring(1).split("=")[1];

    //add a class to the html tag.
    if (dir == 'rtl') {
        $('html').addClass('rtl');
    }

    // Set click handlers
    $('#hrefFinish, #btnFinish').one('click', onFinish);
    $('#imgTrust').one('click', onclickTrustE);
    $('#hrefAbort').one('click', onClickUninstall);

    try {
        Log("ToolbarFirstTimeDialog");

        //send for translations
        var dataForDlg = { "method": "getDialogData",
            "value": {
                "_CTLP_STR_ID_PERSONAL_COMP_DLG_SETTINGS_TEXT_DUAL_PACKAGE": "CTLP_STR_ID_PERSONAL_COMP_DLG_SETTINGS_TEXT_DUAL_PACKAGE",
                "_CTLP_STR_ID_PERSONAL_COMP_DLG_WELCOME_ONLY_TITLE_FF": "CTLP_STR_ID_PERSONAL_COMP_DLG_WELCOME_ONLY_TITLE_FF",
                "_CTLP_STR_ID_PERSONAL_COMP_DLG_SETTINGS_TITLE_DUALPACKAGE_FF": "CTLP_STR_ID_PERSONAL_COMP_DLG_SETTINGS_TITLE_DUALPACKAGE_FF",
                "_CTLP_STR_ID_PERSONAL_COMP_DLG_INTRO_SINGLE": "CTLP_STR_ID_PERSONAL_COMP_DLG_INTRO_SINGLE",
                "_CTLP_STR_ID_PERSONAL_COMP_DLG_INTRO": "CTLP_STR_ID_PERSONAL_COMP_DLG_INTRO",
                "_CTLP_STR_ID_PERSONAL_COMP_DLG_ABORT_INSTALLATION_FF": "CTLP_STR_ID_PERSONAL_COMP_DLG_ABORT_INSTALLATION_FF",
                "_CTLP_STR_ID_PERSONAL_COMP_DLG_FINISH_FF": "CTLP_STR_ID_PERSONAL_COMP_DLG_FINISH_FF",
                "_CTLP_STR_ID_PERSONAL_COMP_DLG_EMAIL": "CTLP_STR_ID_PERSONAL_COMP_DLG_EMAIL",
                "_CTLP_STR_ID_PERSONAL_COMP_DLG_WEATHER": "CTLP_STR_ID_PERSONAL_COMP_DLG_WEATHER",
                "_CTLP_STR_ID_PERSONAL_COMP_DLG_RADIO": "CTLP_STR_ID_PERSONAL_COMP_DLG_RADIO",
                "_CTLP_STR_ID_PERSONAL_COMP_DLG_FACEBOOK": "CTLP_STR_ID_PERSONAL_COMP_DLG_FACEBOOK",
                "_CTLP_STR_ID_PERSONAL_COMP_DLG_SET_SEARCH_BING_FF": "CTLP_STR_ID_PERSONAL_COMP_DLG_SET_SEARCH_BING_FF",
                "_CTLP_STR_ID_PERSONAL_COMP_DLG_SET_SEARCH_FF2": "CTLP_STR_ID_PERSONAL_COMP_DLG_SET_SEARCH_FF2",
                "_CTLP_STR_ID_PERSONAL_COMP_DLG_SET_SEARCH_HOMEPAGE_FF2": "CTLP_STR_ID_PERSONAL_COMP_DLG_SET_SEARCH_HOMEPAGE_FF2",
                "_CTLP_STR_ID_PERSONAL_COMP_DLG_SET_SEARCH_HOMEPAGE_YAHOO_FF2": "CTLP_STR_ID_PERSONAL_COMP_DLG_SET_SEARCH_HOMEPAGE_YAHOO_FF2",
                "_CTLP_STR_ID_PERSONAL_COMP_DLG_SET_HOMEPAGE_BING_FF": "CTLP_STR_ID_PERSONAL_COMP_DLG_SET_HOMEPAGE_BING_FF",
                "_CTLP_STR_ID_PERSONAL_COMP_DLG_SET_HOMEPAGE_FF2": "CTLP_STR_ID_PERSONAL_COMP_DLG_SET_HOMEPAGE_FF2",
                "_CTLP_STR_ID_PERSONAL_COMP_DLG_ENABLE_NOTIFICATION_FF2": "CTLP_STR_ID_PERSONAL_COMP_DLG_ENABLE_NOTIFICATION_FF2",
                "_CTLP_STR_ID_SHOW_AN_ALTERNATE_SEARCH_PAGE_WHEN_WEB_PAGES_ARE_NOT_FOUND": "CTLP_STR_ID_SHOW_AN_ALTERNATE_SEARCH_PAGE_WHEN_WEB_PAGES_ARE_NOT_FOUND",
                "_CTLP_STR_ID_DLG_IPHONE_UPDATES_LINK_TEXT": "CTLP_STR_ID_DLG_IPHONE_UPDATES_LINK_TEXT",
                "_CTLP_STR_ID_PERSONAL_COMP_DLG_BOTTOM_DESCRIPTION_FULL3": "CTLP_STR_ID_PERSONAL_COMP_DLG_BOTTOM_DESCRIPTION_FULL3",
                "_CTLP_STR_ID_PERSONAL_COMP_DLG_BOTTOM_DESCRIPTION_FULL4": "CTLP_STR_ID_PERSONAL_COMP_DLG_BOTTOM_DESCRIPTION_FULL4",
                "_CTLP_STR_ID_GLOBAL_EULA": "CTLP_STR_ID_GLOBAL_EULA",
                "_CTLP_STR_ID_GLOBAL_PRIVACY_POLICY": "CTLP_STR_ID_GLOBAL_PRIVACY_POLICY",
                "_CELP_STR_ID_UNTRUSTED_APP_ADDED_CONTENT_POLICY": "CELP_STR_ID_UNTRUSTED_APP_ADDED_CONTENT_POLICY",
                "_CTLP_STR_ID_PERSONAL_COMP_DLG_SET_HOMEPAGE_ BING _FF": "CTLP_STR_ID_PERSONAL_COMP_DLG_SET_HOMEPAGE_ BING _FF",
                "_EB_TOOLBAR_NAME": "EB_TOOLBAR_NAME",
                "_CTLP_STR_ID_PERSONAL_COMP_CONFIRM_UNINSTALL_BODY_FF": "CTLP_STR_ID_PERSONAL_COMP_CONFIRM_UNINSTALL_BODY_FF",
                "_EB_DOWNLOAD_PAGE": "EB_DOWNLOAD_PAGE",
                "_CTLP_STR_ID_PERSONAL_COMP_DLG_WELCOME_ONLY_TITLE_FF2": "CTLP_STR_ID_PERSONAL_COMP_DLG_WELCOME_ONLY_TITLE_FF2",
                "_CTLP_STR_ID_PERSONAL_COMP_DLG_WELCOME_TITLE_FF2": "CTLP_STR_ID_PERSONAL_COMP_DLG_WELCOME_TITLE_FF2",
                "_CTLP_STR_ID_PERSONAL_COMP_DLG_WELCOME_ONLY_TITLE1_FF2": "CTLP_STR_ID_PERSONAL_COMP_DLG_WELCOME_ONLY_TITLE1_FF2",
                "_CTLP_STR_ID_PERSONAL_COMP_DLG_WELCOME_ONLY_TITLE1_CHROME": "CTLP_STR_ID_PERSONAL_COMP_DLG_WELCOME_ONLY_TITLE1_CHROME",
                "_CTLP_STR_ID_PERSONAL_COMP_DLG_WELCOME_ONLY_TITLE_IE": "CTLP_STR_ID_PERSONAL_COMP_DLG_WELCOME_ONLY_TITLE_IE",
                "_CTLP_STR_ID_PERSONAL_COMP_DLG_WELCOME_ONLY_TITLE_CHROME": "CTLP_STR_ID_PERSONAL_COMP_DLG_WELCOME_ONLY_TITLE_CHROME",
                "_CTLP_STR_ID_PERSONAL_COMP_DLG_ENABLE_ REVERT_SETTINGS": "CTLP_STR_ID_PERSONAL_COMP_DLG_ENABLE_ REVERT_SETTINGS",
                "_CTLP_STR_ID_GLOBAL_LEARN_MORE1": "CTLP_STR_ID_GLOBAL_LEARN_MORE1",
                "_CTLP_STR_ID_PERSONAL_COMP_DLG_SETTINGS_TITLE_FF2": "CTLP_STR_ID_PERSONAL_COMP_DLG_SETTINGS_TITLE_FF2",
                "_CTLP_STR_ID_PERSONAL_COMP_DLG_TERM_POLICY": "CTLP_STR_ID_PERSONAL_COMP_DLG_TERM_POLICY",
                "_CTLP_STR_ID_PERSONAL_COMP_DLG_TERM_ AGREEMENT_POLICY": "CTLP_STR_ID_PERSONAL_COMP_DLG_TERM_ AGREEMENT_POLICY"

            }
        };
        dataForDlg = JSON.stringify(dataForDlg);
        var generalAppsMessage = JSON.stringify({ method: "getGeneralData", service: 'toolbarSettings' });
        conduit.abstractionlayer.commons.messages.sendSysReq('serviceLayer', 'sender', generalAppsMessage, function (response) {
            try {
                toolbarData.name = JSON.parse(response).toolbarName;
                conduit.abstractionlayer.commons.messages.sendSysReq("applicationLayer.dialog", "sender", dataForDlg, function (data) {
                    try {
                       
                        function continueFlow() {

                            //locale for facebook
                            localKey = response.locale ? response.locale : "en_US";

                            /******************old code*************************/
                            //if ((_DGAPIHelper.isFF() && (_DGAPIHelper.isFF3() || _DGAPIHelper.isFF4())) || (_DGAPIHelper.isIE() && _DGAPIHelper.isIE9()))
                            //   hidePointer();
                            //else
                            paintPointer();

                            if (isLocaleRtl && isLocaleRtl())
                                inverseTextPosition();
                            if (isToolbarRtl && isToolbarRtl() && !isReversedPointer)
                                inversePointerPosition();

                            /*var JsonPersonalComponents = getData();
                            if (!JsonPersonalComponents)
                            return;
                            else
                            arrPersonalComps = EBJSON.parse(JsonPersonalComponents);
                            */
                            if (_DGAPIHelper.isMac())
                                isMac = true;
                            else if (_DGAPIHelper.isLinux())
                                isLinux = true;

                            if (isLinux) {
                                hidePointer();
                                document.getElementById("divRounded").style.top = "-2px";
                                document.getElementById("divRounded").style.left = "-1px";
                            }

                            if (isIE) {
                                document.getElementById("img1").style.marginTop = "10px";
                                document.getElementById("hrefAbort").style.display = "none";
                                //document.getElementById("divRounded").style.top = "-2px";
                                //fix ui problems
                                document.getElementById("checkboxEmail").style.marginRight = "3px";
                                document.getElementById("checkboxWeather").style.marginRight = "3px";
                                document.getElementById("checkboxRadio").style.marginRight = "3px";
                                document.getElementById("checkboxFacebook").style.marginRight = "3px";
                                //divs
                                //shadow
                                document.getElementById("divRounded").style.WebkitBoxShadow = "#666 0px 0px 0px";
                                document.getElementById("divRounded").style.MozBoxShadow = "#666 0px 0px 0px";
                                document.getElementById("divRounded").style.MsBoxShadow = "#666 0px 0px 0px";
                                document.getElementById("divRounded").style.boxShadow = "#666 0px 0px 0px";

                                document.getElementById("divBottom").style.WebkitBoxShadow = "#666 0px 2px 0px";
                                document.getElementById("divBottom").style.MozBoxShadow = "#666 0px 2px 0px";
                                document.getElementById("divBottom").style.MsBoxShadow = "#666 0px 2px 0px";
                                document.getElementById("divBottom").style.boxShadow = "#666 0px 2px 0px";
                                document.getElementById("divFooter").innerHTML = "";
                                document.getElementById("imgTrust").style.top = "-15px";
                            }

                            if (isChrome || window.conduit_api_proxy || (isFF && !setupAPIData)) {
                                document.getElementById("hrefAbort").style.display = "none";
                                //document.getElementById("divFooterWrap").style.display = "none";
                            }



                            conduit.abstractionlayer.commons.messages.sendSysReq("serviceLayer.settings.getSettingsData", "sender", "", function (setting) {
                                try {
                                    var isAppInSetting = {
                                        "weather":
										{ exists: false, visible: true },
                                        "radioPlayer":
										{ exists: false, visible: true },
                                        "emailNotifier":
										{ exists: false, visible: true },
                                        "facebookComp":
										{ exists: false, visible: true }
                                    };
                                    var parsedObj = JSON.parse(setting);
                                    // hide trustE seal if needed
                                    if (!(parsedObj.generalData.displayTrusteSeal)) {
                                        $('#imgTrust').hide();
                                    }

                                    for (var i = 0; i < parsedObj.apps.length; i++) {
                                        var app = parsedObj.apps[i];
                                        if (app.appType == "WEATHER") isAppInSetting.weather.exists = true;
                                        if (app.appType == "RADIO_PLAYER") isAppInSetting.radioPlayer.exists = true;
                                        if (app.appType == "EMAIL_NOTIFIER") isAppInSetting.emailNotifier.exists = true;
                                        if (app.data && app.data.personalComponentInfo &&
										app.data.personalComponentInfo.type == "FACEBOOK_COMP") isAppInSetting.facebookComp.exists = true;
                                    }

                                    // check if app is in persoanlApps section
                                    for (var i = 0; i < parsedObj.personalApps.length; i++) {
                                        var app = parsedObj.personalApps[i];
                                        if (app.appType == "WEATHER") isAppInSetting.weather.existsInPersonalApps = true;
                                        if (app.appType == "RADIO_PLAYER") isAppInSetting.radioPlayer.existsInPersonalApps = true;
                                        if (app.appType == "EMAIL_NOTIFIER") isAppInSetting.emailNotifier.existsInPersonalApps = true;
                                        if (app.data && app.data.personalComponentInfo &&
										app.data.personalComponentInfo.type == "FACEBOOK_COMP") isAppInSetting.facebookComp.existsInPersonalApps = true;
                                    }

                                    var userComponentsState = parsedObj.generalData.userComponentsState;
                                    var userVisibilityFlags = parsedObj.generalData.userComponentsVisibilityFlags;
                                    var app;
                                    for (var i in userComponentsState) {
                                        var element = getElementForPrefName(i);
                                        app = isAppInSetting[i];
                                        if (element) {
                                            if ((!app || !app.exists) && userComponentsState[i]) {
                                                element.style.display = "";
                                            }
                                            else {
                                                element.style.display = "none";
                                                if (app) {
                                                    app.visible = false;
                                                }
                                            }

                                            var children = element.childNodes;
                                            for (var j = 0; j < children.length; j++) {
                                                if (children[j].tagName && children[j].tagName.toLowerCase() == 'input' && children[j].type && children[j].type.toLowerCase() == 'checkbox') {
                                                    children[j].checked = true;
                                                }
                                            }
                                        }
                                    }
                                    if (userVisibilityFlags) {
                                        for (var i in userVisibilityFlags) {
                                            var element = getElementForPrefName(i);
                                            app = isAppInSetting[i];
                                            if (element) {
                                                if ((!app || !app.exists) && userVisibilityFlags[i].available) {
                                                    element.style.display = "";
                                                }
                                                else {
                                                    element.style.display = "none";
                                                    if (app) {
                                                        app.visible = false;
                                                    }
                                                }

                                                var children = element.childNodes;
                                                for (var j = 0; j < children.length; j++) {
                                                    if (children[j].tagName && children[j].tagName.toLowerCase() == 'input' && children[j].type && children[j].type.toLowerCase() == 'checkbox') {
                                                        children[j].checked = userVisibilityFlags[i].checked;
                                                    }
                                                }
                                            }
                                        }
                                    }

                                    for (var i in isAppInSetting) {
                                        var element = getElementForPrefName(i);
                                        app = isAppInSetting[i];
                                        if (!app.existsInPersonalApps) {
                                            element.style.display = "none";
                                            app.visible = false;
                                        }

                                    }

                                    handlePageNotFound(parsedObj.generalData.actingCt);

                                    $(document).ready(function () {
                                        if ($(".divParagraph:visible").length == 0) {
                                            $('#divParagraph2Title').hide();
                                        }
                                    });
                                    if (!isFF || !setupAPIData) {
                                        $('.checksBoxsList').hide();
                                        $('.checkboxConfig').attr('checked', '');
                                        $('.spanConfig').hide();
                                        var removeDashes = true;
                                        var app;

                                        for (var i in isAppInSetting) {
                                            app = isAppInSetting[i];
                                            if (!app.exists && app.visible) {
                                                removeDashes = false;
                                                break;
                                            }
                                        }

                                        if (removeDashes) {
                                            $('.dashed').hide();
                                        }
                                    } else {
                                        checkDefaultChecked(parsedObj.generalData.actingCt, setupAPIData);
                                    }



                                    fillToolbarData();
                                } catch (e) {
                                    onDefaultFinish(e);
                                }

                                //send resize request
                                var data = { "method": "resizeDialog", "url": dialogId, "value": { "width": parseInt(getWidth()) + 30, "height": parseInt(getHeight()) + 30} };
                                data = JSON.stringify(data);
                                conduit.abstractionlayer.commons.messages.sendSysReq("applicationLayer.dialog", "sender", data, function (data) { });

                                //initFB(parsedObj.generalData.myWebServerUrl);

                            });
                        }
                        //getting the translated information.
                        data = JSON.parse(data);
                        setupAPIData = data.setupAPIData;
                        _translationPackage = data.translationPackage;
                        response = JSON.parse(response);
                        toolbarData.name = response.toolbarName;

                        if (setupAPIData) {
                            um = setupAPIData.um;
                            continueFlow();
                        }
                        else {
                            conduit.abstractionlayer.commons.storage.getTripleKey(data.ctid + ".searchUserMode", function (response) {
                                var trippleKeySearchUserMode = response.result;
                                um = trippleKeySearchUserMode.registry || trippleKeySearchUserMode.file || trippleKeySearchUserMode.local || "";
                                continueFlow();
                            });

                        }

                    } catch (e) {
                        onDefaultFinish(e);
                    }
                });




            } catch (e) {
                onDefaultFinish(e);
            }
        });
    } catch (e) { onDefaultFinish(e); }
});

function handlePageNotFound(ctid) {
    /*
    var response = absRepository.getKey(ctid + '.enableFix404');
    var enableFix404 = response.result;
    if (!response.status && (enableFix404 === "FALSE" || enableFix404 === "false")) {
    document.getElementById('divChecks3').style.display = 'none';
    }

    response = absRepository.getKey(ctid + '.fixPageNotFoundError')
    var fixPageNotFoundError = response.result;
    if (!response.status && (enableFix404 === "FALSE" || enableFix404 === "false")) {
    // we will not set the 404 feature check box as checked!
    }
    else {
    document.getElementById('checkboxConfig4').checked = 'checked';
    }
    */

    // we will not display the 404 option in the first time dialog anymore
    document.getElementById('divChecks3').style.display = 'none';
}

function checkDefaultChecked(ctid, setupAPIData) {
    var defaultSearch = absRepository.getKey(ctid + '.defaultSearch');
    if (setupAPIData && setupAPIData.defaultSearch) {
        defaultSearch = setupAPIData.defaultSearch;
    } else {
        defaultSearch = defaultSearch.status ? true : defaultSearch.result;
    }

    var homePage = absRepository.getKey(ctid + '.startPage').result;
    if (setupAPIData && setupAPIData.homePage) {
        homePage = setupAPIData.homePage;
    }

    if (um == 1) {
        if (defaultSearch !== "FALSE" && defaultSearch !== "false") {
            document.getElementById('checkboxConfig1').checked = 'checked';
        }

        if (homePage === "TRUE" || homePage === "true") {
            document.getElementById('checkboxConfig2').checked = 'checked';
        }
    }
    else { //um != 1
        if ((homePage === "TRUE" || homePage === "true") && (defaultSearch !== "FALSE" && defaultSearch !== "false")) {
            document.getElementById('checkboxConfig1').checked = 'checked';
        }
    }

    // revert settings
    var revertSettingsKey = absRepository.getKey(ctid + '.revertSettings').result;
    if (setupAPIData && setupAPIData.revertSettings) {
        revertSettingsKey = setupAPIData.revertSettings;
    }

    if (revertSettingsKey.toUpperCase() === "TRUE") {
        document.getElementById('checkboxConfig5').checked = 'checked';
    }
    else {
        document.getElementById('checkboxConfig5').checked = '';
    } 
     
    var enableAlerts = absRepository.getKey(ctid + '.enableAlerts');
    if (enableAlerts.result !== "FALSE" && enableAlerts.result !== "false" || enableAlerts.status) {
        document.getElementById('checkboxConfig3').checked = 'checked';
    }
    
}
function getElementForPrefName(name) {
    switch (name) {
        case "facebookComp": return document.getElementById('ParagraphFacebook');
        case "weather": return document.getElementById('ParagraphWeather');
        case "emailNotifier": return document.getElementById('ParagraphEmail');
        case "radioPlayer": return document.getElementById('ParagraphRadio');
        default: return null;
    }
}

function getPrefNameForAppName(name) {
    switch (name) {
        case "RADIO_PLAYER": "radioPlayer";
        case "WEATHER": return "weather";

        default: return null;
    }
}

function inverseTextPosition() {
    document.getElementById("divAllContent").style.direction = "rtl";
    document.getElementById("img1").style.direction = "rtl";

    document.getElementById("ButtonOK").style.marginLeft = "0";
    document.getElementById("ButtonOK").style.left = "38px";

    document.getElementById("boxTextContainer").style.margin = "0 0 0 0";
    document.getElementById("boxTextContainer").style.marginRight = "76px";

    document.getElementById("img1").style.marginRight = "0px";

    document.getElementById("img1").style.left = "511px";

    document.getElementById("btnFinish").style.left = "24px";

    document.getElementById("imgTrust").style.left = "auto";
    document.getElementById("imgTrust").style.right = "400px";

    document.getElementById("hrefAbort").style.left = "auto";
    document.getElementById("hrefAbort").style.right = "25px";

    document.getElementById("btnFinish").style.marginLeft = "0px";
    document.getElementById("btnFinish").style.marginRight = "453px";
    document.getElementById("btnFinish").style.left = "52px";
    document.getElementById("btnFinish").style.right = "auto";

    document.getElementById("ParagraphEmail").className = "divParagraphRTL";
    document.getElementById("ParagraphWeather").className = "divParagraphRTL";
    document.getElementById("ParagraphRadio").className = "divParagraphRTL";
    document.getElementById("ParagraphFacebook").className = "divParagraphRTL";

    document.getElementById("checkboxConfig1").className = "checkboxConfigRight";
    document.getElementById("checkboxConfig2").className = "checkboxConfigRight";
    document.getElementById("checkboxConfig3").className = "checkboxConfigRight";
    document.getElementById("checkboxConfig4").className = "checkboxConfigRight";
};

function inversePointerPosition() {
    ltr = !ltr;
    isReversedPointer = true;
    paintPointer();
};

function paintPointer() {

    conduit.abstractionlayer.commons.messages.sendSysReq("getToolbarDirection", "gadgetFrame", "(@:", function (response) {
        dir = JSON.parse(response).alignMode.toLowerCase();
        drawChupchiq(dir);
    });
};

function drawChupchiq(dir) {
    try {
        var dir = dir;

        if (_DGAPIHelper.isLinux()) {
            if (!canvas)
                canvas = document.getElementById('deck_tip');
            canvas.style.display = "none";
            return;
        }

        if (!canvas)
            canvas = document.getElementById('deck_tip');
        var tip = canvas.getContext("2d");
        tip.strokeStyle = "#767676";
        tip.fillStyle = "#ffffff";
        tip.beginPath();

        //clear old pointer
        tip.clearRect(0, 0, 630, 40);

        if (dir == 'rtl') {
            tip.moveTo(485, 40); //470
            tip.lineTo(565, 0); //550
            tip.lineTo(525, 40); //510
        }
        else {
            tip.moveTo(70, 40);
            tip.lineTo(0, 0);
            tip.lineTo(30, 40);
        }
        tip.fill();
        tip.stroke();
    } catch (e) {
        // Fix for FF7 bug with canvas in the dialog popup (not a general issue in FF7 with canvas!).
        setTimeout(function () {
            var tipImg = document.getElementById("tipImg");
            if (dir === "rtl") {
                tipImg.style.right = "10px";
                tipImg.src = "images/dialog_tip_right.png";
            }
            else
                tipImg.style.left = "0";

            tipImg.style.display = "inline";
        }, 100);
    }
}

function smartSplit(source, oSplitTerm) {
    var oDest = '';
    var oSplit = source.split(oSplitTerm);
    if (oSplit && oSplit.length >= 2) {
        oDest = oSplit[1];
        oSplit = oDest.split('&');
        if (oSplit && oSplit.length >= 2)
            oDest = oSplit[0];
    }

    return decodeURIComponent(oDest);
};

function fillToolbarData() {
    var divParagraph1Title = document.getElementById("divParagraph1Title");
    var keyNameSuffix = isFF ? "FF2" : isIE ? "IE" : isChrome ? "CHROME" : "FF"

    if (um != 1) {//set different title for non mgr toolbars
        divParagraph1Title.innerHTML = getValueByKey("CTLP_STR_ID_PERSONAL_COMP_DLG_WELCOME_TITLE_FF2");
        var divParagraph1Text = document.getElementById("divParagraph1Text");      
        divParagraph1Text.innerHTML = getValueByKey("CTLP_STR_ID_PERSONAL_COMP_DLG_WELCOME_ONLY_TITLE1_" + keyNameSuffix);      
    }
    else {       
        divParagraph1Title.innerHTML = getValueByKey("CTLP_STR_ID_PERSONAL_COMP_DLG_WELCOME_ONLY_TITLE_" + keyNameSuffix);
        document.getElementById("divParagraph1Text").style.display = "none";
    }    

    if (arrPersonalComps) {
        var title = null;

        var value;
        var divParagraph1Title = document.getElementById("divParagraph1Title");
        if (arrPersonalComps.extraOptions && arrPersonalComps.extraOptions.dialogMode == "welcomeonly") {
            document.getElementById("welcomOnlyContainer").style.display = "none";
            divParagraph1Title.innerHTML = getValueByKey("CTLP_STR_ID_PERSONAL_COMP_DLG_WELCOME_ONLY_TITLE_" + keyNameSuffix);

        }
        else {
            divParagraph1Title.innerHTML = getValueByKey("CTLP_STR_ID_PERSONAL_COMP_DLG_SETTINGS_TITLE_DUALPACKAGE_FF");
            if (arrPersonalComps.email) {
                if (!arrPersonalComps.email.visible)
                    document.getElementById("ParagraphEmail").style.display = "none";
                else if (arrPersonalComps.email.checked)
                    document.getElementById("checkboxEmail").checked = "yes";
            }
            if (arrPersonalComps.weather) {
                if (!arrPersonalComps.weather.visible)
                    document.getElementById("ParagraphWeather").style.display = "none";
                else if (arrPersonalComps.weather.checked)
                    document.getElementById("checkboxWeather").checked = "yes";
            }
            if (arrPersonalComps.radio) {
                if (!arrPersonalComps.radio.visible)
                    document.getElementById("ParagraphRadio").style.display = "none";
                else if (arrPersonalComps.radio.checked)
                    document.getElementById("checkboxRadio").checked = "yes";
            }
            if (arrPersonalComps.facebook) {
                if (!arrPersonalComps.facebook.visible)
                    document.getElementById("ParagraphFacebook").style.display = "none";
                else if (arrPersonalComps.facebook.checked)
                    document.getElementById("checkboxFacebook").checked = "yes";
            }
            if (arrPersonalComps.trustE) {
                if (!arrPersonalComps.trustE.visible) {
                    document.getElementById("imgTrust").style.display = "none";
                    document.getElementById("divFooter").className = "divMore2";
                    counterHiddingFooter++;
                }
            }

            var divParagraph2Title = document.getElementById("divParagraph2Title");

            if ($(".divParagraph:visible, #divFacebookLike:visible").length == 0) {
                divParagraph2Title.style.display = "none";

                //document.getElementById("imgParagraph1").style.display = "none";
            }
            else if ($(".divParagraph:visible, #divFacebookLike:visible").length == 1) {

                divParagraph2Title.innerHTML = getValueByKey("CTLP_STR_ID_PERSONAL_COMP_DLG_INTRO_SINGLE");
            }
            else {

                divParagraph2Title.innerHTML = getValueByKey("CTLP_STR_ID_PERSONAL_COMP_DLG_INTRO");
            }
            if ((!arrPersonalComps.trustE || !arrPersonalComps.trustE.visible) && document.getElementById("imgTrust").style.display != "none") {
                document.getElementById("imgTrust").style.display = "none";
                counterHiddingFooter++;
            }

            if (arrPersonalComps.extraOptions) {
                if (arrPersonalComps.extraOptions.IsAMO) {
                    if (arrPersonalComps.extraOptions.FFSearchIsDefault) {
                        document.getElementById("spanConfig1").style.display = "";
                    }
                    if (arrPersonalComps.extraOptions.HomepageIsSet) {
                        document.getElementById("spanConfig2").style.display = "";
                    }                    
                    if (arrPersonalComps.extraOptions.AlertEnabled) {
                        document.getElementById("spanConfig3").style.display = "";
                    }
                    if (arrPersonalComps.extraOptions.FixPageNotFoundErrorsChecked) {
                        document.getElementById("spanConfig4").style.display = "";
                    }
                }
                else {
                    if (arrPersonalComps.extraOptions.FFSearchIsDefault) {
                        if (um == 1) { //for mgr toolbars keep 2 check boxes for default search and home page and the notification check box
                            if (!arrPersonalComps.extraOptions.FFSearchIsDefault.visible)
                                document.getElementById("divChecks0").style.display = "none";
                            else if (arrPersonalComps.extraOptions.FFSearchIsDefault.checked) {
                                document.getElementById("checkboxConfig1").checked = "yes";
                            }
                            if (arrPersonalComps.extraOptions.HomepageIsSet) { 
                                if (!arrPersonalComps.extraOptions.HomepageIsSet.visible)
                                    document.getElementById("divChecks1").style.display = "none";
                                else if (arrPersonalComps.extraOptions.HomepageIsSet.checked)
                                    document.getElementById("checkboxConfig2").checked = "yes";
                            }
                            if (arrPersonalComps.extraOptions.AlertEnabled) {
                                if (!arrPersonalComps.extraOptions.AlertEnabled.visible)
                                    document.getElementById("divChecks2").style.display = "none";
                                else if (arrPersonalComps.extraOptions.AlertEnabled.checked)
                                    document.getElementById("checkboxConfig3").checked = "yes";
                            }
                        }
                        else { //otherwise, we have only one - divChecks0
                            document.getElementById("divChecks1").style.display = "none"; //hide element divChecks1
                            document.getElementById("divChecks2").style.display = "none"; //hide element divChecks2
                            if (!arrPersonalComps.extraOptions.FFSearchIsDefault.visible && !arrPersonalComps.extraOptions.HomepageIsSet.visible) {//only if both assest not visible hide the check box
                                document.getElementById("divChecks0").style.display = "none";
                            }
                            else if (arrPersonalComps.extraOptions.FFSearchIsDefault.checked && arrPersonalComps.extraOptions.HomepageIsSet.checked) {
                                document.getElementById("checkboxConfig1").checked = "yes";
                            }
                        }
                       
                        if (arrPersonalComps.extraOptions.FixPageNotFoundErrorsChecked) {
                            if (!arrPersonalComps.extraOptions.FixPageNotFoundErrorsChecked.visible)
                                document.getElementById("divChecks3").style.display = "none";
                            else if (arrPersonalComps.extraOptions.FixPageNotFoundErrorsChecked.checked)
                                document.getElementById("checkboxConfig4").checked = "yes";
                        }
                    }
                }
                if (arrPersonalComps.FixPageNotFoundErrorsEnabled) {
                    document.getElementById("divChecks3").style.display = "none";
                }               
            }
            else {
                document.getElementById("allPersonals").style.display = "none";
                document.getElementById("img3").style.display = "none";

            }
            if (arrPersonalComps.iPhoneLink) {
                if (!arrPersonalComps.iPhoneLink.visible) {
                    document.getElementById("imgIphone").style.display = "none";
                    document.getElementById("spanIphone").style.display = "none";
                    document.getElementById("divIphone").style.display = "none";
                    counterHiddingFooter++;
                }
            }
        }  //  if (arrPersonalComps)

        if (!arrPersonalComps) {
            $("#apps_dashed").remove();
        }
    }


    //Abort Installation
    var hrefAbort = getValueByKey("CTLP_STR_ID_PERSONAL_COMP_DLG_ABORT_INSTALLATION_FF");
    if (hrefAbort)
        document.getElementById("hrefAbort").innerHTML = hrefAbort;

    var finishTxt = getValueByKey("CTLP_STR_ID_PERSONAL_COMP_DLG_FINISH_FF");

    document.getElementById("btnFinish").innerHTML = finishTxt;
    document.getElementById("hrefFinish").innerHTML = finishTxt;
    // document.getElementById("ButtonOK").innerHTML = finishTxt;
    var divParagraph2TitleKey = ($(".divParagraph:visible, #divFacebookLike:visible").length > 1) ? "CTLP_STR_ID_PERSONAL_COMP_DLG_INTRO" : "CTLP_STR_ID_PERSONAL_COMP_DLG_INTRO_SINGLE";
    if (um == 1) { //keep this title for mgr toolbars only
        document.getElementById("divParagraph3Title").innerHTML = getValueByKey("CTLP_STR_ID_PERSONAL_COMP_DLG_SETTINGS_TITLE_FF2"); 
    }
    else { //hide the #divParagraph3Title
        document.getElementById("divParagraph3Title").style.display = "none";
    }
    document.getElementById("divParagraph2Title").innerHTML = getValueByKey(divParagraph2TitleKey);
    document.getElementById("spanEmail").innerHTML = getValueByKey("CTLP_STR_ID_PERSONAL_COMP_DLG_EMAIL");
    document.getElementById("spanWeather").innerHTML = getValueByKey("CTLP_STR_ID_PERSONAL_COMP_DLG_WEATHER");
    document.getElementById("spanRadio").innerHTML = getValueByKey("CTLP_STR_ID_PERSONAL_COMP_DLG_RADIO");
    //  document.getElementById("spanFacebook").innerHTML = getValueByKey("CTLP_STR_ID_PERSONAL_COMP_DLG_FACEBOOK");

    if (arrPersonalComps) {
        if (arrPersonalComps.extraOptions) {            
            if (um == 1) {   //for mgr toolbars keep 2 check boxes             
                document.getElementById("spanConfig1").innerHTML = !isIE && arrPersonalComps.extraOptions.searchProvider &&
				arrPersonalComps.extraOptions.searchProvider.toLowerCase() == "bing" ?
				getValueByKey("CTLP_STR_ID_PERSONAL_COMP_DLG_SET_SEARCH_BING_FF") :
				getValueByKey("CTLP_STR_ID_PERSONAL_COMP_DLG_SET_SEARCH_FF2");

                document.getElementById("spanConfig2").innerHTML = !isIE && arrPersonalComps.extraOptions.searchProvider &&
				arrPersonalComps.extraOptions.searchProvider.toLowerCase() == "bing" ?
				getValueByKey("CTLP_STR_ID_PERSONAL_COMP_DLG_SET_HOMEPAGE_BING_FF") :
				getValueByKey("CTLP_STR_ID_PERSONAL_COMP_DLG_SET_HOMEPAGE_FF2");
            }
            else { //otherwise, we have only one
                if (um == 3) {
                    document.getElementById("spanConfig1").innerHTML = getValueByKey("CTLP_STR_ID_PERSONAL_COMP_DLG_SET_SEARCH_HOMEPAGE_YAHOO_FF2");                    
                }
                else {
                    document.getElementById("spanConfig1").innerHTML = getValueByKey("CTLP_STR_ID_PERSONAL_COMP_DLG_SET_SEARCH_HOMEPAGE_FF2");
                }
            }
            document.getElementById("spanConfig3").innerHTML = getValueByKey("CTLP_STR_ID_PERSONAL_COMP_DLG_ENABLE_NOTIFICATION_FF2");

            document.getElementById("spanConfig4").innerHTML = getValueByKey("CTLP_STR_ID_SHOW_AN_ALTERNATE_SEARCH_PAGE_WHEN_WEB_PAGES_ARE_NOT_FOUND");

            document.getElementById("spanConfig5").innerHTML = getValueByKey("CTLP_STR_ID_PERSONAL_COMP_DLG_ENABLE_ REVERT_SETTINGS");
        }
    } else {    
        if (um == 1) {
            document.getElementById("spanConfig1").innerHTML = getValueByKey("CTLP_STR_ID_PERSONAL_COMP_DLG_SET_SEARCH_FF2");
            document.getElementById("spanConfig2").innerHTML = getValueByKey("CTLP_STR_ID_PERSONAL_COMP_DLG_SET_HOMEPAGE_FF2");
            document.getElementById("spanConfig3").innerHTML = getValueByKey("CTLP_STR_ID_PERSONAL_COMP_DLG_ENABLE_NOTIFICATION_FF2");
        }
        else {
            if (um == 3) {
                document.getElementById("spanConfig1").innerHTML = getValueByKey("CTLP_STR_ID_PERSONAL_COMP_DLG_SET_SEARCH_HOMEPAGE_YAHOO_FF2");
            }
            else {
                document.getElementById("spanConfig1").innerHTML = getValueByKey("CTLP_STR_ID_PERSONAL_COMP_DLG_SET_SEARCH_HOMEPAGE_FF2");
            }
            document.getElementById("divChecks1").style.display = "none";
            document.getElementById("divChecks2").style.display = "none";
        }        
        document.getElementById("spanConfig4").innerHTML = getValueByKey("CTLP_STR_ID_SHOW_AN_ALTERNATE_SEARCH_PAGE_WHEN_WEB_PAGES_ARE_NOT_FOUND");
        document.getElementById("spanConfig5").innerHTML = getValueByKey("CTLP_STR_ID_PERSONAL_COMP_DLG_ENABLE_ REVERT_SETTINGS");

    }

    var strIphoneText = getValueByKey("CTLP_STR_ID_DLG_IPHONE_UPDATES_LINK_TEXT");
    /*if (arrPersonalComps) {
    document.getElementById("spanIphone").innerHTML = arrPersonalComps.iPhoneLink.link ? createLinkHtml(strIphoneText, "onclickIphone") : strIphoneText;
    } else {
    document.getElementById("spanIphone").innerHTML = strIphoneText;
    }*/

    var footerText;
    if (um == 1) {
        footerText = getValueByKey("CTLP_STR_ID_PERSONAL_COMP_DLG_BOTTOM_DESCRIPTION_FULL3");
    }
    else {
        footerText = getValueByKey("CTLP_STR_ID_PERSONAL_COMP_DLG_BOTTOM_DESCRIPTION_FULL4");
    }    

    if (footerText === "" || !footerText) {
        $("#copyrights_dashed").remove();
    }

    if (!isIE)
        document.getElementById("divFooter").innerHTML = footerText;

    if (isIE && counterHiddingFooter == 2) {
        document.getElementById("divFooterWrap").style.display = "none";
        document.getElementById("imgParagraph2").style.display = "none";
    }

    //display the toolbar once it's fully ready
    document.body.style.opacity = "1";
    //document.body.style.filter = "alpha(opacity=100)";
};

function onFinish() {
    try {
        var ansArrPersonalComps = {
            email: { visible: false, checked: false },
            weather: { visible: false, checked: false },
            radio: { visible: false, checked: false },
            facebook: { visible: false, checked: false },
            extraOptions: {
                HomepageIsSet: { visible: false, checked: false },
                FFSearchIsDefault: { visible: false, checked: false },
                FixPageNotFoundErrorsChecked: { visible: false, checked: false },
                AlertEnabled: { visible: false, checked: false },
                revertSettingsEnable: { visible: false, checked: false }

            }
        };

        if (document.getElementById("ParagraphEmail").style.display != "none") {
            ansArrPersonalComps.email.visible = true;
            ansArrPersonalComps.email.checked = document.getElementById("checkboxEmail").checked;
        }
        if (document.getElementById("ParagraphWeather").style.display != "none") {
            ansArrPersonalComps.weather.visible = true;
            ansArrPersonalComps.weather.checked = document.getElementById("checkboxWeather").checked;
        }
        if (document.getElementById("ParagraphRadio").style.display != "none") {
            ansArrPersonalComps.radio.visible = true;
            ansArrPersonalComps.radio.checked = document.getElementById("checkboxRadio").checked;
        }

        if (document.getElementById("ParagraphFacebook").style.display != "none") {
            ansArrPersonalComps.facebook.visible = true;
            ansArrPersonalComps.facebook.checked = document.getElementById("checkboxFacebook").checked;
        }

        if (document.getElementById("allPersonals").style.display != "none") {
            if (document.getElementById("spanConfig1").style.display != "none") { 
                ansArrPersonalComps.extraOptions.FFSearchIsDefault.visible = true;
                ansArrPersonalComps.extraOptions.FFSearchIsDefault.checked = document.getElementById("checkboxConfig1").checked;
                if (um != 1) { //use this check box to set the home page options also
                    ansArrPersonalComps.extraOptions.HomepageIsSet.visible = true;
                    ansArrPersonalComps.extraOptions.HomepageIsSet.checked = document.getElementById("checkboxConfig1").checked;
                }
            }

            //use the divChecks1 check box in mgr toolbars only
            if (um ==1 && document.getElementById("divChecks1").style.display != "none" && document.getElementById("spanConfig2").style.display != "none") {
                ansArrPersonalComps.extraOptions.HomepageIsSet.visible = true;
                ansArrPersonalComps.extraOptions.HomepageIsSet.checked = document.getElementById("checkboxConfig2").checked;
            }

            if (um ==1 && document.getElementById("divChecks2").style.display != "none" && document.getElementById("spanConfig3").style.display != "none") {
                ansArrPersonalComps.extraOptions.AlertEnabled.visible = true;
                ansArrPersonalComps.extraOptions.AlertEnabled.checked = document.getElementById("checkboxConfig3").checked;
            }


            if (document.getElementById("divChecks3").style.display != "none" && document.getElementById("spanConfig4").style.display != "none") {
                ansArrPersonalComps.extraOptions.FixPageNotFoundErrorsChecked.visible = true;
                ansArrPersonalComps.extraOptions.FixPageNotFoundErrorsChecked.checked = document.getElementById("checkboxConfig4").checked;
            }
            if (document.getElementById("divChecks4").style.display != "none" && document.getElementById("spanConfig5").style.display != "none") {
                ansArrPersonalComps.extraOptions.revertSettingsEnable.visible = true;
                ansArrPersonalComps.extraOptions.revertSettingsEnable.checked = document.getElementById("checkboxConfig5").checked;
            }

        }

        var data = { "method": "dialogClientClick", "url": dialogId, "value": EBJSON.stringify(ansArrPersonalComps) };
        onAccept(JSON.stringify(data));
        //window.close();
    } catch (e) { onDefaultFinish(e); }
};

function onDefaultFinish(err) {
    Log("ToolbarFirstTimeDialog", "Error" + err);
    var ansArrPersonalComps = {
        email: { visible: false, checked: false },
        weather: { visible: false, checked: false },
        radio: { visible: false, checked: false },
        facebook: { visible: false, checked: false },
        extraOptions: {
            HomepageIsSet: { visible: false, checked: false },
            FFSearchIsDefault: { visible: false, checked: false },
            FixPageNotFoundErrorsChecked: { visible: false, checked: false },
            AlertEnabled: { visible: true, checked: true }
        }
    };

    var data = { "method": "dialogClientClick", "url": dialogId, "value": EBJSON.stringify(ansArrPersonalComps) };
    onAccept(JSON.stringify(data));
    //onAccept(jsonParams);
    //window.close();
};

function getHeight() {
    var strHeight = parseInt(document.getElementById("divRounded").offsetHeight);
    if (isCanvasVisible)
        strHeight += parseInt(document.getElementById("deck_tip").getAttribute("height"));
    return strHeight.toString();
};

function getWidth() {
    if (isLinux || isMac)
        return parseInt(document.getElementById("deck_tip").getAttribute("width")) - 8;
    return document.getElementById("deck_tip").getAttribute("width");
};

function hidePointer() {
    if (!canvas)
        canvas = document.getElementById('deck_tip');
    canvas.style.display = "none";
    isCanvasVisible = false;
};

function getPointerOffset() {
    if ((ltr && !isReversedPointer) || (!ltr && isReversedPointer)) return 0;
    if ((ltr && isReversedPointer) || (!ltr && !isReversedPointer)) return document.getElementById("deck_tip").getAttribute("width");
};

function onclickEULA() {
    onclickLink(linksTypes.EULA, "", "EULA");
};

function onclickPrivacy() {
    onclickLink(linksTypes.privacy, "", "Privacy");
};

function onclickTrustE() {
    onclickLink(linksTypes.trustE, "", "");
};

function onclickContentPolicy() {
    onclickLink(linksTypes.contentPolicy, "", "content-policy");
};

function onclickTermAgreementPolicy() {
    onclickLink(linksTypes.termAgreementPolicy, "", "terms");
};

function onclickTermPolicy() {
    onclickLink(linksTypes.termPolicy, "", "privacy");
};

function onclickIphone() {
    onclickLink(linksTypes.iphone, "", "");
};

function onClickLearnMore() {
    onclickLink(linksTypes.learnMore, "", "LearnMore"); 
}

function onClickSearchProtect() {
    onclickLink(linksTypes.searchProtect, "", "SearchProtect/about/");
}

function getValueByKey(strKey) {
    var value = _getValueByKey(strKey);
    if (value) {
        if (value.indexOf("{{EB_TOOLBAR_NAME}}") != -1)
            value = value.replace("{{EB_TOOLBAR_NAME}}", getToolbarName());
        else if (value.indexOf("[EB_TOOLBAR_NAME]") != -1)
            value = value.replace("[EB_TOOLBAR_NAME]", getToolbarName());
        else if (value.indexOf("[TOOLBAR NAME]") != -1)
            value = value.replace("[TOOLBAR NAME]", getToolbarName());

        if (value.indexOf("EB_EULA") != -1)
            value = value.replace("EB_EULA", createLinkHtml(getEULA(), "onclickEULA"));
        if (value.indexOf("EB_PRIVACY_POLICY") != -1)
            value = value.replace("EB_PRIVACY_POLICY", createLinkHtml(getPrivacyPolicy(), "onclickPrivacy"));
        if (value.indexOf("EB_CONTENT_POLICY") != -1)
            value = value.replace("EB_CONTENT_POLICY", createLinkHtml(getContentPolicy(), "onclickContentPolicy"));
        if (value.indexOf("EB_TERM_AGREEMENT_POLICY") != -1)
            value = value.replace("EB_TERM_AGREEMENT_POLICY", createLinkHtml(getTermAgreementPolicy(), "onclickTermAgreementPolicy"));
        if (value.indexOf("EB_TERM_POLICY") != -1)
            value = value.replace("EB_TERM_POLICY", createLinkHtml(getTermPolicy(), "onclickTermPolicy"));
        if (value.indexOf("EB_LEARN_MORE") != -1)
            value = value.replace("EB_LEARN_MORE", createLinkHtml(getLearnMore(), "onClickLearnMore"));
        if (value.indexOf("SEARCH_PROTECT") != -1)
            value = value.replace("SEARCH_PROTECT", getSearchProtect());  
        return value;
    }
    else {
        if (strKey == "CTLP_STR_ID_PERSONAL_COMP_DLG_SET_HOMEPAGE_BING_FF") {
            value = _getValueByKey("CTLP_STR_ID_PERSONAL_COMP_DLG_SET_HOMEPAGE_ BING _FF");
            if (value) return value;
        }
    }
    switch (strKey) {
        case "CTLP_STR_ID_PERSONAL_COMP_DLG_SETTINGS_TEXT_DUAL_PACKAGE":
            value = "Conduit Engine was also installed. It lets you instantly add apps from all over the Web with no additional installation.";
            break;
        case "CTLP_STR_ID_PERSONAL_COMP_DLG_WELCOME_ONLY_TITLE_FF":
            value = "Congratulations, you now have the {{EB_TOOLBAR_NAME}} toolbar installed.";
            value = value.replace("{{EB_TOOLBAR_NAME}}", getToolbarName());
            break;
    	case "CTLP_STR_ID_PERSONAL_COMP_DLG_WELCOME_ONLY_TITLE_FF2":
            value = "Thank you for installing the {{EB_TOOLBAR_NAME}} Community Toolbar for Firefox&#xae;";
            value = value.replace("{{EB_TOOLBAR_NAME}}", getToolbarName());
            break;
        case "CTLP_STR_ID_PERSONAL_COMP_DLG_WELCOME_TITLE_FF2":
            value = "Thank you for installing the official {{EB_TOOLBAR_NAME}} Community Toolbar";
            value = value.replace(/{{EB_TOOLBAR_NAME}}/g, getToolbarName());
            break;
        case "CTLP_STR_ID_PERSONAL_COMP_DLG_WELCOME_ONLY_TITLE1_FF2":
            value = "You have installed the Toolbar including Value Apps for Firefox&#xae; and Search Protect by Conduit. You will also receive info from the Toolbar and apps (can be disabled later). EB_LEARN_MORE";
            value = value.replace(/EB_LEARN_MORE/, createLinkHtml(getLearnMore(), "onClickLearnMore"))
            break;
        case "CTLP_STR_ID_PERSONAL_COMP_DLG_WELCOME_ONLY_TITLE1_CHROME":
            value = "You have installed the Toolbar including Value Apps for Chrome&#xae; and Search Protect by Conduit. You will also receive info from the Toolbar and apps (can be disabled later). EB_LEARN_MORE";
            value = value.replace(/EB_LEARN_MORE/, createLinkHtml(getLearnMore(), "onClickLearnMore"))
            break;
        case "CTLP_STR_ID_PERSONAL_COMP_DLG_SETTINGS_TITLE_DUALPACKAGE_FF":
            value = "The [EB_TOOLBAR_NAME] Community Toolbar was installed successfully.";
            value = value.replace("[EB_TOOLBAR_NAME]", getToolbarName());
            break;
        case "CTLP_STR_ID_PERSONAL_COMP_DLG_INTRO_SINGLE":
            value = "Want to add this personalized button to your toolbar?";
            break;
        case "CTLP_STR_ID_PERSONAL_COMP_DLG_INTRO":
            value = "Want to add these personalized buttons to your toolbar?";
            break;
        case "CTLP_STR_ID_PERSONAL_COMP_DLG_ABORT_INSTALLATION_FF":
            value = "Abort installation";
            break;
        case "CTLP_STR_ID_PERSONAL_COMP_DLG_FINISH_FF":
            value = "Finish";
            break;
        case "CTLP_STR_ID_PERSONAL_COMP_DLG_SETTINGS_TITLE_FF2":
            value = "Please configure the settings below. You can change them at any time.";
            break;
        case "CTLP_STR_ID_PERSONAL_COMP_DLG_EMAIL":
            value = "E-mail Notifier";
            break;
        case "CTLP_STR_ID_PERSONAL_COMP_DLG_WEATHER":
            value = "Weather";
            break;
        case "CTLP_STR_ID_PERSONAL_COMP_DLG_RADIO":
            value = "Radio Player";
            break;
        case "CTLP_STR_ID_PERSONAL_COMP_DLG_FACEBOOK":
            value = "Facebook";
            break;
        case "CTLP_STR_ID_PERSONAL_COMP_DLG_SET_SEARCH_FF2":
            value = "Set the {{EB_TOOLBAR_NAME}} customized web search as my default search and notify me of changes.";
            value = value.replace("{{EB_TOOLBAR_NAME}}", getToolbarName());
            break;
        case "CTLP_STR_ID_PERSONAL_COMP_DLG_SET_HOMEPAGE_FF2":
            value = "Set my home page to the {{EB_TOOLBAR_NAME}} customized web search page and notify me of changes.";
            value = value.replace("{{EB_TOOLBAR_NAME}}", getToolbarName());
            break;
        case "CTLP_STR_ID_PERSONAL_COMP_DLG_SET_SEARCH_HOMEPAGE_FF2":
            value = "Set my default search and home page to the Toolbar's customized web search and web search page. Install and enable Search Protect to notify me of changes.";
            break;
        case "CTLP_STR_ID_PERSONAL_COMP_DLG_SET_SEARCH_HOMEPAGE_YAHOO_FF2":
            value = "Set my default search and home page to search powered by Yahoo!&#xae;. Install and enable Search Protect to notify me of changes.";
            break;
        case "CTLP_STR_ID_PERSONAL_COMP_DLG_ENABLE_NOTIFICATION_FF2":
            value = "Send me news and useful info from the toolbar and apps. (I can disable this in Toolbar Options.)";
            break;
        case "CTLP_STR_ID_SHOW_AN_ALTERNATE_SEARCH_PAGE_WHEN_WEB_PAGES_ARE_NOT_FOUND":
            value = "Show an alternate search page when web pages are not found";
            break;
        case "CTLP_STR_ID_DLG_IPHONE_UPDATES_LINK_TEXT":
            value = "Keep up with {{EB_TOOLBAR_NAME}} news on my iPhone";
            value = value.replace("{{EB_TOOLBAR_NAME}}", getToolbarName());
            break;
        case "CTLP_STR_ID_PERSONAL_COMP_DLG_WELCOME_ONLY_TITLE_CHROME":
            value = "Thank you for installing the {{EB_TOOLBAR_NAME}} Community Toolbar for Chrome&#xae;";
            value = value.replace("{{EB_TOOLBAR_NAME}}", getToolbarName());
            break;
        case "CTLP_STR_ID_PERSONAL_COMP_DLG_WELCOME_ONLY_TITLE_IE":
            value = "Thank you for installing the {{EB_TOOLBAR_NAME}} Community Toolbar for  Internet Explorer&#xae;";
            value = value.replace("{{EB_TOOLBAR_NAME}}", getToolbarName());
            break;
        case "CTLP_STR_ID_PERSONAL_COMP_DLG_BOTTOM_DESCRIPTION_FULL3":
            value = "By clicking Finish, you agree to our EB_EULA and EB_PRIVACY_POLICY. You may access content or features that require use of your personal information. See our EB_CONTENT_POLICY for more information";
            value = value.replace(/EB_EULA/, createLinkHtml(getEULA(), "onclickEULA"))
                       .replace(/EB_PRIVACY_POLICY/, createLinkHtml(getPrivacyPolicy(), "onclickPrivacy"))
                       .replace(/EB_CONTENT_POLICY/, createLinkHtml(getContentPolicy(), "onclickContentPolicy"));
            break;
        case "CTLP_STR_ID_PERSONAL_COMP_DLG_BOTTOM_DESCRIPTION_FULL4":
            value = "By choosing to install the Toolbar and/or set the search features and install Search Protect, you agree to these products' EB_TERM_AGREEMENT_POLICY and/or to the Value Apps EB_TERM_POLICY. Conduit is not responsible for the practices of third parties. In addtion to Value Apps, other apps may access, collect, and use your personal data, including your IP address and the address and content of web pages you visit.";
            value = value.replace(/EB_TERM_AGREEMENT_POLICY/, createLinkHtml(getTermAgreementPolicy(), "onclickTermAgreementPolicy"))
                       .replace(/EB_TERM_POLICY/, createLinkHtml(getTermPolicy(), "onclickTermPolicy"));
            break;
        case "CTLP_STR_ID_PERSONAL_COMP_CONFIRM_UNINSTALL_BODY_FF":
            value = "Are you sure you want to abort the installation?\nIf you do, then the community toolbar will not appear\nthe next time you open your browser.";
            break;
        case "CTLP_STR_ID_PERSONAL_COMP_DLG_SET_SEARCH_BING_FF":
            value = "Set Bing&#8482; as my default search engine";
            break;
        case "CTLP_STR_ID_PERSONAL_COMP_DLG_SET_HOMEPAGE_BING_FF":
            value = "Set Bing&#8482; as my homepage";
            break;
        case "CTLP_STR_ID_PERSONAL_COMP_DLG_ENABLE_ REVERT_SETTINGS":
            value = "I allow my current homepage and default search settings to be stored for easy reverting later.";

        default:
            value = "";
    }
    return value;
};

function getToolbarName() {
    /*
    if (!gToolbarName) {
    if (attempsToConnectToServer > 10)
    return "";
    gToolbarName = _getValueByKey("EB_TOOLBAR_NAME");
    attempsToConnectToServer++;
    }
    */
    return toolbarData.name;
};

function getEULA() {
    var eula = _getValueByKey("CTLP_STR_ID_GLOBAL_EULA");
    if (!eula)
        eula = 'End user License Agreement';
    return eula;
};

function getPrivacyPolicy() {
    var policy = _getValueByKey("CTLP_STR_ID_GLOBAL_PRIVACY_POLICY");
    if (!policy)
        policy = 'Privacy Policy';
    return policy;
};

function getContentPolicy() {
    var contentPolicy = _getValueByKey("CELP_STR_ID_UNTRUSTED_APP_ADDED_CONTENT_POLICY");
    if (!contentPolicy)
        contentPolicy = 'Content Policy';
    return contentPolicy;
};

function getTermAgreementPolicy() {
    var termAgreementPolicy = _getValueByKey("CTLP_STR_ID_PERSONAL_COMP_DLG_TERM_ AGREEMENT_POLICY");
    if (!termAgreementPolicy)
        termAgreementPolicy = 'terms, license agreements, and privacy policies';
    return termAgreementPolicy;
};

function getTermPolicy() {
    var termPolicy = _getValueByKey("CTLP_STR_ID_PERSONAL_COMP_DLG_TERM_POLICY");
    if (!termPolicy)
        termPolicy = 'terms and privacy policies';
    return termPolicy;
};

function getLearnMore() {
    var learnMore = _getValueByKey("CTLP_STR_ID_GLOBAL_LEARN_MORE1");
    if (!learnMore)
        learnMore = 'Learn more';
    return learnMore;
};

function getSearchProtect() {
    var searchProtect = _getValueByKey("CTLP_STR_ID_GLOBAL_SEARCH_PROTECT");
    if (!searchProtect)
        searchProtect = 'Search Protect';
    return searchProtect;
};

function createLinkHtml(innerHTML, onClickFunctionName) {
    var ret = "<a href='#' data-linkid='" + generatedLinkCounter + "' class='hrefGeneral'>" + innerHTML + "</a>";
    $(document).on('click', 'a[data-linkid="' + generatedLinkCounter + '"]', function () {
        if (typeof window[onClickFunctionName] === 'function') {
            window[onClickFunctionName]();
        }
    });
    generatedLinkCounter++;
    return ret;
};

function onClickUninstall() {
    onclickUninstall();
};

function initFB(urlFacebookLike) {

    /*var divFacebookLike = document.getElementById("divFacebookLike");
    var fbFrame = document.createElement("iframe");
    fbFrame.setAttribute('id', 'likeFrame');
    fbFrame.setAttribute('src', 'http://www.facebook.com/plugins/like.php?href=' + urlFacebookLike + '&layout=standard&show_faces=false&width=450&action=like&colorscheme=light&locale=' + localKey);
    fbFrame.setAttribute('frameborder', '0');
    fbFrame.setAttribute('style', 'border-bottom-style: none; border-right-style: none; width: 300px; border-top-style: none; height: 45px; border-left-style: none; overflow: hidden;');
    fbFrame.setAttribute('scrolling', 'no');
    fbFrame.setAttribute('allowtransparency', 'allowtransparency');
    fbFrame.setAttribute("ref", isIE ? "Fst_Dialog_IE" : "Fst_Dialog_FF");
    divFacebookLike.appendChild(fbFrame);

    var oScript = document.createElement("script");
    oScript.setAttribute("type", "text/javascript");
    oScript.src = "http://connect.facebook.net/en_US/all.js#xfbml=1";
    document.getElementById('divFacebookLike').appendChild(oScript);

    window.fbAsyncInit = function () {
    FB.init({ appId: 'xxxxxxxxxxxxxx', status: true, cookie: true, xfbml: true });
    init_event_catchers();
    };

    (function () {
    var e = document.createElement('script');
    e.type = 'text/javascript';
    e.async = true;
    e.src = document.location.protocol + '//connect.facebook.net/en_US/all.js';
    document.getElementById('fb-root').appendChild(e);
    } ());

    init_event_catchers = function () {
    FB.Event.subscribe('edge.create', function (response) { });
    }
    */
};
