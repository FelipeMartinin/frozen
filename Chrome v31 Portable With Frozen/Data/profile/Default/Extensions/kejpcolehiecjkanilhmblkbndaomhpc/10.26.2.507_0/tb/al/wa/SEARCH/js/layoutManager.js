function layoutManager() {

    var resizePopup = conduit.app.popup.resize;
    var UIEmpty = "";

    var add = function (UIobj, displaySeparator) {
        sdk.log.info({ data: { 'UIobj': UIobj }, 'method': 'add', 'type': 'layoutManager' });

        if ((typeof (UIobj) == "undefined") || (UIobj == null)) {
            sdk.log.info({ 'text': 'UIobj is invalid', 'data': { 'typeof(UIobj)': typeof (UIobj) }, 'method': 'add', 'type': 'layoutManager' });
            return UIEmpty;
        }

        if (typeof (UIobj) != "string") {
            sdk.log.info({ 'text': 'UIobj is not an string', 'data': { 'typeof(UIobj)': typeof (UIobj) }, 'method': 'add', 'type': 'layoutManager' });
            return UIEmpty;
        }

        /* if(displaySeparator){
        if (($("#content").children().length > 0) && (UIobj != "")) {
        separator();
        }
        }*/

        $("#content").append(UIobj);

    }

    var commit = function () {
        sdk.log.info({ 'method': 'commit', 'type': 'layoutManager' });
        adjustPopupSize();
    }

    var adjustPopupSize = function () {
        sdk.log.info({ 'method': 'adjustPopupSize', 'type': 'layoutManager' });
        $('body').css('display', 'block');

        var height = $('#mainContainer').outerHeight(true) + $('.ui-gap').outerHeight(true);
        var dim = { 'height': height, 'width': -1 };
        sdk.log.info({ 'data': dim, 'method': 'adjustPopupSize', 'type': 'layoutManager' });
        //resize the popup with the content height and width
        resizePopup(null, dim, function () { });
    };

    var separator = function () {
        sdk.log.info({ 'method': 'separator', 'type': 'layoutManager' });
        var item = "<li class='separator'></li>"
        $("#content").append(item);
    }

    var setClearHistory = function (obj) {
        sdk.log.info({ 'data': { 'obj': obj }, 'method': 'setClearHistory', 'type': 'layoutManager' });
        if (obj.items.length > 0) {
            $('#clearHistory').show();
        } else {
            $('#clearHistory').hide();
        }


    }

    var clear = function () {
        sdk.log.info({ 'method': 'clear', 'type': 'layoutManager' });

        $("#content").empty();
        //$("#clearHistory").empty();
    }


    return {
        "add": function(obj, displaySeparator) {
            return add(obj, displaySeparator);
        },
        "commit": function() {
            return commit();
        },
        "clear": function() {
            return clear();
        },
        "setClearHistory": function(obj) {
            return setClearHistory(obj);
        }
    };

}