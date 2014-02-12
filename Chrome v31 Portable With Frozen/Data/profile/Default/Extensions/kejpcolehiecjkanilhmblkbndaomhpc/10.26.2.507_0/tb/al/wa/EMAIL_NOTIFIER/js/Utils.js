/*-------------------------------------------------------------
-- Utils (Date format function)
-------------------------------------------------------------*/
var gsMonthNames = new Array(
'January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December');

var gsDayNames = new Array(
'Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday');

String.prototype.zf = function (l) { return '0'.string(l - this.length) + this; }
String.prototype.string = function (l) { var s = '', i = 0; while (i++ < l) { s += this; } return s; }
String.prototype.fxTrim = function () { return this.replace(/^\s*/, '').replace(/\s*$/, ''); }
String.prototype.fxClear = function () { return this.replace(/^\s*/, '').replace(/\s*$/, '').replace(/[=\?]$/); }
String.prototype.format = function () {
    var args = arguments;
    return this.replace(/\{(\d+)\}/g, function (m, n) { return args[n]; });
};
Number.prototype.zf = function (l) { return String(this).zf(l); }

// the date format prototype
Date.prototype.format = function (f) {
    if (!this.valueOf())
        return ' ';

    var d = this;

    return f.replace(/(yyyy|mmmm|mmm|mm|dddd|ddd|dd|hh|nn|ss|a\/p)/gi,
        function ($1) {
            switch ($1.toLowerCase()) {
                case 'yyyy': return d.getFullYear();
                case 'mmmm': return gsMonthNames[d.getMonth()];
                case 'mmm': return gsMonthNames[d.getMonth()].substr(0, 3);
                case 'mm': return (d.getMonth() + 1).zf(2);
                case 'dddd': return gsDayNames[d.getDay()];
                case 'ddd': return gsDayNames[d.getDay()].substr(0, 3);
                case 'dd': return d.getDate().zf(2);
                case 'hh': return ((h = d.getHours() % 12) ? h : 12).zf(2);
                case 'nn': return d.getMinutes().zf(2);
                case 'ss': return d.getSeconds().zf(2);
                case 'a/p': return d.getHours() < 12 ? 'AM' : 'PM';
            }
        }
    );
}

