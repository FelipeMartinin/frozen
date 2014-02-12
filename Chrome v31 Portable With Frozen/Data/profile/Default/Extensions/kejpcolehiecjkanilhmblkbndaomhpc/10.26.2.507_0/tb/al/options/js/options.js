/**
* @fileOverview:  [somedescription]
* FileName: options.view.js
* FilePath: ..ApplicationLayer\Dev\src\main\js\options\js\options.view.js
* Date: 12/9/2011 
* Copyright: 
*/

///////////////
//Pre Cache////
///////////////
// This script is called twice, once before jquery is loaded, and once after
if (typeof jQuery !== 'undefined') {
    //caching the template in 'components-list-template'
    jQuery.template('components-list-template', $('#components-list-template'));

    //caching the template in 'notifications-list-template'
    jQuery.template('notifications-list-template', $('#notifications-list-template'));
}


///////////////
//GLOBAL VARS//
///////////////
try {
    var messages = conduit.abstractionlayer.commons.messages,

    //a reference to the main titles elements for later use.
	$h3 = $('#header-content-wrapper h3'),
    $contentWrapper = $("#content-wrapper"),
    //get the current version	
    version = conduit.abstractionlayer.commons.environment.getEngineVersion().result,

    //a reference to repository
    repository = conduit.coreLibs.repository,

    //by default the only section that is not hidden is predefinedComponents.
	currentPageDisplayed = $('#content_predefinedComponents'),

    //will hold all the translation data
	translation = {
	    CTLP_STR_ID_OPTIONS_DLG_HIDE_COMPONENT_BUTTON: "Hide",
	    CTLP_STR_ID_OPTIONS_DLG_SHOW_COMPONENT_BUTTON: "Show",
	    CTLP_STR_ID_OPTIONS_DLG_REMOVE_COMPONENT_BUTTON: "Remove",
	    CTLP_STR_ID_OPTIONS_DLG_BUILT_IN_APPS_TAB_TITLE: "Built-In Apps",
	    CTLP_STR_ID_OPTIONS_DLG_BUILT_IN_APPS_TAB_DESCRIPTION: "Your toolbar comes with these cool preselected apps.",
	    CELP_STR_ID_ENGINE_OPTIONS_DLG_COMPONENTS_HEADING: "My Apps",
	    CTLP_STR_ID_OPTIONS_DLG_MY_APPS_TAB_DESCRIPTION: "These are the apps that you added from the Marketplace. You can show, hide, or remove them.",
	    CTLP_STR_ID_OPTIONS_DLG_RECOMMENDED_APPS_TAB_TITLE: "Recommended Apps",
	    CTLP_STR_ID_OPTIONS_DLG_RECOMMENDED_APPS_TAB_DESCRIPTION: "With these useful apps, it’s easy and fun to personalize your toolbar.",
	    SB_OPTIONS_SEARCH: "Search",
	    CTLP_STR_ID_OPTIONS_DLG_SEARCH_TAB_DESCRIPTION: "Change your toolbar’s search settings.",
	    CTLP_STR_ID_OPTIONS_DLG_NOTIFICATION_TITLE: "Notifications",
	    CTLP_STR_ID_OPTIONS_DLG_NOTIFICATION_DESCRIPTION: "Get updated on your favorite content with notifications sent right to your desktop.",
	    CTLP_STR_ID_OPTIONS_DLG_ADVANCED_SETTINGS_TAB_TITLE: "Advanced Settings",
	    CTLP_STR_ID_OPTIONS_DLG_ADVANCED_SETTINGS_TAB_DESCRIPTION: "Change your toolbar settings. You can make changes anytime.",
	    CTLP_STR_ID_OPTIONS_DLG_HELP_TAB_TITLE: "Help",//TODO lms
	    CTLP_STR_ID_OPTIONS_DLG_HELP_TAB_DESCRIPTION: "Read more about how we use the information about you.", //TODO lms
	    CTLP_STR_ID_OPTIONS_DLG_HELP_AND_TROUBLESHOOTING: "Help & Troubleshooting",//TODO lms
        CTLP_STR_ID_OPTIONS_DLG_CONTACT_US: "Contact Us",//TODO lms
	    CTLP_STR_ID_OPTIONS_DLG_ABOUT_TAB_TITLE: "About", //TODO lms
	    CTLP_STR_ID_ABOUT_VERSION: "Version:",
	    CTLP_STR_ID_OPTIONS_DLG_TITLE: "Toolbar Options",
	    CTLP_STR_ID_GLOBAL_OK: "OK",
	    CTLP_STR_ID_GLOBAL_CANCEL: "Cancel",
	    CTLP_STR_ID_OPTIONS_DLG_ADDITIONAL_ENABLE_HISTORY: "Enable search box history.",
	    CTLP_STR_ID_OPTIONS_DLG_ADDITIONAL_CLICK_TO_SEARCHBOX: "Add selected text on the web page to the search box.",
	    //CTLP_STR_ID_OPTIONS_DLG_ADDITIONAL_BACK_TO_DEFAULT_SEARCH_ENGINE__2: "Enable return to web search after using specialized search (such as images).",
	    SB_OPTIONS_DROPDOWN_SHOW_ALL: "Show all notifications",
	    SB_OPTIONS_DROPDOWN_LIMIT_DAILY: "Limit daily notifications to...",
	    SB_OPTIONS_DROPDOWN_DONT_SHOW: "Don’t show notifications",
	    CTLP_STR_ID_OPTIONS_DLG_ADDITIONAL_ENABLE_SHOW_INTERVAL: "Make sure that the toolbar is visible every (days)",

	    CELP_STR_ID_UNTRUSTED_APP_ADDED_ALLOW_PRIVACY: "Always ask me about apps privacy",
	    CTLP_STR_ID_SEARCH_PROTECTOR_NOTIFY_CHANGE: "Notify me of search settings change attempts",
	    CTLP_STR_ID_SEARCH_PROTECTOR_SHOW_DIALOG_POLICY_EVERYTIME: "Every time",
	    CTLP_STR_ID_SEARCH_PROTECTOR_SHOW_DIALOG_POLICY_PERIODICALLY: "Periodically",
	    CTLP_STR_ID_OPTIONS_DLG_ADDITIONAL_SEARCH_IN_NEW_TAB: "Show a search box on new browser tabs.",
	    CTLP_STR_ID_OPTIONS_DLG_SHOW_SELECTED_TEXT_ON_WEBPAGE_IN_SEARCH_BOX__2: 'Show text that is selected on the page inside the search box.',
	    CTLP_STR_ID_OPTIONS_DLG_ADDITIONAL_ENABLE_SHOW_INTERVAL_NEW__3: "Make sure the Community Toolbar is visible {cb}",
	    CTLP_STR_ID_OPTIONS_DLG_ADDITIONAL_ENABLE_SHOW_INTERVAL_ONCE_A_DAY: "Once a day",
	    CTLP_STR_ID_OPTIONS_DLG_ADDITIONAL_ENABLE_SHOW_INTERVAL_ONCE_A_WEEK: "Once a week",
	    CTLP_STR_ID_OPTIONS_DLG_ADDITIONAL_ENABLE_SHOW_INTERVAL_ONCE_IN_2_WEEKS: "Once in 2 weeks",
	    CTLP_STR_ID_OPTIONS_DLG_ADDITIONAL_ENABLE_SHOW_INTERVAL_ONCE_IN_3_WEEKS: "Once in 3 weeks",
	    CTLP_STR_ID_OPTIONS_DLG_ADDITIONAL_ENABLE_SHOW_INTERVAL_ONCE_A_MONTH: "Once a month",
	    CTLP_STR_ID_OPTIONS_DLG_ADD_FREE_APPS_NOW: "You haven’t added any apps. Choose from EB_MARKET_PLACE now!",
	    CTLP_STR_ID_OPTIONS_DLG_MARKET_PLACE_THOUSANDS_OF_APPS: "thousands of free apps",
	    CTLP_STR_ID_OPTIONS_DLG_ENABLE_SEARCH_ADDRESS_BAR: "Enable search from address bar.",
        CTLP_STR_ID_OPTIONS_DLG_ENABLE_SEARCH_SUGGEST:"Enable search suggestions in address bar", 
	    CTLP_STR_ID_OPTIONS_DLG_ADDITIONAL_USAGE__2: "Send usage statistics (help us improve)."
	},

    translationResponse,
    searchAPIResponse,
    appsData,
    personalAppsData,
    settingsData,
    configData,
    generalData,
    mystuffAppsData,
    loginData,
    actingCtid,
    toolbarLogo,

	titlesTranslations,
    //will hold the toolbar icon
	toolbarIcon,

	notificationSettings,
    notificationKeyName,

    //a flag which indicates if the user has made any action(click...)
    userAction = false,
    tbOptions = { builtInApps: {}, recommendedApps : {}, myApps: {} , search : {}, notifications: {} , advanced: {} },
    // Advanced:
    
    //a flag which indicates if the user has made any changes to the 
    //"Always ask me about apps privacy" checkbox.
    isAppPrivacy,
    notifyChanges,
    showDialogPolicy,   
    searchInNewTab,
    searchSuggest,
    searchFromAddressBar,
    fixPageNotFoundError,
    toolbarVisibility,
    toolbarVisibilityDaysInterval,
    sendUsageStatistics,

    webAppSelectedElemntId = null,

    //will hold all the changes the user does
	repositoryObj = {
	    apps: {},
	    search: {}
	},
    ctid = conduit.abstractionlayer.commons.context.getCTID().result,
    version = conduit.abstractionlayer.commons.environment.getEngineVersion().result,
    appOptions,
    browserInfo = conduit.abstractionlayer.commons.environment.getBrowserInfo().result,
    isIE = /IE/i.test(browserInfo.type),
    isIE9 = (isIE && browserInfo.version.match(/^(\d+)/)[1] === "9"),
    isChrome = /Chrome/i.test(browserInfo.type),
    isSafari = /Safari/i.test(browserInfo.type),
    isFF = /Firefox/i.test(browserInfo.type),	
    appChanges = {},
    searchApp;

	/////////////////
	//NOTIFICATIONS//
	/////////////////

	var Notifications = (function () {
	    var settingsChanged;

	    function render(callback) {

	        // get notification settings from the repository
	        var ctid = conduit.abstractionlayer.commons.context.getCTID();
	        if (ctid.status == "0") {
	            ctid = ctid.result;
	        }
	        else {
	            ctid = "";
	        }
	        notificationKeyName = ctid + "." + "NotificationSettings";
	        conduit.abstractionlayer.commons.repository.getData(notificationKeyName, false, function (data) {
	            if (!data || data.result === false || data.status !== 0) {
	                notificationSettings = [];
	            }
	            else {
	                notificationSettings = JSON.parse(data.result);

	                //we look for extra data that should not be displayed and remove it from the array.
	                for (var i = 0; i < notificationSettings.length; i++) {
	                    n = notificationSettings[i];
	                    if (n.channelId === "API" || (n.removed && n.removed == 1)) {
	                        notificationSettings.splice(i, 1);
	                    }
	                }
	            }

	            //execute template.
	            $.tmpl('notifications-list-template', notificationSettings).appendTo("#notifications-list");

	            //check the notifications data and update the UI 
	            updateUIValues();

	            //init listeners.
	            initListeners();

	            tbOptions.notifications = $.extend(true, {}, notificationSettings);
	            callback();
	        });
	    }

	    function save() {
	        var hasAppsToRemove = false;
	        for (appId in appChanges) {
	            if (appChanges[appId].isToRemove) {
	                for (index in notificationSettings) {
	                    if (notificationSettings[index].channelId == appChanges[appId].appGuid) {
	                        notificationSettings[index].removed = 1;
	                        hasAppsToRemove = true;
	                    }
	                }
	            }
	        }

	        if (notificationSettings && notificationSettings.length > 0 || hasAppsToRemove) {
	            conduit.abstractionlayer.commons.repository.setData(notificationKeyName, JSON.stringify(notificationSettings), false, '', function (response) {
	                messages.postTopicMsg("adv:AppsNotificationOptionsChanged", "options.model", JSON.stringify(notificationSettings));
	            });
	        }
	    }

	    /**
	    @function
	    @description: after the template finished rendering all html,
	    we iterate over all options tags of the '.combo-days' select tags, against the data form repository,
	    when finding a match we update the option tag to "selected"	
	    */
	    function updateUIValues() {
	        $('.combo-days').each(function (i) {
	            var index = i;
	            var $select = $(this),
				$options = $select.children('option');

	            $options.each(function (i) {
	                var $option = $(this);

	                if ($option.val() == notificationSettings[index].timeAday) {
	                    $option.attr('selected', 'selected');
	                }
	            });
	        });

	        $('.combo-main').each(function (i) {
	            var index = i;
	            var $select = $(this),
				$options = $select.children('option');

	            $options.each(function (i) {
	                var $option = $(this);
	                if ($option.val() == notificationSettings[index].rule) {
	                    $option.attr('selected', 'selected');
	                }
	            });
	        });
	    }

	    /**
	    @function
	    @description: listen for changes on the main select tags menu	
	    */
	    function initListeners() {
	        $("select.combo-main").change(function () {

	            userAction = true;
	            settingsChanged = true;

	            var $select = $(this),
				channelName = this.id,
				$selectDays = $select.next();

	            //if the user has selected this options, we need toi show him the days dropdown menu.
	            if ($select.val() == "timeAday") {
	                $selectDays.show();
	            }
	            else {
	                //if not, hide it.
	                $selectDays.hide();
	            }

	            // change notificationSettings object
	            for (index in notificationSettings) {
	                if (notificationSettings[index].channelName == channelName) {
	                    notificationSettings[index].rule = $select.val();
	                    notificationSettings[index].displayedTime = 0;
	                }
	            }

	        });

	        $("select.combo-days").change(function () {

	            userAction = true;

	            var $selectDays = $(this),
				channelName = this.id;

	            // change notificationSettings object
	            for (index in notificationSettings) {
	                if (notificationSettings[index].channelName == channelName) {
	                    notificationSettings[index].timeAday = $selectDays.val();
	                    notificationSettings[index].displayedTime = 0;
	                }
	            }

	        });
	    }


	    function showPage() {
	        //update header section
	        currentPageDisplayed.fadeOut(100, function () {
	            $h3.text(translation.CTLP_STR_ID_OPTIONS_DLG_NOTIFICATION_DESCRIPTION);

	            $('#content_notifications').show();
	        });

	        //update the global var for the current page displayed
	        currentPageDisplayed = $('#content_notifications');
	    }
	    return {
	        showPage: showPage,
	        render: render,
	        save: save,
	        getNotificationSettings: function () {
	            return notificationSettings;
	        },
	        isSettingsChanged: function () {
	            return settingsChanged;
	        }
	    }
	})();

	/////////////////////
	//ABOUT//
	/////////////////////

	var About = (function () {

	    function showPage() {
	        //update header section
	        currentPageDisplayed.fadeOut(100, function () {
	            $('#content_about').show();
	        });
	    }

	    function render() {
	        $("#about_logo").attr('src', toolbarLogo);
	        $("#about_version").text(translation.CTLP_STR_ID_ABOUT_VERSION);
	        $("#about_version_value").text(version);
	        $("#about_ctid").text(translation.CTLP_STR_ID_ABOUT_CTID);
	        $("#about_ctid_value").text(actingCtid);
	        $("#about_userId").text(translation.CTLP_STR_ID_ABOUT_ID);

	        $("#about_poweredByText").text(translation.CTLP_STR_ID_ABOUT_TOOLBAR_POWERED_BY);
	        $("#privacyLink").text(translation.CTLP_STR_ID_GLOBAL_PRIVACY_POLICY);
	        $("#EULALink").text(translation.CTLP_STR_ID_GLOBAL_END_USER_LICENCE_AGREEMENT);
	        conduit.abstractionlayer.commons.context.getUserID(function (resp) {
	            var userId = resp.result;
	            $("#about_userId_value").text(userId);


	        });
	    }

	    return {
	        showPage: showPage,
	        render: render
	    }
	})();


    ///////////////
    //OPTIONS//////
    ///////////////

    /**
    @object: "Options"
    @description: general object to run messages and get all data.
    @runs on init. 
    */

	var Options = (function () {
	    /**
	    @function
	    @description: asking the appManager model for all models
	    then run all templates, run translation and initListeners.
	    */
	    function renderAll() {
	        try {
	            var loggerContext = { className: "options.view", functionName: "renderAll" };
	            conduit.coreLibs.logger.logDebug('Start', loggerContext);

	            for (var i = appsData.length - 1; i >= 0; i--) {
	                var appData = appsData[i];
	                if (appData.appType === "SEARCH") {
	                    searchApp = appData;
	                }
	                if (appData.appType === "SEPERATORITEM") {
	                    appData.displayText = translation["CTLP_STR_ID_SEPERATOR_TEXT"];
	                }
	                if (appData.viewData && !appData.viewData.allowScroll) {
	                    toolbarIcon = appData.displayIcon;
	                    appsData.splice(i, 1);
	                }
	                else {
	                    appData.displayIcon = appData.displayIcon || (appData.viewData && appData.viewData.icon ? appData.viewData.icon : "");
	                }
	            }

	            conduit.coreLibs.logger.logDebug('Got the following userApps from service layer: ' + mystuffAppsData, loggerContext);
	            //render the template with regular apps data
	            conduit.coreLibs.logger.logDebug('Found the following personal apps: ' + personalAppsData, loggerContext);
	            var handlerObj = { method: 'getApps', data: "" };
	            messages.sendSysReq("handleOptions", "options", JSON.stringify(handlerObj), function (response) {

	                var appsInfoObj = JSON.parse(response);
	                var apps = appsInfoObj.apps;
	                var personalApps = appsInfoObj.personalApps;
	                var mystuffApps = appsInfoObj.mystuffApps;

	                for (var i = 0; i < personalAppsData.length; i++) {
	                    var personalAppDataObj = personalAppsData[i];
	                    if (!personalAppDataObj.displayText) {
	                        personalAppDataObj.displayText = translation["CTLP_STR_ID_OPTIONS_DLG_" + personalAppDataObj.appType + "_COMP_TITLE"];
	                    }

	                    if (!personalAppDataObj.displayIcon) {
	                        //length is 0 when the toolbar was installed with 0 personal components
	                        if (personalApps.length > 0) {

	                            for (var index in personalApps) {
	                                var app = personalApps[index];
	                                if (app.appId == personalAppDataObj.appId) {
	                                    personalAppDataObj.displayIcon = app.displayIcon || (app.viewData && app.viewData.icon ? app.viewData.icon : "");
	                                }
	                                else {
	                                    //no icon. use fallback.
	                                    personalAppDataObj.displayIcon = getDefaultIconByAppType(personalAppDataObj.appType)
	                                }
	                                break;
	                            }
	                        }
	                        else {
	                            //we have to use the fallback.
	                            personalAppDataObj.displayIcon = getDefaultIconByAppType(personalAppDataObj.appType)
	                        }
	                    }
	                    conduit.coreLibs.logger.logDebug('personal app: ' + personalAppDataObj.appId + ', display icon: ' + personalAppDataObj.displayIcon, loggerContext);
	                }

	                var filteredUserApps = [];
	                for (var i in mystuffAppsData) {
	                    var mystuffAppsDataObj = mystuffAppsData[i];
	                    if (mystuffAppsDataObj.managed && mystuffAppsDataObj.managed.managerId) {
	                        filteredUserApps.push(i);
	                        continue;
	                    }
	                    if (!mystuffAppsDataObj.displayIcon) {

	                        for (var index in mystuffApps) {
	                            var app = mystuffApps[index];
	                            if (app.appId == mystuffAppsDataObj.appId) {
	                                mystuffAppsDataObj.displayIcon = app.displayIcon || (app.viewData && app.viewData.icon ? app.viewData.icon : "");
	                                break;
	                            }
	                        }
	                    }
	                }

	                while (filteredUserApps.length > 0) {
	                    //filter out the managerId userApps
	                    mystuffAppsData.splice(filteredUserApps.pop(), 1);
	                }

	                //keep the same order in options as in the toolbar.
	                mystuffAppsData.reverse();

	                for (var i = 0; i < appsData.length; i++) {
	                    var appId = appsData[i].appId;
	                    if (apps[appId] && apps[appId].appGuid) {
	                        appsData[i].appGuid = apps[appId].appGuid;
	                        appsData[i].appClientGuid = apps[appId].appClientGuid;
	                    }
	                }

	                renderAppsListPanel(personalAppsData, "content_personalApps", false, true);
	                renderAppsListPanel(mystuffAppsData, "content_myApps");
	                renderAppsListPanel(appsData, "content_predefinedComponents", true);

	                //render the template for notifications from repository data.
	                Notifications.render(function () {


	                    About.render();

	                    //apply translation to all html elements that contains text.
	                    addTranslation(translation);
	                    //TODO: function
	                    initScrollpane();

	                    $('#page').addClass('has-js');
	                    $('.label_check').click(function (event) {
	                        if (event.target.nodeName == 'SELECT') {
	                            event.stopPropagation();
	                            return false;
	                        }
	                        setupLabel();
	                    });
	                    setupLabel();
	                    //end TODO
	                    initListeners();
	                });
	            });
	            handleEnableSelectToSearchBoxLabel();



	            messages.sendSysReq("getToolbarDirection", "options.js", "(@:", function (response) {
	                var objData = JSON.parse(response);

	                dir = objData.dialogsDirection.toLowerCase();
	                if (dir == 'rtl')
	                    $('body').addClass('rtl');

	                if (!objData.myStuffEnabled) {
	                    $('#myApps').parent().hide();
	                }

	                if (configData) {
	                    if (/false/i.test(configData.showContactUsLink)) {
	                        $('#contactUsLink').parent().hide();
	                    }
	                }


	                if (generalData.optionsDialog && generalData.optionsDialog.tabsVisibilityState) {
	                    if (/false/i.test(generalData.optionsDialog.tabsVisibilityState.personalComp)) {
	                        $('#personalApps').parent().hide();
	                    }

	                    if (/false/i.test(generalData.optionsDialog.tabsVisibilityState.predefined)) {
	                        $('#predefinedComponents').parent().hide();
	                        if (/false/i.test(generalData.optionsDialog.tabsVisibilityState.personalComp)) {
	                            if (!objData.myStuffEnabled) {
	                                $('#search').click();
	                            }
	                            else {
	                                $('#myApps').click();
	                            }
	                        }
	                        else {
	                            $('#personalApps').click();
	                        }
	                    }
	                }

	                if (($.browser.msie) && (parseInt($.browser.version, 10) <= 8) && dir === 'rtl') {

	                    $('nav').addClass('rtl');
	                    $('p').addClass('rtl');
	                    $('#toolbarOptions').addClass('rtl');
	                    $('#header-content-wrapper').addClass('rtl');
	                    $('#header-close').addClass('rtl');
	                    $('#content-wrapper').addClass('rtl');
	                    $('.webApp-settings-img-wrapper').addClass('rtl');
	                    $('.webApp-settings-name').addClass('rtl');
	                    $('.webApp-settings-button-wrapper').addClass('rtl');
	                    $('#footer-button-ok').addClass('rtl');
	                    $('#footer-button-cancel').addClass('rtl');
	                    $('#toolbar-version').addClass('rtl');
	                    $('#toolbar-icon-wrapper').addClass('rtl');
	                    $('.search-elementsWrapper').addClass('rtl');
	                    $('.label_check').addClass('rtl');
	                    $('.notifications').addClass('rtl');
	                    $('#notifications-list').addClass('rtl');
	                    $('.footer-icon-and-version').addClass('rtl');
	                    $('.webApp-settings-main-li').addClass('rtl');
	                    $('.combo-main').addClass('rtl');
	                    $('#cb-notify-me-about-settings-change').addClass('rtl');
	                } //if
	            });

	        }
	        catch (e) {
	            conduit.coreLibs.logger.logError('Failed to render toolbar options dialog.', { className: "options.view", functionName: "renderAll" }, { error: e });
	            close();
	        }
	    } // end renderAll

	    function handleEnableSelectToSearchBoxLabel() {
	        //handle selectToSearchBox 
	        if (searchApp) {
	            var selectToSearchBox = searchApp.data && searchApp.data.selectToSearchBox
	            if (selectToSearchBox) {
	                if (/false/i.test(selectToSearchBox.enabled)) {
	                    $('#selectToSearchBoxEnabled').parent().hide();
	                }
	                else {
	                    var isSelectToSearchBoxEnabledByUserResult = conduit.abstractionlayer.commons.repository.getKey(ctid + ".selectToSearchBoxEnabledByUser");
	                    if (!isSelectToSearchBoxEnabledByUserResult || isSelectToSearchBoxEnabledByUserResult.status) { //only if this option wasn't updated manually by the user update it.
	                        var isSelectToSearchBoxEnabledResult = conduit.abstractionlayer.commons.repository.getKey(ctid + ".selectToSearchBoxEnabled");
	                        var isSelectToSearchBoxEnabled = ((isSelectToSearchBoxEnabledResult && !isSelectToSearchBoxEnabledResult.status) ? isSelectToSearchBoxEnabledResult.result === 'true' : true);
	                        if (/false/i.test(selectToSearchBox['default']) && !isSelectToSearchBoxEnabled) {
	                            $('#selectToSearchBoxEnabled').attr('checked', false);
	                        }
	                    }
	                }
	            }
	        }
	    }
	    //function that returns default icons for personal components.
	    function getDefaultIconByAppType(appType) {
	        var src = {
	            "EMAIL_NOTIFIER": 'http://emailnotifier.webapps.conduitapps.com/icn/app_button_icon.png',
	            "WEATHER": "http://weather.webapps.conduitapps.com/24x24/33.png"
	        }
	        return src[appType] ? src[appType] : undefined;
	    }

	    function renderAppsListPanel(appsData, panelId, isSelected, renderPersonalApps) {
	        return $("#appsListPanelTemplate").tmpl(
                { id: panelId, appsData: appsData },
                {
                    texts: {
                        hide: translation.CTLP_STR_ID_OPTIONS_DLG_HIDE_COMPONENT_BUTTON,
                        show: translation.CTLP_STR_ID_OPTIONS_DLG_SHOW_COMPONENT_BUTTON,
                        remove: translation.CTLP_STR_ID_OPTIONS_DLG_REMOVE_COMPONENT_BUTTON
                    },
                    isSelected: isSelected,
                    renderPersonalApps: renderPersonalApps,
                    isAppDisabled: function (appData) {
                        var options = appOptions[appData.appId];
                        if (appData.isPersonalApp && (!options || options.render !== true) && !appData.isAlsoPublisherApp)
                            return true;

                        return options && options.disabled === true;
                    }
                }
            ).prependTo($contentWrapper);
	    }

	    function isValidServiceResponse(response) {
	        return (response && response.service && response.method) ? true : false;
	    }

	    function handleServiceResponseValue(response) {
	        if (isValidServiceResponse(response)) {
	            switch (response.service) {
	                case "translation":
	                    translationResponse = response.returnValue;
	                    break;
	                case "userApps":
	                    mystuffAppsData = response.returnValue;
	                    break;
	                case "toolbarSettings":
	                    if (response.method == "getAppsData") {
	                        appsData = response.returnValue;
	                    }
	                    else if (response.method == "getPersonalAppsData") {
	                        personalAppsData = response.returnValue;
	                    }
	                    else if (response.method == "getSettingsData") {
	                        settingsData = response.returnValue;
	                    }
	                    else if (response.method == "getConfiglData") {
	                        configData = response.returnValue;
	                    }
	                    else if (response.method == "getGeneralData") {
	                        generalData = response.returnValue;
	                    }
	                    break;
	                case "searchAPI":
	                    searchAPIResponse = response.returnValue;
	                    break;
	                case "login":
	                    loginData = response.returnValue;
	                    break;
	            }
	        }
	    }

	    /**
	    @function
	    @description: asking the appManager model for all models
	    */
	    function init() {

	        appOptions = conduit.coreLibs.config.getAppOptions();
	        conduit.coreLibs.logger.logDebug('Got app options for toolbar options: ' + JSON.stringify(appOptions), { className: "options.view", functionName: "init" });
	        //asking serviceLayer for relevant translation data, apps, searchApi and general settings data
	        var serviceRequestArray = [
                { service: "translation", method: "getTranslationByRegex", data: ["^CTLP_STR_ID", "CELP_STR_ID_ENGINE", "^CELP_STR", "^SB_OPTIONS"] },
                { service: "userApps", method: "getAppsData" },
                { service: "toolbarSettings", method: "getAppsData" },
                { service: "toolbarSettings", method: "getPersonalAppsData" },
                { service: "toolbarSettings", method: "getSettingsData" },
                { service: "toolbarSettings", method: "getConfiglData" },
                { service: "toolbarSettings", method: "getGeneralData" },
                { service: "searchAPI", method: "getSearchAPI" }
            ];

	        messages.sendSysReq("serviceLayer", "options", JSON.stringify(serviceRequestArray), function (responseData) {
	            try {
	                if (responseData) {
	                    responseData = JSON.parse(responseData);
	                    if (responseData instanceof Array) {
	                        for (var i = 0; i < responseData.length; i++) {
	                            var serviceRsponse = responseData[i];
	                            handleServiceResponseValue(serviceRsponse);
	                        }
	                    }

	                    if (translationResponse) {
	                        // if we get valid response object we use it.
	                        // otherwise we have the fallback  translation object.
	                        // if we get something in the translation response object
	                        if (!$.isEmptyObject(translationResponse)) {

	                            // we check if all keys are valid.
	                            for (var key in translation) {

	                                // if not exist or empty string
	                                if (!translationResponse[key]) {

	                                    // if we have this specific key in our fallback translation object 
	                                    // we set it to the fallback value.
	                                    translationResponse[key] = translation[key];
	                                }
	                            }
	                            // attach the result to the global variable
	                            translation = translationResponse;
	                            translation['CTLP_STR_ID_ABOUT_TOOLBAR_POWERED_BY'] = translation['CTLP_STR_ID_ABOUT_TOOLBAR_POWERED_BY'].replace(/\s*Conduit\s*/gi, '');
	                        }
	                    }

	                    // toolbar settings
	                    if (settingsData) {
	                        if (settingsData.generalData) {
	                            actingCtid = settingsData.generalData.actingCt;
	                        }
	                        toolbarLogo = (settingsData.apps && settingsData.apps[0] && settingsData.apps[0].displayIcon) ? settingsData.apps[0].displayIcon : "";
	                    }
	                }

	                titlesTranslations = {

	                    predefinedComponents: {
	                        title: translation.CTLP_STR_ID_OPTIONS_DLG_BUILT_IN_APPS_TAB_TITLE,
	                        subtitle: translation.CTLP_STR_ID_OPTIONS_DLG_BUILT_IN_APPS_TAB_DESCRIPTION
	                    },
	                    myApps: {
	                        title: translation.CELP_STR_ID_ENGINE_OPTIONS_DLG_COMPONENTS_HEADING,
	                        subtitle: translation.CTLP_STR_ID_OPTIONS_DLG_MY_APPS_TAB_DESCRIPTION
	                    },
	                    personalApps: {
	                        title: translation.CTLP_STR_ID_OPTIONS_DLG_RECOMMENDED_APPS_TAB_TITLE,
	                        subtitle: translation.CTLP_STR_ID_OPTIONS_DLG_RECOMMENDED_APPS_TAB_DESCRIPTION
	                    },
	                    search: {
	                        title: translation.SB_OPTIONS_SEARCH,
	                        subtitle: translation.CTLP_STR_ID_OPTIONS_DLG_SEARCH_TAB_DESCRIPTION
	                    },
	                    notifications: {
	                        title: translation.CTLP_STR_ID_OPTIONS_DLG_NOTIFICATION_TITLE,
	                        subtitle: translation.CTLP_STR_ID_OPTIONS_DLG_NOTIFICATION_DESCRIPTION
	                    },
	                    advancedSettings: {
	                        title: translation.CTLP_STR_ID_OPTIONS_DLG_ADVANCED_SETTINGS_TAB_TITLE,
	                        subtitle: translation.CTLP_STR_ID_OPTIONS_DLG_ADVANCED_SETTINGS_TAB_DESCRIPTION
	                    },
	                    help: {
	                        title: translation.CTLP_STR_ID_OPTIONS_DLG_HELP_TAB_TITLE, //TODO LMS
	                        subtitle: translation.CTLP_STR_ID_OPTIONS_DLG_HELP_TAB_DESCRIPTION//TODO LMS
	                    },
	                    about: {
	                        title: translation.CTLP_STR_ID_OPTIONS_DLG_ABOUT_TAB_TITLE//TODO LMS
	                    }
	                };

	                renderAll();
	                initDefaults();
	            }
	            catch (e) {
	                conduit.coreLibs.logger.logError('Failed to initialize toolbar options dialog.', { className: "options.view", functionName: "init" }, { error: e });
	                close();
	            }

	        });

	    } // end init

	    function initDefaults() {

	        //event listener for all disable/enable and remove clicks.
	        $contentWrapper.delegate("li", "click", function (event) {
	            event.preventDefault();
	            var $element = $(event.target);

	            //mark the last clicked element
	            $('#' + webAppSelectedElemntId).removeClass('webApp-settings-selected-li');

	            webAppSelectedElemntId = $element.attr('id');
	            //click on text
	            if (!webAppSelectedElemntId && ($element.attr('class') == "webApp-settings-name"))
	                webAppSelectedElemntId = $element.parent().attr('id');
	            //click on icon
	            if (!webAppSelectedElemntId && ($element.attr('class') == "webApp-settings-icon"))
	                webAppSelectedElemntId = $element.parent().parent().attr('id');

	            if ($element.get(0).nodeName.toLowerCase() != 'select'
                    && $element.get(0).nodeName.toLowerCase() != 'option') {
	                $('#' + webAppSelectedElemntId).addClass('webApp-settings-selected-li');
	            }


	            var appGuid = $element.attr('data-appGuid');
	            var appClientGuid = $element.attr('data-appClientGuid');
	            //the user has clicked the remove icon.
	            if ($element.data('action') === 'remove') {

	                //get data form the clicked element.
	                var appId = this.id;

	                //update the appOptions object. 
	                if (!appChanges[appId]) {
	                    appChanges[appId] = {};
	                }

	                appChanges[appId].disabled = true;
	                appChanges[appId].isToRemove = true;
	                appChanges[appId].appGuid = appGuid;
	                appChanges[appId].appId = appId;
	                appChanges[appId].appClientGuid = appClientGuid;

	                //update flag.
	                userAction = true;

	                //hide the the app row from the ui.
	                $(this).slideUp(initScrollpane);

	                //when removing an app, we don't need the following code.
	                return;
	            }

	            //check if click on hide/show button
	            if ($element.hasClass("webApp-settings-button-white-border")) {
	                var appId = this.id,
					        $appListItem = $(this),
					        $button = $(".webApp-settings-button-white-border", $appListItem),
					        isDisabled = $appListItem.hasClass("disable");

	                //update the appOptions object. 
	                if (!appChanges[appId]) {
	                    appChanges[appId] = {};
	                }

	                var options = appOptions[appId];
	                var isPersonalApp = $appListItem.attr("data-personalapp") ? true : false;
	                var appType = $appListItem.attr("data-appType");
	                if (isDisabled) {
	                    $appListItem.removeClass("disable");
	                    $button.text(translation.CTLP_STR_ID_OPTIONS_DLG_HIDE_COMPONENT_BUTTON);
	                    if ((options && options.disabled) || appChanges[appId].disabled)
	                        appChanges[appId].disabled = false;

	                    if ($appListItem.attr("data-renderView")) {
	                        appChanges[appId].render = true;
	                    }

	                    if (isPersonalApp) {
	                        if (!options) {
	                            options = appChanges[appId] = { render: true };
	                        }
	                    }
	                }
	                else {
	                    $appListItem.addClass("disable");
	                    $button.text(translation.CTLP_STR_ID_OPTIONS_DLG_SHOW_COMPONENT_BUTTON);
	                    if (!options)
	                        options = appChanges[appId] = {};
	                    if ($appListItem.attr("data-renderView")) {
	                        appChanges[appId].render = true;
	                    }
	                    appChanges[appId].disabled = true;
	                }

	                appChanges[appId].appGuid = appGuid;
	                appChanges[appId].appClientGuid = appClientGuid;
	                appChanges[appId].isPersonalApp = isPersonalApp;
	                appChanges[appId].appType = appType;
	                //data-appType
	                userAction = true;
	                //repositoryObj.apps[appId] = String(!isDisabled);
	            }
	        });

	        // For Advanced settings:
	        isAppPrivacy = 'false';
	        var isEnableAllDialogs = repository.getLocalKey("isEnableAllDialogs");
	        if (isEnableAllDialogs) {
	            var isChecked = isEnableAllDialogs.data == 'true';
	            if (isChecked) {
	                $('#as-privacy').attr('checked', true);
	                isAppPrivacy = 'true';
	            }
	        }
	        tbOptions.advanced.appPrivacy = isAppPrivacy;

	        // search protector
	        if (/true/i.test(configData.noSearchTakeovers)) {
	            $('#settingsChange-container').hide()
	        }
	        var notifyChangesWithSearchProtector = repository.getLocalKey("searchProtector.notifyChanges");
	        var notifyChangesState = true;
	        if (notifyChangesWithSearchProtector) {
	            notifyChangesState = notifyChangesWithSearchProtector.data == 'true' ? true : false;
	        }

	        var policy = repository.getLocalKey("searchProtector.showDialogPolicy");
	        showDialogPolicy = "periodically";
	        if (policy && policy.data) {
	            showDialogPolicy = /everytime/i.test(policy.data) ? "everytime" : showDialogPolicy;
	        }
	        $('#settings-change').attr('checked', notifyChangesState);
	        notifyChanges = (notifyChangesState) ? "true" : "false";
	        tbOptions.advanced.notifyChanges = notifyChanges;
	        tbOptions.advanced.policy = showDialogPolicy;
	        $('#cb-notify-me-about-settings-change').val(showDialogPolicy);



	        // search in new tab
	        searchInNewTab = 'false';
	        var isSearchInNewTabEnabledResult = conduit.abstractionlayer.commons.repository.getKey(ctid + ".searchInNewTabEnabledByUser");
	        var isSearchInNewTabEnabled = ((isSearchInNewTabEnabledResult && !isSearchInNewTabEnabledResult.status) ? isSearchInNewTabEnabledResult.result === 'true' : true);
	        $('#search-in-new-tab').attr('checked', isSearchInNewTabEnabled);
	        searchInNewTab = isSearchInNewTabEnabled ? 'true' : 'false';
	        tbOptions.advanced.searchInNewTab = searchInNewTab;

	        var newTabEnabled;
	        if (searchAPIResponse && searchAPIResponse.NewTab) {
	            newTabEnabled = searchAPIResponse.NewTab.IsEnabled;
	        }
	        if (!newTabEnabled) {
	            $('#search-in-new-tab').parent().hide();
	        }
            var isChrome = /Chrome/i.test(conduit.abstractionlayer.commons.environment.getBrowserInfo().result.type);
            if (isChrome){
              $('#search-NT-Container').hide();
            }
	        // check if this feature is even available in this toolbar.
	        var is404Available = configData && configData["is404Enabled"];
	        is404Available = (typeof is404Available == 'undefined') ? true : is404Available;
	        // if not available, we hide the div.
	        if (!is404Available) {
	            $('#as-404').parent().hide();
	        }
	        else {
	            // this feature is available in this toolbar, we need to check if the checkbox state.
	            var is404Checked = conduit.abstractionlayer.commons.repository.getKey(ctid + ".fixPageNotFoundErrorByUser");
	            var strToBool = is404Checked.status ? true : !/false/i.test(is404Checked.result);
	            // check box state is checked, we mark it as checked.
	            if (strToBool) {
	                $('#as-404').attr('checked', true);
	            }
	            fixPageNotFoundError = strToBool ? 'true' : 'false';
	            tbOptions.advanced.fixPageNotFoundError = fixPageNotFoundError;
	        }


	        var enableSearchFromAddressBarCheckBox = false;
	        var hideSearchFromAddressBarCheckBox = true;

	        if (isFF && !/true/i.test(configData.noSearchTakeovers)) {
	            if (parseInt(browserInfo.version.split(".")[0]) > 22) {
	                $('#address-bar-div').hide();
	            }
	            var selectedCTIDResponse = conduit.abstractionlayer.commons.repository.getKey(conduit.utils.consts.GLOBAL.SELECTED_CTID); //Smartbar.keywordURLSelectedCTID 
	            if (selectedCTIDResponse && !selectedCTIDResponse.status) {
	                var selectedCTID = selectedCTIDResponse.result;
	                if (selectedCTID == ctid) {
	                    // if Smartbar.keywordURLSelectedCTID is my ctid, I will mark the checkbox.
	                    enableSearchFromAddressBarCheckBox = true;
	                }
	            }

	            $('#address-bar').attr('checked', enableSearchFromAddressBarCheckBox);
	            searchFromAddressBar = enableSearchFromAddressBarCheckBox ? 'true' : 'false';
	            tbOptions.advanced.searchFromAddressBar = searchFromAddressBar;

	            // check if this feature is even available in this toolbar.
	            var isSuggestAvailable = configData && configData["enableSearchSuggestFromAddress"];
	            isSuggestAvailable = (typeof isSuggestAvailable == 'undefined') ? true : isSuggestAvailable;
	            // if not available, we hide the div.
	            if (!isSuggestAvailable) {
	                $('#search-suggest-div').hide();
	            }
	            var isSearchSuggestEnabledResult = conduit.abstractionlayer.commons.repository.getKey(ctid + ".searchSuggestEnabledByUser");
	            var isSearchSuggestEnabled = ((isSearchSuggestEnabledResult && !isSearchSuggestEnabledResult.status) ? /true/i.test(isSearchSuggestEnabledResult.result) : true);
	            $('#search-suggest').attr('checked', isSearchSuggestEnabled);
	            searchSuggest = isSearchSuggestEnabled ? 'true' : 'false';
	            tbOptions.advanced.searchSuggest = searchSuggest;
	        }
	        else {
	            $('#address-bar-div').hide();
	            $('#search-suggest-div').hide();
	        }


	        var isSendUsage = conduit.abstractionlayer.commons.repository.getKey(ctid + ".sendUsageEnabled");
	        if (!isSendUsage.status) {
	            isSendUsage = (isSendUsage.result != 'false');
	        }
	        else {
	            isSendUsage = true;
	        }
	        $('#send-usage').attr('checked', isSendUsage);
	        sendUsageStatistics = isSendUsage ? 'true' : 'false';
	        tbOptions.advanced.sendUsageStatistics = sendUsageStatistics;

	        // start checking keys.
	        toolbarVisibility = 'false';
	        toolbarVisibilityDaysInterval = $('#cb-toolbarVisibility').val();
	        var oIsAutoShowEnabled = conduit.abstractionlayer.commons.repository.getKey(ctid + ".autoShowEnabled");
	        if (oIsAutoShowEnabled && !oIsAutoShowEnabled.status) {
	            var strToBool = /true/i.test(oIsAutoShowEnabled.result);

	            // check box state, if true, we mark it as checked.
	            if (strToBool) {
	                toolbarVisibility = "true";

	                // set checkbox value.
	                $('#as-toolbarVisibility').attr('checked', true);
	            }

	            // check the days value in the combo box.
	            var oIsAutoShowInterval = conduit.abstractionlayer.commons.repository.getKey(ctid + ".autoShowInterval");
	            if (oIsAutoShowInterval && !oIsAutoShowInterval.status) {
	                toolbarVisibilityDaysInterval = oIsAutoShowInterval.result;
	                var days = parseInt(toolbarVisibilityDaysInterval, 10);

	                // set the days value in the ui.
	                $('#cb-toolbarVisibility').val(days);
	            }

	        }
	        tbOptions.advanced.toolbarVisibility = toolbarVisibility;
	        tbOptions.advanced.toolbarVisibilityDaysInterval = toolbarVisibilityDaysInterval;

	        $('#content_advancedSettings').find('input[type="checkbox"]').click(function () {
	            userAction = true;

	            var isChecked = $(this).is(':checked');

	            switch ($(this).attr('id')) {
	                case "as-privacy":
	                    tbOptions.advanced.appPrivacy = (isChecked) ? "true" : "false";
	                    break;
	                case "settings-change":
	                    tbOptions.advanced.notifyChanges = (isChecked) ? "true" : "false";
	                    break;
	                case "search-in-new-tab":
	                    tbOptions.advanced.searchInNewTab = (isChecked) ? "true" : "false";
	                    break;
	                case "as-404":
	                    tbOptions.advanced.fixPageNotFoundError = (isChecked) ? "true" : "false";
	                    break;
	                case "as-toolbarVisibility":
	                    tbOptions.advanced.toolbarVisibility = (isChecked) ? "true" : "false";
	                    break;
	                case "address-bar":
	                    tbOptions.advanced.searchFromAddressBar = (isChecked) ? "true" : "false";
	                    break;
	                case "search-suggest":
	                    tbOptions.advanced.searchSuggest = (isChecked) ? "true" : "false";
	                    break;
	                case "send-usage":
	                    tbOptions.advanced.sendUsageStatistics = (isChecked) ? "true" : "false";
	                    break;
	            }
	        });

	        // user click for help page
	        $('#helpLink').click(function () {
	            close({ openHelpPage: true });
	        });

	        // user click for help page
	        $('#contactUsLink').click(function () {
	            close({ openContactUsPage: true });
	        });

	        // user click for help page
	        $('#privacyLink').click(function () {
	            close({ openPrivacyPage: true });
	        });

	        // user click for help page
	        $('#EULALink').click(function () {
	            close({ openEULAPage: true });
	        });

	        // toolbar visibility checkbox option. show only in ie.
	        if (window.ActiveXObject) {
	            $('#toolbarVisibility-container').show();
	        }

	        //search settings - not in chrome
	        if (isChrome) {
	            $('#settingsChange-container').hide();
	        }
	    } // end initDefaults

	    /**
	    @function
	    @description: this function sends the updated data to the model
	    after clicking the OK button.
	    @param: {object} obj
	    */
	    function notifyModel(obj) {
	        messages.sendSysReq("handleOptions", "options", JSON.stringify(obj), function (response) { });
	    }

	    /**
	    @function
	    @description: when clicking 'OK' this function prepare the data before sending it to the model.
	    */
	    function save() {
	        var additionalUsageInfo = { pages: {} };
	        conduit.coreLibs.config.setAppOptions($.extend(true, appOptions, appChanges));
	        repositoryObj.apps = appChanges;

	        tbOptions.advanced.policy = $("#cb-notify-me-about-settings-change").val();

	        if (userAction) {
	            var sendUsages = false;
	            var sendAdvancedUsages = false;
	            var advancedProperties = {};
	            // Apps pages
	            if (appChanges) {
	                var appsProperties = {};
	                var sendAppsUsage = false;
	                var app;
	                for (var appId in appChanges) {
	                    sendAppsUsage = true;
	                    appsProperties[appId] = {};
	                    app = appChanges[appId];
	                    appsProperties[appId].action = app.isToRemove ? 'remove' : app.disabled ? 'hide' : 'show';
	                    if (app.appGuid) {
	                        appsProperties[appId].appGuid = app.appGuid;
	                    }
	                    if (app.appClientGuid) {
	                        appsProperties[appId].appClientGuid = app.appClientGuid;
	                    }
	                    if (app.isPersonalApp) {
	                        appsProperties[appId].isPersonalApp = app.isPersonalApp;
	                        appsProperties[appId].appType = app.appType;
	                    }

	                }
	                if (sendAppsUsage) {
	                    additionalUsageInfo.pages.apps = appsProperties;
	                    sendUsages = true;
	                }
	            }

	            // Search page
	            if (repositoryObj.search) {
	                var searchProperties = {};
	                var sendSearchUsage = false;
	                var value;
	                for (var key in repositoryObj.search) {
	                    value = /true/i.test(repositoryObj.search[key]) ? 'true' : 'false';
	                    if (key == 'ENABALE_HISTORY') { // I cannot live with this spelling error... so I converted it.
	                        searchProperties.enableHistory = value;
	                    }
	                    else {
	                        searchProperties[key] = value;
	                    }
	                    sendSearchUsage = true;
	                }
	                if (sendSearchUsage) {
	                    additionalUsageInfo.pages.search = searchProperties;
	                    sendUsages = true;
	                }
	            }

	            //Notifications
	            if (Notifications.isSettingsChanged() && Notifications.getNotificationSettings() && tbOptions.notifications) {
	                var previousSettings = tbOptions.notifications;
	                var notificationSettings = Notifications.getNotificationSettings();
	                var changedSettings = [];
	                var sendNotificationsUsage = false;

	                for (index in notificationSettings) {
	                    if (JSON.stringify(notificationSettings[index]) != JSON.stringify(previousSettings[index])) {
	                        changedSettings.push(notificationSettings[index]);
	                        sendNotificationsUsage = true;
	                    }
	                }

	                if (sendNotificationsUsage) {
	                    additionalUsageInfo.pages.notificationSettings = changedSettings;
	                    sendUsages = true;
	                }
	            }

	            //Advances page
	            if (tbOptions.advanced.appPrivacy !== isAppPrivacy) {
	                //if the user click the "Always ask me about apps privacy" checkbox, we will update the repository
	                repository.setLocalKey("isEnableAllDialogs", tbOptions.advanced.appPrivacy);
	                advancedProperties.appPrivacy = tbOptions.advanced.appPrivacy;
	                sendAdvancedUsages = true;
	            }

	            if (tbOptions.advanced.notifyChanges !== notifyChanges) {
	                messages.sendSysReq("applicationLayer.searchProtectorManager.notifyChanges", "options.view", tbOptions.advanced.notifyChanges, function () { });
	                repository.setLocalKey("searchProtector.notifyChanges", tbOptions.advanced.notifyChanges);
	                advancedProperties.notifyChanges = tbOptions.advanced.notifyChanges;
	                sendAdvancedUsages = true;
	            }

	            if (tbOptions.advanced.policy !== showDialogPolicy) {
	                var message = /periodically/i.test(tbOptions.advanced.policy) ? "periodically" : "everytime";
	                messages.sendSysReq("applicationLayer.searchProtectorManager.showDialogPolicy", "options.view", message, function () { });
	                repository.setLocalKey("searchProtector.showDialogPolicy", tbOptions.advanced.policy); // this means it changed by user.
	                advancedProperties.showDialogPolicy = tbOptions.advanced.policy;
	                sendAdvancedUsages = true;
	            }

	            if (tbOptions.advanced.searchInNewTab !== searchInNewTab) {
	                conduit.abstractionlayer.commons.repository.setKey(ctid + ".searchInNewTabEnabledByUser", tbOptions.advanced.searchInNewTab);
	                messages.sendSysReq('enableNewTab', 'option.js', tbOptions.advanced.searchInNewTab, function (response) { });
	                advancedProperties.searchInNewTab = tbOptions.advanced.searchInNewTab;
	                sendAdvancedUsages = true;
	            }

	            if (tbOptions.advanced.searchFromAddressBar !== searchFromAddressBar) {
	                conduit.abstractionlayer.commons.repository.setKey(ctid + ".searchFromAddressBarEnabledByUser", tbOptions.advanced.searchFromAddressBar);
	                var params = {};
	                var message;
	                if (tbOptions.advanced.searchFromAddressBar == "true") {
	                    params = { forceTakeOver: true };
	                    message = { method: "takeOverSearchAddressUrl", data: params };
	                }
	                else if (tbOptions.advanced.searchFromAddressBar == "false") {
	                    message = { method: "disableSearchAddressUrl", data: params };
	                }
	                notifyModel(message);

	                advancedProperties.searchFromAddressBar = tbOptions.advanced.searchFromAddressBar;
	                sendAdvancedUsages = true;
	            }

	            if (tbOptions.advanced.searchSuggest !== searchSuggest) {
	                conduit.abstractionlayer.commons.repository.setKey(ctid + ".searchSuggestEnabledByUser", tbOptions.advanced.searchSuggest);
	                var params = {};
	                var message = { method: "enableSearchSuggest", data: (/true/i.test(tbOptions.advanced.searchSuggest)) };
	                notifyModel(message);

	                advancedProperties.searchSuggest = tbOptions.advanced.searchSuggest;
	                sendAdvancedUsages = true;
	            }

	            if (tbOptions.advanced.sendUsageStatistics !== sendUsageStatistics) {
	                conduit.abstractionlayer.commons.repository.setKey(ctid + ".sendUsageEnabled", tbOptions.advanced.sendUsageStatistics);
	                advancedProperties.sendUsageStatistics = tbOptions.advanced.sendUsageStatistics;
	                sendAdvancedUsages = true;
	            }

	            // check if we have any string value from the 404 checkbox.
	            if (tbOptions.advanced.fixPageNotFoundError !== fixPageNotFoundError) {
	                conduit.abstractionlayer.commons.repository.setKey(ctid + ".fixPageNotFoundErrorByUser", tbOptions.advanced.fixPageNotFoundError);

	                if (tbOptions.advanced.fixPageNotFoundError === 'true') {
	                    repositoryObj.pageNotFoundEnabled = true;
	                }
	                else {
	                    repositoryObj.pageNotFoundEnabled = false;
	                }

	                advancedProperties.fixPageNotFoundError = tbOptions.advanced.fixPageNotFoundError;
	                sendAdvancedUsages = true;
	            }

	            // toolbar visibility checkbox option for ie only.
	            if (tbOptions.advanced.toolbarVisibility !== toolbarVisibility) {
	                conduit.abstractionlayer.commons.repository.setKey(ctid + ".autoShowEnabled", tbOptions.advanced.toolbarVisibility);
	                if (tbOptions.advanced.toolbarVisibility === 'true') {
	                    // set the days value from the days combo box.
	                    var nDaysInterval = $('#cb-toolbarVisibility').val();
	                    conduit.abstractionlayer.commons.repository.setKey(ctid + ".autoShowInterval", nDaysInterval);
	                }
	                advancedProperties.toolbarVisibility = tbOptions.advanced.toolbarVisibility;
	                sendAdvancedUsages = true;
	            }

	            if (tbOptions.advanced.toolbarVisibilityDaysInterval !== toolbarVisibilityDaysInterval) {
	                if (tbOptions.advanced.toolbarVisibility === 'true') {
	                    // set the days value from the days combo box.
	                    conduit.abstractionlayer.commons.repository.setKey(ctid + ".autoShowInterval", tbOptions.advanced.toolbarVisibilityDaysInterval);
	                }
	                advancedProperties.toolbarVisibilityDaysInterval = tbOptions.advanced.toolbarVisibilityDaysInterval;
	                sendAdvancedUsages = true;
	            }

	            if (sendAdvancedUsages) {
	                additionalUsageInfo.pages.advanced = advancedProperties;
	                sendUsages = true;
	            }


	            if (sendUsages) {
	                sendToolbarOptionsUsage(additionalUsageInfo);
	            }

	        }

	        var obj = {
	            method: "update",
	            data: repositoryObj
	        };

	        notifyModel(obj);

	        //store notification settings
	        Notifications.save();
	    }

	    function sendToolbarOptionsUsage(additionalUsageInfo) {
	        var usageObject = { actionType: "OPTIONS_BUTTON_CLOSE", additionalUsageInfo: additionalUsageInfo };

	        var message = { method: "sendUsage", data: usageObject };
	        messages.sendSysReq("handleOptions", "toolbarOptions", JSON.stringify(message), function (response) { });
	    }

	    /**
	    @function
	    @description: when clicking 'CANCEL' this function just notify the model.
	    */
	    function close(data) {
	        var obj = {
	            method: "close",
	            data: {}
	        };
	        if (data) {
	            obj.data = data;
	        }
	        notifyModel(obj);
	    }
	    /**
	    @function
	    @description: after each click on the show/hide button, we 
	    add to the repositoryObj.apps obj a property which is the app id and a value true/false 
	    @param: {jQueryObj} jQuery LI object . 
	    */
	    function update(jQueryObj) {
	        var elem = jQueryObj[0],
			appId = elem.id,
			state = (elem.className.split(" ")[1] == "disable") ? "false" : "true";

	        repositoryObj.apps[appId] = state;
	    }
	    /**
	    @function
	    @description: general listeners on the page.
	    */
	    function initListeners() {

	        var $myAppsUserMsg = $('#myAppsUserMsg'),
                $contentMyApps = $('#content_myApps');

	        //listener for left navigator
	        $('nav').find('li').click(function () {
	            var panelId = $(this).find('.clickable').attr('id'),
					translations = titlesTranslations[panelId];

	            $("nav ul li").not(this).removeClass('selected');
	            $(this).addClass('selected');

	            //marker handling
	            $("nav ul li .marker").not(this).removeClass('markSelected');
	            $(this).find('.marker').addClass('markSelected');

	            $(".selectedPanel").removeClass("selectedPanel");
	            $("#content_" + panelId).addClass("selectedPanel");

	            // when clicking the 'My Apps' tab, if we dont have apps to 
	            // display, we display a default message.
	            if (/myapps/i.test(panelId)) {

	                if ($contentMyApps.find('ul').children('li').length === 0) {
	                    $myAppsUserMsg.show();
	                } else {
	                    $myAppsUserMsg.hide();
	                }
	            } else {
	                $myAppsUserMsg.hide();
	            }

	            $h3.text(translations.subtitle || "");

	            if (/about/i.test(panelId)) {
	                $("#contentHeader").hide();
	            }
	            else {
	                $("#contentHeader").show();
	            }

	            initScrollpane();
	        });

	        //save data
	        $("#footer-button-ok").click(function () {
	            var callback = (userAction) ? save : close;
	            animate(callback);
	        });

	        //cancel and close popup
	        $("#footer-button-cancel, #header-close").click(function () {
	            animate(close);
	        });

	        // user click for market place page when no user apps are in options.
	        $('#myAppsUserMsg').find('a').click(function () {
	            close({ openMarketPlacePage: true });
	        });

	        /**
	        @sendSysReq
	        @description: after all javascript has run, we tell the model to resize the popup,
	        then we make more calculation for the headers elements.
	        */
	        messages.sendSysReq("handleOptions", "options", JSON.stringify({ method: "resize" }), function () {

	            var $nav = $('nav'),
				$page = $('#page'),
				$sectionWidth = $page.width() - $nav.width();

	            $('section').css('width', $sectionWidth - 30);
	            $('h3').css({
	                'width': $sectionWidth - 60,
	                'display': 'block'
	            });
	        });

	    }

	    function animate(callback) {
	        callback();
	    }

	    init();
	})();

    ///////////
    //SEARCH///
    ///////////
    var Search = (function () {

        function init() {
            //run on the search section and check each checkbox value in repository
            //and update checkbox UI
            $('#content_search input[type="checkbox"]').each(function (index) {
                var checkbox = $(this),
			    key = this.id,
			    isData = repository.getLocalKey(key);
                    if (isData) {
                        var isChecked = isData.data,
					    strToBool = isData.data == "true";

                        if (strToBool) {
                            checkbox.attr('checked', true);
                        }
                    }

            });
            //finally call some listeners
            initListeners();
        }

        function initListeners() {
            //each click will update the repositoryObj.search obj
            $('#content_search').find('input[type="checkbox"]').click(function () {

                userAction = true;

                var isChecked = $(this).is(':checked'),
				key = this.id;

                repositoryObj.search[key] = isChecked;
            });

        }

        function showPage() {
            //update header section
            currentPageDisplayed.fadeOut(100, function () {
                $h3.text("");

                $('#content_search').show();
            });

            //update the global var for the current page displayed
            currentPageDisplayed = $('#content_search');
        }

        init();
        //initListeners();

        return {
            showPage: showPage
        }
    })();

    /////////////////////
    //ADVANCED SETTINGS//
    /////////////////////

    var AdvancedSettings = (function () {

        $("select#cb-toolbarVisibility").change(function () {
            userAction = true;
            tbOptions.advanced.toolbarVisibilityDaysInterval = $(this).val();
        });

        $("select#cb-notify-me-about-settings-change").change(function () {
            userAction = true;
            tbOptions.advanced.policy =  $(this).val();
        });


        function showPage() {
            //update header section
            currentPageDisplayed.fadeOut(100, function () {
                $h3.text(translation.CTLP_STR_ID_OPTIONS_DLG_ADVANCED_SETTINGS_TAB_DESCRIPTION);

                $('#content_advancedSettings').show();
            });



        }
        return {
            showPage: showPage
        }
    })();

    /////////////////////
    //HELP//
    /////////////////////

    var Help = (function () {

        function showPage() {
            //update header section
            currentPageDisplayed.fadeOut(100, function () {
                $h3.text(translation.CTLP_STR_ID_OPTIONS_DLG_HELP_TAB_DESCRIPTION);

                $('#content_help').show();
            });
        }
        return {
            showPage: showPage
        }
    })();    

    /////////////////////
    //TRANSLATION////////
    /////////////////////

    /**
    @request
    @description: adding the translation to all relevant html.
    */
    function addTranslation(translation) {

        var myAppsUserMsgTxt, myAppKey, linkForMyAppsPage;

        //add the current version to the footer section
        $('#toolbar-version').text(translation.CTLP_STR_ID_ABOUT_VERSION + " " + version);

        //add the publisher icon to the footer section
        $('#toolbar-icon').attr('src', toolbarIcon);

        //title left navigator
        $('#header-title').text(translation.CTLP_STR_ID_OPTIONS_DLG_TITLE);

        //left navigator
        $('#predefinedComponents').text(translation.CTLP_STR_ID_OPTIONS_DLG_BUILT_IN_APPS_TAB_TITLE);
        $('#myApps').text(translation.CELP_STR_ID_ENGINE_OPTIONS_DLG_COMPONENTS_HEADING);
        $('#search').text(translation.SB_OPTIONS_SEARCH);
        $('#notifications').text(translation.CTLP_STR_ID_OPTIONS_DLG_NOTIFICATION_TITLE);
        $("#personalApps").text(translation.CTLP_STR_ID_OPTIONS_DLG_RECOMMENDED_APPS_TAB_TITLE);
        //footer buttons.
        $('#footer-button-ok').text(translation.CTLP_STR_ID_GLOBAL_OK);
        $('#footer-button-cancel').text(translation.CTLP_STR_ID_GLOBAL_CANCEL);

        //main titles
        
        $h3.text(translation.CTLP_STR_ID_OPTIONS_DLG_BUILT_IN_APPS_TAB_DESCRIPTION);

        //search checkboxes
        $('#ENABALE_HISTORY').next().text(translation.CTLP_STR_ID_OPTIONS_DLG_ADDITIONAL_ENABLE_HISTORY);
        $('#SHOW_SELECTED_TEXT_IN_SEARCHBOX').next().text(translation.CTLP_STR_ID_OPTIONS_DLG_ADDITIONAL_CLICK_TO_SEARCHBOX);
        //$('#ENABLE_RETURN_WEB_SEARCH_ON_THE_PAGE').next().text(translation.CTLP_STR_ID_OPTIONS_DLG_ADDITIONAL_BACK_TO_DEFAULT_SEARCH_ENGINE__2);
        $('#selectToSearchBoxEnabled').next().text(translation.CTLP_STR_ID_OPTIONS_DLG_SHOW_SELECTED_TEXT_ON_WEBPAGE_IN_SEARCH_BOX__2);

        //notification settings
        //TODO MARAT: calculate with based on style nor charcters count.
        $(".always").text(createSubText(translation.SB_OPTIONS_DROPDOWN_SHOW_ALL, 28));
        $(".timeAday").text(createSubText(translation.SB_OPTIONS_DROPDOWN_LIMIT_DAILY, 28));
        $(".never").text(createSubText(translation.SB_OPTIONS_DROPDOWN_DONT_SHOW, 28));

        //notification settings - tooltip
        $(".always").attr('title', translation.SB_OPTIONS_DROPDOWN_SHOW_ALL);
        $(".timeAday").attr('title', translation.SB_OPTIONS_DROPDOWN_LIMIT_DAILY);
        $(".never").attr('title', translation.SB_OPTIONS_DROPDOWN_DONT_SHOW);

        //additional settings
        $('#advancedSettings').text(translation.CTLP_STR_ID_OPTIONS_DLG_ADVANCED_SETTINGS_TAB_TITLE);
        $('#make-sure-my-apps-are-visible-every').text(translation.CTLP_STR_ID_OPTIONS_DLG_ADDITIONAL_ENABLE_SHOW_INTERVAL);
        $('#onceAday').text(translation.CTLP_STR_ID_OPTIONS_DLG_ADDITIONAL_ENABLE_SHOW_INTERVAL_ONCE_A_DAY);
	    $('#onceAweek').text(translation.CTLP_STR_ID_OPTIONS_DLG_ADDITIONAL_ENABLE_SHOW_INTERVAL_ONCE_A_WEEK);
	    $('#onceIn2Weeks').text(translation.CTLP_STR_ID_OPTIONS_DLG_ADDITIONAL_ENABLE_SHOW_INTERVAL_ONCE_IN_2_WEEKS);
	    $('#onceIn3Weeks').text(translation.CTLP_STR_ID_OPTIONS_DLG_ADDITIONAL_ENABLE_SHOW_INTERVAL_ONCE_IN_3_WEEKS);
	    $('#onceAmonth').text(translation.CTLP_STR_ID_OPTIONS_DLG_ADDITIONAL_ENABLE_SHOW_INTERVAL_ONCE_A_MONTH);
        $('#always-ask-me-about-apps-privacy').text(translation.CELP_STR_ID_UNTRUSTED_APP_ADDED_ALLOW_PRIVACY);
        $('#before-cb-notify-me-about-settings-change').text(translation.CTLP_STR_ID_SEARCH_PROTECTOR_NOTIFY_CHANGE);
        $('#everytime').text(translation.CTLP_STR_ID_SEARCH_PROTECTOR_SHOW_DIALOG_POLICY_EVERYTIME);
        $('#periodically').text(translation.CTLP_STR_ID_SEARCH_PROTECTOR_SHOW_DIALOG_POLICY_PERIODICALLY);
        $('#enable-conduit-engine-automatic-updates').text("Enable Conduit Engine automatic updates");
        $('#search-in-new-tab-label').text(translation.CTLP_STR_ID_OPTIONS_DLG_ADDITIONAL_SEARCH_IN_NEW_TAB);
        $('#404handler').text(translation.CTLP_STR_ID_SHOW_ALTERNATE_SEARCH_PAGE);

        //help
        $('#help').text(translation.CTLP_STR_ID_OPTIONS_DLG_HELP_TAB_TITLE);//TODO LMS
        $('#helpLink').text(translation.CTLP_STR_ID_OPTIONS_DLG_HELP_AND_TROUBLESHOOTING); //TODO LMS
        $('#contactUsLink').text(translation.CTLP_STR_ID_OPTIONS_DLG_CONTACT_US);//TODO LMS

        //about
        $('#about').text(translation.CTLP_STR_ID_OPTIONS_DLG_ABOUT_TAB_TITLE);

        // market place message. user translation or fallback (at the moment the keys dont exist in staging.)
        myAppsUserMsgTxt = translation.CTLP_STR_ID_OPTIONS_DLG_ADD_FREE_APPS_NOW || "You haven’t added any apps. Choose from EB_MARKET_PLACE now!";
        mpKey = translation.CTLP_STR_ID_OPTIONS_DLG_MARKET_PLACE_THOUSANDS_OF_APPS || "thousands of free apps";

        linkForMyAppsPage = '<a id="linkForMyAppsPage" href="#">' + mpKey + '<a/>'
        myAppsUserMsgTxt = myAppsUserMsgTxt.replace(/EB_MARKET_PLACE/, linkForMyAppsPage);
        $('#myAppsUserMsg').html(myAppsUserMsgTxt);

        // toolbar visibility checkbox - only in ie 
        toolbarVisibilityText = translation.CTLP_STR_ID_OPTIONS_DLG_ADDITIONAL_ENABLE_SHOW_INTERVAL_NEW__3.split('{cb}');
        firstPart = toolbarVisibilityText[0];
        secondPart = toolbarVisibilityText[1];
        $('#before-combobox').text(firstPart);
        $('#after-combobox').text(secondPart);
        $('#address-bar-label').text(translation.CTLP_STR_ID_OPTIONS_DLG_ENABLE_SEARCH_ADDRESS_BAR);
        $('#search-suggest-label').text(translation.CTLP_STR_ID_OPTIONS_DLG_ENABLE_SEARCH_SUGGEST);
        $('#send-usage-label').text(translation.CTLP_STR_ID_OPTIONS_DLG_ADDITIONAL_USAGE__2);
    }

} catch (e) { }

function createSubText(text, maxLength) {
    if (text.length > maxLength) {
        text = text.substring(0, maxLength - 3);
        text += "...";
    }
    return text;
}

function initScrollpane() {
    $('.scroll-pane').jScrollPane({
        verticalDragMinHeight: 50,
        verticalDragMaxHeight: 50
    });
};


function setupLabel() {
    if ($('.label_check input').length) {
        $('.label_check').each(function () {
            $(this).removeClass('c_on');
        });

        $('#cb-toolbarVisibility').attr('disabled', true);

        $('.label_check input:checked').each(function () {
            $(this).parent('label').addClass('c_on');
            if ($(this).attr('id') == 'as-toolbarVisibility') {
                $('#cb-toolbarVisibility').attr('disabled', false);
            }
        });

        $('#cb-notify-me-about-settings-change').attr('disabled', true);

        $('.label_check input:checked').each(function () {
            $(this).parent('label').addClass('c_on');
            if ($(this).attr('id') == 'settings-change') {
                $('#cb-notify-me-about-settings-change').attr('disabled', false);
            }
        });
    };
};


$(document).ready(function () {

    if (navigator.userAgent.match(/MSIE/)) {
        $('#search-in-new-tab').parent().parent('div').hide();

    }
});
