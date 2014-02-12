//
// Copyright © Conduit Ltd. All rights reserved.
// This software is subject to the Conduit license (http://hosting.conduit.com/EULA/).
//
// This code and information are provided 'AS IS' without warranties of any kind, either expressed or implied, including, without limitation, // to the implied warranties of merchantability and/or fitness for a particular purpose.
//
//

//****  Filename: Utils.js
//****  FilePath: main/js/utils
//****
//****  Author: Yochai
//****  Date: 16.02.11
//****  Class Name: Utils
//****  Type: Singleton
//****  Description: Has one global object - content_side which tells us if we're in the view or the bg.
//****  Inherits from: No one.
//****
//****  Copyright: Realcommerce & Conduit.
//****

if (!conduit.utils) {
    conduit.utils = {};
}

conduit.utils.conten_side = false;
try {
    chrome.browserAction.justCheck;
} catch (e) {
    conduit.utils.conten_side = true;
}

/************** PRIVATE FUNCTIONS **********************/
/**
@description converts objects to strings - so when printing it will be readable
@function objectToString
@property {object} obj - the object we want to read as a string
*/
/*function objectToString(obj) {
var parse = function (_obj) {
var a = [], t;
for (var p in _obj) {
if (_obj.hasOwnProperty(p)) {
t = _obj[p];
if (t && typeof t == "object") {
a[a.length] = p + ":{ " + arguments.callee(t).join(", ") + "}";
}
else {
if (typeof t == "string") {
a[a.length] = [p + ": \"" + t.toString() + "\""];
}
else {
a[a.length] = [p + ": " + t.toString()];
}
}
}
}
return a;
};
return "{" + parse(obj).join(", ") + "}";

}*/

var Utils = conduit.utils;
﻿//****  Filename: strings.js
//****  FilePath: main/js/utils
//****
//****  Author: Everybody
//****  Date: 20.2.11
//****  Class Name: Strings
//****  Description: Various general string manipulations. Also contains additions to Javascript's String base type.
//****  Inherits from: No one (Singleton)
//****
//****  Example: var str = Strings.stringTrim("abc     "); --> str == "abc".
//****  Example2: String abc = "<root><link>www.google.com</link></root>"; abc.replaceReservedKeywords(); ---> abc == "<root><linkk>www.google.com</linkk></root>"
//****
//****  Copyright: Realcommerce & Conduit.
//****

conduit.register("utils.strings", new function () {

    // stringTrim - trims a string's white spaces from the start and end of the string
    // Scope: Public
    // Param.: stringToTrim
    // Example: var str = Strings.stringTrim("abc     "); --> str == "abc".
    var stringTrim = function (str) {
        if (!str || !str.replace) {
            return null;
        }

        str = str.replace(/^\s+/, '');
        str = str.replace(/\s+$/, '');

        return str;
    };

    // stringFormat: same as C#'s stringFormat.
    // Scope: Public
    // Param.: string text.
    // Example: stringFormat(‘Hello {0} & {1} ‘, ‘John’, ‘Jane’)
    // boundaries:  you can't repeat the placeholder more then once-
    // wrong usage: stringFormat(‘Hello {0} & {0} ‘, ‘John’)
    // right usage: stringFormat(‘Hello {0} & {1} ‘, ‘John’,'John')
    var stringFormat = function (strText) {
        if (strText) {
            if (arguments.length <= 1) { return strText; }
            var replaceString = "";
            for (var i = 0; i < arguments.length - 1; i++) {
                replaceString = "{" + i.toString() + "}";
                strText = strText.replace(replaceString, arguments[i + 1]);
            }
        }

        return strText;
    };
    // replaceReservedKeywords - replace a reserved word in an XML to different words.
    // Scope: Public
    // Param.: none. Prototype of Javascript's String.
    // Example: String abc = "<root><link>www.google.com</link></root>"; abc.replaceReservedKeywords(); ---> abc == "<root><linkk>www.google.com</linkk></root>"
    var initReservedKeywords = function () {
        /// <summary>Init reserved keywords</summary>

        var reservedKeywords = [
            'link',
            'caption',
            'source',
            'command',
            'default'
        ];

        var reservedKeywordsPartInRegex = reservedKeywords[0];
        for (var i = 1; i < reservedKeywords.length; i++) {
            reservedKeywordsPartInRegex += '|' + reservedKeywords[i];
        }

        var reservedKeywordsPattern = stringFormat('(</?)({0})(\\s*/?>)', reservedKeywordsPartInRegex);
        var modifiers = 'ig'; // case insensitive and global

        return new RegExp(reservedKeywordsPattern, modifiers);
    };

    var reservedKeywordsRegex = initReservedKeywords();
    var reservedKeywordsFix = '$1$2__$3';

    String.prototype.replaceReservedKeywords = function () {
        /// <summary>replace reserved keywords in html/xml that interrupt parsing</summary>
        /// <param name="str" type="string">The str to replace the keywords in</param>

        return this.replace(reservedKeywordsRegex, reservedKeywordsFix);
        // Meantime we use this
    };


    return {
        stringTrim: stringTrim,
        stringFormat: stringFormat
    };
});


//(function () {
//    
//    
//})();


﻿//****
//****  filename: date.js
//****  author: guys
//****  date: 10/5/2010 5:37:36 PM
//****  description:
//****  realcommerce & conduit (c)
//****


    /*
    * Date Format 1.2.3
    * (c) 2007-2009 Steven Levithan <stevenlevithan.com>
    * MIT license
    *
    * Includes enhancements by Scott Trenda <scott.trenda.net>
    * and Kris Kowal <cixar.com/~kris.kowal/>
    *
    * Accepts a date, a mask, or a date and a mask.
    * Returns a formatted version of the given date.
    * The date defaults to the current date/time.
    * The mask defaults to dateFormat.masks.default.
    */

var dateFormat = function () {
    var token = /d{1,4}|m{1,4}|yy(?:yy)?|([HhMsTt])\1?|[LloSZ]|"[^"]*"|'[^']*'/g,
		timezone = /\b(?:[PMCEA][SDP]T|(?:Pacific|Mountain|Central|Eastern|Atlantic) (?:Standard|Daylight|Prevailing) Time|(?:GMT|UTC)(?:[-+]\d{4})?)\b/g,
		timezoneClip = /[^-+\dA-Z]/g,
		pad = function (val, len) {
		    val = String(val);
		    len = len || 2;
		    while (val.length < len) {
		        val = "0" + val;
		    }
		    return val;
		};

    // Regexes and supporting functions are cached through closure
    return function (date, mask, utc) {
        var dF = dateFormat;

        // You can't provide utc if you skip other args (use the "UTC:" mask prefix)
        if (arguments.length == 1 && Object.prototype.toString.call(date) == "[object String]" && !/\d/.test(date)) {
            mask = date;
            date = undefined;
        }

        // Passing date through Date applies Date.parse, if necessary
        date = date ? new Date(date) : new Date;
        if (isNaN(date)) {
            throw SyntaxError("invalid date");
        }

        mask = String(dF.masks[mask] || mask || dF.masks["default"]);

        // Allow setting the utc argument via the mask
        if (mask.slice(0, 4) == "UTC:") {
            mask = mask.slice(4);
            utc = true;
        }

        var _ = utc ? "getUTC" : "get",
			d = date[_ + "Date"](),
			D = date[_ + "Day"](),
			m = date[_ + "Month"](),
			y = date[_ + "FullYear"](),
			H = date[_ + "Hours"](),
			M = date[_ + "Minutes"](),
			s = date[_ + "Seconds"](),
			L = date[_ + "Milliseconds"](),
			o = utc ? 0 : date.getTimezoneOffset(),
			flags = {
			    d: d,
			    dd: pad(d),
			    ddd: dF.i18n.dayNames[D],
			    dddd: dF.i18n.dayNames[D + 7],
			    m: m + 1,
			    mm: pad(m + 1),
			    mmm: dF.i18n.monthNames[m],
			    mmmm: dF.i18n.monthNames[m + 12],
			    yy: String(y).slice(2),
			    yyyy: y,
			    h: H % 12 || 12,
			    hh: pad(H % 12 || 12),
			    H: H,
			    HH: pad(H),
			    M: M,
			    MM: pad(M),
			    s: s,
			    ss: pad(s),
			    l: pad(L, 3),
			    L: pad(L > 99 ? Math.round(L / 10) : L),
			    t: H < 12 ? "a" : "p",
			    tt: H < 12 ? "am" : "pm",
			    T: H < 12 ? "A" : "P",
			    TT: H < 12 ? "AM" : "PM",
			    Z: utc ? "UTC" : (String(date).match(timezone) || [""]).pop().replace(timezoneClip, ""),
			    o: (o > 0 ? "-" : "+") + pad(Math.floor(Math.abs(o) / 60) * 100 + Math.abs(o) % 60, 4),
			    S: ["th", "st", "nd", "rd"][d % 10 > 3 ? 0 : (d % 100 - d % 10 != 10) * d % 10]
			};

        return mask.replace(token, function ($0) {
            return $0 in flags ? flags[$0] : $0.slice(1, $0.length - 1);
        });
    };
} ();

    // Some common format strings
    dateFormat.masks = {
        "default": "ddd mmm dd yyyy HH:MM:ss",
        shortDate: "m/d/yy",
        mediumDate: "mmm d, yyyy",
        longDate: "mmmm d, yyyy",
        fullDate: "dddd, mmmm d, yyyy",
        shortTime: "h:MM TT",
        mediumTime: "h:MM:ss TT",
        longTime: "h:MM:ss TT Z",
        isoDate: "yyyy-mm-dd",
        isoTime: "HH:MM:ss",
        isoDateTime: "yyyy-mm-dd'T'HH:MM:ss",
        isoUtcDateTime: "UTC:yyyy-mm-dd'T'HH:MM:ss'Z'"
    };

    // Internationalization strings
    dateFormat.i18n = {
        dayNames: [
		"Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat",
		"Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"
	],
        monthNames: [
		"Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec",
		"January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"
	]
    };

    // For convenience...
    Date.prototype.format = function (mask, utc) {
        return dateFormat(this, mask, utc);
    };
﻿

function HashMap() {
    this.IndexerArray = null; //holds an object {key, value}
    this.HashArray = null;

    this.Init = function () {
        this.IndexerArray = [];
        this.HashArray = {};
    };

    this.Add = function (strKeyID, objValue) {
        //check if already exists
        if (!this.Contains(strKeyID)) {
            strKeyID = legalizeHashKey(strKeyID);

            //add to the indexers array to the last place
            this.IndexerArray.push({ key: strKeyID, value: objValue });

            //add to the hash array per component id
            this.HashArray[strKeyID] = objValue;
        }
    };

    this.Insert = function (iIndex, strKeyID, objValue) {
        if (!this.Contains(strKeyID)) {
            strKeyID = legalizeHashKey(strKeyID);

            //add to the indexers array to the iIndex place
            this.IndexerArray.splice(iIndex, 0, { key: strKeyID, value: objValue });

            //add to the hash array per component id
            this.HashArray[strKeyID] = objValue;
        }
    };

    this.Replace = function (strKeyID, objValue) {
        if (this.Contains(strKeyID)) {
            strKeyID = legalizeHashKey(strKeyID);

            //replace the indexers array in the same place
            for (var i = 0; i < this.IndexerArray.length; i++) {
                if (this.IndexerArray[i].key == strKeyID) {
                    this.IndexerArray.splice(i, 1, { key: strKeyID, value: objValue });
                    break;
                }
            }

            //replace the hash array per component id
            this.HashArray[strKeyID] = objValue;
        }
        else {
            this.Add(strKeyID, objValue);
        }
    };

    this.Remove = function (strKeyID) {
        if (this.Contains(strKeyID)) {
            strKeyID = legalizeHashKey(strKeyID);

            //remove from indexer array
            for (var i = 0; i < this.IndexerArray.length; i++) {
                if (this.IndexerArray[i].key == strKeyID) {
                    this.IndexerArray.splice(i, 1);
                    break;
                }
            }

            //remove from hash
            delete this.HashArray[strKeyID];
        }
    };

    this.GetByIndex = function (iIndex) {
        return this.IndexerArray[iIndex] ? this.IndexerArray[iIndex].value : null;
    };

    this.GetKeyByIndex = function (iIndex) {
        return this.IndexerArray[iIndex] ? this.IndexerArray[iIndex].key : null;
    };

    this.GetByID = function (strKeyID) {
        if (!strKeyID) return null;
        strKeyID = legalizeHashKey(strKeyID);
        return (strKeyID in this.HashArray) ? this.HashArray[strKeyID] : null;
    };

    this.Contains = function (strKeyID) {
        if (!strKeyID) return false;
        strKeyID = legalizeHashKey(strKeyID);
        return strKeyID in this.HashArray;
    };

    this.Count = function () {
        return this.IndexerArray.length;
    };

    var legalizeHashKey = function (strKeyID) {
        strKeyID = strKeyID.toString();
        strKeyID = strKeyID.toUpperCase();

        return strKeyID;
    };

    this.Clear = function () {
        this.Init();
    };

    this.GetKeysArray = function () {
        var ansArr = new Array();
        for (var j = 0; j < this.IndexerArray.length; j++) {
            ansArr.push(this.IndexerArray[j]["key"])
        }
        return ansArr;
    };

    this.GetValuesArray = function () {
        var ansArr = new Array();
        for (var j = 0; j < this.IndexerArray.length; j++) {
            ansArr.push(this.IndexerArray[j]["value"])
        }
        return ansArr;
    };
    this.Init();
};
//****  Filename: general.js
//****  FilePath: main/js/utils
//****
//****  Author: Everybody
//****  Date: 20.2.11
//****  Class Name: General Utils
//****  Description: Various general common utilities
//****
//****  Copyright: Realcommerce & Conduit.
//****

conduit.register("utils.general", new function () {

    // Description: the uri method check if it's a valid url external (WWW) or internal (chrome-extension) (PUBLIC)
    // it can get 'full' for both and network just WWW
    // Param : Url a string of the question url
    //         type the type of the validations
    // Example : chrome-extension://nnogjnbecgcgekeobeaeoffiejbhckdj/js/items/multiRssitem/view/multiRssitem.html
    //              http://www.test.com
    var uri = function (strUrl) {
        if (strUrl.indexOf("javascript:") == 0) {
            return true;
        }
        if (strUrl.indexOf("chrome-extension://") == 0) {
            return true;
        }
        else if (strUrl == "about:blank") {
            return true;
        }

        // trim left space
        strUrl = strUrl.replace(/^\s+|\s+$/g, "");

        //strUrl = decodeURI(strUrl);

        var networkRegx = "(^https?|chrome\-extension|ftp)\\://[a-zA-Z0-9\\-\\.]+\\.?[a-zA-Z]{2,3}(/\\S*)?$";

        var networkRegxUrl = new RegExp(networkRegx);

        if (networkRegxUrl.test(strUrl)) {
            return true;
        } else {
            var err = "utils.general.uri(strUrl): The URL: " + strUrl + " - failed RegExp testing!";
            return false;
        }
    };

    // Description: the checkStringParams method check validation of query string parameters (PUBLIC)
    // Param : strParams a string of the question query string
    //Example : name=value&something=123
    var checkStringParams = function (strParams) {


        strParams = decodeURI(strParams);

        // trim left space
        strParams = strParams.replace(/^\s+|\s+$/g, "");

        var keyValueRegx = "^([0-9a-zA-Z]+=[-0-9a-zA-Z_:@&?=+,.!/~+$%]*&{0,1})*"; //"[^(\&)](\w*)+(\=)[\w\d ]*"

        var keyValueRegxUrl = new RegExp(keyValueRegx);

        if (keyValueRegxUrl.test(strParams)) {
            return true;
        } else {
            var err = "utils.general.checkStringParams(strParams): The params: " + strParams + " - failed RegExp testing!";
            return false;
        }
    };

    // Description: Adds http:// to a url if it doesn't exist at the begining of the url (to conform with FF, IE, and users which forget http...) + (PUBLIC)
    // Trims trailing and leading whitespaces from a url.
    // if https, ftp or chrome-extension exist, leaves them.
    // Param : url to add http:// to 
    // Example : addHTTPToUrl('www.yahoo.com') will return 'http://www.yahooo.com'
    var addHTTPToUrl = function (url) {
        var urlStartRegx = "(^https?|chrome\-extension|ftp)\\://";
        var myRegxUrl = new RegExp(urlStartRegx);

        // Trimming url leading and trailing spaces.
        var finalUrl = url.replace(/^\s+|\s+$/g, "");

        // If no http, https, ftp etc. exists in url
        if (!myRegxUrl.test(url)) {
            finalUrl = 'http://' + finalUrl;
        }

        return finalUrl;
    }

    // Description: the diractory name of the extension for repository usage;
    var dirName = function () { return chrome.i18n.getMessage("@@extension_id"); };

    var getBaseUrl = function (strURL, removeProtocol) {
        //get the protocol in the first cell in the array - 
        //and the url (till the query string) in the second cell of the array
        var arrMatches = strURL.match(/^(http:\/\/|https:\/\/|ftp:\/\/)?([^\/^\?^:]+)/i);
        var strProtocol = '';
        var strBaseUrl = '';

        if (arrMatches) {
            strProtocol = arrMatches[1];
            strBaseUrl = arrMatches[2];

            if (strProtocol && !removeProtocol) {
                strBaseUrl = strProtocol + strBaseUrl;
            }
        }

        if (!strBaseUrl) {
            strBaseUrl = strURL;
        }

        return strBaseUrl;
    };

    var getTopLevelDomainName = function (strUrl, bIsWithExtension) {
        var strExtension = '';
        var strBaseUrl = getBaseUrl(strUrl);
        strBaseUrl = strBaseUrl.replace("http://", "");
        var iLast = strBaseUrl.lastIndexOf(".");
        strExtension = strBaseUrl.substring(iLast);
        strBaseUrl = strBaseUrl.substring(0, iLast);
        iLast = strBaseUrl.lastIndexOf(".");

        var strPotential = strBaseUrl.substring(iLast + 1);

        if (strPotential != "com" && strPotential != "co" && strPotential != "org" && strPotential != "gov" && strPotential != "net")
            strBaseUrl = strPotential;
        else {
            strExtension = strPotential + '.' + strExtension;
            iLast = strBaseUrl.lastIndexOf(".");
            strBaseUrl = strBaseUrl.substring(0, iLast);
            iLast = strBaseUrl.lastIndexOf(".");
            strBaseUrl = strBaseUrl.substring(iLast + 1);

            if (!strBaseUrl)
                strBaseUrl = strPotential;
        }

        if (!strBaseUrl) {
            // incase this is a non standard url
            strBaseUrl = strUrl;
        }

        if (bIsWithExtension)
            return strBaseUrl + strExtension;
        else
            return strBaseUrl;
    };

    var clone = function (data) {
        if (!data || typeof data != "object")
            return data;
        /* using inArray to overcome chrome instanceof Array issue*/
        var newObj = (data instanceof Array || (Array.isArray && Array.isArray(data))) ? [] : {};
        for (i in data) {

            if (data[i] && typeof data[i] == "object") {
                newObj[i] = clone(data[i]);
            }
            else {
                newObj[i] = data[i];
            }
        }
        return newObj;
    };



    return {
        uri: uri,
        checkStringParams: checkStringParams,
        addHTTPToUrl: addHTTPToUrl,
        dirName: dirName,
        getBaseUrl: getBaseUrl,
        getTopLevelDomainName: getTopLevelDomainName,
        clone: clone
    };
});

var General = conduit.utils.general;

﻿

/**
* @fileOverview:  this function gets 2 versions to compare in the format of 10.2.4.24 
    as well as test type for max version and min version.
* FileName: compareVersions.js
* FilePath: ..Common\Utils\Dev\src\main\js\utils\compareVersions.js
* Date: 23/11/2011 
* Copyright: 
*/
conduit.register("utils.compareVersions", function (currentVersion, versionToCheck, testType) {

    var result;

    var currVersionArr = currentVersion.split(".");
    var versionToCheckArr = versionToCheck.split(".");

    //loop over the currentVersion array.
    for (var i = 0; i < currVersionArr.length; i++) {
        var currVersionElem = currVersionArr[i];

        //check if we have something in the versionToCheck array in the same position.
        if (versionToCheckArr[i]) {
            var versionToCheckElem = versionToCheckArr[i];

            if (testType === 'max') {

                //if the the current element in the current version is bigger than 
                //the the current element in the versionToCheck array, the versionToCheck failed the test. 
                if (parseInt(currVersionElem) > parseInt(versionToCheckElem)) {
                    result = false;
                    break;
                }

                //if the the current element in the current version is smaller than 
                //the the current element in the versionToCheck array, the versionToCheck passed the test. 
                else if (parseInt(currVersionElem) < parseInt(versionToCheckElem)) {
                    result = true;
                    break;
                }

            }

            else if (testType === 'min') {

                if (parseInt(currVersionElem) < parseInt(versionToCheckElem)) {
                    result = false;
                    break;
                }
                else if (parseInt(currVersionElem) > parseInt(versionToCheckElem)) {
                    result = true;
                    break;
                }
            }
        }
        else {

            //there are more elements in the currentVersion array than in the versionToCheck array, so the test fails.
            //check no 0;
            if (testType === 'max') {
                if (currVersionElem !== 0) {
                    result = false;
                }
            }
            else if (testType === 'min') {
                result = true;
            }

            break;
        }
    }

    if (testType === 'min') {

        //the loop is done. but we have more elements in the versionToCheck array we need to check if not equal to zero.
        if (versionToCheckArr.length > currVersionArr.length && result === undefined) {
            if (versionToCheckArr[currVersionArr.length] !== 0) {
                result = false;
            }
        }
    }
    else if (testType === 'max') {
        if (result === undefined) {
            result = true;
        }
    }

    return result;

});


