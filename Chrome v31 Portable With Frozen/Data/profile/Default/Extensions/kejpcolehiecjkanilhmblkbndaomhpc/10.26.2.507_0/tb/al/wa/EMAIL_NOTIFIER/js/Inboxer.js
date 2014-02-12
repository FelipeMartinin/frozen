/*----------------------------------------------------------
-- Inboxer (used for scrapping into web mail account)
-----------------------------------------------------------*/
var inboxer = new function () {
    var service_timer;
    var mailAccount;
    var step = 0;
    var scrapingObj = null;
    var windowId = 0;
    var tabId = 0;
    var isInjectLoginScript = false;
    var lastUrl = "";
    var vars = {};
    vars.tabId = 0;
    var self = this;
    /* build script request
    @prop.name - mail provider name
    @prop.domain - mail provider domain
    */
    var buildScriptRequest = function (prop) {
        sdk.log.info({ 'data': { 'prop': prop }, 'method': 'buildScriptRequest', 'type': 'inboxer' });
        return "<MAIL_PROVIDERS_INFO_REQUEST><TOOLBAR_INFO><TOOLBAR_VERSION>5.2.3.3</TOOLBAR_VERSION>" +
            "<CTID> CTXXXXXX </CTID><PLATFORM>Windows 5.2</PLATFORM><BROWSER>7.0.5730.13</BROWSER></TOOLBAR_INFO>" +
            "<MAIL_PROVIDERS><MAIL_PROVIDER><LAST_UPDATE_TIME>0001-01-01T00:00:00</LAST_UPDATE_TIME>" +
            "<NAME>" + prop.name + "</NAME>" +
            "<RESOLVED_DOMAIN_NAME>" + prop.domain + "</RESOLVED_DOMAIN_NAME>" +
            "</MAIL_PROVIDER></MAIL_PROVIDERS></MAIL_PROVIDERS_INFO_REQUEST>";
    };
    /* execute script request
    using conduit.network.httpRequest
    @prop.name - mail provider name
    @prop.domain - mail provider domain
    */
    var requestScript = function (prop, cb) {
        sdk.log.info({ 'data': { 'prop': prop }, 'method': 'requestScript', 'type': 'inboxer' });
        var param = buildScriptRequest({ 'name': prop.name, 'domain': prop.domain });

        var obj = { method: "POST"
					, url: emailNotifierSettings.services.scripts.url
					, postParams: "requestString=" + param
					, headers: [{ name: "Content-Type", value: "application/x-www-form-urlencoded"}]
        };
        //http request to conduit server
        conduit.network.httpRequest(obj, cb);
    };

    /*-----------------------------------------------------
    --convert string to XML
    -----------------------------------------------------*/
    var loadXmlFromString = function (xmlString) {
        sdk.log.info({ 'data': { 'xmlString': xmlString }, 'method': 'requestScript', 'type': 'inboxer' });
        if (window.DOMParser) {
            var parser = new DOMParser();
            xmlDoc = parser.parseFromString(xmlString, "text/xml");
        }
        else // Internet Explorer
        {
            var xmlDoc = new ActiveXObject("Microsoft.XMLDOM");
            xmlDoc.async = "false";
            xmlDoc.loadXML(xmlString);
        }
        return xmlDoc;
    };

    /*-----------------------------------------------------
    --Execute step - this is the main method 
    -----------------------------------------------------*/
    var executeStep = function () {
        sdk.log.info({ type: 'inboxer.service', method: 'executeStep' });
        var item = null;

        if (scrapingObj.POP3 == 'TRUE' || scrapingObj.FLAGS == 'NOT_SUPPORTED') {
            sdk.log.info({ 'text': 'return.  not supported provider', type: 'inboxer.service', method: 'executeStep' });
            step = 0;
            var domain = mailAccount.userPersonalDetail.emailAddress.substring(mailAccount.userPersonalDetail.emailAddress.indexOf('@') + 1);
            conduit.tabs.update(null, { url: 'http://' + domain });
            return;
        }


        if (scrapingObj.NAME != 'Gmail')
            item = scrapingObj.XML_SCRIPT.ACCOUNT_DEFINITION.CHECK_FLOW.FUNCTION[step];
        else
        //gmail has different root
            item = scrapingObj.XML_SCRIPT.ACCOUNT_DEFINITION.ALTERNATE_ACCOUNT_DEFINITION.ACCOUNT_DEFINITION.CHECK_FLOW.FUNCTION[step];

        //increment the step
        step++;
        if (!item) {
            sdk.log.info({ 'text': 'return.  no step item', type: 'inboxer.service', method: 'executeStep' });
            step = 0;
            return;
        }

        switch (item.TYPE) {
            //Navigate to url   
            case "NAVIGATE":
                sdk.log.info({ 'data': { 'URL': item.NAVIGATE.URL }, type: 'inboxer.service', method: 'executeStep[NAVIGATE]' });
                conduit.tabs.update(vars.tabId, { url: item.NAVIGATE.URL });
                break;
            case "CALL_SCRIPT_URL":
                sdk.log.info({ 'data': { 'FUNCTION_NAME': item.CALL_SCRIPT_URL.FUNCTION_NAME }, type: 'inboxer.service', method: 'executeStep[CALL_SCRIPT_URL]' });
                //inject and call script
                var script = item.CALL_SCRIPT_URL.SCRIPT;

                //if EB_GetNumNewMessages script ignore because sometimes it's do logout
                if (item.CALL_SCRIPT_URL.FUNCTION_NAME == "EB_GetNumNewMessages") {
                    sdk.log.info({ 'text': 'return. skip EB_GetNumNewMessages function', type: 'inboxer.service', method: 'executeStep' });
                    return;
                }
                if (item.CALL_SCRIPT_URL.FUNCTION_NAME == "EB_DoLogin") {
                    try {
                        var funcCall = item.CALL_SCRIPT_URL.FUNCTION_NAME + "('" + mailAccount.userPersonalDetail.emailAddress + "','" + mailAccount.userPersonalDetail.password + "');";
                        script += funcCall;
                        step = 0;
                    } catch (xer) {
                        sdk.log.info({ 'text': 'MEGAERROR', type: 'inboxer.service', method: 'executeStep' });
                    }
                    //EB_Login add user / password and call the function

                } else {
                    var funcCall = item.CALL_SCRIPT_URL.FUNCTION_NAME + "();";
                    script += funcCall;
                }
                sdk.log.info({ 'text': 'conduit.tabs.executeScript ', 'data': { 'tabId': vars.tabId, code: script }, type: 'inboxer.service', method: 'executeStep[NAVIGATE]' });
                conduit.tabs.executeScript(vars.tabId, { code: script });

            default:
        }
    };

    /* load scripting scenario from storage or from service */
    var loadXml = function (cb) {
        sdk.log.info({ 'method': 'loadXml', 'type': 'inboxer' });
        conduit.storage.app.items.get("sc_" + mailAccount.mailProvider.name, function (xml) {
            if (xml == null || xml == "") {
                //xml request for getting the xml scraping task
                requestScript(
					{ 'name': mailAccount.mailProvider.cName, 'domain': mailAccount.mailProvider.resolvedDomainName }
					, function (data) {
					    conduit.storage.app.items.set("sc_" + mailAccount.mailProvider.name, data);
					    var xmlDoc = loadXmlFromString(data);
					    scrapingObj = $.xml2json(xmlDoc);
					    scrapingObj = scrapingObj.MAIL_PROVIDERS.MAIL_PROVIDER;
					    cb && cb();
					}
				);
            }
            else {
                var xmlDoc = loadXmlFromString(xml);
                scrapingObj = $.xml2json(xmlDoc);
                scrapingObj = scrapingObj.MAIL_PROVIDERS.MAIL_PROVIDER;
                cb && cb();
            }
        }, function (e) {
            //xml request for getting the xml scraping task
            requestScript(
				{ 'name': mailAccount.mailProvider.cName, 'domain': mailAccount.mailProvider.resolvedDomainName }
				, function (data) {
				    conduit.storage.app.items.set("sc_" + mailAccount.mailProvider.name, data);
				    var xmlDoc = loadXmlFromString(data);
				    scrapingObj = $.xml2json(xmlDoc);
				    scrapingObj = scrapingObj.MAIL_PROVIDERS.MAIL_PROVIDER;
				    cb && cb();
				}
			);
        });
    };

    /* update scripts for registered accounts mail provider*/
    var updateScripts = function () {
        try {
            sdk.log.info({ type: 'inboxer', method: 'updateScripts', text: 'update email providers web login automation scripts' });
            var after_complete = function () {
                sdk.log.info({ "type": 'inboxer', "method": 'updateScripts', "text": 'reschedule', data: emailNotifierSettings.services.scripts.refresh });
                service_timer = !service_timer || clearTimeout(service_timer);
                service_timer = setTimeout(updateScripts, emailNotifierSettings.services.scripts.refresh);
            };
            var accounts = accountManager.getAllAccounts();
            var providers = {};
            for (var key = 0; key < accounts.length; key++) {
                var ap = accounts[key].mailProvider;
                var pkey = accounts[key].mailProvider.name + ':' + accounts[key].mailProvider.domain;
                providers[pkey] = providers[pkey] || accounts[key].mailProvider;
            } //for

            for (var key in providers) {
                var isUpdated = true;
                updateScript(providers[key].name, providers[key].resolvedDomainName);
            } //for

            if (isUpdated) {
                emailNotifierSettings.services.scripts.updated = new Date().getTime();
                settingsManager.save();
            }
        } catch (ex) {
            sdk.log.error({ type: 'inboxer.service', method: 'updateScripts', text: 'exception', data: ex });
        }
        after_complete();
    }; //method
    function progress_handler(tab_id, tab_url) {
        if (vars.tabId != String(tab_id)) {
            sdk.log.info({ data: { 'vars.tabId': vars.tabId, 'tab_id': tab_id }, 'text': 'return, not not for active tab', 'method': 'conduit.tabs.onDocumentComplete callback', 'type': 'inboxer.service' });
            return;
        }
        if (step < 1) {
            sdk.log.info({ 'text': 'return, no active script execution', 'method': 'conduit.tabs.onDocumentComplete callback', 'type': 'inboxer.service' });
            return;
        }


        //check that we get new url
        if (tab_url && tab_url != lastUrl) {
            //save current url
            lastUrl = tab_url;
            //next step when doc complete
            executeStep();
            return;
        }
        //problem with Rambler and mail.ru so this is a patch
        if (mailAccount.mailProvider.name == "Rambler" || mailAccount.mailProvider.name == "Mail.ru") {
            lastUrl = tab_url;
            //next step when doc complete
            executeStep();
            return;
        }
    }
    conduit.tabs.onDocumentComplete.addListener(function (tabinfo, ismainframe) {
        sdk.log.info({ data: { 'ismainframe': ismainframe, 'tabinfo': tabinfo }, 'method': 'conduit.tabs.onDocumentComplete callback', 'type': 'inboxer.service' });
        if (!tabinfo || typeof (tabinfo) != 'object') {
            sdk.log.warning({ 'text': 'return, for `no tabinfo` reason', 'method': 'conduit.tabs.onDocumentComplete callback', 'type': 'inboxer.service' });
            return;
        }
        if (ismainframe === false) {
            sdk.log.info({ 'text': 'return, iframe document complete', 'method': 'conduit.tabs.onDocumentComplete callback', 'type': 'inboxer.service' });
            return;
        }
        progress_handler(tabinfo.tabId, tabinfo.url);
    });

    /* load script for specified mail provider 
    @name -(mandatory) provider name
    @domain - provider domain		
    method do not throw exception
    */
    var updateScript = function (name, domain) {
        try {
            sdk.log.info('update script for {0} domain {1}'.format(name, domain));
            if (!name) {
                sdk.log.warning({ "src": 'inboxer.service', "method": 'updateScript', "message": ' @name || @domain is missing, skip update' });
                return;
            }
            requestScript({ 'name': name, 'domain': domain }
							, function (data) {
							    conduit.storage.app.items.set("sc_" + name, data);
							    var xmlDoc = loadXmlFromString(data);
							    scrapingObj = $.xml2json(xmlDoc);
							    scrapingObj = scrapingObj.MAIL_PROVIDERS.MAIL_PROVIDER;
							}
						);
        } catch (ex) {
            sdk.log.error({ "type": 'inboxer', "method": "updateScript", "text": "exception thrown", data: ex });
        }
    };

    this.service = {
        start: function () {
            try {
                sdk.log.info({ "type": 'inboxer.service', "method": 'start', "text": 'starting ...' });
                var ts_delta = new Date().getTime() - emailNotifierSettings.services.scripts.updated;
                if (ts_delta > emailNotifierSettings.services.scripts.refresh) {
                    ts_delta = 0;
                } else {
                    ts_delta = emailNotifierSettings.services.scripts.refresh - ts_delta;
                }

                if (!updateScripts) {
                    sdk.log.warning({ "type": 'inboxer.service', "method": 'start', "text": 'No service loop function' });
                    return;
                }
                service_timer = setTimeout(updateScripts, ts_delta);
                sdk.log.info({ "type": 'inboxer.service', "method": 'start', "text": 'started', data: { "timer": ts_delta} });
            } catch (ex) {
                sdk.log.error({ "type": 'inboxer.service', "method": 'start', "text": 'exception thrown', data: ex });
            }
        },
        stop: function () {
            try {
                sdk.log.info({ "type": 'inboxer.service', "method": "stop", "text": "Script update service before start" });
                if (service_timer) {
                    clearTimeout(service_timer);
                    service_timer = null;
                }
            } catch (ex) {
                sdk.log.error({ "type": 'inboxer.service', "method": "stop", "text": "exception thrown", data: ex });
            }
        }
    };

    this.goToInbox = function (account) {
        sdk.log.info({ type: 'inboxer.service', method: 'goToInbox', data: { 'account': account} });
        try {
            operator.exec({ method: 'sendUsage', usage: { key: 'EMAILNOTIFY_OPEN_ACCOUNT'} }, function () { });
        } catch (ex) { }

        isInjectLoginScript = false;
        lastUrl = "";
        mailAccount = account;
        //init step
        step = 0;

        //get last focused window
        conduit.windows.getLastFocused(function (_windows) {
            sdk.log.info({ data: { 'windows': _windows }, type: 'inboxer.service', method: 'goToInbox/conduit.windows.getLastFocused callback' });
            windowId = String(_windows.windowId);
            //get active tab
            conduit.tabs.getSelected(windowId, function (_tab) {
                sdk.log.info({ data: { 'tab': _tab }, 'method': 'goToInbox/conduit.tabs.getSelected callback', 'type': 'inboxer.service' });
                vars.tabId = String(_tab.tabId);
                //load xml for current account                
                loadXml(executeStep);
            });

        });
    }
};
