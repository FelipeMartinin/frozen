/*-----------------------------------------------------------
-- Settings Manager
-----------------------------------------------------------*/
var settingsManager = function () {
    var type = 'settingsManager';
    /*-----------------------------------------------------
    --save the updated settings
    -----------------------------------------------------*/
    var saveSettings = function () {
        var strSettings = JSON.stringify(emailNotifierSettings);
        conduit.storage.app.items.set("Settings", strSettings);
    }

    return {

        /*-----------------------------------------------------
        --load setting from repository (if exists -other use the default settings)
        -----------------------------------------------------*/
        loadSettings: function (cb) {
            conduit.storage.app.items.get("Settings", function (data) {
                try {
                    data = JSON.parse(data);
                }
                catch (e) { }
                if (data != null && typeof (data) == 'object') {
                    emailNotifierSettings = data;
                    emailNotifierSettings.services = emailNotifierSettings.services || preset.services;
                    emailNotifierSettings.policy = emailNotifierSettings.policy || preset.policy;
                }
                cb && cb();
            }, function (e) { cb && cb(); });
        },
        
        save: function () {
            saveSettings();
        },

        /*-----------------------------------------------------
        --change the timer interval
        -----------------------------------------------------*/
        changeInterval: function (newValue) {
            timer.stop();
            emailNotifierSettings.interval = newValue;

            saveSettings();
            timer.start();
        },

        /* 
            @update - object it's  a same stucture as preset
        */
        updateConfig: function (update) {
            sdk.log.info({ 'type': type, method: 'updateConfig', text: 'update config with:' });
            if (!update || !update.services) {
                return;
            }
            /*enshure the updated has settings*/
            update.services.discovery = update.services.discovery || emailNotifierSettings.services.discovery;
            update.services.scripts = update.services.scripts || emailNotifierSettings.services.scripts;
            update.services.reports = update.services.reports || emailNotifierSettings.services.reports;

            /* update service settings */
            emailNotifierSettings.services.discovery.url = update.services.discovery.url || emailNotifierSettings.discovery.scripts.url;
            emailNotifierSettings.services.discovery.refresh = (kit.util.inRange(update.services.discovery.refresh, 1000)) ? update.services.discovery.refresh : emailNotifierSettings.discovery.scripts.refresh;

            emailNotifierSettings.services.scripts.url = update.services.scripts.url || emailNotifierSettings.services.scripts.url;
            emailNotifierSettings.services.scripts.refresh = (kit.util.inRange(update.services.scripts.refresh, 1000)) ? update.services.scripts.refresh : emailNotifierSettings.services.scripts.refresh;

            emailNotifierSettings.services.reports.url = update.services.reports.url || emailNotifierSettings.reports.scripts.url;
            /* save settings in repository*/
            saveSettings();
        },


        /*-----------------------------------------------------
        -- Is alert when new mail recieved
        -----------------------------------------------------*/
        setAlert: function (isAlert) {

            emailNotifierSettings.isAlert = isAlert;
            saveSettings();
        },

        /*-----------------------------------------------------
        -- update the last check 
        -----------------------------------------------------*/
        updateLastCheck: function () {
            emailNotifierSettings.lastChecked = new Date().getTime();
            saveSettings();
        }
    }
} ();