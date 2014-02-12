var alignMode;
var myKeys = {};
var langPack = {},
trans_callback = '',
dictionary = [ //of synchronise translated 
//"SB_RADIO_ERROR",
"SB_RADIO_PREDEFINED_STATIONS",
"SB_RADIO_LOCAL_STATIONS",
"SB_RADIO_FAVORITE",
"SB_RADIO_LAST_SEARCH",
"SB_RADIO_RECENT",
"SB_RADIO_GENRES",
//"SB_RADIO_MOST_POPULAR",
"SB_RADIO_NOTHING_FOUND",
"SB_RADIO_NO_FAVORITES",
"SB_RADIO_TOOLTIPS_NEXT_STATION",
"SB_RADIO_TOOLTIPS_PREV_STATION",
"SB_RADIO_TOOLTIPS_PLAY",
"SB_RADIO_TOOLTIPS_PAUSE",
"SB_RADIO_TOOLTIPS_BROWSE",
//new genres
"SB_RADIO_50",
"SB_RADIO_60",
"SB_RADIO_70",
"SB_RADIO_80",
"SB_RADIO_90",
"SB_RADIO_Adult",
"SB_RADIO_Alternative",
"SB_RADIO_Arabic",
"SB_RADIO_Arts",
"SB_RADIO_Blues",
"SB_RADIO_Business",
"SB_RADIO_Chansons",
"SB_RADIO_Children",
"SB_RADIO_Chillout",
"SB_RADIO_Christian",
"SB_RADIO_Classic",
"SB_RADIO_Club",
"SB_RADIO_Comedy",
"SB_RADIO_Community",
"SB_RADIO_Country",
"SB_RADIO_Culture",
"SB_RADIO_Dance",
"SB_RADIO_Disco",
"SB_RADIO_Easy",
"SB_RADIO_Electro",
"SB_RADIO_Gospel",
"SB_RADIO_HeavyMetal",
"SB_RADIO_HipHop",
"SB_RADIO_Hits",
"SB_RADIO_House",
"SB_RADIO_Information",
"SB_RADIO_Internet",
"SB_RADIO_Jazz",
"SB_RADIO_Jewish",
"SB_RADIO_Latin",
"SB_RADIO_Local",
"SB_RADIO_Lounge",
"SB_RADIO_Love",
"SB_RADIO_Modern",
"SB_RADIO_Nature",
"SB_RADIO_News",
"SB_RADIO_Nostalgia",
"SB_RADIO_Oldies",
"SB_RADIO_Pop",
"SB_RADIO_Portuguese",
"SB_RADIO_Punk",
"SB_RADIO_Rap",
"SB_RADIO_Reggae",
"SB_RADIO_RnB",
"SB_RADIO_Rock",
"SB_RADIO_Schlager",
"SB_RADIO_Soul",
"SB_RADIO_Spanish",
"SB_RADIO_Sports",
"SB_RADIO_Talk",

"SB_RADIO_Top40",
"SB_RADIO_Trance",
"SB_RADIO_Urban",
"SB_RADIO_Variety",
"SB_RADIO_World",
//end genres

"SB_RADIO_REMOVE_FAVORITES",
"SB_RADIO_ADD_FAVORITES",
"SB_RADIO_ERROR_TOOLTIP",
"SB_RADIO_FAVORITE_TOOLTIP",
"SB_RADIO_TOOLTIP_OPEN_PLAYER",
"SB_RADIO_TOOLTIP_MINIMIZE",
"SB_RADIO_TOOLTIP_EXPAND",
"SB_RADIO_TOOLTIP_MUTE",
"SB_RADIO_TOOLTIP_UNMUTE",
"SB_RADIO_SHARE",
"CTLP_STR_ID_RADIO_MENU_ADD_AND_EDIT",
"CTLP_STR_ID_RADIO_SEARCH_DLG_TITLE"
];


var defaultTranslation = {
    'SB_RADIO_PREDEFINED_STATIONS': "Predefined Stations",
    'SB_RADIO_LOCAL_STATIONS': "Local Stations",
    'SB_RADIO_FAVORITE': "Favorites",
    'SB_RADIO_LAST_SEARCH': "Last Search",
    'SB_RADIO_RECENT': "Recent",
    'SB_RADIO_GENRES': "Genres",
    'SB_RADIO_NOTHING_FOUND': "No results were found.",
    'SB_RADIO_NO_FAVORITES': "You don’t have any Favorites yet.",
    'SB_RADIO_TOOLTIPS_NEXT_STATION': "Next station",
    'SB_RADIO_TOOLTIPS_PREV_STATION': "Previous station",
    'SB_RADIO_TOOLTIPS_PLAY': "Play",
    'SB_RADIO_TOOLTIPS_PAUSE': "Pause",
    'SB_RADIO_TOOLTIPS_BROWSE': "Browse",
    //new genres
    "SB_RADIO_50": "50's",
    "SB_RADIO_60": "60's",
    "SB_RADIO_70": "70's",
    "SB_RADIO_80": "80's",
    "SB_RADIO_90": "90's",
    "SB_RADIO_Adult": "Adult",
    "SB_RADIO_Alternative": "Alternative",
    "SB_RADIO_Arabic": "Arabic",
    "SB_RADIO_Arts": "Arts",
    "SB_RADIO_Blues": "Blues",
    "SB_RADIO_Business": "Business",
    "SB_RADIO_Chansons": " Chansons",
    "SB_RADIO_Children": "Children",
    "SB_RADIO_Chillout": "Chillout",
    "SB_RADIO_Christian": "Christian",
    "SB_RADIO_Classic": "Classic",
    "SB_RADIO_Club": "Club",
    "SB_RADIO_Comedy": "Comedy",
    "SB_RADIO_Community": "Community",
    "SB_RADIO_Country": "Country",
    "SB_RADIO_Culture": "Culture",
    "SB_RADIO_Dance": "Dance",
    "SB_RADIO_Disco": "Disco",
    "SB_RADIO_Easy": "Easy",
    "SB_RADIO_Electro": "Electro",
    "SB_RADIO_Gospel": "Gospel",
    "SB_RADIO_HeavyMetal": "Heavy Metal",
    "SB_RADIO_HipHop": "HipHop",
    "SB_RADIO_Hits": "Hits",
    "SB_RADIO_House": "House",
    "SB_RADIO_Information": "Information",
    "SB_RADIO_Internet": "Internet",
    "SB_RADIO_Jazz": "Jazz",
    "SB_RADIO_Jewish": "Jewish",
    "SB_RADIO_Latin": "Latin",
    "SB_RADIO_Local": "Local",
    "SB_RADIO_Lounge": "Lounge",
    "SB_RADIO_Love": "Love",
    "SB_RADIO_Modern": "Modern",
    "SB_RADIO_Nature": "Nature",
    "SB_RADIO_News": "News",
    "SB_RADIO_Nostalgia": "Nostalgia",
    "SB_RADIO_Oldies": "Oldies",
    "SB_RADIO_Pop": "Pop",
    "SB_RADIO_Portuguese": "Portuguese",
    "SB_RADIO_Punk": "Punk",
    "SB_RADIO_Rap": "Rap",
    "SB_RADIO_Reggae": "Reggae",
    "SB_RADIO_Regional": "Regional",
    "SB_RADIO_RnB": "RnB",
    "SB_RADIO_Rock": "Rock",
    "SB_RADIO_Schlager": "Schlager",
    "SB_RADIO_Soul": "Soul",
    "SB_RADIO_Spanish": "Spanish",
    "SB_RADIO_Sports": "Sports",
    "SB_RADIO_Talk": "Talk",

    "SB_RADIO_Top40": "Top 40",
    "SB_RADIO_Trance": "Trance",
    "SB_RADIO_Urban": "Urban",
    "SB_RADIO_Variety": " Variety",
    "SB_RADIO_World": "World",
    //end genres
    'SB_RADIO_REMOVE_FAVORITES': "Remove from Favorites",
    'SB_RADIO_ADD_FAVORITES': "Add to Favorites",
    'SB_RADIO_ERROR_TOOLTIP': "This station is currently not available.",
    'SB_RADIO_FAVORITE_TOOLTIP': "Listen to your favorite online radio stations.",
    'SB_RADIO_TOOLTIP_MUTE': "Mute",
    'SB_RADIO_TOOLTIP_UNMUTE': "Unmute",
    'SB_RADIO_TOOLTIP_MINIMIZE': "Minimize",
    'SB_RADIO_TOOLTIP_EXPAND': "Expand",
    'SB_RADIO_TOOLTIP_OPEN_PLAYER': "Open",
    'CTLP_STR_ID_RADIO_MENU_ADD_AND_EDIT': "Add and Edit Stations",
    'CTLP_STR_ID_RADIO_SEARCH_DLG_TITLE': "Search"
}


function adjustValue(key, identifier) {
    var ele = $(identifier);
    conduit.advanced.localization.getKey(key, function (val) {
        ele.attr("value", val);
    });
    return ele;

}

function adjustText(key, identifier) {
    var ele = $(identifier);
    conduit.advanced.localization.getKey(key, function (val) {
        if (val)
            ele.text(val);
    });
    return ele;
}

function adjustHTML(key, identifier) {
    var ele = $(identifier);
    conduit.advanced.localization.getKey(key, function (val) {
        ele.html(val);
    });
    return ele;
}

var keys = ["SB_RADIO_LISTEN_TO",
            "SB_RADIO_SHARE",
            "SB_RADIO_ADD_FAVORITES",
            "SB_RADIO_CONNECTING",
            "SB_RADIO_PLAY",
            "SB_RADIO_BACK",
            "SB_RADIO_PREDEFINED_STATIONS",
            "SB_RADIO_LOCAL_STATIONS",
            "SB_RADIO_FAVORITE",
            "SB_RADIO_GENRES",
            "SB_RADIO_LAST_SEARCH",
            "SB_RADIO_RECENT",
            "SB_RADIO_TOOLTIP_OPEN_PLAYER",
            "SB_RADIO_TOOLTIPS_PLAY",
            "SB_RADIO_TOOLTIPS_PAUSE",
            "SB_RADIO_TOOLTIP_MINIMIZE",
            "SB_RADIO_TOOLTIP_EXPAND"
            ];

function translateApp(config) {

    conduit.advanced.localization.getKey(keys, function (data) {
        myKeys = data;

        getStr2('SB_RADIO_LISTEN_TO', '#searchInput', 'value');
        getStr2('SB_RADIO_ADD_FAVORITES', '#shareFavLine .fav', 'text');
        getStr2('SB_RADIO_CONNECTING', '.stationConnecting span#connectingText', 'html');
        getStr2('SB_RADIO_PLAY', '.nowPlayingText', 'text');
        getStr2('SB_RADIO_BACK', '#backBtn', 'text');
        getStr2('SB_RADIO_PREDEFINED_STATIONS', '#predefineds', 'text');
        getStr2('SB_RADIO_LOCAL_STATIONS', '#localStat', 'text');
        getStr2('SB_RADIO_FAVORITE', '#favStat', 'text');
        getStr2('SB_RADIO_GENRES', '#genresStat', 'text');
        getStr2('SB_RADIO_LAST_SEARCH', '#lastStat', 'text');
        getStr2('SB_RADIO_RECENT', '#recentStat', 'text');
        getStr2('SB_RADIO_SHARE', '#shareBtn', 'text');
        getStr2('SB_RADIO_TOOLTIP_OPEN_PLAYER', '#launcher', 'title');
        if (config && config.view != 'popup') {
            getStr2('SB_RADIO_TOOLTIPS_PLAY', '#playBtn', 'title');
        }
        getStr2('SB_RADIO_TOOLTIPS_PAUSE', '#stopBtn', 'title');
        getStr2('SB_RADIO_TOOLTIP_MINIMIZE', '#shrink', 'title');
        getStr2('SB_RADIO_TOOLTIP_EXPAND', '#expand', 'title');
    });

}


function localizationInit(cb, config) {
    conduit.advanced.localization.getLocale(function (data) {
        alignMode = (data.languageAlignMode) ? data.languageAlignMode : data.alignMode;

        $('body').addClass(alignMode);
        //$('#browsePopUp li').addClass(alignMode);                
    });
    trans_callback = cb;
    translateApp(config);
    conduit.advanced.localization.getKey(dictionary, function (val) {
        langPack = val;
        if (trans_callback) {
            trans_callback();
        }
    });
}

function getStr(key, callback) {
    if (callback) {
        conduit.advanced.localization.getKey(key, callback);
        return null;
    } else {
        if (langPack && langPack[key])
            return langPack[key];
        else {
            if (defaultTranslation[key])
                return defaultTranslation[key];
            else
                return key;
        }
    }
}

function getStr2(key, identifier, valType) {
    var tmp;
    tmp = myKeys[key];
    switch (valType) {
        default:
        case "value":
            $(identifier).attr("value", tmp);
            break;
        case "html":
            $(identifier).html(tmp);
            break;
        case "text":
            $(identifier).text(tmp);
            break;
        case "title":
            $(identifier).attr("title", tmp);
            break;
    }
}