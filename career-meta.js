/* Career meta — 成就 / 技能 / 累計進度
   由 index.html（主頁，局外）同 career.html（局內）共用。
   規則出自 vault：專案/F1/cards/30_成就與技能.md
   一次性成就只給一次 AP；只有四條累計進度有長尾。 */
(function (root) {
  'use strict';

  var META_KEY = 'career.meta.v1';
  var RUN_KEY = 'career.save.v4';
  var OLD_KEY = 'career.save.v3';

  /* ---------- 累計門檻（已按實測「一局里程」校準，見 TIER_UNIT） ---------- */
  var TIER_UNIT = 266;            // 實測一局中位數公里（12 次自動跑：226 / 266 / 306）
  var TIERS = {
    km: [266, 798, 2128, 5320, 13300],
    runs: [1, 3, 8, 20, 50],
    decisions: [27, 81, 216, 540, 1350],
    events: [8, 24, 64, 160, 400]
  };
  var TIER_AP = [20, 40, 80, 150, 300];
  var TIER_LABEL = { km: '總行駛里程', runs: '累計局數', decisions: '累計決策數', events: '累計賽事場數' };
  var TIER_UNITNAME = { km: '公里', runs: '局', decisions: '個決定', events: '場' };

  /* ---------- 一次性成就（23） ---------- */
  var ACH = [
    { id: 'first_run', cat: '里程碑', n: '第一次完成', ap: 50, c: '走完 14→20 一局', f: function (R) { return R.complete; } },
    { id: 'full7', cat: '里程碑', n: '七年全走完', ap: 100, c: '由 14 歲行到 20 歲結算卡', f: function (R) { return R.complete && R.settle; } },

    { id: 'route_f4', cat: '路線', n: '正規出身', ap: 80, c: '以 F4 出口完成', f: function (R) { return R.settle && R.route === 'f4'; } },
    { id: 'route_rally', cat: '路線', n: '拉力出身', ap: 80, c: '以 Rally 出口完成', f: function (R) { return R.settle && R.route === 'rally'; } },
    { id: 'route_street', cat: '路線', n: '街頭出身', ap: 80, c: '以街頭出口完成', f: function (R) { return R.settle && R.route === 'street'; } },
    { id: 'clean_street', cat: '路線', n: '洗白', ap: 150, c: '街頭出身、冇被拉、HEAT < 40 收場', f: function (R) { return R.settle && R.route === 'street' && !R.arrested && R.heat < 40; } },
    { id: 'no_door', cat: '路線', n: '冇門開', ap: 40, c: '17 歲時三道門都開不到', f: function (R) { return R.noDoor; } },

    { id: 'no_injury', cat: '表現', n: '零傷患', ap: 60, c: '一局完成而傷患為 0', f: function (R) { return R.complete && R.inj === 0; } },
    { id: 'family_ok', cat: '表現', n: '家人放心', ap: 60, c: '完局時家人 ≥ 80', f: function (R) { return R.complete && R.family >= 80; } },
    { id: 'exam_first', cat: '表現', n: '一次過', ap: 50, c: '考車筆試路試一次合格', f: function (R) { return R.examPass && R.examFails === 0; } },
    { id: 'manual_all', cat: '表現', n: '識棍波', ap: 70, c: '棍波三題全對並合格', f: function (R) { return R.gear === 'manual' && R.wrong === 0 && R.licence === 'manual'; } },
    { id: 'auto_route', cat: '表現', n: '自動波之路', ap: 30, c: '用自動波牌照完成一局', f: function (R) { return R.complete && R.licence === 'auto'; } },
    { id: 'heat80', cat: '表現', n: '滿手鮮血', ap: 40, c: 'HEAT ≥ 80 仍完成一局', f: function (R) { return R.complete && R.heat >= 80; } },

    { id: 'hard_hunter', cat: '技術', n: '高難度獵人', ap: 80, c: '單局 5 次成功率 ≤ 45% 而成功', f: function (R) { return R.hardChoices >= 5; } },
    { id: 'ascetic', cat: '技術', n: '苦行', ap: 100, c: '一局完全冇揀過「搏」', f: function (R) { return R.complete && R.tags.bo === 0; } },
    { id: 'gambler', cat: '技術', n: '賭徒', ap: 100, c: '一局 8 次以上「搏」', f: function (R) { return R.tags.bo >= 8; } },

    { id: 'arrested', cat: '失敗', n: '被拉', ap: 20, c: '街頭被拉，本局結束', f: function (R) { return R.arrested; } },
    { id: 'three_crash', cat: '失敗', n: '三連撞', ap: 20, c: '單局撞車三次', f: function (R) { return R.crashes >= 3; } },
    { id: 'buy_licence', cat: '失敗', n: '買牌', ap: 30, c: '用錢買牌照', f: function (R) { return R.buyLicence; } },

    { id: 'rival_hi', cat: '關係', n: '宿敵', ap: 50, c: '宿敵關係 ≥ 80', f: function (R) { return R.rival >= 80; } },
    { id: 'rival_lo', cat: '關係', n: '仇人', ap: 30, c: '宿敵關係 ≤ 10', f: function (R) { return R.rival <= 10; } },

    { id: 'veteran', cat: '累計里程碑', n: '老手', ap: 100, c: '累計完成 10 局', f: function (R) { return R.meta.runs >= 10; } },
    { id: 'all_routes', cat: '累計里程碑', n: '三路都玩過', ap: 150, c: '三條路各完成 3 次', f: function (R) { return R.meta.routes.f4 >= 3 && R.meta.routes.rally >= 3 && R.meta.routes.street >= 3; } }
  ];

  /* ---------- 技能店（8） ---------- */
  var SKILLS = [
    { id: 'mech', tier: 1, n: '機械入門', ap: 80, w: 2, d: '車感 +8', note: '只加快起步，不改上限' },
    { id: 'frugal', tier: 1, n: '慳家', ap: 80, w: 2, d: '現金 +5 萬', note: '起始本錢' },
    { id: 'school', tier: 1, n: '學校底子', ap: 70, w: 2, d: '家人扣減減半', note: '學業類選擇冇咁傷家人' },
    { id: 'usedcar', tier: 2, n: '二手車專家', ap: 150, w: 3, d: '買車多一個選項', note: '多一個第三部車' },
    { id: 'nego', tier: 2, n: '談判', ap: 180, w: 3, d: '所有現金收入 +30%', note: '贊助條件升一級' },
    { id: 'street_net', tier: 3, n: '街頭人脈', ap: 280, w: 4, d: 'HEAT 增長 −25%', note: '起手乾淨' },
    { id: 'rally_bg', tier: 3, n: '拉力背景', ap: 300, w: 4, d: 'Rally 門一定開', note: '師傅肯帶你入拉力' },
    { id: 'academy', tier: 3, n: '青訓推薦', ap: 320, w: 4, d: 'F4 門檻 −8', note: '有人幫你講一句' }
  ];

  function blank() {
    return {
      v: 1, ap: 0, apEarned: 0,
      runs: 0, decisions: 0, events: 0, km: 0,
      ach: {}, skills: {}, loadout: [],
      routes: { f4: 0, rally: 0, street: 0 },
      tiers: { km: 0, runs: 0, decisions: 0, events: 0 },
      best: { km: 0, fam: 0, heat: 0 }
    };
  }
  function read() {
    var m;
    try { m = JSON.parse(localStorage.getItem(META_KEY) || 'null'); } catch (e) { m = null; }
    if (!m || typeof m !== 'object') return blank();
    var b = blank();
    Object.keys(b).forEach(function (k) { if (m[k] === undefined) m[k] = b[k]; });
    ['ach', 'skills', 'tiers', 'routes', 'best'].forEach(function (k) {
      if (!m[k] || typeof m[k] !== 'object') m[k] = b[k];
    });
    ['km', 'runs', 'decisions', 'events'].forEach(function (k) { if (m.tiers[k] === undefined) m.tiers[k] = 0; });
    if (!Array.isArray(m.loadout)) m.loadout = [];
    return m;
  }
  function write(m) {
    try { localStorage.setItem(META_KEY, JSON.stringify(m)); } catch (e) {}
    return m;
  }
  function skillById(id) {
    for (var i = 0; i < SKILLS.length; i++) if (SKILLS[i].id === id) return SKILLS[i];
    return null;
  }
  function weightOf(loadout) {
    return (loadout || []).reduce(function (n, id) { var s = skillById(id); return n + (s ? s.w : 0); }, 0);
  }
  function capacity(m) {
    var unlocked = Object.keys(m.skills || {}).length;
    return Math.min(12, 2 + (m.runs || 0) + Math.floor(unlocked / 2));
  }
  function worldPenalty(loadout) {
    return Math.floor(weightOf(loadout) / 4);
  }
  function achById(id) {
    for (var i = 0; i < ACH.length; i++) if (ACH[i].id === id) return ACH[i];
    return null;
  }

  /* 評估一局：回傳新解鎖嘅成就（並即時寫入 AP） */
  function evaluateRun(R) {
    var m = read(), got = [];
    R.meta = m;
    ACH.forEach(function (a) {
      if (m.ach[a.id]) return;
      var ok = false;
      try { ok = !!a.f(R); } catch (e) { ok = false; }
      if (ok) {
        m.ach[a.id] = true;
        m.ap += a.ap; m.apEarned += a.ap;
        got.push({ kind: 'ach', id: a.id, n: a.n, ap: a.ap });
      }
    });
    write(m);
    return got;
  }

  /* 累計進度：寫入本局數字，跨過門檻就發 AP */
  function addTotals(o) {
    var m = read(), got = [];
    ['km', 'runs', 'decisions', 'events'].forEach(function (k) {
      if (typeof o[k] !== 'number' || !o[k]) return;
      m[k] = (m[k] || 0) + o[k];
      if (k === 'km' && m.km > (m.best.km || 0)) m.best.km = m.km;
    });
    if (o.route && m.routes[o.route] !== undefined) m.routes[o.route] += 1;

    ['km', 'runs', 'decisions', 'events'].forEach(function (k) {
      while (m.tiers[k] < TIERS[k].length && m[k] >= TIERS[k][m.tiers[k]]) {
        var ap = TIER_AP[m.tiers[k]];
        m.tiers[k] += 1;
        m.ap += ap; m.apEarned += ap;
        got.push({ kind: 'tier', id: k + m.tiers[k], n: TIER_LABEL[k] + ' 第 ' + m.tiers[k] + ' 級', ap: ap });
      }
    });
    write(m);
    return got;
  }

  function buySkill(id) {
    var m = read(), s = skillById(id);
    if (!s) return { ok: false, why: '冇呢個技能' };
    if (m.skills[id]) return { ok: false, why: '已經解鎖' };
    if (m.ap < s.ap) return { ok: false, why: 'AP 唔夠（差 ' + (s.ap - m.ap) + '）' };
    m.ap -= s.ap; m.skills[id] = true;
    if (m.loadout.indexOf(id) < 0 && weightOf(m.loadout) + s.w <= capacity(m)) m.loadout.push(id);
    write(m);
    return { ok: true };
  }
  function setLoadout(list) {
    var m = read();
    var clean = (list || []).filter(function (id) { return m.skills[id]; });
    if (weightOf(clean) > capacity(m)) return { ok: false, why: '超出負重' };
    m.loadout = clean; write(m);
    return { ok: true };
  }
  function hasRun() {
    try { return !!localStorage.getItem(RUN_KEY); } catch (e) { return false; }
  }
  function runBrief() {
    try {
      var o = JSON.parse(localStorage.getItem(RUN_KEY) || 'null');
      if (!o || o.over) return null;
      return { year: o.year, log: (o.log || []).length };
    } catch (e) { return null; }
  }

  root.Meta = {
    KEY: META_KEY, RUN_KEY: RUN_KEY, OLD_KEY: OLD_KEY,
    ACH: ACH, SKILLS: SKILLS, TIERS: TIERS, TIER_AP: TIER_AP,
    TIER_LABEL: TIER_LABEL, TIER_UNITNAME: TIER_UNITNAME, TIER_UNIT: TIER_UNIT,
    blank: blank, read: read, write: write, skillById: skillById,
    weightOf: weightOf, capacity: capacity, worldPenalty: worldPenalty,
    achById: achById, evaluateRun: evaluateRun, addTotals: addTotals,
    buySkill: buySkill, setLoadout: setLoadout, hasRun: hasRun, runBrief: runBrief
  };
})(typeof window !== 'undefined' ? window : this);
