(function(){
    var ext_name='ext/search-term'
	var isChrome = (navigator.userAgent.toLowerCase().indexOf('chrome') > -1);
    
    var checkForSiteTermInSearch = function (qValue){
        if(typeof qValue !='string' || !qValue){
            return '';
        }

        var searchWord = [];
        var res = qValue.indexOf("site:");

        if(res < 0){
            return qValue;
        }

        var resultArr = qValue.split(" ");
        for(var i=0; i<resultArr.length; i++){
            if(resultArr[i].indexOf("site:") == 0){
                continue;
            }
            searchWord.push(resultArr[i]);
        }

        return searchWord.join(" ");
    };


	function init() {
        sdk.log.info({'method':'init', 'type':ext_name});
        conduit.tabs.onNavigateComplete.addListener(
            function(updatedTab){
                sdk.log.info({'data':{'updatedTab':updatedTab},'method':'conduit.tabs.onNavigateComplete callback', 'type':ext_name});             
            }
        );

        conduit.tabs.onDocumentComplete.addListener(
            function(updatedTab,ismainframe, extData){
                sdk.log.info({'data':{'ismainframe':ismainframe,'updatedTab':updatedTab},'method':'conduit.tabs.onDocumentComplete callback', 'type':ext_name});
                if(ismainframe===false){
                    return;
                }

                var searchTerm = checkSearch(updatedTab.url);
                if(searchTerm) {
                    updateSearchBox(searchTerm);
                }
                else{
                    var redirectHistory = extData.redirectHistory;
                    for(var i=0; i < redirectHistory.length; i++){
                        var searchTerm = checkSearch(redirectHistory[i]);
                        if(searchTerm) {
                            updateSearchBox(searchTerm);
                        }
                    }
                }
                
                //Take only the domain
                var currentURL = updatedTab.url.match(/:\/\/(.[^/]+)/)[1];
                var alias = "";

                //Google, Bing, Ask, Babylon, delta-search or AOL
                if(currentURL && ((currentURL.indexOf("google.") != -1)||(currentURL.indexOf(".bing.") != -1) || (currentURL.indexOf(".ask.") != -1) || (currentURL.indexOf("search.babylon.") != -1)
                 || (currentURL.indexOf("www.delta-search.") != -1) ||  (currentURL.indexOf("search.aol.") != -1) || (currentURL.indexOf(".wikipedia.") != -1)))  {
                    alias = "q";
                }
                 //yahoo
                else if (currentURL.indexOf("search.yahoo.") != -1) {
                    alias = "p";                       
                }                        
                //Baidu 
                 else if (currentURL.indexOf("www.baidu.") != -1) {
                    alias = "wd";             
                }        
                //Yandex  
                 else if (currentURL.indexOf("yandex.") != -1) {
                    alias = "text";            
                }               
                //mywebsearch  
                 else if (currentURL.indexOf("search.mywebsearch.") != -1) {
                    alias = "searchfor";            
                } 
                 //wikipedia  
                 else if (currentURL.indexOf(".wikipedia.") != -1) {			           
                    alias = "search";			
                } 
                 //ebay   
                 else if (currentURL.indexOf("www.ebay.") != -1) {
                    alias = "_nkw";
                } 
                 //amazon  
                 else if (currentURL.indexOf("www.amazon.") != -1) {
                    alias = "field-keywords";                
                } 
                 //youtube  
                 else if (currentURL.indexOf("www.youtube.") != -1) {
                    alias = "search_query";            
                } 


                if(alias){
                    //Inject in anonymous scope to prevent override by more than one toolbar
                    var strScript = '(function(){' + searchListenerScript.toString() + ' searchListenerScript("' + alias + '"); })();';

					conduit.tabs.executeScript(updatedTab.tabId, { code: strScript }
                    );
                }
            }
        );

        conduit.tabs.onRequest.addListener('search/plugin[search-term]:onPageMessage', onPageMessage);
        conduit.tabs.onRequest.addListener('GoogleSearchFound', function(data){
            sdk.log.info({'data':{'data':data},'method':'conduit.tabs.onRequest[GoogleSearchFound] callback', 'type':ext_name});
            try {
                data = JSON.parse(data);
            }
            catch (e) {
                conduit.logging.logDebug('Search/searchListener.js/addListener for "GoogleSearchFound" - received wrong data: ' + data);
                data = "";
            }
            data.txt = checkForSiteTermInSearch(data.txt);
            if(data && data.txt) {
                updateSearchBox(data.txt);
            }
        });
    }

    function onPageMessage(data, callback){
        sdk.log.info({'data':data,'method':'onPageMessage', 'type':ext_name});
        try {
            data = JSON.parse(data);
        }
        catch (e) { }
        if (!data || typeof data !='object') {
            sdk.log.warning({'text':'invalid data object','method':'onPageMessage', 'type':ext_name});
            return;
        }
        if(data.name=='handshake'){
            sdk.log.info({'text':'search/plugin[search-term] injected to page','method':'onPageMessage', 'type':ext_name});
            return;
        }
    }

    function updateSearchBox(searchTerm) {
        sdk.log.info({'data':{'searchTerm':searchTerm},'method':'updateSearchBox', 'type':ext_name});
        searchTermLive = searchTerm;
        lastSearchTerm = searchTerm;

		var delay = 1;
		if(isChrome) delay = 500;
        setTimeout(function(){conduit.messaging.postTopicMessage('setEmbededTextBoxValue', searchTerm);}, delay);
        if( conduit.platform.search && conduit.platform.search.setSearchEngineValue){
            conduit.platform.search.setSearchEngineValue(searchTerm);
        }
    }
    
    function clearTerm(term) {
        sdk.log.info({'data':{'arguments':arguments},'method':'clearTerm', 'type':ext_name});
        if(typeof term !='string'){
            return '';
        }
        return decodeURIComponent((term+'').replace(/\+/g, '%20'));
    }

    function getTerm(alias, url){
        sdk.log.info({'text':'url','method':'checkSearch', 'type':ext_name});
        var regex = RegExp("[&|?]" + alias + "=(.*?)&|[&|?]" + alias + "=(.*?)$", "i");
        arr = regex.exec(url);        
        if (!arr || arr.length < 3) {
            return false;
        }
        var searchTerm = arr[1] || arr[2].replace(/\n/g, "");
        searchTerm = clearTerm(searchTerm);
        return searchTerm;
    }
    
    function checkSearch(url, bIsConduit) {
        sdk.log.info({'data':{'url':url,'bIsConduit':'bIsConduit'},'method':'checkSearch', 'type':ext_name});
        var searchTerm = '', arr;

        //conduit search
        if (url.indexOf("search.conduit.com") != -1) {
            sdk.log.info({'text':'it`s search.conduit.com','method':'checkSearch', 'type':ext_name});
            arr = url.match(/[&|?]q=(.*?)&|[&|?]q=(.*?)$/i);
            if (!arr || arr.length < 3) return false;
            searchTerm = arr[1] || arr[2].replace(/\n/g, "");
            searchTerm = clearTerm(searchTerm);
            
            searchTerm = checkForSiteTermInSearch(searchTerm);
        }
        //google
        else if(url .indexOf("google.") != -1) {

            sdk.log.info({'text':'google.com','method':'checkSearch', 'type':ext_name});
            if (url.indexOf("#") != -1) {
                var tempArr = url.split("#");
                url = tempArr[1];
            }
            arr = url.match(/[&|?]q=(.*?)&|[&|?]q=(.*?)$/i);
            if (!arr || arr.length < 3) {
                return false;
            }
            searchTerm = arr[1] || arr[2].replace(/\n/g, "");

            searchTerm = clearTerm(searchTerm);
        }
        //yahoo
        else if (url.indexOf("search.yahoo.") != -1) {
            searchTerm = getTerm("p", url);                       
        }
        //Bing, Ask, Babylon, delta-search or AOL
        else if ((url.indexOf(".bing.") != -1) || (url.indexOf(".ask.") != -1) || (url.indexOf("search.babylon.") != -1)
         || (url.indexOf("www.delta-search.") != -1) ||  (url.indexOf("search.aol.") != -1) ) {
             searchTerm = getTerm("q", url);               
        }
        
        //Baidu 
         else if (url.indexOf("www.baidu.") != -1) {
            searchTerm = getTerm("wd", url);             
        }
        
        //Yandex  
         else if (url.indexOf("yandex.") != -1) {
            searchTerm = getTerm("text",url);            
        }               

        //mywebsearch  
         else if (url.indexOf("search.mywebsearch.") != -1) {
            searchTerm = getTerm("searchfor",url);            
        } 

         //wikipedia  
         else if (url.indexOf(".wikipedia.") != -1) {			
            sdk.log.info({'text':'en.wikipedia.org','method':'checkSearch', 'type':ext_name});
            arr = url.match(/[&|?]search=(.*?)&|[&|?]search=(.*?)$/i);
			//alert(arr);
            if (!arr || arr.length < 3){
				arr = url.match(/[&|?]q=(.*?)&|[&|?]q=(.*?)$/i);
				if (!arr || arr.length < 3)
					return false;
			}
            searchTerm = arr[1] || arr[2].replace(/\n/g, "");
            searchTerm = clearTerm(searchTerm);
        } 

         //ebay   
         else if (url.indexOf("www.ebay.") != -1) {
            searchTerm = getTerm("_nkw",url);            
        } 

         //amazon  
         else if (url.indexOf("www.amazon.") != -1) {
            searchTerm = getTerm("field-keywords",url);                
        } 

         //youtube  
         else if (url.indexOf("www.youtube.") != -1) {
            searchTerm = getTerm("search_query",url);            
        } 
        
        sdk.log.info({'text':'search term ','data':{'searchTerm':searchTerm},'method':'checkSearch', 'type':ext_name});
        return searchTerm;
    }

    function searchListenerScript (alias){
        conduitPage.sendRequest('search/plugin[search-term]:onPageMessage', JSON.stringify({ 'name': "handshake" }), function () { });
        function clearTerm(term) {
            if(typeof term !='string'){
                return '';
            }
            return decodeURIComponent((term+'').replace(/\+/g, '%20'));
        }
        var currentHash = '!',
            currentHref = '!',
            lastTermSent = '';

        function hashCheck(){
            try{
             if ((window.location.hash != currentHash) || (window.location.href != currentHref)){
                var searchTerm = '',
                    arr,
                    url = window.location.href;

                if (url.indexOf("#") != -1) {
                    var tempArr = url.split("#");
                    url = tempArr[1];
                }
                else if (url.indexOf("?") != -1) {
                    var tempArr = url.split("?");
                    url = tempArr[1];
                }

                var term = {};				
                var tempUrl = url;
                tempUrl.split('&').forEach(function(i){term[i.split('=')[0]]=i.split('=')[1]}); 				
                
                if (term.hasOwnProperty(alias)) {
                    searchTerm = term[alias].replace(/\n/g, "");
                    searchTerm = searchTerm.replace("+", " ", "g");
                    searchTerm = clearTerm(searchTerm);
                }

                if(searchTerm && searchTerm !== lastTermSent) {
                    conduitPage.sendRequest('GoogleSearchFound', JSON.stringify({txt: searchTerm}), function () { });
                    lastTermSent = searchTerm;
                }

                 currentHash = window.location.hash;
                 currentHref = window.location.href;
            }
            }catch(ex) {	
            }


            setTimeout(hashCheck, 500);
        }

        //Start Listening
		hashCheck();
    }

    init();
}());