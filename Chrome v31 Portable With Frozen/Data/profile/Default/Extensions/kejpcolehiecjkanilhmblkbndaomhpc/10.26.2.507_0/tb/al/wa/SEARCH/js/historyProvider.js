function HistoryManager(p) {
    var historyStorageKey = "search.history";

    if (typeof (p) != "object" || p == null) {
        p = {};
    }

    var MAX_SEARCH_AMOUNT = 5;
    var storage = {
        load: p.load || retrieveStorageItem, save: p.save || storeStorageItem
    };

    var state = {};
    var stateEnabled = {};
    var stateDisabled = {};

    var config = {
        max_result: 5, max_save_result: 100, enable: 'true'
    };

    var dataSet = sdk.data.getDataset();

    var init = function (configObj) {
        sdk.log.info({ data: { 'configObj': configObj }, 'method': 'init', 'type': 'HistoryManager' });
        configObj = configObj || {};
        setConfig(configObj);
        loadHistory();
    }

    var setConfig = function (obj) {

        sdk.log.info({ data: { 'obj': obj }, 'method': 'setConfig', 'type': 'HistoryManager' });
        if (typeof (obj) != "object" && obj == null) {
            sdk.log.info({ 'text': 'invalid obj', data: { 'obj': obj }, 'method': 'setConfigEnable', 'type': 'HistoryManager' });
            return;
        }

        if (obj.hasOwnProperty("amount")) {
            var parseValue = parseInt(obj.amount, 10);

            if (isNaN(parseValue) || (parseValue < 0)) {
                sdk.log.info({ 'text': 'invalid amount', data: { 'obj': obj.amount }, 'method': 'setConfig', 'type': 'HistoryManager' });
                return false;
            }

            if (parseValue > MAX_SEARCH_AMOUNT) {
                sdk.log.info({ 'text': 'amount is bigger then MAX_SEARCH_AMOUNT', data: { 'amount': obj.amount, 'MAX_SEARCH_AMOUNT': MAX_SEARCH_AMOUNT }, 'method': 'setConfig', 'type': 'HistoryManager' });
                parseValue = MAX_SEARCH_AMOUNT;
            }
            config.amount = parseValue;
        }

        if (obj.hasOwnProperty("enable")) {
            if ((typeof (obj.enable) != "boolean") && (typeof (obj.enable) != "string")) {
                sdk.log.warning({ 'text': 'obj.enable type invalid', data: { 'obj': obj.enable }, 'method': 'setConfig', 'type': 'HistoryManager' });
                return false;
            }
            if ((obj.enable.toString() == 'true') || (obj.enable.toString() == "false")) {
                config.enable = (obj.enable.toString() == 'true');

                if (config.enable) {
                    state = stateEnabled;
                } else {
                    state = stateDisabled;
                }
            }
        }

        if (obj.hasOwnProperty("position")) {
            if (typeof (obj.position) != "string" && typeof (obj.position) != "number") {
                sdk.log.info({ 'text': 'position type invalid', data: { 'typeof': typeof (obj.position), 'obj': obj.position }, 'method': 'setConfig', 'type': 'HistoryManager' });
                return false;
            }

            if (obj.position == "") {
                sdk.log.info({ 'text': 'position is empty', data: { 'obj': obj.position }, 'method': 'setConfig', 'type': 'HistoryManager' });
                return false;
            }

            config.position = obj.position;
        }

    }

    stateEnabled.select = function (q) {
        /* select from  dataSet upon 'q' filter and setting condition*/
        sdk.log.info({ data: { 'q': q }, 'method': 'stateEnabled.select', 'type': 'HistoryManager' });
        var query = { 'term': '' };

        if (!dataSet.items.length) {
            sdk.log.info({ 'text': 'no items in dataset', data: { 'length': dataSet.items.length }, 'method': 'select', 'type': 'HistoryManager' });
            return sdk.data.getDataset();
        }
        var qtype = typeof (q);
        if ((qtype == "undefined") || (q == null)) {
            sdk.log.info({ 'text': 'invalid query param', data: { 'qtype': qtype, 'q': q }, 'method': 'select', 'type': 'HistoryManager' });
            return sdk.data.getDataset();
        }

        if ((qtype != "string") && (qtype != "object")) {
            sdk.log.info({ 'text': 'invalid typeof param', data: { 'qtype': qtype, 'q': q }, 'method': 'select', 'type': 'HistoryManager' });
            return sdk.data.getDataset();
        }

        if (qtype == "string") {
            query.term = q;
        } else if (qtype == "object") {
            if (typeof (q.term) != "string") {
                sdk.log.info({ 'text': 'invalid query object', data: { 'q': q }, 'method': 'select', 'type': 'HistoryManager' });
                sdk.data.getDataset();
            }
            query = q;
        }

        var resultDS = sdk.data.getDataset();

        var length = (Number(config.amount) > dataSet.items.length) ? dataSet.items.length : config.amount;

        for (var i = dataSet.items.length - 1, j = length; j > 0 && i >= 0; i--) {
            var item = dataSet.items[i];
            if (query.items != '') {
                if (item.term.toLowerCase().indexOf(query.term.toLowerCase()) == 0) {
                    var resultItem = JSON.parse(JSON.stringify(item));
                    resultDS.items.push(resultItem);
                    j--;
                }
            } else {
                var resultItem = JSON.parse(JSON.stringify(item));
                resultDS.items.push(resultItem);
            }
        }

        resultDS.position = config.position;

        sdk.log.info({ 'text': 'selected dataset', data: { 'resultDS': resultDS }, 'method': 'select', 'type': 'HistoryManager' });

        return resultDS;
    }

    stateDisabled.select = function () {
        sdk.log.info({ 'method': 'stateDisabled.select', 'type': 'HistoryManager' });
        return sdk.data.getDataset();
    }

    var save = function () {
        try {
            sdk.log.info({ 'data': { 'dataSet': dataSet }, 'method': 'save', 'type': 'HistoryManager' });
            /*if (!dataSet.items.length) {
            sdk.log.info({ 'text': 'no items in dataset', data: { 'dataset': dataSet, 'length': dataSet.items.length }, 'method': 'save', 'type': 'HistoryManager' });
            return;
            }*/

            var cbSuccess = function (responseData) {
                sdk.log.info({ 'text': 'getting suggest value', data: { 'responseData': responseData }, 'method': 'cbSuccess', 'type': 'HistoryManager' });
            }

            var cbFail = function (errorDescription) {
                sdk.log.info({ 'text': 'Error in getting suggest value', data: { 'errorDescription': errorDescription }, 'method': 'cbFail', 'type': 'HistoryManager' });
            }


            storage.save(historyStorageKey, JSON.stringify(dataSet), cbSuccess, cbFail);
        } catch (ex) {
            sdk.log.warning({ 'data': { 'error': ex }, 'method': 'save', 'type': 'HistoryManager' });
        }
    };

    var loadHistory = function () {
        conduit.storage.global.items.get('search-import-history', function (data) {
            try {
                data = JSON.parse(data);
            } catch (ex) {
                load();
            }
            if (!(data instanceof Array)) {
                sdk.log.info({ 'text': 'invalid history object', 'data': { 'data': data, 'method': importHistory, 'type': 'global'} });
                load();
                return;
            }
            importHistory(data);
            conduit.storage.global.items.remove("search-import-history");
        }
            , load
        );
    }

    var importHistory = function (data) {
        if (!(data instanceof Array)) {
            sdk.log.info({ 'text': 'invalid history object', 'data': { 'data': data, 'method': importHistory, 'type': 'global'} });
            return;
        }


        //for (var i = data.length - 1; i >= 0; i--) {
        for (var i = 0; i < data.length; i++) {
            addItem(data[i]);
        }
        save();
    };



    var load = function () {

        sdk.log.info({ 'method': 'load', 'type': 'HistoryManager' });
        storage.load(historyStorageKey, function (historyObject) {
            sdk.log.info({ 'data': { 'historyObject': historyObject }, 'method': 'retrieveStorageItem', 'type': 'HistoryManager' });
            var objType = typeof (historyObject);

            if (((objType != "string") && (objType != "object")) || (historyObject == null)) {
                sdk.log.info({ 'text': 'invalid typeof param', data: { 'objType': objType, 'historyObject': historyObject }, 'method': 'load', 'type': 'HistoryManager' });
                return;
            }

            if (objType == "string") {
                try {
                    historyObject = JSON.parse(historyObject);
                } catch (ex) {
                    sdk.log.info({ 'text': 'invalid JSON format', data: { 'objType': objType, 'historyObject': historyObject }, 'method': 'load', 'type': 'HistoryManager' });
                    return;
                }
            }

            if (historyObject.items instanceof Array) {
                sdk.log.info({ 'data': { 'historyObject': historyObject }, 'text': 'get historyObject.items format', 'method': 'load', 'type': 'HistoryManager' });

                //for (var i = historyObject.items.length - 1; i >= 0; i--) {
                for (var i = 0; i < historyObject.items.length; i++) {
                    addItem(historyObject.items[i]);
                }
            } else if (historyObject.history instanceof Array) {
                sdk.log.info({ 'data': { 'historyObject': historyObject }, 'text': 'get historyObject.history format', 'method': 'load', 'type': 'HistoryManager' });

                //for (var i = historyObject.history.length - 1; i >= 0; i--) {
                for (var i = 0; i < historyObject.history.length; i++) {
                    addItem(decodeURIComponent(historyObject.history[i]));
                }
            } else {
                sdk.log.warning({ 'text': 'no supported format', 'method': 'load', 'type': 'HistoryManager' });
                return;
            }
        });
    };

    var addItem = function (obj) {
        sdk.log.info({ data: { 'obj': obj }, 'method': 'addItem', 'type': 'HistoryManager' });

        var objType = typeof (obj);

        if ((objType == "undefined") || (obj == null)) {
            sdk.log.info({ 'text': 'invalid termType param', data: { 'objType': objType, 'obj': obj }, 'method': 'addItem', 'type': 'HistoryManager' });
            return;
        }

        if ((objType != "string") && (objType != "object")) {
            sdk.log.info({ 'text': 'invalid typeof param', data: { 'objType': objType, 'obj': obj }, 'method': 'addItem', 'type': 'HistoryManager' });
            return;
        }

        var item = { 'term': '' };

        if (objType == "string") {
            item.term = obj;
        } else if (objType == "object") {
            if (typeof (obj.term) != "string") {
                sdk.log.info({ 'text': 'invalid termType object', data: { 'obj': obj }, 'method': 'addItem', 'type': 'HistoryManager' });
                return false;
            }
            item.term = obj.term;
        }

        if (item.term == '') {
            return false;
        }




        for (var i = 0; i < dataSet.items.length; i++) {
            if (dataSet.items[i].term.toLowerCase() == item.term.toLowerCase()) {
                sdk.log.info({ 'text': 'Item already exist', data: { 'item.term': item.term }, 'method': 'addItem', 'type': 'HistoryManager' });
                return true;
            }
        }


        if (dataSet.items.length < config.max_save_result) {
            dataSet.items.push(item);
        } else {
            // delete old term in stack for make place to new term
            dataSet.items.splice(0, 1);
            dataSet.items.push(item);
        }

        return true;
    }

    stateDisabled.update = function () {
        sdk.log.info({ 'method': 'update', 'type': 'HistoryManager' });
        return sdk.data.getDataset();
    }

    stateEnabled.update = function (term) {
        sdk.log.info({ data: { 'term': term }, 'method': 'update', 'type': 'HistoryManager' });
        addItem(term) && save();
    };

    stateEnabled.removeAll = function () {
        sdk.log.info({ 'method': 'removeAllEnable', 'type': 'HistoryManager' });
        dataSet = sdk.data.getDataset();
        save();

    }

    stateDisabled.removeAll = function () {
        sdk.log.info({ 'method': 'removeAllDisable', 'type': 'HistoryManager' });
        return false;
    }

    stateDisabled.remove = function () {
        sdk.log.info({ 'method': 'stateDisabled.remove', 'type': 'HistoryManager' });
        return false;
    }

    stateEnabled.remove = function (obj) {
        sdk.log.info({ data: { 'obj': obj }, 'method': 'remove', 'type': 'HistoryManager' });
        var objType = typeof (obj);
        if ((objType == "undefined") || (obj == null)) {
            sdk.log.info({ 'text': 'invalid termType param', data: { 'objType': objType, 'obj': obj }, 'method': 'remove', 'type': 'HistoryManager' });
            return;
        }

        if ((objType != "string") && (objType != "object")) {
            sdk.log.info({ 'text': 'invalid typeof param', data: { 'objType': objType, 'obj': obj }, 'method': 'remove', 'type': 'HistoryManager' });
            return;
        }

        var item = { 'term': '' };

        if (objType == "string") {
            item.term = obj;
        } else if (objType == "object") {
            if (typeof (obj.term) != "string") {
                sdk.log.info({ 'text': 'invalid termType object', data: { 'obj': obj }, 'method': 'remove', 'type': 'HistoryManager' });
                return false;
            }
            item.term = obj.term;
        }

        for (var i = 0; i < dataSet.items.length; i++) {
            if (dataSet.items[i].term == item.term) {
                dataSet.items.splice(i, 1)
                save();
            }
        }
        return true;
    }

    init({ 'enable': 'true' });

    return {
        "select": function (q) {
            return state.select(q);
        }, "update": function (term) {
            state.update(term);
        }, "remove": function (term) {
            state.remove(term);
        }, "removeAll": function () {
            state.removeAll();
        }, "setConfig": function (obj) {
            setConfig(obj);
        }
    }
}


/*function HistoryManagerUniTest(){
var historyMange=new HistoryManager({'load':retrieveStorageItem,'save':storeStorageItem});
historyMange.select(undefined);
historyMange.select(null);
historyMange.select('');
historyMange.select('da');
historyMange.select('davidson');
historyMange.select('#');
historyMange.select('%23');

historyMange.select({});
historyMange.select({term:undefined});
historyMange.select({term:''});
historyMange.select({term:'da:'});
historyMange.select({term:'davidson:'});
historyMange.select({term:'#'});
historyMange.select({term:'%23'});
historyMange.select({terma:undefined});
historyMange.update('');
historyMange.update(null);
historyMange.update(undefined);
historyMange.update("test123123");
historyMange.update({term:'test123123'});
historyMange.update("%%23");
historyMange.update({trem:"%%213"});
historyMange.update({term:"%%213"});




}
HistoryManagerUniTest();*/