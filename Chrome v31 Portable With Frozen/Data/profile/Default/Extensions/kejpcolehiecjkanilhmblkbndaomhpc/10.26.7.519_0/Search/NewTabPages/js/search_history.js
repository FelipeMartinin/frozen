// Copyright (c) 2012 The Chromium Authors. All rights reserved.
// Use of this source code is governed by a BSD-style license that can be
// found in the LICENSE file.

/**
 * @fileoverview The recently closed menu: button, model data, and menu.
 */

cr.define('ntp', function () {
    'use strict';



    /*var Menu = cr.ui.Menu;
    var MenuButton = cr.ui.MenuButton;*/
    var SearchHistoryButton = cr.ui.define('div');
    var div;
    
    SearchHistoryButton.prototype = {
        __proto__: HTMLDivElement.prototype,

        decorate: function () {
            this.ownerDocument.addEventListener('mousedown', this);
            this.ownerDocument.addEventListener('keydown', this);
            this.ownerDocument.addEventListener('resize', this);
            this.addEventListener('click', this);

            this.addItem_();
        },

        isDivShown: function() {
            return (document.getElementById('footer-menu-search-history').style.display == 'none') ? false : true;
        },

        showDiv: function() {
            document.getElementById('footer-menu-search-history').style.display = 'block';
        },

        hideDiv: function() {
            document.getElementById('footer-menu-search-history').style.display = 'none';
        },    
        addItem_: function () {
            div = this.ownerDocument.createElement('div');
            div.id = 'footer-menu-search-history';
            div.className = 'footer-menu-search-history';
            div.innerHTML = '<div id="searchHistoryClose"><a id="closeHistory">X</a></div><p id="searchHistoryPopupTitle"><b>' + loadTimeData.getValue("manageHistoryText") + '</b></p>' + loadTimeData.getValue("historyInfoText").replace("008ad4","5a5a61;text-decoration:none");
            div.style.display = 'none';
            this.ownerDocument.body.appendChild(div);
        },


        handleEvent: function(e) {
          /*if (!this.div)
            return;*/

          switch (e.type) {
            case 'click':
                document.getElementById('footer-menu-search-history').style.display = this.isDivShown()?this.showDiv():this.hideDiv();
                break;
            case 'mousedown':
              if (e.currentTarget == this.ownerDocument) {
                  if (!this.contains(e.target) && !div.contains(e.target))
                      this.hideDiv();
                  else
                      if (this.isDivShown()) {
                        if (e.target.href && e.target.href.indexOf("mailto") > -1) {
                            document.location.href = e.target.href;
                        }
                      
                       /* if (e.target.id && e.target.id == "closeHistory") {
                            this.hideDiv();
                        }*/
                            
                        this.hideDiv();
                      
                      } else if (e.button == 0) { // Only show the menu when using left
                              // mouse button.
                              this.showDiv();
                      }
                  e.preventDefault();
              } else {
                if (this.isDivShown()) {
                  this.hideDiv();
                } else if (e.button == 0) {  // Only show the menu when using left
                                             // mouse button.
                  this.showDiv();
                  // Prevent the button from stealing focus on mousedown.
                  e.preventDefault();
                }
              }
              break;
           /* case 'keydown':
              this.handleKeyDown(e);
              // If the menu is visible we let it handle all the keyboard events.
              if (this.isMenuShown() && e.currentTarget == this.ownerDocument) {
                this.menu.handleKeyDown(e);
                e.preventDefault();
                e.stopPropagation();
              }
              break;

            case 'activate':
            case 'blur':*/
            case 'resize':
              this.hideDiv();
              break;
          }
        },


        /**
        * Shows the menu, first rebuilding it if necessary.
        * TODO(estade): the right of the menu should align with the right of the
        * button.
        * @override
        */
        showMenu: function () {
            // if (this.needsRebuild_) {
            this.menu.textContent = '';
            this.dataItems_ = this.addItem_();
            this.needsRebuild_ = false;
            //}

            conduit.newtab.usage.CallUsage('ShowHistory_Click_link');
            MenuButton.prototype.showMenu.call(this);
        },

        /*addItem_: function (data) {
            //var isWindow = data.type == 'window';
            var a = this.ownerDocument.createElement('div');
            a.className = 'footer-menu-search-history';
            //if (isWindow) {
            a.href = '';
            a.classList.add('recent-window');
            a.textContent = '<div id="searchHistoryPopupInfo"><p id="searchHistoryPopupTitle"><b>Managing Your Search History</b></p><p id="historyTurnOffMsg" style="display: none;"><br>Your search history has been turned off. <a href="javascript:void(0)" onclick="hManager.turnOffOn();" style="color:#008ad4">Click here</a> to turn it back on.<br></p><p></p><p><br>Search history makes it easier to find the information and sites you’re looking for by displaying your recent searches as you type.<br><br> <b>How to Clear Your Search History</b><br> You can clear your search history or remove individual search terms as follows:<br><br> <b>From Home Page</b></p><ol><li>Start typing in the search box to view your search history.</li><li>Hover over the search term you want to remove and click the <b>delete (“X”) button</b>.</li><li>If you want to clear all of the search terms, click <b>Clear all.</b></li></ol><br><b>From Search Results Page</b><br><ol><li>Click inside the search box to view your search history.</li><li>Hover over the search term you want to remove and click the <b>delete (“X”) button</b>.</li><li>If you want to clear all of the search terms, click <b>Clear all</b>.</li></ol><br> <b>How to Turn Off Search History</b><br> If you do not want to view your search history when you search the web, simply click <b>Turn off history</b> (under the list of your recent search terms). To turn this feature back on, click <b>Turn on history</b>. <br><br> After you turn off search history, your new searches will not be saved.';
            /*} else {
            a.href = data.url;
            a.style.backgroundImage = 'url(chrome://favicon/' + data.url + ')';
            a.textContent = "bla vla vla asdad";
            a.id = data.id;
            }*

            this.menu.appendChild(a);
            // cr.ui.decorate(a, MenuItem);
        }*/

    };

    return {
        SearchHistoryButton: SearchHistoryButton
    };
});
