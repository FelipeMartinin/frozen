(function () {
    var messages = conduit.abstractionlayer.commons.messages,
        dialogData = {},
	    isLtr = true,
	    isLangLtr = true,
	    translation = {  //with fallbacks
	        CTLP_STR_ID_TOOLBAR_NAME_FULL_NAME: "",
	        CTLP_STR_ID_ABOUT_VERSION: "Version:",
	        CTLP_STR_ID_ABOUT_CTID: "CTID:",
	        CTLP_STR_ID_ABOUT_ID: "ID:",
	        CTLP_STR_ID_ABOUT_TOOLBAR_POWERED_BY: "Powered by",
	        CTLP_STR_ID_GLOBAL_PRIVACY_POLICY: "Privacy Policy",
	        CTLP_STR_ID_GLOBAL_OK: "Privacy Policy"
	    };

    conduit.abstractionlayer.commons.messages.sendSysReq("getToolbarDirection", "aboutBox.js", "(@:", function (response) {
        dir = JSON.parse(response).dialogsDirection.toLowerCase();
        if (dir == 'ltr')
            isLtr = true;
        else {
            isLtr = false;
            $('body').addClass('rtl');
        }
    });

    conduit.abstractionlayer.commons.messages.sendSysReq(
	    "serviceLayer",
	    "webappApi.localization.getLocale",
	    JSON.stringify({ service: "toolbarSettings", method: "getLocaleData" }),
	    function (result) {
	        try {
	            result = (typeof result == 'string') ? JSON.parse(result) : result;
	            var loc_direction = (result.languageAlignMode) ? result.languageAlignMode : result.alignMode;
	            isLangLtr = (loc_direction === "LTR");
	        }
	        catch (err) { }
	    }
	);

    function fillAboutBox() {
        $("#title-text").text(translation['CTLP_STR_ID_TOOLBAR_NAME_FULL_NAME']);
        $("#logo").attr('src', dialogData.toolbarLogo);
        $("#ctid").text(translation['CTLP_STR_ID_ABOUT_CTID'] + " " + dialogData.ctid);
        $("#userId").text(translation['CTLP_STR_ID_ABOUT_ID'] + " " + dialogData.userId);
        $("#version").text(translation['CTLP_STR_ID_ABOUT_VERSION'] + " " + dialogData.version);
        $("#poweredByText").text(translation['CTLP_STR_ID_ABOUT_TOOLBAR_POWERED_BY']);
        $("#privacy").text(translation['CTLP_STR_ID_GLOBAL_PRIVACY_POLICY']);
        $("#closeButtonText").text(translation['CTLP_STR_ID_GLOBAL_OK']);

        if (!dialogData.displayTrusteSeal) {
            if (isLtr) {
                $('#trustE-img').hide();
                $('#trustE-text').css('float', 'left');
                $('#trustE-container').css('float', 'none');
                $('#trustE-text').css('margin-left', '0px');
            }
            else {
                $('#trustE-img').hide();
                $('#trustE-text').css('float', 'right');
                $('#trustE-container').css('float', 'none');
                $('#trustE-text').css('margin-right', '0px');
                $('#trustE-text').css('direction', 'rtl');
            }
        }

        if (!isLtr) {
            document.body.className = 'rtl';  //in IE8 the class was not added before
            if (isLangLtr) {
                $("#ConduitLogo").prependTo("#poweredByWrapper");
            }
        }
    }

    //get translation from serviceLayer.
    function getTranslations() {
        conduit.abstractionlayer.commons.messages.sendSysReq("serviceLayer", "options", JSON.stringify({
            service: "translation",
            method: "getTranslationByRegex",
            data: ["^CTLP_STR_ID_TOOLBAR_NAME_FULL_NAME", "^CTLP_STR_ID_ABOUT_VERSION", "^CTLP_STR_ID_ABOUT_CTID", "^CTLP_STR_ID_ABOUT_ID", "^CTLP_STR_ID_ABOUT_TOOLBAR_POWERED_BY", "^CTLP_STR_ID_GLOBAL_PRIVACY_POLICY", "^CTLP_STR_ID_GLOBAL_OK"]
        }), function (responseData) {

            // if we get valid response object we use it.
            // otherwise we have the fallback translation object.
            if (responseData) {
                var oResponseData = JSON.parse(responseData);

                // if we get something in the translation response object
                if (!$.isEmptyObject(oResponseData)) {
                    // we check if all keys are valid.
                    for (var key in translation) {
                        if (translation.hasOwnProperty(key)) {
                            translation[key] = oResponseData[key] || translation[key];
                        }
                    }
                }

                translation['CTLP_STR_ID_TOOLBAR_NAME_FULL_NAME'] = (translation['CTLP_STR_ID_TOOLBAR_NAME_FULL_NAME'].replace('[TOOLBAR NAME]', dialogData.toolbarName)) || (dialogData.toolbarName + " Community Toolbar");
                translation['CTLP_STR_ID_ABOUT_TOOLBAR_POWERED_BY'] = translation['CTLP_STR_ID_ABOUT_TOOLBAR_POWERED_BY'].replace(/\s*Conduit\s*/gi, '');
            }

            fillAboutBox();
        });
    }

    function getData() {
        // get all needed data for dialog
        messages.sendSysReq("serviceLayer", "appManager.model",
		    JSON.stringify({ service: "login", method: "getLoginData" }),
		    function (response) {
		        var loginData = response ? JSON.parse(response) : { aboutBox: {} };
		        dialogData.trusteSealUrl = loginData.aboutBox.trusteSealUrl;
		        if (!dialogData.trusteSealUrl) {
		            // replace qasite and conduit in the build
		            var ctid = conduit.abstractionlayer.commons.context.getCTID().result;
		            var trustUrl = conduit.abstractionlayer.commons.repository.getKey(ctid + ".TrusteLinkUrl").result;
		            dialogData.trusteSealUrl = trustUrl || "http://trust.conduit.com/" + ctid;
		        }
		        dialogData.privacyPageUrl = loginData.aboutBox.privacyPageUrl;
		        if (!dialogData.privacyPageUrl) {
		            dialogData.privacyPageUrl = "http://www.conduit.com/privacy/Default.aspx";
		        }
		    });

        messages.sendSysReq("serviceLayer.settings.getSettingsData", "aboutBox", "", function (response) {

            var toolbarData = JSON.parse(response);
            dialogData.ctid = toolbarData.generalData.actingCt;            
            dialogData.userId = conduit.abstractionlayer.commons.context.getUserID().result;
            dialogData.version = conduit.abstractionlayer.commons.environment.getEngineVersion().result;
            dialogData.displayTrusteSeal = toolbarData.generalData.displayTrusteSeal;
            dialogData.toolbarLogo = toolbarData.apps[0].displayIcon;
            dialogData.toolbarName = toolbarData.generalData.toolbarName;
            dialogData.trusteUrl = "";
            getTranslations();
        });
        $('#privacy').click(openPrivacy);
        $('#trustE').click(openTruste);
        $('.close').click(closeDialog).on('mousedown', function () {
            $(this).addClass('active');
        }).on('mouseout', function () {
            $(this).removeClass('active');
        });

    }

    function openPrivacy() {
        var obj = {
            method: "openLink",
            data: { url: dialogData.privacyPageUrl }
        };
        notifyModel(obj);
        closeDialog();
    }

    function openTruste() {
        var obj = {
            method: "openLink",
            data: { url: dialogData.trusteSealUrl }
        };
        notifyModel(obj);
        closeDialog();
    }

    function closeDialog() {
        var obj = {
            method: "close",
            data: {}
        };
        notifyModel(obj);
    }

    function notifyModel(obj) {
        messages.sendSysReq("handleAboutBox", "aboutBox", JSON.stringify(obj), function (response) { });
    }

    $(getData);
})();
