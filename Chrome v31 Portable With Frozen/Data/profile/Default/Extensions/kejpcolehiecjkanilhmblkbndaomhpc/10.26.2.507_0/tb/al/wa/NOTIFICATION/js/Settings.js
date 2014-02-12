
function init() {
    var phStepper = document.getElementById('phStepper');
    if (phStepper) {
        phStepper.innerHTML = stepperHTML;
    }
    settings.init();
}

window.onload = init;

var settings = function () {
    var div = null;
    var label = null;
    var input = null;
    var array = null;
    var val = null;
    var id;

    function asyncCallback(arr) {
        array = arr;
        for (var i = 0; i < array.length; i++) {
            if (array[i].channelId == id) {
                continue;
            }
            div = document.createElement('div');
            div.setAttribute('class', 'check input');
            document.getElementById('items').appendChild(div);
            input = document.createElement('input');
            input.setAttribute('type', 'checkbox');
            input.setAttribute('id', 'checkbox_' + array[i].channelName);
            if (array[i].rule == "always" || array[i].rule == "timeAday") {
                input.setAttribute('checked', 'checked');
            }

            div.appendChild(input);
            label = document.createElement('label');
            label.setAttribute('for', 'checkbox_' + array[i].channelName);
            label.innerHTML = "Feeds from " + array[i].channelName;
            div.appendChild(label);
        }

    }

    function callbackForOpener(app) {
        switch (app.rule) {
            case "always":
                $("#always").attr("checked", 'checked');
                break;
            case "timeAday":
                $("#timeAday").attr("checked", 'checked');
                $(".ui-stepper-textbox").val(app.timeAday);
                break;
            case "never":
                $("#never").attr("checked", 'checked');
                break;
        }
    }

    function getRadioValue() {
        return $('input[name=show]:checked')[0].id;
    }

    function callbackSet(app) {
        app.rule = val;
        if (val == "timeAday") {
            var time = $(".ui-stepper-textbox").val();
        }

        notificationSettings.updateChannel(app.channelId, app.rule, time, null, 0, null, null);

    }

    function callbackSetAll(arr) {
        $('input:checkbox').each(function (i) {
            var str = $(this).attr("id");

            str = str.substring(str.indexOf("_") + 1);
            for (var i = 0; i < arr.length; i++) {
                if (arr[i].channelName == str) {
                    if ($(this).attr("checked") == true) {
                        arr[i].rule = "always";
                    }
                    else {
                        arr[i].rule = "never";
                    }
                    setTimeout(function () { SetOne(arr[i].channelId, arr[i].rule) }, 1000);
                    break;
                }
            }
        });
        conduit.app.popup.close(null);
    }

    function SetOne(_channelId, _rule) {
        notificationSettings.updateChannel(_channelId, _rule, null, null, 0, null, null);
    }

    function bindHandlers() {
        $('.js-cancel').click(function () {
            settings.cancel();
        });

        $('.js-ok').click(function () {
            settings.OK();
        });

        $('.ui-stepper-plus').click(function () {
            $('.ui-stepper-textbox').val(Math.min($('.ui-stepper-textbox').val() - 0 + 1, 9));
        });

        $('.ui-stepper-minus').click(function () {
            $('.ui-stepper-textbox').val(Math.max($('.ui-stepper-textbox').val() - 1, 1));
        });
    }

    return {
        init: function () {
            id = window.location.search.substring(4).split('&')[0];
            notificationSettings.reloadSettings(function () {
                notificationSettings.getChannelSettings(id, callbackForOpener);
                notificationSettings.getAllChannels(asyncCallback);
            });
            bindHandlers();
        },

        OK: function () {
            val = getRadioValue();
            notificationSettings.getChannelSettings(id, callbackSet);
            notificationSettings.getAllChannels(callbackSetAll);
            conduit.messaging.sendRequest("popup", "settingsWinClose", "test");
        },
        cancel: function () {
            conduit.messaging.sendRequest("popup", "settingsWinClose", "test");
            conduit.app.popup.close(null);
        }
    };
} ();