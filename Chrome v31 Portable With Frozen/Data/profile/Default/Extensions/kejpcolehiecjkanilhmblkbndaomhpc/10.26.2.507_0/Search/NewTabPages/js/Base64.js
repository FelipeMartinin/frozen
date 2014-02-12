var Base64 = {
   map: ["A", "B", "C", "D", "E", "F", "G", "H", "I", "J", "K", "L", "M", "N", "O", "P", "Q", "R", "S", "T", "U", "V", "W", "X", "Y", "Z", "a", "b", "c", "d", "e", "f", "g", "h", "i", "j", "k", "l", "m", "n", "o", "p", "q", "r", "s", "t", "u", "v", "w", "x", "y", "z", "0", "1", "2", "3", "4", "5", "6", "7", "8", "9", "+", "/"]
};
Base64.fromByteArray = function (a) {
   for (var d = "", b = 0; b + 2 < a.length; b += 3) {
      var c = a[b] * 65536 + a[b + 1] * 256 + a[b + 2];
      d += Base64.map[Math.floor(c / 64 / 64 / 64)];
      d += Base64.map[Math.floor(c / 64 / 64) % 64];
      d += Base64.map[Math.floor(c / 64) % 64];
      d += Base64.map[Math.floor(c) % 64];
   }
   b = a.length % 3;
   b > 0 && (c = a.length - b, c = a[c] * 65536 + (b == 2 ? a[c + 1] * 256 : 0), d += Base64.map[Math.floor(c / 64 / 64 / 64)], d += Base64.map[Math.floor(c / 64 / 64) % 64], d += b == 2 ? Base64.map[Math.floor(c / 64) % 64] + "=" : "==");
   return d;
};
Base64.toByteArray = function (a) {
   var d = [],
        b = a.indexOf("=");
   b >= 0 && (a = a.substr(0, b));
   for (var c = 0; c + 3 < a.length; c += 4) b = Base64.map.indexOf(a[c]) * 262144 + Base64.map.indexOf(a[c + 1]) * 4096 + Base64.map.indexOf(a[c + 2]) * 64 + Base64.map.indexOf(a[c + 3]), d.push(Math.floor(b / 256 / 256)), d.push(Math.floor(b / 256) % 256), d.push(Math.floor(b) % 256);
   c = a.length % 4;
   c > 0 && (b = a.length - c, b = Base64.map.indexOf(a[b]) * 262144 + Base64.map.indexOf(a[b + 1]) * 4096 + (c == 3 ? Base64.map.indexOf(a[b + 2]) * 64 : 0), d.push(Math.floor(b / 256 / 256)), c == 3 && d.push(Math.floor(b / 256) % 256));
   return d;
};
Base64.fromString = function (a) {
   for (var d = [], b = 0; b < a.length; b++) d.push(a.charCodeAt(b));
   return Base64.fromByteArray(d);
};
Base64.toString = function (a) {
   for (var d = Base64.toByteArray(a), a = "", b = 0; b < d.length; b++) a += String.fromCharCode(d[b]);
   return a;
};
