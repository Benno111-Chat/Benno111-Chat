(function () {
  function trimSlash(v) { return (v || "").replace(/\/+$/, ""); }

  function inferBasePath() {
    var pathname = window.location.pathname || "/";
    var parts = pathname.split("/").filter(Boolean);
    var isGithubIo = /github\.io$/i.test(window.location.hostname || "");
    if (isGithubIo && parts.length > 0) return "/" + parts[0];
    return "";
  }

  function readApiBase() {
    var fromGlobal = window.BENNO111_API_BASE;
    if (fromGlobal) return trimSlash(String(fromGlobal));
    try {
      var fromStorage = localStorage.getItem("apiBaseUrl") || localStorage.getItem("BENNO111_API_BASE");
      if (fromStorage) return trimSlash(fromStorage);
    } catch (_) {}
    var params = new URLSearchParams(window.location.search || "");
    var fromQuery = params.get("api") || params.get("apiBase");
    if (fromQuery) return trimSlash(fromQuery);
    return trimSlash(window.location.origin);
  }

  var basePath = inferBasePath();
  var apiBase = readApiBase();
  var wsBase = apiBase.replace(/^http:/, "ws:").replace(/^https:/, "wss:");

  window.__BENNO111_RUNTIME__ = {
    basePath: basePath,
    apiBase: apiBase,
    wsBase: wsBase,
    appPath: function (path) { return basePath + (path || "/"); },
    apiUrl: function (path) { return new URL(path, apiBase + "/").toString(); }
  };

  var nativeFetch = window.fetch ? window.fetch.bind(window) : null;
  if (nativeFetch) {
    window.fetch = function (input, init) {
      if (typeof input === "string" && input.indexOf("/api/") === 0) {
        input = window.__BENNO111_RUNTIME__.apiUrl(input);
      }
      return nativeFetch(input, init);
    };
  }
})();
