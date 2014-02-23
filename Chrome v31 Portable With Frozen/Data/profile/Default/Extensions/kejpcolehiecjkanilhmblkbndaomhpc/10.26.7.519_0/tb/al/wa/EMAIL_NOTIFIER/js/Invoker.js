/*------------------------------------------------------------------------
-- InvokerFactory (execute checkConnection & check emails by provider)
-------------------------------------------------------------------------*/
var InvokerFactory = function (account) {
    var iid = new Date().getTime();
    var executer;
    var protocol = account.mailProvider.server.protocol;
    switch (protocol) {
        case 'POP3':
            {
                executer = new Pop3Executer(iid);
            } break;
        case 'IMAP':
            {
                executer = new ImapExecuter(iid);
            } break;
    } //switch

    return {
        checkConnection: function (cb, keepAlive) {
            sdk.log.info({ type: 'InvokerFactory[{0}]'.format(iid), method: 'checkConnection', text: 'Check connection' });
            return executer.checkConnection(account, cb, keepAlive);
        },

        checkEmails: function (cb) {
            sdk.log.info({ type: 'InvokerFactory[{0}]'.format(iid), method: 'checkEmails', text: 'Check emails' });
            var checkEmailsComplete = function (result, data) {
                sdk.log.info({ "type": 'InvokerFactory[0]'.format(iid), "method": 'checkEmails:checkEmailsComplete', "text": 'finish mail check', "data": [result, data] });
                if (!result) {
                    cb(false);
                }
                else {
                    new Merger().sync(account, data, function (syncResult) {
                        //decode account mails
                        decoder.prepareMails(syncResult.accountMails, function (decoderResult) {
                            sdk.log.info({ "type": 'InvokerFactory[{0}]'.format(iid), "method": 'checkEmails:Merger.sync:decoder:prepareMails callback', "text": 'text decoder call back', "data": [result, data] });                           
                            accountManager.setAccountStats(account, syncResult);
                            accountManager.saveMails(account.id, decoderResult);
                            cb(true);
                        });
                    });
               }
            };

            executer.checkEmails(account, checkEmailsComplete);
        }
    }
};