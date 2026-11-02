// TimeSnap "Install app" capture (same pattern as Eris/Midas). Classic script loaded in <head>
// before React so beforeinstallprompt is never missed. React reads window.__tsInstall.
(function () {
  var s = (window.__tsInstall = window.__tsInstall || { deferred: null, installed: false });
  function emit() { window.dispatchEvent(new Event('ts-install-change')); }
  window.addEventListener('beforeinstallprompt', function (e) { e.preventDefault(); s.deferred = e; emit(); });
  window.addEventListener('appinstalled', function () { s.deferred = null; s.installed = true; emit(); });
})();
