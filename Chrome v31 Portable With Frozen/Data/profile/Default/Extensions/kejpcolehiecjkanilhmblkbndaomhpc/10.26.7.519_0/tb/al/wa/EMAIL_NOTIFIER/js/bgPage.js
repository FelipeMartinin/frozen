var kit = {
    "util": {
        "toBool": function (value) {
            var type = typeof value;
            switch (type) {
                case 'boolean': return value;
                case 'number': return !!value;
                case 'string':
                    {
                        var string = value.toLowerCase();
                        return string == 'true' || string == "'true'" || string == '"true"';
                    }
                case 'object':
                    {
                        var string = String(value).toLowerCase();
                        return (string == 'true' || string == "'true'" || string == '"true"');
                    }
                default: return false;
            }
        }
        , "isNumber": function (value) { return !isNaN(value); } //function
        , "isInterval": function (value) { return !isNaN(value) && (value > 0); } //function
        , "inRange": function (value, min, max) {
            if (arguments.length < 3) max = Number.MAX_VALUE;
            return !isNaN(value) && (value >= min) && (value <= max);
        } //function
    }
};

sdk.log.info('logger initialized');

function init() {
    loadTranslation(function (){
        operator.ready(true);
        loadSettings();
        //set displayIcon
        conduit.app.getSettingsData(function (settings) {
            if (settings && settings.data && settings.data.checkNewEmailsInterval && settings.data.mailServicesInfo
                && settings.data.mailServicesInfo.supportedMailProvidersService
                && settings.data.mailServicesInfo.supportedMailProvidersInfoService
                && settings.data.mailServicesInfo.reportUsService) {

                var checkNewEmailsInterval = isPositiveNumber(settings.data.checkNewEmailsInterval) ? settings.data.checkNewEmailsInterval : 5;
                var refreshIntervalInSeconds = settings.data.mailServicesInfo.supportedMailProvidersService.refreshIntervalInSeconds;
                refreshIntervalInSeconds = isPositiveNumber(refreshIntervalInSeconds) ? refreshIntervalInSeconds : 86400;
                var infoRefreshIntervalInSeconds = settings.data.mailServicesInfo.supportedMailProvidersInfoService.refreshIntervalInSeconds;
                infoRefreshIntervalInSeconds = isPositiveNumber(infoRefreshIntervalInSeconds) ? infoRefreshIntervalInSeconds : 86400;

                var update = {
                    mails: {
                        refresh: checkNewEmailsInterval
                    },
                    services: {
                        discovery: {
                            url: settings.data.mailServicesInfo.supportedMailProvidersService.url
                            , refresh: refreshIntervalInSeconds * 1000
                        }
                        , scripts: {
                            url: settings.data.mailServicesInfo.supportedMailProvidersInfoService.url
                            , refresh: infoRefreshIntervalInSeconds * 1000
                        }
                        , reports: {
                            url: settings.data.mailServicesInfo.reportUsService.url
                        }
                    }
                };
                settingsManager.updateConfig(update);
            } //if

            var url = settings.data.dynamicMenu.button.buttonIconUrl
                || 'http://emailnotifier.webapps.conduitapps.com/icn/app_button_icon.png';

            var iconOptions = { imageUrl: url };
            conduit.app.icon.setIcon(iconOptions, null);
            sendHandshake();
        });
    });
}//init

function isPositiveNumber(number) {
    if (number === undefined || isNaN(number) || typeof (number) !== "number" || number <= 0) {
        return false;
    }
    return true;
}

function loadSettings() {
    sdk.log.info('load email notifier settings');
    settingsManager.loadSettings(function () {
        if (emailNotifierSettings.isEnabled) {
            sdk.log.info('load accounts if notifier enabled');
            accountManager.loadAccounts(onAccountLoaded);
        }
    });
}

function onAccountLoaded() {
    sdk.log.info({ "type": 'bgpage', "method": 'onAccountLoaded', "text": 'Start check new mail timer when accounts loaded' });

    if (accountManager.getNoOfAccounts() > 0) {
        timer.start();
        UpdateNewMessageNo();
        sendNotification("ACCOUNTS_LOADED", accountManager.getAllAccounts(), "INFO");
    }
    else {
        //no accounts
        setToolTip(transValues['SB_EMAIL_NOTIFIER_BUTTON_1ST_TIME_TOOLTIP']);
    }
    inboxer.service.start();
}

function UpdateNewMessageNo() {
    var newMessages = accountManager.getUnReadMailNo();
    sdk.log.info({ type: 'bgpage', method: 'UpdateNewMessageNo', text: 'Update new message badge', data: newMessages });

    setBadge(newMessages);
    if (newMessages == 0) {
        setToolTip(transValues['SB_EMAIL_NOTIFIER_NO_MSGS_TOOLTIP'], null);
    }
    else if (newMessages == 1) {
        setToolTip(transValues['SB_EMAIL_NOTIFIER_SINGLE_MSG_TOOLTIP'], null);
    }
    else if (newMessages > 1) {
        setToolTip(transValues['SB_EMAIL_NOTIFIER_MULTI_MSG_TOOLTIP'].format(newMessages), null);
    }
} //function

//set tooltip
function setToolTip(text) {
    //conduit.app.icon.setTooltip(text, null);
}

//set toolbar badge
function setBadge(num) {
    if (num > 0)
        conduit.app.icon.setBadgeText(num, null);
    else
        conduit.app.icon.setBadgeText('', null);
}

//get accoutn and stringify the object
function getAccounts() {
    var obj = accountManager.getAllAccounts();
    return JSON.stringify(obj);
}

//////////////////////////////////////////////////
///   MSG METHODS
//////////////////////////////////////////////////

//send notification to popup
function sendNotification(key, dataToDisplay, ns) {
    var notificationObj = {
        key: key,
        data: dataToDisplay,
        notificationStatus: ns
    };
    var data = JSON.stringify(notificationObj);
    conduit.messaging.sendRequest("popup", "Notification", data, null);
}
function sendHandshake(key, dataToDisplay, ns) {
    sdk.log.info({ type: 'global', method: 'handshake'});
    var data={state:'ready'}
    data = JSON.stringify(data);
    conduit.messaging.sendRequest("popup", "handshake", data, null);
}
var operator=new Operator();

function Operator(){
    var $this=this;
    var $methods=this;
    var $log_type = 'Operator';

    var queue=[];
    var ready=false;
    var methods = {
        handshake: function (data, cb) {
            sdk.log.info({ type: 'Operator', method: 'handshake'});
            cb && cb({state:'ready'});
        }
        ,removeAccount: function (data, messageCallback) {
            accountManager.removeAccount(data.account);
            if (accountManager.getNoOfAccounts() == 0)
                timer.stop();
            messageCallback(getAccounts());
        },

        goToInbox: function (data, messageCallback) {
            var account = accountManager.getAccountByID(data.account.id);
            if (account != null)
                inboxer.goToInbox(account);
        },

        addAccount: function (data, messageCallback) {
            accountManager.addAccount(data.account, function () {
                if (accountManager.getNoOfAccounts() > 0)
                    timer.start();
                messageCallback(getAccounts());
            });
        },

        updateAccount: function (data, messageCallback) {
            accountManager.updateAccount(data.account, function () {
                messageCallback(getAccounts());
            });
        },

        getAccounts: function (data, messageCallback) {
            messageCallback(getAccounts());
        },

        getAccountByID: function (data, messageCallback) {
            var obj = accountManager.getAccountByID(data.account.id);
            var strAccount = JSON.stringify(obj);
            messageCallback(strAccount);
        },

        getSettings: function (data, messageCallback) {
            var strSettings = JSON.stringify(emailNotifierSettings);
            messageCallback(strSettings);
        },

        getMailsByAccountID: function (data, messageCallback) {

            var accountId = data.account.id;
            var markAsSeen = data.account.markAsSeen;
            accountManager.loadMails(accountId, function (ma) {
                var acc = accountManager.getAccountByID(accountId);
                if (markAsSeen) {
                    acc = accountManager.markAsSeen(accountId);
                }
                var obj = { account: acc, mails: ma };
                var strMails = JSON.stringify(obj);
                messageCallback(strMails);
            });
        },

        changePosition: function (data, messageCallback) {
            accountManager.changePosition(data.account.id, data.account.replaceWithId);
            messageCallback(getAccounts());
        },

        setAlert: function (data, messageCallback) {
            settingsManager.setAlert(data.settings.isAlert);
        },

        changeInterval: function (data, messageCallback) {
            var newInterval = (data && data.settings && isPositiveNumber(data.settings.interval)) ? data.settings.interval : 20;
            settingsManager.changeInterval(newInterval);
        },

        checkMailProvider: function (data, messageCallback) {
            var obj = providerHelper.findProviderByEmailAddress(data.account.emailAddress);
            var result = null;
            if (obj != null) {
                var result = {
                    success: true,
                    message: "Email successful",
                    provider: obj
                }
            }
            else {
                var result = {
                    success: false,
                    message: "Email unsuccessful",
                    provider: obj
                }
            }
            messageCallback(JSON.stringify(result));
        },


        showPopup: function (data, messageCallback) {
            openPopup();
        },

        refreshEmails: function (data, messageCallback) {
            var fFail = function () {
                var response = { success: false, accData: null };
                messageCallback(JSON.stringify(response));
            };

            if (!data || !data.account || !data.account.id) {
                fFail();
                return;
            }

            accountManager.refreshEmails(
                data.account.id
                , function (acc) {//fSuccess
                    accountManager.loadMails(acc.id, function (ma) {
                        var obj = { 'account': acc, 'mails': ma };
                        messageCallback(JSON.stringify({ 'success': true, 'accData': obj }));
                    })
                }
                , fFail
            );
        },

        getTranslation: function (data, messageCallback) {
            //transValues variable declared in translation.js
            var strTranslation = JSON.stringify(transValues);
            messageCallback(strTranslation);
        },
        /*  <description> send usage key and property object to usage service. function do not cause to exception

         @key - the usage key
         @obj - json properties object
         */
        sendUsage: function (obj, callback) {
            try {
                if (!obj || !obj.usage || !obj.usage.key) { return; }
                var key = obj.usage.key;
                var data = obj.usage.data || {};
                data.numberOfAccounts = accountManager.getAllAccounts().length;
                conduit.logging.usage.log(key, data);
            } catch (ex) { }
        }
    };

    $methods.onMessage=function(data,sender,cb){
        var $log_method = 'onMessage';
        sdk.log.info({ data: {data:data,sender:sender,cb:typeof cb}, method: $log_method, type: $log_type});
        if(!ready){
            sdk.log.info({text:'app still not ready, request enqued', method: $log_method, type: $log_type});
            queue.push({data:data, cb:cb});
            return;
        }
        data=JSON.parseSafe(data,undefined);
        $methods.exec(data,cb);
    }

    $methods.exec=function(data,cb){
        var $log_method = 'exec';
        sdk.log.info({ data: {data:data,cb:typeof cb}, method: $log_method, type: $log_type});
        function callbackSafe(cb){
            try{
                cb && cb();
            }catch(ex){
                sdk.log.warning({text:'calling to callback cause to exception',data:{exception:ex}, method: $log_method, type: $log_type});
            }
            return;
        }
        if(!data || !data.method || !methods[data.method] || typeof cb!='function'){
            sdk.log.warning({text:'invalid data, try call to callback', method: $log_method, type: $log_type});
            callbackSafe(cb);
            return;
        }
        try{
            var handler = methods[data.method];
            handler(data, function (){
                sdk.log.info({data:{command:data,cb:{argv:arguments}}, text:'execution done, try call to callback', method: $log_method, type: $log_type});
                cb.apply($this,arguments);
            });
        }catch(ex){
            sdk.log.warning({text:'execution cause to exception',data:{exception:ex}, method: $log_method, type: $log_type});
            callbackSafe(cb);
        }
    };

    $methods.ready=function (val){
        var $log_method = 'ready';
        sdk.log.info({ data: val, method: $log_method, type: $log_type});
        ready=val;
        if(!val){return;}

        queue.forEach(function(item){
            $methods.onMessage(item.data,item.cb);
        });
    };
}

////////////////////////////////////////////////////////
/// INIT Section
///////////////////////////////////////////////////////
conduit.messaging.onRequest.addListener("backgroundPage", operator.onMessage);

function toCamelCaseFun(str, separator) {
    if (!str || !separator)
        return str;

    var words = str.toLowerCase().split(separator);

    for (var i = 0; i < words.length; i++) {
        if (i > 0) {
            var word = words[i].split("");
            word[0] = word[0].toUpperCase();
            words[i] = word.join("");
        }
    }

    return words.join("");
}

var xml2jsonOptions = {
    rename: function (xmlTagName) {
        return toCamelCaseFun(xmlTagName, "_");
    },
    parser: function (value) {
        if (typeof (value) === "string") {
            switch (value.toLowerCase()) {
                case "true":
                    return true;
                case "false":
                    return false;
                default:
                    return value;
            }
        }
        return value;
    }
};

function importAccounts(data) {
    function convert(iaco) {
        var accounts = {};
        if (!iaco || typeof (iaco.account) != 'object') { return accounts; }
        if (!(iaco.account instanceof Array)) {
            iaco.account = [iaco.account];
        }

        for (var i = 0; i < iaco.account.length; i++) {
            var ido = iaco.account[i];
            var acc = {};
            acc.id = i;
            acc.order = i;
            acc.userPersonalDetail = {};
            acc.userPersonalDetail.emailAddress = ido.email;
            acc.userPersonalDetail.password = ido.password;

            acc.isCustomPOP3 = !!ido.server && ido.server != null && ido.server != 'null';
            acc.mailProvider = providerHelper.findProviderByEmailAddress(acc.userPersonalDetail.emailAddress);
            if (acc.mailProvider == null && !acc.isCustomPOP3) {
                continue;
            }
            acc.mailProvider = acc.mailProvider || {};
            acc.mailProvider.name = acc.mailProvider.name || acc.userPersonalDetail.emailAddress;
            acc.mailProvider.icon = acc.mailProvider.icon || '';

            if (acc.isCustomPOP3) {
                acc.mailProvider = {};
                acc.mailProvider.server = {
                    id: 'default',
                    protocol: 'POP3',
                    port: ido.port,
                    incServer: ido.server
                    , ssl: (ido.port == 995)
                }
            }
            acc.stats = {};
            acc.stats.lastEmailID = undefined;
            acc.stats.lastUpdated = undefined;
            acc.stats.newMailsNo = 0;
            accounts[i] = acc;
        }

        for (var k in accounts) {
            setTimeout(function () {
                accountManager.refreshEmails(accounts[k].id, function () { }, function () { });
            }, 30000);
        }

        return accounts;
    }
    function storeAccounts(data) {
        conduit.encryption.encrypt(JSON.stringify(data), function (text) {

            conduit.storage.app.items.set('accounts', text, function () {
                conduit.storage.global.items.remove('email-import-accounts');
                init();
            }, function () {
                init();
            });
        });
    }

    if (typeof data != 'string' || !data) {
        init();
        return;
    }
    conduit.encryption.decrypt(data, function (xml) {
        try {            
            xml = xml.replace(/\u0000/gi, '');
            var data = $.xml2json(xml, false, xml2jsonOptions);
        } catch (ex) {
            init();
            return;
        }
        var accounts = convert(data);
        storeAccounts(accounts);
    }, function () { init(); });
}

function importSettings(cb) {
    conduit.storage.global.items.get('email-import-accounts', importAccounts, function () {
        init();
    });
} //

importSettings();
