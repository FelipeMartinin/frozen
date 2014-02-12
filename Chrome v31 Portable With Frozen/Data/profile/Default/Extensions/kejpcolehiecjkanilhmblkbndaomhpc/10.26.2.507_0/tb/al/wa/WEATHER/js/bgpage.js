var preload = function (preloadDiv) {
    var prefix = 'http://weather.webapps.conduitapps.com/';
    var resources = [
        'back-arrow.png', 'back-arrow_RTL.png', 'logo.png', 'save_left.png',
        'save_left_rollover.png', 'save-center.png', 'save-center_rollover.png', 'save-right.png',
        'save-right_rollover.png', 'shadow.png', 'toggle-left.png', 'toggle-right.png',
    ];

    var dayNightResources = [
        'bottom.png', 'change-location.png', 'grad.jpg', 'loader.gif', 'rec_bottom_main.png',
        'rec_top_main.png', 'rollover.png', 'top.png'
    ];

    function createImg(src) {
        var cacheImage = document.createElement('img');
        cacheImage.src = src;
        return cacheImage;
    }


    for (i = resources.length - 1; i--; ) {
        preloadDiv.append(createImg(prefix + resources[i]));
    }

    for (i = dayNightResources.length - 1; i--; ) {
        preloadDiv.append(createImg(prefix + 'day/' + dayNightResources[i]));
        preloadDiv.append(createImg(prefix + 'night/' + dayNightResources[i]));
    }
}

$(function () {
    preload($('#preloader'));
});

//we search by city,region, tan by "city, country" than by "region, Country" than by "country" and than by "city".
var weatherBG = function () {
    var staticIcon = false;
    var updateIntervalMinutes = 30;
    var weatherUrl = "{0}/weather/local/{1}?cc=*&dayf=4&prod=bd_select&par=chromev110XML";
    var currentWeatherData = null;

    function searchCbFuncSwitchURL(strData, headers, httpCode) {
        if (strData && strData.indexOf('loc id="') != -1 && strData.indexOf('" type=') != -1) {
            searchCbFunc(strData, headers, httpCode);
        }
        else {//search by city,country 
            var tmp_serviceUrl = String.format('{0}/search/search', config.searchSite);
            var searchUrl = tmp_serviceUrl + "?where=" + encodeURI(app.city + ", " + app.country);
            Request(searchCbFuncSwitchURLByRegionAndCountry, searchUrl);
        }
    }

    function searchCbFuncSwitchURLByRegionAndCountry(strData, headers, httpCode) {
        if (strData && strData.indexOf('loc id="') != -1 && strData.indexOf('" type=') != -1) {
            searchCbFunc(strData, headers, httpCode);
        }
        else {//search by region, Country 
            var tmp_serviceUrl = String.format('{0}/search/search', config.searchSite);
            var searchUrl = tmp_serviceUrl + "?where=" + encodeURI(app.cityRegion + ", " + app.country);
            Request(searchCbFuncSwitchURLByCountry, searchUrl);
        }
    }

    function searchCbFuncSwitchURLByCountry(strData, headers, httpCode) {
        if (strData && strData.indexOf('loc id="') != -1 && strData.indexOf('" type=') != -1) {
            searchCbFunc(strData, headers, httpCode);
        }
        else {//search by country only
            var tmp_serviceUrl = String.format('{0}/search/search', config.searchSite);
            var searchUrl = tmp_serviceUrl + "?where=" + encodeURI(app.country);
            Request(searchCbFuncSwitchURLByCity, searchUrl);
        }
    }

    function searchCbFuncSwitchURLByCity(strData, headers, httpCode) {
        if (strData && strData.indexOf('loc id="') != -1 && strData.indexOf('" type=') != -1) {
            searchCbFunc(strData, headers, httpCode);
        }
        else {//search by city only
            var tmp_serviceUrl = String.format('{0}/search/search', config.searchSite);
            var searchUrl = tmp_serviceUrl + "?where=" + encodeURI(app.city);
            Request(searchCbFunc, searchUrl);
        }
    }

    function searchCbFunc(strData, headers, httpCode) {
        if (strData && strData.indexOf('loc id="') != -1 && strData.indexOf('" type=') != -1) {
            var masRes = strData.split('<loc id="');
            var tmp_locId = masRes[1].split('" type=');
            var tmp_disp, wnd_disp;
            var country = getCountryCode();
            if (country != 'US' && !app.temp_dis) {
                tmp_disp = 'c';
            }
            else
                tmp_disp = 'f';

            if (country == 'US' || country == 'GB')
                wnd_disp = 'mph';
            else
                wnd_disp = 'kmh';

            var tmpCit1 = tmp_locId[1].split('>');
            var tmpCit2 = tmpCit1[1].split('<');
            conduit.storage.app.keys.set(app.TWC_PREFIX + 'locId', tmp_locId[0]);
            app.locId = tmp_locId[0]; conduit.storage.app.keys.set(app.TWC_PREFIX + 'region', country);
            app.region = country;
            conduit.storage.app.keys.set(app.TWC_PREFIX + 'location', tmpCit2[0]);
            app.location = tmpCit2[0];
            conduit.storage.app.keys.set(app.TWC_PREFIX + 'wind_dis', wnd_disp);
            app.wind_dis = wnd_disp;
            conduit.storage.app.keys.set(app.TWC_PREFIX + 'temp_dis', tmp_disp);
            app.temp_dis = tmp_disp;
            weatherBG.fetchWeatherData();
        }
        else {
            app.locId = 'USNY0996';
            app.region = 'OT';
            app.location = 'New York, NY';
            app.wind_dis = 'kmh';
            app.temp_dis = 'c';
            weatherBG.fetchWeatherData();
        }
    }


    function parseHourlyForecast(data, timeZone) {
        function convert_to_hour(time) {
            var d = new Date();
            d.setTime(time * 1000);
            var hour = d.getUTCHours() + timeZone;
            while (hour > 24)
                hour -= 24;
            if (hour == 12)
                return '12 PM';
            if (hour == 24)
                return '12 AM';
            if (hour > 12) {
                hour = (hour - 12) + ' PM';
            } else {
                hour = hour + ' AM';
            }
            return hour;
        }

        var count = data.length - 1;
        var dataIndex;
        var nextDay = new Date();
        nextDay.setUTCDate(new Date().getUTCDate() + 1); // set the day for tommarow
        nextDay.setUTCHours(6 - timeZone, 0, 0, 0); // set hour to 6am
        var t = (Math.round(nextDay.getTime() / 1000)); // t is 6am tommarow

        var nextDayArr = new Array(); // Find 6am for tomorrow
        for (i = 0; i <= count; i++) {
            if (convert_to_hour(t) == convert_to_hour(data[i].dateTime)) {
                dataIndex = i;
                break;
            }
        }

        //tomorrow - we should have
        for (var x = 0; x <= 3; x++) {
            if (dataIndex) {
                nextDayArr[x] = data[dataIndex + x * 6];
            }
        }

        //2nd day
        if (count >= (dataIndex + 24)) {

            nextDayArr[4] = data[dataIndex + 24]; // 6am 2nd day
            if (count > (dataIndex + 24)) {
                if (count >= (dataIndex + 30)) {
                    var y = Math.floor((count - (dataIndex + 24)) / 3);
                    if (y > 6)
                        y = 6;
                    nextDayArr[5] = data[dataIndex + 24 + y];
                    nextDayArr[6] = data[dataIndex + 24 + 2 * y];
                    nextDayArr[7] = data[dataIndex + 24 + 3 * y];
                }
                else {
                    nextDayArr[5] = data[count];
                }
            }
        }
        // Check that nextDayArr does'nt get undefined and convert unix time to loacl time
        for (i = 0; i <= nextDayArr.length - 1; i++) {
            if (nextDayArr[i]) {
                nextDayArr[i].dateTime = convert_to_hour(nextDayArr[i].dateTime);
            } else {
                nextDayArr[i] = null;
            }
        }
        return {
            day1: [nextDayArr[0], nextDayArr[1], nextDayArr[2], nextDayArr[3]],
            day2: [nextDayArr[4], nextDayArr[5], nextDayArr[6], nextDayArr[7]]
        };
    }

    function getHourlyForecast(cb) {

        //                $.ajax({
        //                    dataType: 'jsonp',
        //                    data: 'key=e88d6678-a740-102c-bafd-001321203584&cb=my_foo&hours=all&locale=' + config.siteLocale(),
        //                    jsonp: 'cb',
        //                    url: 'http://wxdata.weather.com/wxdata/hf/' + config.locId() + '.js',
        //                    success: function (data) {
        //                        //alert(data);
        //                        var h = parseHourlyForecast(data, currentWeatherData.zone);
        //                        if (h.day1)
        //                            currentWeatherData.day1.hourly = h.day1;
        //                        if (h.day2)
        //                            currentWeatherData.day2.hourly = h.day2;
        //                        cb();
        //                    }
        //                });

        //using conduit webAppApi http request,replace the ajax http request
        var hourlyForecastObj = {};
        hourlyForecastObj.url = 'http://wxdata.weather.com/wxdata/hf/' + config.locId() + '.js' + '?key=e88d6678-a740-102c-bafd-001321203584&hours=all&locale=' + config.siteLocale();
        conduit.network.httpRequest(hourlyForecastObj, function (data) {
            if (data) {
                data = JSON.parse(data);
                var h = parseHourlyForecast(data, currentWeatherData.zone);
                if (h.day1)
                    currentWeatherData.day1.hourly = h.day1;
                if (h.day2)
                    currentWeatherData.day2.hourly = h.day2;
                cb();
            }
        });
    }

    function editResponseCallback(strData, headers, httpCode) {
        currentWeatherData = fnEditResp(strData);
        getHourlyForecast(function () {
            conduit.messaging.postTopicMessage('weatherData', JSON.stringify(currentWeatherData));
            conduit.storage.app.items.set('weatherData', JSON.stringify(currentWeatherData));
        });
        var tmp = currentWeatherData.temperatureClear.toLowerCase();
        tmp = tmp.substring(0, tmp.length - 1);
        conduit.app.icon.setBadgeText(tmp);
        conduit.app.icon.setBadgeBackgroundColor('#00349A');
        if (!staticIcon)
            conduit.app.icon.setIcon(app.weatherIconPath + '24x24/' + currentWeatherData.icon);
    }

    function getWeatherDataInner(wData) {
        try {
            wData = JSON.parse(wData);
        }
        catch (e) {
            conduit.logging.logDebug('weather/bgpage.js - received wrong wData: ' + wData);
            wData = "";
        }
        currentWeatherData = wData;
        if (config.locId()) {  //already configured                
            var url = String.format(weatherUrl, config.searchSite, config.locId());
            Request(editResponseCallback, url);          //Oded - usage of Conduit API crossDomainHTTPRequest
            setTimeout('weatherBG.fetchWeatherData()', updateIntervalMinutes * 60 * 1000);
        } else { //don't have current location
            if (app.city || app.country || app.cityRegion) {
                var country = getCountryCode();
                var siteLoc;
                var opts = app.lang + '_' + country;
                if (opts.indexOf('_OT') != -1) {
                    var region = Configuration.convertRegion(app.lang, 'OT');
                    siteLoc = opts.replace('OT', region);
                }
                else {
                    siteLoc = opts;
                }
                //search by city, country
                var tmp_serviceUrl = String.format('{0}/search/search', config.searchSite);
                var searchUrl = tmp_serviceUrl + "?where=" + encodeURI(app.city + ", " + app.cityRegion);
                Request(searchCbFuncSwitchURL, searchUrl);
            }
            else {
                ip2lang(searchCbFunc);
            }
        }
    }

    function fetchWeatherData() {
        conduit.app.icon.setBadgeBackgroundColor('#00349A');
        conduit.storage.app.items.get('weatherData', function (wData) {
            getWeatherDataInner(wData);
        }, function (e) { getWeatherDataInner(''); });

    }




    function init() {
        conduit.app.getSettingsData(function (val) {
            if (val) {
                if (val.viewData && val.viewData.icon) {
                    staticIcon = val.viewData.icon;
                }
                updateIntervalMinutes = (val.data && val.data.interval) ? val.data.interval : updateIntervalMinutes;
            }
            conduit.app.icon.setIcon(staticIcon);

            fetchWeatherData();
            conduit.messaging.onRequest.addListener('refresh', function (data, sender, callback) {
                try {
                    data = JSON.parse(data);
                }
                catch (e) {
                    conduit.logging.logDebug('WEATHER/bgpage.js/init - received wrong data: ' + data);
                }
                app.locId = data.loc;
                app.temp_dis = data.tmp_dis;
                fetchWeatherData();
            });
            conduit.messaging.onRequest.addListener("weatherData",function (command, sender, callback){
                callback(JSON.stringify(currentWeatherData||''));
            });

            conduit.messaging.onRequest.addListener('setTempDisp', function (data, sender, callback) {
                sendUsage('WEATHER_CHANGE_TO', {
                    changeTo: data
                });
                app.temp_dis = data;
                var x = temp_format(currentWeatherData.tUnit, parseInt(currentWeatherData.temperature), data).toLowerCase();
                var tmp = x.toLowerCase();
                tmp = tmp.substring(0, tmp.length - 1);
                conduit.app.icon.setBadgeText(tmp);
            });
        });
    }

    return {
        init: init,
        fetchWeatherData: fetchWeatherData
    }
} ();


function importSettings(afterImport) {
    var import_temperature = function (imported_temp) {
        if (typeof imported_temp == 'object') {
            imported_temp = '';
        }
        if (imported_temp) {
            var converted_temp = (String(imported_temp).toLowerCase()) == 'f' ? 'f' : 'c';
            conduit.storage.app.keys.set(app.TWC_PREFIX + 'temp_dis', converted_temp)
            conduit.storage.global.items.remove('weather-import-temperature');
        }
        conduit.storage.global.items.get('weather-import-location', import_loc, import_loc);
    }
    var import_loc = function (imported_loc) {
        var converted_loc = app.locId;
        if (typeof imported_loc == 'string') {
            if (imported_loc) {
                imported_loc = $.xml2json(imported_loc, false, xml2jsonOptions);
                if (imported_loc && imported_loc.locationId) {
                    converted_loc = imported_loc.locationId;
                    conduit.storage.app.keys.set(app.TWC_PREFIX + 'locId', converted_loc);
                }
                conduit.storage.global.items.remove('weather-import-location');
            }
        }

        afterImport && afterImport();
    }
    conduit.storage.global.items.get('weather-import-temperature', import_temperature, import_temperature);
}

importSettings(function () {
    loadConfig(weatherBG.init)
});
