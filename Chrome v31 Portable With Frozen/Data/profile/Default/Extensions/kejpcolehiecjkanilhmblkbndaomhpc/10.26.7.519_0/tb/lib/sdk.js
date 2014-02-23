/**/
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
/**/
String.prototype.trim = function () {
    return this.replace(/^\s+|\s+$/g, "");
};

if (!String.prototype.tokens) {
    String.prototype.tokens = function () {

        var tokens = arguments[0];
        if (arguments.length == 2) {
            tokens = {};
            tokens[arguments[0]] = arguments[1];
        }

        var exp = new RegExp(/\{([a-zA-Z_0-9\-]+)\}/g);
        return this.replace(exp, function (m, n) {
            return tokens.hasOwnProperty(n) ? tokens[n] : '{' + n + '}';
        });
    }
}

JSON.parseSafe = function (data, fallback, errh) {
    if (typeof (data) != 'string') {
        return data;
    }
    try {
        data = JSON.parse(data);
        return data;
    } catch (e) {
        errh && errh(e);
        return fallback;
    }
}


if (!Array.indexOf) {
    Array.prototype.indexOf = function (obj, start) {
        for (var i = (start || 0); i < this.length; i++) {
            if (this[i] == obj) {
                return i;
            }
        }
        return -1;
    }
}

var sdk = function () {
    return {
        uid: function () {
            return (+new Date()).toString(16) + Math.random().toString(16).substring(1);
        }, num: {
            "restrict": function (val, min, max, fallback) {
                if (isNaN(val)) {
                    return fallback;
                }
                if (val < min) {
                    return min;
                }
                if (val > max) {
                    return max;
                }
                return val;
            }
        }, EventNotifier: function (name) {
            var pool = {};
            var count = 0;

            this.add = function (f) {
                if (typeof f != 'function') {
                    return;
                }
                pool['f_' + ++count] = f;
                return count;
            };

            this.del = function (h) {
                if (typeof h != 'number') {
                    return;
                }
                delete pool['f_' + h];
            };

            this.run = function () {
                for (var k in pool) {
                    pool[k] && pool[k].apply(this, arguments);
                }
            };
        }, TaskManager: function TaskManager() {
            var $this = this;
            $this.pool = {};
            this.create = function (obj, f) {
                if (typeof obj == 'function') {
                    f = obj;
                    obj = null;
                }
                var tid = sdk.uid();
                $this.pool[tid] = f;
                var task = function Task() {
                    sdk.log.info({data: {'tid': tid, 'pool': $this.pool, 'arguments': arguments}, 'method': 'task', 'type': 'TaskManager' });
                    if ($this.pool[tid]) {
                        sdk.log.info({text: 'execute', 'method': 'task', 'type': 'TaskManager' });
                        $this.pool[tid].apply(obj, arguments)
                    } else {
                        sdk.log.info({text: 'canceled', 'method': 'task', 'type': 'TaskManager' });
                    }
                    delete $this.pool[tid];
                };
                return {'tid': tid, 'task': task};
            };
            function cancel(tid) {
                delete $this.pool[tid];
            };
            this.purge = function () {
                if (arguments.length) {
                    cancel(arguments[0]);
                } else {
                    $this.pool = {};
                }
                sdk.log.info({data: {'pool': $this.pool}, 'method': 'purge', 'type': 'TaskManager' });

            };
        }
        , 'AsyncDataProcessor': function AsyncDataProcessor() {
            var pool = {};
            var count = 0;
            var _this = this;

            this.enq = function (data) {
                pool[count] = {
                    'id': count, 'done': function () {
                        _this.deq(this.id);
                        for (var k in pool) {
                            return;
                        }
                        done_handler();
                    }, 'fail': function () {
                        _this.deq(this.id);
                        for (var k in pool) {
                            return;
                        }
                        done_handler();
                    }, 'data': data
                };
                return count++;
            }
            this.deq = function (i) {
                delete pool[i];
            }

            this.run = function (f) {
                var hasItems = false;
                for (var k in pool) {
                    hasItems = true;
                }
                if (!hasItems) {
                    done_handler && done_handler();
                }
                sdk.forEachIn(pool, function (item) {
                    f(item);
                });
            }
            var done_handler = function () {
            };
            this.done = function (f) {
                if (!f) {
                    done_handler();
                    return;
                }
                done_handler = f;
            }
        }
        , "xml": {
            'innerText': function (node, fallback) {
                if (typeof node == 'undefined') {
                    return fallback;
                }
                return node.textContent || node.text || fallback;
            }
            , "document": function (text) {
                var doc;

                if (window.ActiveXObject) {
                    text = text.substring(text.indexOf("<"));
                    doc = new ActiveXObject('Microsoft.XMLDOM');
                    doc.async = 'false';
                    doc.loadXML(text);
                } else {
                    var parser = new DOMParser();
                    doc = parser.parseFromString(text, 'text/xml');
                }
                return doc;
            }
        }
        , "forEachIn": function forEachIn(enumerable, action) {
            if (typeof (action) != 'function') {
                return;
            }
            if (enumerable instanceof Array) {
                for (var i = 0; i < enumerable.length; i++) {
                    var rf = action(enumerable[i]);
                    if (typeof (rf) == 'boolean' && rf == false) {
                        break;
                    }
                }
                return;
            }

            for (var k in enumerable) {
                var rf = action(enumerable[k]);
                if (typeof (rf) == 'boolean' && rf == false) {
                    break;
                }
            }
        }
        , date: {
            "dayOfYear": function () {
                var today = new Date();
                var first = new Date(today.getFullYear(), 0, 1);
                var theDay = Math.round(((today - first) / 1000 / 60 / 60 / 24) + .5, 0);
                return theDay;
            }
        }
        , data: {
            'getDataset': function () {
                return { 'query': undefined,
                    'items': []
                };
            }
        }
        , log: function () {
            var config = {
                name: 'SDK', enabled: false, dataToJson: true, info: { enabled: true }, warning: { enabled: true }, error: { enabled: true }
            }
            var la = new Date();
            var toTime = function (date, o) {
                var delta = '?';
                if (o && o.last) {
                    delta = date.getTime() - o.last.getTime();
                }
                return '{0}:{1}:{2}.{3}:[+{4}]'.format(date.getHours(), date.getMinutes(), date.getSeconds(), date.getMilliseconds(), delta);
            }

            var writer = function () {
                if (navigator.userAgent.match('Chrome')) {
                    return function (text, data) {
                        try {
                            if (arguments.length > 1) {
                                console.log(text, data);
                            }
                            else {
                                console.log(text);
                            }
                        } catch (ex) {
                        }
                    } //function
                }
                if (navigator.userAgent.match('Firefox')) {
                    return function (text, data) {
                        try {
                            if (arguments.length > 1) {

                                abstractionlayer.commons.logging.logDebug({ errorMessage: text});
                            }
                            else {
                                abstractionlayer.commons.logging.logDebug({ errorMessage: text});
                            }
                        } catch (ex) {
                        }
                    } //function
                }
                if (navigator.userAgent.match('MSIE')) {
                    return function (text, data) {
                        try {
                            if (arguments.length > 1) {
                                window.external.invokePlatformActionSync(20, 0, text, '');
                            }
                            else {
                                window.external.invokePlatformActionSync(20, 0, text, '');
                            }
                        } catch (ex) {
                        }
                    } //function
                }
                return function () {
                };
            }();

            var write = function (item, data) {
                var date = new Date();
                var ts = date.getTime();
                if (typeof (item) == 'string') {
                    item = { "type": 'N/A', "method": 'N/A', "text": item, "data": {} };
                    if (arguments.length > 1) {
                        item.data = data;
                    }
                }

                var logText = '[{0}|{1}]-{2}/{3}/{4}'.format(ts, toTime(date, {'last': la}), config.name, item.type, item.method);
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
                enabled: function (v) {
                    config.enabled = v;
                },
                setName: function (name) {
                    config.name = name;
                }, info: function (item) {
                    return (config.enabled && config.info.enabled && write.apply(this, arguments));
                }, warning: function (item) {
                    return (config.enabled && config.warning.enabled && write.apply(this, arguments));
                }, error: function (item) {
                    return (config.enabled && config.error.enabled && write.apply(this, arguments));
                }, critical: function (item) {
                    try {
                        var message = item.text || '';
                        var info = { 'reportToServer': true };
                        info.context = { 'className': 'EmailNotifier / ' + item.type || '', 'functionName': item.method || '' };
                        item.data = item.data || {};
                        if (item.data.exception) {
                            info.error = item.data.exception;
                        }
                        if (item.data.code) {
                            info.code = item.data.code;
                        }

                        conduit.logging.logError(message, info);
                    } catch (ex) {
                    }
                }
            };
        }(),
        'ui': {
            'util': {
                idealTextColor: function (bgColor) {
                    var nThreshold = 105;
                    var bgR = parseInt(bgColor.slice(1, 3), 16);
                    var bgG = parseInt(bgColor.slice(3, 5), 16);
                    var bgB = parseInt(bgColor.slice(5, 7), 16);
                    var bgDelta = parseInt((bgR * 0.299) + (bgG * 0.587) + (bgB * 0.114));
                    var foreColor = (255 - bgDelta < nThreshold) ? '#000000' : '#FFFFFF';
                    return foreColor;
                } //method
            }//ns.utils
        }//ns.ui
    };
}()//sdk namespace
