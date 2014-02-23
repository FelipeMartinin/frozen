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
var gStatusDialogTitle = chrome.i18n.getMessage("web2pdfStatusDialogTitle");
var gCSSSrc = chrome.extension.getURL("css/status.css");
var gStatusDialogHead = "<head><link rel=\"stylesheet\" type=\"text/css\" href=\"" +gCSSSrc + "\"/><title>" + gStatusDialogTitle + "</title></head>";
	
//Status Cache object used to keep track of the conversion progress and update status dialog.
function StatusCache(conversion,docTitle,errString,runningFEAT) // Status Cache Object Constructor
{
	this.conversion = conversion;
	this.docTitle = docTitle;
	this.errString = errString;
	this.runningFEAT = runningFEAT;
	// Following 2 flags are important:
	// If shown and not done, then conversion is active.
	// If shown and done, then conversion is done, due to be removed.
	// If hidden and done, then conversion timed out and was hidden, but it completed and is due to be removed.
	// If hidden and not done, then conversion is done and removed. Or conversion timed out and still active.
	this.show = true;
	this.done = false;
	//
	this.timeStarted = 0;
	this.timeElapsed = 0;
}

//Functions called locally from this file-------BEGIN----------------------------
function GetNumberOfConversionsPreceding(entry)
{
	var count = 0;
	var cacheSize = gStatusCache.length;
	if(cacheSize > 0)
	{
		var i = 0;
		for( i = entry-1; i >= 0; i--)
		{
			if ((typeof gStatusCache[i] != "undefined") && gStatusCache[i].show==true)
				count++;
		}
	}
	return count;
}

//Functions for Status Dialog-----------BEGIN----------------------------

function CloseStatusDialog()
{
	gStatusDlg.close();
	gStatusDlg = null;
}

function FindNextWaitingConversionID(entry)
{
	var statusCacheSize = gStatusCache.length;

	for( var nextEntry = entry + 1; nextEntry < statusCacheSize; nextEntry++)
	{
		if ((typeof gStatusCache[nextEntry] != "undefined") && gStatusCache[nextEntry].show==true && gStatusCache[nextEntry].done == false)
			return nextEntry;
	}
	return -1;
}

function RemoveFromList(entry)
{
	var cacheEntry = gStatusCache[entry];
	cacheEntry.show=false;
	cacheEntry.done=false;
	cacheEntry.conversion=0; 
	cacheEntry.docTitle=0;
	if(cacheEntry.runningFEAT)
	{
		//setTimeout((function(){QuitChrome(false);}),FEAT_QUIT_TIMER);
	}
}

function StartNextConversion(entry)
{
	var nextConversionId = FindNextWaitingConversionID(entry);
	if(nextConversionId >= 0)
	{
		var nextCacheEntry = gStatusCache[nextConversionId];
		if(nextCacheEntry.conversion)
		{
			nextCacheEntry.timeStarted = new Date().getTime();
			nextCacheEntry.conversion.SendForConversion();
		}
	}
}

function SetNewListItem(newTableRow, entry)
{
	var cacheEntry = gStatusCache[entry];
	var conversionStatus = cacheEntry.conversion.m_currentState;
	var conversionSettings = cacheEntry.conversion.m_conversionSettings;

	// set the list item row values
	var imageSRC = chrome.extension.getURL("skin/AX_WebCap_Converted_Sm_N.png");
	if(conversionSettings & cacheEntry.conversion.APPEND)
		imageSRC = chrome.extension.getURL("skin/AX_Append_Sm_N.png");
		
	newTableRow.getElementsByTagName("img")[0].getAttributeNode("src").value = imageSRC;
	newTableRow.getElementsByTagName("span")[1].innerText = cacheEntry.docTitle;
	
	var imageSpinSRC = "";
	if(gSpinIndex < 10) {
		imageSpinSRC = "skin/AX_ProgressSpin_Sm_0" + gSpinIndex + "_N.png";
	}
	else {
		imageSpinSRC = "skin/AX_ProgressSpin_Sm_" + gSpinIndex + "_N.png";
	}
	var imageSpinURL = chrome.extension.getURL(imageSpinSRC);		
	
	if(conversionStatus == cacheEntry.conversion.STATUS_WAITING) //waiting for conversion
	{
		newTableRow.getElementsByTagName("span")[0].innerText = chrome.i18n.getMessage("web2pdfStatusWaiting");
        newTableRow.getElementsByTagName("img")[1].getAttributeNode("src").value = imageSpinURL;		
	}
	else if(conversionStatus == cacheEntry.conversion.STATUS_DOWNLOADING) //downloading
	{
		newTableRow.getElementsByTagName("span")[0].innerText = chrome.i18n.getMessage("web2pdfStatusDownloading");
		newTableRow.getElementsByTagName("img")[1].getAttributeNode("src").value = chrome.extension.getURL("skin/AX_State_Downloading_Sm_N.png");
	}
	else if(conversionStatus == cacheEntry.conversion.STATUS_CONVERTING) //converting
	{
		newTableRow.getElementsByTagName("span")[0].innerText = chrome.i18n.getMessage("web2pdfStatusConverting");			
		newTableRow.getElementsByTagName("img")[1].getAttributeNode("src").value = imageSpinURL;
	}
	else
	{
		if(conversionStatus == cacheEntry.conversion.STATUS_SUCCESS) //success	
		{
			newTableRow.getElementsByTagName("img")[1].getAttributeNode("src").value = chrome.extension.getURL("skin/AX_State_Done_Success_Sm_N.png");		
			newTableRow.getElementsByTagName("span")[0].innerText = chrome.i18n.getMessage("web2pdfStatusSuccess");
		}
		else //error condition
		{
			newTableRow.getElementsByTagName("span")[0].innerText = chrome.i18n.getMessage("web2pdfStatusError");
			if(conversionStatus == cacheEntry.conversion.STATUS_ERROR) //error in conversion
			{
				if(cacheEntry.errString && cacheEntry.errString.length > 0)
				{
					var errString = newTableRow.getElementsByTagName("span")[0].innerText + " - " + cacheEntry.errString;
					newTableRow.getElementsByTagName("span")[0].innerText = errString;
					setTimeout((function(){web2pdf_alert(cacheEntry.errString);}),STATUS_CLEAN_TIMER/10);
				}
				else
				{
					setTimeout((function(){web2pdf_alert(chrome.i18n.getMessage("web2pdfUnknownError"));}),STATUS_CLEAN_TIMER/10);
				}
			}
			else if(conversionStatus == cacheEntry.conversion.STATUS_FILELOCKED) //file is locked
			{
				setTimeout((function(){web2pdf_alert(chrome.i18n.getMessage("web2pdfFileLockedError"));}),STATUS_CLEAN_TIMER/10);
			}
			else if(conversionStatus == cacheEntry.conversion.STATUS_MISSINGLIB) //a library could not be loaded.
			{
				// Do nothing.
			}
			else //(conversionStatus == cacheEntry.conversion.STATUS_NOINSTANCE) //conversion instance/status for this conversion not found
			{
				setTimeout((function(){web2pdf_alert(chrome.i18n.getMessage("web2pdfUnknownError"));}),STATUS_CLEAN_TIMER/10);
			}
			newTableRow.getElementsByTagName("img")[1].getAttributeNode("src").value = chrome.extension.getURL("skin/AX_State_Done_Error_Sm_N.png");
		}	
		RemoveFromList(entry); 
		StartNextConversion(entry);
	}
}

function InitiStatusDialog() {
	if((gStatusDlg === null) || gStatusDlg.closed) {
		var closeStr = chrome.i18n.getMessage("web2pdfStatusDialogCloseButtonText");
		var imgSRC1 = chrome.extension.getURL("skin/AX_WebCap_Converted_Sm_N.png");
		var imgSRC2 = chrome.extension.getURL("skin/AX_State_Downloading_Sm_N.png");	
		var statusDialogTemplateHTML = "<html>" + gStatusDialogHead;
		statusDialogTemplateHTML = statusDialogTemplateHTML + "<body>";
		statusDialogTemplateHTML = statusDialogTemplateHTML + "<div class=\"outer\"><div class=\"inner\">";
		statusDialogTemplateHTML = statusDialogTemplateHTML + "<table id=\"conversionCacheListItems\" rows=\"7\" style=\"border-collapse:collapse;white-space: nowrap;overflow:scroll;font-family: sans-serif;\" width=\"100%\">";
		statusDialogTemplateHTML = statusDialogTemplateHTML + "<tr><td>";
		statusDialogTemplateHTML = statusDialogTemplateHTML + "<img align=\"center\" src=\"" + imgSRC1 + "\"/>&nbsp;";		
		statusDialogTemplateHTML = statusDialogTemplateHTML + "<img align=\"center\" src=\"" + imgSRC2 + "\" />&nbsp;";
		statusDialogTemplateHTML = statusDialogTemplateHTML + "<span></span>";
		statusDialogTemplateHTML = statusDialogTemplateHTML + "&nbsp;-&nbsp;";
		statusDialogTemplateHTML = statusDialogTemplateHTML + "<span></span>";
		statusDialogTemplateHTML = statusDialogTemplateHTML + "</td></tr>";
		statusDialogTemplateHTML = statusDialogTemplateHTML + "</table>";
		statusDialogTemplateHTML = statusDialogTemplateHTML + "</div>";
		statusDialogTemplateHTML = statusDialogTemplateHTML + "<input type=\"button\" value=\""+ closeStr +"\" style=\"font-size:10pt;padding-left:10px;padding-right:10px;margin-top:5px;\" onclick=\"window.close();\"\>";		
		statusDialogTemplateHTML = statusDialogTemplateHTML + "</div>";
		statusDialogTemplateHTML = statusDialogTemplateHTML + "</body>";
		statusDialogTemplateHTML = statusDialogTemplateHTML + "</html>";
		gStatusDlg = window.open("","ConversionStatusDialog","width=509, height=234, resizable=yes");
		gStatusDlg.document.write(statusDialogTemplateHTML);
		gStatusDlg.resizeTo(510,235);
		gStatusDlg.blur();
		setTimeout((function(){gStatusDlg.focus()}),0);
	}
	else {
		var statusDialogHTML = gStatusDlg.document.documentElement.outerHTML;
		gStatusDlg.close();
		gStatusDlg = window.open("","ConversionStatusDialog","width=509, height=234, resizable=yes");
		gStatusDlg.document.write(statusDialogHTML);
		gStatusDlg.resizeTo(510,235);
		gStatusDlg.blur();
		setTimeout((function(){gStatusDlg.focus()}),0);
	}
}

function AddConversionToStatusDialog(conversion, docTitle, runningFEAT) {
	var errString = "";
		
	var newStatusCache = new StatusCache(conversion,docTitle,errString,runningFEAT);
	var newLength = gStatusCache.push(newStatusCache);
	gStatusCache[newLength - 1].conversion.m_conversionID = newLength - 1;
		
	if(GetNumberOfConversionsPreceding(newLength - 1) <= 0)
		newStatusCache.timeStarted = new Date().getTime();

	InitiStatusDialog();
	web2pdf_doStatusDlgEvent(false);
}

//Functions for Status Dialog------------END-----------------------------

//Adds, Removes entries from the status list. Also does some animation.
function DoConversionAnimation()
{
	var tableElement = gStatusDlg.document.getElementById("conversionCacheListItems");
	var tableRow = 0;
	var newTableRow = 0;
	var i = 0;
	var j = 0;
	var flag=false;
		
	var entriesToShow = new Array();

	var tableNumRows = tableElement.rows.length;
	if(tableNumRows<=0)
	{
		setTimeout("CloseStatusDialog()",CONVERSION_ANIMATION_STOP_TIMER);
		return 0;
	}	
	else
	{
		flag=false;
		for(i=0; i < gStatusCache.length; i++)
		{
			if ((typeof gStatusCache[i] != 'undefined') && gStatusCache[i].show==true)
			{
				entriesToShow[j++]=i;
				if(flag==false)
				{
					gStatusCache[i].timeElapsed = new Date().getTime() - gStatusCache[i].timeStarted;
					if(gStatusCache[i].timeElapsed > CONVERSION_TIMEOUT)
					{
						var UnknownErrorStr = chrome.i18n.getMessage("web2pdfUnknownError");
						gStatusCache[i].show=false;
						
						setTimeout((function(){web2pdf_alert(UnknownErrorStr);}),STATUS_CLEAN_TIMER/10);					
						StartNextConversion(i);
					}	
					flag=true;
				}
			}
			else if(gStatusCache[i].done == true && gStatusCache[i].show == false)
			{
				// Conversion timed out earlier, but somehow got completed. Delete the conversion.
				RemoveFromList(i);
			}
		}

		//get the copy of first row
		tableRow = tableElement.rows[0].cloneNode(true);
		
		//remove all entries from tableElement.
		while (tableElement.rows.length) {
			tableElement.deleteRow(0);
		}

		//insert the entries
		for(i=0;i<j;i++)
		{
			newTableRow = tableRow.cloneNode(true);
			SetNewListItem(newTableRow,entriesToShow[i]);
			tableElement.appendChild(newTableRow);
		}
		
		if(gSpinIndex < MAX_SPIN_INDEX)
			gSpinIndex = gSpinIndex + 1;
		else
			gSpinIndex = 1;	
			
		web2pdf_doStatusDlgEvent(true);
	}
	return 0;
}

function setStateCallback(entry, state)
{
	if( (typeof gStatusCache[entry] != "undefined") && gStatusCache[entry].conversion)
		gStatusCache[entry].conversion.SetState(entry, state);
}

function doneCallback(entry, state)
{
	if( (typeof gStatusCache[entry] != "undefined") && gStatusCache[entry].conversion)
		gStatusCache[entry].conversion.ConversionDone(entry, state);
}

function web2pdf_doStatusDlgEvent(web2pdf_doWait)
{
	if (!(gStatusDlg === null) && !gStatusDlg.closed) {
		if(web2pdf_doWait)
			setTimeout(function(){ DoConversionAnimation(); },CONVERSION_ANIMATION_TIMER);
		else
			DoConversionAnimation();
	}
}