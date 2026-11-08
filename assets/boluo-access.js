/* Optional public demo account. Every page remains fully available to guests.
   Credentials are displayed; this is not private-data authentication. */
(function () {
  "use strict";

  function createAccess(options) {
    var base = new URL(options.baseUrl);
    var clock = options.now || Date.now;
    var storage = options.storage;
    var key = "boluo.public-experience.v1";
    var account = "boluo";
    var password = "123456";
    var home = new URL("v11/index.html", base);
    var entrance = new URL("login.html", base);
    var day = 24 * 60 * 60 * 1000;

    function nextUrl(raw) {
      try {
        var target = new URL(raw || home.href, base);
        var decoded = decodeURIComponent(target.pathname);
        var scope = decodeURIComponent(base.pathname);
        if (target.origin !== base.origin || target.username || target.password ||
            !decoded.startsWith(scope) || /[\u0000-\u0020\\]/.test(decoded) ||
            /\/\.\.?(?:\/|$)/.test(decoded)) return home.href;
        if (target.pathname.endsWith("/")) target.pathname += "index.html";
        if (!target.pathname.endsWith(".html")) return home.href;
        if (target.pathname === entrance.pathname ||
            target.pathname === new URL("index.html", base).pathname) {
          var fallback = new URL(home.href);
          fallback.search = target.search;
          fallback.searchParams.delete("next");
          fallback.searchParams.delete("logout");
          fallback.hash = target.hash;
          return fallback.href;
        }
        return target.href;
      } catch (_) {
        return home.href;
      }
    }

    function session() {
      try {
        var saved = JSON.parse(storage.getItem(key) || "null");
        return saved && saved.version === 1 && saved.account === account &&
          Number.isFinite(saved.expiresAt) && saved.expiresAt > clock() ? saved : null;
      } catch (_) {
        return null;
      }
    }

    function login(name, code) {
      if (String(name).trim().toLowerCase() !== account || String(code) !== password) {
        return { ok: false, reason: "credentials" };
      }
      try {
        storage.setItem(key, JSON.stringify({
          version: 1, account: account, expiresAt: clock() + day
        }));
        if (!session()) return { ok: false, reason: "storage" };
        return { ok: true };
      } catch (_) {
        return { ok: false, reason: "storage" };
      }
    }

    function logout() {
      try {
        storage.removeItem(key);
        return !session();
      } catch (_) {
        return false;
      }
    }

    return {
      account: account, password: password, home: home.href,
      nextUrl: nextUrl, session: session, login: login, logout: logout
    };
  }

  if (typeof module === "object" && module.exports) {
    module.exports = { createAccess: createAccess };
    return;
  }

  var script = document.currentScript;
  var storage = null;
  try { storage = window.sessionStorage; } catch (_) {}
  var access = createAccess({
    baseUrl: new URL("../", script.src).href, storage: storage
  });
  window.BoluoAccess = access;
  // Old saved entrance links go straight back to public content.
  if (script.getAttribute("data-bl-access") === "legacy") {
    var params = new URL(window.location.href).searchParams;
    var target = new URL(access.nextUrl(params.get("next")));
    if (!params.get("next")) target.hash = "boluo-account";
    window.location.replace(target.href);
    return;
  }

  function ready(fn) {
    if (document.readyState === "loading") {
      document.addEventListener("DOMContentLoaded", fn, { once: true });
    } else {
      fn();
    }
  }

  ready(function () {
    var main = document.querySelector("main");
    if (!main) return;
    var isHome = window.location.pathname === new URL(access.home).pathname;
    var panel = document.createElement("section");
    panel.id = "boluo-account";
    panel.className = "bl-account-panel";
    panel.setAttribute("aria-labelledby", "blAccountTitle");
    panel.hidden = !isHome && window.location.hash !== "#boluo-account";
    panel.innerHTML = [
      '<div class="bl-account-heading"><h2 id="blAccountTitle">用户登录</h2>',
      '<p>未登录也可完整浏览</p></div>',
      '<form class="bl-account-form" id="blLoginForm" autocomplete="off">',
      '<div class="bl-account-field"><label for="blAccount">账号</label><input id="blAccount" type="text" value="boluo" required maxlength="64" autocapitalize="off" spellcheck="false" autocomplete="off" aria-describedby="blAccountHint blLoginError"></div>',
      '<div class="bl-account-field"><label for="blPassword">密码</label><span class="bl-account-password"><input id="blPassword" type="password" placeholder="输入密码" required maxlength="64" inputmode="numeric" autocomplete="off" aria-describedby="blAccountHint blLoginError">',
      '<button id="blPasswordToggle" class="bl-account-reveal" type="button" aria-label="显示密码" aria-pressed="false">显示</button></span></div>',
      '<button class="bl-account-submit" type="submit">登录</button></form>',
      '<div class="bl-account-help" id="blAccountHelp"><p id="blAccountHint">体验账号 <code>boluo</code> · 密码 <code>123456</code></p>',
      '<button id="blFillCredentials" type="button">一键填入</button></div>',
      '<div class="bl-account-signed" id="blAccountSigned" hidden><span>已登录 <strong>boluo</strong></span><button id="blPanelLogout" type="button">退出登录</button></div>',
      '<p class="bl-account-message" id="blLoginError" role="status" aria-live="polite"></p>'
    ].join("");
    main.insertBefore(panel, main.firstChild);

    var form = panel.querySelector("form");
    var name = panel.querySelector("#blAccount");
    var code = panel.querySelector("#blPassword");
    var message = panel.querySelector("#blLoginError");
    var help = panel.querySelector("#blAccountHelp");
    var signed = panel.querySelector("#blAccountSigned");
    var show = panel.querySelector("#blPasswordToggle");
    var control = null;
    var identity = null;
    var accountButton = null;
    var host = document.querySelector("header .header-actions, header .header-tools") ||
      document.querySelector("header .header-inner, header .sitebar-in") ||
      document.querySelector("header.top, header.site-header");
    if (host) {
      host.classList.add("bl-access-host");
      host.closest("header").classList.add("bl-access-header");
      control = document.createElement("div");
      control.className = "bl-access-control";
      identity = document.createElement("span");
      identity.className = "bl-access-identity";
      accountButton = document.createElement("button");
      accountButton.type = "button";
      accountButton.className = "bl-access-button";
      accountButton.setAttribute("aria-controls", panel.id);
      control.append(identity, accountButton);
      host.appendChild(control);
      accountButton.addEventListener("click", function () {
        if (access.session()) {
          signOut();
        } else {
          panel.hidden = false;
          accountButton.setAttribute("aria-expanded", "true");
          panel.scrollIntoView({ block: "start", behavior: "auto" });
          name.focus({ preventScroll: true });
        }
      });
    }

    function render() {
      var loggedIn = !!access.session();
      form.hidden = loggedIn;
      help.hidden = loggedIn;
      signed.hidden = !loggedIn;
      if (accountButton) {
        identity.textContent = loggedIn ? access.account : "";
        identity.hidden = !loggedIn;
        accountButton.textContent = loggedIn ? "退出" : "登录";
        accountButton.setAttribute("aria-label", loggedIn ? "退出体验账号 boluo" : "打开用户登录");
        if (loggedIn) accountButton.removeAttribute("aria-expanded");
        else accountButton.setAttribute("aria-expanded", String(!panel.hidden));
      }
    }
    function clearMessage() {
      message.textContent = "";
      message.removeAttribute("data-error");
      name.removeAttribute("aria-invalid");
      code.removeAttribute("aria-invalid");
    }
    function signOut() {
      clearMessage();
      if (access.logout()) {
        code.value = "";
        code.type = "password";
        show.textContent = "显示";
        show.setAttribute("aria-label", "显示密码");
        show.setAttribute("aria-pressed", "false");
        message.textContent = "已退出，仍可继续使用全部内容。";
        render();
        if (accountButton) accountButton.focus({ preventScroll: true });
      } else {
        message.textContent = "暂时无法退出，请刷新后重试。页面仍可完整使用。";
        message.setAttribute("data-error", "true");
      }
    }
    panel.querySelector("#blPanelLogout").addEventListener("click", signOut);
    name.addEventListener("input", clearMessage);
    code.addEventListener("input", clearMessage);
    panel.querySelector("#blFillCredentials").addEventListener("click", function () {
      name.value = access.account;
      code.value = access.password;
      clearMessage();
      form.querySelector('[type="submit"]').focus();
    });
    show.addEventListener("click", function () {
      var visible = code.type === "password";
      code.type = visible ? "text" : "password";
      show.textContent = visible ? "隐藏" : "显示";
      show.setAttribute("aria-pressed", String(visible));
      show.setAttribute("aria-label", visible ? "隐藏密码" : "显示密码");
    });
    form.addEventListener("submit", function (event) {
      event.preventDefault();
      clearMessage();
      var result = access.login(name.value, code.value);
      if (!result.ok) {
        message.setAttribute("data-error", "true");
        if (result.reason === "storage") {
          message.textContent = "暂时无法保存登录状态，仍可完整使用页面。";
        } else {
          message.textContent = "账号或密码不正确，请使用公开体验账号。";
          name.setAttribute("aria-invalid", "true");
          code.setAttribute("aria-invalid", "true");
          code.focus();
          code.select();
        }
        return;
      }
      code.value = "";
      render();
      message.textContent = "登录成功，继续浏览当前页面。";
      if (accountButton) accountButton.focus({ preventScroll: true });
    });
    // Login and logout change only account state, never navigation or page content.
    render();
    window.addEventListener("pageshow", render);
    window.addEventListener("focus", render);
    if (window.location.hash === "#boluo-account") panel.scrollIntoView({ block: "start" });
  });
})();
