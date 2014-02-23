/*==================================================
-- POP3 Executer
====================================================*/
var Pop3Executer = function (id) {
    var iid = id;

    var dataIdentity = null;

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

    var actionsEnum = {
        "USER": "1",
        "PASS": "2",
        "STAT": "3",
        "TOP": "4"
    };

    var nooptimer = 0;
    var noopcount = 0;
    var options = {};


    var socketOnDataRecieved = function (response) {
        try {
            sdk.log.info({ type: 'Pop3Executer[{0}]'.format(iid), method: 'socketOnDataRecieved', text: 'data recieved', data: response });
            if (timer != null) { clearTimeout(timer); }

            timer = setTimeout(function () {
                sdk.log.critical({ 'text': 'Timeout occurs for address:[{0}] port:[{1}] ssl:[{2}]'.format(options.address, options.port, options.ssl), 'data': { 'code': 'EM_TIMEOUT' }, 'type': 'Pop3Executer', 'method': 'socketOnDataRecieved' });
                providerServerNoResponse();
            }, responseTimeout);

            if (response == null) {
                sdk.log.info({ type: 'Pop3Executer[{0}]'.format(iid), method: 'socketOnDataRecieved', text: 'no data in responce omit processing', data: response });
                return;
            }

            if (kit.util.toBool(response) && nooptimer == 0) { // setup $ NOOP command if no data recieved
                nooptimer = setTimeout(function () {
                    sendCommand('NOOP\r\n', 'CMD_NOOP');
                }, 5000);
                return;
            }

            if (response.token != connectionToken) {
                return;
            }

            if (nooptimer) {//
                clearTimeout(nooptimer);
                nooptimer = 0;
            }

            var dataIdentity = response.dataIdentity;
            var dataRecevied = response.dataRecevied;

            if (dataIdentity != actionsEnum.TOP) {
                if (dataRecevied.match(/^\+OK/gi)) {
                    if (dataIdentity == null || dataIdentity == '' || dataIdentity == 'CMD_NOOP') //Server ready (first dataRecevied)
                    {
                        var command = "USER " + userDetail.emailAddress + "\r\n";
                        dataIdentity = actionsEnum.USER;
                        sendCommand(command, dataIdentity);
                    }
                    else if (dataIdentity == actionsEnum.USER) {
                        var command = "PASS " + userDetail.password + "\r\n";
                        dataIdentity = actionsEnum.PASS;
                        sendCommand(command, dataIdentity);
                    }
                    else if (dataIdentity == actionsEnum.PASS) {
                        connectCallback(true); // Login (authentication) complete
                    }
                    else if (dataIdentity == actionsEnum.STAT) {

                        existsMessagesCount = dataRecevied.split(" ")[1];
                        sdk.log.info({ type: 'Pop3Executer[{0}]'.format(iid), method: 'socketOnDataRecieved', text: 'Parse STAT info', data: { 'dataRecevied': dataRecevied, 'existsMessagesCount': existsMessagesCount} });
                        arrMessages = new Array();
                        existsMessagesCount = parseInt(existsMessagesCount);

                        if (existsMessagesCount > 0) {
                            fetchMailContent();
                        } else {
                            getInboxCallback(true, arrMessages);
                        }
                    }
                }
                else {
                    var errorMsg = transValues['SB_EMAIL_NOTIFIER_FAILED_WRONG_EMAIL'];
                    connectCallback(false, errorMsg, 'login'); // Login (authentication) failed
                }
            }
            else {
                dataBuffer += dataRecevied;
                var lines = dataBuffer.split("\n");
                var lastLine = lines[lines.length - 2];

                //find end of response data (fetch command always ends at the point)
                if (lastLine.indexOf(".") != -1 && lastLine.length == 2) {
                    var emailID = '';
                    var from = '';
                    var date = '';
                    var subject = '';
                    var shortBody = '';
                    var encoding = '7BIT';
                    var charset = 'US-ASCII';

                    for (var i = 0; i < lines.length; i++) {

                        var inspectLine = lines[i].toUpperCase();

                        if (inspectLine.indexOf("MESSAGE-ID:") != -1)
                            emailID = lines[i].substring(12);

                        else if (from == '' && inspectLine.slice(0, 5) == "FROM:") {
                            var sdata = jQuery.trim(lines[i].substring(6));
                            while (lines[i + 1].match(/^[\f\n\r\t\v\u00A0\u2028\u2029\u0020]/)) {
                                sdata += '\n' + jQuery.trim(lines[i + 1]);
                                i++;
                            }
                            from = sdata;
                            from = from.replace(/<+.*>/gmi, '').replace(/\s+/gmi, ' ').trim().replace(/^"|"$/gmi, '').trim()
                        }

                        else if (date == '' && inspectLine.slice(0, 5) == "DATE:")
                            date = lines[i].substring(6);

                        else if (subject == '' && inspectLine.slice(0, 8) == "SUBJECT:") {
                            var sdata = jQuery.trim(lines[i].substring(9));
                            while (lines[i + 1].match(/^[\f\n\r\t\v\u00A0\u2028\u2029\u0020]/)) {
                                sdata += '\n' + jQuery.trim(lines[i + 1]);
                                i++;
                            }
                            subject = sdata;
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
                                if (bodyLine == null || bodyLine.indexOf(".\r") != -1 || bodyLine.match(/^--.+/gi))
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
                            fetchMailContent();
                        }
                        else {
                            getInboxCallback(true, arrMessages); //finish getInbox process
                        }
                    }
                }
            }
        } catch (ex) {
            var errorMsg = transValues['SB_EMAIL_NOTIFIER_RETREIVE_ACCOUNT_MAILS_FAILED'];
            connectCallback(false, errorMsg, 'fetch');
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
        sdk.log.info({ "type": 'Pop3Executer[{0}]'.format(iid), method: 'sendCommand', text: '', data: { "command": command, "dataIdentity": dataIdentity} });
        conduit.network.sockets.send(connectionToken, command, dataIdentity,
			function (response) {
			    if (response == null || String(response) != "true") {
			        sdk.log.warning({ "type": 'Pop3Executer[{0}]'.format(iid), method: 'sendCommand network.sockets.send callback', text: 'invalid responce on command exec finish flow ', data: response });
			        getInboxCallback(false, null);
			    }
			});
    };

    var fetchMailContent = function () {
        if (existsMessagesCount == null || arrMessages == null)
            return;

        dataBuffer = '';
        var index = (existsMessagesCount - arrMessages.length);
        var command = "TOP " + index + " 0" + "\r\n";
        dataIdentity = actionsEnum.TOP;
        sendCommand(command, dataIdentity);
    };

    //Open socket connection
    var connect = function (mailAccount) {

        providerServer = mailAccount.mailProvider.server;
        userDetail = mailAccount.userPersonalDetail;

        options = {
            address: providerServer.incServer,
            port: providerServer.port,
            ssl: providerServer.ssl
        };

        /*
        TODO: MAKE onConnectionEstablished  single instance
        */
        conduit.network.sockets.onConnectionEstablished.addListener(function (token) {
            sdk.log.info({ "type": 'Pop3Executer[{0}]'.format(iid), method: 'sockets.connect callback', text: 'connecting...', data: [token] });

            if (typeof token == 'undefined') { return; } // filter out invalid data			
            //filter out event subscription confirm
            if (kit.util.toBool(token)) {
                return;
            }
            if(token && typeof token=='object' && !token.connected && connectionToken ==token.token){
                var errorMsg = transValues['SB_EMAIL_NOTIFIER_FAILED_WRONG_SERVER_OR_PORT'];
                connectCallback(false, errorMsg, 'connection'); //connection failed
                return;
            }

            if (connectionToken) {
                sdk.log.warning({ "type": 'Pop3Executer[{0}]'.format(iid), method: 'sockets.connect callback', text: 'connection token already exist', data: { "connectionToken": connectionToken, "token": token} });
                return;
            }

            connectionToken = token;

            if (connectionToken != null && connectionToken > 0) { // define the server response delay timeout
                timer = setTimeout(function () {
                    sdk.log.critical({ 'text': 'Timeout occurs for address:[{0}] port:[{1}] ssl:[{2}]'.format(options.address, options.port, options.ssl), 'data': { 'code': 'EM_TIMEOUT' }, 'type': 'Pop3Executer', 'method': 'onConnectionEstablished' });
                    providerServerNoResponse();
                }, responseTimeout);
            }
            else {
                var errorMsg = transValues['SB_EMAIL_NOTIFIER_FAILED_WRONG_SERVER_OR_PORT'];
                connectCallback(false, errorMsg, 'connecting'); //connection failed
            }
        });
        conduit.network.sockets.connect(options, function (token) {
            sdk.log.info({ type: 'Pop3Executer[{0}]'.format(iid), method: 'sockets.connect callback', text: 'connecting...', data: [token] });

            if (typeof token == 'undefined') { return; } // filter out invalid data			
            //filter out event subscription confirm
            if (kit.util.toBool(token)) {
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
                sdk.log.warning({ "type": 'Pop3Executer[{0}]'.format(iid), "method": 'sockets.connect callback', "text": '!!! invalid token - return SB_EMAIL_NOTIFIER_FAILED_WRONG_SERVER_OR_PORT', data: { "connectionToken": connectionToken, "token": token} });
                var errorMsg = transValues['SB_EMAIL_NOTIFIER_FAILED_WRONG_SERVER_OR_PORT'];
                connectCallback(false, errorMsg, 'connect'); //connection failed
            }
        });
    };


    //Close socket connection
    var closeConnection = function () {
        sdk.log.info({ "type": 'Pop3Executer[{0}]'.format(iid), "method": 'closeConnection', "text": 'close connection', "data": [connectionToken] });
        conduit.network.sockets.close(connectionToken);
    }

    var keepAliveConnection = false;

    return {

        //Check mail account connection 
        checkConnection: function (mailAccount, cb, keepAlive) {
            sdk.log.info({ "type": 'Pop3Executer[{0}]'.format(iid), "method": 'checkConnection', text: 'check connection', data: mailAccount });
            connectCallback = function (result, error, stage) {
                sdk.log.info({ "type": 'Pop3Executer[{0}]'.format(iid), "method": 'checkConnection/connectCallback', text: 'connectCallback', data: { 'result': result, 'error': error} });
                timer && clearTimeout(timer);
                keepAliveConnection = keepAlive;
                if (!keepAlive || !result) {
                    closeConnection();
                }
                cb(result, error, stage);  //return (true) or (false + error message)
            };
            connect(mailAccount);
        },

        //Check mail account connection + get current mail inbox
        checkEmails: function (mailAccount, cb) {
            sdk.log.info({ type: 'Pop3Executer[{0}]'.format(iid), method: 'checkEmails', text: 'Get Mails', data: mailAccount });
            connectCallback = function (result, error, stage) {
                if (result) {
                    var command = "STAT" + "\r\n";
                    dataIdentity = actionsEnum.STAT;
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
        }
    };
};
