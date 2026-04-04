(function () {
  const script = document.currentScript;
  const apiBase =
    (script && script.getAttribute("data-api")) ||
    (typeof window !== "undefined" ? window.location.origin : "");

  const styles = document.createElement("style");
  styles.textContent = `
    .embed-login {
      font-family: Arial, sans-serif;
      background: #0f172a;
      color: #e5e7eb;
      padding: 12px;
      border-radius: 8px;
      width: 260px;
      box-shadow: 0 6px 20px rgba(0,0,0,0.35);
    }
    .embed-login h4 { margin: 0 0 8px 0; font-size: 15px; }
    .embed-login label { font-size: 12px; display:block; margin-top:8px; }
    .embed-login input {
      width: 100%;
      padding: 8px;
      margin-top: 4px;
      border-radius: 6px;
      border: 1px solid #1f2937;
      background: #111827;
      color: #e5e7eb;
    }
    .embed-login button {
      width: 100%;
      margin-top: 12px;
      padding: 10px;
      border: none;
      border-radius: 6px;
      background: #2563eb;
      color: #fff;
      cursor: pointer;
      font-weight: 600;
    }
    .embed-login button:disabled { opacity: 0.6; cursor: not-allowed; }
    .embed-login .status { font-size: 12px; margin-top: 8px; min-height: 16px; }
    .embed-login .status.error { color: #f97316; }
  `;

  const container = document.createElement("div");
  container.className = "embed-login";
  container.innerHTML = `
    <h4>Sign in</h4>
    <label>Username</label>
    <input type="text" id="embedUser" placeholder="username">
    <label>Email</label>
    <input type="email" id="embedEmail" placeholder="you@example.com">
    <label>Password</label>
    <input type="password" id="embedPass" placeholder="password">
    <button id="embedLoginBtn">Login</button>
    <div class="status" id="embedStatus"></div>
  `;

  function setStatus(msg, isError) {
    const el = container.querySelector("#embedStatus");
    if (!el) return;
    el.textContent = msg || "";
    el.className = "status" + (isError ? " error" : "");
  }

  async function doLogin() {
    const btn = container.querySelector("#embedLoginBtn");
    const user = container.querySelector("#embedUser").value.trim();
    const email = container.querySelector("#embedEmail").value.trim();
    const pass = container.querySelector("#embedPass").value;
    if (!user || !email || !pass) {
      setStatus("Enter username, email, and password.", true);
      return;
    }
    btn.disabled = true;
    setStatus("Signing in...");
    try {
      const res = await fetch(apiBase + "/api/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ username: user, email: email, password: pass }),
      });
      const data = await res.json().catch(() => null);
      if (!res.ok || !data || !data.success || !data.token) {
        setStatus((data && data.error) || "Login failed.", true);
        btn.disabled = false;
        return;
      }
      setStatus("Logged in as " + (data.username || user));
      const detail = { token: data.token, username: data.username || user };
      window.dispatchEvent(new CustomEvent("chatLoginSuccess", { detail }));
      if (window.parent && window.parent !== window) {
        const targetOrigin =
          (script && script.getAttribute("data-post-origin")) || "*";
        window.parent.postMessage(
          { type: "chatLoginSuccess", payload: detail },
          targetOrigin
        );
      }
    } catch (err) {
      setStatus("Network error.", true);
    } finally {
      btn.disabled = false;
    }
  }

  container.querySelector("#embedLoginBtn").addEventListener("click", doLogin);
  container.querySelector("#embedPass").addEventListener("keydown", (e) => {
    if (e.key === "Enter") doLogin();
  });

  const host = script && script.parentNode ? script.parentNode : document.body;
  if (document.head) document.head.appendChild(styles);
  host.insertBefore(container, script);
})();
