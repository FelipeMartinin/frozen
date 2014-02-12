
//var _externalImages = 'imgs/'
var _externalImages = 'http://radio.webapps.conduitapps.com/';
var emptyCB = function (data) { };

VERSION = '1.0';
VERSION_FOLDER = 'js/';
var appType = 'Undefined';
try {
          appType = GetInfo().context.host;
} catch (e) {}
APP_PREFIX = 'radio_'+ appType + '_';
var partnerId = 'pvVhKzQW';

function toCamelCaseFun(str, separator) {
          if (!str || !separator)
                    return str;

          var words = str.toLowerCase().split(separator);

          for (var i = 0; i < words.length; i++) {
                    if (i > 0) {
                              var word = words[i].split("");
                              word[0] = word[0].toUpperCase();
                              words[i] = word.join("");
                    }
          }

          return words.join("");
}
var xml2jsonOptions = {
          rename: function (xmlTagName) {
                    return toCamelCaseFun (xmlTagName, "_");                                        
          },
          parser: function (value) {
                    if (typeof (value) === "string") {
                              switch (value.toLowerCase()) {
                                        case "true":
                                                  return true;
                                        case "false":
                                                  return false;
                                        default:
                                                  return value;
                              }
                    }

                    return value;
          }
};

function yo(obj) {
          alert(JSON.stringify(obj));
}

function toggleClass(obj, str, onOn, onOff) {
          if (obj.hasClass(str)) {
                       obj.removeClass(str);
                       if (typeof(onOff) == 'function')
                                 onOff();
          } else {
                 obj.addClass(str);
                 if (typeof(onOn) == 'function')
                                 onOn();
          }
}

function shortenText(text, size){
    var ret = text;
    if (ret) {
        if (ret.length > size)
            ret = ret.slice(0, size - 1) + "...";
    }      
    return ret;
}


var radioResources = {    
     prefix : 'http://radio.webapps.conduitapps.com/',
    embImages : [                                                           
    //first shown
    'bg_open2.png',                    'bg_closed2.png',        'Pause_normal.png',                                                            
    'play_normal.png',            'minimize_open_normal.png',   'maximize_closed_normal.png',
    'open app_open_normal.png',   'station-panel_left.png','station-panel_middle.png','station-panel_right.png','equalizer_stopped2.png',
    //rollovers/secondary states                                                   
    'Pause_rollover.png','play_rollover2.png', 'volume_rollover2.png','equalizer_playing2.gif',
    'equalizer_error2.gif','maximize_closed_rollover.png','minimize_open_rollover.png',                                                                                                                                                                                    
    'open app_open_rollover.png','volume_disabled.png','volume_normal.png',
    'volume_rollover2.png','Volume-button_normal.png','Volume-button_rollover.png',
    'volume-scale_left.png', 'volume-scale_middle.png', 'volume-scale_right.png', 'ajax-loader2.gif', 'Pause_normal3.png', 'Pause_rollover3.png', 'play_normal3.png', 'play_rollover3.png',
    'equalizer_playing3.gif','equalizer_stopped3.gif','bg_open4.png', 'bg-closed3.png', 'maximize_closed_normal3.png',   'maximize_closed_rollover3.png', 'open-app_closed_normal3.png', 'open-app_closed_rollover3.png'                                                  
    ],
    
    gadgetImages : [
    //first shown
    "full-welcome-screen.png",              "x-close.png",                "pattern.png", 
    "top-of-app_line.png",                  "panel-main-screen-bg.png",            
    'search_left.gif',   'search_middle.gif',          'search_right.gif',
    "pause_click.png",            "pause_normal.png",           "Play_normal.png", 
    "favorite_ next to share.png",          "forward_normal.png", 
    'app-equalizer_stopped.gif',            'app-equalizer_playing.gif',
    "rewind_normal.png", "search_normal.png", "search-music_normal.png", "search-music_rollover2.png",
    "search-music_normal2.png", "search-music_click2.png", "rewind_rollover2.png", "rewind_normal2.png",
    "rewind_click2.png","forward_rollover2.png","forward_normal2.png","forward_click2.png",
                                        
    //rollover/secondary states
    "tooltip.png",      "share_favorite-divider.png",           "share_normal.png", 
    "share-menu_center.png",                "welcome screen_x_close.png",           "Play_rollover.png", 
    "pause_rollover.png",         "Play_click.png",   "twitter_hover.png",          "twitter_normal.png", 
    "share-menu_left.png",        "share-menu_right.png",       "share-menu-divider.png", 
    "small-play_normal.png",      "small-play_rollover.png",    "share_hover.png", 
    "rewind_click.png",           "rewind_rollover.png",        "forward_click.png", 
    "forward_rollover.png",       "search_click.png",           "search_rollover.png", 
    "search-music_click.png",     "search-music_rollover.png",  "panel-station-screen-bg.png", 
    "scrollbar.png",    "scroll-handle.png",          "back.png",         "arrow-down_hover.png",
    "arrow-down_normal.png",      "arrow-right_hover.png",      "arrow-right_normal.png",
    "divider_station screen.png", "facebook_hover.png",         "facebook_normal.png",
    "favorite_-next-to-share_rollover.png",           "favorite_nextToShare-on.png", 
    "favorite_normal.png",        "favorite_rollover.png",      "favorite-on-stations-screen.png", 
    "mail_hover.png",   "mail_normal.png",
    ],
                              
    station_menu : [
    'bottom_middle.png',          'left_bottom.png',  'left_middle.png',  'right_bottom.png',
    'right_middle.png', 'top_left.png',     'top_middle.png',   'top_right.png'
    ]
};


 
                    