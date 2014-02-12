
var tabs = [{ name: "Predefined Components", url: "components.html", title: "Manage Toolbar Predefined Components", subtitle: "Select which components to show on your toolbar and configure their settings." },
 { name: "My Apps", url: "apps.html", title: "Manage My Toolbar Apps", subtitle: "Select which components to show on your toolbar and configure their settings." }, { name: "Search", url: "search.html", title: "Search" }, { name: "Notifications", url: "notifications.html", title: "Notifications" },
 { name: "Advanced Settings", url: "advanced.html", title: "Advanced Settings" }, { name: "About", url: "about.html", title: "About"}];

var TABINDEX_COMPONENTS = 0;
var TABINDEX_APPS = 1;
var TABINDEX_SEARCH = 2;
var TABINDEX_NOTIFICATIONS = 3;
var TABINDEX_ADVANCED = 4;
var TABINDEX_ABOUT = 5;
var LIMIT_DAILY_NOTIFICATIONS_VALUE = 2;
var options = [{ text: "Show All from this source", value: 0 }, { text: "Show badge only", value: 1 }, { text: "Limit daily notifications to", value: LIMIT_DAILY_NOTIFICATIONS_VALUE }, { text: "Don't show", value: 3}];
var optionsHTML = "";
var notificationsArr = [];
var selectedOptions = [];


var stepperHTML = '<span id="ns" class="ui-stepper step"><input type="text" name="ns_textbox" size="2" autocomplete="off" class="ui-stepper-textbox" value=1 />' +
	'<button type="submit" name="ns_button_1" class="ui-stepper-plus"></button><button type="submit" name="ns_button_2" class="ui-stepper-minus"></button></span>';

function createOptionsHTML() {
    var str = [];
    str[str.length] = "<select class='combo'>";
    for (var i = 0; i < options.length; i++) {
        str[str.length] = "<option value='";
        str[str.length] = options[i].value;
        str[str.length] = "'>";
        str[str.length] = options[i].text;
    }
    str[str.length] = "</select>";
    optionsHTML = str.join("");
}
function loadNotificationsArr() {
    notificationsArr = [{ img: "./img/icon.png", name: "Tweet notification ", description: "this is the desc for the component" }, { img: "./img/icon.png", name: "Tweet happy notification", description: "this is the desc for the component" }, { img: "./img/icon.png", name: "Bobo ", description: "this is the desc for the component"}];
}

 var selectedTab = 0;

function getTabsHTML(selected) {
    var str = [];
    str[str.length] = "<div class='leftPanel'><div class='topLeft'>";
    str[str.length] = "<div class='optionsTitle'>Toolbar Options</div>";
   // str[str.length] = "<div class='logo'></div>";
   // str[str.length] = "<div class='version'>version here...</div>";
    str[str.length] = "</div>";
     str[str.length] =" <div class='leftBar '><div class='navMenu'><ul>";
    for (var i = 0; i < tabs.length; i++) {
        str[str.length] = "<li ";
        if (i == selected) {
            str[str.length] = "class='selected' ";

        }
        str[str.length] = ">";

            str[str.length] = "<a class='tab'>";
           // str[str.length] = i;
           // str[str.length] = ")'>";
            str[str.length] = tabs[i].name;
            str[str.length] = "</a></li>";

    }
    str[str.length] = "</ul></div></div></div>";
    return str.join("");

}

function scrollToTab(i) {
    var prevContent = $('#tabContent' + selectedTab);
    var nextContent = $('#tabContent' + i);
    if (i < selectedTab) {
        $(nextContent).insertBefore(prevContent);
        $('.scroller').animate({ "top": "+=463px" }, null, null, function () {
            $(nextContent).insertBefore($('#tabContent' + (i + 1)));
            $('.scroller').css({ "top": (i * -463) + "px" });
            selectedTab = i;
         });
    }
    else {
        $(nextContent).insertAfter(prevContent);
        $('.scroller').animate({ "top": "-=463px" }, null, null, function () {
            $(nextContent).insertAfter($('#tabContent' + (i - 1)));
            $('.scroller').css({ "top": (i * -463) + "px" });
            selectedTab = i;
        });

    }
}

function tabClicked(i) {
    if (i == selectedTab) {
        return;
    }
    $('.navMenu .selected').removeClass("selected");
    $($('.navMenu li')[i]).addClass("selected");
    $('.topTitles').fadeOut(250, function () {
        $('.topTitles h3').html(tabs[i].title);
        $('.topTitles h5').html(tabs[i].subtitle || "");
        $('.topTitles').fadeIn(250);
    });

    scrollToTab(i);
   // writeNotifications();
}

function writeBottom() {
    var str = [];
    str[str.length] = "<div class='bottomRow'>";
    str[str.length] = "<button class='okButton'>OK</button>";
    str[str.length] = "<a class='cancelButton'>Cancel</a>";
    str[str.length] = "<div class='rightDetails'><div class='logo'></div><div class='version'>version</div></div>";
    str[str.length] = "</div>";
    return str.join("");
    
}

function closeWindow() {
}

function onIeReady() {
    if (!window.ActiveXObject) {
        return;
    }
    $('.leftBar').prepend("<div class='leftBarTop'></div>");


}


function writeComponents() {
    for (var i = 0; i < componentsArr.length; i++) {
        $('#componentList').append("<li class='component'></li>");
        var newItem = $('#componentList > li:last');
        if (componentsArr[i].disabled) {
            newItem.addClass("disabled");
        }
        newItem.append("<img src='" + componentsArr[i].img + "'/>");
        newItem.append("<span title='" + componentsArr[i].description + "'>" + componentsArr[i].name + "</span>");
        newItem.append("<button class='enableDisable'>Disable</button>");
        newItem.append("<a class='settings'>settings</a>");
    }

    $('.disabled .enableDisable').html("Enable");
    $(".enableDisable").click(function () {
        var parentCom = $(this).parents(".component");
        if (parentCom.hasClass("disabled")) {
            parentCom.removeClass("disabled");
            $(this).html("Disable");
            $(this).next().find("p").html("Hide Component");
        }
        else {
            parentCom.addClass("disabled");
            $(this).html("Enable");
            $(this).next().find("p").html("Show Component");
        }
    });
    $('.settings').click(function () {
        openSettings(this);
    });

    $('.removeApp').click(function () {
        removeApp(this);
    });
}


function writeApps() {

    for (var i = 0; i < userComponentsArr.length; i++) {
        $('#appsList').append("<li  class='component'></li>");
        var newItem = $('#appsList > li:last');
        if (userComponentsArr[i].disabled) {
            newItem.addClass("disabled");
        }
        newItem.append("<img src='" + userComponentsArr[i].img + "'/>");
        newItem.append("<span title='" + userComponentsArr[i].description + "'>" + userComponentsArr[i].name + "</span>");
        newItem.append("<a class='removeApp'></a>");
        newItem.append("<button class='enableDisable'>Disable</button>");
        newItem.append("<a class='settings'>settings</a>");
    }
    $('.disabled .enableDisable').html("Enable");
    $(".enableDisable").click(function () {
        var parentCom = $(this).parents(".component");
        if (parentCom.hasClass("disabled")) {
            parentCom.removeClass("disabled");
            $(this).html("Disable");
            $(this).next().find("p").html("Hide Component");
        }
        else {
            parentCom.addClass("disabled");
            $(this).html("Enable");
            $(this).next().find("p").html("Show Component");
        }
    });
    

    $('.removeApp').click(function () {
        removeApp(this);
    });
}


function writeNotifications() {
    for (var i = 0; i < notificationsArr.length; i++) {
        $('#notificationsList').append("<li class='component'></li>");
        var children = $('#notificationsList').children();
        var newItem = $(children[children.length - 1]);

        newItem.append("<img src='" + notificationsArr[i].img + "'/>");
        newItem.append("<span title='" + notificationsArr[i].description + "'>" + notificationsArr[i].name + "</span>");
        newItem.append(stepperHTML);
        newItem.append(optionsHTML);
        newItem.find(".combo")[0].selectedIndex = 1;
        newItem.find(".combo")[0].id = "combo_" + i;
    }


    $('.step').stepper();
    //   return;
    $('select').combobox({

        comboboxContainerClass: "comboboxContainerClass",
        comboboxValueContentClass: "comboboxValueContentClass",
        comboboxDropDownButtonClass: "comboboxDropDownButtonClass",
        comboboxDropDownClass: "comboboxDropDownClass",
        comboboxDropDownItemClass: "comboboxDropDownItemClass",
        comboboxDropDownItemHoverClass: "comboboxDropDownItemHoverClass",
        animationType: "fade",
        width: "196px",
        height: "80px"
    });

    $('select').combobox.onChange = function (el) {
        var selects = $('select');
        var changedElementIndex = -1;
        for (var i = 0; i < selectedOptions.length; i++) {
            if ($(selects[i]).val() != selectedOptions[i]) {
                changedElementIndex = i;
                selectedOptions[i] = $(selects[i]).val();
                break;
            }
        }
        if (changedElementIndex >= 0) {
            if (selectedOptions[changedElementIndex] == LIMIT_DAILY_NOTIFICATIONS_VALUE) {
                $($('#notificationsList .component')[changedElementIndex]).addClass("limitNotification");
            }
            else {
                $($('#notificationsList .component')[changedElementIndex]).removeClass("limitNotification");
            }
        }
    };

    $('select').each(function (i, select) {
        selectedOptions[i] = $(select).val();
    });

}

function initNotifications() {
    $('input[type="checkbox"]').ezMark({
        checkboxCls: 'unchecked',
        checkedCls: 'checked'
    });
    createOptionsHTML();
    loadNotificationsArr();
    writeNotifications();
}