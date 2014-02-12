// Initialize/create the database
function openDb(force) {
   // Hopefully prevent issue #47 from happening... don't try to load the database if the page isn't ready
   if (!$(document).ready()) {
      return false;
   }
   if (!window.db) {
      window.db = openDatabase('newTabDatabase', '1.0', 'NewTab data', 100 * 1024 * 1024);
   }

   if (window.db) {
      if (localStorage.indexComplete == 1 || force == true) {
         return true;
      } else {
         return false;
      }
   }
   else {
      alert("error: Unable to create or open SQLite database.");
      return false;
   }

}
