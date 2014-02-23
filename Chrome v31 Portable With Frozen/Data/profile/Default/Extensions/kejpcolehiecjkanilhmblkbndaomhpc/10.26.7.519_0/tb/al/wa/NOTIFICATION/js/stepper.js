
var LIMIT_DAILY_NOTIFICATIONS_VALUE = 2;
var options = [{ text: "Show All from this source", value: 0 }, { text: "Show badge only", value: 1 }, { text: "Limit daily notifications to", value: LIMIT_DAILY_NOTIFICATIONS_VALUE }, { text: "Don't show", value: 3}];
var optionsHTML = "";
var notificationsArr = [];
var selectedOptions = [];

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

function writeNotifications() {
    $('.ui-stepper-plus').click(function () {
        $('.ui-stepper-textbox').val(Math.min($('.ui-stepper-textbox').val() - 0 + 1, 9));
    });

    $('.ui-stepper-minus').click(function () {
        $('.ui-stepper-textbox').val(Math.max($('.ui-stepper-textbox').val() - 1, 1));
    });
}
function stepperInit() {
    $('input[type="checkbox"]').ezMark({
        checkboxCls: 'unchecked',
        checkedCls: 'checked'
    });
    createOptionsHTML();
    loadNotificationsArr();
    writeNotifications();
}