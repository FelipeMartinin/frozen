(function() {
	
	//get the appData object from the query string.
	var appData = JSON.parse(decodeURIComponent(document.location.href.match(/appData=(.*)$/i)[1])),
		
        //fallback.
        translation = {
			CELP_STR_ID_UNTRUSTED_APP_ADDED_CONTENT_POLICY: "Content Policy",
			CTLP_STR_ID_UNTRUSTED_APP_DIALOG_DESCRIPTION: "To improve your experience, you may access content or features that require use of your personal information or that may enhance web pages you visit. For more details, please review our EB_CONTENT_POLICY. Do you want to activate it?",
			CELP_STR_ID_UNTRUSTED_APP_ADDED_ALLOW_PRIVACY: "Always ask me about apps privacy.", 
			CTLP_STR_ID_GLOBAL_YES: "Yes",
			CELP_STR_ID_UNTRUSTED_APP_ADDED_NO_THANKS: "No, thanks",
			CELP_STR_ID_UNTRUSTED_APP_ADDED: "EB_APP_NAME was added successfully"
		},
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
            data: ["^CELP_STR_ID_UNTRUSTED", "^CTLP_STR_ID_GLOBAL", "CELP_STR_ID_ENGINE", "^CELP_STR", "CTLP_STR_ID_UNTRUSTED","CELP_STR_ID_UNTRUSTED_APP_ADDED"],
        }), function (responseData) {
	
			// if we get valid response object we use it.
			// otherwise we have the fallback  translation object. 
			if (responseData) {
				var oResponseData = JSON.parse(responseData);

				// if we get something in the translation response object
				if (!$.isEmptyObject(oResponseData)) {

					// we check if all keys are valid.
					for (var key in oResponseData) {
						
						// if not exist or empty string
						if (!oResponseData[key]) {

							// if we have this specific key in our fallback translation object 
							// we set it to the fallback value.
							if (translation[key]) {
								oResponseData[key] = translation[key];
							}
							else {
								oResponseData[key] = "";
							}
						}
					}
					// attach the result to the global variable
					translation = oResponseData;
				}
			}
			
			//run all functions.
			applyTranslation();
            window.focus();	 

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

		$('#divEnableText').text(translation.CELP_STR_ID_UNTRUSTED_APP_ADDED_ALLOW_PRIVACY);
		$('#hrefPrivacyInfo').text(policyText);
		$('#divDescription').html(description);		
		$('.btnTxt').text(translation.CTLP_STR_ID_GLOBAL_YES);
		$('#hrefCancel').text(translation.CELP_STR_ID_UNTRUSTED_APP_ADDED_NO_THANKS);
        $('#divTitle').text(translation.CELP_STR_ID_UNTRUSTED_APP_ADDED);		
	}
	
	//draw the pointer.
	function drawPopupPointer() {
	    try {
		    tip = document.getElementById('deck_tip').getContext('2d');
		    tip.strokeStyle = "#767676";
		    tip.fillStyle = "#f7f7f7";
		    tip.beginPath();

		    //clear old pointer
		    tip.clearRect(0, 0, 354, 40);
		
		    //check toolbar position.
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

		//ok button click
		$('.btnActivate').click(function () {
			var isChecked = $('input[type="checkbox"]').is(':checked');
			var obj = { method: "open", isChecked: isChecked }
			notifyModel(obj);
		});
		//cancel button click
		$('#hrefCancel').click(function () {
			var obj = { method: "cancel" }
			notifyModel(obj);
		});

		$('.hrefPrivacyInfo').live('click', function () {
			var obj = { method: "openPrivacy" }
			notifyModel(obj);
		});
	}
	
    //comunicate with the model.
	function notifyModel(obj) {
		messages.sendSysReq("updateUserAppsPermissions", "untrusted.js", JSON.stringify(obj), function () { });
	}
	
	//after all is done, we show the popup with its original dimensions.
	function resizePopup() {
		var height;
		
	try {
		height = window.getComputedStyle(document.body,null).height;
		height = parseInt(height, 10);
	} catch (e) {}	
		
	if 	(!height)
		height = 400;
		
		var obj = { method: "rezizePopup", height: height }
		messages.sendSysReq("updateUserAppsPermissions", "untrusted.js", JSON.stringify(obj), function () { });
	}
	
	init();
	
})();


				


