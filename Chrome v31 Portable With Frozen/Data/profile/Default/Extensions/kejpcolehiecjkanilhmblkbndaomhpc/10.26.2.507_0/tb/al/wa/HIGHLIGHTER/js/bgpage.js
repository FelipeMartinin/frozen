var Higlighter = new function () {
    var usageHIGHLIGHTER_CLICK = "HIGHLIGHTER_CLICK",
        usageHIGHLIGHTER_UNHIGHLIGHT = "HIGHLIGHTER_UNHIGHLIGHT",
        usageHIGHLIGHTER_FIND_WORD = "HIGHLIGHTER_FIND_WORD",
        usageHIGHLIGHTER_DISABLE = "HIGHLIGHTER_DISABLE";

    var addListener = conduit.messaging.onRequest.addListener,
		executeScript = conduit.tabs.executeScript;
    var injectFunctionStr = script_to_inject.toString()+';;script_to_inject();';

	var injected = false,
		calls = {},
		randomColors = ['#DABFFF', '#DABFFF', '#68FF66', '#FF7CFC'],
		searchTerm = "";

    var Invoker = {
        execute: function (searchTerm, callback) {
            searchTerm= searchTerm.toLowerCase();
            var searchTermSplit = searchTerm.split(" ");

            conduit.tabs.getSelected(null, function (tabResult) {
                if (typeof (calls[tabResult.tabId]) === 'undefined') {
                    calls[tabResult.tabId] = {};
                }

                var tabTerms = null,
					pushData = null,
					codeToExecute = null,
                    sentClickUsage = false,
                    sentUnHighlightUsage = false;

                for (var termHighlight in searchTermSplit) {
                    if (typeof (calls[tabResult.tabId][searchTermSplit[termHighlight]]) === 'undefined') {
                        var randomColor = randomColors[Math.floor(Math.random() * randomColors.length)];
                        pushData = {
                            highlight: 'findAndReplace(\'' + searchTermSplit[termHighlight] + '\', \'<span class="hig_' + searchTermSplit[termHighlight] + '" style="background-color: ' + randomColor + '">' + searchTermSplit[termHighlight] + '</span>\');',
                            reverse: 'changeCssByClassName(\'hig_' + searchTermSplit[termHighlight] + '\',"backgroundColor", "transparent");',
                            state: false
                        };

                        calls[tabResult.tabId][searchTermSplit[termHighlight]] = pushData;
                    }

                    tabTerms = calls[tabResult.tabId];

                    if (searchTermSplit.length === 1) {
                        for (var term in tabTerms) {
                            if (term !== searchTerm) {
                                tabTerms[term].isClick = false;
                                executeScript(tabResult.tabId.toString(), { code: tabTerms[term].reverse }, callback);
                            } else if (term === searchTerm) {
                                if (tabTerms[term].isClick) {
                                    codeToExecute = tabTerms[term].reverse;
                                    tabTerms[term].isClick = false;
                                    sentUnHighlightUsage = true;
                                } else {
                                    codeToExecute = (tabTerms[term].reverseHighlight || tabTerms[term].highlight);
                                    tabTerms[term].isClick = true;
                                    sentClickUsage = true;
                                }
                                executeScript(tabResult.tabId.toString(), { code: codeToExecute }, callback);
                            }
                        }
                    } else {
                        if (!tabTerms[searchTermSplit[termHighlight]].state) {
                            sentClickUsage = true;
                            tabTerms[searchTermSplit[termHighlight]].isClick = true;
                            tabTerms[searchTermSplit[termHighlight]].state = true;
                            codeToExecute = tabTerms[searchTermSplit[termHighlight]].reverseHighlight || tabTerms[searchTermSplit[termHighlight]].highlight;

                            if (!tabTerms[searchTermSplit[termHighlight]].reverseHighlight) {
                                tabTerms[searchTermSplit[termHighlight]].reverseHighlight = 'changeCssByClassName(\'hig_' + searchTermSplit[termHighlight] + '\',"backgroundColor","' + randomColor + '");'
                            }

                            executeScript(tabResult.tabId.toString(), { code: codeToExecute }, callback);
                        } else {
                            sentUnHighlightUsage = true;

                            codeToExecute = tabTerms[searchTermSplit[termHighlight]].reverse;
                            tabTerms[searchTermSplit[termHighlight]].state = false;
                            executeScript(tabResult.tabId.toString(), { code: codeToExecute }, callback);
                        }
                    }

                }
                if (sentClickUsage) {
                    conduit.logging.usage.log(usageHIGHLIGHTER_CLICK);
                }
                if (sentUnHighlightUsage) {
                    conduit.logging.usage.log(usageHIGHLIGHTER_UNHIGHLIGHT);
                }

            });
        },
        updateSearchTerm: function (result, sender, callback) {
            searchTerm = result.toLowerCase();

            callback("1");
        },
        getCurrentHiglightsWords: function (result, sender, callback) {
            var filterTerms = {};
            var splitTerms = searchTerm.split(" ");

            $(splitTerms).each(function (i, v) {
                if (!filterTerms[v] && !v.match(/^\s$/)) {
                    filterTerms[v] = v;
                }
            });

            callback(JSON.stringify(filterTerms));
        },
        saveCurrentHighlightWords: function () {
        }
    };


    var init = function () {
        injectFunction();
        initEvents();
        invoker();
    };

    var invoker = function () {
        addListener('Highlighter.Invoker', function (result, sender, callback) {
            try {
                result = JSON.parse(result);
            }
            catch (e) {
                conduit.logging.logDebug('HIGHLIGHTER/bgpage.js/invoker - received wrong result: ' + result);
            }
            var parseData = result,
				currentMethod = null,
				params = null;

            if (!parseData.method || !parseData.params) {
                throw new TypeError('Params or Method is missing');
                return false;
            }

            if (typeof (Invoker[parseData.method]) === 'undefined') {
                throw new TypeError('No such Highlighter method');
                return false;
            }

            if (!result.params instanceof Array) {
                throw new TypeError('Method parameters must be Array');
                return false;
            }

            params = parseData.params;
            currentMethod = Invoker[parseData.method];

            params.push(sender);
            params.push(callback);

            currentMethod.apply(null, params);
        });
    };

    var injectFunction = function (callback) {
        executeScript(null, { code: injectFunctionStr }, callback);
    };

    var initEvents = function () {
        conduit.tabs.onNavigateComplete.addListener(function () {
            injectFunction();

            conduit.tabs.getSelected(null, function (result) {
                if (calls[result.tabId]) {
                    delete calls[result.tabId];
                }
            });
        });

        conduit.tabs.onDocumentComplete.addListener(function () {
            injectFunction();

            conduit.tabs.getSelected(null, function (result) {
                if (calls[result.tabId]) {
                    delete calls[result.tabId];
                }
            });
        });
    };

    init();
}
