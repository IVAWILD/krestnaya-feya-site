// «Крестная фея»: главная страница. Данные приходят из js/data.js (window.KATALOG, window.HITY).
(function () {
  var WA = "79655960804";
  var KAT = window.KATALOG || [];
  var HITY = window.HITY || [];
  var PAGE = 8;

  var HEIGHTS = [98, 104, 110, 116, 122, 128, 134, 140, 146];
  // Группы цветов: слова из колонки «цвет» таблицы каталога
  var COLORS = [
    { id: "pink", label: "Розовые и пудровые", dot: "#EDB8C0", words: ["розов", "пудров"] },
    { id: "white", label: "Белые и айвори", dot: "#FBF5EA", words: ["бел", "айвори", "кремов", "молочн", "бежев"] },
    { id: "blue", label: "Голубые и мятные", dot: "#A9CBE8", words: ["голуб", "син", "мятн", "салатов"] },
    { id: "violet", label: "Сиреневые", dot: "#C4A6DD", words: ["фиолет"] },
    { id: "bright", label: "Яркие", dot: "#F2C230", words: ["ярк", "желт", "оранж", "красн"] },
    { id: "dark", label: "Тёмные и серебро", dot: "#4A4446", words: ["черн", "сер", "золот"] }
  ];

  function rub(n) { return n.toLocaleString("ru-RU").replace(/\s/g, " ") + " ₽"; }
  function waLink(text) { return "https://wa.me/" + WA + "?text=" + encodeURIComponent(text); }
  function esc(s) { return String(s).replace(/[&<>"]/g, function (c) { return { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" }[c]; }); }

  // Все кнопки записи открывают WhatsApp с готовым текстом
  document.querySelectorAll(".js-wa").forEach(function (a) {
    a.href = waLink(a.getAttribute("data-text") || "Здравствуйте!");
  });

  function fits(item, h) {
    return item.heights.some(function (r) { return h >= r[0] && h <= r[1]; });
  }
  function colorOf(item, cid) {
    var g = COLORS.filter(function (c) { return c.id === cid; })[0];
    var low = (item.color || "").toLowerCase().replace(/ё/g, "е");
    return g.words.some(function (w) { return low.indexOf(w) !== -1; });
  }

  function card(item, tag) {
    var title = item.named ? "«" + item.name + "»" : "платье " + item.id;
    var msg = "Здравствуйте! Хочу примерить " + title + " (" + item.id + "). Рост ребёнка: ___, дата праздника: ___";
    return '<article class="card">' +
      '<a class="card__photo" href="#" aria-label="' + esc(item.name) + '">' +
        (tag ? '<span class="card__tag">' + tag + "</span>" : "") +
        '<img src="' + item.img + '" alt="' + esc(item.name) + ", рост " + item.heightText + '" loading="lazy" width="720" height="900">' +
      "</a>" +
      '<a class="card__name' + (item.named ? "" : " card__name--num") + '" href="#">' + esc(item.name) + "</a>" +
      '<p class="card__meta">Рост ' + item.heightText + "</p>" +
      '<p class="card__price">' + rub(item.price) + " <small>/ сутки</small></p>" +
      '<a class="card__btn" href="' + waLink(msg) + '" target="_blank" rel="noopener"><svg class="ico"><use href="#i-wa"/></svg>Примерить</a>' +
      "</article>";
  }

  var NOVINKI = window.NOVINKI || [];
  function tagFor(item) {
    if (HITY.indexOf(item.id) !== -1) return "Хит";
    if (NOVINKI.indexOf(item.id) !== -1) return "Новинка";
    if (item.sale) return "Можно купить";
    return "";
  }

  // ---------- Хиты ----------
  var hitsGrid = document.getElementById("hits-grid");
  if (hitsGrid) {
    hitsGrid.innerHTML = HITY.map(function (id) {
      var it = KAT.filter(function (k) { return k.id === id; })[0];
      return it ? card(it, "Хит") : "";
    }).join("");
  }

  // ---------- Подбор ----------
  var state = { h: null, c: null, shown: PAGE };
  var hBox = document.getElementById("pick-height");
  var cBox = document.getElementById("pick-color");
  var grid = document.getElementById("pick-grid");
  var count = document.getElementById("pick-count");
  var more = document.getElementById("pick-more");

  function chip(value, label, checked, dot) {
    return '<button type="button" class="chip" role="radio" aria-checked="' + checked + '" data-v="' + value + '">' +
      (dot ? '<span class="chip__dot" style="background:' + dot + '"></span>' : "") + label + "</button>";
  }
  function drawChips() {
    hBox.innerHTML = chip("", "Любой", state.h === null) +
      HEIGHTS.map(function (h) { return chip(h, h, state.h === h); }).join("");
    cBox.innerHTML = chip("", "Любой", state.c === null) +
      COLORS.map(function (c) { return chip(c.id, c.label, state.c === c.id, c.dot); }).join("");
  }

  function plural(n) {
    var a = n % 10, b = n % 100;
    if (a === 1 && b !== 11) return "модель";
    if (a >= 2 && a <= 4 && (b < 12 || b > 14)) return "модели";
    return "моделей";
  }

  function drawResults() {
    var list = KAT.filter(function (it) {
      return (state.h === null || fits(it, state.h)) && (state.c === null || colorOf(it, state.c));
    }).sort(function (a, b) {
      return (b.named - a.named) || (b.price - a.price);
    });
    var who = state.h === null ? "В каталоге" : "На рост " + state.h + " см";
    count.textContent = list.length
      ? who + " " + list.length + " " + plural(list.length)
      : "Таких платьев на сайте нет, но загляните в шоурум: там больше моделей";
    grid.innerHTML = list.slice(0, state.shown).map(function (it) { return card(it, tagFor(it)); }).join("");
    more.hidden = list.length <= state.shown;
    more.textContent = "Показать ещё " + Math.min(PAGE, list.length - state.shown);
    // Кнопка «Открыть в каталоге» ведёт в каталог с теми же ростом и цветом
    var toKat = document.getElementById("pick-katalog");
    if (toKat) {
      var q = [];
      if (state.h !== null) q.push("rost=" + state.h);
      if (state.c !== null) q.push("cvet=" + state.c);
      toKat.href = "katalog.html" + (q.length ? "?" + q.join("&") : "");
    }
  }

  if (hBox && cBox) {
    drawChips(); drawResults();
    hBox.addEventListener("click", function (e) {
      var b = e.target.closest(".chip"); if (!b) return;
      state.h = b.dataset.v === "" ? null : +b.dataset.v; state.shown = PAGE;
      drawChips(); drawResults();
    });
    cBox.addEventListener("click", function (e) {
      var b = e.target.closest(".chip"); if (!b) return;
      state.c = b.dataset.v === "" ? null : b.dataset.v; state.shown = PAGE;
      drawChips(); drawResults();
    });
    more.addEventListener("click", function () { state.shown += PAGE; drawResults(); });
  }

  // ---------- Страница «Купить платье» ----------
  var PROD = window.PRODAZHA || [];
  var sGrid = document.getElementById("sale-grid");
  var sBox = document.getElementById("sale-height");
  var sCount = document.getElementById("sale-count");
  var sMore = document.getElementById("sale-more");
  var sState = { h: null, shown: 12 };

  function saleCard(item) {
    var title = item.named ? "«" + item.name + "»" : "платье " + item.id;
    var msg = "Здравствуйте! Хочу купить " + title + " (" + item.id + ") за " + item.sale + " ₽. Оно ещё в наличии? Рост ребёнка: ___";
    return '<article class="card">' +
      '<a class="card__photo" href="#" aria-label="' + esc(item.name) + '">' +
        (item.price ? '<span class="card__tag">Есть в прокате</span>' : "") +
        '<img src="' + item.img + '" alt="' + esc(item.name) + '" loading="lazy" width="720" height="900">' +
      "</a>" +
      '<a class="card__name' + (item.named ? "" : " card__name--num") + '" href="#">' + esc(item.name) + "</a>" +
      '<p class="card__meta">' + (item.heightText ? "Рост " + item.heightText : "Рост уточняйте") + "</p>" +
      '<p class="card__price">' + rub(item.sale) + " <small>купить</small></p>" +
      (item.price ? '<p class="card__meta">Прокат ' + rub(item.price) + " / сутки</p>" : "") +
      '<a class="card__btn" href="' + waLink(msg) + '" target="_blank" rel="noopener"><svg class="ico"><use href="#i-wa"/></svg>Узнать о наличии</a>' +
      "</article>";
  }
  function drawSale() {
    var list = PROD.filter(function (it) { return sState.h === null || (it.heights.length && fits(it, sState.h)); });
    sCount.textContent = list.length
      ? (sState.h === null ? "Сейчас на сайте " : "На рост " + sState.h + " см ") + list.length + " " + plural(list.length)
      : "На этот рост в продаже на сайте ничего нет. Напишите нам: подскажем, что есть в шоуруме";
    sGrid.innerHTML = list.slice(0, sState.shown).map(saleCard).join("");
    sMore.hidden = list.length <= sState.shown;
    sMore.textContent = "Показать ещё " + Math.min(12, list.length - sState.shown);
  }
  if (sGrid && sBox) {
    var drawSaleChips = function () {
      sBox.innerHTML = chip("", "Любой", sState.h === null) +
        HEIGHTS.map(function (h) { return chip(h, h, sState.h === h); }).join("");
    };
    drawSaleChips(); drawSale();
    sBox.addEventListener("click", function (e) {
      var b = e.target.closest(".chip"); if (!b) return;
      sState.h = b.dataset.v === "" ? null : +b.dataset.v; sState.shown = 12;
      drawSaleChips(); drawSale();
    });
    sMore.addEventListener("click", function () { sState.shown += 12; drawSale(); });
  }

  // ---------- Каталог (katalog.html) ----------
  // Фильтры живут в адресе: katalog.html?rost=116&cvet=pink&dlina=midi&cena=do3000&nov=1&sort=deshevle
  var LENGTHS = [
    { id: "koktejl", label: "До колена" },
    { id: "midi", label: "Миди" },
    { id: "maksi", label: "В пол" }
  ];
  var PRICES = [
    { id: "do3000", label: "до 3 000 ₽", lo: 0, hi: 3000 },
    { id: "3000-4000", label: "3 000–4 000 ₽", lo: 3001, hi: 4000 },
    { id: "ot4000", label: "дороже 4 000 ₽", lo: 4001, hi: 1e9 }
  ];
  var KPAGE = 12;

  function platya(n) {
    var a = n % 10, b = n % 100;
    if (a === 1 && b !== 11) return "платье";
    if (a >= 2 && a <= 4 && (b < 12 || b > 14)) return "платья";
    return "платьев";
  }
  function byId(list, id) { return list.filter(function (x) { return x.id === id; })[0]; }

  var kGrid = document.getElementById("kat-grid");
  if (kGrid) {
    var f = { rost: null, cvet: null, dlina: null, cena: null, nov: false, sort: "", shown: KPAGE };
    var el = function (id) { return document.getElementById(id); };
    var panel = el("kat-panel"), shade = el("kat-shade"), openBtn = el("kat-open"), lastFocus = null;

    // Читаем адрес, неизвестные значения пропускаем
    var qs = new URLSearchParams(location.search);
    var r = +qs.get("rost");
    if (HEIGHTS.indexOf(r) !== -1) f.rost = r;
    if (byId(COLORS, qs.get("cvet"))) f.cvet = qs.get("cvet");
    if (byId(LENGTHS, qs.get("dlina"))) f.dlina = qs.get("dlina");
    if (byId(PRICES, qs.get("cena"))) f.cena = qs.get("cena");
    f.nov = qs.get("nov") === "1";
    if (qs.get("sort") === "deshevle" || qs.get("sort") === "dorozhe") f.sort = qs.get("sort");

    var writeUrl = function () {
      var p = [];
      if (f.rost !== null) p.push("rost=" + f.rost);
      if (f.cvet) p.push("cvet=" + f.cvet);
      if (f.dlina) p.push("dlina=" + f.dlina);
      if (f.cena) p.push("cena=" + f.cena);
      if (f.nov) p.push("nov=1");
      if (f.sort) p.push("sort=" + f.sort);
      history.replaceState(null, "", location.pathname + (p.length ? "?" + p.join("&") : ""));
    };

    var match = function (it, skip) {
      if (skip !== "rost" && f.rost !== null && !fits(it, f.rost)) return false;
      if (skip !== "cvet" && f.cvet && !colorOf(it, f.cvet)) return false;
      if (skip !== "dlina" && f.dlina && (it.lengths || []).indexOf(f.dlina) === -1) return false;
      if (skip !== "cena" && f.cena) { var pr = byId(PRICES, f.cena); if (it.price < pr.lo || it.price > pr.hi) return false; }
      if (skip !== "nov" && f.nov && NOVINKI.indexOf(it.id) === -1) return false;
      return true;
    };
    var listNow = function () {
      return KAT.filter(function (it) { return match(it); }).sort(function (a, b) {
        if (f.sort === "deshevle") return (a.price - b.price) || (b.named - a.named);
        if (f.sort === "dorozhe") return (b.price - a.price) || (b.named - a.named);
        return (b.named - a.named) || (b.price - a.price);
      });
    };
    // Сколько платьев останется, если выбрать этот вариант (остальные фильтры как есть)
    var countWith = function (key, val) {
      var keep = f[key]; f[key] = val;
      var n = KAT.filter(function (it) { return match(it); }).length;
      f[key] = keep; return n;
    };

    var kchip = function (key, value, label, dot) {
      var on = f[key] === value;
      var n = on ? null : countWith(key, value);
      var dis = !on && value !== null && n === 0;
      return '<button type="button" class="chip" role="radio" aria-checked="' + on + '" data-k="' + key + '" data-v="' + (value === null ? "" : value) + '"' +
        (dis ? ' disabled title="С этими фильтрами таких нет"' : "") + ">" +
        (dot ? '<span class="chip__dot" style="background:' + dot + '"></span>' : "") + label + "</button>";
    };

    var drawFilters = function () {
      el("f-rost").innerHTML = kchip("rost", null, "Любой") +
        HEIGHTS.map(function (h) { return kchip("rost", h, h); }).join("");
      el("f-cvet").innerHTML = kchip("cvet", null, "Любой") +
        COLORS.map(function (c) { return kchip("cvet", c.id, c.label, c.dot); }).join("");
      el("f-dlina").innerHTML = kchip("dlina", null, "Любая") +
        LENGTHS.map(function (l) { return kchip("dlina", l.id, l.label); }).join("");
      el("f-cena").innerHTML = kchip("cena", null, "Любая") +
        PRICES.map(function (p) { return kchip("cena", p.id, p.label.replace(/ /g, " ")); }).join("");
      el("f-nov").innerHTML = '<button type="button" class="chip" aria-pressed="' + f.nov + '" data-k="nov">Только новинки сезона</button>';
    };

    var active = function () {
      var a = [];
      if (f.rost !== null) a.push(["rost", "Рост " + f.rost + " см"]);
      if (f.cvet) a.push(["cvet", byId(COLORS, f.cvet).label]);
      if (f.dlina) a.push(["dlina", byId(LENGTHS, f.dlina).label]);
      if (f.cena) a.push(["cena", byId(PRICES, f.cena).label]);
      if (f.nov) a.push(["nov", "Новинки"]);
      return a;
    };

    var drawList = function () {
      var list = listNow();
      var n = list.length;
      el("kat-count").textContent = n
        ? n + " " + platya(n) + (f.rost !== null ? " на рост " + f.rost + " см" : " в каталоге")
        : "Ничего не нашли";
      kGrid.innerHTML = list.slice(0, f.shown).map(function (it) { return card(it, tagFor(it)); }).join("");
      kGrid.hidden = !n;
      el("kat-empty").hidden = !!n;
      var more = el("kat-more");
      more.hidden = n <= f.shown;
      more.textContent = "Показать ещё " + Math.min(KPAGE, n - f.shown);
      el("kat-apply").textContent = n ? "Показать " + n + " " + platya(n) : "Ничего не нашли";

      // Выбранные фильтры: метки с крестиком и счётчик на кнопке «Фильтры» (рост виден и так, его не считаем)
      var a = active();
      el("kat-active").innerHTML = a.filter(function (x) { return x[0] !== "rost"; }).map(function (x) {
        return '<button type="button" class="kat__pill" data-k="' + x[0] + '" aria-label="Убрать фильтр: ' + esc(x[1]) + '">' +
          esc(x[1]).replace(/ /g, " ") + '<svg class="ico"><use href="#i-x"/></svg></button>';
      }).join("");
      var extra = a.filter(function (x) { return x[0] !== "rost"; }).length;
      ["kat-badge", "dock-badge"].forEach(function (id) {
        var b = el(id); if (!b) return;
        b.hidden = !extra; b.textContent = extra;
      });
      el("kat-reset").disabled = !a.length;
    };

    var redraw = function () { f.shown = KPAGE; drawFilters(); drawList(); writeUrl(); };

    // Клики по чипам во всех группах
    document.querySelector(".kat").addEventListener("click", function (e) {
      var b = e.target.closest(".chip");
      if (!b || b.disabled) return;
      var k = b.dataset.k, v = b.dataset.v;
      if (k === "nov") f.nov = !f.nov;
      else if (k === "rost") f.rost = v === "" ? null : +v;
      else f[k] = v === "" ? null : v;
      redraw();
    });
    el("kat-active").addEventListener("click", function (e) {
      var b = e.target.closest(".kat__pill"); if (!b) return;
      var k = b.dataset.k;
      if (k === "nov") f.nov = false; else f[k] = null;
      redraw();
    });
    var resetAll = function () { f.rost = f.cvet = f.dlina = f.cena = null; f.nov = false; redraw(); };
    el("kat-reset").addEventListener("click", resetAll);
    el("kat-reset2").addEventListener("click", resetAll);
    el("kat-more").addEventListener("click", function () { f.shown += KPAGE; drawList(); });
    var sortSel = el("kat-sort");
    sortSel.value = f.sort;
    sortSel.addEventListener("change", function () { f.sort = sortSel.value; f.shown = KPAGE; drawList(); writeUrl(); });

    // Панель фильтров на телефоне
    var setOpen = function (open) {
      panel.classList.toggle("is-open", open);
      shade.hidden = !open;
      document.documentElement.classList.toggle("kat-lock", open);
      openBtn.setAttribute("aria-expanded", open);
      if (open) { lastFocus = document.activeElement; el("kat-close").focus(); }
      else if (lastFocus) { lastFocus.focus(); lastFocus = null; }
    };
    var showResults = function () {
      setOpen(false);
      var top = el("kat-count").getBoundingClientRect().top + window.scrollY - 140;
      if (window.scrollY > top) window.scrollTo(0, top);
    };
    openBtn.addEventListener("click", function () { setOpen(true); });
    var dockF = el("dock-filter");
    if (dockF) dockF.addEventListener("click", function () { setOpen(true); });
    el("kat-close").addEventListener("click", function () { setOpen(false); });
    shade.addEventListener("click", function () { setOpen(false); });
    el("kat-apply").addEventListener("click", showResults);
    document.addEventListener("keydown", function (e) {
      if (e.key === "Escape" && panel.classList.contains("is-open")) setOpen(false);
    });
    // Перешли на ширину компьютера с открытой панелью: закрываем
    window.matchMedia("(min-width: 1024px)").addEventListener("change", function (m) {
      if (m.matches && panel.classList.contains("is-open")) setOpen(false);
    });

    drawFilters(); drawList();
  }

  // ---------- Нижняя панель на телефоне ----------
  var dock = document.getElementById("dock");
  var hero = document.querySelector(".hero");
  var foot = document.querySelector(".foot");
  if (dock && hero && foot && "IntersectionObserver" in window) {
    var heroVisible = true, footVisible = false;
    var upd = function () { dock.classList.toggle("is-on", !heroVisible && !footVisible); };
    new IntersectionObserver(function (e) { heroVisible = e[0].isIntersecting; upd(); }).observe(hero);
    new IntersectionObserver(function (e) { footVisible = e[0].isIntersecting; upd(); }).observe(foot);
  }
})();
