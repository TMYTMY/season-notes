/* Pixel stage — 160×90 低解析度像素場景，放大用 image-rendering:pixelated
   給 career.html（每個決定 1.7 秒後果動畫）同 index.html（主頁 hero）用。 */
(function (root) {
  'use strict';

  var W = 160, H = 90;
  var C = {
    sky: '#0a0f1c', sky2: '#111c30', star: '#cfd8e6', moon: '#f4f1e8',
    stand: '#0f1725', standLit: '#1b273c', board: '#1a2436',
    grass: '#16281d', grass2: '#12211a', road: '#242c3a', road2: '#1c2330',
    kerbA: '#c8402f', kerbB: '#f4f1e8', gold: '#f2c14e', goldD: '#b98c24',
    red: '#c8402f', redD: '#8a2a1e', blue: '#5b86c9', blueD: '#33598f',
    white: '#f4f1e8', dark: '#0a0d13', wall: '#141c29', floor: '#1a2130',
    panel: '#1d2637', steel: '#5c6b82', green: '#4f9a72', amber: '#e0a83c',
    skin: '#c9a07a', skinD: '#8f6b4a', lamp: '#ffd98a'
  };
  var reduced = false;
  if (root.matchMedia) {
    try { reduced = root.matchMedia('(prefers-reduced-motion: reduce)').matches; } catch (e) {}
  }

  function ctxOf(canvas) {
    canvas.width = W; canvas.height = H;
    var ctx = canvas.getContext('2d');
    ctx.imageSmoothingEnabled = false;
    return ctx;
  }
  function rect(ctx, x, y, w, h, c) { ctx.fillStyle = c; ctx.fillRect(x | 0, y | 0, w | 0, h | 0); }
  function rnd(i) { var x = Math.sin(i * 127.1 + 311.7) * 43758.5453; return x - Math.floor(x); }

  function car(ctx, x, y, body, dark, scale, tilt) {
    scale = scale || 1;
    x = Math.round(x); y = Math.round(y);
    if (tilt) {
      ctx.save();
      ctx.translate(x + 6, y + 3);
      ctx.rotate(tilt);
      ctx.translate(-6, -3);
      ctx.globalAlpha = 0.95;
      car(ctx, 0, 0, body, dark, scale, 0);
      ctx.restore();
      return;
    }
    var w = 13 * scale, h = 6 * scale;
    rect(ctx, x + 1, y + h - 1, w - 2, 1, 'rgba(0,0,0,.45)');
    rect(ctx, x + 2, y + 2 * scale, w - 4, 3 * scale, body);
    rect(ctx, x + w - 2, y + 3 * scale, 2, 2 * scale, body);
    rect(ctx, x + 4, y + 1 * scale, 4, 2 * scale, dark);          // cockpit
    rect(ctx, x + 1, y + 3 * scale, 2, 2 * scale, dark);          // rear wing
    rect(ctx, x + 3, y + 4 * scale, 2, 2 * scale, C.dark);        // wheels
    rect(ctx, x + w - 4, y + 4 * scale, 2, 2 * scale, C.dark);
    rect(ctx, x + 2, y + 2 * scale, w - 4, 1, 'rgba(255,255,255,.22)');
  }

  function person(ctx, x, y, shirt, pants) {
    rect(ctx, x + 1, y, 3, 3, C.skin);
    rect(ctx, x, y + 3, 5, 4, shirt);
    rect(ctx, x + 1, y + 7, 1, 3, pants || C.dark);
    rect(ctx, x + 3, y + 7, 1, 3, pants || C.dark);
  }

  /* ---------------- 背景 ---------------- */
  function bgTrack(ctx, st) {
    rect(ctx, 0, 0, W, 34, C.sky);
    rect(ctx, 0, 22, W, 12, C.sky2);
    for (var i = 0; i < 34; i++) {
      var sx = (rnd(i) * W) | 0, sy = (rnd(i + 90) * 18) | 0;
      rect(ctx, sx, sy, 1, 1, C.star);
    }
    rect(ctx, 128, 6, 7, 7, C.moon);
    rect(ctx, 130, 8, 2, 2, C.sky2);
    // 看台
    rect(ctx, 0, 34, W, 10, C.stand);
    for (var j = 0; j < 60; j++) {
      var bx = (rnd(j + 7) * W) | 0, by = 35 + ((rnd(j + 3) * 8) | 0);
      rect(ctx, bx, by, 1, 1, j % 3 ? C.standLit : C.gold);
    }
    // 廣告板
    rect(ctx, 0, 44, W, 5, C.board);
    for (var k = 0; k < 8; k++) {
      rect(ctx, k * 20 + 3, 45, 6, 3, k % 2 ? C.red : C.gold);
      rect(ctx, k * 20 + 11, 45, 4, 3, C.steel);
    }
    // 燈柱
    [26, 118].forEach(function (px) {
      rect(ctx, px, 18, 1, 26, C.steel);
      rect(ctx, px - 2, 17, 5, 2, C.panel);
      rect(ctx, px - 1, 17, 3, 1, C.lamp);
      ctx.globalAlpha = 0.10 + 0.05 * Math.sin(st.t * 2);
      rect(ctx, px - 7, 19, 15, 24, C.lamp);
      ctx.globalAlpha = 1;
    });
    rect(ctx, 0, 49, W, 5, C.grass);
    rect(ctx, 0, 54, W, 3, C.kerbA);
    for (var m = 0; m < W; m += 8) rect(ctx, m, 54, 4, 3, C.kerbB);
    rect(ctx, 0, 57, W, 26, C.road);
    for (var d = 0; d < W; d += 16) rect(ctx, d, 69, 8, 1, 'rgba(244,241,232,.35)');
    rect(ctx, 0, 83, W, 3, C.kerbA);
    for (var n = 0; n < W; n += 8) rect(ctx, n, 83, 4, 3, C.kerbB);
    rect(ctx, 0, 86, W, 4, C.grass2);
  }

  function bgGarage(ctx, st) {
    rect(ctx, 0, 0, W, 62, C.wall);
    rect(ctx, 0, 62, W, 28, C.floor);
    rect(ctx, 0, 60, W, 2, C.steel);
    // 工具板
    rect(ctx, 10, 10, 46, 26, C.panel);
    rect(ctx, 11, 11, 44, 1, C.steel);
    for (var i = 0; i < 5; i++) {
      rect(ctx, 15 + i * 8, 15, 2, 9, C.steel);
      rect(ctx, 14 + i * 8, 24, 4, 3, i % 2 ? C.gold : C.red);
    }
    // 胎
    for (var t = 0; t < 3; t++) {
      rect(ctx, 120, 44 - t * 5, 14, 4, C.dark);
      rect(ctx, 122, 45 - t * 5, 10, 2, '#2a3342');
    }
    // 油桶
    rect(ctx, 98, 48, 8, 14, C.redD);
    rect(ctx, 98, 52, 8, 2, C.red);
    rect(ctx, 98, 56, 8, 2, C.red);
    // 地燈
    rect(ctx, 0, 62, W, 1, 'rgba(242,193,78,.25)');
  }

  function bgHome(ctx, st) {
    rect(ctx, 0, 0, W, 60, '#181f2c');
    rect(ctx, 0, 60, W, 30, '#121821');
    rect(ctx, 0, 58, W, 2, '#0d121a');
    // 窗
    rect(ctx, 14, 12, 40, 30, '#0a0f1c');
    rect(ctx, 33, 12, 1, 30, C.steel); rect(ctx, 14, 26, 40, 1, C.steel);
    rect(ctx, 44, 17, 5, 5, C.moon);
    for (var i = 0; i < 12; i++) rect(ctx, 16 + ((rnd(i) * 36) | 0), 14 + ((rnd(i + 4) * 24) | 0), 1, 1, C.star);
    // 燈
    rect(ctx, 96, 8, 1, 10, C.steel);
    rect(ctx, 92, 18, 9, 4, C.lamp);
    ctx.globalAlpha = 0.12; rect(ctx, 86, 22, 21, 24, C.lamp); ctx.globalAlpha = 1;
    // 枱
    rect(ctx, 58, 52, 60, 4, '#5a4632');
    rect(ctx, 62, 56, 3, 12, '#3d2f22'); rect(ctx, 112, 56, 3, 12, '#3d2f22');
    rect(ctx, 66, 46, 12, 6, C.white);  // 成績表
    rect(ctx, 68, 48, 8, 1, C.steel); rect(ctx, 68, 50, 6, 1, C.steel);
  }

  function bgStreet(ctx, st) {
    rect(ctx, 0, 0, W, 40, '#0a0f1c');
    for (var b = 0; b < 9; b++) {
      var bw = 14 + ((rnd(b) * 8) | 0), bh = 18 + ((rnd(b + 5) * 18) | 0);
      var bx = b * 18;
      rect(ctx, bx, 40 - bh, bw, bh, b % 2 ? '#131a26' : '#101722');
      for (var w = 0; w < 6; w++) {
        if (rnd(b * 7 + w) > 0.55) rect(ctx, bx + 2 + ((w % 3) * 4), 40 - bh + 3 + ((w / 3) | 0) * 5, 2, 2, C.amber);
      }
    }
    rect(ctx, 0, 40, W, 6, '#1a2130');
    rect(ctx, 0, 46, W, 30, C.road2);
    rect(ctx, 0, 76, W, 6, '#141a24');
    for (var d = 0; d < W; d += 14) rect(ctx, d, 61, 7, 1, 'rgba(244,241,232,.28)');
    // 街燈
    rect(ctx, 24, 20, 1, 26, C.steel);
    rect(ctx, 22, 19, 5, 2, C.steel);
    rect(ctx, 23, 21, 3, 1, C.lamp);
    ctx.globalAlpha = 0.10; rect(ctx, 14, 22, 22, 26, C.lamp); ctx.globalAlpha = 1;
  }

  function bgExam(ctx, st) {
    rect(ctx, 0, 0, W, 40, '#0f1728');
    rect(ctx, 0, 40, W, 10, C.stand);
    for (var j = 0; j < 40; j++) rect(ctx, (rnd(j) * W) | 0, 41 + ((rnd(j + 2) * 8) | 0), 1, 1, C.standLit);
    rect(ctx, 0, 50, W, 6, C.grass2);
    rect(ctx, 0, 56, W, 28, C.road);
    rect(ctx, 0, 56, W, 3, C.kerbB);
    for (var k = 0; k < W; k += 12) rect(ctx, k, 56, 6, 3, C.kerbA);
    for (var d = 0; d < W; d += 16) rect(ctx, d, 71, 8, 1, 'rgba(244,241,232,.45)');
    // 雪糕筒
    for (var c = 0; c < 5; c++) {
      rect(ctx, 26 + c * 22, 63, 3, 5, C.red);
      rect(ctx, 26 + c * 22, 65, 3, 1, C.white);
    }
    // 紅綠燈
    rect(ctx, 138, 34, 2, 22, C.steel);
    rect(ctx, 135, 26, 8, 10, C.panel);
    rect(ctx, 137, 28, 4, 2, C.green);
    rect(ctx, 137, 31, 4, 2, C.amber);
  }

  function bgMoney(ctx, st) {
    rect(ctx, 0, 0, W, 58, '#141b28');
    rect(ctx, 0, 58, W, 32, '#10151f');
    rect(ctx, 20, 10, 120, 34, C.panel);
    rect(ctx, 22, 12, 116, 30, '#0f1622');
    // 合約
    rect(ctx, 44, 18, 34, 20, C.white);
    for (var i = 0; i < 4; i++) rect(ctx, 47, 21 + i * 4, 28 - i * 3, 1, C.steel);
    rect(ctx, 66, 30, 8, 2, C.dark);
    // 現金
    for (var n = 0; n < 5; n++) rect(ctx, 92, 40 - n * 3, 22, 2, n % 2 ? C.green : '#3f7d5d');
    rect(ctx, 94, 26, 18, 3, C.green);
    // 枱
    rect(ctx, 0, 50, W, 4, '#4a3a2a');
    rect(ctx, 0, 54, W, 4, '#33281d');
  }

  function bgHospital(ctx, st) {
    rect(ctx, 0, 0, W, 58, '#16202b');
    rect(ctx, 0, 58, W, 32, '#111821');
    rect(ctx, 0, 0, 4, 58, '#1d2a36');
    rect(ctx, 8, 8, 26, 18, '#0d141d');
    ctx.strokeStyle = C.green; ctx.lineWidth = 1;
    ctx.beginPath();
    for (var x = 9; x < 33; x++) {
      var y = 17 + Math.sin((x + st.t * 26) * 0.55) * 3 * (x % 9 < 4 ? 1 : 0.25);
      if (x === 9) ctx.moveTo(x, y); else ctx.lineTo(x, y);
    }
    ctx.stroke();
    // 病床
    rect(ctx, 44, 50, 60, 4, C.white);
    rect(ctx, 46, 44, 20, 6, '#dfe6ef');
    rect(ctx, 44, 54, 2, 10, C.steel); rect(ctx, 102, 54, 2, 10, C.steel);
    person(ctx, 52, 34, '#9fb2c9');
  }

  function getBg(type) {
    switch (type) {
      case 'garage': return bgGarage;
      case 'home': return bgHome;
      case 'street': return bgStreet;
      case 'exam': return bgExam;
      case 'money': return bgMoney;
      case 'hospital': return bgHospital;
      default: return bgTrack;
    }
  }

  /* ---------------- 演員 ---------------- */
  function actors(ctx, type, st) {
    var p = st.prog || 0;
    var tone = st.tone || 'neutral';
    if (type === 'track') {
      var r1 = 74 + (tone === 'good' ? 10 * p : 0) + (tone === 'bad' ? -6 * p : 0);
      var r2 = 104 + (tone === 'good' ? 12 * p : 0);
      car(ctx, r1, 58, C.red, C.redD, 1);
      car(ctx, r2, 71, C.blue, C.blueD, 1);
      var px = tone === 'good' ? 30 + 34 * p : (tone === 'bad' ? 58 - 26 * p : 34 + 4 * Math.sin(p * 3));
      if (tone === 'crash') {
        car(ctx, 52 + 10 * p, 62, C.gold, C.goldD, 1, p * 2.2);
        ctx.globalAlpha = Math.max(0, 0.6 - p * 0.6);
        rect(ctx, 50, 56, 26, 14, C.red);
        ctx.globalAlpha = 1;
      } else {
        car(ctx, px, 65, C.gold, C.goldD, 1);
      }
      // 速度線
      if (tone !== 'bad' && tone !== 'crash') {
        for (var i = 0; i < 4; i++) {
          var sx = 20 + ((i * 17 + p * 40) % 130);
          rect(ctx, sx, 63 + (i % 3) * 5, 5, 1, 'rgba(242,193,78,.35)');
        }
      }
      // YOU 指示
      if (tone !== 'crash') {
        var lx = (tone === 'good' ? 30 + 34 * p : (tone === 'bad' ? 58 - 26 * p : 34)) + 4;
        rect(ctx, lx, 61, 6, 1, C.gold);
        rect(ctx, lx + 2, 62, 2, 1, C.gold);
      }
    } else if (type === 'garage') {
      car(ctx, 60, 44, C.gold, C.goldD, 1.4);
      var sx = 78 + Math.sin(st.t * 9) * 2;
      if (tone === 'good') { rect(ctx, sx, 46, 1, 1, C.white); rect(ctx, sx + 2, 48, 1, 1, C.amber); rect(ctx, sx - 2, 49, 1, 1, C.white); }
      if (tone === 'bad') { rect(ctx, 76, 52, 2, 2, C.red); rect(ctx, 80, 55, 1, 1, C.redD); }
    } else if (type === 'home') {
      person(ctx, 40, 44, C.gold, '#2a2f3a');
      var gap = tone === 'good' ? 6 - 3 * p : (tone === 'bad' ? 14 + 8 * p : 8);
      person(ctx, 40 + gap, 44, '#7d8ea6', '#2a2f3a');
      person(ctx, 48 + gap, 44, '#8f7da6', '#2a2f3a');
      if (tone === 'bad') rect(ctx, 36, 38, 4, 1, C.red);
    } else if (type === 'street') {
      car(ctx, tone === 'good' ? 26 + 40 * p : 24, 50, tone === 'bad' ? C.blue : C.gold, C.goldD, 1);
      car(ctx, 96 - (tone === 'bad' ? 12 * p : 0), 66, '#3b4557', '#232b38', 1);
      if (tone === 'bad') {
        var f = Math.floor(st.t * 6) % 2;
        rect(ctx, 96, 62, 4, 2, f ? C.red : C.blue);
        rect(ctx, 100, 62, 4, 2, f ? C.blue : C.red);
        ctx.globalAlpha = 0.10 + 0.06 * f; rect(ctx, 90, 58, 20, 12, f ? C.red : C.blue); ctx.globalAlpha = 1;
      }
      person(ctx, 132, 42, '#2a3342');
    } else if (type === 'exam') {
      car(ctx, tone === 'good' ? 20 + 26 * p : 18, 62, C.gold, C.goldD, 1);
      person(ctx, 44, 44, '#2f3a4a', '#1a2130');   // 考官
      rect(ctx, 43, 52, 7, 1, C.steel);
      if (tone === 'bad') { rect(ctx, 42, 40, 10, 1, C.red); rect(ctx, 46, 39, 1, 3, C.red); }
    } else if (type === 'money') {
      var grow = tone === 'good' ? p : (tone === 'bad' ? 1 - p * 0.8 : 0.5);
      for (var k = 0; k < Math.max(1, Math.round(grow * 6)); k++) rect(ctx, 92, 40 - k * 3, 22, 2, k % 2 ? C.green : '#3f7d5d');
      person(ctx, 70, 34, '#8f7da6', '#2a2f3a');
      person(ctx, 96, 34, '#2f3a4a', '#1a2130');
    } else if (type === 'hospital') {
      car(ctx, 20 + (tone === 'bad' ? 4 : 10) * p, 20, C.gold, C.goldD, 0.7, tone === 'bad' ? 0.5 * p : 0);
    }
  }

  function paint(canvas, type, tone, t, prog) {
    var ctx = ctxOf(canvas);
    var st = { t: t, tone: tone, prog: prog };
    getBg(type)(ctx, st);
    actors(ctx, type, st);
    if (tone === 'bad' && prog > 0.15) {
      ctx.globalAlpha = Math.max(0, 0.22 * (1 - prog));
      rect(ctx, 0, 0, W, H, C.red);
      ctx.globalAlpha = 1;
    }
    // 掃描線，統一 pixel 質感
    ctx.globalAlpha = 0.08;
    for (var y = 0; y < H; y += 2) rect(ctx, 0, y, W, 1, '#000');
    ctx.globalAlpha = 1;
  }

  function easeInOut(p) { return p < 0.5 ? 2 * p * p : 1 - Math.pow(-2 * p + 2, 2) / 2; }

  function play(canvas, cfg) {
    cfg = cfg || {};
    var type = cfg.type || 'track';
    var tone = cfg.tone || 'neutral';
    var dur = cfg.dur || 1.6;
    if (reduced || cfg.instant) { paint(canvas, type, tone, 0, tone === 'bad' ? 1 : 0.6); return Promise.resolve(); }
    return new Promise(function (resolve) {
      var t0 = 0;
      function frame(ts) {
        if (!t0) t0 = ts;
        var el = (ts - t0) / 1000;
        var p = Math.min(1, el / dur);
        paint(canvas, type, tone, el, easeInOut(p));
        if (p < 1) requestAnimationFrame(frame); else resolve();
      }
      requestAnimationFrame(frame);
    });
  }

  /* 主頁 hero：夜晚賽道，車由左跑到右，循環 */
  function hero(canvas) {
    var raf = null, start = 0, alive = true;
    function loop(ts) {
      if (!alive) return;
      if (!start) start = ts;
      var el = (ts - start) / 1000;
      paint(canvas, 'track', 'good', el, (el % 3.4) / 3.4);
      raf = requestAnimationFrame(loop);
    }
    if (reduced) { paint(canvas, 'track', 'good', 0, 0.55); return function () {}; }
    raf = requestAnimationFrame(loop);
    return function () { alive = false; if (raf) cancelAnimationFrame(raf); };
  }

  root.PX = { W: W, H: H, play: play, still: function (c, t) { paint(c, t || 'track', 'neutral', 0, 0.5); }, hero: hero, reduced: reduced };
})(typeof window !== 'undefined' ? window : this);
