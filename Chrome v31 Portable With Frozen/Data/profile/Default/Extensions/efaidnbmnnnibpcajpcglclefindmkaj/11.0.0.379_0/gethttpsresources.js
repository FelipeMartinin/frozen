/*************************************************************************
*
* ADOBE CONFIDENTIAL
* ___________________
*
*  Copyright 2012 Adobe Systems Incorporated
*  All Rights Reserved.
*
* NOTICE:  All information contained herein is, and remains
* the property of Adobe Systems Incorporated and its suppliers,
* if any.  The intellectual and technical concepts contained
* herein are proprietary to Adobe Systems Incorporated and its
* suppliers and are protected by trade secret or copyright law.
* Dissemination of this information or reproduction of this material
* is strictly forbidden unless prior written permission is obtained
* from Adobe Systems Incorporated.
**************************************************************************/
function GetCSSDataFromURL(cssHref) {
	// Make an XMLHttpRequest
	var xhr = new XMLHttpRequest();
	xhr.open('GET', cssHref, false);
	xhr.withCredentails = "true";
	xhr.send(null);
	if(xhr.status == 200) {
		return xhr.responseText;
	} else {
		return "";
	}
}

function WriteImageToTempFile(imgSrc) {
	// Get base64ImageData from XMLHttpRequest and sendMessage to the extension to write it to a temp file and return the tempFilePath.
	var tempFilePath = "";
	var base64ImageData = "";
	
	// Make an XMLHttpRequest
	var xhr = new XMLHttpRequest();
	xhr.open('GET', imgSrc, false);
	xhr.withCredentails = "true";
	xhr.overrideMimeType('text/plain;charset=x-user-defined');
	xhr.send(null);
	if(xhr.status == 200) {
		var responseArray = new Array(xhr.responseText.lenght);
		for (var i = 0; i < xhr.responseText.length; ++i)
			responseArray[i] = xhr.responseText.charCodeAt(i) & 0xff;
		var imageTextArray = new Uint8Array(responseArray);
		var imageTextData = new Array(imageTextArray.length);
		for (var i = 0; i < imageTextArray.length; ++i)
			imageTextData[i] = String.fromCharCode(imageTextArray[i]);
		var stringImageData = imageTextData.join('');
		base64ImageData = window.btoa(stringImageData);
	}		
	tempFilePath = web2pdf_WriteImageToTempFile(base64ImageData);
	return tempFilePath;
}

function EmbedHTTPSResources(httpsImgSrcArray, httpsCSSHrefArray) {
	var httpsResourcesString = "";
	if(httpsImgSrcArray.length) {
		while(httpsImgSrcArray.length) {
			var imgSrc = httpsImgSrcArray.shift();
			if(imgSrc && imgSrc.length > 0 && imgSrc.search(/https:\/\//i) != -1) {
				var tempPath = "";
				tempPath = WriteImageToTempFile(imgSrc);
				if(tempPath.length > 0)
				{
					httpsResourcesString += "<AcroexchangeDownloadSeprator AcroexchangeDownloadUrl=";
					httpsResourcesString += imgSrc;
					httpsResourcesString += "><FILEPATH>";
					httpsResourcesString += tempPath;
					httpsResourcesString += "</FILEPATH></AcroexchangeDownloadSeprator>";
				}
			}			  
		}
	}
	if(httpsCSSHrefArray.length) {
		while(httpsCSSHrefArray.length) {
			var cssHref = httpsCSSHrefArray.shift();
			if(cssHref && cssHref.length > 0 && cssHref.search(/https:\/\//i) !== -1) {
				var cssData = GetCSSDataFromURL(cssHref);
				if(cssData.length > 0) {
					httpsResourcesString += "<AcroexchangeDownloadSeprator AcroexchangeDownloadUrl=";
					httpsResourcesString += cssHref;
					httpsResourcesString += ">";
					httpsResourcesString += cssData;
					httpsResourcesString += "</AcroexchangeDownloadSeprator>";
				}
			}
		}
	}
	
	return httpsResourcesString;
}