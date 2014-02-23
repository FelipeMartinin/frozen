var NewTabAPI = function () {

   var newTabObj = function () {

      var consts = {
         serviceName: "newTab",
         consoleLogTraceInfo: "newTab_" + "consoleLogTraceInfo",
         consoleLogEnableAll: "newTab_" + "consoleLogEnableAll",
         defaultShowingPage: 1024

      };

      var currentShowingPage = consts.defaultShowingPage;
         var currentPageIndex = 0;
      var once = true;
      
      return {

         chromeSendMessage: function (message) {
            if( typeof chrome.extension.sendMessage != 'undefined' ) {
            		chrome.extension.sendMessage(message);
            } else {
                	chrome.extension.sendRequest(message);
            }

         },

         chromeMessageListender: function (callback) {
         
            if( typeof chrome.extension.onMessage != 'undefined' ) {
                chrome.extension.onMessage.addListener(callback);
            } else {
                chrome.extension.onRequest.addListener(callback);
            }

         },

         initConsoleLog: function (consoleLogKey) {

            var DevMode = false;
            if ((typeof (conduit.newtab.embeddedConfig) != 'undefined') &&
                  conduit.newtab.embeddedConfig.isInitFinished()) {
               DevMode = conduit.newtab.embeddedConfig.get("DevMode");
            }

            if(once) {
               once = false;

               // Setting consoleLogEnableAll to Enabled/Disabled (With reference to DevMode ) in not determined manually otherwise.
               var current = ls(consts.consoleLogTraceInfo);
               if ((current != "ManualEnabled") && (current != "ManualDisabled")) {
                  ls(consts.consoleLogTraceInfo, DevMode == true ? "Enabled" : "Disabled");
               }

               // Setting consoleLogEnableAll to Disabled in not determined manually otherwise.
               current = ls(consts.consoleLogEnableAll);
               if ((current != "ManualEnabled") && (current != "ManualDisabled")) {
                  ls(consts.consoleLogEnableAll, "Disabled");
               }
            }

            current = ls(consoleLogKey);
            if ((current != "ManualEnabled") && (current != "ManualDisabled")) {
               ls(consoleLogKey, DevMode == true ? "Enabled" : "Disabled");
            }

         },

         consoleLog: function (serviceName,consoleLogKey,msg) {

            var current = ls(consoleLogKey);
            if ((current == "Enabled") || (current == "ManualEnabled")) {

               var lineText = "";
               var consoleLogTraceInfo = ls(consts.consoleLogTraceInfo);
               var consoleLogEnableAll = ls(consts.consoleLogEnableAll);
               if( (consoleLogTraceInfo == "Enabled") || (consoleLogTraceInfo == "ManualEnabled") || 
                   (consoleLogEnableAll == "Enabled") || (consoleLogEnableAll == "ManualEnabled") ) {

                  var lineInfo = getLineInfo();
                  lineText = "(@" + lineInfo.file + ":" + lineInfo.line + " col:" + lineInfo.col + ") ";
               }
               console.log("[ " + now() + " " + serviceName + " " + lineText + "]: " + msg);

            }


         },

         openOptionsMenu: function () {

         },

         redirectAllToDefaultNewTab: function (targetUrl) {
            chrome.tabs.query({}, function (tabs) {

             for(var i=0;i<tabs.length;++i) {
                 
                    if (tabs[i].url == targetUrl)
						continue;

                    if(tabs[i].url.indexOf("chrome-internal://newtab/") != -1 ||  
					(targetUrl == "chrome-internal://newtab/" && (tabs[i].url.indexOf("chrome://newtab/") != -1 || (tabs[i].url.indexOf("chrome-extension://") != -1 && tabs[i].url.indexOf("/Search/NewTabPages/html/new_tab.html") != -1)))) {

                    	chrome.tabs.update(tabs[i].id, { "url": targetUrl });
                    }
             }
            });
             
         },
         
         redirectToDefaultNewTab: function () {

         	chrome.tabs.query({ url: "chrome://newtab/" }, function(tabs) {
         		for (var i = 0; i < tabs.length; ++i) {

         			chrome.tabs.update(tabs[i].id, { "url": "chrome-internal://newtab/" });

         		}
         	});
         },
         
         tabChangedHandler : function(activeInfo) {
//             chrome.tabs.get(activeInfo.tabId, function(tab) {
//                 if (tab && tab.url == "chrome://newtab/") {
//                     console.log("setting focus");
//                     chrome.tabs.executeScript(tab.id, { code: "ntp.externalSetFocus();" });
//                 }
//             });
             
//             var tabs = chrome.extension.getViews({type: "tab"});
//             if (tabs && tabs.length > 0) {
//                 consoleLog("setting focus");
//                 for (var i = 0; i < tabs.length; i++) {
//                     if (tabs[i].ntp && tabs[i].ntp.externalSetFocus) {
//                         tabs[i].ntp.externalSetFocus();
//                         return;
//                     }
//                 }
//                 consoleLog("externalSetFocus not found");
//             }
             
             if (conduit.newtab.toolbar.hasAlternativeFocus())
                conduit.newtab.toolbar.alternativeFocus();
         },
         
         get toolbarLocale() {
            return conduit.newtab.toolbar.toolbarLocale();
         },

         getVersion: function () {
         },

         getConduitHomepage: function () {
            return conduit.newtab.settings.getSettingsKey('HomepageUrl');
         },

         getContactUsUrl: function () {
            var contactUsUrl = conduit.newtab.embeddedConfig.get("contactUsUrl") + "/contact";
            return contactUsUrl;
         },
         
         getPrivacyUrl: function () {
            var privacyUrl = conduit.newtab.settings.getSettingsKey('PrivacyUrl');
            return privacyUrl;
         },
         
         getExtensionVersion: function () {

         },

         getBrowserVersion: function () {
            
         },

         getCtid: function () {
            return conduit.newtab.toolbar.ctid();	
         },

         getUserId: function () {
            return conduit.newtab.toolbar.userID();
         },
         
         get currentPage() {
            return currentShowingPage;
         },


         set currentPage(value) {
            currentShowingPage = value;
         },

         get currentPageIndex() {
            return currentPageIndex;
         },

         set currentPageIndex(value) {
            currentPageIndex = value;
         },
         

         formatUrl : function(url) {
             var ctid = conduit.newtab.getCtid();
             url = url.replace("EB_TOOLBAR_ID", ctid);
             url = url.replace("EB_ORIGINAL_CTID", ctid);
             url = url.replace("SB_CUI", conduit.newtab.getUserId());

             var sspv = conduit.newtab.toolbar.sspv().replace("?SSPV=", '').replace("&", '');
             url = url.replace("EB_SSPV", sspv);

             var umId = conduit.newtab.toolbar.umId();
             if (typeof(umId) != 'undefined' && umId != '')
                 url = url.replace("UM_ID", umId);

             var upId = conduit.newtab.toolbar.upId();
             if (upId != null && upId.length > 0) {
                 url = url.replace(/UP_ID/g, upId);
             }

             return url;
         },
         
         developerMode: new developerModeObj(),
         startupSequence: new startupSequenceObj(),
         locationService: new LocationServiceObj(),
         recentlyClosed: new recentlyClosedObj(),
         SearchHistoryButton: new recentlyClosedObj(),
         mostVisited: new mostVisitedObj(),
         bookmarks: new bookmarksObj(),
         applications: new applicationsObj(),
         settings: new settingsObj(),
         usage: new usageObj(),
         logMsg : new logMsgObj(),
         translation: new translationObj(),
         searchBox: new searchBoxIframeObj(),
         cntRedirect : new cntRedirectObj(),
         serviceMap : new serviceMapObj(),
         embeddedConfig : new embeddedConfigObj(),
         thumbnails : new thumbnailsObj(),
         toolbar: new toolbarObj()
      };

   };

   return {
      newtab: new newTabObj()
   };
};

var conduit = new NewTabAPI();

chrome.tabs.onActivated.addListener(conduit.newtab.tabChangedHandler);