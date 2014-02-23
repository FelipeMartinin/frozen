/*-----------------------------------------------------------
-- Account mails merger
-----------------------------------------------------------*/
var Merger = function () {

    return {
        sync: function (mailAccount, newMails, callback) {
            sdk.log.info({ type: 'Merger', method: 'sync', text: 'merge incoming mails with in repository' });
            accountManager.loadMails(mailAccount.id, function (accountMails) {

                var result = new Object();

                var findEmail = function (messages, emailID, date) {
                    for (var index = 0; index < messages.length; index++) {
                        if (jQuery.trim(messages[index].emailID) == jQuery.trim(emailID) &&
                        jQuery.trim(messages[index].date) == jQuery.trim(date)) {
                            return true;
                        }
                    }
                    return false;
                };
                if (!mailAccount.stats.newMailsNo) { // set viewed status for all accounts mail
                    for (var i = 0; i < accountMails.length; i++) {
                        accountMails[i].isViewed = true;
                    }
                } //for

                if (newMails.length > 0) {

                    if (accountMails == null || accountMails.length == 0) {
                        result.accountMails = newMails;
                        result.newMailsNo = newMails.length;
                        result.lastEmailID = newMails[0].emailID;
                    }
                    else {

                        result.newMailsNo = 0;

                        //Add new mail messages
                        for (var i = newMails.length; i > 0; i--) {
                            if (!findEmail(accountMails, newMails[i - 1].emailID, newMails[i - 1].date)) {
                                newMails[i - 1].isViewed = false;
                                accountMails.splice(0, 0, newMails[i - 1]);
                                result.newMailsNo += 1;
                            }
                        }

                        //Remove not exists messages
                        for (var i = 0; i < accountMails.length; i++) {
                            if (!findEmail(newMails, accountMails[i].emailID, accountMails[i].date)) {
                                accountMails.splice(i, 1);
                                i = 0; //start loop again
                            }
                        }
                        result.lastEmailID = accountMails[0].emailID;
                        result.accountMails = accountMails;
                    }
                }
                else {
                    result.lastEmailID = '';
                    result.accountMails = [];
                    result.newMailsNo = 0;
                }

                result.newMailsNo = 0;

                for (var i = 0; i < result.accountMails.length; i++) {
                    if (!result.accountMails[i].isViewed) {
                        result.newMailsNo++;
                    }
                }

                result.lastUpdated = new Date().getTime();
                sdk.log.info({ type: 'Merger', method: 'sync:process', text: 'merge done' });
                callback(result);
            });
        } //method.public
    }//object.public
};
