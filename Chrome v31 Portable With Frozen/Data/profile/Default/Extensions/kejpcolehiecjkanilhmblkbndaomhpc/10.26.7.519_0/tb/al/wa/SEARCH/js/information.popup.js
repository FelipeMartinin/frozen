sdk.log.setName('App/Search[{0}]'.format('suggest'));
(function () {
    // aliases
    var sendRequest = conduit.messaging.sendRequest;
    var sendTopic = conduit.messaging.postTopicMessage;
    var addTopicListener = conduit.messaging.onTopicMessage.addListener;
    var closePopup = conduit.app.popup.close;

    // variables
    var searchHistory = { items: [] };
    var searchSuggest = { items: []};
    var viewId = conduit.currentApp.viewId;
    var srcRemove = "resources/history--x-default.png";
    var srcRemoveHover = "resources/history--x-mouseover.png";
    var searchBoxValue = "";
    var ArrowNavigationIndex = 0;
    var showSuggest = true;
    var queryIndexInListItem = 0;



    //html objects
    var $body;
    var $historyWraper;
    var $mainContainer;
    var $history;
    var config={'data':{}};
    var layout =  new layoutManager();
    var isFF_3_6 = false;
    var displayLabel = false;
    var separator = false;
    var numberOfHistory = 0;
    var maxDisplayResult = 10;


    var informationPopup = new function () {
        function safe_tags(str) {
            return str.replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;') ;
        }

        var getHistoryUI = function(data){
            try{
                sdk.log.info({'method':'getHistoryUI','type':'global/informationPopup'});
                var ro = "";
                if(!data.items.length){
                    return ro;
                }

                numberOfHistory = 0;
                var threeDots = (isFF_3_6)?'<div class="float threeDots" style="display:none;" >...</div>':'';
                var clearDiv = '<div class="clear"></div>';
                var buffer=[];

                var captionPosition = data.view.label.direction;

                if(displayLabel == "true"){
                    if(captionPosition.toString() == '1'){
                        var item_html='<li id="historyTitle" class="header_left">' + data.view.label.text + '</li>';
                        buffer.push(item_html);
                    }else if (captionPosition.toString() == '2'){
                        var item_html='<li id="historyTitle" class="header_right">' + data.view.label.text + '</li>';
                        buffer.push(item_html);
                    }
                }

                for (var i=0;i<data.items.length;i++){
                    var item=data.items[i].term;

                    var suggestTerm;

                    if (data.query != item) {
                        var dataQueryLength = data.query.length;
                        var itemTermCut = item.substring(0,dataQueryLength);

                        if (data.query.toLowerCase() == itemTermCut.toLowerCase()) {
                            suggestTerm = data.query.toLowerCase() + '<b>' + item.substr(data.query.length, item.length).toLowerCase() + '</b>';
                        }
                        else {
                            suggestTerm = item;
                        }
                    }else{
                        suggestTerm = item;
                    }

                    //var caption='<div id="history_{0}" class="caption mx-history" text="{1}">{2}</div>'.format(i,encodeURIComponent(data.items[i].term), suggestTerm);
                    var caption='<div id="history_{0}" class="{1} caption mx-history" text="{2}">{3}</div>'.format(i,data.view.label.class,encodeURIComponent(data.items[i].term), suggestTerm);
                    var removeImg = '<img text="{0}" class="remove" src="resources/history--x-default.png"/>'.format(encodeURIComponent(data.items[i].term));
                    var item_html='<li class="item">{0}{1}{2}{3}</li>'.format(caption,threeDots,removeImg,clearDiv);
                    buffer.push(item_html);
                    numberOfHistory++;
                }

                if(displayLabel == "true"){
                    if(captionPosition.toString() == '3'){
                        var item_html='<li id="historyTitle" class="header_left">' + data.view.label.text + '</li>';
                        buffer.push(item_html);
                    }else if (captionPosition.toString() == '4'){
                        var item_html='<li id="historyTitle" class="header_right">' + data.view.label.text + '</li>';
                        buffer.push(item_html);
                    }
                }

                ro = buffer.join("");

                return ro;

            }catch(ex){
                sdk.log.warning({'ex':ex,'method':'getHistoryUI','type':'global/informationPopup'});
            }

        }

        var getSuggestUI = function (data) {
            try{
                sdk.log.info({data:{data:data},'method':'getSuggestUI','type':'global/informationPopup'});
                var ro = "";

                if(!data.items.length){
                    return ro;
                }

                var threeDots = (isFF_3_6)?'<div class="float threeDots" style="display:none;" >...</div>':'';
                var clearDiv = '<div class="clear"></div>';
                var buffer=[];

                var captionPosition = data.view.label.direction;

                if(displayLabel == "true"){
                    if(captionPosition.toString() == '1'){
                        var item_html='<li id="suggestTitle" class="header_left">' + data.view.label.text + '</li>';
                        buffer.push(item_html);
                    }else if (captionPosition.toString() == '2'){
                        var item_html='<li id="suggestTitle" class="header_right">' + data.view.label.text + '</li>';
                        buffer.push(item_html);
                    }
                }

                //data.items.push({'term':data.query});

                var suggestToDisplay = ((data.items.length + numberOfHistory) > maxDisplayResult)? (maxDisplayResult - numberOfHistory):data.items.length;

                for (var i=0;i<suggestToDisplay;i++){
                    // for (var i=0;i<data.items.length;i++){
                    var item=data.items[i].term;

                    var suggestTerm;

                    if (data.query != item) {
                        var dataQueryLength = data.query.length;
                        var itemTermCut = item.substring(0,dataQueryLength);

                        if (data.query.toLowerCase() == itemTermCut.toLowerCase()) {
                            suggestTerm = data.query.toLowerCase() + '<b>' + item.substr(data.query.length, item.length).toLowerCase() + '</b>';
                        }
                        else {
                            suggestTerm = item;
                        }
                    }else{
                        suggestTerm = item;
                    }

                    var caption='<div id="suggest_{0}" class="{1} caption" text="{2}">{3}</div>'.format(i,data.view.label.class,encodeURIComponent(data.items[i].term),suggestTerm);
                    var item_html='<li id="li_suggest_{0}" class="item">{1}{2}{3}</li>'.format(i,caption,threeDots,clearDiv);
                    buffer.push(item_html);
                }

                queryIndexInListItem = (data.items.length - 1);

                data.items.unshift();

                if(displayLabel == "true"){
                    if(captionPosition.toString() == '3'){
                        var item_html='<li id="suggestTitle" class="header_left">' + data.view.label.text + '</li>';
                        buffer.push(item_html);
                    }else if (captionPosition.toString() == '4'){
                        var item_html='<li id="suggestTitle" class="header_right">' + data.view.label.text + '</li>';
                        buffer.push(item_html);
                    }
                }

                ro = buffer.join("");

                return ro;

            }catch(ex){
                sdk.log.warning({'ex':ex,'method':'getSuggestUI','type':'global/informationPopup'});
            }
        };

        var toggleRemove = function (e) {
            sdk.log.info({'method':'toggleRemove','type':'global/informationPopup'});
            switch (e.type) {
                case "mouseenter":
                    $(".remove", this).show();
                    $("#content li").removeClass("checked");
                    $("#content li.item").addClass("hover");
                    break;
                case "mouseleave":
                    $(".remove", this).hide();
                    $("#content li").removeClass("checked");
                    $("#content li.item").removeClass("hover");
                    break;
            }
        };


        var itemClick = function (e) {
            sdk.log.info({'method':'itemClick','type':'global/informationPopup'});
            // Only perform click the user hadn't clicked 'remove'
            if ($(e.target).hasClass("remove") === false) {

                var itemCaption = $(e.currentTarget).find('.caption').attr("text");
                if(!itemCaption){
                    itemCaption = $(e.currentTarget).find('.captionHist').attr("text");
                }
                itemCaption = decodeURIComponent(itemCaption);

                var ishistory = $(e.currentTarget).find('.caption').hasClass("mx-history");

                // Notify everyone this item has been clicked
                var data = {
                    "term": itemCaption
                    ,"viewId": viewId
                    ,'engine':config.data.engineid
                    //,'source':'SEARCH_SOURCE_HISTORY'
                    ,'source':(!ishistory)?'SEARCH_SOURCE_SUGGEST':'SEARCH_SOURCE_HISTORY'
                };

                // data.source = (!ishistory)?'SEARCH_SOURCE_SUGGEST':'SEARCH_SOURCE_HISTORY';
                if(!ishistory){
                    data.suggestTerm = searchBoxValue;
                }

                sendCommand('infoItemSelected',JSON.stringify(data));
                // Close this popup
                closePopup();
            } else {
                itemRemove(e);
            }
        };

        var removeHover = function (e) {
            sdk.log.info({'method':'removeHover','type':'global/informationPopup'});

            switch (e.type) {
                case "mouseenter":
                    this.src = srcRemoveHover;
                    break;
                case "mouseleave":
                    this.src = srcRemove;
                    break;
            }
        };

        var disableClearHistory = function () {
            sdk.log.info({'method':'disableClearHistory','type':'global/informationPopup'});
            $("#clearHistory").css({ "color": "#949393" }).removeClass("enabled").addClass("disabled");
        };

        var itemRemove = function (e) {
            sdk.log.info({'method':'itemRemove','type':'global/informationPopup'});
            e.stopPropagation();

            var itemTerm = $(e.target).attr('text');
            itemTerm = decodeURIComponent(itemTerm);

            // Notify everyone this item has been removed
            var data = {
                "term":itemTerm
            };

            var cb = function () {
                init(true);
            };

            sendCommand('infoItemRemoved', data, {'callback':cb});
        };

        var initUiEvents = function () {
            sdk.log.info({'method':'initUiEvents','type':'global/informationPopup'});
            // Toggle remove div when hovering an item
            // Handle item clicks
            // Update display when clicking on remove item
            $("#content")
                .undelegate(".item", "mouseenter mouseleave", toggleRemove) // hover
                .undelegate(".item", "click", itemClick)
                .undelegate(".remove", "mouseenter mouseleave", removeHover) // hover
                .undelegate(".remove", "click", itemRemove);

            $("#content")
                .delegate(".item", "mouseenter mouseleave", toggleRemove) // hover
                .delegate(".item", "click", itemClick)
                .delegate(".remove", "mouseenter mouseleave", removeHover) // hover
                .delegate(".remove", "click", itemRemove);

            $("#clearHistory").click(clearHistory);
        };


        var setTextLayoutForFF3_6 = function(data) {
            sdk.log.info({ 'data': { 'data': data }, 'method': 'setTextLayoutForFF3_6', 'type': 'global/informationPopup' });

            ArrowNavigationIndex = -1;

            setTimeout(function() {
                var bodyWidth = $body.width();

                //Hide all remove items
                $(".removeWrapper").hide();

                $(".caption").each(function(i, v) {
                    var currentChild = $(this);
                    var cap_max_width = (bodyWidth - 33 > 0) ? bodyWidth - 33 : 0;

                    while (currentChild.width() > cap_max_width && currentChild.text()) {
                        currentChild.text(currentChild.text().substring(0, currentChild.text().length - 1));

                        if (data) {
                            var text = currentChild.text();
                            text = text.substring(0, data.length);
                            if (text == data) {
                                var newText = data + '<b>' + currentChild.text().substring(data.length) + '</b>';
                                currentChild.html(newText);
                            }
                        }
                        currentChild.next(".threeDots").css({
                            "display": "block"
                        });
                    }
                });
                // $("#suggest_" + (queryIndexInListItem)).remove();

                // $("#li_suggest_" + (queryIndexInListItem)).remove();

                layout.commit();
            }, 0);

            //$("#content li.item:eq(0)").addClass("checked");
        };

        var setTextLayout = function(data) {
            sdk.log.info({ 'data': { 'data': data }, 'method': 'setTextLayout', 'type': 'global/informationPopup' });
            ArrowNavigationIndex = -1;

            $('.caption').css('width', '88%');
            $('.caption').css('overflow', 'hidden');
            $('.caption').css('text-overflow', 'ellipsis');

            setTimeout(function() {

                //  $("#suggest_"+(queryIndexInListItem)).remove();

                //  $("#li_suggest_"+(queryIndexInListItem)).remove();

                layout.commit();
            }, 0);
            //$("#content li.item:eq(0)").addClass("checked");
        };



        var draw = function () {
            sdk.log.info({data:{'searchSuggest':searchSuggest}, 'method':'draw', 'type':'global/informationPopup'});
            layout.clear();
            layout.add((searchSuggest.position == 1)?getSuggestUI(searchSuggest):getHistoryUI(searchHistory),separator);
            layout.add((searchSuggest.position == 2)?getSuggestUI(searchSuggest):getHistoryUI(searchHistory),separator);
            layout.setClearHistory(searchHistory);
            (!isFF_3_6)?setTextLayout(searchSuggest.query):setTextLayoutForFF3_6(searchSuggest.query);
            initUiEvents();
            layout.commit();
        };

        var initHistory = function () {
            sdk.log.info({'method':'initHistory','type':'global/informationPopup'});
            var q={
                term:searchBoxValue
                ,source:'content-popup'
                ,needdata:true
                ,showSuggest: showSuggest

            }

            sendRequest("backgroundPage", "content-manager:content", q, function (result) {
                sdk.log.info({data:{'searchBoxValue':searchBoxValue,'result':result},'method':'initHistory/sendRequest[historyManager] callback','type':'global/informationPopup'});
                try {
                    result = JSON.parse(result);
                }
                catch (e) {
                    conduit.logging.logDebug('Search/information.popup.js/initHistory - received wrong result: ' + result);
                }

                if (!result.hasContent){ // if all search history removed - close popup
                    sdk.log.info({'text':'no history items and no suggest items close popup','method':'initHistory','type':'global/informationPopup'});
                    closePopup();
                    return;
                }

                var resultTypeof = typeof(result);
                if (resultTypeof == "undefined") {
                    sdk.log.info({'text':'invalid typeof result', data:{'resultTypeof':resultTypeof}, 'method':'initHistory', 'type':'global/informationPopup'});
                    return getEmptyDataset();
                }

                if (resultTypeof != "object") {
                    sdk.log.info({'text':'result is not an object', data:{'resultTypeof':resultTypeof}, 'method':'initHistory', 'type':'global/informationPopup'});
                    return getEmptyDataset();
                }


                if(result.hasOwnProperty('displayLabel')){
                    displayLabel = result.displayLabel;
                }

                if(result.hasOwnProperty('maxDisplayResult')){
                    maxDisplayResult = result.maxDisplayResult;
                }



                if(result.hasOwnProperty('separator')){
                    separator = result.separator;
                }


                if (result.hasOwnProperty('suggest')) {
                    searchSuggest = result.suggest;

                    if(!searchSuggest.hasOwnProperty('position')){
                        searchSuggest.position = 1;
                    }
                }

                if (result.hasOwnProperty('history')) {
                    searchHistory = result.history;
                    if(!searchHistory.hasOwnProperty('position')){
                        searchHistory.position = 2;
                    }
                }

                draw();
                if (config.style.active.backgroundColor != "#FFFFFF") {
                    $("li.item").css({ "color": (sdk.ui.util.idealTextColor(config.style.active.backgroundColor)) });
                }
            });
        };

        var clearHistory = function (e) {
            sdk.log.info({'method':'clearHistory','type':'global/informationPopup'});
            $historyWraper.height($history.height()).css({ "background-color": "white" });
            $history.hide();
            disableClearHistory();
            sendCommand('history-clear-all',JSON.stringify({term:searchBoxValue}));
            closePopup();
        };

        var initApiEvents = function () {
            sdk.log.info({'method':'initApiEvents','type':'global/informationPopup'});
            addTopicListener("clearHistory", function (result) {
                try {
                    result = JSON.parse(result);
                }
                catch (e) {
                    conduit.logging.logDebug('Search/information.popup.js/initApiEvents - received wrong result: ' + result);
                }
                if (result.status === true) {
                    closePopup();
                }
            });
        };

        var init = function (skipapievent) {
            sdk.log.info({'method':'init','type':'global/informationPopup'});
            layout = new layoutManager();

            getStr("CTLP_STR_ID_SEARCH_LIST_BOX_HISTORY_TITLE", function (data) {
                $("#clearHistory").html(data);
            });

            $body.css({ "background": config.style.active.backgroundColor });

            if (config.locale.languageAlignMode == "RTL") {
                $body.addClass("rtl");
                if (!$body.hasClass("rtl")) {//ie bug
                    $body.attr("class", "body rtl")
                }
            }
            initHistory();
            if(!skipapievent){
                initApiEvents();
            }
        };
        return {
            "init": init
        };
    };

    var initUiObjects = function () {
        $body = $(".body");
        $historyWraper = $("#contantWraper");
        $mainContainer = $("#mainContainer");
        $history = $("#content");
    };

    var onSearchValueResponse= function (data) {
        sdk.log.info({'data':{'data':data},'method':'onSearchValueResponse','type':'global/informationPopup'});
        searchBoxValue = data;
        if (searchBoxValue == "") {
            closePopup();
        }else {
            informationPopup.init();
        }
    };

    var onArrowClicked=function (keyInt) {
        sdk.log.info({'data':{'keyInt':keyInt},'method':'onArrowClicked','type':'global/informationPopup'});

        keyInt = parseInt(keyInt);
        if(!(keyInt==38 || keyInt==40)){
            return;
        }
        if(!$("#content li.item").length){
            return;
        }

        if (keyInt == 38) {// up
            ArrowNavigationIndex--;
        }
        if (keyInt == 40){ //down
            ArrowNavigationIndex++;
        }

        highlightResult('suggest');
    };


    var highlightResult =  function(resultType){
        sdk.log.info({'method':'highlightResult','type':'global/informationPopup'});

        var captionValue = "";
        $("#content li").removeClass("checked");
        $("#content li.item").removeClass("hover");

        if (ArrowNavigationIndex < 0){
            ArrowNavigationIndex=$("#content li.item").length-1;
        }

        if (ArrowNavigationIndex>=$("#content li.item").length){
            ArrowNavigationIndex=0;
        }

        $("#content li.item:eq(" + ArrowNavigationIndex + ")").addClass("checked");

        captionValue = $("#content li.item:eq(" + ArrowNavigationIndex + ") div").attr("text");

        var isHistory = $("#content li.item:eq(" + ArrowNavigationIndex + ") div").hasClass("mx-history");

        var data = {
            captionValue:decodeURIComponent(captionValue),
            suggest:searchSuggest.query,
            source:(!isHistory)?'SEARCH_SOURCE_SUGGEST':'SEARCH_SOURCE_HISTORY'
        };

        sendTopic("captionValueChanged", JSON.stringify(data));
        var obj = {};
        obj.logicalSender = 'updateLiveSearchTerm';
        obj.result = decodeURIComponent(captionValue) || "";
        sendRequest("backgroundPage", "actionFromEmbdded", JSON.stringify(obj), $.noop);
    }

    function mouseWheelHandler(delta) {
        sdk.log.info({'method':'mouseWheelHandler','type':'global/informationPopup'});
        if(!$("#content li.item").length){
            return;
        }

        if (delta < 0){
            ArrowNavigationIndex++;
        }
        else{
            ArrowNavigationIndex--;
        }

        highlightResult();
    }

    function onMouseWheel(event){
        var delta = 0;
        if (!event) event = window.event;
        if (event.wheelDelta) {
            delta = event.wheelDelta/120;
        } else if (event.detail) {
            delta = -event.detail/3;
        }
        if (delta)
            mouseWheelHandler(delta);
        if (event.preventDefault)
            event.preventDefault();
        event.returnValue = false;
    }

    $(document).ready(function () {
        sdk.log.info({'data':conduit.app.getData(), 'method':'$(document).ready()','type':'global'});
        var cdata=conduit.app.getData();
        config.style=cdata.user.style;
        config.locale=cdata.user.locale;
        config.platform=cdata.user.platform;
        config.data.engine=cdata.user.engine;
        config.data.engineid=cdata.user.engineid;
        var term=cdata.user.term;
        showSuggest =cdata.user.showSuggest;

        searchBoxValue=term;
        initUiObjects();

        addTopicListener("getSearchValueResponse", onSearchValueResponse);

        addTopicListener("ArrowClicked", onArrowClicked );

        isFF_3_6 = (conduit.currentApp.info.platform.browser.toLowerCase() == 'firefox') && (conduit.currentApp.info.platform.browserVersion.indexOf('3.6')>-1);

        var mousewheelevt=(/Firefox/i.test(navigator.userAgent))? "DOMMouseScroll" : "mousewheel"; //FF doesn't recognize mousewheel as of FF3.x

        if (document.attachEvent) //if IE (and Opera depending on user setting)
            document.attachEvent("on"+mousewheelevt, onMouseWheel);
        else if (document.addEventListener) //WC3 browsers
            document.addEventListener(mousewheelevt, onMouseWheel, false);

        //var kb_key= sdk.com.location.getQueryStringPart("a", "");
        //sdk.log.info({'text':'kbKey', 'data':kb_key, 'method':'$(document).ready()','type':'global'});
        informationPopup.init();
    });
})();