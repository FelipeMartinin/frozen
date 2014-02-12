var translationObj = function () {
	var productKey, languageUrl, languageLatestUpdateUrl, languageMapping; //languageMappingUrl
	var translationRefreshInterval, _translationTimer; //, mappingRefreshInterval, _mappingTimer;
	var initFinished = false;
	var translations, newTabCurrentCulture, newTabCurrentDirection;

	var consts = {
		resourceTimeout: 3000,
		serviceName: "Translation", // Used only for: consoleLog
		consoleLog: "Translation_" + "consoleLog",

		// For service map keys:
		TranslationServiceName: "Translation",
		TranslationProtocolVersion: "1",

		TranslationIndexServiceName: "Translation_Index",
		TranslationIndexProtocolVersion: "1",

		//LanguageMappingservice: "LanguageMapping",
		//LanguageMappingProtocolVersion: "1",

		languageTranslations: "languageTranslations", //stores the JSON translations
		currentCulture: "currentCulture", //stores the name of the specific culture
		defaultCulture: "he",
		defaultLanguageDirection: "ltr",
		languageLastUpdate: "languageLastUpdate", //stores the value the LMS service returns from the index file for this product
		languageMapping: "languageMapping", //stores the mapping json
		lastTranslationUpdate: "lastTranslationUpdate" //specifies the last time we checked for updates to cultures
		//lastMappingUpdate: "lastMappingUpdate" //specifies the last time we checked for updates to LanguageMapping
	};

	function consoleLog(msg) {
		conduit.newtab.consoleLog(consts.serviceName, consts.consoleLog, msg);
	}

	var getConduitLanguage = function () {

		var currentLocale = window.navigator.language;
		if (languageMapping == null)
			return null;

		currentLocale = languageMapping[currentLocale];

		if (currentLocale == null || translations.Translations[currentLocale] == null) {
			currentLocale = conduit.newtab.toolbarLocale;

			if (currentLocale != null)
				currentLocale = currentLocale.split('-')[0];


			if (currentLocale == null || translations.Translations[currentLocale] == null)
				currentLocale = consts.defaultCulture;
		}

		return currentLocale;
	};

	//gets the JSON file from the LMS system for the specific culture
	var getLanguageTranslations = function () {

		var res = getResource(languageUrl, consts.resourceTimeout, false, "text");
		if (res == null || res.length == 0)
			return null;

		try {
			var jsonRes = JSON.parse(res);
			res = ls(consts.languageTranslations, jsonRes);
		} catch (e) {
			exceptionHandler(e, getLineInfo());
			return null;
		}


		return res;
	};

	var getLanguageUpdated = function () {

		var res = getResource(languageLatestUpdateUrl.formatStr(productKey), consts.resourceTimeout, false, "text");
		if (res == null || res.length == 0)
			return null;

		try {
			res = JSON.parse(res.replace('.txt', ''));
		} catch (e) {
			consoleLog('error in translation.getLanguageUpdated: JSON.parse: ' + e);
			return null;
		}
		return res[productKey][0][productKey];
	};

	var initLanguages = function () {
		consoleLog("initLanguages");


		//      var success = refreshMapping();
		//      if (!success)
		//         return false;

		var success = refreshLanguages();
		if (!success)
			return false;


		translations = ls(consts.languageTranslations);
		if (!translations)
			return false;

		newTabCurrentCulture = getConduitLanguage();

		if (newTabCurrentCulture == null)
			return false;

		newTabCurrentDirection = translations.Translations[newTabCurrentCulture].Definitions.Direction;

		var previousCulture = ls(consts.currentCulture);
		if (previousCulture != newTabCurrentCulture)
			conduit.newtab.searchBox.cultureChanged = true;

		ls(consts.currentCulture, newTabCurrentCulture);
		return true;
	};

	//   function refreshMapping() {
	//      var lastTimeRun = ls(consts.lastMappingUpdate);
	//      languageMapping = ls(consts.languageMapping);
	//      var now = new Date().getTime();

	//      if (languageMapping == null || lastTimeRun == null || now > (lastTimeRun + mappingRefreshInterval)) {

	//         var templanguageMapping = getResource(languageMappingUrl, consts.resourceTimeout, true);

	//         if (templanguageMapping != null && templanguageMapping.length > 0) {
	//            try {
	//               templanguageMapping = JSON.parse(templanguageMapping);
	//               languageMapping = ls(consts.languageMapping, templanguageMapping);
	//            } catch (e) {
	//               consoleLog('error in translation.refreshmapping: getting language ' + e);
	//            }
	//         }

	//         if (!initFinished && ls(consts.languageMapping) == null)
	//            return false;

	//         lastTimeRun = ls(consts.lastMappingUpdate, now);
	//      }

	//      if (_mappingTimer == null) {

	//         var nextTimeRun = mappingRefreshInterval - ((lastTimeRun > (now - mappingRefreshInterval)) ? now - lastTimeRun : 0);
	//         _mappingTimer = window.setTimeout("conduit.newtab.translation.refreshMapping()", nextTimeRun);
	//         consoleLog("_mappingTimer nextRun = " + nextTimeRun);
	//      }

	//      return true;
	//   }

	var refreshLanguages = function () {
		var lastTimeRun = ls(consts.lastTranslationUpdate);
		var now = new Date().getTime();
		consoleLog('refreshLanguages');

		var lsIsInvalid = ls(consts.languageTranslations) == null ||
            ls(consts.languageLastUpdate) == null ||
                ls(consts.lastTranslationUpdate) == null;

		if (lsIsInvalid || now > (lastTimeRun + translationRefreshInterval)) {

			var lastCacheUpdated = ls(consts.languageLastUpdate);
			var latestCultureUpdate = getLanguageUpdated();

			var languageExpired = lsIsInvalid || (latestCultureUpdate != null && (lastCacheUpdated == null || lastCacheUpdated < latestCultureUpdate));

			var tempLang;
			if (languageExpired) {
				tempLang = getLanguageTranslations();

				if (tempLang != null)
					translations = tempLang;

				else if (!initFinished && translations == null)
					return false;
			}

			if (latestCultureUpdate != null && lastCacheUpdated != latestCultureUpdate)
				ls(consts.languageLastUpdate, latestCultureUpdate);

			lastTimeRun = ls(consts.lastTranslationUpdate, now);
		}

		if (_translationTimer == null) {
			var nextTimeRun = translationRefreshInterval - (lastTimeRun > now - translationRefreshInterval ? now - lastTimeRun : 0);
			_translationTimer = window.setTimeout(function() { conduit.newtab.translation.refreshTranslations(); }, nextTimeRun);
			consoleLog('translationTimer nextTimeRun = ' + nextTimeRun);
		}

		return true;
	};

	var settingsChanged = function () {
		var needRefresh = false;
		consts.defaultCulture = conduit.newtab.settings.getSettingsKey("defaultCulture");

		var newProductKey = conduit.newtab.settings.getSettingsKey("productKey");
		if (newProductKey != productKey) {
			productKey = newProductKey;
			needRefresh = true;
		}

		var newLanguageMapping = conduit.newtab.settings.getSettingsKey("LanguageMapping");
		if (JSON.stringify(JSON.parse(newLanguageMapping)) != JSON.stringify(languageMapping)) {
			languageMapping = JSON.parse(newLanguageMapping);
			needRefresh = true;
		}

		if (needRefresh) {
			ls(consts.lastTranslationUpdate, null, true);
			conduit.newtab.translation.refreshTranslations();
			conduit.newtab.translation.onChanged.fireEvent();
		}
	};

	var serviceMapChanged = function () {
		var needRefresh = false;

		var translationService = conduit.newtab.serviceMap.getServiceByName(consts.TranslationServiceName, consts.TranslationProtocolVersion);
		if (translationService != null && translationService.url != languageUrl) {
			languageUrl = translationService.url;
			needRefresh = true;
		}

		var translationIndexService = conduit.newtab.serviceMap.getServiceByName(consts.TranslationIndexServiceName, consts.TranslationIndexProtocolVersion);
		if (translationIndexService != null && translationIndexService.url != languageLatestUpdateUrl || translationIndexService.reload_interval_sec * 1000 != translationRefreshInterval) {
			languageLatestUpdateUrl = translationIndexService.url;
			translationRefreshInterval = translationIndexService.reload_interval_sec * 1000;
			needRefresh = true;
		}

		if (needRefresh) {
			ls(consts.lastTranslationUpdate, null, true);
			conduit.newtab.translation.refreshTranslations();
			conduit.newtab.translation.onChanged.fireEvent();
		}
	};

	//-------------------------------------------------------------------------
	// developerMode
	//-------------------------------------------------------------------------

	function setManualRefreshInterval(value) {

		if (value != 0) {
			ls(consts.manualRefreshInterval, value);
		} else {
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
		init: function () {
			try {
				conduit.newtab.initConsoleLog(consts.consoleLog);
				consoleLog("init");

				var success = false;

				languageMapping = conduit.newtab.settings.getSettingsKey("LanguageMapping");

				if (languageMapping == null || languageMapping.length == 0)
					return success;

				try {
					languageMapping = JSON.parse(languageMapping);
				} catch (e) {
					exceptionHandler(e, getLineInfo());
					return success;
				}

				consts.defaultCulture = conduit.newtab.settings.getSettingsKey("defaultCulture");
				productKey = conduit.newtab.settings.getSettingsKey("productKey");

				var translationService = conduit.newtab.serviceMap.getServiceByName(consts.TranslationServiceName, consts.TranslationProtocolVersion);
				var translationIndexService = conduit.newtab.serviceMap.getServiceByName(consts.TranslationIndexServiceName, consts.TranslationIndexProtocolVersion);
				//var languageMappingservice = conduit.newtab.serviceMap.getServiceByName(consts.LanguageMappingservice, consts.LanguageMappingProtocolVersion);
				if (translationService != null && translationIndexService != null) { // && languageMappingservice != null) {

					languageUrl = translationService.url;

					languageLatestUpdateUrl = translationIndexService.url;
					translationRefreshInterval = translationIndexService.reload_interval_sec * 1000;

					//               languageMappingUrl = languageMappingservice.url;
					//               mappingRefreshInterval = languageMappingservice.reload_interval_sec * 1000;

					success = initLanguages();
					initFinished = true;

				}

				conduit.newtab.serviceMap.onChanged.addListener(serviceMapChanged);
				conduit.newtab.settings.onChanged.addListener(settingsChanged);

				return success;
			} catch (e) {
				exceptionHandler(e, getLineInfo());
				return false;
			}

		},

		refreshTranslations: function () {
			if (_translationTimer != null) {
				window.clearTimeout(_translationTimer);
				_translationTimer = null;
			}
			refreshLanguages();
		},

		//      refreshMapping: function () {
		//         if (_mappingTimer != null) {
		//            window.clearTimeout(_mappingTimer);
		//            _mappingTimer = null;
		//         }
		//         refreshMapping();
		//      },

		getLanguageKey: function (key) {
			try {
				if (translations.Translations[newTabCurrentCulture] != null)
					return translations.Translations[newTabCurrentCulture].Keys[key].Text;

				return translations.Translations[consts.defaultCulture].Keys[key].Text;
			} catch (e) {
				consoleLog("error getting languageKey: " + e);
			}

			return null;
		},

		/*
		clearCache: function () {
		translations.defaultCulture = ls(consts.defaultLanguageTranslations, null, true);
		translations.specificCulture = ls(consts.cultureLanguageTranslations, null, true);
		ls(consts.currentCulture, null, true);
		ls(consts.languageLastUpdate, null, true);
		ls(consts.languageMapping, null, true);
		ls(consts.defaultCulture, null, true);
		ls(consts.lastTranslationUpdate, null, true);
		},
		*/
		getConduitLanguage: function () {
			if (initFinished)
				return ls(consts.currentCulture);

			return getConduitLanguage();
		},

		getLanguageDirection: function () {
			if (newTabCurrentDirection)
				return newTabCurrentDirection.toLowerCase();

			return consts.defaultLanguageDirection;
		},

		onChanged: new eventHandlerObj('conduit.newtab.translation.onChanged'),
		developerMode: developerMode
	};

	return obj;
};      //end of translation
