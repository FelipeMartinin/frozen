//var toolbarAndAppSettingsObj = null;
//function initObj() {
var toolbarAndAppSettingsObj = function () {

    var arrObj = [];
    var perAppSettings = function (appName, state, timesAday, imageUrl) {


        if (!appName) {
            this.appName = 3;
        }
        else {
            this.appName = appName;
        }


        if (!state) {
            this.state = 0;
        }
        else {
            this.state = state;
        }

        if (!timesAday) {
            this.timesAday = 3;
        }
        else {
            this.timesAday = timesAday;
        }


        if (!imageUrl) {
            this.imageUrl = "none";
        }
        else {
            this.imageUrl = imageUrl;
        }
    };

    function getArrayFromFile() {
        try {
            conduit.storage.global.items.get("NotificationSettings", function (str) {
                var arr = JSON.parse(str);
                fillHtml(arr);
            });
        }
        catch (e) {
        }


    }

    function writeSettingsAtClose() {
        for (var i = 0; i < arr.length; i++) {
            try {
                var ddl = document.getElementById("Select" + i);

                var selectedIndex = ddl.selectedIndex;
                var str = ddl.options[selectedIndex].text;
                
               
            }
            catch (e) {
                continue;
            }
        }
    }


    function fillHtml(arrObjApps) {
        var mainDiv = document.getElementById('txtDiv');

        for (var i = 0; i < arrObjApps.length; i++) {

            var div = document.createElement('div');
            div.setAttribute("class", "bottomBorder");
            var appName = document.createElement('div');
            if (arrObjApps[i].channelLogo != "none") {

                var imgDiv = document.createElement('div');
                var img = document.createElement('img');
                img.src = arrObjApps[i].channelLogo;
                imgDiv.appendChild(img);
                imgDiv.setAttribute("class", "image left");
                appName.appendChild(imgDiv);
            }

            var txtDiv = document.createElement('div');
            txtDiv.setAttribute("class", "txtAppName");
            txtDiv.innerHTML = arrObjApps[i].channelName;
            appName.appendChild(txtDiv);
            appName.setAttribute("class", "left appName");

            div.appendChild(appName);

            var DDLdiv = document.createElement('div');
            DDLdiv.setAttribute("class", "ddl left");
            var html = '<select id="Select' + i + '" class="combo"> <option value="0">Show all from this app</option><option value="1">Show Badge only</option> <option value="2">Don’t show</option>';
            if (arrObjApps[i].timesAday != 3) {
                html += '<option value="3">Show Times a day</option></select>';
                DDLdiv.innerHTML = html;
                var step = document.createElement('div');
                step.setAttribute("class", "step right");
                step.setAttribute("id", "step" + i);

                step.innerHTML = stepperHTML;
                DDLdiv.appendChild(step);
            }
            else {
                html += '</select>';
                DDLdiv.innerHTML = html;

            }

            div.appendChild(DDLdiv);

            mainDiv.appendChild(div);
        }

    }


    return {

        init: function () {
            getArrayFromFile();
        }

    };

} ();

//}