(function () {
  function trimSlash(v) {
    return (v || "").replace(/\/+$/, "");
  }

  function readApiBase() {
    var fromGlobal = typeof window !== "undefined" ? window.BENNO111_API_BASE : "";
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

  var apiBase = readApiBase();
  var wsBase = apiBase.replace(/^http:/, "ws:").replace(/^https:/, "wss:");

  window.__BENNO111_RUNTIME__ = {
    apiBase: apiBase,
    wsBase: wsBase,
    apiUrl: function (path) {
      return new URL(path, apiBase + "/").toString();
    }
  };

  var nativeFetch = window.fetch ? window.fetch.bind(window) : null;
  if (nativeFetch) {
    window.fetch = function (input, init) {
      if (typeof input === "string" && input.indexOf("/api/") === 0) {
        input = window.__BENNO111_RUNTIME__.apiUrl(input);
      } else if (input instanceof Request && /^\/api\//.test(input.url)) {
        input = new Request(window.__BENNO111_RUNTIME__.apiUrl(input.url), input);
      }
      return nativeFetch(input, init);
    };
  }
})();
