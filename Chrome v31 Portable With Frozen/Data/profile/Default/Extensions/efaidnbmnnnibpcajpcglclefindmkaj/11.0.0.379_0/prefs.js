var bgPage = chrome.extension.getBackgroundPage();

function ToggleViewResultCheckboxPrefs()
{
  var isChecked = bgPage.toggleViewResultsPreferenceState();
  document.getElementById("acro_web2pdf_ViewResultsCheckbox").checked = isChecked;
  window.close();
}

