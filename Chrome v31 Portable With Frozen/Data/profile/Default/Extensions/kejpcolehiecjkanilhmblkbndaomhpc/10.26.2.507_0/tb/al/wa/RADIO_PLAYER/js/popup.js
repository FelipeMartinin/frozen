var LIST_OPENED = '';
var scrollPaneContainer, availableTags;
var MediaServiceUrl = 'http://mediaplayer.webapps.conduitapps.com';
var pageSize = 10;

function stateCB(data, sender, callback) {
    try {
        data = JSON.parse(data);
    }
    catch (e) {
        conduit.logging.logDebug('RADIO_PLAYER/popup.js/stateCB - received wrong data: ' + data);
        data={
            state: 'error'
        };
    }
    switch (data.state) {
        case "playing":
            radio.view.setRadioUIPlaying();
            break;
        case "stopped":
            radio.view.setRadioUIStopped();
            break;
        case "paused":
            radio.view.setRadioUIStopped();
            break;
        case "connecting":
            radio.view.onPlay();
            break;
        case "error":
            radio.view.setRadioUIError();
            break;
    }
}
radio = {
    curVolume: 0,
    view: {
        maxStationLength: 22,
        maxSearchStationLength_image: 30,
        maxSearchStationLength_noImage: 50,
        myGreenLine: null,
        connectingTimeOut: 0,
        init: function () {
            radio.view.myGreenLine = $('#greenLineContainer');
        },
        setVolumeGreenLine: function (vol) {
            if (radio.view.myGreenLine)
                radio.view.myGreenLine.width(parseInt(vol) + 1);
        },
        clearConnectionTimeOut: function () {
            if (radio.view.connectingTimeOut)
                clearInterval(radio.view.connectingTimeOut);
        },
        waitProgress: function () {
            var obj = $('.conThreeDots');
            var dots = obj.text();
            if (dots == '...') {
                obj.text('');
            } else {
                obj.text(dots + '.');
            }
        },

        onPlay: function () {
            radio.view.clearConnectionTimeOut();
            radio.view.connectingTimeOut = window.setInterval(radio.view.waitProgress, 700);
            $('#playBtn').hide();
            $('#pauseBtn').show().addClass('playerButtonDisabled');
            adjustText('SB_RADIO_CONNECTING', '#connectingText');
            $('.stationConnecting').show();
            $("#playingNow").hide();
            $('#eqPlaying').hide();
            $('#eqStopped').show();
        },

        hidePauseShowPlay: function () {
            $('#pauseBtn').hide();
            $('#playBtn').show();
        },


        setRadioUIPlaying: function () {
            radio.view.clearConnectionTimeOut();
            $('.stationConnecting').hide();
            $('#playBtn').hide();
            $('#pauseBtn').show().removeClass('playerButtonDisabled');
            $("#playingNow").show();
            $('#eqStopped').hide();
            $('#eqPlaying').show();
            conduit.storage.app.keys.set('isPlayDisplay', 'false');
        },


        setRadioUIStopped: function () {
            radio.view.hidePauseShowPlay();
            $("#playingNow").hide();
            //$('.stationConnecting').hide();
            $('#eqPlaying').hide();
            $('#eqStopped').show();
        },

        setRadioUIError: function () {
            radio.view.clearConnectionTimeOut();
            radio.view.setRadioUIStopped();
            adjustText('SB_RADIO_ERROR_TOOLTIP', '#connectingText');
        },

        /*                    
        enableFirstLaunchView         :         function() {
        $('#noClicker').show();
        $('#wellcomeScreen').show();
        },*/
        hideNoClicker: function () {
            $('#noClicker').hide();
        },
        fadeOutInfo: function () {
            //$('.stationLogo img').fadeOut();
            $('.topInfo').fadeOut();
            $('.stationInfo').fadeOut();
        },
        fadeInInfo: function () {
            //$('.stationLogo img').fadeIn();
            $('.topInfo').fadeIn();
            $('.stationInfo').fadeIn();
        },
        toggleFav: function (on, slow) {
            var favObj = adjustText(on ? 'SB_RADIO_REMOVE_FAVORITES' : 'SB_RADIO_ADD_FAVORITES', '.fav');
            if (on) {
                favObj.addClass('on');
            } else {
                favObj.removeClass('on');
            }
        },
        selectPlayStation: function (cGuide) {
            $('.playStation').removeClass('In').each(function () {
                if ($(this).attr('rel') == cGuide) {
                    $(this).addClass('In');
                }
            });
        },
        setVolume: function (value) {
            var newClass = "max";
            if (value == 0) {
                newClass = 'mute';
            } else if (value <= 30) {
                newClass = 'min';
            } else if (value <= 60) {
                newClass = 'mid';
            }
            radio.view.setVolumeGreenLine(value);
            $('#volIndicator').removeClass().addClass(newClass);
        },

        onBrowseShareBtn: function (button, obj, closeDim, OpenDim) {
            if (button.hasClass('opened')) {
                obj.stop().animate(closeDim, 500, function () {
                    obj.hide();
                });
                button.removeClass('opened');
            } else {
                obj.stop().show().animate(OpenDim, 500);
                button.addClass('opened');
            }
        },
        onShareBtn: function (button) {
            radio.view.onBrowseShareBtn(button, $('#sharePopUp'), {
                width: '0px'
            }, {
                width: '94px'
            });
        },
        onBrowseBtn: function (button) {
            radio.view.onBrowseShareBtn(button, $('#browsePopUp'), {
                height: '0px'
            }, {
                height: '140px'
                // all                                        
            });
            if (BrowserDetect.browser == 'Firefox') {
                $('#browsePopUp').css('bottom', 60 + 'px')
            }
        },
        createRadiotimeItem: function (itemJson) {
            var imageLine = '', maxLen = radio.view.maxSearchStationLength_noImage;
            if (itemJson.image) {
                imageLine = '<div class="searchStationLogo"><img src="' + itemJson.image + '" width="34px" height="24px" alt=""></div>';
                maxLen = radio.view.maxSearchStationLength_image;
            }
            var txt = shortenText(itemJson.text, maxLen)
            return $('<li class="someSearchItem" rel="' + itemJson.type + '">' + imageLine +
                '<div class="stationSearch">' +
                '<span class="stationSearchName">' + txt + '</span><br />' +
                '<span class="stationSearchLocation">' + itemJson.subtext + '</span>' +
                '</div>' +
                '<a rel="' + itemJson.guide_id + '" class="favStation" tltip="' + getStr("SB_RADIO_ADD_FAVORITES") + '" title="' + getStr("SB_RADIO_ADD_FAVORITES") + '"></a>' +
                '<a rel="' + itemJson.guide_id + '" class="playStation" tltip=' + getStr('SB_RADIO_TOOLTIPS_PLAY') + ' title=' + getStr('SB_RADIO_TOOLTIPS_PLAY') + '></a>' +
                '<a rel="' + itemJson.bitrate + '" class="stationBitrate" style="display:none;"></a>' +

                '</li><img class="stationListDivider" src="' + _externalImages + 'gadget/divider_station screen.png" />');
        },
        createConduitItem: function (itemJson) {
            var ret = '<li class="someSearchItem" rel="' + itemJson.type + '">';
            if (itemJson.image)
                ret += '<div class="searchStationLogo"><img src="' + itemJson.image + '" width="34px" height="24px" alt=""></div>';
            ret += '<div class="stationSearch">' +
            '<span class="stationSearchName" rel="' + itemJson.text + '">' + itemJson.description + '</span><br />';
            if (itemJson.stationRemarks)
                ret += '<span class="stationSearchLocation">' + itemJson.stationRemarks + '</span>';
            ret += '</div>' +
            '<a rel="' + itemJson.stationId + '" class="favStation" tltip="' + getStr("SB_RADIO_ADD_FAVORITES") + '" title="' + getStr("SB_RADIO_ADD_FAVORITES") + '"></a>' +
            '<a rel="' + itemJson.url + '" class="playStation" tltip=' + getStr('SB_RADIO_TOOLTIPS_PLAY') + ' title=' + getStr('SB_RADIO_TOOLTIPS_PLAY') + '></a>' +
            '</li><img class="stationListDivider" src="' + _externalImages + 'gadget/divider_station screen.png" />';
            return $(ret);
        },
        createPodCastList: function (container, playlist, favStArr, nowPlaying) {
            var sub_container = $('<div class="playlist" style="display:none"></div>');
            for (var x = 0; x < playlist.length; x++) {
                var station = playlist[x];
                var item = radio.view.createConduitItem(station);
                radio.view.markItem_inCurrentlyPlaying(item, station.stationId, nowPlaying);
                radio.view.markItem_inFavorites(item, station.stationId, favStArr);
                sub_container.append(item);
            }
            container.append(sub_container);
        },
        markItem_inCurrentlyPlaying: function (item, stationGuid, nowPlaying) {
            if (stationGuid == nowPlaying) {
                item.find('.playStation').addClass('In');
            }
        },
        markItem_inFavorites: function (item, stationGuid, favStArr) {

            if ($.inArray(stationGuid, favStArr) > -1) {
                item.find('.favStation').addClass('In');
                item.find('.favStation').attr('tltip', getStr("SB_RADIO_REMOVE_FAVORITES"));
                item.find('.favStation').attr('title', getStr("SB_RADIO_REMOVE_FAVORITES"));
            }
        },

        createStationListItem: function (station, favStArr, nowPlaying) {
            var item = '';
            var stationGuid = false;
            if (station.Provider == "media-data-service") {
                station.type = "STREAM";
                item = radio.view.createConduitItem(station);
                stationGuid = station.stationId.toString();
            }
            else {
                //local provider (old DB)
                switch (station.type) {
                    case "link":
                        item = $('<li class="linkLabel" rel="' + station.URL + '"><div class="arrowLink"></div><div class="label">' + station.text + '</div></li>');
                        break;
                    case "PODCAST":
                        item = $('<div class="podcast_container"><li class="linkLabel podcast"><div class="arrowLink"></div><div class="label">Podcast: ' + station.title + '</div></li></div>');
                        radio.view.createPodCastList(item, station.playlist, favStArr, nowPlaying);
                        break;
                    case "audio":
                        item = radio.view.createRadiotimeItem(station);
                        stationGuid = station.guide_id;
                        break;
                    case "STREAM":
                        item = radio.view.createConduitItem(station);
                        stationGuid = station.stationId;
                        break;
                    default:
                        station.type = "STREAM";
                        item = radio.view.createConduitItem(station);
                        stationGuid = station.stationId.toString()
                        break;
                }
            }
            if (stationGuid) {
                radio.view.markItem_inCurrentlyPlaying(item, stationGuid, nowPlaying);
                radio.view.markItem_inFavorites(item, stationGuid, favStArr);
            }
            return item;
        },
        createNoStationsLi: function () {
            return '<li class="nothing">' + getStr('SB_RADIO_NOTHING_FOUND') + '</li>';
        },

        setStationName: function (text) {

            $('#stationName').html(shortenText(text, radio.view.maxStationLength));
        },

        setShareLinks: function (stationName, stationURLPlain, originalStationName) {
            var stationURL = encodeURIComponent(stationURLPlain);
            conduit.platform.getInfo(function (data) {
                var toolBarName = data.toolbar.name;
                //start fix
                //clean downloadURL from junk roee ovadia 21.11.11

                //var downloadUrl = encodeURIComponent(data.toolbar.downloadUrl);// original
                var downloadUrl = data.toolbar.downloadUrl;
                if ((data.toolbar.downloadUrl.indexOf('/exe') > -1) || (data.toolbar.downloadUrl.indexOf('/xpi') > -1) || (data.toolbar.downloadUrl.indexOf('/crx') > -1)) {
                    downloadUrl = data.toolbar.downloadUrl.substring(0, data.toolbar.downloadUrl.length - 4);
                }
                downloadUrl = encodeURIComponent(downloadUrl);
                //end fix

                if (originalStationName == "" || originalStationName == 'undefined') {
                    var message = 'I知 listening to ' + stationName + ' right from my browser with ' + toolBarName + '.%0A%0AYou can listen to your favorite music, too!%0A%0AJust click ';
                    var Twittermessage = 'I知 listening to ' + stationName + ' with ' + toolBarName + '. You can listen too! Just click';
                }

                else {
                    var message = 'I知 listening to ' + originalStationName + ' right from my browser with ' + toolBarName + '.%0A%0AYou can listen to your favorite music, too!%0A%0AJust click ';
                    var Twittermessage = 'I知 listening to ' + originalStationName + ' with ' + toolBarName + '. You can listen too! Just click';
                }
                $('.shareFacebook').attr({
                    rel: message,
                    s_link: downloadUrl,
                    s_text: message
                });

                $('.email').attr('data-url', 'mailto:?body=' + message + downloadUrl + ".");
             //   $('.email').attr('target', "_blank");

                $('.twitter').attr({
                    rel: Twittermessage,
                    s_link: downloadUrl,
                    s_text: Twittermessage
                });
            });


        },
        uiUpdateConduitStation: function (station, bitrate) {
            var originalStationName = station.description;
            radio.view.setStationName(station.description);
            //$('.stationLogo img').attr('src','');
            radio.view.setShareLinks(station.description, station.url, originalStationName);
            radio.view.fadeInInfo();
        },
        uiUpdate: function (stationInfo, bitrate) {
            if (stationInfo) {
                if (!stationInfo.call_sign && stationInfo.title) {
                    stationInfo.call_sign = stationInfo.title;
                }
                //$('.stationLogo img').attr('src', stationInfo.logo).show();
                if (stationInfo.genre_name == 'null' || !stationInfo.genre_name) {
                    if (stationInfo.show_title) {
                        stationInfo.genre_name = stationInfo.show_title;
                    } else {
                        stationInfo.genre_name = '';
                    }
                }
                //radio.view.setStationName(stationInfo.call_sign + '<br />' + stationInfo.genre_name)                                        
                radio.view.setStationName(stationInfo.call_sign);
                if (stationInfo.has_song == 'true') {
                    $('.artistName').html(stationInfo.current_artist);
                    $('.songName').html(stationInfo.current_song);
                } else {
                    $('.artistName').html('');
                    $('.songName').html('');
                }

                var locInfo = '';
                if (bitrate && bitrate != 'undefinded')
                    locInfo = bitrate + '&nbsp;KBPS<br/>';
                if (stationInfo.location)
                    locInfo += stationInfo.location;
                $('.locationInfo').html(locInfo);

                radio.view.setShareLinks(stationInfo.call_sign, stationInfo.detail_url);

            }
            radio.view.fadeInInfo();
        },
        ajdustScrollPaneContainer: function () {
            scrollPaneContainer = $('.main.list').jScrollPane({
                verticalGutter: 10,
                verticalDragMinHeight: 22,
                verticalDragMaxHeight: 22
            });
        }
    },
    init: function () {
        conduit.messaging.onRequest.addListener('openGeners', function () {
            $('#genresStat').click();
        });

        conduit.messaging.onTopicMessage.addListener('updateStationName', function (data) {
            try {
                data = JSON.parse(data);
            }
            catch (e) {
                conduit.logging.logDebug('RADIO_PLAYER/popup.js/init - received wrong data: ' + data);
            }
            radio.view.setStationName(data.data.description);
        });


        conduit.messaging.onRequest.addListener('gadget_state', stateCB);
        radio.view.init();
    },
    play: function (station) {
        radio.view.onPlay();
        conduit.messaging.sendRequest('backgroundPage', "radioAction", JSON.stringify({ data: station, method: 'play' }), function (station) {
            //mainWindowInfoUpdate(JSON.parse(station));
        });
    },
    stop: function () {
        conduit.messaging.sendRequest('backgroundPage', "radioAction", JSON.stringify({ data: '', method: 'stop' }), emptyCB);
    },
    pause: function () {
        conduit.messaging.sendRequest('backgroundPage', 'radioAction', JSON.stringify({ data: '', method: 'stop' }), emptyCB);
    },
    setVolume: function (value, force) {
        radio.view.setVolume(value);
        if (force || Math.abs(radio.curVolume - value) > 15) {
            radio.curVolume = value;
            if(force){
                conduit.messaging.sendRequest('backgroundPage', 'radioAction', JSON.stringify({ data: value, method: 'volume' }), emptyCB);
            }
        }
    },
    getStationDescription: function (station, bitrate) {

        radio.view.fadeOutInfo();
        if (station.guide_id) {
            conduit.messaging.sendRequest('backgroundPage', 'loadJSON', "Describe.ashx?id=" + station.guide_id, function (data) {
                try {
                    data = JSON.parse(data);
                }
                catch (e) {
                    conduit.logging.logDebug('RADIO_PLAYER/popup.js/getStationDescription - received wrong data: ' + data);
                }
                var bodyP = data.body;
                radio.view.uiUpdate(bodyP[0], bitrate);
            });
        }
        else if (station.text) {
            radio.view.uiUpdateConduitStation(station, bitrate);
        }
        else {
            //alert("no valid description!");
        }
    },

    tltipBtns: ['#pauseBtn', '#prevBtn', '#browseBtn', '#playBtn', '#nextBtn'],
    tooltipTimeOut: false,

    toolTipsInit: function () {
        radio.attachTooltips();
        $(document).click(radio.onGeneralClick);
    },
    clearTooltipTO: function () {
        if (radio.tooltipTimeOut) {
            clearTimeout(radio.tooltipTimeOut);
        }
    },
    onMouseOutBtn: function () {
        radio.clearTooltipTO();
        $('#testTooltip').hide();
    },

    attachTooltips: function () {
        for (var i = 0; i < radio.tltipBtns.length; i++) {
            $(radio.tltipBtns[i]).mouseover(function () {
                radio.tooltipInit($(this), getStr($(this).attr("tltip")));
            }).mouseout(function () {
                radio.onMouseOutBtn();
            });
        }
    },

    tooltipActionCommon: function (element, text) {

        var elPos = element.offset();
        var testTT = $('#testTooltip');
        testTT.text(text);
        var tooltip = {
            top: 0,
            left: 0,
            height: 0,
            width: 0
        };
        tooltip.width = testTT.width();
        tooltip.height = testTT.height();
        tooltip.top = elPos.top - tooltip.height;
        tooltip.left = (elPos.left + element.width() / 2) - tooltip.width / 2;

        /*
        if (tooltip.top > 14){
        tooltip.top-=15;
        } */
        testTT.removeClass();
        if (tooltip.left - 5 < 0) {
            while (tooltip.left - 5 < 0) {
                tooltip.left++;
                testTT.addClass('left');
            }
        } else if (tooltip.left + tooltip.width < $('body').width()) {
            testTT.addClass('middle');
        } else if (tooltip.left + tooltip.width > $('body').width() - 5) {
            while (tooltip.left + tooltip.width > $('body').width() - 5) {
                tooltip.left--;
                testTT.addClass('right');
            }
        }
        if (tooltip.top < 0) {
            tooltip.top = elPos.top + element.height() + 15;
            testTT.addClass('top');
        } else {
            testTT.addClass('bottom');
        }



        if ($(element).hasClass('favStation')) {

            testTT.css({
                'left': '255px',
                'top': tooltip.top,
                'width': '120px'
            });
        }
        else {
            testTT.css({
                'left': tooltip.left,
                'top': tooltip.top,
                'width': 'auto'
            });
        }
    },

    tooltipInit: function (element, text, timeOut) {
        if (timeOut == null) {
            radio.clearTooltipTO();
        }
        radio.tooltipActionCommon(element, text);
        if (timeOut == null) {
            radio.tooltipTimeOut = setTimeout(function () {
                $('#testTooltip').show();
            }, 1000);
        } else {
            $('#testTooltip').show();
        }
    },


    onWellcomeExitClick: function () {
        $('#wellcomeScreen').fadeOut();
        $('#noClicker').fadeOut();
    },
    onGeneralClick: function (el) {
        function openHandler(text, func) {
            if ($('#' + text).hasClass('opened')) {
                if ($(el.target).attr('id') != text) {
                    func($('#' + text));
                }
            }
        }

        if (!$(el.target).hasClass('shareFacebook') || !$(el.target).hasClass('categoryRadio')) {
            openHandler('shareBtn', radio.view.onShareBtn);
            openHandler('browseBtn', radio.view.onBrowseBtn);
        }
    }
};



function init() {
    try {
        conduit.storage.app.keys.get('state', function (state) {
            try {
                state = JSON.parse(state);
            }
            catch (e) {
                radio.view.setRadioUIStopped();
                conduit.logging.logDebug('RADIO_PLAYER/popup.js/init - received wrong state: ' + state);

            }
            if (state.state == 'playing')
                radio.view.setRadioUIPlaying();
        });
    } catch (e) { /*alert(e);*/ }



    conduit.storage.app.keys.get('isPlayDisplay', function (data) {
        if (data == "true") {
            radio.view.setRadioUIStopped();
        }
        else {
            radio.view.setRadioUIPlaying();
        }
    }, function (e) { radio.view.setRadioUIPlaying(); });


    conduit.messaging.onTopicMessage.addListener('pressPlay', function (data) {
        radio.view.setRadioUIPlaying();
    });

    conduit.messaging.onTopicMessage.addListener('pressStop', function (data) {
        radio.view.setRadioUIStopped();
    });


    conduit.messaging.onTopicMessage.addListener('volume', function (data) {
        if (data) {
            data = parseInt(data);
            radio.setVolume(data);
            radio.view.setVolume(data);
            $(".volumeBar").slider("value", data);
        }

    });


    App.retrieveKey('volume', function (volume) {
        if (typeof (volume) === 'string') volume = parseInt(volume);
        if (volume == null || volume == 'undefined' || volume == '')
            volume = 60;
        radio.curVolume = volume;
        $(".volumeBar").slider({
            orientation: "horizontal",
            range: "min",
            min: 0,
            max: 100,
            value: volume,
            change: function (event, ui) {
                radio.setVolume(ui.value, false);
            },
            stop: function (event, ui) {
                radio.setVolume(ui.value, true);
                sendUsage('RADIO_VOLUME', {
                    valume: ui.value,
                    volume: ui.value
                });
            }
        }).removeClass('ui-widget ui-widget-content ui-corner-all');
        radio.view.setVolume(volume);
        if (isNaN(volume)) {
            volume = 0;
        }
        $(".volumeBar").slider("value", volume);
    });

    App.retrieveKey('autocomplete', function (availableTags) {
        if (!availableTags)
            availableTags = [];
        else {
            try {
                availableTags = JSON.parse(availableTags);
            }
            catch (e) {
                conduit.logging.logDebug('RADIO_PLAYER/popup.js/init - received wrong availableTags: ' + availableTags);
                availableTags = [];
            }
            for (var i = 0; i < availableTags.length; i++) {
                availableTags[i] = unescape(availableTags[i]);
            }
        }
    });

    App.retrieveKey('localStations', function (localStations) {
        if (!localStations) {
            $('#localStat').hide(); 
        }
    });

    radio.init();
    App.retrieveKey('nowPlaying', mainWindowInfoUpdate);
    /*
    App.retrieveKey('firstLaunch', function(res) {                                                            
    if (!res) {
    radio.view.enableFirstLaunchView();                    
    App.retrieveKey('currentList', function(res) {
    if (res) {                                                                                                                        
    mainWindowInfoUpdate(res[0]);                                        
    addToRecent(res[0]);
    }
    });
    }
    });		  */
}

function sortStationsResult(body) {
    var result = new Array();
    if (!body)
        return result;
    for (var i = 0; i < body.length; i++) {
        if (body[i].Provider == "media-data-service") {
            result.unshift(body[i]);
        }
        else {
            if (body[i].type == 'link') {
                result.push(body[i]);
            } else if (body[i].type == 'audio' || body[i].type == 'STREAM' || body[i].type == "PODCAST") {
                result.unshift(body[i]);
            } else if (body[i].children) {
                for (var j = 0; j < body[i].children.length; j++) {
                    if (body[i].children[j].type == 'link') {
                        result.push(body[i].children[j]);
                    } else if (body[i].children[j].type == 'audio') {
                        result.unshift(body[i].children[j]);
                    }
                }
            }
        }
    }
    return result;
}


function attachAddtionalTooltips() {
    var playBtns = $('.playStation');
    for (var i = 0; i < playBtns.length; i++) {
        $(playBtns[i]).mouseover(function () {
            radio.tooltipInit($(this), getStr($(this).attr("tltip")));
        }).mouseout(function () {
            radio.onMouseOutBtn();
        });

    }
    var favStation = $('.favStation');
    for (var i = 0; i < favStation.length; i++) {
        $(favStation[i]).mouseover(function () {
            radio.tooltipInit($(this), getStr($(this).attr("tltip")));
        }).mouseout(function () {
            radio.onMouseOutBtn();
        });

    }
    var favStationIn = $('.favStation.In');
    for (var i = 0; i < favStationIn.length; i++) {
        $(favStationIn[i]).mouseover(function () {
            radio.tooltipInit($(this), getStr($(this).attr("tltip")));
        }).mouseout(function () {
            radio.onMouseOutBtn();
        });

    }
}

function getStationsList(body, mainList, cb) {
    body = sortStationsResult(body);
    App.retrieveKey('favoriteStations', function (favStations) {
        try {
            favStations = JSON.parse(favStations);
        }
        catch (e) {
            conduit.logging.logDebug('RADIO_PLAYER/popup.js/getStationsList - received wrong favStations: ' + favStations);
            favStations = '';
        }
        var favStArr = [];
        if (favStations) {
            for (var i = 0; i < favStations.length; i++) {
                if (favStations[i]) {
                    var param = favStations[i].guide_id || favStations[i].stationId;
                    favStArr.push(param);
                }
            }
        }
        App.retrieveKey('nowPlaying', function (nowPlaying) {
            if (body) {
                for (var j = 0; j < body.length; j++) {
                    var item = radio.view.createStationListItem(body[j], favStArr, nowPlaying);
                    mainList.prepend(item);
                }

            }
            if (mainList.find('li').length == 0) {
                mainList.append(radio.view.createNoStationsLi());

            }
            radio.view.hideNoClicker();
            cb(mainList);
        });
    });
}

var curStations = [];

function getSearchResults(query, cb, pageNum, byCategory) {
    var encodedQuery = encodeURIComponent(query);
    var pageNumber = pageNum;
    if (!pageNumber || pageNum == 1) {
        unbindScroll();
        pageNumber = 1;
        curStations = [];
    }
    var url = MediaServiceUrl + '/search';
    if (byCategory) {
        url += '/category/?category=';
    }
    else {
        url += '/?q=';
    }
    url += encodedQuery + '&pagesize=' + pageSize + '&page=' + pageNumber;

    conduit.network.httpRequest({
        url: url
    }, function (xml) {
        var searchRet = JSON.parse(xml);
        var firstStationToShow = (curStations.length > 0) ? curStations.length - 1 : 0;
        if (searchRet.Stations) {
            var maxResultes = parseInt(searchRet.MaxResult);
            var resArr = searchRet.Stations; //10 next results
            if (maxResultes && maxResultes > curStations.length) {
                curStations = curStations.concat(resArr);
                for (var i = 0; i < resArr.length; i++) {
                    var c = resArr[i];
                    c.description = c.Search;
                    c.description = shortenText(c.description, radio.view.maxStationLength);
                    c.url = c.Link;
                    c.text = shortenText(c.Name, 10);
                    c.stationId = c.Id;
                }
            }
            else {
                unbindScroll();
            }
        }
        cb(resArr);

    });

    var getStationsFullList = function (body, mainList, cb) {
        body = sortStationsResult(body);
        App.retrieveKey('favoriteStations', function (favStations) {
            var favStArr = [];
            if (favStations) {
                for (var i = 0; i < favStations.length; i++) {
                    if (favStations[i]) {
                        var param = favStations[i].guide_id || favStations[i].stationId;
                        favStArr.push(param);
                    }
                }
            }
            App.retrieveKey('nowPlaying', function (nowPlaying) {
                if (body) {
                    for (var j = 0; j < body.length; j++) {
                        var item = radio.view.createStationListItem(body[j], favStArr, nowPlaying);
                        $('.jspPane').append(item);
                    }
                }
                if (mainList.find('li').length == 0) {
                    mainList.append(radio.view.createNoStationsLi());

                }
                radio.view.hideNoClicker();
                cb(mainList);
            });
        });
    }

    var nextPagesCallback = function (searchArr) {
        var listContainer = $("#itemsContainer");
        var mainList = $('.main.list');
        getStationsFullList(searchArr, mainList, function (htmlList) {
            listContainer.append(htmlList);
            $('#searchResults').fadeIn('slow', function () {
                radio.view.ajdustScrollPaneContainer();
            });
        });
    }

    $('#itemsContainer').scroll(function () {
        var pane = $('.jspScrollable');
        var api = pane.data('jsp');
        if (api) {
            if (api.getContentPositionY() == $('.jspPane').height() - $('#itemsContainer').height()) {
                api.scrollByY(-2);
                pageNumber++;
                getSearchResults(query, nextPagesCallback, pageNumber, byCategory);
            }
        }
    });
}

function getGenresSearchResults(query, cb) {
    getSearchResults(query, cb, 1, true);
}

function searchStations(query) {

    var query_short = query;
    if (query.length >= 36) {
        query_short = query.slice(0, 36) + '...';
    }
    breadCrumbsInit(getStr('CTLP_STR_ID_RADIO_SEARCH_DLG_TITLE') + ": " + query_short);

    getSearchResults(query, function (searchArr) {
        var listContainer = $("#itemsContainer");
        listContainer.children().remove();
        var mainList = $('<ul class="main list"></ul>');
        getStationsList(searchArr, mainList, function (htmlList) {
            listContainer.append(htmlList);
            $('#searchResults').fadeIn('slow', function () { radio.view.ajdustScrollPaneContainer(); });
            //attachAddtionalTooltips(); // did the tooltip with title insted
        });
    });
}

function getPredefinedStations() {
    breadCrumbsInit(getStr('SB_RADIO_PREDEFINED_STATIONS'));
    App.retrieveKey('publisherStations', function (ps) {
        var listContainer = $("#itemsContainer");
        listContainer.children().remove();
        var mainList = $('<ul class="main list"></ul>');
        try {
            ps = JSON.parse(ps);
        }
        catch (e) {
            conduit.logging.logDebug('RADIO_PLAYER/popup.js/getPredefinedStations - received wrong predefined stations: ' + ps);
            ps = '';
        }
        getStationsList(ps, mainList, function (containerHtml) {
            listContainer.append(containerHtml);
            $('#searchResults').fadeIn('slow', function () { radio.view.ajdustScrollPaneContainer(); });
        });
    });

}

function unbindScroll() {
    $('#itemsContainer').unbind("scroll");
}

function getLocalStations() {
    breadCrumbsInit(getStr('SB_RADIO_LOCAL_STATIONS'));
    App.retrieveKey('localStations', function (localStations) {
        var listContainer = $("#itemsContainer");
        listContainer.children().remove();
        var mainList = $('<ul class="main list"></ul>');
        try {
            localStations = JSON.parse(localStations);
        }
        catch (e) {
            conduit.logging.logDebug('RADIO_PLAYER/popup.js/getLocalStations - received wrong local stations: ' + localStations);
            localStations = '';
        }
        getStationsList(localStations, mainList, function (containerHtml) {
            listContainer.append(containerHtml);
            $('#searchResults').fadeIn('slow', function () { radio.view.ajdustScrollPaneContainer(); });
        });
    });
}

function breadCrumbsInit(query) {
    App.storeKey('currentStep', '0');
    var bread = $('<a class="breadCr first" rel="step_0"></a>'),
    path = [],
    currentItem = null;

    switch (query) {
        case 'Genres':
            {
                currentItem = {
                    name: query,
                    path: 'BrowseGenres'
                };
                bread.text(getStr('SB_RADIO_GENRES'));
                break;
            }
        case 'Local stations':
            {
                currentItem = {
                    name: query,
                    path: 'BrowseLocal'
                };
                bread.text(getStr('SB_RADIO_LOCAL_STATIONS'));
                break;
            }
        default:
            {
                currentItem = {
                    name: query,
                    path: 'Search'
                };
                bread.text(query);
                break;
            }
    }
    $('#searchQuery').html('');
    $('#searchQuery').append(bread);
    path.push(currentItem);
    App.storeKey('pathArray', path);
}

function getGenres() {
    breadCrumbsInit('Genres');
    var genList = ["50", "60", "70", "80", "90", "Adult", "Alternative", "Arabic", "Arts", "Blues", "Business", "Chansons", "Children", "Chillout", "Christian", "Classic", "Club",
                    "Comedy", "Community", "Country", "Culture", "Dance", "Disco", "Easy", "Electro", "Gospel", "Heavy Metal", "HipHop", "Hits", "House",
                    "Information", "Internet", "Jazz", "Jewish", "Latin", "Local", "Lounge", "Love", "Modern", "Nature", "News", "Nostalgia", "Oldies",
                    "Pop", "Portuguese", "Punk", "Rap", "Reggae", "RnB", "Rock", "Schlager", "Soul", "Spanish", "Sports", "Talk",
                    "Top 40", "Trance", "Urban", "Variety", "World"];
    var listContainer = $("#itemsContainer");
    listContainer.children().remove();
    var item, mainList = $('<ul class="main list"></ul>');
    for (var j = 0; j < genList.length; j++) {
        item = $('<li class="linkLabel" rel="' + genList[j] + '"><div class="arrowLink"></div><div class="label">' + getStr('SB_RADIO_' + genList[j].replace(/\s/g, "")) + '</div></li>');
        mainList.append(item);
    }
    listContainer.append(mainList);
    $('#searchResults').fadeIn('slow', function () { radio.view.ajdustScrollPaneContainer(); });
}


//Move to common
function secondsToHms(d) {
    d = Number(d);
    var h = Math.floor(d / 3600);
    var m = Math.floor(d % 3600 / 60);
    var s = Math.floor(d % 3600 % 60);
    return ((h > 0 ? h + ":" : "") + (m > 0 ? (h > 0 && m < 10 ? "0" : "") + m + ":" : "0:") + (s < 10 ? "0" : "") + s);
}



function mainWindowInfoUpdate(station) {
    if (typeof (station) === 'string') {
        try {
            station = JSON.parse(station);
        }
        catch (e) {
            conduit.logging.logDebug('RADIO_PLAYER/popup.js/mainWindowInfoUpdate - received wrong station: ' + station);
            station = '';
        }
    }
    var bitrate = '';
    App.retrieveKey('currentList', function (currentListArr) {
        if (currentListArr) {
            try {
                currentListArr = JSON.parse(currentListArr);
            }
            catch (e) {
                conduit.logging.logDebug('RADIO_PLAYER/popup.js/mainWindowInfoUpdate - received wrong currentListArr: ' + currentListArr);
                currentListArr = '';
            }
            App.retrieveKey('nowPlaying', function (nowPlaying) {
                try {
                    nowPlaying = JSON.parse(nowPlaying);
                }
                catch (e) {
                    conduit.logging.logDebug('RADIO_PLAYER/popup.js/mainWindowInfoUpdate - received wrong nowPlaying data: ' + nowPlaying);
                    nowPlaying = '';
                }
                var pos = getStationPos(currentListArr, nowPlaying);
                if (pos > -1) {
                    $('.fav').attr('rel', pos);
                    bitrate = currentListArr[pos].bitrate;
                }

                radio.getStationDescription(station, bitrate);

                App.retrieveKey('favoriteStations', function (favorite) {
                    if (favorite) {
                        try {
                            favorite = JSON.parse(favorite);
                        }
                        catch (e) {
                            conduit.logging.logDebug('RADIO_PLAYER/popup.js/mainWindowInfoUpdate - received wrong favorite: ' + favorite);
                            favorite = '';
                        }
                        var posInFav = getStationPos(favorite, nowPlaying);
                        radio.view.toggleFav(posInFav > -1, false);
                    }
                });
            });
        } else {
            radio.getStationDescription(station, bitrate);
        }
    });
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



function breadCrumbsClickEvent(step) {
    return;
    $('#noClicker').show();
    App.storeKey('currentStep', step);
    App.retrieveKey('pathArray', function (path) {
        if (path) {
            path = path.slice(0, step + 1);
            App.storeKey('pathArray', path);
            var currentClickedStep = path[step];
            switch (currentClickedStep.path) {
                case 'Search':
                    {
                        searchStations(currentClickedStep.name);
                        break;
                    }
                case 'BrowseGenres':
                    {
                        getGenres();
                        break;
                    }
                case 'BrowseLocal':
                    {
                        getLocalStations();
                        break;
                    }
                case 'browseTop':
                    {
                        getTopStations();
                        break;
                    }
                default:
                    {
                        conduit.messaging.sendRequest('backgroundPage', 'loadJSON', currentClickedStep.path, function (data) {
                            try {
                                data = JSON.parse(data);
                            }
                            catch (e) {
                                conduit.logging.logDebug('RADIO_PLAYER/popup.js/breadCrumbsClickEvent - received wrong data: ' + data);
                            }
                            var body = data.body;
                            $('#itemsContainer').html('');
                            var item = $('<li class="linkLabel" rel="' + currentClickedStep.path + '"><div class="arrowLink opened"></div><div class="label">' + currentClickedStep.name + '</div></li>');
                            var mainList = $('<ul class="main list"></ul>');
                            var subList = $('<ul class="sub list"></ul>');
                            getStationsList(body, subList, function (subListHtml) {
                                item.append(subListHtml);
                                mainList.append(item);
                                $('#itemsContainer').append(mainList);
                                radio.view.ajdustScrollPaneContainer();
                                handleBreadCrmbs(step, 'breadCr');
                            });
                        });
                    }
            }
        }
    });
}


function radioFBConnect() {
    var callback = 'login.html';
    //var ghtml = 'http://social.conduit.com/FacebookLogin.aspx?sendaccesstoken=true&source=toolbar_application&display=Popup&type=login&home=' + _defaultHost + callback + '&perms=toolbar_application';
    var ghtml = 'http://social.conduit.com/FacebookLogin.aspx?sendaccesstoken=true&source=toolbar_application&display=Popup&type=login&home=&perms=toolbar_application';
    conduit.tabs.create({
        url: ghtml
    });
}


function handleBreadCrmbs(step, str) {
    $('.threeDots').remove();
    $('#searchQuery').find('.breadCr').each(function () {
        if (parseInt($(this).attr('rel').slice(5)) > step) {
            $(this).remove();
        } else if (step > 0 && parseInt($(this).attr('rel').slice(5)) < step - 1 && parseInt($(this).attr('rel').slice(5)) > 0) {
            if (parseInt($(this).attr('rel').slice(5)) == step - 2) {
                $(this).after('<a class="threeDots' + (str ? ' ' + str : '') + '" rel="' + $(this).attr('rel') + '">...</a>');
            }
            $(this).hide();
        } else {
            $(this).show();
        }
    });
}

function onLinkLabel_RadioTimeCB(container, searchArr) {
    $("#itemsContainer").children().remove();
    App.retrieveKey('currentStep', function (step) {
        step = parseInt(step);
        var breadCr = $('<a class="breadCr" rel="step_' + (++step) + '"></a>');
        var breadText = container.find('.label').text();
        breadCr.text(breadText);
        $('#searchQuery').append(breadCr);
        while ($('#searchQuery').height() > 20) {
            if (breadText.indexOf('...') > -1) {
                breadText = breadText.slice(0, breadText.indexOf('...'));
            }
            breadText = breadText.slice(0, breadText.length - 1) + '...';
            breadCr.text(breadText);
            $('.breadCr:last').remove();
            $('#searchQuery').append(breadCr);
        }
        App.retrieveKey('pathArray', function (path) {
            try {
                path = JSON.parse(path);
            }
            catch (e) {
                conduit.logging.logDebug('RADIO_PLAYER/popup.js/onLinkLabel_RadioTimeCB - received wrong path: ' + path);
                path = '';
            }
            if (path) {
                if (!($.isArray(path))) {
                    var npath = [];
                    npath.push(path);
                    npath = path;
                }
            }
            else
                path = [];

            var currentItem = {
                name: container.find('.label').text(),
                path: container.attr('rel')
            };
            path.push(currentItem);
            App.storeKey('pathArray', path);
            var listContainer = $("#itemsContainer");
            listContainer.children().remove();
            var mainList = $('<ul class="main list"></ul>');
            getStationsList(searchArr, mainList, function (htmlList) {
                listContainer.append(htmlList);
                $('#searchResults').fadeIn('slow', function () { radio.view.ajdustScrollPaneContainer(); });
            });
        });
    });
}


function onFavClick() {
    var pos;
    App.retrieveKey('nowPlaying', function (nowPlaying) {
        try {
            nowPlaying = JSON.parse(nowPlaying);
        }
        catch (e) {
            conduit.logging.logDebug('RADIO_PLAYER/popup.js/onFavClick - received wrong nowPlaying data: ' + nowPlaying);
            nowPlaying = '';
        }
        App.retrieveKey('favoriteStations', function (favorite) {
            try {
                favorite = JSON.parse(favorite);
            }
            catch (e) {
                conduit.logging.logDebug('RADIO_PLAYER/popup.js/onFavClick - received wrong favorite: ' + favorite);
                favorite = '';
            }
            if (!favorite)
                favorite = [];

            pos = getStationPos(favorite, nowPlaying);
            radio.view.toggleFav(pos == -1, true);
            if (pos > -1) {
                favorite.splice(pos, 1);
            } else {
                favorite.unshift(nowPlaying);
            }
            App.storeKey('favoriteStations', favorite);
        });
    });
}


function selectNewStation(station) {
    var cGuide;
    if (station.guide_id)
        cGuide = station.guide_id;
    else
        cGuide = station.stationId;

    radio.play(station);
    radio.view.selectPlayStation(cGuide);
    App.storeKey('nowPlaying', station);
    mainWindowInfoUpdate(station);
}

function onNextPrevButton(nextPrev) {
    radio.view.hidePauseShowPlay();
    App.retrieveKey('currentList', function (currentListArr) {
        if (currentListArr) {
            try {
                currentListArr = JSON.parse(currentListArr);
            }
            catch (e) {
                conduit.logging.logDebug('RADIO_PLAYER/popup.js/onNextPrevButton - received wrong currentListArr: ' + currentListArr);
                currentListArr = '';
            }
            App.retrieveKey('nowPlaying', function (nowPlaying) {
                try {
                    nowPlaying = JSON.parse(nowPlaying);
                }
                catch (e) {
                    conduit.logging.logDebug('RADIO_PLAYER/popup.js/onNextPrevButton - received wrong nowPlaying data: ' + nowPlaying);
                    nowPlaying = '';
                }
                var newPos = null;
                var pos = getStationPos(currentListArr, nowPlaying);
                if (nextPrev == "Next") {
                    if (pos > -1 && pos + 1 < currentListArr.length)
                        newPos = pos + 1;
                }
                else if (pos > 0) {
                    newPos = pos - 1;
                }
                if (newPos === null || newPos < 0) {
                    radio.stop();
                } else {
                    selectNewStation(currentListArr[newPos]);
                }
            });
        }
    });
}



function createListItem(obj) {
    var listItem,
    itemType = obj.attr('rel'),
    searchName = obj.find('.stationSearchName').text(),
    playStation = obj.find('.playStation').attr('rel');
    if (itemType == "STREAM") {
        listItem = {
            type: itemType,
            description: searchName,
            text: obj.find('.stationSearchName').attr('rel'),
            url: playStation,
            stationId: obj.find('.favStation').attr('rel')

        };
    } else { //audio
        listItem = {
            type: itemType,
            text: searchName,
            bitrate: obj.find('.stationBitrate').attr('rel'),
            guide_id: playStation,
            //image: obj.find('.searchStationLogo img').attr('src'),
            subtext: obj.find('.stationSearchLocation').text()
        };
    }
    return listItem;
}

function onFavoriteClickedFromList() {
    if ($(this).hasClass('In'))
        $(this).attr('tltip', getStr('SB_RADIO_ADD_FAVORITES'));
    else
        $(this).attr('tltip', getStr('SB_RADIO_REMOVE_FAVORITES'));
    toggleClass($(this), 'In');
    var containerStation = $(this).parent();
    var nowPlaying = createListItem(containerStation);
    App.retrieveKey('favoriteStations', function (favorite) {
        if (favorite) {
            try {
                favorite = JSON.parse(favorite);
            }
            catch (e) {
                conduit.logging.logDebug('RADIO_PLAYER/popup.js/onFavoriteClickedFromList - received wrong favorite: ' + favorite);
                favorite = '';
            }
            var pos = getStationPos(favorite, nowPlaying);
            if (pos > -1) {
                favorite.splice(pos, 1);
            } else {
                favorite.unshift(nowPlaying);
            }
        } else {
            favorite = [];
            favorite.unshift(nowPlaying);
        }
        App.storeKey('favoriteStations', favorite);
        if (LIST_OPENED == 'Favorites') {
            containerStation.fadeOut(400, function () {
                containerStation.remove();
                if ($('.main.list').find('li').length == 0) {
                    var listContainer = $("#itemsContainer");
                    listContainer.children().remove();
                    var mainList = $('<ul class="main list"></ul>');
                    getStationsList(false, mainList, function (mainListHTML) {
                        listContainer.append(mainListHTML);
                        App.retrieveKey('nowPlaying', function (np) {
                            if (np) {
                                try {
                                    np = JSON.parse(np);
                                }
                                catch (e) {
                                    conduit.logging.logDebug('RADIO_PLAYER/popup.js/onFavoriteClickedFromList - received wrong nowPlaying data: ' + np);
                                    np = '';
                                }
                                mainWindowInfoUpdate(np);
                            }
                        });
                    });

                }
            });
        }
    });
}

function initControls() {

    var SafariWindows = ((BrowserDetect.browser == 'Safari') && (navigator.platform.toLowerCase().indexOf("win") != -1));
    if ((BrowserDetect.browser != 'Chrome' && !SafariWindows)) {
        $('#volumeBarContainer, #volIndicator').show();
    } else {
        $('#bottomPart').addClass('chrome');
    }
    $('.twitter').click(function () {
        var msg = encodeURIComponent($(this).attr('rel'));
        var link = $(this).attr('s_link');
        var url = 'http://twitter.com/share?text=' + msg + '&url=' + link;

        if (BrowserDetect.browser != 'Chrome') {  //IE and FF - open in new window (dialog)
            conduit.app.popup.open(url, { "dimensions": { "width": 650, "height": 400} });
            return;
        }

        conduit.tabs.create({  //Chrome can't open facebook in popup - so will open in new tab
            url: url
        });

        conduit.messaging.sendRequest('backgroundPage', "radioAction", JSON.stringify({ data: '', method: 'closePopup' }), emptyCB);
        //App.close();
    });

    $('.email').click(function () {
        var url = $(this).attr('data-url');
        window.open(url);
    });
    $('.shareFacebook').click(function () {
        var share_link = encodeURIComponent($(this).attr('s_link'));
        var share_text = encodeURIComponent($(this).attr('s_text'));
        var url = 'http://www.facebook.com/sharer.php?u=' + share_link + '&t=' + share_text;
        /*
        if (BrowserDetect.browser != 'Chrome') {  //IE and FF - open in new window (dialog)
        conduit.app.popup.open(url, { "dimensions": { "width": 650, "height": 400} });
        return;
        }
        */
        conduit.tabs.create({  //Facebook share login opens on full facebook page
            url: url
        });

    });

    $('.fav').click(onFavClick);
    $('#nextBtn').click(function () {
        onNextPrevButton('Next');
    });
    $('#prevBtn').click(function () {
        onNextPrevButton('Prev');
    });

    $('#searchInput').focus(function () {
        var _t = $(this);
        if (_t.hasClass('empty')) {
            _t.removeClass('empty').val('');
        } else {
            _t.select();
        }
    });

    $('#searchInput').blur(function () {
        var _t = $(this);
        if (_t.val() == '') {
            adjustValue('SB_RADIO_LISTEN_TO', '#searchInput');
            $(this).addClass('empty');
        }
    });


    $('#searchInput').keypress(function (evt) {
        if (evt.keyCode == 13) {
            //_gaq.push(['_trackEvent', 'Radio','Search', 'VK_RETURN']);
            $('#searchButton').click();
        }
    });
    /*
    if(!availableTags)
    availableTags = [];
    $('#searchInput').autocomplete({
    source: availableTags
    });*/
    $('.breadCr').live('click', function () {
        var step = parseInt($(this).attr('rel').slice(5));
        breadCrumbsClickEvent(step);
    });
    $('.linkLabel').live('mouseenter', function () {
        if (!$(this).find('.arrowLink').hasClass('opened')) {
            $(this).css('background-color', '#595959');
        }
    }).live('mouseleave', function () {
        $(this).css('background', 'none');
    });

    $('.arrowLink').live('click', function () {
        $(this).next().click();
    });



    $('.linkLabel .label').live('click', function () {

        var container = $(this).parent();
        var arrow = container.find('.arrowLink');
        if (container.hasClass('podcast')) {
            toggleClass(arrow, 'opened', function () {
                container.parent().find('.playlist').show();
                radio.view.ajdustScrollPaneContainer();
                scrollPaneContainer.data('jsp').scrollBy(0, 50);
            }, function () {
                container.parent().find('.playlist').hide();
                radio.view.ajdustScrollPaneContainer();
            });
        } else {
            var isOpened = container.find('.arrowLink').hasClass('opened');
            if (!isOpened) {
                $('#noClicker').show();
                var query = container.attr('rel');
                arrow.addClass('opened');
                /*
                getSearchResults(query, function(searchArr) {                
                var listContainer = $("#itemsContainer");
                listContainer.children().remove();
                var mainList = $('<ul class="main list"></ul>');
                getStationsList(searchArr, mainList,function(htmlList){
                listContainer.append(htmlList);
                $('#searchResults').fadeIn('slow');
                radio.view.ajdustScrollPaneContainer();                                        
                });
                });*/
                getGenresSearchResults(query, function (data) {
                    onLinkLabel_RadioTimeCB(container, data);
                });

            } else {
                App.retrieveKey('radio_Undefined_pathArray', function (brcr) {
                    breadCrumbsClickEvent(brcr.length - 2);
                })
            }
        }
    });



    $('.favStation').live('click', onFavoriteClickedFromList);



    $('.playStation').live('click', function () {
        //_gaq.push(['_trackEvent', 'Radio', 'PlayFromList', LIST_OPENED]);
        //var itemId = $(this).attr('rel');
        // $('.stationConnecting').html('');
        var currentList = [], listItem;
        $('.main.list').find('.someSearchItem').each(function () {
            listItem = createListItem($(this));
            currentList.push(listItem);
        });

        App.storeKey('currentList', currentList);
        var nowPlaying = createListItem($(this).parent());
        radio.play(nowPlaying);
        App.storeKey('nowPlaying', nowPlaying);
        mainWindowInfoUpdate(nowPlaying);
        $("#searchResults").hide();
    });

    $('.stationSearch').live('click', function () {
        $(this).parent().find('.playStation').click();
    });

    $('#recentStat').click(function () {
        //_gaq.push(['_trackEvent', 'Radio', 'ResentStations']);
        LIST_OPENED = 'Recent';
        breadCrumbsInit(getStr('SB_RADIO_RECENT'));
        App.retrieveKey('recentStations', function (body) {
            try {
                body = JSON.parse(body);
            }
            catch (e) {
                conduit.logging.logDebug('RADIO_PLAYER/popup.js/initControls - received wrong body: ' + body);
                body = '';
            }
            var listContainer = $("#itemsContainer");
            listContainer.children().remove();
            var mainList = $('<ul class="main list"></ul>');
            getStationsList(body, mainList, function (mainListHTML) {
                listContainer.append(mainListHTML);
                unbindScroll();
                $('#searchResults').fadeIn('slow', function () { radio.view.ajdustScrollPaneContainer(); });
            });
        });

    });
    $('#playBtn').click(function () {
        conduit.messaging.sendRequest('backgroundPage', 'radioAction', JSON.stringify({ data: "", method: 'pressPlay' }), emptyCB);
        radio.play('');
    });
    $('#pauseBtn').click(function () {
        conduit.storage.app.keys.set('isPlayDisplay', 'true');
        $('.stationConnecting').hide();
        conduit.messaging.sendRequest('backgroundPage', 'radioAction', JSON.stringify({ data: "", method: 'pressStop' }), emptyCB);
        radio.pause();
    });


    $('.conbutton').mouseout(function () {
        $(this).removeClass('pushed');
    }).mousedown(function () {
        if (!$(this).hasClass('playerButtonDisabled')) {
            $(this).addClass('pushed');
        }
    }).mouseup(function () {
        $(this).removeClass('pushed');
    });
    $('.localizationMenu').click(function () {
        if ($(this).hasClass('opened')) {
            $('#localisationPopUp').stop().animate(
            {
                height: '0px'
            }, 500, function () {
                $('#localisationPopUp').hide();
            }
            );
            $(this).removeClass('opened');
        } else {
            $('#localisationPopUp').stop().show().animate(
            {
                height: '227px'
            }, 500, function () {
            }
                );
            $(this).addClass('opened');
        }
    });


    $('#shareBtn').click(function () {
        radio.view.onShareBtn($(this));
    });

    $('#browseBtn').click(function () {
        radio.view.onBrowseBtn($(this));
    });

    $('#searchButton').click(function () {
        if ($('#searchInput').hasClass('empty'))
            return;
        //$('.ui-autocomplete').hide();
        LIST_OPENED = 'search';
        var query = $('#searchInput').val();
        if (!isEmpty(query)) {
            /*
            if (query.length > 3){                
            /*var autocomp = App.retrieveKey('autocomplete',function() {
            if (autocomp) {
            if ($.isArray(autocomp)){
            if ($.inArray(escape(query), autocomp) == -1){
            autocomp.push(escape(query));
            App.storeKey('autocomplete', autocomp);
            availableTags = autocomp;
            }
            } else {
            newArr = [];
            newArr.push(escape(query));
            App.storeKey('autocomplete', newArr);
            availableTags = newArr;
            }
            } else {
            newArr = [];
            newArr.push(escape(query));
            App.storeKey('autocomplete', newArr);
            availableTags = newArr;
            }
            for (var i = 0; i < availableTags.length; i++){
            availableTags[i] = unescape(availableTags[i]);
            }
                                                  
            $("#searchInput").autocomplete("destroy").autocomplete({
            source: availableTags
            });
                                                  
            });
                                        
            }*/
            searchStations(query);
            App.storeKey('lastSearch', query);
        }
    });

    $('#lastStat').click(function () {
        LIST_OPENED = 'LastSearch';
        App.retrieveKey('lastSearch', function (query) {
            if (query) {
                searchStations(query);
                //$('#browseBtn').click();
                App.storeKey('lastSearch', query);
            } else {
                //_gaq.push(['_trackEvent','APP_USAGE', 'LastSearch']);
                breadCrumbsInit(getStr('SB_RADIO_LAST_SEARCH'));
                var listContainer = $("#itemsContainer");
                listContainer.children().remove();
                var mainList = $('<ul class="main list"></ul>');
                getStationsList(0, mainList, function (mainListHTML) {
                    listContainer.append(mainListHTML);
                    unbindScroll();
                    $('#searchResults').fadeIn('slow');
                });
            }
        });

    });

    $('#favStat').click(function () {
        LIST_OPENED = 'Favorites';
        breadCrumbsInit(getStr('SB_RADIO_FAVORITE'));
        App.retrieveKey('favoriteStations', function (favStations) {
            try {
                favStations = JSON.parse(favStations);
            }
            catch (e) {
                conduit.logging.logDebug('RADIO_PLAYER/popup.js/initControls - received wrong favStations: ' + favStations);
                favStations = '';
            }
            if (favStations && favStations.length > 0) {
                var listContainer = $("#itemsContainer");
                listContainer.children().remove();
                var mainList = $('<ul class="main list"></ul>');
                getStationsList(favStations, mainList, function (mainListHTML) {
                    listContainer.append(mainListHTML);
                    radio.view.ajdustScrollPaneContainer();
                });
            } else {
                $("#itemsContainer").html('<span class="noResults">' + getStr('SB_RADIO_NO_FAVORITES') + '</span>');
            }
            unbindScroll();
            $('#searchResults').fadeIn('slow');
        });
    });

    $('#predefineds').click(function () {
        //        //_gaq.push(['_trackEvent', 'Radio','LocalStations']);
        LIST_OPENED = 'Local';
        unbindScroll();
        getPredefinedStations();
        $('#browseBtn').click();
    });

    $('#localStat').click(function () {
        //        //_gaq.push(['_trackEvent', 'Radio','LocalStations']);
        LIST_OPENED = 'Local';
        unbindScroll();
        getLocalStations();
        $('#browseBtn').click();
    });



    $('#genresStat').click(function () {
        //_gaq.push(['_trackEvent', 'Radio', 'Genres']);
        LIST_OPENED = 'Genres';
        unbindScroll();
        getGenres();
    });
    $('#backBtn').click(function () {
        var numOfbreads = $('#searchQuery').children().length;
        //only 1 or 2 breads posible
        if (numOfbreads == 2) {
            var breadCrFirst = $('.breadCr.first').text();
            if (breadCrFirst == getStr('SB_RADIO_GENRES')) {
                $('#genresStat').click();
            }
            else {
                $('#searchResults').fadeOut('slow');
            }
        }
        else {
            $('#searchResults').fadeOut('slow');
        }
    })

}


$(document).ready(function () {
    init();
    initControls();
    conduit.messaging.sendRequest('embedded', 'InitComplete', "", function () { })
});

var config = {
    view: "popup"
}

localizationInit(radio.toolTipsInit, config);



