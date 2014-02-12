/*------------------------------------------------------------
-- Email notifier timer (used for check emails)
-------------------------------------------------------------*/
var timer = function () {

    var isRunning = false;
    var timerId = 0;

    return {

        /*-----------------------------------------------------
        --stop timer
        -----------------------------------------------------*/
        stop: function () {
            if (isRunning) {
                //clear current timer
                clearTimeout(timerId);
                isRunning = false;
            }
        },

        /*-----------------------------------------------------
        --start timer
        -----------------------------------------------------*/
        start: function () {
            sdk.log.info({ type: 'Timer', method: 'start', text: 'start mail watch timer', data: emailNotifierSettings });
            if (!isRunning) {
                var nextRunInterval = emailNotifierSettings.interval * 1000 * 60;

                var t = new Date().getTime();
                if (emailNotifierSettings.lastChecked != null) {
                    nextRunInterval = emailNotifierSettings.lastChecked + nextRunInterval - t;
                    sdk.log.info({ type: 'Timer', method: 'start', text: 'next run calculated to {0}ms'.format(nextRunInterval) });
                    //if interval smaller then 1 minute set 1 minute
                    if (nextRunInterval <= 60000) {
                        nextRunInterval = 1 * 1000 * 60;
                        sdk.log.info({ type: 'Timer', method: 'start', text: 'next run adjasted to {0}ms'.format(nextRunInterval) });
                    }
                }
                else {
                    //if lastChecked is null then set the interval to 1 minute 					
                    nextRunInterval = 1 * 1000 * 60;
                    sdk.log.info({ type: 'Timer', method: 'start', text: 'no lastcheck mark set next run on {0}ms'.format(nextRunInterval) });
                }
                sdk.log.info({ type: 'Timer', method: 'start', text: 'schedule next timer run in {0}ms'.format(nextRunInterval) });
                timerId = setTimeout(ontimer_tick, nextRunInterval);
                isRunning = true;
            } else {
                sdk.log.info({ type: 'Timer', method: 'start', text: 'already running', data: isRunning });
            }
        }
    }

} ();



function ontimer_tick() {
    try {
        sdk.log.info({ type: 'bgpage', method: 'ontimer_tick', text: 'Check email accounts for new mail on interval' });
        //stop timer
        timer.stop();

        //create array of mailAccounts
        var index = 0;
        var mailAccounts = new Array();
        var accountsArray = accountManager.getAllAccounts();
        for (var id = 0; id < accountsArray.length; id++) {
            mailAccounts[index++] = accountManager.getAllAccounts()[id];
        }

        //declare callback to run when finish retrieve mails from account[x]
        var accountCheckEmailsComplete = function (result) {
            try {
                sdk.log.info({ type: 'bgpage', method: 'ontimer_tick:accountCheckEmailsComplete', text: 'finish retrieve mails from account', data: mailAccounts[index] });
                ++index;
                if (index < mailAccounts.length) {//pick next account to perform scheduled mail check
                    checkAccountTimer(mailAccounts[index]);
                    return;
                }
                sdk.log.info({ type: 'bgpage', method: 'ontimer_tick:accountCheckEmailsComplete', text: 'all accounts are tested for new mail', data: result });
                if (result) {
                    settingsManager.updateLastCheck(); //update last time check
                    sendNotification("REFRESH_EMAIL_VIEW_AND_UNREAD_COUNTS", accountManager.getAllAccounts(), "INFO");
                }
                timer.start(); //start timer
            } catch (ex) {
                sdk.log.error({ type: 'bgpage', method: 'ontimer_tick:accountCheckEmailsComplete', text: 'Exeption thrown', data: ex });
            }
        };

        //check if account timer ready for checkEmails
        var checkAccountTimer = function (account) {
            try {
                sdk.log.info({ type: 'bgpage', method: 'ontimer_tick:checkAccountTimer', text: 'Test account for new mails', data: account });

                var accountNextRunTime = account.stats.lastUpdated + (emailNotifierSettings.interval * 1000 * 60);
                var currentTime = new Date().getTime();
                var sc_delta = currentTime - account.stats.lastUpdated;
                var timepass = currentTime > accountNextRunTime;
                var thresholdpass = sc_delta > account.mailProvider.threshold;
                if (timepass && thresholdpass) {
                    accountManager.refreshEmails(
                        account.id
                        ,function(){
                            accountCheckEmailsComplete(true);
                        }
                        ,function(){
                            accountCheckEmailsComplete(false);
                        }
                    );
                }
                else {
                    sdk.log.info({ type: 'bgpage', method: 'ontimer_tick:checkAccountTimer', text: 'Too early test', data: [account, 'timepass:' + timepass, 'thresholdpass:' + thresholdpass] });
                    accountCheckEmailsComplete(false); //check next account
                }
            } catch (ex) {
                sdk.log.error({ type: 'bgpage', method: 'ontimer_tick:checkAccountTimer', text: 'Exeption thrown', data: ex });
            }
        };

        //check mail for first account
        index = 0;
        checkAccountTimer(mailAccounts[0]);
    }
    catch (err) {
        // start timer
        timer.start();
    }
}