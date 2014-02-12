(function() {
	
	//get the appData object from the query string.
	var appData = JSON.parse(decodeURIComponent(document.location.href.match(/appData=(.*)$/i)[1])),
		translation,
		tip,
        dir,
		leftOffset;

	//alias.
	var messages = conduit.abstractionlayer.commons.messages,
		repository = conduit.coreLibs.repository;
	
	dir = appData.dir;
    $('html').addClass(dir);
	leftOffset = appData.leftOffset;

	function init() {
		getTranslationAndRunAllFuncs();	
	}
	
	//get translation from serviceLayer.
	function getTranslationAndRunAllFuncs(){
	
		conduit.abstractionlayer.commons.messages.sendSysReq("serviceLayer", "options", JSON.stringify({
            service: "translation",
            method: "getTranslationByRegex",
            data: ["^CELP_STR_ID_UNTRUSTED", "^CTLP_STR_ID_GLOBAL", "CELP_STR_ID_ENGINE", "^CELP_STR", "CTLP_STR_ID_UNTRUSTED", "CELP_STR_ID_UNTRUSTED_APP_ADDED"],
        }), function (responseData) {
			
			//attach the result to the variable
            translation = JSON.parse(responseData);

            //run all functions.
			applyTranslation();
            drawPopupPointer();
		    initListeners();
		    resizePopup();
		});
	}
	
	function applyTranslation() {

		var policyText = translation.CELP_STR_ID_UNTRUSTED_APP_ADDED_CONTENT_POLICY,
            description = translation.CTLP_STR_ID_UNTRUSTED_APP_DIALOG_DESCRIPTION,
			policyTextLink = '<a href="#" class="hrefPrivacyInfo">' + policyText + '</a>';
			
		description = description.replace('EB_CONTENT_POLICY', policyTextLink);

		$('#divDescription').html(description);		
		$('.btnTxt').text(translation.CTLP_STR_ID_GLOBAL_YES);
        $('#divTitle').text(translation.CELP_STR_ID_UNTRUSTED_APP_ADDED);	
	}
	
	//draw the pointer.
	function drawPopupPointer() {
        try {
		    var tip = document.getElementById('deck_tip').getContext('2d');

		    tip.strokeStyle = "#767676";
		    tip.fillStyle = "#f7f7f7";
		    tip.beginPath();

		    //clear old pointer
		    tip.clearRect(0, 0, 354, 40);

		    if (dir == 'customRight'){
				tip.moveTo(70, 40);				
			    tip.lineTo(90, 0);
			    tip.lineTo(30, 40);	            
            }
			else if (dir == 'customRightRtl' && leftOffset){
				var xValue = 0 + leftOffset;
			    tip.moveTo(70, 40);
			    tip.lineTo(xValue, 0);
			    tip.lineTo(30, 40);			
			}
		    else {
                //works also for rtl
			    tip.moveTo(70, 40);
			    tip.lineTo(0, 0);
			    tip.lineTo(30, 40);
		    }
            /*
            else if (dir == 'rtl') {
			    tip.moveTo(270, 40);
			    tip.lineTo(290, 0);
			    tip.lineTo(230, 40);
		    }*/


		    tip.fill();
		    tip.stroke();
        } catch(e) {}
	}	
	
	//set all event listeners.
	function initListeners() {
	
		//add the app image.
		$('#img1').attr('src', appData.thumbnail);

		var $title = $('#divTitle'),
			text = $title.text();

		text = text.replace("EB_APP_NAME", appData.appName || "New App");
		$title.text(text);

		$('.btnActivate').click(function () {
            conduit.coreLibs.logger.logDebug('Sending updateUserAppsPermissions to model', { className: "trusted.js", functionName: "btnActivate_click" });
			messages.sendSysReq("updateUserAppsPermissions", "trusted.js", JSON.stringify({ method: "cancel" }), function () { });
		});

		$('.hrefPrivacyInfo').click(function () {
			messages.sendSysReq("updateUserAppsPermissions", "trusted.js", JSON.stringify({ method: "openPrivacy" }), function () { });
		});
	}
	
	//after all is done, we show the popup with its original dimensions.
	function resizePopup() {
		var obj = { method: "rezizePopup" }
		messages.sendSysReq("updateUserAppsPermissions", "trusted.js", JSON.stringify(obj), function () { });
	}
	
	init();
	
})();


				





