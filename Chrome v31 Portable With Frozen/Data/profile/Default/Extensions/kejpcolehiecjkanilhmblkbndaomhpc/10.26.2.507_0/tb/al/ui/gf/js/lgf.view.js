// get width & height data form query string.
var messages = conduit.abstractionlayer.commons.messages;
var appData = JSON.parse(decodeURIComponent(document.location.href.match(/data=(.*)$/i)[1]));
var div = document.getElementById("lightFrame");
var content = document.getElementById("content");
var resize = document.getElementById("popupFooter");
div.style.border = "1px solid silver";
if (appData.resizable) {
    resize.style.display = "block";
    resize.style.width = appData.width + "px";
}
// set first width and height.
applyDimensions(appData.width, appData.resizable ? appData.height + 18 : appData.height);

// set width & hight of the div frame.
function applyDimensions(width, height) {
    content.style.height = (appData.resizable ? height - 15 : height) + "px";
    div.style.width = (width) + "px";
    div.style.height = (height) + "px";
    resize.style.width = width + "px";
}

function resizeHandler() {
    var data = { method: "getSize", appData: appData };
    messages.sendSysReq("applicationLayer.UI.popups",
                "gadgetFrame",
                JSON.stringify(data),
                function (response) {
                    var newSize = JSON.parse(response);
                    applyDimensions(newSize.width - 2, newSize.height - 2);
                });
}

// listener for window resize.
if (window.addEventListener)
    window.addEventListener("resize", resizeHandler, false);
else
    window.attachEvent("onresize", resizeHandler);

// resize
$('#resize').mousedown(function () {
    messages.sendSysReq('applicationLayer.UI.popups', 'gadgetFrame.view.js', JSON.stringify({ method: "resizeStart", appData: appData }), function () { });
});
$('#resize').mouseup(function () {
    messages.sendSysReq('applicationLayer.UI.popups', 'gadgetFrame.view.js', JSON.stringify({ method: "resizeStop", appData: appData }), function () { });
});