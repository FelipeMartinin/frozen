var startupSequenceObj = function () {

	var refreshInterval, refreshTimer;
	var initFinished = false;

	var consts = {
		serviceName: "startupSequence",
		lastTimeRun: "startupSequence_" + "LastTimeRun", //specifies the last time we checked for updates
		consoleLog: "startupSequence_" + "consoleLog",
		sequenceCompleted: "startupSequence_" + "sequenceCompleted",
		defaultRefreshInterval_NoToolbar: 1000,
		defaultRefreshInterval: 43200000, // 12H
		refreshIntervalSetting: "startupSequence_" + "refreshIntervalSetting",
		startupSequenceRefreshInterval: "startupSequenceRefreshInterval", // The key to access the config
		firstInstallDate: "startupSequence_" + "firstInstallDate",
		toolbarIsUpgraded: "toolbarIsUpgraded",
		wasFirstTimeInstall: "wasFirstTimeInstall"
	};

	function consoleLog(msg) {
		conduit.newtab.consoleLog(consts.serviceName, consts.consoleLog, msg);
	}

	// Set localStorage vars with default values.
	// Used when first loading extension, or when user chooses to reset all the values.

	function resetOptions() {

		delete localStorage.OS;
		// http://stackoverflow.com/questions/4155032/operating-system-detection-by-java-or-javascript/4155078#4155078
		localStorage.OS = "Unknown";
		if (navigator.appVersion.indexOf("Win") != -1) localStorage.OS = "Windows";
		if (navigator.appVersion.indexOf("Mac") != -1) localStorage.OS = "Mac";
		if (navigator.appVersion.indexOf("X11") != -1) localStorage.OS = "UNIX";
		if (navigator.appVersion.indexOf("Linux") != -1) localStorage.OS = "Linux";

		delete localStorage.customStyles;

		localStorage.option_alert = 1; // Show a message when there's a database error.
		localStorage.option_altd = 0; //localStorage.extensionName == "Fauxbar Lite" ? 0 : 1; // Use Alt+D functionality.
		localStorage.option_autofillurl = 1; // Auto-fill the Address Box's input with a matching URL when typing.
		localStorage.option_bgcolor = "#F0F0F0"; // Page background color.
		localStorage.option_bgimg = ""; // Page background image.
		localStorage.option_bgpos = "center"; // Page background image position.
		localStorage.option_bgrepeat = "no-repeat"; // Page background image repeat.
		localStorage.option_bgsize = "auto"; // Page background image size.
		localStorage.option_blacklist = ""; // Blacklisted sites to exclude from Address Box results
		localStorage.option_bold = 1; // Bolden matching words in results.
		localStorage.option_bottomgradient = "#000000"; // wraper bottom gradient color.
		localStorage.option_bottomopacity = "50"; // wrapper bottom gradient opacity.
		localStorage.option_consolidateBookmarks = 1; // Consolidate bookmarks in Address Box results. Means extra duplicate bookmarks won't be shown.
		localStorage.option_ctrlk = 0; // localStorage.extensionName == "Fauxbar Lite" ? 0 : 1; // Use Ctrl+K functionality.
		localStorage.option_ctrll = 0; // localStorage.extensionName == "Fauxbar Lite" ? 0 : 1; // Use Ctrl+L functionality.
		localStorage.option_customscoring = 0; // Use custom frecency scoring.
		localStorage.option_cutoff1 = 4; // Frecency bucket cutoff days #1
		localStorage.option_cutoff2 = 14; // Frecency bucket cutoff days #2
		localStorage.option_cutoff3 = 31; // Frecency bucket cutoff days #3
		localStorage.option_cutoff4 = 90; // Frecency bucket cutoff days #4
		localStorage.option_enableSearchContextMenu = 1; // Right-click context menu for search input boxes on webpages
		localStorage.option_fallbacksearchurl = "http://www.google.com/search?btnI=&q={searchTerms}"; // Fallback URL for Address Box.
		localStorage.option_fontcolor = "#000000"; // Address Box and Search Box input box font color.
		localStorage.option_favcolor = "#FFFFFF"; // Bookmark icon tint color.
		localStorage.option_favopacity = "0"; // Bookmark icon tint opacity.

		localStorage.option_frecency_auto_bookmark = 75; // Frecency bonus scores
		localStorage.option_frecency_form_submit = 0;
		localStorage.option_frecency_generated = 0;
		localStorage.option_frecency_keyword = 0;
		localStorage.option_frecency_link = 100;
		localStorage.option_frecency_reload = 0;
		localStorage.option_frecency_start_page = 0;
		localStorage.option_frecency_typed = 2000;
		localStorage.option_frecency_unvisitedbookmark = 1;

		localStorage.option_font = localStorage.OS == "Mac" ? "Lucida Grande" : localStorage.OS == "Linux" ? "Ubuntu" : "Segoe UI"; // Global font name(s).
		localStorage.option_hidehttp = 1; // Hide "http://" from the beginning of URLs.
		localStorage.option_hidefiletiles = 1; // Prevent top site tiles from displaying file:/// URLs.
		localStorage.option_hideopentiles = 0; // Prevent top site tiles from displaying opened URLs. Disabled by default.
		localStorage.option_hidepinnedtiles = 1; // Prevent top site tiles from displaying pinned URLs.
		localStorage.option_iconcolor = "#3374AB"; // Go Arrow and Magnifying Glass icon color.
		localStorage.option_ignoretitleless = 1; // Ignore titleless Address Box results.
		localStorage.option_inputbgcolor = "#FFFFFF"; // Address Box and Search Box background color.
		localStorage.option_inputboxdisplayorder = "addressleft_searchright"; // Order of which Box comes first.
		localStorage.option_inputfontsize = localStorage.OS == "Mac" ? 13 : 15; // Address & Search Box font size (px).
		localStorage.option_leftcellwidthpercentage = 66; // Width percentage of the Address Box.
		localStorage.option_launch = "newTab"; // Open Fauxbar upon clicking browser action icon. newTab, currentTab or newWindow
		localStorage.option_maxaddressboxresults = 16; // Max Address Box results to display to the user at a time.
		localStorage.option_maxaddressboxresultsshown = 8; // Max Address Box results to be shown at a time; extra results will have to be scrolled to see.
		localStorage.option_maxretrievedsuggestions = 5; // Max Search Box saved queries to retrieve. This option name is misleading; suggestions are generally JSON results from the search engine.
		localStorage.option_maxsuggestionsvisible = 15; // Max queries/suggestions to display before needing to scroll. So with these 2 default options, 10 JSON suggestions will probably be displayed.
		localStorage.option_maxwidth = 1200; // Max-width for the wrapper.
		localStorage.option_omniboxurltruncate = 55; // Truncate Omnibox URLs so that the titles can still be seen (hopefully).
		localStorage.option_openfocus = "addressbox"; // What to focus when Fauxbar opens. Can be "chrome", "addressbox" or "searchbox"
		localStorage.option_optionpage = "option_section_general"; // Option section/subpage to load when Options are shown.
		localStorage.option_pagetilearrangement = "frecency"; // Page tile arrangement. Possible values: "frecency" "visitcount" "manual" "bookmarkbar"
		localStorage.option_prerender = 1; // Let Chrome pre-render the first Address Box result if possible.
		localStorage.option_quickdelete = 1; // Don't enable Quick Delete by default. Don't want the user randomly deleting their history without knowing it.
		localStorage.option_quickdelete_confirm = 1; // Prompt user to confirm before deleting a history result using Quick Delete.
		localStorage.option_recentvisits = 10; // Number of recent visits to sample when calculating frecency scores for URLs.
		localStorage.option_recordsearchboxqueries = 1; // Keep a record of the user's Search Box queries, to suggest them to the user later on if they search for something similar.
		localStorage.option_resultbgcolor = "#FFFFFF"; // Background color for results and suggestions/queries.
		localStorage.option_sappsfontsize = 13; // Font size (px) for main page tiles for top sites and installed apps.
		localStorage.option_selectedresultbgcolor = "#3399FF"; // Background color for .arrowed/highlighted/selected/navigated-to results/queries/suggestions.
		localStorage.option_selectedtitlecolor = "#FFFFFF"; // Title font color for .arrowed/highlighted/selected/navigated-to results/queries/suggestions.
		localStorage.option_selectedurlcolor = "#FFFFFF"; // URL font color for .arrowed/highlighted/selected/navigated-to results/queries/suggestions.
		localStorage.option_separatorcolor = "#E3E3E3"; // Color of the 1px separator line between results.
		localStorage.option_shadow = 1; // Drop shadow 
		localStorage.option_showapps = 1; // Display app tiles.
		localStorage.option_showErrorCount = 1; // Show an error count on the Options' side menu.
		localStorage.option_showjsonsuggestions = 1; // Show Search Box suggestions from the selected search engine when user is typing a query.
		localStorage.option_showmatchingfavs = 1; // Search for and display matching bookmarks from the Address Box.
		localStorage.option_showmatchinghistoryitems = 1; // Search for and display matching history items from the Address Box.
		localStorage.option_showQueriesViaKeyword = 1; // Show previous search queries when seaching via keyword in the Address Box.
		localStorage.option_showqueryhistorysuggestions = 1; // Show Search Box past queries when user is typing a query into the Search Box.
		localStorage.option_showStarInOmnibox = localStorage.OS == "Mac" ? 1 : 0; // Show a star in Omnibox bookmark results if possible.
		localStorage.option_showSuggestionsViaKeyword = 1; // Show suggestions from search engine when using keywords in the Address Box.
		localStorage.option_showtopsites = 1; // Show top site tiles.
		localStorage.option_speech = "0"; // Show speech input icons in the Address Box and Search Box.
		localStorage.option_switchToTab = "replace"; // Toggleable switch to tab functionality. Possible values: "replace", "before", "disable"
		localStorage.option_timing = "immediately"; // Only show Address Box results once the user has stopped typing. "immediately" shows results after every keystroke instead.
		localStorage.option_titlecolor = "#000000"; // Result title and query/suggestion font color.
		localStorage.option_titlesize = localStorage.OS == "Mac" ? 12 : 14; // Result title font size (px).
		localStorage.option_topgradient = "#000000"; // wrapper top gradient background color.
		localStorage.option_topopacity = 12; // wrapper top gradient background opacity.
		localStorage.option_topsitecols = 4; // Top site tiles, max columns.
		localStorage.option_topsiterows = 2; // Top site titles, max rows.
		localStorage.option_underline = "0"; // Underline matching words in Address Box results. Off by default, looks a bit too busy/messy.
		localStorage.option_urlcolor = "#0066CC"; // Result URL font color.
		localStorage.option_urlsize = localStorage.OS == "Mac" ? 11 : localStorage.OS == "Linux" ? 13 : 12; // Result URL font size (px).
		localStorage.option_useAjaxToDetectIntranetUrls = 1;
		localStorage.option_weight1 = 100; // Frecency bucket cutoff weight #1
		localStorage.option_weight2 = 70; // Frecency bucket cutoff weight #2
		localStorage.option_weight3 = 50; // Frecency bucket cutoff weight #3
		localStorage.option_weight4 = 30; // Frecency bucket cutoff weight #4
		localStorage.option_weight5 = 10; // Frecency bucket cutoff weight #5

		// KobyM - Added new options
		localStorage.option_topsites = 8; // Top site count.


		resetMenuBarOptions();
	}

	function resetMenuBarOptions() {
		localStorage.option_showMenuBar = 1;
		localStorage.option_menuBarBackgroundColor = '#F0F0F0';
		localStorage.option_showMenuBarDate = 1;
		localStorage.option_menuBarDateFormat = 'l, F j, Y';
		localStorage.option_showTabsMenu = 1;
		localStorage.option_tabsMenu_showReloadAllTabs = 1;
		localStorage.option_tabsMenu_showNewWindow = 1;
		localStorage.option_tabsMenu_showNewIncognitoWindow = 1;
		localStorage.option_tabsMenu_showSubMenus = 0;
		localStorage.option_showHistoryMenu = 1;
		localStorage.option_historyMenu_showHistoryPageLink = 1;
		localStorage.option_historyMenu_showClearDataLink = 1;
		localStorage.option_historyMenu_numberOfItems = 15;
		localStorage.option_showBookmarksMenu = 1;
		localStorage.option_bookmarksMenu_foldersFirst = 1;
		localStorage.option_bookmarksMenu_showBookmarkManagerLink = 1;
		localStorage.option_bookmarksMenu_showRecentBookmarks = 1;
		localStorage.option_bookmarksMenu_numberOfRecentBookmarks = 15;
		localStorage.option_showAppsMenu = 1;
		localStorage.option_showExtensionsMenu = 1;
		localStorage.option_extensionsMenu_showExtensionsLink = 1;
		localStorage.option_showChromeMenu = 1;
		localStorage.option_chromeMenu_showBookmarks = 1;
		localStorage.option_chromeMenu_showDownloads = 1;
		localStorage.option_chromeMenu_showExtensions = 1;
		localStorage.option_chromeMenu_showHistory = 1;
		localStorage.option_chromeMenu_showOptions = 1;
		localStorage.option_chromeMenu_showExperiments = 1;
		localStorage.option_chromeMenu_showPlugins = 1;
		localStorage.option_showMenu = 1;
		localStorage.option_menuBar_useHistory2 = 1;
		localStorage.option_menuBarFontColor = '#000000';
		delete localStorage.hideTabTips;
	}


	function vacuumDatabase() {
		if (openDb()) {

			// Vacuum the DB upon start, to help keep it speedy.
			window.db.transaction(function (tx) {
				tx.executeSql('VACUUM');
			});


		}
	}

	function firstTimeLoad() {
		try {
			// If being started for the first time, load in the default options.
			if (!localStorage.firstrundone || localStorage.firstrundone != 1) {
				localStorage.indexComplete = 0;
				localStorage.indexedbefore = 0;
				localStorage.sapps = 1;
				localStorage.showintro = 1;
				resetOptions();
				localStorage.firstrundone = 1;
			}
			return true;
		}
		catch (e) {
			exceptionHandler(e, getLineInfo());
			return false;
		}
	}

	//gets the JSON file from the service

	function startupSequence() {

		// Startup sequence
		//  1. first time load
		//  2. embedded configuration
		//  3. developer mode
		//  4. most visited sites - Indexing Service
		//  5. Toolbar
		//  6. service map
		//  7. usage
		//  8. settings
		//  9. location service
		// 10. translation service - need this first, to map the browser language to conduit culture
		// 11. search box
		// 12. most visited sites
		// 13. applications
		// 14. bookmarks
		// 15. recently closed
		// 16. Thumbnails
		// 17. New version info

		ls(consts.sequenceCompleted, false);
		consoleLog("startup sequence started");

		// Write to ls when the extension was first installed.
		if (ls(consts.firstInstallDate) == null) {
			ls(consts.firstInstallDate, new Date);
			ls(consts.wasFirstTimeInstall, "true"); //if this is true, then MAY need msg (depends on upgrade [toolbarPreviousVerion])
		}

		if (ls(consts.wasFirstTimeInstall) == null) {
			ls(consts.wasFirstTimeInstall, "false"); //if this is false, then NEVER needs msg
		}

		vacuumDatabase();

		var failureAt = "";
		var success = true;
		var nextRefreshInterval;

		if (success) {

			success = firstTimeLoad();
			failureAt = "firstTimeLoad";
		}

		if (success) {
			success = conduit.newtab.embeddedConfig.init();
			failureAt = "embeddedConfig";
		}

		if (success) {
			success = conduit.newtab.developerMode.init();
			failureAt = "developerMode";
		}

		if (success) {
			success = conduit.newtab.mostVisited.StartIndexingService();
			failureAt = "mostVisited - Indexing Service";
		}

		if (success) {
			success = conduit.newtab.toolbar.init();
			failureAt = "toolbar";
			if (!success) {
				nextRefreshInterval = consts.defaultRefreshInterval_NoToolbar;
			}
		}

		if (success) {
			success = conduit.newtab.serviceMap.init();
			failureAt = "serviceMap";
		}

		if (success) {
			success = conduit.newtab.usage.init();
			failureAt = "usage";
		}

        if (success) {
            success = conduit.newtab.logMsg.init();
            failureAt = "logMsg";
        }
	    
		if (success) {
			success = conduit.newtab.settings.init();
			failureAt = "settings";
		}

		if (success) {
			success = conduit.newtab.locationService.init();
			failureAt = "locationService";
		}

		if (success) {
			success = conduit.newtab.translation.init();
			failureAt = "translation";
		}

		if (success) {
			success = conduit.newtab.searchBox.init();
			failureAt = "searchBoxIframe";
		}

        if (success) {
            success = conduit.newtab.cntRedirect.init();
            failureAt = "cntRedirect";
        }
	    
		if (success) {
			success = conduit.newtab.mostVisited.init();
			failureAt = "mostVisited";
			if (!success) {
				nextRefreshInterval = consts.defaultRefreshInterval_NoToolbar;
			}
		}

		if (success) {
			success = conduit.newtab.applications.init();
			failureAt = "applications";
		}

		if (success) {
			success = conduit.newtab.bookmarks.init();
			failureAt = "bookmarks";
		}

		if (success) {
			success = conduit.newtab.recentlyClosed.init();
			failureAt = "recentlyClosed";
		}

		if (success) {
			success = conduit.newtab.thumbnails.init();
			failureAt = "thumbnails";
		}

		// New version info
		if (success) {

			success = newVersionInfo();
			failureAt = "newVersionInfo";
		}

		// If the next refresh interval wasn't set by one of the services, default it.
		if (typeof (nextRefreshInterval) == 'undefined') {
			nextRefreshInterval = consts.defaultRefreshInterval;
		}


		if (success) {

			conduit.newtab.initConsoleLog(consts.consoleLog);
			// If the sequence is completed we can ask the settings for the real refresh interval.
			refreshInterval = conduit.newtab.settings.getSettingsKey(consts.startupSequenceRefreshInterval);
			ls(consts.refreshIntervalSetting, refreshInterval);

			consoleLog("startup sequence ended successfully");
		} else {

			consoleLog("startup sequence with failure at: " + failureAt);
			if (typeof (nextRefreshInterval) != 'undefined') {
				refreshInterval = nextRefreshInterval;
			}

		}

		ls(consts.sequenceCompleted, success);

		return success;
	}

	function refresh(forced) {
		var lastTimeRun = ls(consts.lastTimeRun);
		var now = new Date().getTime();
		consoleLog('refresh');

		var lsIsInvalid = ls(consts.sequenceCompleted) == null ||
            ls(consts.sequenceCompleted) == false ||
            ls(consts.lastTimeRun) == null;

		if (forced || lsIsInvalid || now > (lastTimeRun + refreshInterval)) {

			initFinished = startupSequence();
			if (initFinished) {

				obj.onSuccess.fireEvent();
			}

			// Save last update time
			lastTimeRun = ls(consts.lastTimeRun, now);
		}

		if (refreshTimer == null && !initFinished) {
			var nextTimeRun = refreshInterval - (lastTimeRun > now - refreshInterval ? now - lastTimeRun : 0);
			refreshTimer = window.setTimeout(refreshService, nextTimeRun);
			consoleLog(consts.serviceName + 'Timer nextTimeRun = ' + nextTimeRun);
		}

		return true;
	}

	;

	function clearCache() {
		ls(consts.sequenceCompleted, null, true);
		ls(consts.lastTimeRun, null, true);
	}

	function init() {
	    try {
			// Attempt to load refresh interval from ls,otherwise set to default.
			if (ls(consts.refreshIntervalSetting)) {
				refreshInterval = ls(consts.refreshIntervalSetting);
			} else {
				//ls(consts.refreshIntervalSetting, consts.defaultRefreshInterval);
				refreshInterval = consts.defaultRefreshInterval;
			}

			var success = refresh(true);

			conduit.newtab.initConsoleLog(consts.consoleLog);
			consoleLog("init");

			return success;
		} catch (e) {
			exceptionHandler(e, getLineInfo());
			return false;
		}
	}

	function refreshService() {
		if (refreshTimer != null) {
			window.clearTimeout(refreshTimer);
			refreshTimer = null;
		}
		refresh(false);
	}

	function newVersionInfo() {

		try {
			var currentVersion = conduit.newtab.embeddedConfig.get("version");
			if ((!localStorage.currentVersion && localStorage.indexComplete && localStorage.indexComplete == 1) ||
            (localStorage.currentVersion && localStorage.currentVersion != currentVersion) ||
                (localStorage.readUpdateMessage && localStorage.readUpdateMessage == 0)) {
				// Enable for big updates, disable for small. Don't need to annoy the user about a minor defect fix.
				/*if (localStorage.currentVersion != '1.2.0') {
				localStorage.readUpdateMessage = 1;
				window.webkitNotifications.createHTMLNotification('/html/notification_updated.html').show();
				}*/
			}

			// Custom changes between versions!

			// Set current version
			localStorage.currentVersion = currentVersion;
			return true;
		}
		catch (e) {
			exceptionHandler(e, getLineInfo());
			return false;
		}

	}

	function isSequenceCompleted() {
		return ls(consts.sequenceCompleted);
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
		isSequenceCompleted: isSequenceCompleted,
		onSuccess: new eventHandlerObj('conduit.newtab.startupSequence.onSuccess'),
		developerMode: developerMode
	};

	return obj;

};          //end of startupSequence
