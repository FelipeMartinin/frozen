var eventHandlerObj = function (eventStr) {

   var eventTarget = new cr.EventTarget;
   var eventType = eventStr;

   return {
      addListener: function (func) {
         eventTarget.addEventListener(eventType, func);
      },

      removeListener: function (func) {
         eventTarget.removeEventListener(eventType, func);
      },

      fireEvent: function (args) {
         eventTarget.dispatchEvent(new Event(eventType), args);
      }

   };
};
