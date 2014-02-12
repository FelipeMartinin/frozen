var nativeMessaging = (function () {
    String.prototype.format_expressions = {};
    String.prototype.format = function () {
        var args = arguments;
        var exp = String.prototype.format_expressions[arguments.length];
        if (!exp) {
            exp = new RegExp(/\{(\d+)\}/g);
            String.prototype.format_expressions[arguments.length] = exp;
            return this.replace(exp, function (m, n) {
                return args[n];
            });
        }
        return this.replace(exp, function (m, n) {
            return args[n];
        });

    };

    var sdk = function () {
        return {
            log: function () {
                var config = {
                    name: 'NativeMessaging', enabled: false, dataToJson: false, info: { enabled: false }, vital: { enabled: true }, warning: { enabled: true }, error: { enabled: true }
                };

                function fetchConfigFile() {
                    var configFileObject = {};
                    var ajaxResponse = $.ajax({
                        url: chrome.extension.getURL('initData.json'),
                        type: 'GET',
                        cache: false,
                        async: false,
                        error: function (jqXHR, textStatus, errorThrown) {
                            throw errorThrown;
                        }
                    });
                    try {
                        configFileObject = JSONstring.toObject(ajaxResponse.responseText);
                    } catch (e) {
                        console.error(e);
                    }

                    return configFileObject;
                }

                var envInfo = {
                    tbConfig: fetchConfigFile()
                    , machineId: ''
                };

                try {
                    envInfo.machineId = localStorage.getItem("machineId") || '';
                    var regexBrowserInfo = /(Chrome)\/([0-9\.]+)/;
                    var browserInfoArray = navigator.userAgent.match(regexBrowserInfo);
                    envInfo.browserInfo = {
                        'type': browserInfoArray[1],
                        'version': browserInfoArray[2]
                    };
                    var regexOsInfo = /.*?\((.*?)\s(.*?)\)/;
                    var osInfoArray = navigator.userAgent.match(regexOsInfo);

                    var osFullVersion = osInfoArray[2].indexOf(";") != -1 ? osInfoArray[2].split(";")[0] : osInfoArray[2];
                    var arrorsFullVersion = osFullVersion.split(" ");
                    var osNumber = null;
                    for (var i = 0; i < arrorsFullVersion.length; i++) {
                        if (arrorsFullVersion[i].indexOf(".") != -1) {
                            osNumber = arrorsFullVersion[i];
                            break;
                        }
                    }

                    envInfo.osInfo = {
                        'type': osInfoArray[1],
                        'version': osNumber
                        , 'osBitType': '32Bit'
                    };

                    var _userAgent = navigator.userAgent;
                    if (_userAgent && (/WOW64/ig.test(_userAgent) || /Win64/ig.test(_userAgent))) {
                        envInfo.osInfo.osBitType = "64Bit";
                    }
                } catch (e) { }


                var la = new Date();
                var toTime = function (date, o) {
                    var delta = '?';
                    if (o && o.last) {
                        delta = date.getTime() - o.last.getTime();
                    }
                    return '{0}:{1}:{2}.{3}:[+{4}]'.format(date.getHours(), date.getMinutes(), date.getSeconds(), date.getMilliseconds(), delta);
                };

                var writer = function (text, data) {
                    //*
                    try {
                        console.log.apply(console, arguments);
                    } catch (ex) { }
                    //*/
                }; //function

                var write = function (item, data) {
                    var date = new Date();
                    var ts = date.getTime();
                    if (typeof (item) == 'string') {
                        item = { "type": 'N/A', "method": 'N/A', "text": item, "data": {} };
                        if (arguments.length > 1) {
                            item.data = data;
                        }
                    }

                    var logText = '[{0}|{1}]-{2}/{3}/{4}'.format(ts, toTime(date, { 'last': la }), config.name, item.type, item.method);
                    la = date;
                    if ('text' in item || 'message' in item) {
                        item.text = item.text || item.message || '';
                        logText += ' - ' + item.text;
                    }
                    if (!config.dataToJson) {
                        if ('data' in item) {
                            writer(logText, item.data);
                        } else {
                            writer(logText);
                        }

                    } else {
                        try {
                            if ('data' in item) {
                                logText += ' data: ' + JSON.stringify(item.data);
                            }
                        } catch (ex) {
                            logText += ' stringify data cause to ERROR : ' + ex;
                        }
                        writer(logText);
                    }

                    return true;
                };
                return {
                    enable: function () {
                        config.enabled = arguments[0];
                    }
                    , setName: function (name) {
                        config.name = name;
                    }
                    , info: function (item) {
                        return (config.enabled && config.info.enabled && write.apply(this, arguments));
                    }, vital: function (item) {
                        return (config.enabled && config.vital.enabled && write.apply(this, arguments));
                    }, warning: function (item) {
                        return (config.enabled && config.warning.enabled && write.apply(this, arguments));
                    }, warn: function (item) {
                        return (config.enabled && config.warning.enabled && write.apply(this, arguments));
                    }, error: function (item) {
                        return (config.enabled && config.error.enabled && write.apply(this, arguments));
                    }
                    , weblog: function (level, item) {
                        try {
                            return;
                            function toClientLogItem(data) {
                                function dd(v) { if (v > 9) { return '' + v; } return '0' + v }
                                var clientLog = {};

                                var clientCreationDate = '';

                                if (!envInfo.machineId) {
                                    envInfo.machineId = localStorage.getItem("machineId") || '';
                                }
                                var nmHostVersion = localStorage && localStorage.getItem(envInfo.tbConfig.Ctid + ".nmHostVersion");

                                var ts = new Date();
                                var tsStr = dd(ts.getMonth() + 1) + "-" + dd(ts.getDate()) + "-" + ts.getFullYear();
                                tsStr += ' ' + dd((ts.getHours() + 1)) + ':' + dd((ts.getMinutes())) + ':' + dd(ts.getSeconds());
                                clientLog.logData = {
                                    // static
                                    clientType: "Toolbar", // for future use.
                                    clientVersion: envInfo.tbConfig.version || "",
                                    clientCreationDate: clientCreationDate || "",
                                    ctid: envInfo.tbConfig.Ctid || "",
                                    originalCtid: envInfo.tbConfig.Ctid || "",
                                    browser: "Chrome",
                                    browserVersion: envInfo.browserInfo.version || "",
                                    browserBitType: "32Bit",
                                    browserLocale: envInfo.browserInfo.locale || "",
                                    osType: envInfo.osInfo.type || "",
                                    osVersion: envInfo.osInfo.version || "",
                                    osLocale: navigator.language || "",
                                    osServicePack: "",
                                    osBitType: envInfo.osInfo.osBitType || "", // 64Bit/32Bit or WOW64/Win64 - can be taken from user agent
                                    osEdition: "",
                                    timestamp: +tsStr,
                                    userId: localStorage.getItem('ToolbarUserID') || "",
                                    machineId: envInfo.machineId || "",
                                    hidden: "", //TODO
                                    installId: "",
                                    installType: "",
                                    // dynamic
                                    level: level, //DEBUG->INFO->WARN->ERROR->FATAL
                                    code: data.code || "",
                                    message: data.text || "",
                                    description: data.data && JSON.stringify(data.data) || "",
                                    name: data.type + '/' + data.method,
                                    url: ''
                                    , "nmHostVersion": nmHostVersion
                                };
                                return JSON.stringify(clientLog);
                            }

                            var data = toClientLogItem(item);
                            var req = new XMLHttpRequest();
                            req.open("POST", "http://clientlog.conduit-services.com/log/putlog", true);
                            req.setRequestHeader("Content-Type", 'application/json');
                            req.send(data);
                        } catch (ex) {

                        }

                    }
                };
            } ()
        }
    } (); //sdk namespace
    /* *
    *
    * */
    function Map() {
        var $this = this;
        var pool = {};
        var tidPool = {};
        this.set = function (item) {
            if (!item || typeof item != 'object') { throw new Error('Invalid Map item type'); }
            if (!item.command || !item.cb) { throw new Error('Missing MapItem arguments'); }

            var id = (+new Date) + '' + Math.random(); //generate new id
            tidPool[id] = setTimeout((function (id) {
                return function () {
                    var item = $this.get(id);
                    $this.del(id);
                    $this.onTimeout(item);
                }
            })(id), 20000);
            pool[id] = item;
            return id;
        };

        this.get = function (id) {
            return pool[id];
        };

        this.del = function (id) {
            clearTimeout(tidPool[id]);
            delete tidPool[id];
            delete pool[id];
        };
        this.cancel = function (action) {
            sdk.log.info({ text: 'cancel mapped', data: pool, method: 'cancel', type: 'Map' });
            for (var k in pool) {
                if (!pool.hasOwnProperty(k)) {
                    continue;
                }
                var item = $this.get(k);
                action && action(item);
                $this.del(k);
            }
        };
        this.onTimeout = function () { };

    } //class: Map
    /*
    *
    * */
    function NativePort(name) {
        var log_type = 'NativePort';

        var $this = this;
        var $methods = this;
        var connectionTimeout = 4000; //ms
        var timerid = 0;
        var port;
        var state, stateConnected, stateDisconnected;



        function onDisconnect() {
            clearTimeout(timerid);
            sdk.log.warn({ method: 'onDisconnect', type: log_type });
            sdk.log.weblog("WARN", { code: "disconnect", method: 'onDisconnect', type: log_type });
            state = stateDisconnected;
            state.init();
            port = undefined;
        } //handler


        var connectLive = function () {
            sdk.log.vital({ method: 'connectLive', type: log_type });
            sdk.log.weblog("INFO", { code: "connect", method: 'connectLive', type: log_type });

            function onPortMessage(data) {
                clearTimeout(timerid);
                sdk.log.info({ data: data, method: 'onPortMessage', type: log_type });
                if (data && data.id == 0) {
                    sdk.log.vital({ method: 'receivedPing', type: log_type });
                    if (state != stateConnected) {
                        state = stateConnected;
                        state.init();
                    }
                    return;
                }
                $this.onMessage(data);
            } //handler

            function onPortException(ex) {
                sdk.log.error({ data: { exception: ex }, method: 'onPortException', type: log_type });
                sdk.log.weblog("WARN", { code: "disconnect", method: 'onPortExeption', type: log_type });
                clearTimeout(timerid);
                try {
                    port.disconnect();
                } catch (ex) { }
                state = stateDisconnected;
                state.init({ cause: 'port-exception', status: 'terminated' });
                port = undefined;
            } //handler

            onDisconnectSilent = false;
            var sendPingCount = 0;
            function sendPing() {
                try {//send ping message to ensure connection
                    sdk.log.vital({ method: 'sendPing', type: log_type });
                    port.postMessage({ id: 0, data: {} });
                } catch (e) {
                    sdk.log.error({ data: { exception: e }, method: 'connectLive/sendPingException', type: log_type });
                    sdk.log.weblog("WARN", { code: "sendPingException", method: 'connectLive', type: log_type });
                    onDisconnect();
                    return;
                }
                sendPingCount++;
                timerid = setTimeout(function () {
                    sdk.log.warn({ text: 'call onDisconnect', method: 'connectLive/timeout', type: log_type });
                    if (sendPingCount < 3) {
                        sendPing();
                    }
                    else {
                        try {
                            port.disconnect();
                        } catch (ex) { };
                        onDisconnect();
                    }

                }, connectionTimeout);
            };

            try {
                port = chrome.extension.connectNative(name);
            } catch (ex) {
                onPortException(ex);
                return;
            }

            sendPing();
            port.onMessage.addListener(onPortMessage);
            port.onDisconnect.addListener(onDisconnect);
        };

        $methods.postMessage = function (data) {
            state.send(data);
        };

        $methods.onMessage = function () {
            sdk.log.info({ method: 'onMessage stub', type: log_type });
        };

        $methods.onConnect = function () {
            sdk.log.info({ method: 'onConnect stub', type: log_type });
        };

        $methods.onDisconnect = function onDisconnectHandlerStub() {
            sdk.log.info({ method: 'onDisconnect stub', type: log_type });
        };
        var onDisconnectSilent = false;

        $methods.connect = function () {
            state.connect();
        };

        $methods.disconnect = function () {
            state.disconnect();
        };

        (function ctor() {
            stateConnected = {
                init: function (cfg) {
                    sdk.log.vital({ data: { cfg: cfg }, method: 'stateConnected/init', type: log_type });
                    if (!cfg) {
                        cfg = { supressEvents: false };
                    }

                    onDisconnectSilent = false;

                    !cfg.supressEvents && $this.onConnect();
                }
                , connect: function () {
                    sdk.log.info({ method: 'stateConnected/connectStub', type: log_type });
                }
                , disconnect: function () {
                    sdk.log.vital({ text: '', method: 'stateConnected/disconnect', type: log_type });
                    port.disconnect();
                    onDisconnect();
                }
                , send: function (data) {
                    sdk.log.info({ data: data, method: 'stateConnected/send', type: log_type });
                    try {
                        port.postMessage(data);
                    } catch (ex) {
                        sdk.log.weblog("WARN", { code: "sendException", method: 'stateConnected/send', type: log_type });
                    }
                }
            };
            stateDisconnected = {
                init: function (cfg) {
                    sdk.log.vital({ data: { cfg: cfg }, method: 'stateDisconnected/init', type: log_type });
                    if (!cfg) {
                        cfg = {};
                    }
                    if (!cfg.hasOwnProperty('supressEvents')) {
                        cfg.supressEvents = false;
                    }
                    if (!cfg.hasOwnProperty('status')) {
                        cfg.status = 'disconnected';
                    }
                    sdk.log.vital({ data: { cfg: cfg, onDisconnectHalt: onDisconnectSilent }, method: 'stateDisconnected/init', type: log_type });
                    !cfg.supressEvents && !onDisconnectSilent && $this.onDisconnect({ status: cfg.status });
                    onDisconnectSilent = true;
                }
                , connect: connectLive
                , disconnect: function () {
                    sdk.log.vital({ text: 'stub', method: 'stateDisconnected/disconnect', type: log_type });
                }
                , send: function () {
                    sdk.log.info({ data: data, method: 'sendStub', type: log_type });
                }
            };
            state = stateDisconnected;
            state.init({ supressEvents: true });
        })();
    }

    function NativeMsgCom(name) {
        if (!(this instanceof NativeMsgCom)) { return new NativeMsgCom(name) }
        var error_expired = { result: '', status: 5001, description: 'NativeCom message expired' };
        var error_cancel = { result: '', status: 5002, description: 'NativeCom message canceled' };
        var log_type = 'NativeMsgCom';
        sdk.log.info({ method: "new()", type: log_type });
        var $this = this;
        var port = new NativePort(name || 'nmhost');
        var map = new Map();
        var queue = [];
        var state = {};
        var disconnectCount = 0;

        var stateConnected = {
            init: function () {
                disconnectCount = 0;
                sdk.log.info({ text: '', method: 'stateConnected/init', type: log_type });
                map.onTimeout = function mapTimeoutHandler(item) {
                    sdk.log.info({ text: '', method: 'stateConnected/mapTimeoutHandler', type: log_type });
                    item.cb(error_expired);
                };

                port.onMessage = portMessageHandler;
                port.onConnect = function () { }; //clear all
                port.onDisconnect = portDisconnectHandler;
            }
            , connect: function () {
                sdk.log.info({ text: '', method: 'stateConnected/connect', type: log_type });
            }
            , disconnect: function () {
                sdk.log.info({ text: '', method: 'stateConnected/disconnect', type: log_type });
                port.disconnect();
            }
            , post: function postConnected(command, cb) {
                sdk.log.info({ text: '', method: 'stateConnected/post', type: log_type });
                var id = map.set({ command: command, cb: cb });
                var packet = { id: id, ts: (+new Date()), data: command };
                port.postMessage(packet);
            }
            , toString: function () {
                return "stateConnected";
            }
        };

        var stateDisconnected = {
            init: function () {
                sdk.log.info({ method: 'stateDisconnected/init', type: log_type });
                disconnectCount++;
                map.onTimeout = function () {
                    sdk.log.info({ method: ' onTimeout stub', type: log_type });
                };
                port.onMessage = function () {
                    sdk.log.info({ method: ' onMessage stub', type: log_type });
                };
                port.onConnect = portConnectHandler;
                port.onDisconnect = portDisconnectHandler;
                delete stateDisconnected['connecting'];
            }
            , connect: function () {
                sdk.log.info({ method: 'stateDisconnected/connect', type: log_type });
                if (!stateDisconnected.connecting) {
                    stateDisconnected.connecting = true;
                    port.connect();
                } else {
                    sdk.log.info({ text: 'port.connect omited due connecting phase', method: 'stateDisconnected/connect', type: log_type });
                }

            }
            , disconnect: function () {
                sdk.log.info({ method: 'stateDisconnected/disconnect', type: log_type });
            }
            , post: function postDisconnected(command, cb) {
                sdk.log.info({ data: command, method: 'stateDisconnected/post', type: log_type });
                if (state.disconnecting) {
                    try {
                        sdk.log.info({ text: 'cancel command due disconnecting phase ', data: command, method: 'stateDisconnected/post', type: log_type });
                        cb && cb(error_cancel);
                    } catch (ex) {
                        sdk.log.warning({ text: 'calling to post callback cause to exception', data: { exception: ex }, method: 'stateDisconnected/post', type: log_type });
                    }
                    return;
                }
                queue.push({ command: command, cb: cb });
                $this.connect();
            }
            , toString: function () {
                return "stateDisconnected";
            }
        };
        var stateTerminated = {
            init: function () {
                sdk.log.info({ method: 'stateTerminated/init', type: log_type });
                map.onTimeout = function () {
                    sdk.log.info({ method: ' onTimeout stub', type: log_type });
                };
                port.onMessage = function () {
                    sdk.log.info({ method: ' onMessage stub', type: log_type });
                };
                port.onConnect = function () {
                    sdk.log.info({ text: 'stub', method: 'stateTerminated/onConnect', type: log_type });
                };
                port.onDisconnect = function () {
                    sdk.log.info({ text: 'stub', method: 'stateTerminated/onDisconnect', type: log_type });
                }
            }
            , connect: function () {
                try {
                    $this.onDisconnect && $this.onDisconnect();
                } catch (ex) {
                    sdk.log.warning({ text: 'calling to onDisconnect handler cause to exception', data: { exception: ex }, method: 'portDisconnectHandler', type: log_type });
                }
            }
            , disconnect: function () {
                try {
                    $this.onDisconnect && $this.onDisconnect()
                } catch (ex) {
                    sdk.log.warning({ text: 'calling to onDisconnect handler cause to exception', data: { exception: ex }, method: 'portDisconnectHandler', type: log_type });
                }
            }
            , post: function (command, cb) {
                try {
                    sdk.log.info({ text: 'cancel callback ', data: command, method: 'stateTerminated/post', type: log_type });
                    cb && cb(error_cancel);
                } catch (ex) {
                    sdk.log.warning({ text: 'calling to post callback cause to exception', data: { exception: ex }, method: 'stateTerminated/post', type: log_type });
                }
            }
            , toString: function () {
                return "stateTerminated";
            }
        };

        function portMessageHandler(packet) {
            sdk.log.info({ data: packet, method: 'portMessageHandler', type: log_type });

            if (!packet || typeof packet != 'object') {
                sdk.log.error({ text: 'invalid packet - empty or not an object', data: packet, method: 'portMessageHandler', type: log_type });
                return;
            }

            if (!packet.type || packet.type == 'command') {
                var id = packet.id;
                if (!id) {
                    sdk.log.error({ text: 'invalid packet - no packet id', data: packet, method: 'portMessageHandler', type: log_type });
                    return;
                }
                var item = map.get(id);

                if (!packet.multipart) {
                    map.del(id);
                }
                if (!item) {
                    sdk.log.warn({ text: 'invalid packet - no callback handler for  packet id ', data: packet, method: 'portMessageHandler', type: log_type });
                    return;
                }
                try {
                    item.cb(packet.data);
                } catch (ex) {
                    sdk.log.warn({ text: 'command callback cause to exception', data: { ex: ex, packet: packet, item: item }, method: 'portMessageHandler', type: log_type });
                }

                return;
            }

            if (packet.type == 'notification') {
                $this.onNotification(packet.data);
            }
        }

        function portConnectHandler() {
            sdk.log.vital({ method: 'portConnectHandler', type: log_type });
            state = stateConnected;
            state.init();
            resendQueue();
            try {
                $this.onConnect && $this.onConnect()
            } catch (ex) {
                sdk.log.warning({ text: 'calling to onConnect handler cause to exception', data: { exception: ex }, method: 'portDisconnectHandler', type: log_type });
            }
        }

        function portDisconnectHandler(params) {
            sdk.log.vital({ data: params, method: 'portDisconnectHandler', type: log_type });
            if (!params) {
                params = { status: 'disconnected' };
            }

            if (disconnectCount < 20 && params.status != 'terminated') {
                state = stateDisconnected;
                state.disconnecting = true;
            } else {
                state = stateTerminated;
            }
            sdk.log.vital({ method: 'portDisconnectHandler/cancel mapped commands', type: log_type });
            map.cancel(function (item) {
                try {
                    sdk.log.info({ data: item, method: 'portDisconnectHandler/cancel mapped command', type: log_type });
                    item && item.cb && item.cb(error_cancel);
                } catch (ex) {
                    sdk.log.warning({ text: 'calling to mapped callback cause to exception', data: { exception: ex }, method: 'portDisconnectHandler', type: log_type });
                }
            });
            sdk.log.info({ method: 'portDisconnectHandler/cancel mapped commands finished', type: log_type });
            sdk.log.vital({ data: queue, method: 'portDisconnectHandler/cancel queueed commands', type: log_type });
            queue.forEach(function (item) {
                try {
                    sdk.log.info({ data: item, method: 'portDisconnectHandler/cancel queueed command', type: log_type });
                    item && item.cb && item.cb(error_cancel);
                } catch (ex) {
                    sdk.log.warning({ text: 'calling to enqueued callback cause to exception', data: { exception: ex }, method: 'portDisconnectHandler', type: log_type });
                }
            });
            sdk.log.vital({ method: 'portDisconnectHandler/cancel queueed commands finished', type: log_type });
            queue = [];
            state.init();
            try {
                $this.onDisconnect && $this.onDisconnect()
            } catch (ex) {
                sdk.log.warning({ text: 'calling to onDisconnect handler cause to exception', data: { exception: ex }, method: 'portDisconnectHandler', type: log_type });
            }
            delete state.disconnecting;

        }

        function resendQueue() {
            sdk.log.vital({ method: 'resendQueue', type: log_type });
            while (queue.length) {
                var item = queue.shift();
                $this.sendMessage(item.command, item.cb);
            }
        }

        $this.onNotification = function () {
            sdk.log.info({ method: 'onNotificationStub', type: log_type });
        };

        $this.connect = function () {
            state.connect();
        };
        $this.disconnect = function () {
            state.disconnect();
        };
        $this.sendMessage = function (command, cb) {
            state.post(command, cb);
        };
        $this.getHostState = function () {
            return state.toString();
        };
        (function ctor() {
            sdk.log.info({ method: 'ctor', type: log_type });
            state = stateDisconnected;
            state.init();
        })();
        $this.ondisconnect = function () {
            sdk.log.info({ method: 'ondisconnect Stub', type: log_type });
        };
        $this.onconnect = function () {
            sdk.log.info({ method: 'onconnect Stub', type: log_type });
        };
    } //class:NativeMsgCom

    return {
        NativeMsgCom: NativeMsgCom
    };
})();





