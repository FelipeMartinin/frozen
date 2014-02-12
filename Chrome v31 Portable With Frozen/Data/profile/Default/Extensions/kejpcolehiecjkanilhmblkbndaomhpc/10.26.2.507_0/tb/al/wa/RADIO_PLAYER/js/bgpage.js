
/* Background */

var radioButton = {
    addStations: false,
    chromePopupOpen: [],
    popupOpen: false,
    popupId: null
}
var MediaServiceUrl = 'http://mediaplayer.webapps.conduitapps.com';
var pageSize = 10;
var browser, browserVersion;

function _openGadget() {
    conduit.tabs.get(null, function (tabInfo) {
        var alreayOpen = (window.chrome) ? radioButton.chromePopupOpen[tabInfo.tabId] : radioButton.popupOpen;
        if (!alreayOpen) {
            conduit.app.popup.open('popup2.html', {
                width: 388,
                height: 331,
                showFrame: true,
                closeOnExternalClick: false,
                isShowMininmizedIcon: false
            }, function (data) {
                radioButton.popupId = data;
                conduit.app.popup.onClosed.addListener(data, function () {
                    conduit.tabs.get(null, function (tabInfo) {
                        if (window.chrome)
                            delete radioButton.chromePopupOpen[tabInfo.tabId];
                        else
                            radioButton.popupOpen = false;
                    });
                });
            });

            if (window.chrome)
                radioButton.chromePopupOpen[tabInfo.tabId] = true;
            else
                radioButton.popupOpen = true;

            return true;
        }
        else {
            conduit.app.popup.setFocus(radioButton.popupId);
            return false;
        }
    });
}

function getLocale() {
    if (navigator) {
        if (navigator.language) {
            return navigator.language;
        }
        else if (navigator.browserLanguage) {
            return navigator.browserLanguage;
        }
        else if (navigator.systemLanguage) {
            return navigator.systemLanguage;
        }
        else if (navigator.userLanguage) {
            return navigator.userLanguage;
        }
    }
    return "locale wan't found";
}

(function ($) {
    var radioBG = new function () {
        var playingTimeStart = null,
        currentList = [],
        pubStations = [],
        localStation = [],
        playing = {},
        maxPanelChar = 10,
        stateSaved = false,
        fake_guid = 1;


        function playerInit() {

            conduit.storage.app.keys.get('state', function (state) {
                try {
                    state = JSON.parse(state);
                }
                catch (e) {
                    conduit.logging.logDebug('RADIO_PLAYER/bgpage.js/playerInit - received wrong state: ' + state);
                    state = null;
                }
                if (state) {
                    setInitState(state.text, state.description, state.url);
                    stateSaved = true;
                }
            });

            player.init(function (state) {
                var storedState = {
                    state: state,
                    text: getNowPlayingText(),
                    description: getNowPlayingStationName(),
                    url: getNowPlayingUrl()
                };

                if (state == 'playing') {
                    App.retrieveKey('volume', getVolumeCB);
                }

                conduit.advanced.messaging.postTopicMessage("radioEvent", state);

                storedState = JSON.stringify(storedState);
                conduit.messaging.postTopicMessage('emb_state', storedState);
                conduit.messaging.sendRequest('popup', 'gadget_state', storedState, emptyCB);
                conduit.storage.app.keys.set('state', storedState);
            });

                        
            conduit.platform.getInfo(function (data) {
                browser = data.platform.browser;
                browserVersion = data.platform.browserVersion.split(".")[0] - 0;
            });

        }

        function init() {
            importSettings();
            playerInit();
            getStations();            
            attachListeners();
            loadBaseImages();
            //preloadImages();
        }

        function importSettings() {
            var convert = function (rso) {
                var list = rso.radioStation;
                if (!(list instanceof Array)) {
                    list = [list];
                }
                var stations = [];
                var text;
                for (var i = 0; i < list.length; i++) {
                    text = sliceUpText(list[i].stationName);
                    stations.push({
                        stationId: list[i].stationId,
                        url: list[i].stationUrl,
                        description: list[i].stationName,
                        text: text,
                        type: list[i].type
                    });
                }
                return stations;
            }
            var importStations = function (import_key, sb_key, data) {
                if (typeof data == 'object') { return; }
                if (typeof data != 'string' || !data) { return; }

                data = $.xml2json(data, false, xml2jsonOptions);
                var converted = convert(data);

                if (!(converted instanceof Array) || !converted.length) {
                    conduit.storage.global.items.remove(import_key);
                }

                App.retrieveKey(sb_key, function (data) {
                    var sb_list = [];
                    if (typeof data == 'string') {
                        try { sb_list = JSON.parse(data); }
                        catch (e) { conduit.logging.logDebug('RADIO_PLAYER/popup.js/importUserStations/ - received wrong recent: ' + sb_list); }
                    }

                    if (!(sb_list instanceof Array)) sb_list = [];

                    sb_list = sb_list.concat(converted);

                    var max_size = 10;
                    if (sb_list.length > max_size) sb_list.splice(max_size, sb_list.length - max_size);

                    conduit.storage.app.items.set(sb_key
                        , JSON.stringify(sb_list)
                        , function () {
                            conduit.storage.global.items.remove(import_key);
                        });
                });
            };

            var importRecentStations = function (data) {
                importStations('radio-import-recent-list', 'recentStations', data);
            };

            var importUserStations = function (data) {
                importStations('radio-import-user-stations', 'favoriteStations', data);
            };

            conduit.storage.global.items.get('radio-import-recent-list', importRecentStations);
            conduit.storage.global.items.get('radio-import-user-stations', importUserStations);



        }


        function getStations(){
        conduit.app.getSettingsData(function (radioSettings) {
                if (radioSettings && radioSettings.data) {
                    getPublisherStations(radioSettings.data);
                    getLocalStations(radioSettings);
                }                
            });
        }

        function getPublisherStations(radioSettingsData) {
            var stationsVersion = 0;            
            if (radioSettingsData.stationsVersion) {
                stationsVersion = radioSettingsData.stationsVersion;
            }

            conduit.platform.getInfo(function (data) {
                var url = 'http://radio.services.conduit.com/RadioRequest.ctp?type=user&ctid=' + data.toolbar.id + '&lut=0&iplut=0';
                if (stationsVersion) {
                    url += '&version=' + stationsVersion;
                }
                conduit.network.httpRequest({
                    url: url
                }, function (xml) {
                    var pubStations_notTranslated;
                    try {
                        var stationResponseObj = $.xml2json(xml, false, xml2jsonOptions);
                        pubStations_notTranslated = stationResponseObj.radioStations.radioStation;
                    } catch (e) {
                        pubStations_notTranslated = [];
                    }
                    translatePubStations(pubStations_notTranslated);
                    setPublisherStations();
                });
            });           
        };

        function getLocalStations(radioSettings) {
            
            if(radioSettings){
                if((radioSettings.data && radioSettings.data.enableIpStations === false) && 
                    radioSettings.isAlsoPublisherApp === true) { //if enableIpStations set to false and it's publisher app dont save the local stations
                    App.deleteKey('localStations');
                    return;
                }
            }


            conduit.platform.getLocation(function(location){                                 
                var url = MediaServiceUrl + '/search/local/' + location.countryCode + '/?city=&pagesize=' + pageSize + '&page=1';
                conduit.network.httpRequest(
                {
                    url: url
                }, function (xml) {
                    var localStations_notTranslated;
                    try {
                        var stationResponseObj = JSON.parse(xml);
                        localStations_notTranslated = stationResponseObj.Stations;
                    } catch (e) {
                        localStations_notTranslated = [];
                    }
                    setLocalStations(localStations_notTranslated);
                });
            });                      
        };




        function setInitState(txt, description, url) {
            var initState = {
                state: 'stopped',
                text: txt,
                description: description,
                url: url
            };
            initState = JSON.stringify(initState);
            conduit.storage.app.keys.set('state', initState);         //in case bg before embedded                                          
            conduit.messaging.postTopicMessage('emb_state', initState);


            conduit.storage.app.keys.set('isPlayDisplay', 'true');
            conduit.messaging.postTopicMessage('pressStop', initState);
        }



        function setPublisherStations() {
            App.storeKey('currentList', pubStations);
            App.storeKey('publisherStations', pubStations);

            if ((pubStations.length > 0) && (!stateSaved)) {
                var np = pubStations[0];
                playing.text = np.text;
                App.storeKey('nowPlaying', np);
                setInitState(playing.text, np.description, np.url);
            }
        }


        function sliceUpText(text) {
            return shortenText(text, maxPanelChar)
        }


        function setLocalStations(localStation_raw) {
            var text;
            for (var i = 0; i < localStation_raw.length; i++) {
                text = sliceUpText(localStation_raw[i].Name);
                localStation.push({
                    stationId: localStation_raw[i].Id.toString(),
                    url: localStation_raw[i].Link,
                    description: localStation_raw[i].Name,
                    text: text,
                    Provider: localStation_raw[i].Provider
                });
            }
            if ((pubStations.length == 0) && (!stateSaved)) {
                var np = localStation[0];
                playing.text = np.text;
                App.storeKey('nowPlaying', np);
                setInitState(playing.text, np.description, np.url);
            }
            App.storeKey('localStations', localStation);
        }

        function translatePubStations(pubStations_raw) {
            pubStations = [];
            var text;
            if (pubStations_raw && pubStations_raw.length) {
                for (var i = 0; i < pubStations_raw.length; i++) {
                    if (pubStations_raw[i].type == "XML_FEED") {
                        var url = pubStations_raw[i].stationUrl;
                        url = url.replace("mms://", "http://");
                        conduit.network.httpRequest({
                            url: url
                        }, function (xml) {
                            var curPodcastItems;
                            try {
                                var channel = $.xml2json(xml, false, xml2jsonOptions).channel
                                curPodcastItems = channel.item;
                            } catch (e) {
                                curPodcastItems = [];
                            }
                            var podCastStations = [];
                            for (var j = 0; j < curPodcastItems.length; j++) {
                                var c = curPodcastItems[j];
                                var guid = c.guid ? c.guid : fake_guid++;
                                text = sliceUpText(c.title);
                                podCastStations.push({
                                    url: c.enclosure.url,
                                    stationId: guid,
                                    description: c.title,
                                    text: text,
                                    image: c.image,
                                    type: "STREAM"
                                });
                            }
                            //add text, description & image
                            pubStations.push({
                                title: channel.title,
                                playlist: podCastStations,
                                type: "PODCAST"
                            });
                            App.storeKey('publisherStations', pubStations);
                        });
                    }
                    else {    //STREAM
                        text = sliceUpText(pubStations_raw[i].stationName);
                        pubStations.push({
                            stationId: pubStations_raw[i].stationId,
                            url: pubStations_raw[i].stationUrl,
                            description: pubStations_raw[i].stationName,
                            text: text,
                            type: pubStations_raw[i].type
                        });
                    }
                }
            }
            else {
                if (pubStations_raw) {
                    if (pubStations_raw.type == "XML_FEED") {
                        var url = pubStations_raw.stationUrl;
                        conduit.network.httpRequest({
                            url: url
                        }, function (xml) {
                            var curPodcastItems;
                            try {
                                var channel = $.xml2json(xml, false, xml2jsonOptions).channel
                                curPodcastItems = channel.item;
                            } catch (e) {
                                curPodcastItems = [];
                            }
                            var podCastStations = [];
                            for (var j = 0; j < curPodcastItems.length; j++) {
                                var c = curPodcastItems[j];
                                var guid = c.guid ? c.guid : fake_guid++;
                                text = sliceUpText(c.title);
                                podCastStations.push({
                                    url: c.enclosure.url,
                                    stationId: guid,
                                    description: c.title,
                                    text: text,
                                    image: c.image,
                                    type: "STREAM"
                                });
                            }
                            //add text, description & image
                            pubStations.push({
                                title: channel.title,
                                playlist: podCastStations,
                                type: "PODCAST"
                            });
                            App.storeKey('publisherStations', pubStations);
                        });
                    }
                    else {    //STREAM
                        text = sliceUpText(pubStations_raw.stationName);
                        pubStations.push({
                            stationId: pubStations_raw.stationId,
                            url: pubStations_raw.stationUrl,
                            description: pubStations_raw.stationName,
                            text: text,
                            type: pubStations_raw.type
                        });
                    }

                }


            }
        }

        function getStationPos(array, item) {
            if (!item)
                return -1;
            var cmpr_id, cmpr_str;
            if (item.guide_id) {
                cmpr_id = item.guide_id;
                cmpr_str = 'guide_id'
            } else {
                cmpr_id = item.stationId;
                cmpr_str = 'stationId'
            }

            for (var i = 0; i < array.length; i++) {
                var cur = array[i];
                if (cur && cur[cmpr_str] == cmpr_id) {
                    return i;
                }
            }

            return -1;         //not found
        }

        function addToRecent(nowPlaying) {
            if (!nowPlaying)
                return;

            App.retrieveKey('recentStations', function (recent) {
                try {
                    recent = JSON.parse(recent);
                }
                catch (e) {
                    conduit.logging.logDebug('RADIO_PLAYER/popup.js/addToRecent - received wrong recent: ' + recent);
                    recent = '';
                }
                if (!recent)
                    recent = [];
                var maxRecentSize = 10;
                if (recent.length > maxRecentSize)
                    recent.splice(maxRecentSize, recent.length - maxRecentSize);
               
                if (recent) {
                    var pos = getStationPos(recent, nowPlaying);
                    if (pos > -1) {
                        recent.splice(pos, 1);
                    }
                    recent.unshift(nowPlaying);
                } else {
                    recent = [nowPlaying];
                }
                App.storeKey('recentStations', recent);
            });
        }

        function handlePlay(data, sender, callback, clickSource) {
            var clickSrc = clickSource;
            if (!clickSrc)
                clickSrc = "RADIO_CLICK_SOURCE_BUTTON";
            var d = new Date();
            var curTime = d.getTime();
            if (playingTimeStart) {
                sendUsage('RADIO_STOP', {
                    durationMsec: curTime - playingTimeStart,
                    locale: getLocale()
                });
            }
            playingTimeStart = curTime;
            playing = null;
            if (data) {
                playing = data;
                playStation(playing, clickSrc);
                addToRecent(data);

                switch(data.playlistType){
                    case 'MAIN_MENU_LOCAL_STATIONS':
                        App.storeKey('currentList', localStation);
                        break;
                    case 'MAIN_MENU_PUBLISHER_STATIONS':
                        App.storeKey('currentList', pubStations);
                        break;
                    case 'MAIN_MENU_FAV_STATIONS':
                        App.retrieveKey('favoriteStations', function (favStations) {
                            if (favStations) {
                                favStations = JSON.parse(favStations);
                                App.storeKey('currentList', favStations);
                            }
                        })
                        break;
                }
            }
            if (!playing) {
                App.retrieveKey('nowPlaying', function (np) {
                    try {
                        np = JSON.parse(np);
                    }
                    catch (e) {
                        conduit.logging.logDebug('RADIO_PLAYER/bgpage.js/handlePlay - received wrong data: ' + np);
                        np = null;
                    }
                    if (np && np != 'undefined') {
                        playing = np;
                    }
                    else if (currentList.length != 0) {
                        playing = currentList[1];
                    }
                    playStation(playing, clickSrc);
                });
            }

        }
        function attachListeners() {
            var handler = function (data) {
                if (data.data.type == "Add Stations") {
                    var res = _openGadget();
                    radioButton.addStations = true;
                    if (!res) {
                        conduit.messaging.sendRequest('popup', 'openGeners', "", function () { });
                        radioButton.addStations = false;
                    }
                    //conduit.messaging.sendRequest('embedded', 'openGadget',"", function(){ });
                }
                else {
                    handlePlay(data.data, "", "", "RADIO_CLICK_SOURCE_MEDIA_LIST");
                    conduit.messaging.postTopicMessage('updateStationName', JSON.stringify(data), emptyCB);
                    conduit.storage.app.keys.set('isPlayDisplay', 'false');
                }
            };//f:handler

            var menuHandlers={};
            var radioMethods = {
                onMenuOpen: function (menuId, sender, callback) {
                    if(!menuHandlers[menuId]){// add listener only once per menu
                        menuHandlers[menuId]=handler;
                        conduit.app.menu.onCommand.addListener(menuId,menuHandlers[menuId]);
                    }

                    sendUsage('RADIO_OPEN_MENU');
                    callback && callback("");
                },

                play: handlePlay,

                stop: function (data, sender, callback) {
                    if (playingTimeStart) {
                        var d = new Date();
                        var curTime = d.getTime();
                        sendUsage('RADIO_STOP', {
                            durationMsec: curTime - playingTimeStart,
                            locale: getLocale()
                        });
                        playingTimeStart = null;
                    }
                    player.stop(function(sok){
                        callback && callback("");
                    });
                },

                pause: function (data, sender, callback) {
                    player.pause(function(sok){
                        callback && callback("");
                    });
                },

                volume: function (data, sender, callback) {
                    try {
                        player.setVolume(parseInt(data),function(){
                        });
                    } catch (e) {
                        conduit.logging.logDebug('RADIO_PLAYER/bgpage.js/volume - received wrong data: ' + data);
                        data = '';
                    }
                    App.storeKey('volume', data);
                    conduit.storage.app.keys.set('muteState', 'off');
                    conduit.messaging.postTopicMessage('volume', data.toString(), emptyCB);
                    callback && callback("");
                },

                pressPlay: function (data, sender, callback) {
                    conduit.storage.app.keys.set('isPlayDisplay', 'false');
                    conduit.messaging.postTopicMessage('pressPlay', data, emptyCB);
                    callback && callback("");
                },

                pressStop: function (data, sender, callback) {
                    conduit.storage.app.keys.set('isPlayDisplay', 'true');
                    conduit.messaging.postTopicMessage('pressStop', data, emptyCB);
                    callback && callback("");
                },

                mute: function (data, sender, callback) {
                    player.mute(function(sok){
                    conduit.storage.app.keys.set('muteState', 'on');
                    conduit.messaging.postTopicMessage('mute_emb', data, emptyCB);
                        callback && callback("");
                    });
                },
                openPopup: function (data, sender, callback) {
                    _openGadget();
                },
                closePopup:function (data, sender, callback) {
                    conduit.tabs.get(null, function (tabInfo) {
                        if (window.chrome)
                            delete radioButton.chromePopupOpen[tabInfo.tabId];
                        else
                            radioButton.popupOpen = false;
                    });
                    conduit.app.popup.close();
                }
            }
            conduit.messaging.onRequest.addListener("radioAction", function (data, sender, callback) {
                try {
                    data = JSON.parse(data);
                }
                catch (e) {
                    conduit.logging.logDebug('RADIO_PLAYER/bgpage.js/attachListeners - received wrong data: ' + data);
                }
                radioMethods[data.method](data.data, sender, callback)
            });


            conduit.windows.onRemoved.addListener(function(data){
                if(browser == "Firefox" && browserVersion == 3){
                    conduit.storage.app.keys.get('state', function (state) {
                        state = JSON.parse(state);
                        if(state.state == 'playing'){
                            handlePlay('');
                        }
                    });
                }
            });
        }

        function checkMediaSource(stationID) {
            var mediaSource = "";
            for (i = 0; i < pubStations.length; i++) {
                if (pubStations[0].stationId == stationID) {
                    mediaSource = "Publisher stations";
                    break;
                }
            }
            for (i = 0; i < localStation.length; i++) {
                if (localStation[0].stationId == stationID) {
                    mediaSource = "Local stations";
                    break;
                }
            }
            if (mediaSource == "")
                mediaSource = "User defined";

            return mediaSource;
        }

        function playStation(stationData, clickSrc) {
            var mediaSource = checkMediaSource(stationData.stationId);
            player.getVolume(function(sok){
                if(sok.status){
                    //TODO:add error handling
                    return;
                }
            sendUsage('RADIO_PLAY', {
                mediaSource: mediaSource,
                clickSource: clickSrc,
                stationId: playing.stationId,
                stationUrl: playing.url,
                stationName: playing.description,
                    volume: sok.result,
                locale: getLocale()
                });

            });
            App.storeKey('nowPlaying', stationData);

            stationData.url && player.play(stationData.url);

            if (stationData.description) {
                var data = {
                    data: {
                        description: stationData.description
                    }
                }
                conduit.messaging.postTopicMessage('updateStationName', JSON.stringify(data), emptyCB);
            }

        }
        function getNowPlayingText() {
            return (playing && playing.text ? playing.text : "not available");
        }

        function getNowPlayingStationName() {
            return (playing && playing.description ? playing.description : "not available");
        }

        function getNowPlayingUrl() {
            return (playing && playing.url ? playing.url : "not available");
        }

        //(performance fix) 
        //load to browser cache radio embededd basic images, 
        //insted of going out on function and bring all radion images.
        function loadBaseImages() {
            var preloadDiv = $('#preloader');
            preloadDiv.append(createImg('http://radio.webapps.conduitapps.com/embedded/Pause_rollover3.png'));
            preloadDiv.append(createImg('http://radio.webapps.conduitapps.com/embedded/play_rollover3.png'));
            preloadDiv.append(createImg('http://radio.webapps.conduitapps.com/embedded/Pause_rollover3.png'));

            preloadDiv.append(createImg('http://radio.webapps.conduitapps.com/embedded/maximize_closed_rollover3.png'));
            preloadDiv.append(createImg('http://radio.webapps.conduitapps.com/embedded/maximize_closed_normal3.png'));
            preloadDiv.append(createImg('http://radio.webapps.conduitapps.com/embedded/minimize_open_normal.png'));
            preloadDiv.append(createImg('http://radio.webapps.conduitapps.com/embedded/minimize_open_rollover.png'));
            preloadDiv.append(createImg('http://radio.webapps.conduitapps.com/embedded/open-app_closed_rollover3.png'));
            preloadDiv.append(createImg('http://radio.webapps.conduitapps.com/embedded/open-app_closed_normal3.png'));
            preloadDiv.append(createImg('http://radio.webapps.conduitapps.com/embedded/volume_rollover2.png'));
            preloadDiv.append(createImg('http://radio.webapps.conduitapps.com/embedded/volume_normal.png'));
            preloadDiv.append(createImg('http://radio.webapps.conduitapps.com/embedded/equalizer_stopped3.gif'));
            preloadDiv.append(createImg('http://radio.webapps.conduitapps.com/embedded/play_normal3.png'));
            preloadDiv.append(createImg('http://radio.webapps.conduitapps.com/embedded/bg-closed3.png'));
            preloadDiv.append(createImg('http://radio.webapps.conduitapps.com/embedded/bg_open4.png'));
            preloadDiv.append(createImg('http://radio.webapps.conduitapps.com/embedded/station-panel_arrow.png'));
            preloadDiv.append(createImg('http://radio.webapps.conduitapps.com/embedded/station-panel_left.png'));
            preloadDiv.append(createImg('http://radio.webapps.conduitapps.com/embedded/station-panel_middle.png'));
            preloadDiv.append(createImg('http://radio.webapps.conduitapps.com/embedded/station-panel_right.png'));
            preloadDiv.append(createImg('http://radio.webapps.conduitapps.com/embedded/station-panel_right.png'));
            preloadDiv.append(createImg('http://radio.webapps.conduitapps.com/gadget/divider_station screen.png'));

            preloadDiv.append(createImg('http://radio.webapps.conduitapps.com/embedded/ajax-loader2.gif'));
            preloadDiv.append(createImg('http://radio.webapps.conduitapps.com/embedded/equalizer_error2.gif'));
            preloadDiv.append(createImg('http://radio.webapps.conduitapps.com/embedded/equalizer_playing3.gif'));
            preloadDiv.append(createImg('http://radio.webapps.conduitapps.com/embedded/equalizer_stopped3.gif'));
            preloadDiv.append(createImg('http://radio.webapps.conduitapps.com/embedded/Pause_normal3.png'));

            setTimeout(function () {
                $('#preloader').remove();
            }, 10 * 1000);
        }

        /*   function createImg(url) {
        var myImage = new Image();
        myImage.src = url;
        }*/

        //currently not in use, this function repalced by loadBaseImages()
        function preloadImages() {
            var preloadDiv = $('#preloader');
            if (BrowserDetect.browser == 'Firefox') {
                for (var i = radioResources.embImages.length - 1; i--; ) {
                    preloadDiv.append(createImg(radioResources.prefix + 'embedded/' + radioResources.embImages[i]));
                }
            }

            if (BrowserDetect.browser == 'Chrome') {
                radioResources.gadgetImages.push('bottom-CHROME.png');
            } else {
                radioResources.gadgetImages.push('bottom-without-all.png');
            }

            for (i = radioResources.gadgetImages.length - 1; i--; ) {
                preloadDiv.append(createImg(radioResources.prefix + 'gadget/' + radioResources.gadgetImages[i]));
            }

            for (i = radioResources.station_menu.length - 1; i--; ) {
                preloadDiv.append(createImg(radioResources.prefix + 'gadget/Station menu/' + radioResources.station_menu[i]));
            }

        }

        return {
            init: init,
            getNowPlayingText: getNowPlayingText
        }
    } ();      //end of RadioBG component


    function getVolumeCB(volume) {
        volume && player.setVolume(parseInt(volume),function(sok){
        });
    }

    $(function () {
        radioBG.init();
    });

})(jQuery);

