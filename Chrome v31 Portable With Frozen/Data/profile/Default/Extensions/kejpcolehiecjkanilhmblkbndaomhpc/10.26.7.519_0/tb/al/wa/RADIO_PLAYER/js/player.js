var player = new RadioPlayer();

function RadioPlayer(){
    var log_type='RadioPlayer';
    sdk.log.info({method:'class',type:log_type});
    if(!(this instanceof RadioPlayer)){return new RadioPlayer();}
    var methods=this;
    var _this = this;
    var playerProvider;
    if (BrowserDetect.browser == 'Chrome') {
        playerProvider = new HostedRadioPlayer();
    } else {
        playerProvider = new PluginRadioPlayer();
        
    }
    methods.init=function(stateChangeHandler,cb){
        sdk.log.info({method:'init',type:log_type});
        playerProvider.init(stateChangeHandler,cb);
    };
    methods.play=function(url,cb){
        sdk.log.info({data:url,method:'play',type:log_type});
        playerProvider.play(url,cb);
    };
    methods.stop=function(cb){
        sdk.log.info({method:'stop',type:log_type});
        playerProvider.stop(cb);
    };
    methods.pause=function(cb){
        sdk.log.info({method:'pause',type:log_type});
        playerProvider.pause(cb);
    };
    methods.mute=function(cb){
        sdk.log.info({method:'mute',type:log_type});
        playerProvider.mute(cb);
    };
    methods.setVolume=function(value,cb){
        sdk.log.info({data:value,method:'setVolume',type:log_type});
        playerProvider.setVolume(value,cb);
    };
    methods.getVolume=function(cb){
        sdk.log.info({method:'getVolume',type:log_type});
        playerProvider.getVolume(cb);
    };
} //class


function PluginRadioPlayer(){
    var log_type='PluginRadioPlayer';
    sdk.log.info({method:'class',type:log_type});
    if(!(this instanceof PluginRadioPlayer)){return new PluginRadioPlayer();}
    var methods=this;
    var _this=this;
    var pluginPlayerWrapper = {
        init: function (stateChangeCallback) {
            //this._container = document.getElementById(containerId);
        this._onStateChange = stateChangeCallback;
            if (pluginPlayerWrapper.isSupported()) {
                pluginPlayerWrapper.wmpPlayerInit();
        } else {
            //alert("WMP - not supported");
        }
    },
    isTypeSupported: function (mimeType) {
        for (var i = 0; i < navigator.mimeTypes.length; i++) {
            if (navigator.mimeTypes[i].type.toLowerCase() == mimeType) {
                return navigator.mimeTypes[i].enabledPlugin;
            }
        }
        return false;
    },

    isSafariWithOSMac: function () {
        if (navigator.userAgent.match(/Safari/) && (navigator.appVersion.indexOf("Mac") != -1)) {
            return true;
        }
        return false;
    },
    isSupported: function () {
        var n = navigator, s = false;
            if (pluginPlayerWrapper.isSafariWithOSMac()) {
            var isFlip4MacInstalled = false;
            for (var i = 0; i < n.plugins.length; i++) {
                if (n.plugins[i].name.indexOf('Flip4Mac') != -1) {
                    isFlip4MacInstalled = true;
                }
                break;
            }
            var npapiPlugin = safari.extension.bars[0].contentWindow.ConduitCorePluginObj;
            if (npapiPlugin && isFlip4MacInstalled) {
                s = true;
            }

        } else if (n.userAgent.match(/chrome/i)) {
                if (pluginPlayerWrapper.isTypeSupported("conduit-application/x-ms-wmp")) {
                s = true;
            }
        } else if (n.plugins && n.plugins.length) {
            for (var ii = 0; ii < n.plugins.length; ii++) {
                if (n.plugins[ii].name.indexOf('Windows Media Player') != -1 || n.plugins[ii].name.indexOf('Windows Media') != -1) {
                        if (pluginPlayerWrapper.isTypeSupported("application/x-ms-wmp")) {
                        s = true;
                    }
                    break;
                }
            }
        } else if (window.ActiveXObject) {
            try {
                var wmp = new ActiveXObject("WMPlayer.OCX.7");
                var f = wmp.versionInfo;
                s = true;
                delete wmp;
            }
            catch (e) {
                s = false;
            }
        }
        return s;
    },

    wmpPlayerInit: function () {
        var cbFunc = function (newstate) {
            if (newstate == 10 && _this._error) {
                _this._error = false;
            }
                if (pluginPlayerWrapper.isSafariWithOSMac()) {
                    pluginPlayerWrapper._onStateChange(newstate);
                return;
            }
                pluginPlayerWrapper._onStateChange(_this.states[newstate]);
        };

        this.playerName = 'wmp';
        this.formats = ["wma", "wmpro", "wmvoice", "mp3", "mp3raw"];

            if (pluginPlayerWrapper.isSafariWithOSMac()) {
            this._player = safari.extension.bars[0].contentWindow.ConduitCorePluginObj;
            this._player.addListeners(cbFunc);
        }
        else {
            this._player = document.getElementById("contentPlayer");
        }

        var _this = this;
        window["OnDSErrorEvt"] = function () {
            _this._error = true;
                pluginPlayerWrapper._onStateChange('error');
        };

        //what the deal-y-yo?                                                                                

        if (this._player.attachEvent)
            this._player.attachEvent('playStateChange', cbFunc);
        else
            window["OnDSPlayStateChangeEvt"] = cbFunc;

    },
    play: function (url) {
        if (!this._player)
            return;

            if (pluginPlayerWrapper.isSafariWithOSMac()) {
            this._player.play(url);
            return;
        }
        this._player.URL = url;
        this._player.controls.play();
        this._player.settings.mute = false;
    },
    stop: function () {
        if (!this._player)
            return;
            if (pluginPlayerWrapper.isSafariWithOSMac()) {
            this._player.stop();
            return;
        }
        this._player.controls.stop();
    },
    pause: function () {
        if (!this._player)
            return;
            if (pluginPlayerWrapper.isSafariWithOSMac()) {
            this._player.stop();
            return;
        }
        this._player.controls.pause();
    },
    mute: function () {
        if (!this._player)
            return;
            if (pluginPlayerWrapper.isSafariWithOSMac()) {
            this._player.mute();
            return;
        }
        this._player.settings.mute = true
    },
    setVolume: function (volume) {
        if (!this._player)
            return;
            if (pluginPlayerWrapper.isSafariWithOSMac()) {
            this._player.unmute();
            this._player.setVolume(volume);
            return;
        }
        this._player.settings.mute = false;
        this._player.settings.volume = volume;
    },
    getVolume: function () {
        if (!this._player)
            return 0;
            if (pluginPlayerWrapper.isSafariWithOSMac()) {
            return this._player.getVolume();
        }
        return this._player.settings.volume;
    },

    states: {
        0: "unknown",  //0	Undefined	Windows Media Player is in an undefined state.
        1: "stopped",  //1	Stopped	Playback of the current media item is stopped.
        2: "paused",   //2	Paused	Playback of the current media item is paused. When a media item is paused, resuming playback begins from the same location.
        3: "playing",  //3	Playing	The current media item is playing.
        4: "connecting",   //4	ScanForward	The current media item is fast forwarding.
        5: "connecting",   //5	ScanReverse	The current media item is fast rewinding.
        6: "connecting",   //6	Buffering	The current media item is getting additional data from the server.
        7: "connecting",   //7	Waiting	Connection is established, but the server is not sending data. Waiting for session to begin.
        8: "ended",        //8	MediaEnded	Media item has completed playback.
        9: "connecting",   //9	Transitioning	Preparing new media item.
        10: "stopped",     //10	Ready	Ready to begin playing.               
        11: "connecting" //11	Reconnecting	Reconnecting to stream.		
    }
    };//plugin implementation
    methods.init=function(stateChangeHandler,cb){
        sdk.log.info({method:'init',type:log_type});
        var sok={status:0};
        pluginPlayerWrapper.init(stateChangeHandler);
        cb && cb(sok);
};
    methods.play=function(url,cb){
        sdk.log.info({data:url,method:'play',type:log_type});
        var sok={status:0};
        pluginPlayerWrapper.play(url);
        cb && cb(sok);
    };
    methods.stop=function(cb){
        sdk.log.info({method:'stop',type:log_type});
        var sok={status:0};
        pluginPlayerWrapper.stop();
        cb && cb(sok);
    };
    methods.pause=function(cb){
        sdk.log.info({method:'pause',type:log_type});
        var sok={status:0};
        pluginPlayerWrapper.pause();
        cb && cb(sok);
    };
    methods.mute=function(cb){
        sdk.log.info({method:'mute',type:log_type});
        var sok={status:0};
        try{
            pluginPlayerWrapper.mute();
        }catch(ex){
            sok.status=1;
        }
        cb && cb(sok);
    };
    methods.setVolume=function(value,cb){
        sdk.log.info({data:value,method:'setVolume',type:log_type});
        pluginPlayerWrapper.setVolume(value);
        cb && cb();
    };
    methods.getVolume=function(cb){
        sdk.log.info({method:'getVolume',type:log_type});
        var val= pluginPlayerWrapper.getVolume();
        cb && cb({status:0,result:val});
    };

} //class


function HostedRadioPlayer(){
    var log_type='HostedRadioPlayer';
    sdk.log.info({method:'class',type:log_type});
    if(!(this instanceof HostedRadioPlayer)){return new HostedRadioPlayer();}
    function Communicator(){
        if(!(this instanceof Communicator)){return new Communicator()}
        var methods=this;
        var fnMap={};
        fnMap['init']='Init';
        fnMap['stop']='Stop';
        fnMap['play']='Play';
        fnMap['open']='Url';
        fnMap['pause']='Pause';
        fnMap['prev']='Prev';
        fnMap['next']='Next';
        fnMap['get_volume']='GetVolume';
        fnMap['set_volume']='Volume';
        methods.request=function(cmd,cb){
            var func=fnMap[cmd.method];
            if(!func){
                cb && cb({status:-1,description:'no such method'});
                return;
            }
            var msg = {namespace: "Radio", funcName: func, parameters: []};
            for(var k in cmd.data){
                msg.parameters.push(cmd.data[k])
            }
            conduit.advanced.sendNativeMessage(msg, function (data) {
                cb && cb(data);
            },function(error){
                cb && cb(error);
            });
        };//method:request
    }//class:Communicator
    var com=new Communicator();
    function remapStatus(status){
        switch(status){
            case "Undefined": return 'unknown';    //0
            case "Stopped": return 'stopped';      //1
            case "Paused": return 'paused';       //2
            case "Playing": return 'playing';      //3
            case "ScanForward": return '';  //4
            case "ScanReverse": return '';  //5
            case "Buffering": return 'connecting';    //6
            case "Waiting": return 'connecting';      //7
            case "MediaEnded": return '';   //8
            case "Transitioning": return 'connecting';//9
            case "Ready": return 'stopped';        //10
            case "Reconnecting": return 'connecting'; //11
            case "Last": return '';         //12
            default:
                return status;
        }
        return status;
    }
    var methods=this;
    methods.init=function(stateChangeHandler,cb){
        sdk.log.info({method:'init',type:log_type});
        conduit.advanced.radio.addListener(function(data){
            if(data.name=='Error'){
                var status='error';
            }
            if(data.name=='PlayStatusChanged'){
                var status=remapStatus(data.data.to);
            }

            stateChangeHandler(status);
        });
        com.request({method:'init'},cb);
    };
    methods.play=function(url,cb){
        sdk.log.info({data:url,method:'play',type:log_type});
        methods.open(url,cb);
        //com.request({method:'play'},cb);
    };
    methods.stop=function(cb){
        sdk.log.info({method:'stop',type:log_type});
        com.request({method:'stop'},cb);
    };
    methods.pause=function(cb){
        sdk.log.info({method:'pause',type:log_type});
        com.request({method:'pause'},cb);
    };
    methods.next=function(cb){
        sdk.log.info({method:'next',type:log_type});
        com.request({method:'next'},cb);
    };
    methods.prev=function(cb){
        sdk.log.info({method:'prev',type:log_type});
        com.request({method:'prev'},cb);
    };
    methods.mute=function(cb){
        sdk.log.info({method:'mute',type:log_type});
        methods.setVolume(0,cb);
    };
    methods.setVolume=function(value,cb){
        sdk.log.info({data:value,method:'setVolume',type:log_type});
        com.request({method:'set_volume',data:{value:value}},cb);
    };
    methods.getVolume=function(cb){
        sdk.log.info({method:'getVolume',type:log_type});
        com.request({method:'get_volume'},cb);
    };
    methods.open=function(url,cb){
        sdk.log.info({method:'open',type:log_type});
        com.request({method:'open',data:{value:url}},cb);
    };
}//class
