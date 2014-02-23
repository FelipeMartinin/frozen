function ContentManager(config) {

    var histProvider;
    var suggestProvider;
    var config = config || {};

    config = {
        store: config.store,
        suggest: {
            enable: true,
            provider: 'Object',
            url: 'http://suggest.search.conduit.com/suggest.ashx?n=10&q=UCM_SEARCH_TERM&p=conduit&callback=acp_new&l=en',
            position: 2,
            amount: 10,
            view: {
                label: {
                    text: 'Suggestion',
                    direction: 'topLeft',
                    style: 'font-size:14px',
                    class: 'googleSuggest'
                }
            }
        },
        history: {
            enable: true,
            position: 1,
            amount: 10,
            view: {
                label: {
                    text: 'History',
                    direction: 'topLeft',
                    style: 'font-size:14px',
                    class: 'googleHistory'
                }
            }
        },
        additionalParams: {
            displayLabel: true,
            maxDisplayResult: true
        },
        dir: 'ltr',
        searchResultsUrl: 'http://search.conduit.com/Results.aspx?q=UCM_SEARCH_TERM&ctid=EB_CTID&octid=EB_ORIGINAL_CTID&SearchSource=1&Suggest=UCM_SUGGEST_TERM',
        SearchUrl: 'http://search.conduit.com/Results.aspx?q=UCM_SEARCH_TERM&ctid=EB_CTID&octid=EB_ORIGINAL_CTID&SearchSource=1',
        EmptySearchUrl: 'http://search.conduit.com/?ctid=EB_CTID&octid=EB_ORIGINAL_CTID&SearchSource=1'
    };

    var init = function () {
        sdk.log.info({ 'method': 'init', 'type': 'ContentManager' });

        if ((typeof (config.store) != 'object') || (config.store == null)) {
            sdk.log.info({ 'method': 'init', 'type': 'ContentManager' });
            config.store = {};
        }

        if (typeof (config.store.load) != 'function') {
            sdk.log.info({ 'method': 'init', 'type': 'ContentManager' });
            config.store.load = function () { };
        }
        if (typeof (config.store.save) != 'function') {
            sdk.log.info({ 'method': 'init', 'type': 'ContentManager' });
            config.store.save = function () { };
        }

        histProvider = new HistoryManager(config.store);
        suggestProvider = new SuggestProvider();
    }

    var setProviderConfig = function (obj) {

        sdk.log.info({ 'data': { 'obj': obj }, 'method': 'setProviderConfig', 'type': 'ContentManager' });

        if (typeof (obj) != "object" && obj == null) {
            sdk.log.info({ 'text': 'invalid configuration obj', data: { 'obj': obj }, 'method': 'setProviderConfig', 'type': 'ContentManager' });
            return;
        }

        if (typeof (obj.dir) == "string") {
            config.dir = obj.dir;
        }

        if (typeof (obj.searchResultsUrl) == "string") {
            config.searchResultsUrl = obj.searchResultsUrl;
        }

        if (typeof (obj.searchUrl) == "string") {
            config.searchUrl = obj.searchUrl;
        }

        if (typeof (obj.emptySearchUrl) == "string") {
            config.emptySearchUrl = obj.emptySearchUrl;
        }

        if (obj.hasOwnProperty('additionalParams')) {
            if (obj.additionalParams.hasOwnProperty('displayLabel')) {
                config.additionalParams.displayLabel = obj.additionalParams.displayLabel;
            }

            if (obj.additionalParams.hasOwnProperty('maxDisplayResult')) {
                config.additionalParams.maxDisplayResult = obj.additionalParams.maxDisplayResult;
            }
        }

        if (obj.hasOwnProperty("suggest")) {
            setConfig('suggest', obj.suggest);
            suggestProvider.setConfig(obj.suggest);

        }

        if (obj.hasOwnProperty("history")) {
            setConfig('history', obj.history);
            histProvider.setConfig(obj.history);
        }
    }

    var setConfig = function (type, obj) {
        sdk.log.info({ 'data': { 'type': type, 'obj': obj }, 'method': 'setConfig', 'type': 'ContentManager' });

        if (obj.hasOwnProperty('view')) {
            if (obj.view.hasOwnProperty('label')) {
                var labelObj = obj.view.label;
                if (typeof (labelObj) == "object") {

                    if (labelObj.hasOwnProperty('text')) {
                        if (typeof (labelObj.text) == "string") {
                            config[type].view.label.text = labelObj.text;
                        }
                    }

                    if (labelObj.hasOwnProperty('style')) {
                        if (typeof (labelObj.style) == "string") {
                            config[type].view.label.style = labelObj.style;
                        }
                    }

                    if (labelObj.hasOwnProperty('direction')) {
                        if (typeof (labelObj.direction) == "string") {
                            config[type].view.label.direction = labelObj.direction;
                        }
                    }

                    if (labelObj.hasOwnProperty('class')) {
                        if (typeof (labelObj.class) == "string") {
                            config[type].view.label.class = labelObj.class;
                        }
                    }
                }
            }
        }

        sdk.log.info({ 'data': { 'config': config }, 'method': 'setConfig', 'type': 'ContentManager' });
    }

    var getConfig = function () {
        return config || {};
    }

    var select = function (q, callback) {
        /* select from  dataSet upon 'q' filter and setting condition*/
        sdk.log.info({ data: { 'q': q }, 'method': 'select', 'type': 'ContentManager' });

        if (!callback) {
            sdk.log.warning({ 'text': 'missing second arguments callback', 'method': 'select', 'type': 'ContentManager' });
            return;
        }

        if ((typeof (q) != "string") && (typeof (q) != "object")) {
            return;
        }

        if (typeof (q) == "string") {
            q.term = q;
        } else if (typeof (q) == "object") {
            if (!q.hasOwnProperty('term')) {
                q.term = '';
            }
            if (!q.hasOwnProperty('needdata')) {
                q.needdata = true;
            }
            if (!q.hasOwnProperty('showSuggest')) {
                q.showSuggest = true;
            }
        }

        var rds = { 'hasContent': false };
        var historyDataSet = histProvider.select(q);

        rds.hasContent = historyDataSet.items.length > 0;

        rds.displayLabel = config.additionalParams.displayLabel;
        rds.maxDisplayResult = config.additionalParams.maxDisplayResult;

        if (q.needdata) {
            rds.history = historyDataSet;
            rds.history.query = q.term;
            rds.history.view = config.history.view;
        }

        if (q.term == '') {
            sdk.log.info({ data: { 'q.term': q.term, 'rds': rds }, 'method': 'select/suggestProvider/callback', 'type': 'ContentManager' });
            rds.suggest = sdk.data.getDataset();
            callback(rds);
        } else {
            if (q.showSuggest == false) {
                sdk.log.info({ data: { 'q.showSuggest': q.showSuggest, 'rds': rds }, 'method': 'select/suggestProvider/callback', 'type': 'ContentManager' });
                rds.suggest = sdk.data.getDataset();
                callback(rds);
            } else {
                suggestProvider.select(q, function (sds) {
                    rds.hasContent = rds.hasContent || sds.items.length > 0;
                    if (q.needdata) {
                        rds.suggest = sds;
                        rds.suggest.view = config.suggest.view;
                    }
                    sdk.log.info({ data: { 'rds': rds }, 'method': 'select/suggestProvider/callback', 'type': 'ContentManager' });
                    callback(rds);
                });
            }
        }
    }

    var removeAll = function () {
        sdk.log.info({ 'method': 'removeAllEnable', 'type': 'ContentManager' });
        histProvider.removeAll();
    }

    var remove = function (obj) {
        sdk.log.info({ data: { 'obj': obj }, 'method': 'removeItem', 'type': 'ContentManager' });
        histProvider.remove(obj);
    }

    var update = function (term) {
        sdk.log.info({ data: { 'term': term }, 'method': 'update', 'type': 'ContentManager' });
        histProvider.update(term);
    };

    init();

    return {
        "select": function (q, callback) {
            return select(q, callback);
        }, "update": function (term) {
            return update(term);
        }, "remove": function (term) {
            return remove(term);
        }, "removeAll": function () {
            return removeAll();
        }, "setProviderConfig": function (obj) {
            return setProviderConfig(obj);
        }, "getConfig": function () {
            return getConfig();
        }
    }
};