var radioButton = {
    addStations: false,
    popupOpen: false,
    curVolume: 0,
    isDynamicMenuOpen: false,
    widths: {
        expand: 177,
        shrink: 64
    },
    view: {
        equalizer: {
            start: function () {
                $('#equalizerStopped').hide();
                $('#eq_connecting').hide();
                $('#equalizerPlaying').show();

            },
            stop: function () {
                $('#equalizerPlaying').hide();
                $('#eq_connecting').hide();
                var currState = $('#eq_error').css('display');
                if (currState == 'none') {
                    $('#equalizerStopped').show();
                }
            },
            loading: function () {
                $('#equalizerPlaying').hide();
                $('#equalizerStopped').hide();
                $('#eq_connecting').show();
            }
        },
        panel: {
            UIexpand: function () {
                $('#smallPanel').hide();
                $('#bigPanel').show();
                $('#canvas').width(radioButton.widths.expand);
                conduit.app.embedded.setEmbedded({
                    width: radioButton.widths.expand
                });
            },
            UIshrink: function () {
                $('#smallPanel').show();
                $('#bigPanel').hide();
                $('#volumeBarContainer').hide();
                $('#thePanel').show();
                $('#canvas').width(radioButton.widths.shrink);
                conduit.app.embedded.setEmbedded({
                    width: radioButton.widths.shrink
                });
            },
            expand: function () {
                conduit.messaging.postTopicMessage('embed_dim_state', 'expand');

            },
            shrink: function () {
                conduit.messaging.postTopicMessage('embed_dim_state', 'shrink');
            }
        },

        setVolumeGreenLine: function (vol) {
            radioButton.view.greenLine.width(vol * (4 / 5));
        }
    },

    preloadImages: function () {
        var preloadDiv = $('#preloader');
        if (BrowserDetect.browser != 'Firefox') {
            for (var i = radioResources.embImages.length - 1; i--; ) {
                preloadDiv.append(createImg(radioResources.prefix + 'embedded/' + radioResources.embImages[i]));
            }
        }
    },

    stateInit: function () {
        radioButton.view.greenLine = $('#greenLineContainer');
    },

    init: function () {
        conduit.messaging.onTopicMessage.addListener('embed_dim_state', function (data) {
            //alert('recived - '+data);
            if (data == 'expand') {
                radioButton.view.panel.UIexpand();
            } else {//shrinked
                radioButton.view.panel.UIshrink();
            }
        });
        radioButton.view.greenLine = $('#greenLineContainer');
        conduit.storage.app.keys.get("shrinkState", function (state) {
            if (state != "shrinked") {
                radioButton.view.panel.expand();
            }
            else {
                radioButton.view.panel.shrink();
            }
        }, function (e) { radioButton.view.panel.expand();
        });


        $('#canvas').delegate('#expand', 'mousedown', function (e) {
            if (isRightClick(e)) { return; }
            sendUsage('RADIO_UNSHRINK');
            conduit.storage.app.keys.set("shrinkState", 'expanded');
            radioButton.view.panel.expand();
        });

        $('#canvas').delegate('#shrink', 'mousedown', function (e) {
            if (isRightClick(e)) { return; }
            sendUsage('RADIO_SHRINK');
            conduit.storage.app.keys.set("shrinkState", 'shrinked');
            radioButton.view.panel.shrink();
        });

        $('#canvas').delegate('#launcher', 'mousedown', function (e) {
            if (isRightClick(e)) { return; }
            conduit.messaging.sendRequest('backgroundPage', 'radioAction', JSON.stringify({ data: "", method: "openPopup" }), emptyCB);
        });
        $('#canvas').delegate('#thePanel', 'mousedown', function (e) {
            if (isRightClick(e)) { return; }
            if (radioButton.isDynamicMenuOpen) { return; }
            openDynamicMenu();
        });

        conduit.storage.app.keys.get("state", getStateCB);
        conduit.messaging.onTopicMessage.addListener('emb_state', getStateCB);
        conduit.storage.app.keys.get('muteState', function (mute) {
            if (mute == "on") {
                $('#volumeBtn').addClass("mute");
            }
        });

        var func = (function () {
            return function (vol) {
                if (typeof (vol) === 'string') vol = parseInt(vol);
                if (!vol)
                    vol = 60;

                radioButton.curVolume = vol;
                radioButton.view.setVolumeGreenLine(vol);
                $(".volumeBar").slider({
                    orientation: "horizontal",
                    range: "min",
                    min: 0,
                    max: 100,
                    value: parseInt(vol),

                    slide: function (event, ui) {
                        //alert('ui.value = ' + ui.value);
                        radioButton.onSetVolume(ui.value, false);
                    },
                    stop: function (event, ui) {
                        $('#volumeBtn').removeClass('mute');
                        $('#volumeBarContainer').hide();
                        $('#thePanel').show();
                        radioButton.onSetVolume(ui.value, true);
                        sendUsage('RADIO_VOLUME', {
                            valume: ui.value,
                            volume: ui.value
                        });
                    }
                }).removeClass('ui-widgesetVolt ui-widget-content ui-corner-all');
            }
        })();
        conduit.storage.global.items.get('volume', function (data) { func(data); }, function (err) { func(''); });

        conduit.messaging.onTopicMessage.addListener('volume', function (data) {
            data = parseInt(data);
            $(".volumeBar").slider("value", data);
            radioButton.view.setVolumeGreenLine(data);
            $('#volumeBtn').removeClass("mute");
        });

        conduit.messaging.onRequest.addListener('InitComplete', function () {
            if (radioButton.addStations) {
                conduit.messaging.sendRequest('popup', 'openGeners', "", function () { });
                radioButton.addStations = false;
            }
        });


        conduit.storage.app.keys.get('isPlayDisplay', function (data) {
            if (data == "" || data == "true") {
                radioButton.setStopUI();
                $('#equalizerStopped').show();
            }
            else {
                radioButton.setPlayUI();
                $('#equalizerStopped').hide();
            }
        }, function (e) {
            radioButton.setStopUI();
            $('#equalizerStopped').show();
        });

        conduit.messaging.onTopicMessage.addListener('pressPlay', function (data) {
            radioButton.setPlayUI();
        });

        conduit.messaging.onTopicMessage.addListener('pressStop', function (data) {
            radioButton.setStopUI();
            radioButton.view.equalizer.stop();
        });

        conduit.messaging.onTopicMessage.addListener('mute_emb', function (data) {
            $('#volumeBtn').addClass("mute");
        });


        $('#canvas').delegate('#playBtn', 'mousedown', function (e) {
            if (isRightClick(e)) { return; }
            conduit.storage.app.keys.set('isPlayDisplay', 'false');
            conduit.messaging.sendRequest('backgroundPage', 'radioAction', JSON.stringify({ data: "", method: "pressPlay" }), emptyCB);
            radioButton.onPlay();
        });


        $('#canvas').delegate('#stopBtn', 'mousedown', function (e) {
            if (isRightClick(e)) { return; }
            conduit.storage.app.keys.set('isPlayDisplay', 'true');
            conduit.messaging.sendRequest('backgroundPage', 'radioAction', JSON.stringify({ data: "", method: "pressStop" }), emptyCB);
            radioButton.onStop();
        });
        $('#canvas').delegate('#volumeBtn', 'mousedown', radioButton.onVolumeClick)
    },
    showPannel: function () {
        $('#volumeBarContainer').hide();
        $('#thePanel').show();
    },
    onVolumeClick: function (e) {
        if (isRightClick(e)) { return; }
        var volCont = $('#volumeBarContainer');
        var first = (volCont.css('display') == "none");
        if (first && $('#volumeBtn').hasClass('mute')) {
            radioButton.unMuteMe();
        }
        var SafariWindows = ((BrowserDetect.browser == 'Safari') && (navigator.platform.toLowerCase().indexOf("win") != -1));
        if (first && (BrowserDetect.browser != 'Chrome' && !SafariWindows)) {
            volCont.show();
            $('#thePanel').hide();
        }
        else { //toggle mute/unmute
            radioButton.toggleMute();
        }
    },
    muteMe: function () {
        radioButton.onMute();
        $('#volumeBtn').addClass("mute");
        radioButton.showPannel();
    },
    unMuteMe: function () {
        App.retrieveKey('volume', function (volume) {
            if (volume) {
                radioButton.onSetVolume(parseInt(volume), true);

            }
            else
                radioButton.onSetVolume(45, true);
            $('#volumeBtn').removeClass("mute");
        });

    },
    toggleMute: function () {
        if ($('#volumeBtn').hasClass('mute'))
            radioButton.unMuteMe();
        else {
            $('#volumeBarContainer').show();
            $('#thePanel').hide();
            radioButton.muteMe();
        }
    },
    onStop: function () {
        radioButton.setStopUI();
        conduit.messaging.sendRequest('backgroundPage', 'radioAction', JSON.stringify({ data: "", method: "stop" }), emptyCB);
    },

    onPlay: function () {
        radioButton.setPlayUI();
        conduit.messaging.sendRequest('backgroundPage', 'radioAction', JSON.stringify({ data: "", method: "play" }), emptyCB);

    },

    setPlayUI: function () {
        $('#playBtn').hide();
        $('#stopBtn').show();
    },

    setStopUI: function () {
        $('#playBtn').show();
        $('#stopBtn').hide();
    },

    onSetVolume: function (val, force) {
        //also paint the green line
        radioButton.view.setVolumeGreenLine(val);
        if (force || Math.abs(radioButton.curVolume - val) > 15) {
            radioButton.curVolume = val;
            conduit.messaging.sendRequest('backgroundPage', 'radioAction', JSON.stringify({ data: val, method: "volume" }), emptyCB);
        }

    },
    onMute: function () {
        conduit.messaging.sendRequest('backgroundPage', 'radioAction', JSON.stringify({ data: "", method: "mute" }), emptyCB);
    }
}

function isRightClick(e) {
    var result = false;
    if (e.button === 2) {
        result = true;
    }
    return result;
}

function openDynamicMenu() {
    function prepareMenueData(local, predefines, favs, state) {
        function getMenuItem(item, playlistType) {
            item.playlistType = playlistType;
            return {
                appType: "MENU_ITEM",
                data: {
                    caption: item.description,
                    iconUrl: "",
                    data: {
                        command: {
                            data: item,
                            type: "WEBAPP_COMMAND"
                        },
                        type: "COMMAND"
                    }
                }
            }
        }
        if(typeof local =='string' && local.length>0){
            try{
                local = JSON.parse(local);
            }catch(e){
                local = [];
            }

        }
        if(!state || typeof state !='object'){
            try{
                state = JSON.parse(state);
            }catch(e){
                state = {};
            }

        }
        var mainMenu = [];
        var curr = state;
        curr.type = "Add Stations";
        var addStations = {
            appType: "MENU_ITEM",
            data: {
                caption: getStr('CTLP_STR_ID_RADIO_MENU_ADD_AND_EDIT'),
                iconUrl: "http://radio.webapps.conduitapps.com/embedded/plus-for-menu.png",
                data: {
                    command: {
                        data: curr,
                        type: "WEBAPP_COMMAND"
                    },
                    type: "COMMAND"
                }
            }
        }
        mainMenu.push(addStations);
        //obj.data.menu.data.items.push({appType : "SEPARATOR"});
        var localsArr = [];
        for (i = 0; i < local.length; i++) {
            localsArr.push(getMenuItem(local[i], "MAIN_MENU_LOCAL_STATIONS"));
        }
        if (localsArr.length > 0) {
            mainMenu.push({ appType: "MENU", data: { caption: getStr('SB_RADIO_LOCAL_STATIONS'), items: localsArr} });
        }


        var favsArr = [];
        for (i = 0; i < favs.length; i++) {
            favsArr.push(getMenuItem(favs[i], "MAIN_MENU_FAV_STATIONS"));
        }

        if (favsArr.length) {
            mainMenu.push({ appType: "MENU", data: { caption: getStr('SB_RADIO_FAVORITE'), items: favsArr} });
        }

        for (var i = 0; i < predefines.length; i++) {
            if (predefines[i].type != "PODCAST") {
                mainMenu.push(getMenuItem(predefines[i], "MAIN_MENU_PUBLISHER_STATIONS"));
            }
            else {
                var podCastArr = [];
                for (var j = 0; j < predefines[i].playlist.length; j++) {
                    podCastArr.push(getMenuItem(predefines[i].playlist[j], "MAIN_MENU_PUBLISHER_STATIONS"));
                }
                mainMenu.push({ appType: "MENU", data: { caption: predefines[i].title, items: podCastArr} });

            }
        }

        radioButton.isDynamicMenuOpen = true;
        return { data: { menu: { data: { items: mainMenu}}} };
    }

    App.retrieveKey('publisherStations', function (pubStations) {
        App.retrieveKey('localStations', function (localStations) {
            App.retrieveKey('favoriteStations', function (favStations) {
                conduit.storage.app.keys.get('state', function (state) {
                    try {
                        if (pubStations) {
                            pubStations = JSON.parse(pubStations);
                        }
                        if (localStations) {
                            localStations = JSON.parse(localStations);
                        }
                        if (favStations) {
                            favStations = JSON.parse(favStations);
                        }
                        if (state) {
                            state = JSON.parse(state);
                        }
                    }
                    catch (e) {
                        conduit.logging.logDebug('RADIO_PLAYER/embedded.js/openDynamicMenu - received wrong data');
                    }
                    var menu = prepareMenueData(localStations, pubStations, favStations, state);
                    openMenu(menu);
                }, function (e) {
                    var menu = prepareMenueData(localStations, pubStations, favStations, '');
                    openMenu(menu);
                });
            });
        });
    });
}

function openMenu(menu) {
    conduit.app.menu.open(menu, { position: { left: 23, top: -4 }, windowId: conduit.currentApp.windowId, viewId: conduit.currentApp.viewId }, function (menuId) {
        conduit.app.menu.onClose.addListener(menuId, function (result, sender, callback) {
            radioButton.isDynamicMenuOpen = false;
        });
        conduit.messaging.sendRequest("backgroundPage", "radioAction", JSON.stringify({ data: menuId, method: "onMenuOpen" }), function () { });
    });
}

function getStateCB(state, sender, cb) {
    if ((state == "true") || (state == "")) {
        radioButton.setStopUI();
        return;
    }
    var display = 'no state';
    if (typeof (state) === 'string') {
        try {
            state = JSON.parse(state);
        }
        catch (e) {
            radioButton.setStopUI();
            conduit.logging.logDebug('RADIO_PLAYER/embedded.js/getStateCB - received wrong state: ' + state);
            return;
        }
    }
    if (state) {
        switch (state.state) {
            case "playing":
                radioButton.setPlayUI();
                $('#eq_error').css('display', 'none');
                radioButton.unMuteMe();
                radioButton.view.equalizer.start();
                display = state.text;
                break;
            case "stopped":
                radioButton.setStopUI();
                var currState = $('#eq_error').css('display');
                if (!(currState == 'block')) {
                    var currState = $('#eq_error').css('display', 'none');
                }
                radioButton.view.equalizer.stop();
                display = state.text;
                break;
            case "connecting":
                $('#eq_error').css('display', 'none');
                radioButton.view.equalizer.loading();
                display = '';
                break;
            case "error":
                display = state.text;
                $('#eq_error').css('display', 'inline');
                $('#eq_error').attr('title', getStr('SB_RADIO_ERROR_TOOLTIP'));
                $('#equalizerStopped').css('display', 'none');
                conduit.storage.app.keys.set('isPlayDisplay', 'true');
                break;
            default:
                display = state.state;
                break;
        }
    }
    $('#currentState').text(display);
    $('#currentState').attr('title', state.description);
    conduit.storage.app.keys.get('muteState', function (mute) {
        if (mute == "on") {
            conduit.messaging.sendRequest('backgroundPage', 'radioAction', JSON.stringify({ data: "", method: "mute" }), emptyCB);
        }

    });
}
var config = {
    view: "embedded"
}

localizationInit(emptyCB, config);

window.onload = function () {
    radioButton.init();
}
