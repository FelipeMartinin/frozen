
var args;

window.onload = function () {
    args = JSON.parse(window.name);

    var contentFrame = document.createElement("iframe");
    contentFrame.setAttribute("src", args.url + "#mam_extension_gadget");
    contentFrame.setAttribute("id", "valueApps_popup_id");
    document.body.appendChild(contentFrame);
}

window.addEventListener("message", function (e) {

    var data = e.data;
    try {
        if (typeof data == "string")
            data = JSON.parse(data);
        console.log("TPI", data);
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
        else if ("e" in data && data.e == "getKeyAsyncResponse") {
            var iframeHost = document.getElementById("valueApps_popup_id");
            if (iframeHost) {
                iframeHost.contentWindow.postMessage(data, "*");
            }
        }
    }
    catch (e) {
        console.log(e);
    }
}, false);