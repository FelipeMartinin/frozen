
//needed to implemenet messaging part of ToolbarAPI, hook to existing implementation
//this is for messaging from TPI --> extension
window.addEventListener("message", function (e) {
    var data = e.data;
    try {
        if (typeof data == "string")
            data = JSON.parse(data);

        //message from ToolbarAPI
        if (data.name == "sendMessage") {
            chrome.extension.sendMessage({ type: "EBToolbarAPIMessage", topic: data.data.key, msg: data.data.data });
        }
        else if (data.name == "EBCallBackMessageReceived") {
            chrome.extension.sendMessage({ type: "EBCallBackMessageReceived", msg: data.msg, id: data.id });
        }
            //message from BCAPI in gadget
        else if ("f" in data) {
            chrome.extension.sendMessage({ type: "BCAPIProxyMessage", data: data });
        }
    }
    catch (e) {
        console.log(e);
    }
}, false);

// this is for messaging from extension to TPI
chrome.extension.onMessage.addListener(function (obj) {
    if ("e" in obj && obj.e == "getKeyAsyncResponse") {
        var iframeHost = document.getElementById("valueApps_popup_id");
        if (iframeHost) {
            iframeHost.contentWindow.postMessage(obj, "*");
        }
    } else {
        var script = document.createElement("script");

        obj.msg = encodeURIComponent(obj.msg);
        obj.topic = encodeURIComponent(obj.topic);
        script.setAttribute('type', 'text/javascript');
        script.innerHTML = "if (window.EBMessageReceived) {window.EBMessageReceived(decodeURIComponent('" + obj.topic + "'),decodeURIComponent('" + obj.msg + "'));}";
        document.body.appendChild(script);
    }
});