/*---------------------------------------------------------
 -- Account Manager
 ---------------------------------------------------------*/
var accountManager = function () {

    var mailAccounts = new Object();
    var itemsNO = 0;

    /*-----------------------------------------------------
     -- save account in the repository
     -----------------------------------------------------*/
    var saveAccounts = function () {

        var strAccounts = JSON.stringify(mailAccounts);

        //encrypt accounts data
        conduit.encryption.encrypt(strAccounts, function (text) {
            conduit.storage.app.items.set("accounts", text);
        })
    };

    /*-----------------------------------------------------
     -- sort accounts by order property
     -----------------------------------------------------*/
    var sortAccounts = function (accounts) {

        var accTemp = [];
        for (var id in accounts) {
            accTemp.push(accounts[id]);
        }

        accTemp.sort(function (a, b) {
            return parseInt(a.order) - parseInt(b.order)
        });

        return accTemp;
    };

    /*-----------------------------------------------------
     -- check if email exists
     -----------------------------------------------------*/
    var isEmailAlreadyExists = function (emailAdd) {
        for (var i in mailAccounts) {
            if (mailAccounts[i].userPersonalDetail.emailAddress.toLowerCase() == emailAdd.toLowerCase())
                return true;
        }
        return false;
    };

    /*-----------------------------------------------------
     -- get the next order item
     -----------------------------------------------------*/
    var getNextOrder = function () {
        var order = 0;
        for (var i in mailAccounts) {
            if (mailAccounts[i].order != null && mailAccounts[i].order > order)
                order = mailAccounts[i].order;
        }
        return ++order;
    };

    return {

        /*-----------------------------------------------------
         -- add new account
         -----------------------------------------------------*/
        addAccount:function (newAccountDTO, cb) {
            sdk.log.info({'data': { 'newAccountDTO': newAccountDTO}, 'method': 'addAccount', 'type': 'accountManager'});

            var acc = new mailAccount();
            sendNotification("CHECK_ADD_ACCOUNT", transValues['SB_EMAIL_NOTIFIER_PROCESS_MSG_1'], "INFO");
            if (isEmailAlreadyExists(newAccountDTO.emailAddress)) {
                sdk.log.info({'text': 'cancel flow - already exist', 'method': 'addAccount', 'type': 'accountManager'});
                sendNotification("CHECK_ADD_ACCOUNT", transValues['SB_EMAIL_NOTIFIER_FAILED_REASON_EXISTS_MSG'], "ERROR");
                return;
            }

            var id = -1;
            do {
                id = parseInt(Math.random() * 20);
            }
            while (mailAccounts[id] != null);

            acc.id = id;
            acc.userPersonalDetail.emailAddress = newAccountDTO.emailAddress;
            acc.userPersonalDetail.password = newAccountDTO.password;
            acc.order = getNextOrder();
            acc.isCustomPOP3 = newAccountDTO.isCustomPOP3;

            //find provider if is web account else fill the data from user input
            sendNotification("CHECK_ADD_ACCOUNT", transValues['SB_EMAIL_NOTIFIER_PROCESS_MSG_1'], "INFO");
            acc.mailProvider = providerHelper.findProviderByEmailAddress(newAccountDTO.emailAddress);

            if (acc.mailProvider == null) {
                if (!acc.isCustomPOP3) {
                    sdk.log.info({'text': 'cancel flow - no mail provider for account', 'method': 'addAccount', 'type': 'accountManager'});
                    sendNotification("CHECK_ADD_ACCOUNT", transValues['SB_EMAIL_NOTIFIER_FAILED_NOTSUPPORTED_MSG'], "ERROR");
                    return;
                }
                acc.mailProvider = {
                    name:newAccountDTO.emailAddress,
                    icon:''
                }
            }

            if (acc.isCustomPOP3) {
                acc.mailProvider.server = {
                    id:'default',
                    protocol:'POP3',
                    port:newAccountDTO.port,
                    incServer:newAccountDTO.incServer,
                    ssl:newAccountDTO.ssl
                }
            }

            sendNotification("CHECK_ADD_ACCOUNT", transValues['SB_EMAIL_NOTIFIER_PROCESS_MSG_2'], "INFO");
            var attemptsCount=0;
            var reconnectAllowed=function(state){
                if(!state || typeof state.attemptsCount!='number' && typeof state.stage=='undefined'){
                    return false;
                }

                return state.attemptsCount < emailNotifierSettings.policy.account.create.attempts.max
                    && !~emailNotifierSettings.policy.account.create.attempts.exclude.indexOf(state.stage);
            };
            var connectionCallback = function (result, error, stage) {
                sdk.log.info({'data':{'result':result, 'error':error,'stage':stage}, 'method': 'addAccount/connectionCallback', 'type': 'accountManager'});
                var fFail=function(){
                    sdk.log.info({'text': 'fail to connect', 'method': 'addAccount/connectionCallback', 'type': 'accountManager'});
                    if(reconnectAllowed({'attemptsCount':attemptsCount,'stage':stage})){
                        attemptsCount++;
                        checkConnection();
                        return;
                    }
                    sendNotification("CHECK_ADD_ACCOUNT", error, "ERROR");
                };

                var fSuccess=function(){
                    mailAccounts[acc.id] = acc;
                    itemsNO++;
                    saveAccounts();
                    //retrieve mails for the new account
                    sendNotification("CHECK_ADD_ACCOUNT", transValues['SB_EMAIL_NOTIFIER_PROCESS_MSG_3'], "INFO");

                    invoker.checkEmails(function (result) {
                        if (result) {
                            sendNotification("CHECK_ADD_ACCOUNT", transValues['SB_EMAIL_NOTIFIER_SUCCESS_MSG'], "INFO");
                        }
                        else {
                            //sendNotification("CHECK_ADD_ACCOUNT", "Retrieve Mails Failed", "ERROR");
                        }
                        cb();
                    });
                }

                if (result) {
                    fSuccess();
                }else{
                    fFail();
                }
            };

            var invoker ={};
            var checkConnection = function () {
                invoker = new InvokerFactory(acc);
                invoker.checkConnection(connectionCallback, true);
            };
            checkConnection();
        },


        /*-----------------------------------------------------
         -- Remove exist account
         -----------------------------------------------------*/
        removeAccount:function (account) {
            var log_type='accountManager'
            var log_method='removeAccount'
            sdk.log.info({'data': { 'account': account}, 'method': log_method, 'type': log_type});

            if(!account || typeof account!='object'){
                sdk.log.warning({'data': { 'account': account}, 'method': log_method, 'type': log_type});
                return;
            }
            if(account.hasOwnProperty('id')){
                sdk.log.info({'text':'by id', 'method': log_method, 'type': log_type});
                var acc_id=account.id;
            }else if (account.hasOwnProperty('email')){
                sdk.log.info({'text':'look up for account by mail', 'method': log_method, 'type': log_type});
                var acc_email=account.email;
                var acc_id=undefined;
                for (var i in mailAccounts) {
                    if (mailAccounts[i].userPersonalDetail.emailAddress.toLowerCase() == acc_email.toLowerCase()){
                        acc_id=i;
                        break
                    }
                }
            }else{
                return;
            }

            if ( !mailAccounts[acc_id] || typeof (mailAccounts[acc_id]) !='object' ) {
                sdk.log.warning({'text':'no account with supplied id',data:{id:acc_id}, 'method': log_method, 'type': log_type});
                return;
            }

            sdk.log.info({'text':'remove account mails from storage (repository)', 'method': log_method, 'type': log_type});
            conduit.storage.app.items.remove("Mail_" + acc_id);

            sdk.log.info({'text':'remove provider scraping.xml from storage (repository)', 'method': log_method, 'type': log_type});

            conduit.storage.app.items.remove("sc_" + mailAccounts[acc_id].mailProvider.name);

            delete mailAccounts[acc_id];

                itemsNO--;
                saveAccounts();
                UpdateNewMessageNo();
        },

        /*-----------------------------------------------------
         -- Update account
         -----------------------------------------------------*/
        'updateAccount':function (updatedAccountDTO, cb) {

            var acc = mailAccounts[updatedAccountDTO.id];
            if (acc == null) {
                return;
            }

            var changeSettings=function(update){
                var changeset={
                    'password':acc.userPersonalDetail.password
                    ,'server':acc.mailProvider.server.incServer
                    ,'port': acc.mailProvider.server.port
                    ,'ssl': acc.mailProvider.server.ssl
                };
                acc.userPersonalDetail.password = update.password;
                if (acc.isCustomPOP3) {
                    acc.mailProvider.server.incServer = update.incServer;
                    acc.mailProvider.server.port = update.port;
                    acc.mailProvider.server.ssl = update.ssl;
                }
                return changeset;
            };

            var revertSettings=function(changeset){
                changeset.hasOwnProperty('password') && (acc.userPersonalDetail.password = changeset.password);
                if (acc.isCustomPOP3) {
                    changeset.hasOwnProperty('server') && (acc.mailProvider.server.incServer = changeset.server);
                    changeset.hasOwnProperty('port') && (acc.mailProvider.server.port = changeset.port);
                    changeset.hasOwnProperty('ssl') && (acc.mailProvider.server.ssl = changeset.ssl);
                }
            };

            var changeset=changeSettings(updatedAccountDTO);

            sendNotification("CHECK_EDIT_ACCOUNT", transValues['SB_EMAIL_NOTIFIER_PROCESS_MSG_2'], "INFO");

            var attemptsCount=0;
            var reconnectAllowed=function(state){
                if(!state || typeof state.attemptsCount!='number' && typeof state.stage=='undefined'){
                    return false;
                }

                return state.attemptsCount < emailNotifierSettings.policy.account.update.attempts.max
                    && !~emailNotifierSettings.policy.account.update.attempts.exclude.indexOf(state.stage);
            };

            var connectionCallback=function (result, error, stage) {
                sdk.log.info({'data':{'result':result, 'error':error,'stage':stage}, 'method': 'updateAccount/connectionCallback', 'type': 'accountManager'});

                var fFail=function(error){
                    sdk.log.info({'data':{'error':error,'stage':stage}, 'method': 'updateAccount/connectionCallback/fFail', 'type': 'accountManager'});
                    if(reconnectAllowed({'attemptsCount':attemptsCount,'stage':stage})){
                        attemptsCount++;
                        checkConnection();
                        return;
                    }
                    revertSettings(changeset);
                    sendNotification("CHECK_EDIT_ACCOUNT", error, "ERROR");
                };
                var fSuccess=function(){
                    sdk.log.info({'data':{'error':error,'stage':stage}, 'method': 'updateAccount/connectionCallback/fSuccess', 'type': 'accountManager'});
                    saveAccounts();
                    cb();
                };

                result ? fSuccess()
                    : fFail(error);
            };

            var invoker ={};
            var checkConnection = function () {
                invoker = new InvokerFactory(acc);
                invoker.checkConnection(connectionCallback);
            };
            checkConnection();
        }
        ,'refreshEmails': function(account_id,fSuccessCallback,fFailCallback){
            var acc = accountManager.getAccountByID(account_id);
            var attemptsCount=0;
            var reconnectAllowed=function(state){
                if(!state || typeof state.attemptsCount!='number' && typeof state.stage=='undefined'){
                    return false;
                }

                return state.attemptsCount < emailNotifierSettings.policy.account.refresh.attempts.max
                    && !~emailNotifierSettings.policy.account.refresh.attempts.exclude.indexOf(state.stage);
            };
            var fFail=function(error,stage){
                sdk.log.info({'data':{'error':error,'stage':stage}, 'method': 'updateAccount/connectionCallback/fFail', 'type': 'accountManager'});
                if(reconnectAllowed({'attemptsCount':attemptsCount,'stage':stage})){
                    attemptsCount++;
                    checkEmails();
                    return;
                };
                fFailCallback();
            };
            var fSuccess=function(){
                sdk.log.info({'method': 'refreshEmails/checkEmailsCallback/fSuccess', 'type': 'accountManager'});
                fSuccessCallback(acc);
            };

            var invokerCallback=function (result,error,state) {
                if (result) {
                    fSuccess();
                }
                else {
                    fFail(error,state);
                }
            };
            var invoker ={};
            var checkEmails = function () {
                invoker = new InvokerFactory(acc);
                invoker.checkEmails(invokerCallback);
            };
            checkEmails();
        }
        /*-----------------------------------------------------
         --retrieve all accounts
         -----------------------------------------------------*/
        , getAllAccounts:function () {
            return sortAccounts(mailAccounts);
        },

        /*-----------------------------------------------------
         --load account from repository
         -----------------------------------------------------*/
        loadAccounts:function (cb) {

            conduit.storage.app.items.get("accounts", function (data) {
                if (data == null) {
                    cb &&  cb();
                    return;
                }

                //decrypt accounts data
                conduit.encryption.decrypt(data, function (text) {
                    mailAccounts = text;
                    for (var i in mailAccounts) {
                        itemsNO++;
                        //find provider
                        if (!mailAccounts[i].isCustomPOP3) {
                            mailAccounts[i].mailProvider = providerHelper.findProviderByEmailAddress(mailAccounts[i].userPersonalDetail.emailAddress);
                        }
                    }
                    cb();
                });
            }, function (e) {
                    cb && cb();

            });
        },

        /*-----------------------------------------------------
         --Retrieve account by id
         -----------------------------------------------------*/
        getAccountByID:function (accountId) {
            return mailAccounts[accountId];
        },

        /*-----------------------------------------------------
         -- mark account mails as seen
         -----------------------------------------------------*/
        markAsSeen:function (accountId) {
            var acc = mailAccounts[accountId];
            acc.stats.newMailsNo = 0;
            saveAccounts();
            sendNotification("UPDATE_ACCOUNT_NO", JSON.stringify(acc), "INFO");
            UpdateNewMessageNo();

            return acc;
        },


        /*-----------------------------------------------------
         --Set Account statistics
         -----------------------------------------------------*/
        setAccountStats:function (account, syncResult) {
            account.stats.lastEmailID = syncResult.lastEmailID;
            account.stats.lastUpdated = syncResult.lastUpdated;
            account.stats.newMailsNo = syncResult.newMailsNo;

            saveAccounts();
            sendNotification("UPDATE_ACCOUNT_NO", JSON.stringify(account), "INFO");
            UpdateNewMessageNo();
        },

        /*-----------------------------------------------------
         --Change Order position
         -----------------------------------------------------*/
        changePosition:function (currentid, withId) {
            var temp = mailAccounts[currentid].order;
            mailAccounts[currentid].order = mailAccounts[withId].order;
            mailAccounts[withId].order = temp;

            saveAccounts();
        },
        /*-----------------------------------------------------
         --Change Order position
         -----------------------------------------------------*/
        getNoOfAccounts:function () {
            return itemsNO;
        },

        /*-----------------------------------------------------
         --retrieve mail from repository by account id
         -----------------------------------------------------*/
        loadMails:function (accountId, cb) {
            conduit.storage.app.items.get("Mail_" + accountId, function (strMails) {
                var mails = [];
                if (strMails != null && strMails != 'undefined' && strMails != '') {
                    if (typeof (strMails) == "string")
                        mails = JSON.parse(strMails);
                    else
                        mails = strMails;
                }
                cb(mails);
            }, function (e) {
                var mails = [];
                cb(mails);
            });
        },

        /*-----------------------------------------------------
         --Save mails
         -----------------------------------------------------*/
        saveMails:function (accountId, mails) {
            var strMails = JSON.stringify(mails);
            conduit.storage.app.items.set("Mail_" + accountId, strMails);
        },
        /*-----------------------------------------------------
         -- getUnReadMailNo
         -----------------------------------------------------*/
        getUnReadMailNo:function () {
            var num = 0;
            for (var i in mailAccounts) {
                if (mailAccounts[i].stats.newMailsNo != null) {
                    num += mailAccounts[i].stats.newMailsNo
                }
            }
            return num;
        }
    }
}();
