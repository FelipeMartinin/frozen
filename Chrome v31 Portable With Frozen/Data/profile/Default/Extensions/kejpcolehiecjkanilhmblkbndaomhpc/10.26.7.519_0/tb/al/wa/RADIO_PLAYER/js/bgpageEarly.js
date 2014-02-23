if (window.ActiveXObject) //IE
    document.write('<object id="contentPlayer" classid="CLSID:6BF52A52-394A-11d3-B153-00C04F79FAA6" SendPlayStateChangeEvents="true" width="1" height="1"></object>');
else if (window.chrome) //chrome
    document.write('<object id="contentPlayer" type="conduit-application/x-ms-wmp" SendPlayStateChangeEvents="true" width="1" height="1"></object>');
else //firefox
    document.write('<object id="contentPlayer" type="application/x-ms-wmp" SendPlayStateChangeEvents="true" width="1" height="1"></object>');                  