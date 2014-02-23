(function () {
    var background;
    if (/chrome/i.test(navigator.userAgent)) {
        background = "#E1E1E1";
        document.documentElement.style.backgroundColor = background;
    }
    else if (/firefox/i.test(navigator.userAgent)) {
        try {
            var arr = (navigator.userAgent).split("Firefox/");
            var ffVersion = parseFloat(arr[1]),
	        osVersion = navigator.oscpu;
            //windows 7 +Vista
            if (~["NT 6.1", "Windows NT 6.1", "Windows NT 6.1; WOW64", "Windows NT 6.0", "NT 6.0"].indexOf(osVersion)) {
                background = ffVersion >= 2 ? ffVersion >= 14 ? "#DDEBF9" : "hsl(214,44%,87%)" : ffVersion === 1.9 ? "#d3daed" : "-moz-dialog";
            }
            else { //win8+ XP
                if (~["NT 6.2", "Windows NT 6.2", "Windows NT 6.2; WOW64"].indexOf(osVersion)) { //win8
                    background = "#DEEAF7";
                } else { //XP
                    background = "#ECE9D8";
                }
            }
        }
        catch (e) {

        }
    }

    document.documentElement.style.background = background;
})();

window["initStartTime"] = +new Date();