/*==================================================
-- IMAP Executer
====================================================*/
var ImapExecuter = function (id) {
    var iid = id;
    var actionsEnum = {
        "LOGIN": "1",
        "INBOX": "2",
        "FETCH": "3"
    };

    var dataIdentity = null;
    var count = 0;
    var connectionToken;

    var existsMessagesCount;
    var arrMessages;
    var dataBuffer;
    var responseTimeout = 35000;
    var timer = null;

    var connectCallback;
    var getInboxCallback;

    var providerServer;
    var userDetail;

    var nooptimer = 0;
    var options = {};

    //Socket event onDataRecieved implementation
    var socketOnDataRecieved = function (response) {
        var log_type = 'socketOnDataRecieved';
        try {
            sdk.log.info({ data: response, text: 'data recieved', method: log_type, type: 'ImapExecuter[{0}]'.format(iid) });

            if (timer != null) { clearTimeout(timer); }

            timer = setTimeout(function () {
                if (typeof (arrMessages) == 'undefined') {
                    sdk.log.critical({ 'text': 'Timeout occurs for address:[{0}] port:[{1}] ssl:[{2}]'.format(options.address, options.port, options.ssl), 'data': { 'code': 'EM_TIMEOUT' }, 'type': 'ImapExecuter', 'method': 'socketOnDataRecieved' });
                    providerServerNoResponse();
                } else {
                    getInboxCallback(true, arrMessages);
                }
            }, responseTimeout);

            if (response == null) {
                return;
            }
            if (kit.util.toBool(String(response)) && nooptimer == 0) {
                nooptimer = setTimeout(function () {
                    try {
                        sendCommand('$ NOOP\r\n', 'CMD_NOOP');
                    } catch (ex) { }
                }, 5000);
                return;
            }

            if (response.token != connectionToken) {
                return;
            }

            if (nooptimer) {
                clearTimeout(nooptimer);
                nooptimer = 0;
            }

            var dataIdentity = response.dataIdentity;
            var dataRecevied = response.dataRecevied;

            if (dataRecevied.indexOf("* OK") != -1
                && (dataIdentity == null || dataIdentity == '')
                || (dataIdentity == 'CMD_NOOP' && dataIdentity != actionsEnum.LOGIN)
                ) //Server ready (first dataRecevied)
            {
                if (!dataRecevied) {
                    sdk.log.info({ type: 'ImapExecuter[{0}]'.format(iid), method: 'socketOnDataRecieved', text: 'empty data receved', data: response });
                    return;
                }
                // connected do login
                var command = "$ LOGIN " + userDetail.emailAddress + " " + userDetail.password + "\r\n";
                dataIdentity = actionsEnum.LOGIN;
                sendCommand(command, dataIdentity);
                return;
            }
            if (dataIdentity == actionsEnum.LOGIN) {
                if (dataRecevied == '') {
                    return;
                }
                if (dataRecevied.indexOf('$ OK') != -1)
                    connectCallback(true); // Login (authentication) complete
                else {
                    var errorMsg = transValues['SB_EMAIL_NOTIFIER_FAILED_WRONG_EMAIL'];
                    connectCallback(false, errorMsg, 'login'); // Login (authentication) failed
                }
                return;
            }
            if (dataIdentity == actionsEnum.INBOX) {
                arrMessages = new Array();
                existsMessagesCount = 0;
                if (dataRecevied.indexOf("EXISTS") != -1) {
                    var lines = dataRecevied.split("\n");
                    for (var i = 0; i < lines.length; i++) {
                        if (lines[i].indexOf("EXISTS") != -1) {
                            var existsLine = lines[i];
                            var startPosEXISTS = existsLine.indexOf("EXISTS");
                            existsMessagesCount = parseInt(existsLine.substring(1, startPosEXISTS));
                            break;
                        }
                    }
                } //if
                if (existsMessagesCount == 0) {
                    getInboxCallback(true, arrMessages);
                } else {
                    fetchMailContent();
                }
                return;
            }
            if (dataIdentity == actionsEnum.FETCH) {
                try {
                    if (dataBuffer == '' && dataRecevied == '') {
                        arrMessages.push({
                            "emailID": '',
                            "from": '- - -', "subject": '', "shortBody": '',
                            "date": new Date().getTime(), "contentTypeCharset": 'US-ASCII', "contentTypeEncoding": '7BIT', "isDecoded": true
                        });
                        if (arrMessages.length < existsMessagesCount
                        && arrMessages.length < emailNotifierSettings.messageCount) {
                            fetchMailContent();
                        } else {
                            getInboxCallback(true, arrMessages); //finish getInbox process
                        }
                    }

                    dataBuffer += dataRecevied;
                    var lines = dataBuffer.split("\n");
                    var lastLine = lines[lines.length - 2];
                    lastLine = jQuery.trim(lastLine);
                    if (lastLine.indexOf("$ OK FETCH completed") != -1 ||
                    lastLine.indexOf("$ OK completed") != -1 ||
                    lastLine.indexOf("$ OK Success") != -1 ||
                    lastLine.indexOf("$ OK") == 0
                    ) {

                        var emailID = '';
                        var from = '';
                        var date = '';
                        var subject = '';
                        var shortBody = '';
                        var encoding = '7BIT';
                        var charset = 'US-ASCII';

                        for (var i = 0; i < lines.length; i++) {
                            var inspectLine = lines[i].toUpperCase();
                            if (inspectLine.indexOf("FETCH (UID") != -1) {
                                var startPosUID = inspectLine.indexOf("(UID");
                                var endPosUID = inspectLine.indexOf(" BODY");
                                emailID = parseInt(inspectLine.substring(startPosUID + 4, endPosUID));
                                continue;
                            }
                            if (from == '' && inspectLine.slice(0, 5) == "FROM:") {
                                var sdata = jQuery.trim(lines[i].substring(6));
                                while (lines[i + 1].match(/^[\f\n\r\t\v\u00A0\u2028\u2029\u0020]/)) {
                                    sdata += '\n' + jQuery.trim(lines[i + 1]);
                                    i++;
                                }
                                from = sdata;
                                from = from.replace(/<+.*>/gmi, '').replace(/\s+/gmi, ' ').trim().replace(/^"|"$/gmi, '').trim()
                                continue;
                            }
                            if (date == '' && inspectLine.slice(0, 5) == "DATE:") {
                                date = lines[i].substring(6);
                                continue;
                            }
                            if (subject == '' && inspectLine.slice(0, 8) == "SUBJECT:") {
                                var sdata = jQuery.trim(lines[i].substring(9));
                                while (lines[i + 1].match(/^[\f\n\r\t\v\u00A0\u2028\u2029\u0020]/)) {
                                    sdata += '\n' + jQuery.trim(lines[i + 1]);
                                    i++;
                                }
                                subject = sdata;
                                continue;
                            }
                            //find body Content-Type: text/plain;
                            else if (inspectLine.indexOf("CONTENT-TYPE: TEXT/PLAIN;") != -1) {
                                //find body charset
                                var charsetLine;

                                if (inspectLine.indexOf("CHARSET=") != -1)
                                    charsetLine = inspectLine;
                                else if (lines[i + 1].toUpperCase().indexOf("CHARSET=") != -1)
                                    charsetLine = lines[i + 1].toUpperCase();

                                if (charsetLine) {
                                    charset = charsetLine.substring(charsetLine.indexOf("CHARSET=") + 8);
                                    if (charset.match(/;/gi)) {
                                        charset = charset.substring(0, charset.indexOf(';'));
                                    }
                                    charset = charset.replace(/[";]/gi, '').replace(' ', '');
                                }

                                //find body encoding
                                var encodingLine;
                                if (lines[i - 1].toUpperCase().indexOf("CONTENT-TRANSFER-ENCODING:") != -1)
                                    encodingLine = lines[i - 1].toUpperCase();
                                else if (lines[i + 1].toUpperCase().indexOf("CONTENT-TRANSFER-ENCODING:") != -1)
                                    encodingLine = lines[i + 1].toUpperCase();
                                else if (lines[i + 2].toUpperCase().indexOf("CONTENT-TRANSFER-ENCODING:") != -1)
                                    encodingLine = lines[i + 2].toUpperCase();

                                if (encodingLine) {
                                    if (encodingLine.indexOf("QUOTED-PRINTABLE") != -1)
                                        encoding = "Q";
                                    else if (encodingLine.indexOf("BASE64") != -1)
                                        encoding = "B";
                                }

                                //prepare short body (search top 15 rows until we fill first 120 characters of body)
                                var emptyLineFound = false;
                                for (var j = 1; j < 15; j++) {
                                    var bodyLine = lines[i + j];
                                    if (bodyLine == null || bodyLine.indexOf(")\r") != -1 || bodyLine.match(/^--.+/gi))
                                        break;
                                    else if (bodyLine == '\r')
                                        emptyLineFound = true;
                                    else if (emptyLineFound && bodyLine !== '' && bodyLine != '\r') {
                                        if (charset != '' && encoding != '' &&
                                        bodyLine.charAt(bodyLine.length - 2) == '=') {
                                            bodyLine = bodyLine.substring(0, bodyLine.length - 2);
                                        }
                                        shortBody += bodyLine;
                                        if (shortBody.length > 120)
                                            break;
                                    }
                                }

                                //remove [cid:.*] from shortBody
                                if (shortBody.indexOf("[cid:") != -1) {
                                    var startPos = shortBody.indexOf("[cid:");
                                    var endPos = shortBody.indexOf("]");
                                    while (endPos != -1 && endPos < startPos) {
                                        endPos = shortBody.indexOf("]");
                                    }
                                    shortBody = shortBody.replace(shortBody.substring(startPos, endPos + 1), '');
                                }
                            }

                            if (emailID != '' && from != '' && date != '' && subject != '' && shortBody != '') {
                                break;
                            }
                        }
                        if (from == '') { from = '- - -'; }
                        if (from != '') {
                            var mailMessage = {
                                "emailID": emailID,
                                "from": from,
                                "date": date == '' ? new Date().getTime() : Date.parse(date),
                                "subject": subject,
                                "shortBody": shortBody,
                                "contentTypeCharset": charset,
                                "contentTypeEncoding": encoding,
                                "isDecoded": false
                            };
                            arrMessages.push(mailMessage);
                            if (arrMessages.length < existsMessagesCount &&
                            arrMessages.length < emailNotifierSettings.messageCount) {
                                //console.log("ENote.IMAP.OnDataRecieved fetchMailContent/GET NEXT MAIL/ >>");
                                fetchMailContent();
                            }
                            else {
                                //console.log("ENote.IMAP.OnDataRecieved getInboxCallback >>", arrMessages);
                                getInboxCallback(true, arrMessages); //finish getInbox process
                            }
                        }
                    }
                } catch (e) {
                    connectCallback(false, transValues['SB_EMAIL_NOTIFIER_RETREIVE_ACCOUNT_MAILS_FAILED'], 'fetch');
                }
            }
        } catch (ex) {
            sdk.log.error({ type: 'ImapExecuter', method: 'socketOnDataRecieved', text: 'EXCEPTION', data: ex });
        }
    };

    //stop process when timeout occurred (server not response)
    var providerServerNoResponse = function () {
        if (getInboxCallback != null) {
            getInboxCallback(false, null);
        }
        else {
            var errorMsg = transValues['SB_EMAIL_NOTIFIER_FAILED_WRONG_SERVER_OR_PORT'];
            connectCallback(false, errorMsg, 'timeout');
        }
    };

    //send command
    var sendCommand = function (command, dataIdentity) {
        sdk.log.info({ type: 'ImapExecuter[{0}]'.format(iid), method: 'sendCommand', text: jQuery.trim(command), data: { cmd: command, identity: dataIdentity} });

        conduit.network.sockets.send(connectionToken, command, dataIdentity,
            function (response) {
                sdk.log.warning({ type: 'ImapExecuter', method: 'sendCommand network.sockets.send callback', text: 'response', data: response });
                if (response == null || String(response) != "true") {
                    sdk.log.warning({ type: 'ImapExecuter', method: 'sendCommand network.sockets.send callback', text: 'invalid responce on command exec ', data: response });
                    getInboxCallback(false, null);
                }
            });
    };

    var fetchMailContent = function () {
        if (existsMessagesCount == null || arrMessages == null)
            return;

        dataBuffer = '';
        var index = (existsMessagesCount - arrMessages.length);
        var command = '$ FETCH ' + index + ' (UID BODY.PEEK[HEADER.FIELDS (DATE FROM SUBJECT)])\r\n'; //use (UID BODY.PEEK[]) to get a bodies and leave them unreaden
        dataIdentity = actionsEnum.FETCH;
        sendCommand(command, dataIdentity);
    };

    var onConnectionEstablishedRegistered = false;
    var onConnectionEstablishedComplete = false;
    //Open socket connection
    var connect = function (mailAccount) {
        sdk.log.info({ type: 'ImapExecuter[{0}]'.format(iid), method: 'connect', text: 'connect', data: mailAccount });
        providerServer = mailAccount.mailProvider.server;
        userDetail = mailAccount.userPersonalDetail;

        options = {
            address: providerServer.incServer,
            port: providerServer.port,
            ssl: providerServer.ssl
        };

        conduit.network.sockets.onConnectionEstablished.addListener(function (token, a, b, c, d, e) {
            sdk.log.info({ type: 'ImapExecuter[{0}]'.format(iid), method: 'sockets.onConnectionEstablished callback', text: 'connection established', data: [token, a, b, c] });

            if (typeof token == 'undefined') { return; } // filter out invalid data

            var isConfirmCall = (String(token) == 'true' || String(token) == "'true'" || String(token) == '"true"');
            //filter out event subscription confirm
            if (isConfirmCall) {
                if (onConnectionEstablishedRegistered) { // expected only once
                    sdk.log.warning({ type: 'ImapExecuter[{0}]'.format(iid), method: 'sockets.onConnectionEstablished callback', text: '!!! invalid callback-already subscribed', data: { "connectionToken": connectionToken, "token": token} });
                }
                onConnectionEstablishedRegistered = true;
                return;
            } //if
            if(token && typeof token=='object' && !token.connected && connectionToken ==token.token){
                var errorMsg = transValues['SB_EMAIL_NOTIFIER_FAILED_WRONG_SERVER_OR_PORT'];
                connectCallback(false, errorMsg, 'connection'); //connection failed
                return;
            }

            if (!connectionToken) {
                if (token) {
                    connectionToken = token;
                    timer = setTimeout(function () {
                        sdk.log.critical({ 'text': 'Timeout occurs for address:[{0}] port:[{1}] ssl:[{2}]'.format(options.address, options.port, options.ssl), 'data': { 'code': 'EM_TIMEOUT' }, 'type': 'ImapExecuter', 'method': 'onConnectionEstablished' });
                        providerServerNoResponse();
                    }, responseTimeout);
                } else {
                    var errorMsg = transValues['SB_EMAIL_NOTIFIER_FAILED_WRONG_SERVER_OR_PORT'];
                    connectCallback(false, errorMsg, 'connection'); //connection failed
                    return;
                }
            } else {
                if (onConnectionEstablishedComplete) {
                    sdk.log.warning({ type: 'ImapExecuter[{0}]'.format(iid), method: 'sockets.onConnectionEstablished callback', text: '!!! invalid callback-token already exist', data: { "connectionToken": connectionToken, "token": token} });
                }
                return;
            }
        });
        conduit.network.sockets.connect(options, function (token) {
            sdk.log.info({ type: 'ImapExecuter[{0}]'.format(iid), method: 'sockets.connect callback', text: 'connecting...', data: [token] });

            if (typeof token == 'undefined') { return; } // filter out invalid data
            //filter out event subscription confirm
            if (kit.util.toBool(token)) {
                return;
            }

            if (connectionToken) {
                sdk.log.warning({ type: 'ImapExecuter[{0}]'.format(iid), method: 'sockets.connect callback', text: '!!! invalid callback-token already exist', data: { "connectionToken": connectionToken, "token": token} });
                return;
            }

            connectionToken = token;

            if (connectionToken != null && connectionToken > 0) { // on valid token subscribe to data events
                conduit.network.sockets.onMessage.addListener(connectionToken, socketOnDataRecieved);
                conduit.network.sockets.onConnectionClosed.addListener(connectionToken, function (data) {
                    sdk.log.info({ type: 'ImapExecuter[{0}]'.format(iid), method: 'sockets.onConnectionClosed callback', text: 'connection closed', data: { 'arguments': arguments} });
                    if (typeof data == 'undefined') { return; } // filter out invalid data
                    //filter out event subscription confirm
                    if (kit.util.toBool(data)) {
                        return;
                    }
                    if (timer) {
                        connectCallback(false, errorMsg, 'connection dropped'); //connection failed
                    }

                });
            }
            else {
                sdk.log.warning({ type: 'ImapExecuter[{0}]'.format(iid), method: 'sockets.connect callback', text: '!!! invalid token - return SB_EMAIL_NOTIFIER_FAILED_WRONG_SERVER_OR_PORT', data: { "connectionToken": connectionToken, "token": token} });
                var errorMsg = transValues['SB_EMAIL_NOTIFIER_FAILED_WRONG_SERVER_OR_PORT'];
                connectCallback(false, errorMsg, 'connect'); //connection failed
            }
        });
    };

    //Close socket connection
    var closeConnection = function () {
        sdk.log.info({ type: 'ImapExecuter[{0}]'.format(iid), method: 'closeConnection', text: 'close connection', data: [connectionToken] });
        conduit.network.sockets.close(connectionToken);
    }
    var keepAliveConnection = false;
    //Return a method public interface
    return {

        //Check mail account connection 
        checkConnection: function (mailAccount, cb, keepAlive) {
            sdk.log.info({ type: 'ImapExecuter[{0}]'.format(iid), method: 'checkConnection', text: 'check connection', data: mailAccount });
            connectCallback = function (result, error, stage) {
                sdk.log.info({ type: 'ImapExecuter[{0}]'.format(iid), method: 'checkConnection/connectCallback', text: 'callback called', data: { 'arguments': arguments} });
                timer = timer && clearTimeout(timer);
                keepAliveConnection = keepAlive;
                if (!keepAlive) {
                    closeConnection();
                }
                cb(result, error, stage);  //return (true) or (false + error message)
            };
            connect(mailAccount);
        },

        //Check mail account connection + get current mail inbox
        checkEmails: function (mailAccount, cb) {
            sdk.log.info({ type: 'ImapExecuter[{0}]'.format(iid), method: 'checkEmails', text: 'Get Mails', data: mailAccount });
            connectCallback = function (result, error, stage) {
                if (result) {
                    var command = "$ SELECT INBOX\r\n";
                    dataIdentity = actionsEnum.INBOX;
                    sendCommand(command, dataIdentity);
                }
                else {
                    getInboxCallback(false, null, stage);
                }
            };
            getInboxCallback = function (result, data, stage) {
                timer = timer && clearTimeout(timer);
                closeConnection();
                cb(result, data, stage);  //return true or false + account mails
            };
            if (!keepAliveConnection) {
                connect(mailAccount);
            } else {
                connectCallback(true);
            }
        } //method.public
    }; //object.publics
}
