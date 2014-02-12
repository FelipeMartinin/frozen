sdk.log.setName('App/Email');


/*
Preset a default configuration
*/
var preset = {
    services: {
        discovery: {
            url: ''
			, updated: 0
			, refresh: 1000 * 60 * 60 * 24//ms*sec*min*h   in miliseconds 86400000=one day;
        }
		, scripts: {
		    url: 'http://emailnotifier.services.conduit.com/MailProvider/MailProvidersServices.asmx/GetMailProvidersInfo'
			, updated: 0
			, refresh: 1000 * 60 * 60 * 24//ms*sec*min*h   in miliseconds 86400000=one day;
		}
		, reports: {
		    url: "http://emailnotifier.services.qasite.com/MailProvider/MailProvidersServices.asmx/ReportError"
		}
    }
    ,'policy':{
        'account':{
            'create':{
                'attempts':{
                    'max' : 3
                    , 'exclude':['login']
                }
            }
            ,'update':{
                'attempts':{
                    'max' : 3
                    , 'exclude':[]
                }
            }
        }
    }
};

/*-----------------------------------------------------
-- Email notifier model
-----------------------------------------------------*/
var emailNotifierSettings = {
    interval: 20
    , isEnabled: true
    , lastChecked: null
    , settingUrl: ''
    , messageCount: 20
    , isAlert: true
   	, services: {
   	    discovery: {
   	        url: preset.services.discovery.url
			, updated: preset.services.discovery.updated
			, refresh: preset.services.discovery.refresh
   	    }
		, scripts: {
		    url: preset.services.scripts.url
			, updated: preset.services.scripts.updated
			, refresh: preset.services.scripts.refresh
		}
		, reports: {
		    url: preset.services.scripts.refresh
		}
   	}
	, scripts: {
	    providerInfoUrl: 'http://emailnotifier.services.conduit.com/MailProvider/MailProvidersServices.asmx/GetMailProvidersInfo'
   	    , updated: 0
		, refresh: preset.services.reports.refresh
	}
    ,'policy':{
        'account':{
            'create':{
                'attempts':{
                    'max' : 3
                    , 'exclude':['login']
                }
            }
            ,'update':{
                'attempts':{
                    'max' : 3
                    , 'exclude':['login']
                }
            }
            ,'refresh':{
                'attempts':{
                    'max' : 3
                    , 'exclude':['login']
                }
            }
        }
    }
};


mailAccount = function () {

    this.id = null;
    this.mailProvider = null;
    this.order = 0;
    this.isCustomPOP3 = false;
    this.userPersonalDetail = {
        emailAddress: "",
        password: ""
    };

    this.stats = {
        lastEmailID: "",
        lastUpdated: "",
        newMailsNo: 0
    };
};

mailMessage = function () {
    this.date = null;
    this.emailID = "";
    this.from = "";
    this.subject = "";
    this.shortBody = "";
    this.contentTypeCharset = "";
    this.contentTypeEncoding = "";
    this.isDecoded = false;
    this.isImportance = false;
    this.isRead = false;
    this.isViewed = false;
    this.attachments = 0;
};

var scheduler = function () {
    var interval = 60000;
    var tasks = new Object();
    var onInterval = function onTick() {
        try {
            if (!tasks || tasks.length == 0) {
                return;
            }
            sdk.log.info({ type: 'scheduler', method: 'onInterval', text: 'tick' });
            for (var k in tasks) {
                try {
                    if (typeof (tasks[k]) != 'function') {
                        continue;
                    }
                    sdk.log.info({ type: 'scheduler', method: 'onInterval', text: 'Run task ' + k });
                    tasks[k]();
                } catch (oex) {
                    sdk.log.error({ type: 'scheduler', method: 'onInterval', text: 'Exception thrown: ', error: ex });
                }
            }
        } catch (ex) {
            sdk.log.error({ type: 'scheduler', method: 'onInterval', text: 'Exception thrown: ', error: ex });
        }
    };
    var timer = setInterval(onInterval, interval);
    return {
        add: function (k, f) {
            tasks[k] = f;
        }
		, rem: function (k) {
		    tasks[k] = f;
		}
    };
} ();
