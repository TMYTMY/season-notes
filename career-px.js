(function (root) {
  'use strict';

  var W = 160, H = 90;
  var PX_PER_M = 10.6;
  var ART_SCALE = 0.85;
  var PERSON_H_M = 1.9;
  var PERSON_W_M = 0.45;
  var DIM = {
    person: { w: PERSON_W_M, h: PERSON_H_M, head: 0.42, torso: 0.75, legs: 0.73 },
    homeTable: { w: 1.2, h: 0.75 },
    moneyTable: { w: 1.6, h: 0.75 },
    chair: { w: 0.45, h: 0.85, seat: 0.45 },
    door: { w: 0.9, h: 2.0 },
    window: { w: 1.2, h: 1.0 },
    toolBoard: { w: 2.0, h: 1.2 },
    oilDrum: { w: 0.6, h: 0.9 },
    tyre: { w: 0.6, h: 0.28 },
    bed: { w: 2.0, h: 0.95, mattress: 0.65 },
    sideTable: { w: 0.5, h: 0.65 },
    monitor: { w: 0.65, h: 0.5 },
    lampPost: { w: 0.18, h: 8.0 },
    cone: { w: 0.5, h: 0.8 },
    signalPost: { w: 0.18, h: 3.5 },
    signalBox: { w: 0.6, h: 1.0 },
    adBoard: { w: 4.0, h: 0.85 }
  };
  var VEH = {
    kart: { n: 'kart', len: 2.5, wid: 1.4, h: 0.6, wheel: 0.28, ride: 0.10 },
    street: { n: 'street', len: 4.2, wid: 1.8, h: 1.5, wheel: 0.62, ride: 0.30 },
    streetRace: { n: 'street-race', len: 4.4, wid: 1.8, h: 1.2, wheel: 0.60, ride: 0.22 },
    f4: { n: 'f4', len: 4.6, wid: 1.9, h: 1.0, wheel: 0.60, ride: 0.16 },
    f3: { n: 'f3', len: 5.0, wid: 1.9, h: 1.0, wheel: 0.62, ride: 0.14 },
    f2: { n: 'f2', len: 5.0, wid: 1.9, h: 1.0, wheel: 0.62, ride: 0.12 },
    f1: { n: 'f1', len: 5.6, wid: 2.0, h: 1.0, wheel: 0.66, ride: 0.10 },
    rally: { n: 'rally', len: 4.2, wid: 1.8, h: 1.4, wheel: 0.68, ride: 0.42 }
  };
  var C = {
    sky: '#0a0f1c', sky2: '#111c30', star: '#cfd8e6', moon: '#f4f1e8',
    stand: '#0f1725', standLit: '#1b273c', board: '#1a2436',
    grass: '#16281d', grass2: '#12211a', road: '#242c3a', road2: '#1c2330',
    kerbA: '#c8402f', kerbB: '#f4f1e8', gold: '#f2c14e', goldD: '#b98c24',
    red: '#c8402f', redD: '#8a2a1e', blue: '#5b86c9', blueD: '#33598f',
    white: '#f4f1e8', dark: '#0a0d13', wall: '#141c29', floor: '#1a2130',
    panel: '#1d2637', steel: '#5c6b82', green: '#4f9a72', amber: '#e0a83c',
    skin: '#c9a07a', skinD: '#8f6b4a', lamp: '#ffd98a', rubber: '#26303f',
    rim: '#9aa8bd', glass: '#22304a', mud: '#6b4a2a', gravel: '#6e6a63',
    smoke: '#8b94a3', spray: '#cfe0f0'
  };
  var reduced = false;
  if (root.matchMedia) {
    try { reduced = root.matchMedia('(prefers-reduced-motion: reduce)').matches; } catch (e) {}
  }

  function m(v, scale) { return Math.max(1, Math.round(v * (scale || PX_PER_M))); }
  function artPx(v) { return Math.max(1, Math.floor(v * ART_SCALE * PX_PER_M)); }
  var PERSON_W = m(DIM.person.w);
  var PERSON_H = m(DIM.person.h);
  var PERSON_HEAD = m(DIM.person.head);
  var PERSON_TORSO = m(DIM.person.torso);

  var OVER = { kart: 3, rally: 2 };
  var VEHP = {};
  Object.keys(VEH).forEach(function (k) {
    var v = VEH[k];
    var over = OVER[k] || 0;
    VEHP[k] = {
      key: k, n: v.n, len_m: v.len, wid_m: v.wid, h_m: v.h, wheel_m: v.wheel, ride_m: v.ride,
      L: artPx(v.len), H: Math.max(2, Math.round(v.h * ART_SCALE * PX_PER_M)), WH: Math.max(3, artPx(v.wheel)), RD: artPx(v.ride),
      over: over, draw: artPx(v.len) + over
    };
  });

  var PAL = {
    kart: { body: '#c8402f', dark: '#7a2418', trim: C.gold },
    street: { body: '#5b86c9', dark: '#33598f', trim: '#8fa4bd' },
    streetRace: { body: '#3a4d70', dark: '#1a2436', trim: C.gold },
    f4: { body: C.gold, dark: C.goldD, trim: C.white },
    f3: { body: C.blue, dark: C.blueD, trim: C.white },
    f2: { body: C.red, dark: C.redD, trim: C.white },
    f1: { body: C.red, dark: C.redD, trim: C.gold },
    rally: { body: '#dfe6ef', dark: '#93a4bb', trim: C.blue }
  };

  function ctxOf(canvas) {
    canvas.width = W; canvas.height = H;
    var ctx = canvas.getContext('2d');
    ctx.imageSmoothingEnabled = false;
    return ctx;
  }
  function rect(ctx, x, y, w, h, c) { ctx.fillStyle = c; ctx.fillRect(x | 0, y | 0, w | 0, h | 0); }
  function rnd(i) { var x = Math.sin(i * 127.1 + 311.7) * 43758.5453; return x - Math.floor(x); }
  function clamp(v, a, b) { return v < a ? a : (v > b ? b : v); }

  function lightCone(ctx, cx, topY, topW, botW, height, alpha) {
    var bands = 5;
    var bh = Math.ceil(height / bands);
    for (var i = 0; i < bands; i++) {
      var t = i / (bands - 1);
      var bw = Math.round(topW + (botW - topW) * t);
      ctx.globalAlpha = alpha * (1 - t * 0.55);
      rect(ctx, cx - Math.floor(bw / 2), topY + i * bh, bw, bh, C.lamp);
    }
    ctx.globalAlpha = 1;
  }

  function drawVehicle(ctx, key, x, gy, o) {
    o = o || {};
    var v = VEHP[key] || VEHP.kart;
    var pal = PAL[v.key] || PAL.kart;
    var body = o.body || pal.body, dark = o.dark || pal.dark, trim = o.trim || pal.trim;
    var L = v.L, HH = v.H, WH = v.WH;
    x = Math.round(x); gy = Math.round(gy);
    var tilt = o.tilt || 0;
    if (Math.abs(tilt) > 0.05) {
      ctx.save();
      ctx.translate(x + L / 2, gy);
      ctx.rotate(tilt);
      ctx.globalAlpha = 0.96;
      body0(ctx, v, -L / 2, 0, body, dark, trim, o);
      ctx.globalAlpha = 1;
      ctx.restore();
      return;
    }
    body0(ctx, v, x, gy, body, dark, trim, o);
  }

  function body0(ctx, v, x, gy, body, dark, trim, o) {
    var key = v.key, L = v.L, WH = v.WH;
    function q(dx, top, w, h, c) { if (w > 0 && h > 0) rect(ctx, x + dx, gy - top, w, h, c); }
    function wheel(dx, chunky) {
      q(dx, WH, WH, WH, C.rubber);
      q(dx + 1, WH - 1, WH - 2, WH - 2, C.rim);
      q(dx + 2, 2, 1, 1, '#3a465c');
      if (chunky) {
        q(dx, Math.round(WH * 0.55), WH, 1, '#0f1521');
        q(dx, WH - 1, 1, 1, '#4f5b6e');
        q(dx + WH - 1, 2, 1, 1, '#4f5b6e');
      }
    }
    function arch(dx, w) { q(dx, WH + 2, w, 1, dark); }
    function seat(cx, crown) {
      if (o.driver === false) return;
      var suit = o.suit || suitFor(body);
      q(cx + 1, crown, 2, 1, C.white);
      q(cx, crown - 1, 4, 1, C.white);
      q(cx + 2, crown - 1, 1, 1, '#1a2130');
      q(cx + 1, crown - 2, 2, 1, C.skin);
      q(cx, crown - 3, 5, 2, suit);
      q(cx + 4, crown - 3, 1, 1, suit);
      q(cx + 5, crown - 3, 1, 1, C.skin);
      q(cx + 6, crown - 3, 1, 1, '#1a2130');
    }

    if (key === 'kart') {
      q(-1, 3, 1, 2, '#1a2130');
      q(L + 1, 3, 1, 2, '#1a2130');
      wheel(1); wheel(L - 6);
      q(0, 4, L, 1, '#4d5b73');
      q(0, 5, L, 1, dark);
      q(1, 6, 3, 2, '#39445a');
      q(5, 7, 1, 4, '#6b4a2a');
      q(12, 5, 1, 2, C.steel);
      q(14, 4, 8, 2, body);
      q(14, 4, 8, 1, trim);
      q(L - 3, 3, 2, 1, dark);
      seat(6, 9);
    } else if (key === 'street') {
      q(0, 6, 1, 3, dark);
      q(L - 1, 6, 1, 3, dark);
      q(1, 7, L - 2, 5, body);
      q(1, 3, L - 2, 1, '#141c29');
      q(1, 9, L - 2, 3, body);
      q(1, 9, L - 2, 1, 'rgba(255,255,255,.10)');
      q(8, 14, 12, 5, body);
      q(20, 13, 2, 4, body);
      q(22, 12, 1, 3, body);
      q(8, 14, 12, 1, 'rgba(255,255,255,.14)');
      q(9, 13, 6, 4, C.glass);
      q(16, 13, 5, 4, C.glass);
      q(15, 13, 1, 4, body);
      q(15, 9, 1, 4, 'rgba(0,0,0,.25)');
      q(13, 8, 2, 1, dark);
      q(L - 2, 8, 1, 2, C.lamp);
      q(0, 8, 1, 2, C.red);
      q(2, 6, 2, 1, '#8a5a32');
      q(L - 8, 6, 2, 1, '#8a5a32');
      arch(3, 9); arch(L - 16, 9);
      wheel(5); wheel(L - 13);
      seat(16, 13);
    } else if (key === 'streetRace') {
      q(1, 3, L - 2, 1, '#141c29');
      q(1, 7, L - 2, 4, body);
      q(1, 7, L - 2, 1, 'rgba(255,255,255,.10)');
      q(8, 11, 17, 5, body);
      q(25, 10, 3, 3, body);
      q(8, 11, 17, 1, 'rgba(255,255,255,.12)');
      q(9, 10, 7, 4, C.glass);
      q(17, 10, 7, 4, C.glass);
      q(16, 10, 1, 4, body);
      q(1, 11, 9, 1, trim);
      q(3, 9, 1, 2, dark);
      q(8, 9, 1, 2, dark);
      q(4, 1, L - 8, 1, 'rgba(96,200,255,.55)');
      q(L - 2, 7, 1, 2, C.lamp);
      q(0, 7, 1, 2, C.red);
      q(L - 1, 5, 1, 2, dark);
      q(0, 5, 1, 2, dark);
      arch(3, 9); arch(L - 14, 9);
      wheel(5); wheel(L - 12);
      seat(17, 10);
    } else if (key === 'rally') {
      q(-1, 3, 1, 3, C.dark);
      q(L, 3, 1, 3, C.dark);
      q(1, 8, L - 2, 5, body);
      q(1, 4, L - 2, 1, C.mud);
      q(8, 13, 17, 5, body);
      q(8, 13, 17, 1, 'rgba(255,255,255,.14)');
      q(10, 13, 9, 1, '#1a2130');
      q(11, 13, 1, 1, C.lamp);
      q(14, 13, 1, 1, C.lamp);
      q(17, 13, 1, 1, C.lamp);
      q(9, 12, 6, 4, C.glass);
      q(16, 12, 6, 4, C.glass);
      q(15, 12, 1, 4, body);
      q(12, 8, 4, 3, C.white);
      q(13, 7, 2, 1, C.dark);
      q(18, 8, 3, 1, dark);
      q(L - 2, 8, 1, 2, C.lamp);
      q(0, 8, 1, 2, C.red);
      q(2, 5, 3, 1, C.mud);
      q(L - 9, 5, 2, 1, C.mud);
      arch(3, 9); arch(L - 14, 9);
      wheel(4, true); wheel(L - 12, true);
      seat(16, 12);
    } else {
      var f3 = key === 'f3', f2 = key === 'f2', f1 = key === 'f1';
      var open = f3 || f2 || f1;
      var ww = f1 ? 10 : (open ? 8 : 6);
      var cx0 = Math.round(L * 0.42);
      var cx1 = Math.round(L * 0.66);
      var fwx = open ? L - 12 : L - 10;
      q(0, 3, L - 1, 1, '#2b3446');
      q(0, 6, 6, 3, body);
      q(0, 6, 6, 1, 'rgba(255,255,255,.10)');
      q(6, 5, cx1 - 6, 2, body);
      q(6, 5, cx1 - 6, 1, 'rgba(255,255,255,.14)');
      q(cx0 - 5, 7, 4, 2, body);
      q(cx1, 5, L - 3 - cx1, 2, body);
      q(cx1, 4, L - 3 - cx1, 1, 'rgba(255,255,255,.10)');
      q(fwx, 2, L - fwx, 1, trim);
      q(fwx, 3, 1, 1, dark);
      q(L - 1, 3, 1, 2, dark);
      q(1, 9, ww, 1, trim);
      q(1, 8, 1, 2, dark);
      q(ww, 8, 1, 2, dark);
      q(2, 7, 1, 2, C.dark);
      q(ww - 1, 7, 1, 2, C.dark);
      if (f1) q(1, 8, ww, 1, trim);
      seat(cx0 - 1, 9);
      if (open) {
        q(cx0 + 3, 9, 4, 1, C.steel);
        q(cx0 + 6, 7, 1, 2, C.steel);
      }
      wheel(2); wheel(fwx + 1);
    }
    rect(ctx, x + 1, gy + 1, L - 2, 1, 'rgba(0,0,0,.5)');
  }

  function suitFor(col) {
    var c = String(col || '');
    if (c.charAt(0) !== '#' || c.length < 7) return '#3f6ea8';
    var r = parseInt(c.substr(1, 2), 16), b = parseInt(c.substr(5, 2), 16);
    return r >= b ? '#3f6ea8' : '#c0503a';
  }

  function person(ctx, x, y, shirt, pants) {
    var legCol = pants || '#222a38';
    var helm = '#dfe6ef';
    x = Math.round(x); y = Math.round(y);
    rect(ctx, x - 1, y + PERSON_H, PERSON_W + 2, 1, 'rgba(0,0,0,.45)');
    rect(ctx, x + 1, y, 2, 1, helm);
    rect(ctx, x, y + 1, 4, 1, helm);
    rect(ctx, x + 3, y + 1, 1, 1, C.dark);
    rect(ctx, x + 1, y + 2, 2, 1, C.skin);
    rect(ctx, x + 1, y + 3, 3, 1, helm);
    rect(ctx, x, y + 4, PERSON_W, PERSON_TORSO - 1, shirt);
    rect(ctx, x, y + 5, 1, PERSON_TORSO - 3, 'rgba(0,0,0,.20)');
    rect(ctx, x + PERSON_W - 1, y + 5, 1, PERSON_TORSO - 3, 'rgba(0,0,0,.20)');
    rect(ctx, x, y + PERSON_TORSO + 1, 1, 1, C.skin);
    rect(ctx, x + PERSON_W - 1, y + PERSON_TORSO + 1, 1, 1, C.skin);
    rect(ctx, x + 1, y + PERSON_TORSO + 3, 3, 1, shirt);
    rect(ctx, x + 1, y + PERSON_TORSO + 4, 3, 1, legCol);
    rect(ctx, x, y + PERSON_TORSO + 5, 2, 6, legCol);
    rect(ctx, x + PERSON_W - 2, y + PERSON_TORSO + 5, 2, 6, legCol);
    rect(ctx, x, y + PERSON_H - 2, 2, 2, C.dark);
    rect(ctx, x + PERSON_W - 2, y + PERSON_H - 2, 2, 2, C.dark);
  }

  function drawDoor(ctx, x, floorY) {
    var dw = m(DIM.door.w), dh = m(DIM.door.h);
    var dy = floorY - dh;
    rect(ctx, x, dy, dw, dh, '#2a364a');
    rect(ctx, x + 1, dy + 1, dw - 2, dh - 1, '#1b2434');
    rect(ctx, x + 2, dy + 3, dw - 4, 6, '#141c29');
    rect(ctx, x + dw - 3, dy + Math.round(dh * 0.52), 1, 2, C.gold);
  }

  function drawWindow(ctx, x, topY, stars) {
    var ww = m(DIM.window.w), wh = m(DIM.window.h);
    rect(ctx, x - 1, topY - 1, ww + 2, wh + 2, '#2a364a');
    rect(ctx, x, topY, ww, wh, C.sky);
    rect(ctx, x + Math.floor(ww / 2), topY, 1, wh, C.steel);
    rect(ctx, x, topY + Math.floor(wh / 2), ww, 1, C.steel);
    if (stars) {
      rect(ctx, x + ww - 4, topY + 2, 2, 2, C.moon);
      rect(ctx, x + 2, topY + 2, 1, 1, C.star);
      rect(ctx, x + 4, topY + 7, 1, 1, C.star);
    } else {
      rect(ctx, x + 2, topY + wh - 4, 2, 3, C.amber);
      rect(ctx, x + ww - 4, topY + wh - 3, 2, 2, C.standLit);
    }
    rect(ctx, x - 1, topY + wh, ww + 2, 1, C.steel);
  }

  function drawChair(ctx, x, floorY, flip) {
    var cw = m(DIM.chair.w), ch = m(DIM.chair.h), seat = m(DIM.chair.seat);
    var topY = floorY - ch;
    var seatY = floorY - seat;
    var backX = flip ? x + cw - 1 : x;
    rect(ctx, x, floorY, cw, 1, 'rgba(0,0,0,.4)');
    rect(ctx, backX, topY, 1, ch - seat, '#66503a');
    rect(ctx, x, seatY, cw, 1, '#755c42');
    rect(ctx, x, seatY + 1, 1, seat - 1, '#4a3a2a');
    rect(ctx, x + cw - 1, seatY + 1, 1, seat - 1, '#4a3a2a');
  }

  function drawTable(ctx, x, floorY, dim, topCol, legCol) {
    var tw = m(dim.w), th = m(dim.h);
    var topY = floorY - th;
    rect(ctx, x, floorY, tw, 1, 'rgba(0,0,0,.4)');
    rect(ctx, x, topY, tw, 2, topCol);
    rect(ctx, x + 1, topY + 2, 1, th - 2, legCol);
    rect(ctx, x + tw - 2, topY + 2, 1, th - 2, legCol);
    return { x: x, y: topY, w: tw, h: th };
  }

  function drawRoomShell(ctx, ceilY, floorY, wallCol, floorCol, baseCol) {
    rect(ctx, 0, 0, W, ceilY, C.sky);
    rect(ctx, 0, ceilY, W, 2, C.panel);
    rect(ctx, 0, ceilY + 2, W, floorY - ceilY - 2, wallCol);
    rect(ctx, 0, floorY - 2, W, 2, baseCol);
    rect(ctx, 0, floorY, W, 86 - floorY, floorCol);
    rect(ctx, 0, 86, W, 4, C.sky);
  }

  function bgTrack(ctx, st) {
    var dirt = st.veh === 'rally';
    var lampH = m(DIM.lampPost.h, 6.0);
    var lampW = m(DIM.lampPost.w, 6.0);
    var boardW = m(DIM.adBoard.w, 6.0);
    var boardH = m(DIM.adBoard.h, 6.0);
    rect(ctx, 0, 0, W, 32, C.sky);
    rect(ctx, 0, 20, W, 12, C.sky2);
    for (var i = 0; i < 30; i++) {
      rect(ctx, (rnd(i) * W) | 0, (rnd(i + 90) * 18) | 0, 1, 1, C.star);
    }
    rect(ctx, 136, 6, 5, 5, C.moon);
    rect(ctx, 139, 6, 2, 3, C.sky);
    if (dirt) {
      rect(ctx, 0, 32, W, 14, '#12221a');
      for (var tr = 0; tr < 9; tr++) {
        var tx = 4 + tr * 18 + ((rnd(tr) * 6) | 0);
        var th2 = 7 + ((rnd(tr + 5) * 7) | 0);
        rect(ctx, tx, 46 - th2, 1, th2, '#1d3326');
        rect(ctx, tx - 2, 46 - th2 + 2, 5, 3, '#173024');
        rect(ctx, tx - 1, 46 - th2 + 1, 3, 2, '#1c3a29');
      }
      rect(ctx, 0, 45, W, boardH + 2, '#22301f');
      for (var bx2 = 0; bx2 < W; bx2 += 22) {
        rect(ctx, bx2 + 2, 46, 14, 3, bx2 % 44 ? C.amber : C.white);
      }
      rect(ctx, 0, 48, W, 18, '#3a3226');
      rect(ctx, 0, 66, W, 20, '#463c2c');
      for (var dp = 0; dp < 26; dp++) {
        rect(ctx, (rnd(dp + 21) * W) | 0, 62 + ((rnd(dp + 3) * 22) | 0), 2, 1, '#57492f');
      }
      rect(ctx, 0, 83, W, 3, '#2a2419');
      rect(ctx, 0, 86, W, 4, '#16281d');
      return;
    }
    rect(ctx, 0, 32, W, 11, C.stand);
    for (var j = 0; j < 56; j++) {
      rect(ctx, (rnd(j + 7) * W) | 0, 33 + ((rnd(j + 3) * 9) | 0), 1, 1, j % 4 ? C.standLit : C.goldD);
    }
    rect(ctx, 0, 43, W, boardH, C.board);
    for (var bx = 0; bx < W; bx += boardW) {
      rect(ctx, bx + 2, 44, Math.max(4, boardW - 10), boardH - 2, ((bx / boardW) | 0) % 2 ? C.red : C.gold);
      rect(ctx, bx + boardW - 6, 44, 4, boardH - 2, C.steel);
    }
    [32, 118].forEach(function (px) {
      var topY = 49 - lampH;
      rect(ctx, px, topY, lampW, lampH, C.steel);
      rect(ctx, px - 2, topY, 5, 2, C.panel);
      rect(ctx, px - 1, topY + 1, 3, 1, C.lamp);
      lightCone(ctx, px, topY + 2, 5, 22, 44, 0.11 + 0.03 * Math.sin(st.t * 2));
    });
    rect(ctx, 0, 48, W, 4, C.grass);
    rect(ctx, 0, 52, W, 3, C.kerbA);
    for (var km = 0; km < W; km += 8) rect(ctx, km, 52, 4, 3, C.kerbB);
    rect(ctx, 0, 55, W, 28, C.road);
    for (var d = 0; d < W; d += 16) rect(ctx, d, 69, 8, 1, 'rgba(244,241,232,.35)');
    rect(ctx, 0, 83, W, 3, C.kerbA);
    for (var kn = 0; kn < W; kn += 8) rect(ctx, kn, 83, 4, 3, C.kerbB);
    rect(ctx, 0, 86, W, 4, C.grass2);
  }

  function bgGarage(ctx, st) {
    var floorY = 72;
    var tbW = m(DIM.toolBoard.w), tbH = m(DIM.toolBoard.h);
    var drumW = m(DIM.oilDrum.w), drumH = m(DIM.oilDrum.h);
    var tyreW = m(DIM.tyre.w), tyreH = m(DIM.tyre.h);
    drawRoomShell(ctx, 26, floorY, C.wall, C.floor, C.steel);
    for (var r = 16; r < W; r += 32) {
      rect(ctx, r, 28, 2, floorY - 30, '#182233');
    }
    rect(ctx, 10, 48, tbW, tbH, C.panel);
    rect(ctx, 10, 48, tbW, 1, C.steel);
    for (var i = 0; i < 4; i++) {
      rect(ctx, 13 + i * 4, 51, 1, 5, C.steel);
      rect(ctx, 12 + i * 4, 56, 3, 2, i % 2 ? C.gold : C.red);
    }
    drawDoor(ctx, 142, floorY);
    rect(ctx, 106, floorY, drumW, 1, 'rgba(0,0,0,.45)');
    rect(ctx, 106, floorY - drumH, drumW, drumH, C.redD);
    rect(ctx, 106, floorY - drumH + 2, drumW, 1, C.red);
    rect(ctx, 106, floorY - drumH + 6, drumW, 1, C.red);
    rect(ctx, 118, floorY, tyreW, 1, 'rgba(0,0,0,.45)');
    for (var t = 0; t < 3; t++) {
      var ty = floorY - (t + 1) * tyreH;
      rect(ctx, 118, ty, tyreW, tyreH, '#111620');
      rect(ctx, 119, ty + 1, tyreW - 2, 1, C.steel);
    }
    rect(ctx, 126, floorY, tyreW, 1, 'rgba(0,0,0,.45)');
    for (var t2 = 0; t2 < 2; t2++) {
      var ty2 = floorY - (t2 + 1) * tyreH;
      rect(ctx, 126, ty2, tyreW, tyreH, '#111620');
      rect(ctx, 127, ty2 + 1, tyreW - 2, 1, C.steel);
    }
    rect(ctx, 60, 28, 22, 2, C.lamp);
    lightCone(ctx, 71, 30, 22, 54, 42, 0.08);
    rect(ctx, 0, floorY, W, 1, 'rgba(242,193,78,.18)');
  }

  function bgHome(ctx, st) {
    var floorY = 72;
    drawRoomShell(ctx, 30, floorY, '#181f2c', '#121821', '#0d121a');
    drawDoor(ctx, 12, floorY);
    drawWindow(ctx, 32, floorY - m(DIM.door.h), true);
    drawWindow(ctx, 136, floorY - m(DIM.door.h), true);
    rect(ctx, 114, 32, 1, 9, C.steel);
    rect(ctx, 111, 41, 7, 2, C.lamp);
    lightCone(ctx, 114, 43, 7, 26, 28, 0.09);
    drawChair(ctx, 101, floorY, false);
    var tbl = drawTable(ctx, 108, floorY, DIM.homeTable, '#6b533b', '#473626');
    drawChair(ctx, 123, floorY, true);
    rect(ctx, tbl.x + 2, tbl.y - 1, 3, 1, C.white);
  }

  function bgStreet(ctx, st) {
    var lampH = m(DIM.lampPost.h);
    var lampW = m(DIM.lampPost.w);
    var facades = [
      { x: 0, w: 34, c: '#111824', wins: [14] },
      { x: 34, w: 38, c: '#141c2a', wins: [4, 20] },
      { x: 72, w: 36, c: '#101722', wins: [6, 20] },
      { x: 108, w: 52, c: '#131b28', wins: [8, 28] }
    ];
    rect(ctx, 0, 0, W, 46, C.sky);
    for (var i = 0; i < facades.length; i++) {
      var f = facades[i];
      rect(ctx, f.x, 0, f.w - 1, 46, f.c);
      for (var wi = 0; wi < f.wins.length; wi++) {
        drawWindow(ctx, f.x + f.wins[wi], 8, false);
      }
      if (i === 1) drawDoor(ctx, f.x + 6, 46);
      if (i === 2) drawDoor(ctx, f.x + 18, 46);
      if (i === 3) drawWindow(ctx, f.x + 8, 26, false);
    }
    rect(ctx, 0, 46, W, 8, '#232c3d');
    rect(ctx, 0, 53, W, 1, '#3a465c');
    rect(ctx, 0, 54, W, 30, C.road2);
    rect(ctx, 0, 84, W, 1, '#3a465c');
    rect(ctx, 0, 85, W, 5, '#1d2534');
    var postBase = 87;
    var postTop = postBase - lampH;
    rect(ctx, 9, postBase - 1, 4, 2, C.panel);
    rect(ctx, 10, postTop, lampW, lampH, C.steel);
    rect(ctx, 10, postTop, 8, 1, C.steel);
    rect(ctx, 14, postTop + 1, 5, 2, C.panel);
    rect(ctx, 15, postTop + 2, 3, 1, C.lamp);
    lightCone(ctx, 16, postTop + 3, 5, 30, 62, 0.09);
  }

  function bgExam(ctx, st) {
    var coneW = m(DIM.cone.w), coneH = m(DIM.cone.h);
    var postW = m(DIM.signalPost.w), postH = m(DIM.signalPost.h);
    var boxW = m(DIM.signalBox.w), boxH = m(DIM.signalBox.h);
    rect(ctx, 0, 0, W, 24, '#0f1728');
    rect(ctx, 0, 24, W, 18, C.stand);
    for (var j = 0; j < 44; j++) {
      rect(ctx, (rnd(j) * W) | 0, 26 + ((rnd(j + 2) * 14) | 0), 1, 1, C.standLit);
    }
    rect(ctx, 0, 42, W, 12, C.grass2);
    rect(ctx, 0, 54, W, 3, C.kerbB);
    for (var k = 0; k < W; k += 12) rect(ctx, k, 54, 6, 3, C.kerbA);
    rect(ctx, 0, 57, W, 29, C.road);
    for (var d = 0; d < W; d += 16) rect(ctx, d, 72, 8, 1, 'rgba(244,241,232,.45)');
    rect(ctx, 0, 86, W, 4, C.grass2);
    [46, 102].forEach(function (cx) {
      var cy = 74 - coneH;
      rect(ctx, cx, 74, coneW, 1, 'rgba(0,0,0,.45)');
      rect(ctx, cx + 2, cy, 1, 2, C.red);
      rect(ctx, cx + 1, cy + 2, 3, 3, C.red);
      rect(ctx, cx + 1, cy + 4, 3, 1, C.white);
      rect(ctx, cx, cy + 5, coneW, coneH - 5, C.red);
    });
    var postX = 128;
    var postTop = 54 - postH;
    rect(ctx, postX - 1, 52, postW + 2, 2, C.panel);
    rect(ctx, postX, postTop, postW, postH, C.steel);
    rect(ctx, postX - 2, postTop - 3, boxW, boxH, C.panel);
    rect(ctx, postX - 1, postTop - 2, boxW - 2, 2, st.result === 'fail' ? C.red : '#3b2020');
    rect(ctx, postX - 1, postTop + 1, boxW - 2, 2, st.result === 'fail' ? '#3d331d' : C.amber);
    rect(ctx, postX - 1, postTop + 4, boxW - 2, 2, st.result === 'fail' ? '#1c3326' : C.green);
  }

  function bgMoney(ctx, st) {
    var floorY = 72;
    var boardW = m(DIM.toolBoard.w), boardH = m(DIM.toolBoard.h);
    drawRoomShell(ctx, 30, floorY, '#141b28', '#10151f', '#0c111a');
    drawDoor(ctx, 12, floorY);
    drawWindow(ctx, 136, floorY - m(DIM.door.h), false);
    rect(ctx, 70, 44, boardW, boardH, C.panel);
    rect(ctx, 71, 45, boardW - 2, boardH - 2, '#0f1622');
    for (var i = 0; i < 4; i++) {
      rect(ctx, 74, 47 + i * 2, 13 - i * 2, 1, i === 0 ? C.gold : C.steel);
    }
    drawChair(ctx, 64, floorY, false);
    var tbl = drawTable(ctx, 72, floorY, DIM.moneyTable, '#66503a', '#423324');
    drawChair(ctx, 92, floorY, true);
    rect(ctx, tbl.x + 2, tbl.y - 1, 4, 1, C.white);
  }

  function bgHospital(ctx, st) {
    var floorY = 72;
    var bedW = m(DIM.bed.w), bedH = m(DIM.bed.h), matH = m(DIM.bed.mattress);
    var monW = m(DIM.monitor.w), monH = m(DIM.monitor.h);
    var stW = m(DIM.sideTable.w), stH = m(DIM.sideTable.h);
    drawRoomShell(ctx, 30, floorY, '#16202b', '#111821', '#1d2a36');
    drawDoor(ctx, 12, floorY);
    drawWindow(ctx, 136, floorY - m(DIM.door.h), true);
    rect(ctx, 46, 54, monW, monH, '#0d141d');
    rect(ctx, 46, 54, monW, 1, C.steel);
    rect(ctx, 49, 54 + monH, 1, floorY - stH - (54 + monH), C.steel);
    ctx.strokeStyle = st.tone === 'bad' ? C.red : C.green;
    ctx.lineWidth = 1;
    ctx.beginPath();
    for (var x = 47; x < 46 + monW - 1; x++) {
      var amp = st.tone === 'bad' ? 1 : 1.5;
      var y = 57 + Math.sin((x + st.t * 24) * 0.85) * amp;
      if (x === 47) ctx.moveTo(x, y); else ctx.lineTo(x, y);
    }
    ctx.stroke();
    rect(ctx, 47, floorY, stW, 1, 'rgba(0,0,0,.4)');
    rect(ctx, 47, floorY - stH, stW, stH, '#2c3a4c');
    rect(ctx, 48, floorY - stH + 2, stW - 2, 1, C.steel);
    rect(ctx, 48, floorY - stH + 4, stW - 2, 1, C.steel);
    var bx = 54;
    rect(ctx, bx, floorY, bedW, 1, 'rgba(0,0,0,.45)');
    rect(ctx, bx, floorY - bedH, 1, bedH, C.steel);
    rect(ctx, bx + bedW - 1, floorY - matH - 1, 1, matH + 1, C.steel);
    rect(ctx, bx, floorY - matH, bedW, 3, C.white);
    rect(ctx, bx + 1, floorY - matH - 2, 4, 2, '#dfe6ef');
    rect(ctx, bx + 2, floorY - matH - 3, 3, 2, C.skin);
    rect(ctx, bx + 5, floorY - matH - 2, 13, 2, '#9fb2c9');
    drawChair(ctx, 94, floorY, true);
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

  var POSE0 = {
    pdx: 0, pdy: 0, ptilt: 0, rdx: 0, rdy: 0, rtilt: 0,
    spray: 0, smoke: 0, dust: 0, gravel: 0, spark: 0, brake: 0, tail: 0,
    flag: 0, nod: 0, shake: 0, cone: 0, stall: 0, flash: 0
  };

  var SEQ = {
    overtake_ok: [
      { at: 0.00 },
      { at: 0.14, pdx: 0.08, pdy: 6, ptilt: -0.03, dust: 0.5 },
      { at: 0.34, pdx: 0.34, pdy: 6, dust: 0.4, ptilt: -0.01 },
      { at: 0.58, pdx: 0.62, pdy: 6, rdx: -0.22, dust: 0.3 },
      { at: 0.78, pdx: 0.86, pdy: 3, rdx: -0.52, tail: 0.7 },
      { at: 1.00, pdx: 1.02, pdy: 0, rdx: -0.80, tail: 1, dust: 0.35 }
    ],
    overtake_fail: [
      { at: 0.00 },
      { at: 0.12, pdx: 0.12, pdy: 6, ptilt: -0.03, dust: 0.5 },
      { at: 0.28, pdx: 0.28, pdy: 6, rdx: 0.05, rdy: 5, dust: 0.45 },
      { at: 0.44, pdx: 0.30, pdy: 5, rdx: 0.07, rdy: 6, ptilt: 0.09, brake: 1, spark: 0.8, dust: 0.9, smoke: 0.25 },
      { at: 0.58, pdx: 0.16, pdy: 3, brake: 1, smoke: 0.55, rdx: 0.11, rdy: 3, ptilt: 0.04 },
      { at: 0.76, pdx: 0.05, pdy: 1, brake: 1, smoke: 0.6, rdx: 0.15, rdy: 0 },
      { at: 1.00, pdx: 0.00, pdy: 0, brake: 0.7, smoke: 0.4, rdx: 0.18, rdy: 0 }
    ],
    corner_ok: [
      { at: 0.00, pdx: 0.04, ptilt: 0.02 },
      { at: 0.20, pdx: 0.20, pdy: -2, ptilt: -0.05, dust: 0.3 },
      { at: 0.40, pdx: 0.36, pdy: -3, ptilt: -0.09, brake: 0.5, spark: 0.3 },
      { at: 0.60, pdx: 0.54, pdy: -2, ptilt: -0.04, dust: 0.5 },
      { at: 0.80, pdx: 0.74, pdy: 0, ptilt: 0, dust: 0.3 },
      { at: 1.00, pdx: 0.96, pdy: 0, ptilt: 0, dust: 0.15 }
    ],
    corner_fail: [
      { at: 0.00, pdx: 0.04, ptilt: 0.02 },
      { at: 0.18, pdx: 0.18, pdy: -1, ptilt: -0.04, brake: 0.8 },
      { at: 0.34, pdx: 0.30, pdy: -3, ptilt: 0.07, dust: 0.4, brake: 0.4 },
      { at: 0.50, pdx: 0.40, pdy: -8, ptilt: 0.11, gravel: 0.7 },
      { at: 0.66, pdx: 0.46, pdy: -12, ptilt: 0.15, gravel: 1, dust: 1 },
      { at: 0.82, pdx: 0.48, pdy: -13, ptilt: 0.04, flash: 0.9, smoke: 0.35, gravel: 0.8 },
      { at: 1.00, pdx: 0.48, pdy: -13, ptilt: 0.00, smoke: 0.55, brake: 1, flash: 0.15, gravel: 0.4 }
    ],
    wet_ok: [
      { at: 0.00, pdx: 0.05, spray: 0.35 },
      { at: 0.20, pdx: 0.24, spray: 0.8, ptilt: -0.02 },
      { at: 0.44, pdx: 0.44, spray: 1, rdx: -0.04 },
      { at: 0.68, pdx: 0.64, spray: 0.95, rdx: -0.34, tail: 0.4 },
      { at: 0.86, pdx: 0.82, spray: 0.8, rdx: -0.58, tail: 0.8 },
      { at: 1.00, pdx: 0.94, spray: 0.7, rdx: -0.76, tail: 1 }
    ],
    wet_fail: [
      { at: 0.00, pdx: 0.05, spray: 0.4 },
      { at: 0.16, pdx: 0.20, spray: 0.85, ptilt: -0.03 },
      { at: 0.32, pdx: 0.30, ptilt: 0.12, spray: 1 },
      { at: 0.48, pdx: 0.34, ptilt: 0.48, pdy: -2, spray: 0.8, dust: 0.2 },
      { at: 0.64, pdx: 0.36, ptilt: 0.92, pdy: -6, spray: 0.5 },
      { at: 0.80, pdx: 0.38, ptilt: 1.18, pdy: -12, flash: 1, spray: 0.3, smoke: 0.25 },
      { at: 1.00, pdx: 0.38, ptilt: 1.08, pdy: -12, flash: 0.1, spray: 0.15, brake: 1 }
    ],
    mechanical_ok: [
      { at: 0.00, pdx: 0.04 },
      { at: 0.24, pdx: 0.28 },
      { at: 0.48, pdx: 0.50, flag: 0.3 },
      { at: 0.72, pdx: 0.72, flag: 0.8 },
      { at: 0.90, pdx: 0.88, flag: 1, brake: 0.2 },
      { at: 1.00, pdx: 0.94, flag: 1, brake: 0.5 }
    ],
    mechanical_fail: [
      { at: 0.00, pdx: 0.04 },
      { at: 0.20, pdx: 0.24, smoke: 0.25 },
      { at: 0.42, pdx: 0.36, smoke: 0.6, ptilt: 0.02 },
      { at: 0.62, pdx: 0.40, pdy: -5, smoke: 0.9 },
      { at: 0.80, pdx: 0.33, pdy: -9, smoke: 1, brake: 1 },
      { at: 1.00, pdx: 0.30, pdy: -9, smoke: 0.85, brake: 1, stall: 1 }
    ],
    exam_ok: [
      { at: 0.00, pdx: 0.00, brake: 0.4 },
      { at: 0.18, pdx: 0.28, brake: 0.6 },
      { at: 0.38, pdx: 0.55, brake: 1 },
      { at: 0.50, pdx: 0.58, brake: 1, nod: 0.5 },
      { at: 0.66, pdx: 0.58, brake: 1, nod: 0.85, flag: 0.3 },
      { at: 0.82, pdx: 0.58, brake: 1, nod: 1, flag: 0.7 },
      { at: 1.00, pdx: 0.58, brake: 1, nod: 1, flag: 1 }
    ],
    exam_fail: [
      { at: 0.00, pdx: 0.00 },
      { at: 0.18, pdx: 0.20, stall: 0.4 },
      { at: 0.34, pdx: 0.34, stall: 1, ptilt: 0.04 },
      { at: 0.50, pdx: 0.62, stall: 0.9, cone: 1, brake: 1 },
      { at: 0.68, pdx: 0.64, stall: 0.6, cone: 1, shake: 0.5, brake: 1 },
      { at: 1.00, pdx: 0.64, stall: 0.4, cone: 1, shake: 1, brake: 1 }
    ]
  };

  function poseOf(sit, res, p) {
    var key = (sit || 'corner') + '_' + (res === 'fail' ? 'fail' : 'ok');
    var seq = SEQ[key] || SEQ.corner_ok;
    var frames = [];
    var cur = {};
    Object.keys(POSE0).forEach(function (k) { cur[k] = POSE0[k]; });
    for (var i = 0; i < seq.length; i++) {
      var f = seq[i];
      Object.keys(f).forEach(function (k) { if (k !== 'at') cur[k] = f[k]; });
      var snap = {};
      Object.keys(cur).forEach(function (k) { snap[k] = cur[k]; });
      frames.push({ at: f.at, p: snap });
    }
    p = clamp(p == null ? 0.5 : p, 0, 1);
    var a = frames[0], b = frames[frames.length - 1];
    for (var j = 0; j < frames.length - 1; j++) {
      if (p >= frames[j].at && p <= frames[j + 1].at) { a = frames[j]; b = frames[j + 1]; break; }
    }
    var span = b.at - a.at;
    var u = span > 0 ? clamp((p - a.at) / span, 0, 1) : 1;
    u = u * u * (3 - 2 * u);
    var out = {};
    Object.keys(POSE0).forEach(function (k) {
      out[k] = a.p[k] + (b.p[k] - a.p[k]) * u;
    });
    out.key = key;
    return out;
  }

  function fxSmoke(ctx, x, y, amount, t, col) {
    if (amount <= 0.02) return;
    var n = Math.round(3 + amount * 6);
    for (var i = 0; i < n; i++) {
      var ph = (t * 22 + i * 7) % 26;
      var sx = x - 2 - i * 2 - (rnd(i + 2) * 3);
      var sy = y - 3 - i * 2 - ph * 0.5;
      ctx.globalAlpha = clamp(amount * (0.75 - i * 0.07), 0.1, 0.8);
      rect(ctx, sx, sy, 2 + (i % 2), 2 + (i % 3 === 0 ? 1 : 0), col || C.smoke);
    }
    ctx.globalAlpha = 1;
  }

  function fxSpray(ctx, x, y, amount, t) {
    if (amount <= 0.02) return;
    var n = Math.round(5 + amount * 12);
    for (var i = 0; i < n; i++) {
      var fly = (t * 60 + i * 11) % 24;
      var sx = x - 2 - fly * (0.6 + rnd(i) * 0.8);
      var sy = y - 1 - (i % 4) * 2 + rnd(i + 8) * 3;
      ctx.globalAlpha = clamp(amount * (0.85 - fly * 0.028), 0.08, 0.85);
      rect(ctx, sx, sy, 2, 1, i % 3 ? C.spray : '#eef5fc');
    }
    ctx.globalAlpha = 1;
  }

  function fxDust(ctx, x, y, amount, t) {
    if (amount <= 0.02) return;
    var n = Math.round(3 + amount * 7);
    for (var i = 0; i < n; i++) {
      var fly = (t * 34 + i * 9) % 20;
      ctx.globalAlpha = clamp(amount * (0.75 - fly * 0.025), 0.08, 0.7);
      rect(ctx, x - 2 - fly, y - 1 - (i % 3), 2, 1, i % 3 ? '#8b7f63' : '#a8977a');
    }
    ctx.globalAlpha = 1;
  }

  function fxGravel(ctx, x, y, amount, t) {
    if (amount <= 0.02) return;
    var n = Math.round(3 + amount * 9);
    for (var i = 0; i < n; i++) {
      var gx = x + 4 + rnd(i + 30) * 30 * amount;
      var gy = y + 2 + rnd(i + 60) * 10;
      ctx.globalAlpha = clamp(amount * 0.8, 0.1, 0.9);
      rect(ctx, gx, gy - (t * 20 + i * 3) % 6, 1, 1, i % 3 ? C.gravel : '#8d887c');
    }
    ctx.globalAlpha = 1;
  }

  function fxSpark(ctx, x, y, amount, t) {
    if (amount <= 0.02) return;
    var n = Math.round(1 + amount * 4);
    for (var i = 0; i < n; i++) {
      var sx = x - i * 3 - (t * 40 + i * 5) % 8;
      ctx.globalAlpha = clamp(amount * 0.9, 0.1, 0.95);
      rect(ctx, sx, y - (i % 3) - (t * 12 + i) % 4, 1, 1, i % 2 ? C.lamp : '#fff6d8');
    }
    ctx.globalAlpha = 1;
  }

  function fxRain(ctx, t, amount) {
    if (amount <= 0.02) return;
    for (var i = 0; i < 46; i++) {
      var rx = ((rnd(i) * W) + t * 26 * (0.5 + rnd(i + 4))) % W;
      var ry = ((rnd(i + 9) * H) + t * 96) % H;
      ctx.globalAlpha = 0.28 + rnd(i + 2) * 0.26;
      rect(ctx, rx, ry, 1, 3, '#cfdcec');
    }
    ctx.globalAlpha = 1;
  }

  function drawTail(ctx, x, gy, h, strength) {
    if (strength <= 0.1) return;
    ctx.globalAlpha = clamp(strength * 0.55, 0, 0.55);
    rect(ctx, x - 6, gy - h + 1, 6, 2, C.red);
    ctx.globalAlpha = 1;
    rect(ctx, x, gy - Math.round(h * 0.55), 1, 2, strength > 0.5 ? '#ff5a48' : C.redD);
    rect(ctx, x, gy - Math.round(h * 0.35), 1, 1, strength > 0.5 ? '#ff5a48' : C.redD);
  }

  function drawBarrier(ctx, x, y, w) {
    for (var i = 0; i < w; i += 2) {
      rect(ctx, x + i, y, 2, 3, i % 4 ? C.white : C.red);
    }
    rect(ctx, x, y + 3, w, 1, C.steel);
  }

  function drawFlag(ctx, x, y, phase) {
    rect(ctx, x, y - 12, 1, 13, C.steel);
    var f = Math.sin(phase * 6) > 0 ? 0 : 1;
    for (var r = 0; r < 4; r++) {
      for (var c2 = 0; c2 < 5; c2++) {
        var ox = (r % 2 === 0 ? 0 : 1) + (f && c2 === 2 ? 1 : 0);
        rect(ctx, x + 1 + c2 * 2 + ox, y - 12 + r * 2, 2, 2, (r + c2) % 2 ? C.white : C.dark);
      }
    }
  }

  function drawCone(ctx, x, gy, tipped) {
    if (tipped > 0.5) {
      rect(ctx, x, gy - 2, 5, 2, C.red);
      rect(ctx, x, gy - 3, 2, 1, C.white);
      rect(ctx, x + 4, gy - 3, 1, 1, C.red);
      return;
    }
    rect(ctx, x, gy, 4, 1, 'rgba(0,0,0,.45)');
    rect(ctx, x + 1, gy - 5, 2, 5, C.red);
    rect(ctx, x + 1, gy - 3, 2, 1, C.white);
  }

  function drawTrackScene(ctx, st) {
    var pose = st.pose;
    var v = VEHP[st.veh] || VEHP.kart;
    var L = v.L, HH = v.H;
    var gap = Math.max(8, Math.round(L * 0.32));
    var span = 2 * L + gap;
    var bx = Math.max(6, Math.round((W - span) / 2));
    var rally = st.veh === 'rally';
    var gyP = 74 + Math.round(pose.pdy) + (rally ? 2 : 0);
    var gyR = 62 + Math.round(pose.rdy);
    var px = bx + Math.round(pose.pdx * L);
    var rx = bx + L + gap + Math.round(pose.rdx * L);
    var pal = PAL[st.veh] || PAL.kart;

    if (pose.gravel > 0.05) {
      ctx.globalAlpha = clamp(pose.gravel * 1.4, 0, 1);
      rect(ctx, 0, 44, W, 10, '#4b4740');
      for (var g = 0; g < 60; g++) {
        rect(ctx, (rnd(g + 12) * W) | 0, 45 + ((rnd(g + 40) * 8) | 0), 1, 1, g % 3 ? C.gravel : '#8d887c');
      }
      drawBarrier(ctx, 0, 44, W);
      ctx.globalAlpha = 1;
    }

    function rival() {
      drawVehicle(ctx, st.veh, rx, gyR, { body: C.blue, dark: C.blueD, driver: true });
      drawTail(ctx, rx, gyR, HH, pose.tail);
    }
    function player() {
      var opts = { body: pal.body, dark: pal.dark, trim: pal.trim, tilt: pose.ptilt, driver: true };
      drawVehicle(ctx, st.veh, px, gyP, opts);
      if (pose.spray > 0.02) fxSpray(ctx, px + 2, gyP, pose.spray, st.t);
      if (pose.smoke > 0.02) fxSmoke(ctx, px + 2, gyP, pose.smoke, st.t);
      if (pose.dust > 0.02) fxDust(ctx, px + 2, gyP, pose.dust, st.t);
      if (pose.spark > 0.02) fxSpark(ctx, px + Math.round(L * 0.72), gyP - 1, pose.spark, st.t);
      if (pose.gravel > 0.05) fxGravel(ctx, px + Math.round(L * 0.3), gyP, pose.gravel, st.t);
      if (pose.brake > 0.5) {
        var by = gyP - Math.round(HH * 0.55);
        ctx.globalAlpha = 0.30;
        rect(ctx, px - 4, by - 1, 5, 4, C.red);
        ctx.globalAlpha = 1;
        rect(ctx, px, by, 2, 2, '#ff6a52');
        rect(ctx, px + 3, by, 2, 2, '#ff6a52');
      }
      if (pose.brake > 0.8) fxSmoke(ctx, px + L - 11, gyP, 0.3, st.t, '#c9d2df');
      if (pose.flag > 0.05) drawFlag(ctx, Math.min(W - 12, px + L + 8), 62, pose.flag * 4 + st.t);
      if (pose.stall > 0.1 && Math.round(st.t * 8) % 2) {
        rect(ctx, px + 2, gyP - HH - 3, 2, 1, C.amber);
        rect(ctx, px + L - 4, gyP - HH - 3, 2, 1, C.amber);
      }
    }
    if (!rally && gyR <= gyP) { rival(); player(); }
    else if (!rally) { player(); rival(); }
    else { player(); }

    if (pose.dust < 0.05 && pose.spray < 0.05) {
      for (var i = 0; i < 4; i++) {
        var sx = 12 + ((i * 23 + st.t * 44) % 136);
        rect(ctx, sx, 58 + (i % 3) * 6, 5, 1, 'rgba(242,193,78,.28)');
      }
    }
    if (st.sit === 'wet') {
      for (var wq = 0; wq < 6; wq++) rect(ctx, 6 + wq * 26, 76, 12, 1, 'rgba(180,205,230,.20)');
      fxRain(ctx, st.t, 1);
    }
  }

  function drawGarageScene(ctx, st) {
    var pose = st.pose;
    var v = VEHP[st.veh] || VEHP.kart;
    var gy = 72;
    var x = 40 + Math.round(pose.pdx * v.L * 0.6);
    var pal = PAL[st.veh] || PAL.kart;
    drawVehicle(ctx, st.veh, x, gy, { body: pal.body, dark: pal.dark, trim: pal.trim, driver: true, tilt: pose.ptilt });
    if (pose.smoke > 0.02) fxSmoke(ctx, x + Math.round(v.L * 0.2), gy, pose.smoke + 0.2, st.t);
    if (pose.spark > 0.02) fxSpark(ctx, x + Math.round(v.L * 0.55), gy - 1, pose.spark, st.t);
    if (pose.brake > 0.5) {
      rect(ctx, x + 1, gy - Math.round(v.H * 0.5), 1, 2, '#ff5a48');
    }
    person(ctx, 22 + Math.round(pose.pdx * 4), gy + 1 - PERSON_H, C.blue, '#1e2533');
    if (st.result !== 'fail' && pose.smoke < 0.4) {
      var sx = x + Math.round(v.L * 0.5) + Math.sin(st.t * 9) * 2;
      rect(ctx, sx, gy - 12, 1, 1, C.white);
      rect(ctx, sx + 2, gy - 10, 1, 1, C.amber);
      rect(ctx, sx - 2, gy - 9, 1, 1, C.white);
    }
  }

  function drawStreetScene(ctx, st) {
    var pose = st.pose;
    var v = VEHP[st.veh] || VEHP.street;
    var race = st.veh === 'streetRace';
    var gy = 80;
    var px = 8 + Math.round(pose.pdx * (W - v.L - 16));
    var copX = Math.min(W - 4, 96 + Math.round(pose.rdx * v.L));
    var pal = race ? PAL.streetRace : PAL.street;
    drawVehicle(ctx, 'street', copX, 68, { body: '#4c5a73', dark: '#2a3446', driver: true });
    drawVehicle(ctx, st.veh, px, gy, {
      body: pal.body, dark: pal.dark, trim: pal.trim, tilt: pose.ptilt, driver: true
    });
    if (pose.spray > 0.02) fxSpray(ctx, px + Math.round(v.L * 0.2), gy, pose.spray, st.t);
    if (pose.smoke > 0.02) fxSmoke(ctx, px + Math.round(v.L * 0.2), gy, pose.smoke, st.t);
    if (pose.spark > 0.02) fxSpark(ctx, px + Math.round(v.L * 0.75), gy - 1, pose.spark, st.t);
    if (pose.brake > 0.5) {
      rect(ctx, px + 1, gy - Math.round(v.H * 0.5), 1, 2, '#ff5a48');
    }
    if (st.result === 'fail' && st.sit !== 'wet') {
      var f = Math.floor(st.t * 6) % 2;
      rect(ctx, copX + Math.round(v.L * 0.5), 66, 4, 2, f ? C.red : C.blue);
      rect(ctx, copX + Math.round(v.L * 0.5) + 4, 66, 4, 2, f ? C.blue : C.red);
      ctx.globalAlpha = 0.1 + 0.06 * f;
      rect(ctx, copX + Math.round(v.L * 0.35), 60, 26, 14, f ? C.red : C.blue);
      ctx.globalAlpha = 1;
    }
    person(ctx, 134, 54 - PERSON_H, '#5b6d87', '#1a2130');
    if (st.sit === 'wet') fxRain(ctx, st.t, 1);
  }

  function drawExamScene(ctx, st) {
    var pose = st.pose;
    var v = VEHP.street;
    var gy = 74;
    var x = 14 + Math.round(pose.pdx * 62);
    if (pose.stall > 0.3 && Math.round(st.t * 10) % 2) x -= 1;
    drawVehicle(ctx, 'street', x, gy, {
      body: '#8a6f2e', dark: '#5a4718', trim: C.white, tilt: pose.ptilt, driver: true
    });
    if (pose.brake > 0.5) {
      rect(ctx, x + 1, gy - 8, 1, 2, '#ff5a48');
      rect(ctx, x + 3, gy - 8, 1, 2, '#ff5a48');
    }
    drawCone(ctx, 100, gy, pose.cone);
    if (pose.cone > 0.5) {
      rect(ctx, 97, gy - 1, 3, 1, C.red);
      rect(ctx, 96, gy - 2, 2, 1, C.redD);
    }
    var ex = 112;
    var nodY = pose.nod > 0.5 ? 1 : 0;
    var shakeX = pose.shake > 0.2 ? (Math.floor(st.t * 14) % 2 ? 1 : -1) : 0;
    person(ctx, ex + shakeX, 54 - PERSON_H + nodY, '#4d617a', '#1e2736');
    if (pose.nod > 0.4) {
      rect(ctx, ex + 5, 35 + nodY, 1, 7, '#4d617a');
      rect(ctx, ex + 5, 33 + nodY, 1, 2, C.skin);
      rect(ctx, ex + 6, 30 + nodY, 3, 4, C.white);
      rect(ctx, ex + 7, 31 + nodY, 1, 1, C.steel);
      rect(ctx, ex + 7, 32 + nodY, 1, 1, C.green);
      rect(ctx, ex + 7, 33 + nodY, 2, 1, C.green);
    }
    if (pose.shake > 0.2) {
      var k = Math.floor(st.t * 12) % 2;
      rect(ctx, ex + 1, 29 + k, 1, 1, C.red);
      rect(ctx, ex + 3, 29 + k, 1, 1, C.red);
      rect(ctx, ex + 2, 30 + k, 1, 1, C.red);
      rect(ctx, ex + 1, 31 + k, 1, 1, C.red);
      rect(ctx, ex + 3, 31 + k, 1, 1, C.red);
      rect(ctx, ex + 5, 41, 3, 1, '#4d617a');
      rect(ctx, ex + 8, 39, 1, 3, C.skin);
    }
    if (pose.flag > 0.2) drawFlag(ctx, 142, 74, pose.flag * 4 + st.t);
  }

  function actors(ctx, type, st) {
    if (type === 'track' || type === 'rally') drawTrackScene(ctx, st);
    else if (type === 'garage') drawGarageScene(ctx, st);
    else if (type === 'street') drawStreetScene(ctx, st);
    else if (type === 'exam') drawExamScene(ctx, st);
    else if (type === 'home') {
      var p = st.prog || 0, tone = st.tone;
      var floorY = 72;
      person(ctx, 52, floorY - PERSON_H, C.gold, '#2a2f3a');
      var gap = tone === 'good' ? 12 - 4 * p : (tone === 'bad' ? 14 + 10 * p : 12);
      person(ctx, 52 + gap, floorY - PERSON_H, '#7d8ea6', '#2a2f3a');
      person(ctx, 60 + gap, floorY - PERSON_H, '#8f7da6', '#2a2f3a');
      if (tone === 'bad') rect(ctx, 52, floorY - PERSON_H - 4, 5, 1, C.red);
    } else if (type === 'money') {
      var p2 = st.prog || 0, tone2 = st.tone;
      var grow = tone2 === 'good' ? p2 : (tone2 === 'bad' ? 1 - p2 * 0.8 : 0.5);
      var bills = Math.max(1, Math.round(grow * 5));
      for (var k = 0; k < bills; k++) {
        rect(ctx, 81, 63 - k, 3, 1, k % 2 ? C.green : '#3f7d5d');
        if (k < bills - 1) rect(ctx, 85, 63 - k, 3, 1, k % 2 ? '#3f7d5d' : C.green);
      }
      var step = tone2 === 'good' ? Math.round(3 * p2) : (tone2 === 'bad' ? Math.round(-4 * p2) : 0);
      person(ctx, 54 + step, 72 - PERSON_H, C.gold, '#2a2f3a');
      person(ctx, 102 - step, 72 - PERSON_H, '#4d617a', '#1a2130');
    } else if (type === 'hospital') {
      var p3 = st.prog || 0;
      var vx = 80 + (st.tone === 'bad' ? Math.round(6 * p3) : Math.round(-3 * p3));
      person(ctx, vx, 72 - PERSON_H, '#dfe6ef', '#2f3a4a');
    }
  }

  function paint(canvas, type, tone, t, prog, cfg) {
    cfg = cfg || {};
    var ctx = ctxOf(canvas);
    var sit = cfg.sit || (type === 'exam' ? 'exam' : (type === 'garage' ? 'mechanical' : 'corner'));
    var result = cfg.result || ((tone === 'bad' || tone === 'crash') ? 'fail' : 'ok');
    var veh = cfg.veh || (type === 'rally' ? 'rally' : (type === 'track' ? 'kart' : (type === 'street' ? 'street' : (type === 'exam' ? 'street' : 'kart'))));
    var st = {
      t: t || 0, tone: tone, prog: prog, veh: veh, sit: sit, result: result,
      pose: poseOf(sit, result, prog)
    };
    getBg(type === 'rally' ? 'track' : type)(ctx, st);
    actors(ctx, type, st);
    if (st.pose.flash > 0.05) {
      ctx.globalAlpha = clamp(st.pose.flash * 0.55, 0, 0.55);
      rect(ctx, 0, 0, W, H, C.white);
      ctx.globalAlpha = 1;
    }
    if (tone === 'bad' && prog > 0.15) {
      ctx.globalAlpha = Math.max(0, 0.22 * (1 - prog));
      rect(ctx, 0, 0, W, H, C.red);
      ctx.globalAlpha = 1;
    }
    ctx.globalAlpha = 0.08;
    for (var y = 0; y < H; y += 2) rect(ctx, 0, y, W, 1, '#000');
    ctx.globalAlpha = 1;
  }

  function easeInOut(p) { return p < 0.5 ? 2 * p * p : 1 - Math.pow(-2 * p + 2, 2) / 2; }

  function play(canvas, cfg) {
    cfg = cfg || {};
    var type = cfg.type || 'track';
    var tone = cfg.tone || 'neutral';
    var dur = cfg.dur || 1.5;
    if (reduced || cfg.instant) {
      paint(canvas, type, tone, 0, cfg.p == null ? (tone === 'bad' ? 1 : 0.62) : cfg.p, cfg);
      return Promise.resolve();
    }
    return new Promise(function (resolve) {
      var t0 = 0;
      function frame(ts) {
        if (!t0) t0 = ts;
        var el = (ts - t0) / 1000;
        var p = Math.min(1, el / dur);
        paint(canvas, type, tone, el, easeInOut(p), cfg);
        if (p < 1) requestAnimationFrame(frame); else resolve();
      }
      requestAnimationFrame(frame);
    });
  }

  function hero(canvas) {
    var raf = null, start = 0, alive = true;
    function loop(ts) {
      if (!alive) return;
      if (!start) start = ts;
      var el = (ts - start) / 1000;
      paint(canvas, 'track', 'good', el, (el % 3.6) / 3.6, { veh: 'f4', sit: 'overtake', result: 'ok' });
      raf = requestAnimationFrame(loop);
    }
    if (reduced) { paint(canvas, 'track', 'good', 0, 0.55, { veh: 'f4', sit: 'overtake', result: 'ok' }); return function () {}; }
    raf = requestAnimationFrame(loop);
    return function () { alive = false; if (raf) cancelAnimationFrame(raf); };
  }

  function still(canvas, type, opts) {
    opts = opts || {};
    paint(canvas, type || 'track', opts.tone || 'neutral', 0, opts.p == null ? 0.5 : opts.p, opts);
  }

  function render(canvas, cfg) {
    cfg = cfg || {};
    paint(canvas, cfg.type || 'track', cfg.tone || 'neutral', cfg.t || 0, cfg.p == null ? 0.5 : cfg.p, cfg);
  }

  function gallery(canvas, key, opts) {
    opts = opts || {};
    var ctx = ctxOf(canvas);
    rect(ctx, 0, 0, W, H, '#000');
    var gy = 78;
    if (opts.ground) { rect(ctx, 0, gy + 1, W, 1, '#1a2130'); }
    if (opts.person) person(ctx, opts.px == null ? W - 26 : opts.px, gy - PERSON_H + 1, C.blue, '#1e2533');
    var pal = PAL[key] || PAL.kart;
    drawVehicle(ctx, key, opts.x == null ? 6 : opts.x, gy, {
      body: pal.body, dark: pal.dark, trim: pal.trim,
      driver: opts.driver !== false, tilt: opts.tilt || 0
    });
  }

  var list = Object.keys(VEHP).map(function (k) {
    var v = VEHP[k];
    return {
      key: k, name: v.n, len_m: v.len_m, wid_m: v.wid_m, h_m: v.h_m, wheel_m: v.wheel_m,
      art_scale: ART_SCALE, len_px: v.L, draw_px: v.draw, h_px: v.H, wheel_px: v.WH,
      person_px: PERSON_H
    };
  });

  root.PX = {
    W: W, H: H, play: play, still: still, hero: hero, reduced: reduced,
    render: render, gallery: gallery, vehicles: list, pxPerM: PX_PER_M,
    artScale: ART_SCALE, personPx: PERSON_H
  };
})(typeof window !== 'undefined' ? window : this);
