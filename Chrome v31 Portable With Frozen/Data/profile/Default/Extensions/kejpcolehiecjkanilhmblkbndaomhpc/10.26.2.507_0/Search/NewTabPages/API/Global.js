if (!String.formatStr) {
   String.prototype.formatStr = function () {
      var str = this, i = arguments.length;
      while (i--)
         str = str.replace(new RegExp('\\{' + i + '\\}', 'gm'), arguments[i]);

      return str;
   };
    }

    String.prototype.trimQuotes = function () {
   return this.replace(/^"*/, "").replace(/"*$/, "");
};

function now() {
    var a = new Date(); return a.getHours() + ":" + a.getMinutes() + ":" + a.getSeconds() + ":" + a.getMilliseconds();
}

function getResource(resourceUrl, resourceTimeout, randomizeUrl, dataType) {
   var result = null;
   try {
       if (randomizeUrl) {
           resourceUrl = resourceUrl + (resourceUrl.indexOf("?") > 0 ? "&" : "?") + "rand=" + Math.random();
       }
      $.ajax({
         type: "GET",
         url: resourceUrl,
         async: false,
         dataType: dataType,
         timeout:resourceTimeout,
         success: function (res) {
            result = res;
         },
         error: function (jqXHR, message, errorThrown) {
            console.log(jqXHR.statusText +" "+ jqXHR.status );
         }

      });
   } catch(e) {
      exceptionHandler(e, getLineInfo());
   }
   return result;
}


var lscache = {};

function ls(a, d, clearObject) {
   if (d != void 0) {
      localStorage.setItem(a, JSON.stringify(d)), lscache[a] = JSON.parse(JSON.stringify(d));
      return d;
   }
   else {

      if (clearObject == true) {
         lscache[a] = null;
         localStorage.removeItem(a);
         return null;
      }
      if (lscache[a] != void 0) return lscache[a];
      try {
         return lscache[a] = JSON.parse(localStorage.getItem(a)), lscache[a];
      } catch (b) {
      }
      return null;
   }
}

// Get the value of a parameter from the page's hash.
// Example: If page's hash is "#foo=bar", getHashVar('foo') will return 'bar'
function getHashVar(varName) {
   var hash = window.location.hash.substr(1);
   var pieces = explode("&", hash);
   for (var p in pieces) {
      if (explode("=", pieces[p])[0] == varName) {
         return urldecode(explode("=", pieces[p])[1]);
      }
   }
   return '';
}

// http://phpjs.org/functions/explode:396
function explode(delimiter, string, limit) {
   var emptyArray = {
      0: ''
   };

   // third argument is not required
   if (arguments.length < 2 || typeof arguments[0] == 'undefined' || typeof arguments[1] == 'undefined') {
      return null;
   }

   if (delimiter === '' || delimiter === false || delimiter === null) {
      return false;
   }

   if (typeof delimiter == 'function' || typeof delimiter == 'object' || typeof string == 'function' || typeof string == 'object') {
      return emptyArray;
   }

   if (delimiter === true) {
      delimiter = '1';
   }

   if (!limit) {
      return string.toString().split(delimiter.toString());
   } else {
      // support for limit argument
      var splitted = string.toString().split(delimiter.toString());
      var partA = splitted.splice(0, limit - 1);
      var partB = splitted.join(delimiter.toString());
      partA.push(partB);
      return partA;
   }
}


// http://phpjs.org/functions/str_replace:527
function str_replace(search, replace, subject, count) {
   var i = 0,
      j = 0,
      temp = '',
      repl = '',
      sl = 0,
      fl = 0,
      f = [].concat(search),
      r = [].concat(replace),
      s = subject,
      ra = Object.prototype.toString.call(r) === '[object Array]',
      sa = Object.prototype.toString.call(s) === '[object Array]';
   s = [].concat(s);
   if (count) {
      this.window[count] = 0;
   }

   for (i = 0, sl = s.length; i < sl; i++) {
      if (s[i] === '') {
         continue;
      }
      for (j = 0, fl = f.length; j < fl; j++) {
         temp = s[i] + '';
         repl = ra ? (r[j] !== undefined ? r[j] : '') : r[0];
         s[i] = (temp).split(f[j]).join(repl);
         if (count && s[i] !== temp) {
            this.window[count] += (temp.length - s[i].length) / f[j].length;
         }
      }
   }
   return sa ? s : s[0];
}





// http://phpjs.org/functions/number_format:481
function number_format(number, decimals, dec_point, thousands_sep) {
   // Strip all characters but numerical ones.
   number = (number + '').replace(/[^0-9+\-Ee.]/g, '');
   var n = !isFinite(+number) ? 0 : +number,
        prec = !isFinite(+decimals) ? 0 : Math.abs(decimals),
        sep = (typeof thousands_sep === 'undefined') ? ',' : thousands_sep,
        dec = (typeof dec_point === 'undefined') ? '.' : dec_point,
        s = '',
        toFixedFix = function (n, prec) {
         var k = Math.pow(10, prec);
         return '' + Math.round(n * k) / k;
        };
   // Fix for IE parseFloat(0.55).toFixed(0) = 0;
   s = (prec ? toFixedFix(n, prec) : '' + Math.round(n)).split('.');
   if (s[0].length > 3) {
      s[0] = s[0].replace(/\B(?=(?:\d{3})+(?!\d))/g, sep);
   }
   if ((s[1] || '').length < prec) {
      s[1] = s[1] || '';
      s[1] += new Array(prec - s[1].length + 1).join('0');
   }
   return s.join(dec);
}

// http://phpjs.org/functions/urldecode:572
// Modified to catch malformed URI errors
function urldecode(str) {
   try {
      return decodeURIComponent((str + '').replace(/\+/g, '%20'));
   } catch (e) {
      console.log(e);
      if (e.message) {
         return 'Error: ' + e.message;
      } else {
         return 'Error: Unable to decode URL';
      }
   }
}

// errorHandler catches errors when SQL statements don't work.
// transaction contains the SQL error code and message
// lineInfo contains contains the line number and filename for where the error came from
function errorHandler(transaction, lineInfo) {
   if (transaction.message) {
      var code = '';
      switch (transaction.code) {
         case 1:
            code = "database";
            break;
         case 2:
            code = "version";
            break;
         case 3:
            code = '"too large"';
            break;
         case 4:
            code = "quota";
            break;
         case 5:
            code = "syntax";
            break;
         case 6:
            code = "constraint";
            break;
         case 7:
            code = "timeout";
            break;
         default: // case 0:
            break;
      }
      var errorMsg = 'SQL ' + code + ' error: "' + transaction.message + '"';
      logError(errorMsg, lineInfo.file, lineInfo.line);
   } else {
      logError('Generic SQL error (no transaction)', lineInfo.file, lineInfo.line);
   }
}

function exceptionHandler(exception, lineInfo) {

   var errorMsg = 'Exception (Message:' + exception.message + ')';
   logError(errorMsg, lineInfo.file, lineInfo.line);
}

// http://phpjs.org/functions/strstr:551
function strstr(haystack, needle, bool) {
   var pos = 0;

   haystack += '';
   pos = haystack.indexOf(needle);
   if (pos == -1) {
      return false;
   } else {
      if (bool) {
         return haystack.substr(0, pos);
      } else {
         return haystack.slice(pos);
      }
   }
}

// https://github.com/kvz/phpjs/raw/master/functions/strings/implode.js
function implode(glue, pieces) {
    var i = '',
        retVal = '',
        tGlue = '';
    if (arguments.length === 1) {
        pieces = glue;
        glue = '';
    }
    if (typeof (pieces) === 'object') {
        if (Object.prototype.toString.call(pieces) === '[object Array]') {
            return pieces.join(glue);
        } else {
            for (i in pieces) {
                retVal += tGlue + pieces[i];
                tGlue = glue;
            }
            return retVal;
        }
    } else {
        return pieces;
    }
}
