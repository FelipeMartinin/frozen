var applicationsObj = function () {

	var consts = {
		serviceName: "applications",
		consoleLog: "applications_" + "consoleLog",
		applicationSettings: "applicationSettings",
		APPS_PER_PAGE: 12,
		kWebStoreAppId: "ahfgeienlihckogmohjhadlkjgocpleb",
		kWebStoreURL: "https://chrome.google.com/webstore?hl={LANG}"
	};

	function consoleLog(msg) {
		conduit.newtab.consoleLog(consts.serviceName, consts.consoleLog, msg);
	}

	var APP_LAUNCH_TYPE = {
		// how = regular, pinned, window
		ALT_REGULAR: 1,
		ALT_PINNED: 2,
		ALT_WINDOW: 3
	};

	var applicationSettings;

	function addApplication(ApplicationList, application) {

		var size = 16;
		var icon = null;
		for (var j in application.icons) {
			if (size <= application.icons[j].size) {
				icon = application.icons[j];
			}
		}
		var icon_big_exists_url = null;
		var icon_big_exists_ = false;
		if (icon != null) {
			icon_big_exists_ = true;
			icon_big_exists_url = icon.url;
		}

		var space = allocateNewPageIndex(ApplicationList);
		if (space.page_index == -1) {
			page_index = applicationSettings.appPageNames.length;
			applicationSettings.appPageNames.push({ pageName: conduit.newtab.translation.getLanguageKey("appTitlePage"), renamed: false });
		} else {
			page_index = space.page_index;
		}

		return {
			appLaunchUrl: application.appLaunchUrl,
			icon_big_exists: icon_big_exists_,
			icon_small_exists: false,
			icon_big: icon_big_exists_url,
			icon_small: "",
			offlineEnabled: application.offlineEnabled,
			enabled: application.enabled,
			page_index: page_index,
			app_launch_ordinal: space.app_launch_ordinal,
			id: application.id,
			showPromo: null,
			mayDisable: application.mayDisable,
			optionsUrl: application.optionsUrl,
			title: application.name,
			notifications_disabled: false,
			is_webstore: false
		};

	}

	function sweepEmptyPages() {

		consoleLog("sweepEmptyPages");

		// Overwrite the web store app. just in case the URL has changed or the translation.
		for (var i = applicationSettings.apps.length - 1; i >= 0; i--) {

			if (applicationSettings.apps[i].is_webstore) {
				var WebStoreApp = createWebStoreApp(applicationSettings.apps[i].page_index, applicationSettings.apps[i].app_launch_ordinal);

				applicationSettings.apps[i] = WebStoreApp;
				break;
			}
		}

		var appPagesBucket = [];
		for (var i = applicationSettings.apps.length - 1; i >= 0; i--) {

			if (typeof (appPagesBucket[applicationSettings.apps[i].page_index]) == 'undefined') {

				appPagesBucket[applicationSettings.apps[i].page_index] = [];
			}
			appPagesBucket[applicationSettings.apps[i].page_index].push(applicationSettings.apps[i]);

		}

		var appTitlePage = conduit.newtab.translation.getLanguageKey("appTitlePage");
		var counter = 0;
		var tempApplicationList = [], tempAppPageNames = [];
		for (var i = 0; i < appPagesBucket.length; ++i) {

			if (typeof (appPagesBucket[i]) != 'undefined') {

				for (var j = 0; j < appPagesBucket[i].length; ++j) {
					var app = appPagesBucket[i][j];
					app.page_index = counter;
					tempApplicationList.push(app);
				}

				if (typeof (applicationSettings.appPageNames[i]) != 'undefined') {
					tempAppPageNames[counter] = { pageName: applicationSettings.appPageNames[i].pageName, renamed: applicationSettings.appPageNames[i].renamed };

				} else {

					tempAppPageNames[counter] = { pageName: appTitlePage, renamed: false };

				}
				++counter;
			}

		}

		for (var i = 0; i < tempAppPageNames.length; ++i) {

			if (!tempAppPageNames[i].renamed) {
				tempAppPageNames[i].pageName = appTitlePage;
			}
		}

		applicationSettings.apps = tempApplicationList;
		applicationSettings.appPageNames = tempAppPageNames;
		applicationSettings.apps.sort(appSorter);
		ls(consts.applicationSettings, applicationSettings);
	}

	function getApplication(callback) {
		sweepEmptyPages();
		setTimeout(function () {
			callback(applicationSettings);
		}, 0);

	}

	function uninstallApplication(appId) {

		chrome.management.uninstall(appId);

	}

	function GenerateAppLaunchURL(app) {

		var appLauncherUrl = chrome.extension.getURL('Search/NewTabPages/html/appLauncher.html');
		appLauncherUrl += "#" + app.appLaunchUrl;
		return appLauncherUrl;
	}

	function launchApplication(appId, launchType) {
		//launchType = regular, pinned, window

		try {
			var foundApp = findApp(applicationSettings.apps, appId);
			if (foundApp) {

				if (foundApp.is_webstore)
					conduit.newtab.usage.CallUsage('Apps_Click_Chrome_WebStore');

				switch (launchType) {
					case APP_LAUNCH_TYPE.ALT_PINNED:
						{
							var appLauncherUrl = GenerateAppLaunchURL(foundApp);
							chrome.tabs.create({ url: appLauncherUrl, selected: true, pinned: true });
							break;
						}
					case APP_LAUNCH_TYPE.ALT_WINDOW:
						{
							var appLauncherUrl = GenerateAppLaunchURL(foundApp);
							chrome.windows.create({ url: [appLauncherUrl] });

							break;
						}
					case APP_LAUNCH_TYPE.ALT_REGULAR:
						{
							chrome.tabs.update({ url: foundApp.appLaunchUrl });
							//chrome.management.launchApp(appId);
							break;
						}
					default:
				}
			}
		} catch (e) {
			errorHandler(e, getLineInfo());

		}
	}

	function launchApplicationOptionMenu(appId) {

		var foundApp = findApp(applicationSettings.apps, appId);
		if (foundApp) {
			chrome.tabs.update({ url: foundApp.optionsUrl });
		}
	}

	function createApplicationShortcut(appId, where) {
		//how = desktop, startmenu, taskbar
	}

	function findApp(arr, id) {
		for (var i = 0; i < arr.length; i++) {
			if (arr[i].id == id) return arr[i];
		}
		return null;
	}

	function allocateNewPageIndex(ApplicationList) {

		var CountPerPage = [], index;
		for (var i = ApplicationList.length - 1; i >= 0; i--) {
			index = ApplicationList[i].page_index;
			if (typeof (CountPerPage[index]) == 'undefined' || CountPerPage[index] == null) {
				CountPerPage[index] = 0;
			}
			++CountPerPage[index];
		}

		for (var j = 0; j < CountPerPage.length; ++j) {

			if (CountPerPage[j] < consts.APPS_PER_PAGE) {
				return { page_index: j, app_launch_ordinal: CountPerPage[j] };
			}

		}
		return { page_index: -1, app_launch_ordinal: 0 };
	}


	function allocatAappLaunchOrdinal(ApplicationList, page_index) {

		var CountPerPage = [], index;
		for (var i = ApplicationList.length - 1; i >= 0; i--) {
			index = ApplicationList[i].page_index;
			if (typeof (CountPerPage[index]) == 'undefined' || CountPerPage[index] == null) {
				CountPerPage[index] = 0;
			}
			++CountPerPage[index];
		}

		if ((typeof (CountPerPage[page_index]) == 'undefined' || CountPerPage[page_index] == null)) {
			return 0;
		}

		return CountPerPage[page_index];

	}

	function createWebStoreApp(page_index, app_launch_ordinal) {

		var webStoreImage = chrome.extension.getURL('Search/NewTabPages/img/WebStore128.png');
		var WebStore = {
			appLaunchUrl: consts.kWebStoreURL.replace('{LANG}', window.navigator.language),
			icon_big_exists: webStoreImage,
			icon_small_exists: false,
			icon_big: webStoreImage,
			icon_small: "",
			offlineEnabled: false,
			enabled: true,
			page_index: page_index,
			app_launch_ordinal: app_launch_ordinal,
			id: consts.kWebStoreAppId,
			showPromo: null,
			mayDisable: false,
			optionsUrl: null,
			title: conduit.newtab.translation.getLanguageKey("WebStoreTitle"),
			notifications_disabled: true,
			is_webstore: true
		};

		return WebStore;
	}

	function applicationsChanged() {
	}

	function applicationsOnInstalled(app) {

		if (app.isApp && app.enabled) {

			var foundApp = findApp(applicationSettings.apps, app.id);
			if (!foundApp) {

				var newApp = addApplication(applicationSettings.apps, app);
				applicationSettings.apps.push(newApp);

				applicationSettings.apps.sort(appSorter);
				ls(consts.applicationSettings, applicationSettings);

				conduit.newtab.chromeSendMessage({ type: "appAdded", app: newApp });

				obj.onAppAdded.fireEvent(newApp);
			}

		}

	}

	function applicationsOnUninstalled(appId) {

		var foundApp = findApp(applicationSettings.apps, appId);
		if (foundApp) {

			applicationSettings.apps.splice(applicationSettings.apps.indexOf(foundApp), 1);
			applicationSettings.apps.sort(appSorter);
			ls(consts.applicationSettings, applicationSettings);

			conduit.newtab.chromeSendMessage({ type: "appRemoved", app: foundApp });

			obj.onAppAdded.fireEvent(newApp);
		}

	}

	function settingsOnChanged() {

		var refreshNeeded = false;
		var kWebStoreAppId = conduit.newtab.settings.getSettingsKey("WebStoreAppId");
		if (consts.kWebStoreAppId != kWebStoreAppId) {
			refreshNeeded = true;
			consts.kWebStoreAppId = kWebStoreAppId;
		}

		var kWebStoreURL = conduit.newtab.settings.getSettingsKey("CultureWebStoreURL");
		if (consts.kWebStoreURL != kWebStoreURL) {
			refreshNeeded = true;
			consts.kWebStoreURL = kWebStoreURL;
		}


		if (refreshNeeded) {
			populateApplicationSettings();

		}

	}

	function init() {
		try {

			conduit.newtab.initConsoleLog(consts.consoleLog);
			consoleLog("init");
			// Reset the application setting structure
			applicationSettings = ls(consts.applicationSettings);
			if (typeof (applicationSettings) == 'undefined' || applicationSettings == null) {
				applicationSettings = { appPageNames: [], apps: [] };
			}
			conduit.newtab.settings.onChanged.addListener(settingsOnChanged);
			settingsOnChanged();
			populateApplicationSettings();
			chrome.management.onDisabled.addListener(applicationsChanged);
			chrome.management.onEnabled.addListener(applicationsChanged);
			chrome.management.onInstalled.addListener(applicationsOnInstalled);
			chrome.management.onUninstalled.addListener(applicationsOnUninstalled);
			return true;
		} catch (e) {
			exceptionHandler(e, getLineInfo());
			return false;
		}
	}

	function setPageIndex(appId, pageIndex) {

		var foundApp = findApp(applicationSettings.apps, appId);
		if (foundApp) {
			foundApp.page_index = pageIndex;
			foundApp.app_launch_ordinal = allocatAappLaunchOrdinal(applicationSettings.apps, pageIndex);
			applicationSettings.apps.sort(appSorter);
			ls(consts.applicationSettings, applicationSettings);
		}
	}

	function appSorter(a, b) {
		return a.page_index != b.page_index ? (a.page_index - b.page_index) :
            (a.app_launch_ordinal - b.app_launch_ordinal);
	}

	function saveAppPageName(pageName, index) {

		if (index >= applicationSettings.appPageNames.length) {

			applicationSettings.appPageNames.push({ pageName: pageName, renamed: false });
		}
		else if (applicationSettings.appPageNames[index].pageName != pageName) {

			applicationSettings.appPageNames[index].pageName = pageName;
			applicationSettings.appPageNames[index].renamed = true;

		}

		ls(consts.applicationSettings, applicationSettings);

	}

	function reorderApps(appId, appIds) {
		var app_launch_ordinal = 0;
		for (var i = 0; i < appIds.length; ++i) {

			var foundApp = findApp(applicationSettings.apps, appIds[i].appId);
			if (foundApp) {
				foundApp.app_launch_ordinal = app_launch_ordinal++;
			}

		}
		applicationSettings.apps.sort(appSorter);
		ls(consts.applicationSettings, applicationSettings);
	}

	function populateApplicationSettings() {

		chrome.management.getAll(function (apps) {

			if (typeof (applicationSettings) == 'undefined' || applicationSettings == null) {

				applicationSettings = { appPageNames: [], apps: [] };

			}

			var tempApplicationList = [], page_index, foundApp;

			// Add Web Store
			foundApp = findApp(applicationSettings.apps, consts.kWebStoreAppId);
			if (foundApp) {
				tempApplicationList.push(foundApp);
			} else {

				var space = allocateNewPageIndex(tempApplicationList);
				if (space.page_index == -1) {
					page_index = applicationSettings.appPageNames.length;
					applicationSettings.appPageNames.push({ pageName: conduit.newtab.translation.getLanguageKey("appTitlePage"), renamed: false });
				}
				tempApplicationList.push(createWebStoreApp(page_index, space.app_launch_ordinal));
			}

			for (var i in apps) {
				if (apps[i].isApp && apps[i].enabled) {

					foundApp = findApp(applicationSettings.apps, apps[i].id);
					if (foundApp) {
						tempApplicationList.push(foundApp);
					} else {
						tempApplicationList.push(addApplication(tempApplicationList, apps[i]));
					}
				}
			}
			tempApplicationList.sort(appSorter);
			applicationSettings.apps = tempApplicationList;

			sweepEmptyPages();

		});
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
		APP_LAUNCH_TYPE: APP_LAUNCH_TYPE,
		init: init,
		getApplication: getApplication,
		uninstallApplication: uninstallApplication,
		launchApplication: launchApplication,
		createApplicationShortcut: createApplicationShortcut,
		launchApplicationOptionMenu: launchApplicationOptionMenu,
		setPageIndex: setPageIndex,
		reorderApps: reorderApps,
		saveAppPageName: saveAppPageName,
		onAppAdded: new eventHandlerObj('conduit.newtab.application.onappadded'),
		onAppRemoved: new eventHandlerObj('conduit.newtab.application.onappremoved'),
		developerMode: developerMode
	};
	return obj;
};
