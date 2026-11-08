/* Public experience entrance. Credentials are deliberately displayed to visitors.
   This is a static-site experience gate, not a private-data authentication service. */
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

    function loginUrl(raw, signedOut) {
      var url = new URL(entrance.href);
      url.searchParams.set("next", nextUrl(raw));
      if (signedOut) url.searchParams.set("logout", "1");
      return url.href;
    }

    return {
      account: account, password: password, home: home.href,
      nextUrl: nextUrl, session: session, login: login,
      logout: logout, loginUrl: loginUrl
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
  var isLogin = script.getAttribute("data-bl-access") === "login";

  function guard() {
    if (access.session()) {
      document.documentElement.removeAttribute("data-boluo-entry");
      return true;
    }
    document.documentElement.setAttribute("data-boluo-entry", "locked");
    window.location.replace(access.loginUrl(window.location.href));
    return false;
  }

  function ready(fn) {
    if (document.readyState === "loading") {
      document.addEventListener("DOMContentLoaded", fn, { once: true });
    } else {
      fn();
    }
  }

  function accountControl() {
    if (document.querySelector(".bl-access-control")) return;
    var host = document.querySelector("header .header-actions, header .header-tools") ||
      document.querySelector("header .header-inner, header .sitebar-in") ||
      document.querySelector("header.top, header.site-header");
    if (!host) return;
    host.classList.add("bl-access-host");
    host.closest("header").classList.add("bl-access-header");
    var control = document.createElement("div");
    control.className = "bl-access-control";
    var identity = document.createElement("span");
    identity.className = "bl-access-identity";
    identity.textContent = access.account;
    var button = document.createElement("button");
    button.type = "button";
    button.className = "bl-access-logout";
    button.textContent = "退出";
    button.setAttribute("aria-label", "退出体验账号 boluo");
    button.addEventListener("click", function () {
      if (access.logout()) {
        window.location.assign(access.loginUrl(window.location.href, true));
      } else {
        button.textContent = "退出失败";
        button.setAttribute("aria-label", "暂时无法退出，请刷新后重试");
      }
    });
    control.append(identity, button);
    host.appendChild(control);
  }

  if (!isLogin) {
    window.addEventListener("pageshow", function () { guard(); });
    if (guard()) ready(accountControl);
    return;
  }

  ready(function () {
    var form = document.getElementById("blLoginForm");
    var name = document.getElementById("blAccount");
    var code = document.getElementById("blPassword");
    var submit = document.getElementById("blLoginSubmit");
    var error = document.getElementById("blLoginError");
    var show = document.getElementById("blPasswordToggle");
    var params = new URL(window.location.href).searchParams;
    var next = access.nextUrl(params.get("next"));
    var names = {
      "index.html": "问题发现", "reality.html": "预期与现实",
      "industry-base.html": "产业底盘", "relations.html": "关系世界",
      "impact.html": "变化影响", "plan.html": "十五五规划", "wind.html": "风洞测试"
    };
    var page = new URL(next).pathname.split("/").pop();
    document.getElementById("blReturnNote").textContent =
      "进入后前往：" + (names[page] || "刚才的页面");
    submit.disabled = false;
    if (access.session()) {
      window.location.replace(next);
      return;
    }

    function clearError() {
      error.textContent = "";
      name.removeAttribute("aria-invalid");
      code.removeAttribute("aria-invalid");
    }
    name.addEventListener("input", clearError);
    code.addEventListener("input", clearError);
    document.getElementById("blFillCredentials").addEventListener("click", function () {
      name.value = access.account;
      code.value = access.password;
      clearError();
      submit.focus();
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
      clearError();
      var result = access.login(name.value, code.value);
      if (!result.ok) {
        if (result.reason === "storage") {
          error.textContent = "浏览器暂时无法保存登录状态。请允许此站点使用本地存储后重试。";
        } else {
          error.textContent = "账号或密码不正确，请使用下方的公开体验账号。";
          name.setAttribute("aria-invalid", "true");
          code.setAttribute("aria-invalid", "true");
          code.focus();
          code.select();
        }
        return;
      }
      submit.disabled = true;
      submit.textContent = "正在进入…";
      window.location.replace(next);
    });
  });
})();
