var toolbarObj = function () {

    var toolbarData;
    var initFinished;
    var newTabEnabledPreviousState;
    var toolbarBinding;
    var startupSequenceCompleted;
    var newTabEnabledSetting;
    var isToolBarIntegrated;
    var globalNewTabEnabled;
    // Note: The init here is to avoid situation where the toolbar loads after partial startup sequence.
    var toolbarLoaded = false;
    var refreshAllNewTabs = false;
    var refreshAllNewTabsEnabled = true;
    var toolbarDataWasDifferent = false;

    var consts = {
        serviceName: "toolbar",
        consoleLog: "toolbar_" + "consoleLog",
        toolbarData: "toolbar_" + "toolbarData", //stores the JSON data
        newTabEnabledPreviousState: "toolbar_" + "newTabEnabledPreviousState",
        previousGlobalNewTabEnabled: "toolbar_" + "globalNewTabEnabled",
        newTabEnabledSetting: "toolbar_" + "newTabEnabledSetting",
        tellToolbarToDisable: "toolbar_" + "tellToolbarToDisable",
        globalNewTabEnabled: "GlobalNewTabEnabled",
        defaultGlobalNewTabEnabled: true,
        defaultToolbarVersion: "Unknown",
        defaultMachineID: "Unknown",
        defaultUserID: "Unknown",
        defaultToolbarLocale: "en",
        defaultNewTabEnabled: true
    };

    function consoleLog(msg) {
        conduit.newtab.consoleLog(consts.serviceName, consts.consoleLog, msg);
    }

    function clearCache() {
        ls(consts.toolbarData, null, true);
        ls(consts.newTabEnabledPreviousState, null, true);
        ls(consts.previousGlobalNewTabEnabled, null, true);
        ls(consts.newTabEnabledSetting, null, true);
        ls(consts.tellToolbarToDisable, null, true);

    }

    function getSearchBackgroundPage() {
        var bg = chrome.extension.getBackgroundPage();

        var SearchBackground = bg &&
            bg.document &&
                bg.document.getElementById("SearchBackgroundIframe") &&
                    bg.document.getElementById("SearchBackgroundIframe").contentWindow
            ? bg.document.getElementById("SearchBackgroundIframe").contentWindow : null;

        return SearchBackground;
    }

    function settingsChanged() {

        var keySetting = conduit.newtab.settings.getSettingsKey(consts.globalNewTabEnabled);
        globalNewTabEnabled = (keySetting == "true");
        var previousGlobalNewTabEnabled = ls(consts.previousGlobalNewTabEnabled);
        if (previousGlobalNewTabEnabled != globalNewTabEnabled) {
            reportUsage(globalNewTabEnabled, true); // Global Enable / Disable
        }
        // Write new state
        ls(consts.previousGlobalNewTabEnabled, globalNewTabEnabled);

    }

    function startupSequenceOnSuccess() {

        startupSequenceCompleted = true;
        settingsChanged();
        conduit.newtab.settings.onChanged.addListener(settingsChanged);
        obj.onChanged.fireEvent();

        if (refreshAllNewTabs) {
            refreshNewTabPages(refreshAllNewTabsEnabled);

            refreshAllNewTabs = false;
            refreshAllNewTabsEnabled = true;
        }
    }


    function isNewTabEnabled() {

        var ret;
        if (isToolBarIntegrated) {

            ret = startupSequenceCompleted && globalNewTabEnabled && toolbarData && eval(toolbarData.isEnabled);


        } else {
            ret = startupSequenceCompleted && globalNewTabEnabled && newTabEnabledSetting;
        }
        return ret;
    }

    function setIsNewTabEnabled(enabled) {

        if (isToolBarIntegrated) {

            try {

                toolbarData.isEnabled = enabled;
                ls(consts.toolbarData, toolbarData);

                if (toolbarLoaded) {

                    toolbarBinding.setNewTabState(enabled);

                } else {

                    ls(consts.tellToolbarToDisable, true);

                }

            } catch (e) {
                exceptionHandler(e, getLineInfo());
            }

        } else {

            newTabEnabledSetting = enabled;
            ls(consts.newTabEnabledSetting, newTabEnabledSetting);
        }

        refreshNewTabPages(enabled);

        newTabEnabledPreviousState = toolbarData.isEnabled;
        ls(consts.newTabEnabledPreviousState, newTabEnabledPreviousState);

        obj.onChanged.fireEvent();

    }


    function refreshNewTabPages(enabled) {
        var targetUrl = (enabled.toString() == "true") ? "chrome://newtab/" : "chrome-internal://newtab/";
        conduit.newtab.redirectAllToDefaultNewTab(targetUrl);
    }

    function bindToToolbar() {
        try {

            var success;
            var SearchBackgroundPage = getSearchBackgroundPage();
            if (typeof (SearchBackgroundPage) != 'undefined' &&
                typeof (SearchBackgroundPage.conduit.searchInNewTab) != 'undefined') {

                toolbarBinding = SearchBackgroundPage.conduit.searchInNewTab;
                success = true;
                try {

                    toolbarBinding.onNewTabState.addListener(toolbarListener);
                    var tbData = toolbarBinding.getToolbarInfo();
                    if (tbData) {
                        toolbarListener(tbData);
                    }
                } catch (e) {
                    exceptionHandler(e, getLineInfo());
                    success = false;
                }

                return success;
            }

        } catch (e) {
            return false;
        }
    }

    function hasAlternativeFocus() {
        return toolbarBinding != null && typeof(toolbarBinding.setFocus) == "function";
    }

    function alternativeFocus() {
        toolbarBinding.setFocus();
    }
    
    function init() {
        try {
            conduit.newtab.initConsoleLog(consts.consoleLog);
            consoleLog("init");

            ls(consts.previousGlobalNewTabEnabled) || ls(consts.previousGlobalNewTabEnabled, consts.defaultGlobalNewTabEnabled);

            var tellToolbarToDisable = ls(consts.tellToolbarToDisable);
            if (typeof (tellToolbarToDisable) != 'undefined' && tellToolbarToDisable != null) {
                ls(consts.tellToolbarToDisable, false);
            }

            isToolBarIntegrated = conduit.newtab.embeddedConfig.get("toolBarIntegrated");
            startupSequenceCompleted = false;
            conduit.newtab.startupSequence.onSuccess.addListener(startupSequenceOnSuccess);

            // Load new tab enabled previous state, used for usage report.
            //            ls(consts.newTabEnabledPreviousState) || ls(consts.newTabEnabledPreviousState, consts.defaultNewTabEnabled);
            newTabEnabledPreviousState = ls(consts.newTabEnabledPreviousState);

            //TODO: the next 3 lines should be commented out. They set the default PreviousValue value to True, even if the user unchecked the Set My Homepage. (bug# 39411)
            //if (typeof (newTabEnabledPreviousState) == 'undefined' || newTabEnabledPreviousState == null) {
            //	newTabEnabledPreviousState = ls(consts.newTabEnabledPreviousState, consts.defaultNewTabEnabled);
            //}

            var success;
            if (isToolBarIntegrated) {

                ls(consts.toolbarData) || ls(consts.toolbarData, null);
                toolbarData = ls(consts.toolbarData);
                success = bindToToolbar();

                success = success && (toolbarData != null);
            } else {
                ls(consts.newTabEnabledSetting, newTabEnabledSetting) || ls(consts.newTabEnabledSetting, consts.defaultNewTabEnabled);
                newTabEnabledSetting = ls(consts.newTabEnabledSetting, newTabEnabledSetting);
                success = true;
            }


            initFinished = true;
            return success;

        } catch (e) {
            exceptionHandler(e, getLineInfo());
            return false;
        }
    }

    function toolbarListener(newToolbarData) {

        toolbarLoaded = true;
        var tellToolbarToDisable = ls(consts.tellToolbarToDisable);
        if (typeof (tellToolbarToDisable) != 'undefined' && tellToolbarToDisable != null && tellToolbarToDisable == true) {
            try {
                toolbarBinding.setNewTabState(false);
                ls(consts.tellToolbarToDisable, false);
            } catch (e) {
                exceptionHandler(e, getLineInfo());
            }
        }

        // If this is the first time we are receiving the toolbar data ,or the enabled state has changed.
        if ((toolbarData == null) ||
            (newTabEnabledPreviousState != newToolbarData.isEnabled)) {
            if (startupSequenceCompleted) {

                refreshNewTabPages(newToolbarData.isEnabled);

            } else {
                refreshAllNewTabs = true;
                refreshAllNewTabsEnabled = newToolbarData.isEnabled;
            }
        } else {
            if (toolbarData.userID != newToolbarData.userID ||
                toolbarData.upId != newToolbarData.upId ||
                toolbarData.umId != newToolbarData.umId) {

                toolbarDataWasDifferent = true;
            }
        }


        // Save the toolbar data.
        toolbarData = newToolbarData;
        ls(consts.toolbarData, toolbarData);

        // Report usage only on state changed.
        if (startupSequenceCompleted && newTabEnabledPreviousState != null && newTabEnabledPreviousState != toolbarData.isEnabled) {
            reportUsage(toolbarData.isEnabled, false);
        }
        newTabEnabledPreviousState = toolbarData.isEnabled;
        ls(consts.newTabEnabledPreviousState, newTabEnabledPreviousState);

        obj.onChanged.fireEvent();

    }

    function toolbarVersion() {
        return (isToolBarIntegrated ? toolbarData.toolbarVersion : consts.defaultToolbarVersion);
    }

    function ctid() {
        return (isToolBarIntegrated ? toolbarData.ctid : conduit.newtab.embeddedConfig.get("CTID"));
    }

    function umId() {
        return (isToolBarIntegrated ? toolbarData.umId : conduit.newtab.embeddedConfig.get("UMID"));
    }

    function upId() {
        return (isToolBarIntegrated ? toolbarData.upId : conduit.newtab.embeddedConfig.get("UPID"));
    }

    function machineID() {
        return (isToolBarIntegrated ? toolbarData.guid : consts.defaultMachineID);
    }

    function userID() {
        return (isToolBarIntegrated ? toolbarData.userID : consts.defaultUserID);

    }

    function toolbarLocale() {
        return (isToolBarIntegrated ? toolbarData.locale : consts.defaultToolbarLocale);
    }

    function sspv() {
        return (isToolBarIntegrated ? toolbarData.sspv : conduit.newtab.embeddedConfig.get("SSPV"));
    }

    //    function isUpgraded() {
    //    	return (isToolBarIntegrated ? toolbarBinding.isUpgraded() : false);
    //    }

    function toolbarPreviousVersion() {
        return (isToolBarIntegrated ? toolbarBinding.getToolbarPreviousVersion() : "");
    }
    function reportUsage(enabled, global) {

        var actionType;
        if (global) {

            actionType = enabled ? 'RestoreGlobalEnabled' : 'RestoreGlobalDisabled';
        } else {
            actionType = enabled ? 'RestoreTDEnabled' : 'RestoreTDDisabled';

        }
        conduit.newtab.usage.CallUsage('Click_Restore_link', 'ActionType', actionType);


    }

    //-------------------------------------------------------------------------
    // developerMode
    //-------------------------------------------------------------------------

    function setManualRefreshInterval(value) {

        if (value != 0) {
            ls(consts.manualRefreshInterval, value);
        }
        else {
            ls(consts.manualRefreshInterval, null, true);
        }

    }

    function getManualRefreshInterval() {

        return ls(consts.manualRefreshInterval) || 0;

    }

    var developerMode = {
        getManualRefreshInterval: getManualRefreshInterval,
        setManualRefreshInterval: setManualRefreshInterval
    };

    var obj = {
        //clearCache:clearCache,
        init: init,
        toolbarVersion: toolbarVersion,
        ctid: ctid,
        machineID: machineID,
        userID: userID,
        toolbarLocale: toolbarLocale,
        sspv: sspv,
        umId: umId,
        upId: upId,
        setIsNewTabEnabled: setIsNewTabEnabled,
        isNewTabEnabled: isNewTabEnabled,
        toolbarPreviousVersion: toolbarPreviousVersion,
        onChanged: new eventHandlerObj('conduit.newtab.toolbar.onChanged'),
        developerMode: developerMode,
        hasAlternativeFocus: hasAlternativeFocus,
        alternativeFocus : alternativeFocus,
        toolbarDataWasDifferent: function () {
            return toolbarDataWasDifferent;
        },
        
        get searchAPI() { return toolbarData.searchAPI; }
        


    };

    return obj;

};               //end of toolbar
