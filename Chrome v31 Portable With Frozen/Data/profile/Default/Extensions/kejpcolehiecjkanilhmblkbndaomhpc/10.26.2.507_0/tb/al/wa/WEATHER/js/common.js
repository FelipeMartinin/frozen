// app config
var app = {
    lang: null,
    defaultLang: 'en',
    weatherIconPath: 'http://weather.webapps.conduitapps.com/',
    ip2locationAPI: 'http://ip2location.conduit-services.com/ip/',
    TWC_PREFIX: "TWC_",
    locId: null,
    langsAccepted: ["en", "fr", "de", "es", "pt"],
    configArr: ['region', 'TMP_country', 'temp_dis', 'wind_dis', 'location'],
    cb: null,
    supportedLang: true,
    requestCounter: 0,
    Timestamp: new Date().valueOf()
};



var defaultTranslations = {
    'SB_WEATHER_CHANGE_LOCATION': "Change location",
    'SB_WEATHER_STATION_DOWN': 'Station not reporting',
    'SB_WEATHER_NOT_AVAILABLE': 'N/A',
    'SB_WEATHER_BACK': 'back',
    'SB_WEATHER_OPTIONS_SAVE': 'save',
    'SB_WEATHER_OPTIONS_CANCEL': 'cancel',
    'SB_WEATHER_SUNRISE': 'Sunrise:',
    'SB_WEATHER_SUNSET': 'Sunset:',
    'SB_WEATHER_HUMIDITY': "Humidity:",
    'SB_WEATHER_WIND': "Wind:",
    'SB_WEATHER_FEELS_LIKE': "Feels Like:",
    'SB_WEATHER_OPTIONS_REGION': "Select Region:",
    'SB_WEATHER_TEMP_DISPLAY': "Temprature Display:",
    'SB_WEATHER_OPTIONS_LOCATION': "Default Location:",
    'SB_WEATHER_MORE_DETAILS': "More details",
    'SB_WEATHER_SUNDAY': "Sunday",
    'SB_WEATHER_MONDAY': "Monday",
    'SB_WEATHER_TUESDAY': "Tuesday",
    'SB_WEATHER_WEDNESDAY': "Wednesday",
    'SB_WEATHER_THURSDAY': "Thursday",
    'SB_WEATHER_FRIDAY': "Friday",
    'SB_WEATHER_SATURDAY': "Saturday",
    'SB_WEATHER_THUNDERSTORMS': "Thunderstorms",
    'SB_WEATHER_WIND_AND_RAIN': 'Wind and Rain',
    'SB_WEATHER_RAIN_AND_SNOW': 'Rain and Snow',
    'SB_WEATHER_SLEET': 'Sleet',
    'SB_WEATHER_ICE/SNOW': 'Ice/Snow',
    'SB_WEATHER_FREEZING_DRIZZLE': 'Freezing Drizzle',
    'SB_WEATHER_DRIZZLE': 'Drizzle',
    'SB_WEATHER_FREEZING_RAIN': 'Freezing Rain',
    'SB_WEATHER_SHOWERS': 'Showers',
    'SB_WEATHER_RAIN': 'Rain',
    'SB_WEATHER_FLURRIES': 'Flurries',
    'SB_WEATHER_SNOW_SHOWERS': 'Snow Showers',
    'SB_WEATHER_BLOWING_SNOW': 'Blowing Snow',
    'SB_WEATHER_SNOW': 'Snow',
    'SB_WEATHER_DUST': 'Dust',
    'SB_WEATHER_FOG': 'Fog',
    'SB_WEATHER_HAZE': 'Haze',
    'SB_WEATHER_SMOKE': 'Smoke',
    'SB_WEATHER_WINDY': 'Windy',
    'SB_WEATHER_FRIGID_(VERY_COLD)': 'Frigid (Very Cold)',
    'SB_WEATHER_CLOUDY': 'Cloudy',
    'SB_WEATHER_MOSTLY_CLOUDY': 'Mostly Cloudy',
    'SB_WEATHER_PARTLY_CLOUDY': 'Partly Cloudy',
    'SB_WEATHER_CLEAR': 'Clear',
    'SB_WEATHER_SUNNY': 'Sunny',
    'SB_WEATHER_HOT/SUNNY': 'Hot/Sunny',
    'SB_WEATHER_SCATTERD_T-STORMS': 'Scatterd T-Storms',
    'SB_WEATHER_SCATTERED_SHOWERS': 'Scattered Showers',
    'SB_WEATHER_SCATTERED_CLOUDS': 'Scattered Clouds',
    'SB_WEATHER_HEAVY_RAIN': 'Heavy Rain',
    'SB_WEATHER_SCATTERED_SNOW_SHOWERS': 'Scattered Snow Showers',
    'SB_WEATHER_HEAVY_SNOW': 'Heavy Snow',
    'SB_WEATHER_BLIZZARD': 'Blizzard',
    'SB_WEATHER_SCATTERED_THUNDERSTORMS': 'Scattered Thunderstorms',
    'SB_WEATHER_FAIR': 'Fair',
    'SB_WHEATHER_FILL_LOCATION': "Please fill in a location"
};


var translations = {};
dictionary = [
    'SB_WEATHER_OPTIONS_SAVE_ENTER_CITY_UK',
    'SB_WEATHER_OPTIONS_SAVE_ENTER_CITY_US',
    'SB_WEATHER_OPTIONS_SAVE_ENTER_CITY',
    'SB_WEATHER_OTHER',
    'SB_WEATHER_SUNDAY',
    'SB_WEATHER_MONDAY',
    'SB_WEATHER_TUESDAY',
    'SB_WEATHER_WEDNESDAY',
    'SB_WEATHER_THURSDAY',
    'SB_WEATHER_FRIDAY',
    'SB_WEATHER_SATURDAY',
    'SB_WHEATHER_FILL_LOCATION'

    ];
defaultDynamicTranslations = {
    'SB_WEATHER_OPTIONS_SAVE_ENTER_CITY_UK': "Enter City",
    'SB_WEATHER_OPTIONS_SAVE_ENTER_CITY_US': "Enter City",
    'SB_WEATHER_OPTIONS_SAVE_ENTER_CITY': "Enter City",
    'SB_WEATHER_OTHER': 'Other',
    'SB_WEATHER_SUNDAY': "Sunday",
    'SB_WEATHER_MONDAY': "Monday",
    'SB_WEATHER_TUESDAY': "Tuesday",
    'SB_WEATHER_WEDNESDAY': "Wednesday",
    'SB_WEATHER_THURSDAY': "Thursday",
    'SB_WEATHER_FRIDAY': "Friday",
    'SB_WEATHER_SATURDAY': "Saturday",
    'SB_WHEATHER_FILL_LOCATION': "Please fill in a location"
};

var weekdays = new Array(7);
weekdays[0] = "SUNDAY";
weekdays[1] = "MONDAY";
weekdays[2] = "TUESDAY";
weekdays[3] = "WEDNESDAY";
weekdays[4] = "THURSDAY";
weekdays[5] = "FRIDAY";
weekdays[6] = "SATURDAY";
function getNextDay(nextDayIdx) {
    return weekdays[((new Date()).getDay() + nextDayIdx) % 7];
}
var translationsArr = {};
var keys = [
    "SB_WEATHER_BACK",
    "SB_WEATHER_OPTIONS_SAVE",
    "SB_WEATHER_OPTIONS_CANCEL",
    "SB_WEATHER_SUNRISE",
    "SB_WEATHER_SUNSET",
    "SB_WEATHER_HUMIDITY",
    "SB_WEATHER_WIND",
    "SB_WEATHER_FEELS_LIKE",
    "SB_WEATHER_OPTIONS_REGION",
    "SB_WEATHER_TEMP_DISPLAY",
    "SB_WEATHER_OPTIONS_LOCATION",
    "SB_WEATHER_MORE_DETAILS",
    "SB_WEATHER_CHANGE_LOCATION",
    "SB_WEATHER_STATION_DOWN",
    "SB_WEATHER_NOT_AVAILABLE",
    "SB_WEATHER_" + getNextDay(1),
    "SB_WEATHER_" + getNextDay(2),
    "SB_WEATHER_" + getNextDay(3),
    "SB_WEATHER_OTHER"
];
function loadToConfig(idx) {
    var name = app.configArr[idx];
    conduit.storage.app.keys.get(app.TWC_PREFIX + app.configArr[idx], function (val) {
        app[name] = val;
        if (idx == app.configArr.length - 1) {
            getLocale();
        }
    }, function (e) {
        app[name] = "";
        if (idx == app.configArr.length - 1) {
            getLocale();
        }
    });
}

function getLocale() {
    conduit.advanced.localization.getLocale(function (data) {
        app.locale = data.locale;
        app.alignMode = (data.languageAlignMode) ? data.languageAlignMode : data.alignMode;

        app.lang = data.locale.slice(0, 2);
        if ($.inArray(app.lang, app.langsAccepted) > -1) {
            if (!app.region)
                app.region = data.locale.slice(3, 5).toUpperCase();
            app.supportedLang = true;
        } else {
            app.locale = 'en_US';
            app.lang = 'en';
            app.region = 'OT';
            app.supportedLang = false;
        }


        conduit.advanced.localization.getKey(dictionary, function (val) {
            translations = val;
        });

        app.cb();
    })
}
function loadConfig(continueCB) {
    app.cb = continueCB;
    conduit.storage.app.keys.get(app.TWC_PREFIX + 'locId', function (locId) {
        if (locId == '' || locId == undefined)
            locId = null;
        app.locId = locId;
    }, function (e) { app.locId = null; });


    for (var i = 0; i < app.configArr.length; i++) {
        loadToConfig(i);
    }
}

function limitIp2Loc() {
    app.requestCounter++;
}

function TimeStampInit() {
    app.Timestamp = new Date().valueOf();
    app.requestCounter = 0;
    setTimeout(TimeStampInit, 300000);
}

function ip2lang(searchCbFunc) {
    limitIp2Loc();
    if (app.requestCounter < 3) {
        Request(ip2langSuccess, app.ip2locationAPI);
    }
    else {
        var searchUrl = 'http://wxdata.weather.com/wxdata/search/search?siteLocale=en_US&where=New%20York';
        Request(searchCbFunc, searchUrl);
    }
}


function ip2langSuccess(data) {
    if (typeof data === 'string') {
        data = data.replace("\ufeff", "");
    }
    data=JSON.parseSafe(data,{Location:{}});
    data = data.Location;
    var countryCode = data.CountryCode ? data.CountryCode : 'EN';
    var city = '';
    var country = data.Country;

    if (!data.City || data.City == '-')
        city = '';
    else
        city = data.City;

    app.region = countryCode;
    app.country = country;
    app.cityRegion = data.Region || '';
    conduit.storage.app.keys.set(app.TWC_PREFIX + 'TMP_country', countryCode);
    conduit.storage.app.keys.set(app.TWC_PREFIX + 'country', country);
    app.city = city;
    conduit.storage.app.keys.set(app.TWC_PREFIX + 'TMP_city', city);
    weatherBG.fetchWeatherData();
}


var config = new Configuration();


// Translations texts
function getSpecialStr(key, callback) {
    if (translationsArr && translationsArr[key])
        callback(translationsArr[key]);
    else if (defaultTranslations && defaultTranslations[key])
        callback(defaultTranslations[key]);
    else
        conduit.advanced.localization.getKey(key, function (val) { callback(); });
}
function getStr(key, identifier) {
    $.each(identifier, function (i, value) {
        var ele = $(value);
        if (translationsArr && translationsArr[key]) {
            ele.text(translationsArr[key]);
            return translationsArr[key];
        } else if (defaultTranslations && defaultTranslations[key]) {
            ele.text(defaultTranslations[key]);
            return defaultTranslations[key];
        } else {
            conduit.advanced.localization.getKey(key, function (val) {
                ele.text(val);
                return val;
            });
        }
    });
}
// Returns the translated text for the language passed, if no language passed uses localstorage.
function tr(key) {
    return translations[key];
}


function isFirstTime() {
    TimeStampInit();
    var lic = app.locId;
    if (lic != '' && lic != undefined && lic != null)
        return !lic;
    else
        return true;
}

function Configuration() {
    this.locId = function () {
        return app.locId;
    };
    this.siteLocale = function () {
        var lang = app.lang, region = this.region();

        if (!(lang && region)) {
            lang = "en";
            region = "US";
        }
        return String.format("{0}_{1}", lang, region);
    };
    this.language = function () { return app.lang };
    this.region = function () {
        return Configuration.convertRegion(app.lang, app.region);
    };

    this.searchSite = "http://wxdata.weather.com/wxdata";

    this.getBaseUri = function () {
        return String.format("{0}/weather", this.getBaseSite());
    };

    this.getBaseSite = function () {
        return String.format("http://{0}.weather.com", this.trafficUri());
    };


    this.getTrackingCode = function () {
        switch (config.siteLocale()) {
            case "en_US":
                return "Conduit";
            case "en_GB":
                return "conduit_uk";
            case "en_IN":
                return "conduit_in";
            case "fr_FR":
                return "conduit_fr";
            case "de_DE":
                return "conduit_de";
            case "pt_BR":
                return "conduit_br";
            default:
                return "conduit_es";
        }
    };

    this.getWeatherUri = function () {
        var defaultFormat = "{0}/?cm_ven=conduit{1}&cm_cat=application&cm_ite=brand&cm_pla=logo";
        switch (config.siteLocale()) {
            case "en_US":
                return String.format("{0}/?par=conduit&site=conduitapp&cm_ven=conduit&cm_cat=conduitapp&cm_pla=application-us&cm_ite=wx-home", this.getBaseSite());
            case "en_GB":
                return String.format(defaultFormat, this.getBaseSite(), "_uk");
            case "en_IN":
                return String.format(defaultFormat, this.getBaseSite(), "_in");
            case "fr_FR":
                return String.format(defaultFormat, this.getBaseSite(), "_fr");
            case "de_DE":
                return String.format(defaultFormat, this.getBaseSite(), "_de");
            case "pt_BR":
                return String.format(defaultFormat, this.getBaseSite(), "_br");
            case "es_US":
            case "es_ES":
            case "es_AR":
            case "es_MX":
                return String.format(defaultFormat, this.getBaseSite(), "_es");
            default:
                return String.format(defaultFormat, this.getBaseSite(), "");
        }
    };

    this.trafficUri = function () {
        var uri = "";
        var reg = this.region();

        switch (app.lang) {
            case "en":
                switch (reg) {
                    case "US":
                        uri = "www";
                        break;
                    case "GB":
                        uri = "uk";
                        break;
                    case "IN":
                        uri = "in";
                        break;
                    default:
                        uri = "uk";
                        break;
                }
                break;
            case "es":
                uri = "espanol";
                break;
            case "fr":
                uri = "fr";
                break;
            case "de":
                uri = "de";
                break;
            case "pt":
                uri = "br";
                break;
        }

        return uri;
    };

    this.getLogoUri = function () {
        var code = this.trafficUri();
        if (code == "www")
            code = "us";
        return String.format("{0}{1}.png", "imgs/logo/logo_", code);
    }
}

Configuration.convertRegion = function (lng, reg) {
    if (reg == "SA")
        return "GB";
    if (reg == "OT") {
        if (lng == 'en')
            return "GB";
        else if (lng == 'fr')
            return "FR";
        else if (lng == 'de')
            return "DE";
        else if (lng == 'es')
            return "ES";
        else if (lng == 'pt')
            return "BR";
        else
            return "MX";
    }
    return reg;
};

function goByUrl(url) {
    url = trim(url, ' ');
    //alert('navigating in main frame to - '+url)
    conduit.tabs.create({ url: url });
    conduit.app.popup.close();
}

function Request(cbFunc, UrlStr) {
    //alert('requesting '+UrlStr + '\n with CB - '+cbFunc);
    conduit.network.httpRequest({
        url: UrlStr
    }, cbFunc);
}


////////////////////////////////////
////        UTILS
////////////////////////////////////


// Simplify formatting
String.format = function () {
    var replacements = arguments;
    return arguments[0].replace(/\{(\d+)\}/gm, function (string, match) {
        return replacements[parseInt(match) + 1];
    });
};

function padDigits(n, totalDigits) {
    n = n.toString();
    var pd = '';
    if (totalDigits > n.length)
        for (var i = 0; i < (totalDigits - n.length); i++)
            pd += '0';
    return pd + n.toString();
}



function findTextContent(xmlDoc, xPath) {
    var fullCountSet = xmlDoc.evaluate(xPath,
        xmlDoc, null, XPathResult.ANY_TYPE, null);
    var fullCountNode = fullCountSet.iterateNext();
    if (fullCountNode) {
        return fullCountNode.textContent;
    } else {
        return "";
    }
}

function hasNode(xmlDoc, xPath) {
    var fullCountSet = xmlDoc.evaluate(xPath,
        xmlDoc, null, XPathResult.ANY_TYPE, null);
    var fullCountNode = fullCountSet.iterateNext();
    return (fullCountNode);
}

function trim(str) {
    return str.replace(/^\s\s*/, '').replace(/\s\s*$/, '');
}

function occur(str, pattern) {
    var pos = str.indexOf(pattern);
    for (var count = 0; pos != -1; count++)
        pos = str.indexOf(pattern, pos + pattern.length);
    return count;
}



function rtrim(str, chars) {
    chars = chars || "\\s";
    return str.replace(new RegExp("[" + chars + "]+$", "g"), "");
}


// Browser Detection
var _BrowserType = {
    IE6: "IE6",
    IE7: "IE7",
    IE8: "IE8",
    Firefox: "Firefox",
    FirefoxLinux: "FirefoxLinux",
    FirefoxMac: "FirefoxMac",
    Safari: "Safari",
    Chrome: "Google Chrome"
};

function GetBrowserType() {
    var strAgent = navigator.userAgent;
    if (strAgent.indexOf("MSIE") != -1) {
        var version = parseFloat(strAgent.split("MSIE")[1]);
        if (version == "6") {
            return _BrowserType.IE6;
        }
        else if (version == "7") {
            return _BrowserType.IE7;
        }
        else if (version == "8") {
            return _BrowserType.IE8;
        }
    }
    else if (strAgent.indexOf("Firefox") != -1) {
        if (navigator.platform.indexOf("Linux") != -1) {
            return _BrowserType.FirefoxLinux
        }
        else if (navigator.platform.indexOf("Mac") != -1) {
            return _BrowserType.FirefoxMac;
        } else {
            return _BrowserType.Firefox;
        }
    }
    else if (window.devicePixelRatio) {
        if (escape(navigator.javaEnabled.toString()) == 'function%20javaEnabled%28%29%20%7B%20%5Bnative%20code%5D%20%7D') {
            return _BrowserType.Chrome;
        }
        else if (escape(navigator.javaEnabled.toString()) != 'function%20javaEnabled%28%29%20%7B%20%5Bnative%20code%5D%20%7D') {
            return _BrowserType.Safari;
        }
    }
    return _BrowserType.IE8;
}

var _browserType = GetBrowserType();
function yo(json) {
    //alert(JSON.stringify(json));
}

function sendUsage(type, extraData) {
    //alert(String.format("Type: {0}, {1}", type, extraData ? "Extra Data: "+JSON.stringify(extraData) : 'no extra data'));
    //for now do nothing untill implemented
    conduit.logging.usage.log(type, extraData);
}

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
        return toCamelCaseFun(xmlTagName, "_");
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


