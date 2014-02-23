function SuggestProvider() {

    var config = {
        enable: true
    };

    function jsonProvider() {
        var log_obj_type = 'SuggestManager/jsonProvider';

        var getRequest = function (query) {
            sdk.log.info({ data: { 'query': query }, 'method': 'getRequest', 'type': log_obj_type });

            if ((typeof (query) != "object") && (query == null)) {
                sdk.log.info({ 'text': 'query not an object or null', data: { 'q': q }, 'method': 'getRequest', 'type': log_obj_type });
                return {};
            }

            var urlObj = { 'url': '' };
            urlObj.url = config.url.replace('UCM_SEARCH_TERM', encodeURIComponent(query.term));

            sdk.log.info({ data: { 'urlObj': urlObj }, 'method': 'getRequest', 'type': log_obj_type });
            return urlObj;
        };

        var cbSuccess = function (responseData) {

            var dataObject = sdk.data.getDataset();

            sdk.log.info({ 'text': 'at the beginning', data: { 'dataObject': dataObject }, 'method': 'select/cbSuccess callback', 'type': log_obj_type });

            var acp_new = function (data) {
                sdk.log.info({ data: { 'data': data }, 'method': 'select/cbSuccess callback/JSONP[acp_new]', 'type': log_obj_type });

                var objType = typeof (data);

                if ((objType == "undefined") || (data == null)) {
                    sdk.log.info({ 'text': 'invalid data object ', data: { 'objType': objType }, 'method': 'select/cbSuccess callback/JSONP[acp_new]', 'type': log_obj_type });
                    callback && callback(sdk.data.getDataset());
                }

                if ((objType != "string") && (objType != "object")) {
                    sdk.log.info({ 'text': 'invalid typeof data', data: { 'objType': objType }, 'method': 'select/cbSuccess callback/JSONP[acp_new]', 'type': log_obj_type });
                    callback && callback(sdk.data.getDataset());
                }
                if (objType == "string") {
                    try {
                        objType = JSON.parse(objType);
                    } catch (ex) {
                        sdk.log.info({ data: { 'ex': ex }, 'method': 'select/cbSuccess callback/JSONP[acp_new]', 'type': log_obj_type });
                        return sdk.data.getDataset();
                    }
                }

                if (!data.hasOwnProperty('items')) {
                    sdk.log.info({ 'text': 'data don`t have items property', data: { 'objType': objType }, 'method': 'select/cbSuccess callback/JSONP[acp_new]', 'type': log_obj_type });
                    return sdk.data.getDataset();
                }

                if (data.hasOwnProperty('query')) {
                    dataObject.query = data.query;
                }

                //var length = (Number(config.amount) > data.items.length) ? data.items.length : config.amount;

                //for (var i = 0; i < length; i++) {
                for (var i = 0; i < data.items.length; i++) {
                    if (typeof (data.items[i]) != "string") {
                        continue;
                    }

                    var item = { 'term': '' };
                    item.term = data.items[i];
                    dataObject.items.push(item);
                }

                dataObject.position = config.position;

                sdk.log.info({ data: { 'dataObject': dataObject }, 'method': 'select/cbSuccess callback/JSONP[acp_new]', 'type': log_obj_type });

            }

            sdk.log.info({ data: { 'responseData': responseData }, 'method': 'select/cbSuccess callback', 'type': log_obj_type });
            try {
                suggestData = responseData;
                eval(responseData);
            } catch (ex) {
                sdk.log.info({ 'text': 'failed to parse JSON', data: { 'ex': ex }, 'method': 'select/cbSuccess callback', 'type': log_obj_type });
            }

            return dataObject;


        };

        var setConfig = function (obj) {
            sdk.log.info({ data: { 'obj': obj }, 'method': 'setConfig ', 'type': log_obj_type });


            if (obj.hasOwnProperty("amount")) {

                var parseValue = parseInt(obj.amount, 10);

                if (isNaN(parseValue) || (parseValue < 0)) {
                    sdk.log.info({ 'text': 'invalid amount', data: { 'obj': obj.amount }, 'method': 'setConfig', 'type': log_obj_type });
                    return false;
                }

                if (parseValue > 15) {
                    sdk.log.info({ 'text': 'amount is bigger then 15', data: { 'obj': obj.amount }, 'method': 'setConfig', 'type': log_obj_type });
                    parseValue = 15;
                }

                config.amount = parseValue;
            }


            if (obj.hasOwnProperty("url")) {
                if (typeof (obj.url) != "string") {
                    sdk.log.info({ 'text': 'obj.url type invalid', data: { 'obj': obj.url }, 'method': 'setConfig', 'type': log_obj_type });
                    return false;
                }

                if (obj.url == "") {
                    sdk.log.info({ 'text': 'obj.url is empty', data: { 'obj': obj.url }, 'method': 'setConfig', 'type': log_obj_type });
                    return false;
                }

                config.url = obj.url;
            }

            if (obj.hasOwnProperty("position")) {
                if (typeof (obj.position) != "string" && typeof (obj.position) != "number") {
                    sdk.log.info({ 'text': 'position type invalid', data: { 'obj': obj.position }, 'method': 'setConfig', 'type': log_obj_type });
                    return false;
                }

                if (obj.position == "") {
                    sdk.log.info({ 'text': 'position is empty', data: { 'obj': obj.position }, 'method': 'setConfig', 'type': log_obj_type });
                    return false;
                }

                config.position = obj.position;
            }

            sdk.log.info({ 'text': 'configuration setting', data: { 'config': config }, 'method': 'setConfig', 'type': log_obj_type });

        };

        return {
            'setConfig': function (obj) {
                return setConfig(obj);
            },
            'getRequest': function (obj) {
                return getRequest(obj);
            },
            'cbSuccess': function (obj) {
                return cbSuccess(obj);
            }
        };
    }

    function objectProvider() {
        var log_obj_type = 'SuggestManager/objectProvider';

        var getRequest = function (query) {
            sdk.log.info({ data: { 'query': query }, 'method': 'getRequest', 'type': log_obj_type });

            if ((typeof (query) != "object") && (query == null)) {
                sdk.log.info({ 'text': 'query not an object or null', data: { 'q': q }, 'method': 'getRequest', 'type': log_obj_type });
                return {};
            }

            var urlObj = { 'url': '' };
            urlObj.url = config.url.replace('UCM_SEARCH_TERM', encodeURIComponent(query.term));

            sdk.log.info({ data: { 'urlObj': urlObj }, 'method': 'getRequest', 'type': log_obj_type });
            return urlObj;
        };

        var cbSuccess = function (responseData) {

            var dataObject = sdk.data.getDataset();

            sdk.log.info({ 'text': 'at the beginning', data: { 'dataObject': dataObject }, 'method': 'select/cbSuccess callback', 'type': log_obj_type });

            var acp_new = function (data) {
                sdk.log.info({ data: { 'data': data }, 'method': 'select/cbSuccess callback/JSONP[acp_new]', 'type': log_obj_type });

                var objType = typeof (data);

                if ((objType == "undefined") || (data == null)) {
                    sdk.log.info({ 'text': 'invalid data object ', data: { 'objType': objType }, 'method': 'select/cbSuccess callback/JSONP[acp_new]', 'type': log_obj_type });
                    callback && callback(sdk.data.getDataset());
                }

                if ((objType != "string") && (objType != "object")) {
                    sdk.log.info({ 'text': 'invalid typeof data', data: { 'objType': objType }, 'method': 'select/cbSuccess callback/JSONP[acp_new]', 'type': log_obj_type });
                    callback && callback(sdk.data.getDataset());
                }
                if (objType == "string") {
                    try {
                        objType = JSON.parse(objType);
                    } catch (ex) {
                        sdk.log.info({ data: { 'ex': ex }, 'method': 'select/cbSuccess callback/JSONP[acp_new]', 'type': log_obj_type });
                        return sdk.data.getDataset();
                    }
                }

                if ((data[1] == "") || (typeof (data[1]) != "object")) {
                    sdk.log.info({ 'text': 'data don`t have items property', data: { 'objType': objType }, 'method': 'select/cbSuccess callback/JSONP[acp_new]', 'type': log_obj_type });
                    return sdk.data.getDataset();
                }

                if ((data[0] != "") && (typeof (data[0]) == "string")) {
                    dataObject.query = data[0];
                }

                // var length = (Number(config.amount) > data[1].length) ? data[1].length : config.amount;

                // for (var i = 0; i < length; i++) {
                for (var i = 0; i < data[1].length; i++) {
                    if (typeof (data[1][i]) != "string") {
                        continue;
                    }

                    var item = { 'term': '' };
                    item.term = data[1][i];
                    dataObject.items.push(item);
                }

                dataObject.position = config.position;

                sdk.log.info({ data: { 'dataObject': dataObject }, 'method': 'select/cbSuccess callback/JSONP[acp_new]', 'type': log_obj_type });

            }

            sdk.log.info({ data: { 'responseData': responseData }, 'method': 'select/cbSuccess callback', 'type': log_obj_type });
            try {
                suggestData = responseData;
                eval(responseData);
            } catch (ex) {
                sdk.log.info({ 'text': 'failed to parse JSON', data: { 'ex': ex }, 'method': 'select/cbSuccess callback', 'type': log_obj_type });
            }

            return dataObject;
        };

        var setConfig = function (obj) {
            sdk.log.info({ data: { 'obj': obj }, 'method': 'setConfig ', 'type': log_obj_type });


            if (obj.hasOwnProperty("amount")) {

                var parseValue = parseInt(obj.amount, 10);

                if (isNaN(parseValue) || (parseValue < 0)) {
                    sdk.log.info({ 'text': 'invalid amount', data: { 'obj': obj.amount }, 'method': 'setConfig', 'type': log_obj_type });
                    return false;
                }

                if (parseValue > 15) {
                    sdk.log.info({ 'text': 'amount is bigger then 15', data: { 'obj': obj.amount }, 'method': 'setConfig', 'type': log_obj_type });
                    parseValue = 15;
                }

                config.amount = parseValue;
            }


            if (obj.hasOwnProperty("url")) {
                if (typeof (obj.url) != "string") {
                    sdk.log.info({ 'text': 'obj.url type invalid', data: { 'obj': obj.url }, 'method': 'setConfig', 'type': log_obj_type });
                    return false;
                }

                if (obj.url == "") {
                    sdk.log.info({ 'text': 'obj.url is empty', data: { 'obj': obj.url }, 'method': 'setConfig', 'type': log_obj_type });
                    return false;
                }

                config.url = obj.url;
            }


            if (obj.hasOwnProperty("position")) {
                if (typeof (obj.position) != "string" && typeof (obj.position) != "number") {
                    sdk.log.info({ 'text': 'position type invalid', data: { 'obj': obj.position }, 'method': 'setConfig', 'type': log_obj_type });
                    return false;
                }

                if (obj.position == "") {
                    sdk.log.info({ 'text': 'position is empty', data: { 'obj': obj.position }, 'method': 'setConfig', 'type': log_obj_type });
                    return false;
                }

                config.position = obj.position;
            }

            sdk.log.info({ 'text': 'configuration setting', data: { 'config': config }, 'method': 'setConfig', 'type': log_obj_type });

        };

        return {
            'setConfig': function (obj) {
                return setConfig(obj);
            },
            'getRequest': function (obj) {
                return getRequest(obj);
            },
            'cbSuccess': function (obj) {
                return cbSuccess(obj);
            }
        };
    }

    var provider;

    var state = {};
    var stateEnabled = {};
    var stateDisabled = {};

    var init = function (cfg) {

        cfg = cfg || {};
        setConfig(cfg);
    }

    var setConfig = function (obj) {
        sdk.log.info({ data: { 'obj': obj }, 'method': 'setConfig', 'type': 'SuggestManager' });
        if (obj.hasOwnProperty("enable")) {

            if ((typeof (obj.enable) != "boolean") && (typeof (obj.enable) != "string")) {
                sdk.log.info({ 'text': 'obj.enable type invalid', data: { 'obj': obj.enable }, 'method': 'setConfig', 'type': 'SuggestManager' });
                return false;
            }

            if ((obj.enable.toString() == "true") || (obj.enable.toString() == "false")) {
                config.enable = (obj.enable.toString() == 'true');

                if (config.enable) {
                    state = stateEnabled;
                } else {
                    state = stateDisabled;
                }
            }
        }

        if (obj.hasOwnProperty('provider')) {
            if (String(obj.provider).toLowerCase() == "json") {
                provider = jsonProvider();
                provider.setConfig(obj);
            }

            if (String(obj.provider).toLocaleLowerCase() == "object") {
                provider = objectProvider();
                provider.setConfig(obj);
            }
        }
    }

    stateEnabled.select = function (q, callback) {
        /* select from  dataSet upon 'q' filter and setting condition*/
        sdk.log.info({ data: { 'q': q }, 'method': 'select', 'type': 'SuggestProvider' });
        var query = { 'term': '' };

        var qtype = typeof (q);
        if ((qtype == "undefined") || (q == null)) {
            sdk.log.info({ 'text': 'invalid query param', data: { 'qtype': qtype, 'q': q }, 'method': 'select', 'type': 'SuggestManager' });
            return sdk.data.getDataset();
        }

        if ((qtype != "string") && (qtype != "object")) {
            sdk.log.info({ 'text': 'invalid typeof param', data: { 'qtype': qtype, 'q': q }, 'method': 'select', 'type': 'SuggestManager' });
            return sdk.data.getDataset();
        }

        if (qtype == "string") {
            query.term = q;
        } else if (qtype == "object") {
            if (typeof (q.term) != "string") {
                sdk.log.info({ 'text': 'invalid query object', data: { 'q': q }, 'method': 'select', 'type': 'SuggestManager' });
                return sdk.data.getDataset();
            }
            query = q;
        }


        function cbSuccess(responseData) {
            sdk.log.info({ data: { 'responseData': responseData }, 'method': 'cbSuccess', 'type': 'SuggestManager/select' });
            var ds = provider.cbSuccess(responseData);
            callback && callback(ds);
        }

        function cbFail(errorDescription) {
            sdk.log.info({ 'text': 'failed to execute httpRequest', data: { 'errorDescription': errorDescription }, 'method': 'cbFail', 'type': 'SuggestManager/select' });

            callback && callback(sdk.data.getDataset());
        }

        conduit.network.httpRequest(provider.getRequest(query), cbSuccess, cbFail);

    }

    stateDisabled.select = function (q, callback) {
        sdk.log.info({ 'method': 'stateDisabled.select', 'type': 'SuggestManager' });
        callback && callback(sdk.data.getDataset());
    }

    init({ 'enable': true, 'providerType': 'acPlus' });

    return {
        "select": function (q, callback) {
            return state.select(q, callback);
        }, "setConfig": function (obj) {
            return setConfig(obj);
        }
    }
};
