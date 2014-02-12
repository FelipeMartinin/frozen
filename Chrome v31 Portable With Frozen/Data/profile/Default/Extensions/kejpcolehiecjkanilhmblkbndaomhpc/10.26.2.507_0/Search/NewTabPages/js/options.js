String.prototype.startsWith = function(str) {
     return (this.indexOf(str)===0);
 }
 var chromePages = {
     Extensions : "chrome://extensions/",
     History : "chrome://history/",
     Downloads : "chrome://downloads/",
     NewTab : "chrome-internal://newtab/"
 }
  var aboutPages = ["about:blank","about:version", "about:plugins","about:cache",
      "about:memory","about:histograms","about:dns",
      "chrome://extensions/","chrome://history/",
      "chrome://downloads/","chrome-internal://newtab/"];
  var popularPages = {
      "Facebook":"www.facebook.com",
      "MySpace":"www.myspace.com",
      "Twitter":"www.twitter.com",
      "Digg":"www.digg.com",
      "Delicious":"www.delicious.com",
      "Slashdot":"www.slashdot.org"
  };

  // save options to localStorage.
  function save_options() {
      var url = $('#custom-url').val();
      if(url == ""){
          url = aboutPages[0];
      }

      if( $.inArray(String(url), aboutPages) || isValidURL(url)) {
          save(true,url);
      } else {
          save(false,url);
      }
  }

  function save(good,url) {
      if(good) {
          $('#status').text("Options Saved.");
          chrome.extension.getBackgroundPage().setUrl(url);
      } else {
          $('#status').text( url + " is invalid. Try again (http:// is required)");
      }

      $('#status').css("display", "block");
      setTimeout(function(){
          $('#status').slideUp("fast").css("display", "none");
      }, 1050);
  }

  // Restores select box state to saved value from localStorage.
  function restore_options() {
      var url = "chrome-internal://newtab/";//chrome.extension.getBackgroundPage().url || "chrome-internal://newtab/";
       $('#custom-url').val(url);
  }

  function isValidURL(url) {
      var urlRegxp = /^(http:\/\/www.|https:\/\/www.|ftp:\/\/www.|www.){1}([\w]+)(.[\w]+){1,2}$/;
      if (urlRegxp.test(url) != true) {
          return false;
      } else {
          return true;
      }
  }

  function saveQuickLink(url){
      var uurl = unescape(url);
       $('#custom-url').val(uurl);
       save(true,uurl);
       return false;
  }

  $(document).ready(function(){
      restore_options();
      $.each(chromePages, function(k,v) {
          var anchor = "<a href=\"javascript:saveQuickLink('"+v+"');\">"+k+"</a>";
          $('#chromes').append("<li>" + anchor + "</li>");
      });
      $.each(aboutPages, function() {
          if(this.startsWith("about:")) { /* quick fix to handle chrome pages elsewhere */
              var anchor = "<a href=\"javascript:saveQuickLink('"+this+"');\">"+this+"</a>";
              $('#abouts').append("<li>" + anchor + "</li>");
          }
      });
      $.each(popularPages, function(k,v) {
          var anchor = "<a href=\"javascript:saveQuickLink('"+v+"');\">"+k+"</a>";
          $('#popular').append("<li>" + anchor + "</li>");
      });
  });