
var pg_external = 
{
	/* set by parse_url_args */
	agree_state: null,
	/* set by parse_url_args */
	ext_msg_key: null,
	
	OpenUrl : function(url, new_tab) 
	{
		this.post('pg_open_url', url, new_tab);
	},
	post : function() 
	{
		var method = Array.prototype.shift.call(arguments);
		var args = [];

		for ( var i = 0, len = arguments.length; i < len; ++i) 
		{
			args.push(arguments[i]);
		}
		var msg = {'method' : method, 'args' : args};
			
		conduit.messaging.sendRequest("backgroundPage", "bg", JSON.stringify(msg));
	}
};

function pg_agree(agree)
{
    pg_external.post('pg_close_agreement_dlg'); 

    if (agree)
    {
        pg_external.post('pg_agreement', true);
    }
    else if (pg_external.agree_state == true)
    {
        //disable app only if original value was true, otherwise it can disable the app when it is only in snooze
        pg_external.post('pg_agreement', false);
    }
}

function parse_url_args(args) 
{
	var args = args.split(',');
	var num_args = args.length;
	if (num_args >= 1) 
	{
		pg_external.ext_msg_key = args[0];
	}
	if (num_args >= 2) 
	{
		// if missing the pg_external.agree_state remains null
		// if exists it's either "true" or "false"
		pg_external.agree_state = (args[1] == 'true');
	}
}

$(document).ready(function()
{	
	parse_url_args(document.location.hash.substr(1));
				
	if((pg_external.agree_state===null)||(pg_external.agree_state==true))
	{
		$('#IsEnabled').attr('checked','checked');
	}
		
	//var cont = $('#content');
	//ChangeSize(cont.attr('clientWidth'), cont.attr('clientHeight'));
});

/**
 * callback for messages sent to the agreement dialog
 * with message key $pg_namespace.agreement_msg_key
 * 
 * @param key
 * @param msg
 */
function EBMessageReceived(key, msg) {
	pg_logger.debug('EBMessageReceived => agreement dialog - ' + key + ' ' + msg);
	if (key == $pg_namespace.agreement_msg_key) {
		if (msg == 'close') {
			CloseFloatingWindow();
		}
	}
}

 ////////////////////////
//  var _gaq = _gaq || [];
//  _gaq.push(['_setAccount', 'UA-1576495-11']);
//  _gaq.push(['_trackPageview']);

//  (function() {
//    var ga = document.createElement('script'); ga.type = 'text/javascript'; ga.async = true;
//    ga.src = ('https:' == document.location.protocol ? 'https://ssl' : 'http://www') + '.google-analytics.com/ga.js';
//    var s = document.getElementsByTagName('script')[0]; s.parentNode.insertBefore(ga, s);
//  })();

function sumbitUserSelection(){
		
	var chk = document.getElementById("IsEnabled");
	
//	if (chk.checked==true)
//		_gaq.push(['_trackEvent', 'CNDT-FF-IAgree', 'Click', 'Accept', 1]);
//	else
//		_gaq.push(['_trackEvent', 'CNDT-FF-IAgree', 'Click', 'Not-Accept', 1]);

	pg_agree(chk.checked);
}

function addListener(obj, eventName, listener)
{
    if (obj.addEventListener)
    {
        obj.addEventListener(eventName, listener, false);
    } else
    {
        obj.attachEvent("on" + eventName, listener);
    }
}

addListener(window, "load", function ()
{
    var btn = document.getElementById('close_btn');
    addListener(btn, 'click', sumbitUserSelection);
    
    btn = document.getElementById('ok_btn');
    addListener(btn, 'click', sumbitUserSelection);

}, false);


