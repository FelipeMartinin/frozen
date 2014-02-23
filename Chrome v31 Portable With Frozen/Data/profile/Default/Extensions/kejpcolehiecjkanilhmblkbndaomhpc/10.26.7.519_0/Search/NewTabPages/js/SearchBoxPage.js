// Copyright (c) 2012 The Chromium Authors. All rights reserved.
// Use of this source code is governed by a BSD-style license that can be
// found in the LICENSE file.

cr.define('ntp', function () {
	//'use strict';

	var html;
	var msgHtml;
	
	function SearchBoxPage() {
		var el = cr.doc.createElement('div');
		el.__proto__ = SearchBoxPage.prototype;
		el.initialize();

		return el;
	}

	SearchBoxPage.prototype = {
		__proto__: HTMLDivElement.prototype,

		get sideMargin() {
			return 0;
		},


		get scrollbarWidth() {
			return 0;
		},

		get getOffsetTop() {
			return 30;
		},

		initialize: function () {
			this.classList.add('search-box-page');
			this.classList.add('tile-page');
			this.style.border = "0";
			this.reset();
			cr.dispatchSimpleEvent(document, 'sectionready', true, true, loadTimeData.getInteger('search_box_page_id'));
		},

		reset: function () {
			this.tabIndex = -1;
			this.data_ = null;
			this.id = 'iframeSearchBoxDiv';
			this.title = '';
		},
		
		setHtml : function() {
		    var iframe = document.createElement("IFRAME");
		    iframe.id = "iframeSearchBox";
		    iframe.style.border = "0";
		    iframe.style.width = "100%";
		    iframe.style.height = "100%";
		    //iframe.style = "border:0;width:100%;height:100%";
		    this.appendChild(iframe);
		    iframe.src = conduit.newtab.searchBox.iframeUrl;
		},
		
		disallowEnter : function () {
		    return;
			var form = $("#iframeSearchBox").contents().find("form")[0];
			form.onsubmit = function() { return false; };
		},
		
		allowEnter : function () {
		    return;
			$("#iframeSearchBox")[0].contentWindow.bindOnSubmit();
		},
		
		handleMouseWheel : function (e) {
			return;
		},
		
		shouldAcceptDrag :function (e) {
			return false;
		}
	};

	SearchBoxPage.onLoaded = function () {
        document.onclick = function() {
            ntp.PageListView.prototype.documentClick();
	    };
	};

	SearchBoxPage.closeMsg = function() {
		
	};

	return {
		SearchBoxPage	: SearchBoxPage
	};
});

document.addEventListener('ntpLoaded', ntp.SearchBoxPage.onLoaded);