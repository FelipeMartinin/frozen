(function () {

    var ip2location = 'http://ip2location.conduit-services.com/feature/EB_FEATURE_NAME',
        PRICE_GONG = 'price_gong',
        COUPON_BUDDY = 'coupon_buddy',
		bIsHandleResponse,
		bGeoResult,
		aObjectsQueue = [],
		bIsHttpReady = false,
		bIsWhiteListReady = false,
		aDependencies = ['whitelist', 'httpGeoLocation'],
		oWhiteList,
		sPriceGongVisibility = "none",
		sCouponBuddyVisibility = "none",
		sLastPageUrl,
        oVisibilityFlags = {
            'coupon_buddy': 'none',
            'price_gong': 'none'
        };

    // replace alias for geo location test.		
    ip2location = ip2location.replace(/EB_FEATURE_NAME/, "pricegong");

    /**
    @function 
    @description: 
    */
    function notifyReady(dependency) {
        for (var i = 0; i < aDependencies.length; i++) {
            if (aDependencies[i] === dependency) {
                aDependencies.splice(i, 1);
                break;
            }
        }
        // if no more dependencies, run all callbacks. 
        if (aDependencies.length === 0) {
            checkQueueAndRunAllCallbacks();
        }
    }

    /**
    @function
    @description: 
    */
    function handleRequest(appId, visibilityTest, newVisibility, method, bCallbackValue, callback) {
        if (oVisibilityFlags[appId] === visibilityTest) {
            oVisibilityFlags[appId] = newVisibility;
            conduit.advanced[method](appId);
        }
        callback(''+bCallbackValue);
    }

    /**
    @function
    @description: 
    */
    function getTabInfoAndReturnCallback(oObj) {

        // get current tab info on each request.
        conduit.tabs.getSelected(function (oData) {

            // reset flages for each request.
            var bIsCbInWhiteList = false,
				bIsPgInWhiteList = false,
                currentPageUrl,
                baseUrl,
                urlMatch;

            if (oData) {

                // this is the current page url.
                currentPageUrl = oData.url;

                // fetch the base url to compare against white list.
                urlMatch = currentPageUrl.match(/[^http:\/\/ | www\.][a-zA-Z0-9.]+.com/);
                if (urlMatch) {
                    baseUrl = urlMatch[0];
                }

                // check if base url exits in any white list, if so, update flag.
                if (baseUrl) {
                    // check coupon buddy.
                    if (oWhiteList.cb[baseUrl]) {
                        bIsCbInWhiteList = true;
                    }
                    // check price gong. 	
                    if (oWhiteList.pg[baseUrl]) {
                        bIsPgInWhiteList = true;
                    }
                }
            }

            // only if current url is found in whitelist.
            if (bIsCbInWhiteList || bIsPgInWhiteList) {

                if (oObj.sender === COUPON_BUDDY) {
                    if (bIsCbInWhiteList) {
                        enableApp(oObj);
                    }
                    else {
                        disableApp(oObj);
                    }
                }
                else if (oObj.sender === PRICE_GONG) {
                    if (bIsPgInWhiteList) {
                        enableApp(oObj);
                    }
                    else {
                        disableApp(oObj);
                    }
                }
            }
            else {
                // no white list. use geo location result.
                if (oObj.sender === COUPON_BUDDY) {
                    if (!bGeoResult) {
                        enableApp(oObj);
                    }
                    else {
                        disableApp(oObj);
                    }
                }
                else if (oObj.sender === PRICE_GONG) {
                    if (!bGeoResult) {
                        disableApp(oObj);
                    }
                    else {
                        enableApp(oObj);
                    }
                }
            }
        });
    }

    /**
    @function
    @description: 
    */
    function enableApp(o) {
        handleRequest(o.sender, 'none', 'block', 'showApp', true, o.callback);
    }

    function disableApp(o) {
        handleRequest(o.sender, 'block', 'none', 'hideApp', false, o.callback);
    }

    /**
    @function
    @description: 
    */
    function checkQueueAndRunAllCallbacks() {
        if (aObjectsQueue.length > 0) {
            for (var i = 0; i < aObjectsQueue.length; i++) {
                var oObj = aObjectsQueue[i];
                getTabInfoAndReturnCallback(oObj);
            }
            aObjectsQueue = [];
        }
    }

    /**
    @function
    @description: 
    */
    function addService() {

        var serviceData = {
            name: 'optimizer',
            url: 'http://localhost/domainsList.json',
            interval: 24 * 60 * 60 * 1000
        };

        function handleResponse(sData) {
            if (sData) {
                oWhiteList = JSON.parse(sData);
                bIsWhiteListReady = true;
                notifyReady('whitelist');
            }
        }

        function onSuccess() { }

        function onError() {
            // get default local white list.
            oWhiteList = JSON.parse(stab);
        }

        conduit.advanced.services.addService.addListener(serviceData, handleResponse, onSuccess, onError);
    }

    /**
    @function
    @description: 
    */
    function doGeoLocationTest() {
        conduit.network.httpRequest({ url: ip2location },
            // on success.
			function (sData) {
			    if (sData) {
			        var oData = JSON.parse(sData);
			        // geo location test result.
			        bGeoResult = oData.isFeatureEnabled;
			        // http geo location test is done, set flag to true.
			        bIsHttpReady = true;
			        notifyReady('httpGeoLocation');
			    }
			},
            // on error.	
			 function (textStatus) {

			 });
    }

    function init() {
        addService();
        doGeoLocationTest();

        // listen to webappApi front/back requests.	 
        conduit.advanced.messaging.onRequest.addListener('Optimizer', function (data, sender, callback) {
            // if we have the white list and the response from the geo location test we can continue. 
            if (bIsWhiteListReady && bIsHttpReady) {
                getTabInfoAndReturnCallback({ sender: data, callback: callback })
            }
            else {
                // we are not ready yet, so , push to queue. 
                // after all dependencies notify ready, we run the queue.
                aObjectsQueue.push({ sender: data, callback: callback });
            }
        });
    }

    init();

})();