(function (root) {
  'use strict';

  var W = 160, H = 90;
  var PX_PER_M = 10.6;
  var TRACK_PX_PER_M = 6.0;
  var PERSON_H_M = 1.7;
  var PERSON_W_M = 0.45;
  var DIM = {
    person: { w: PERSON_W_M, h: PERSON_H_M, head: 0.38, torso: 0.66, legs: 0.66 },
    car: { w: 5.6, h: 1.0, wheel: 0.66 },
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

  function m(v, scale) { return Math.max(1, Math.round(v * (scale || PX_PER_M))); }
  var PERSON_W = m(DIM.person.w);
  var PERSON_H = m(DIM.person.h);

  function ctxOf(canvas) {
    canvas.width = W; canvas.height = H;
    var ctx = canvas.getContext('2d');
    ctx.imageSmoothingEnabled = false;
    return ctx;
  }
  function rect(ctx, x, y, w, h, c) { ctx.fillStyle = c; ctx.fillRect(x | 0, y | 0, w | 0, h | 0); }
  function rnd(i) { var x = Math.sin(i * 127.1 + 311.7) * 43758.5453; return x - Math.floor(x); }

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

  function car(ctx, x, y, body, dark, scale, tilt) {
    var s = scale || PX_PER_M;
    var w = m(DIM.car.w, s);
    var h = m(DIM.car.h, s);
    x = Math.round(x); y = Math.round(y);
    if (tilt) {
      ctx.save();
      ctx.translate(x + w / 2, y + h / 2);
      ctx.rotate(tilt);
      ctx.translate(-w / 2, -h / 2);
      ctx.globalAlpha = 0.95;
      car(ctx, 0, 0, body, dark, s, 0);
      ctx.restore();
      return;
    }
    var wh = m(DIM.car.wheel, s);
    var wy = y + h - wh;
    var rwX = x + Math.round(w * 0.11);
    var fwX = x + Math.round(w * 0.74);
    var bodyY = y + Math.round(h * 0.42);
    var bodyH = Math.max(2, Math.round(h * 0.38));
    var noseY = y + Math.round(h * 0.54);
    var noseH = Math.max(1, Math.round(h * 0.24));
    rect(ctx, x + 1, y + h, w - 2, 1, 'rgba(0,0,0,.55)');
    rect(ctx, x, y + Math.round(h * 0.14), Math.max(2, Math.round(w * 0.09)), Math.max(2, Math.round(h * 0.34)), dark);
    rect(ctx, x + Math.round(w * 0.05), y + Math.round(h * 0.44), Math.max(1, Math.round(w * 0.04)), Math.max(1, Math.round(h * 0.28)), dark);
    rect(ctx, x + Math.round(w * 0.16), y + Math.round(h * 0.16), Math.round(w * 0.24), Math.max(2, Math.round(h * 0.52)), body);
    rect(ctx, x + Math.round(w * 0.40), y + Math.round(h * 0.20), Math.round(w * 0.16), Math.max(2, Math.round(h * 0.34)), dark);
    rect(ctx, x + Math.round(w * 0.45), y + Math.round(h * 0.14), Math.max(2, Math.round(w * 0.06)), Math.max(1, Math.round(h * 0.22)), C.white);
    rect(ctx, x + Math.round(w * 0.12), bodyY, Math.round(w * 0.62), bodyH, body);
    rect(ctx, x + Math.round(w * 0.22), y + Math.round(h * 0.56), Math.round(w * 0.24), Math.max(1, Math.round(h * 0.20)), dark);
    rect(ctx, x + Math.round(w * 0.72), noseY, Math.round(w * 0.22), noseH, body);
    rect(ctx, x + Math.round(w * 0.88), y + Math.round(h * 0.72), Math.max(2, Math.round(w * 0.12)), Math.max(1, Math.round(h * 0.20)), dark);
    rect(ctx, x + Math.round(w * 0.14), bodyY, Math.round(w * 0.56), 1, 'rgba(255,255,255,.28)');
    rect(ctx, x + w - 2, noseY, 2, 1, C.lamp);
    rect(ctx, x, bodyY + 1, 1, 1, C.red);
    rect(ctx, rwX, wy, wh, wh, C.dark);
    rect(ctx, fwX, wy, wh, wh, C.dark);
    if (wh >= 4) {
      rect(ctx, rwX + 1, wy + 1, wh - 2, wh - 2, '#8b9bb4');
      rect(ctx, fwX + 1, wy + 1, wh - 2, wh - 2, '#8b9bb4');
      if (wh >= 6) {
        rect(ctx, rwX + 2, wy + 2, wh - 4, wh - 4, C.dark);
        rect(ctx, fwX + 2, wy + 2, wh - 4, wh - 4, C.dark);
      }
    }
  }

  function person(ctx, x, y, shirt, pants) {
    var headH = m(DIM.person.head);
    var torsoH = m(DIM.person.torso);
    var legsH = PERSON_H - headH - torsoH;
    var legY = y + headH + torsoH;
    var legCol = pants || '#222a38';
    x = Math.round(x); y = Math.round(y);
    rect(ctx, x - 1, y + PERSON_H, PERSON_W + 2, 1, 'rgba(0,0,0,.45)');
    rect(ctx, x + 1, y, 3, 1, '#1a2130');
    rect(ctx, x + 1, y + 1, 3, headH - 1, C.skin);
    rect(ctx, x + 2, y + 2, 1, 1, C.skinD);
    rect(ctx, x, y + headH, PERSON_W, torsoH - 1, shirt);
    rect(ctx, x + 1, y + headH + torsoH - 1, 3, 1, shirt);
    rect(ctx, x, y + headH + torsoH - 2, 1, 1, C.skin);
    rect(ctx, x + PERSON_W - 1, y + headH + torsoH - 2, 1, 1, C.skin);
    rect(ctx, x + 1, legY, 3, 1, legCol);
    rect(ctx, x, legY + 1, 2, legsH - 2, legCol);
    rect(ctx, x + 3, legY + 1, 2, legsH - 2, legCol);
    rect(ctx, x, y + PERSON_H - 1, 2, 1, C.dark);
    rect(ctx, x + 3, y + PERSON_H - 1, 2, 1, C.dark);
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
    var s = TRACK_PX_PER_M;
    var lampH = m(DIM.lampPost.h, s);
    var lampW = m(DIM.lampPost.w, s);
    var boardW = m(DIM.adBoard.w, s);
    var boardH = m(DIM.adBoard.h, s);
    rect(ctx, 0, 0, W, 32, C.sky);
    rect(ctx, 0, 20, W, 12, C.sky2);
    for (var i = 0; i < 30; i++) {
      rect(ctx, (rnd(i) * W) | 0, (rnd(i + 90) * 18) | 0, 1, 1, C.star);
    }
    rect(ctx, 136, 6, 5, 5, C.moon);
    rect(ctx, 139, 6, 2, 3, C.sky);
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
    for (var d = 0; d < W; d += 14) rect(ctx, d, 69, 7, 1, 'rgba(244,241,232,.28)');
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
    for (var c = 0; c < 4; c++) {
      var cx = 56 + c * 24;
      var cy = 66 - coneH;
      rect(ctx, cx, 66, coneW, 1, 'rgba(0,0,0,.45)');
      rect(ctx, cx + 2, cy, 1, 2, C.red);
      rect(ctx, cx + 1, cy + 2, 3, 3, C.red);
      rect(ctx, cx + 1, cy + 4, 3, 1, C.white);
      rect(ctx, cx, cy + 5, coneW, coneH - 5, C.red);
    }
    var postX = 146;
    var postTop = 54 - postH;
    rect(ctx, postX - 1, 52, postW + 2, 2, C.panel);
    rect(ctx, postX, postTop, postW, postH, C.steel);
    rect(ctx, postX - 2, postTop - 3, boxW, boxH, C.panel);
    rect(ctx, postX - 1, postTop - 2, boxW - 2, 2, st.tone === 'bad' ? C.red : '#3b2020');
    rect(ctx, postX - 1, postTop + 1, boxW - 2, 2, st.tone === 'neutral' ? C.amber : '#3d331d');
    rect(ctx, postX - 1, postTop + 4, boxW - 2, 2, st.tone === 'bad' ? '#1c3326' : C.green);
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

  function actors(ctx, type, st) {
    var p = st.prog || 0;
    var tone = st.tone || 'neutral';
    var carW = m(DIM.car.w, TRACK_PX_PER_M);
    var carH = m(DIM.car.h);
    var floorY = 72;
    if (type === 'track') {
      var r1 = 66 + (tone === 'good' ? 10 * p : 0) + (tone === 'bad' ? -6 * p : 0);
      var r2 = 98 + (tone === 'good' ? 12 * p : 0);
      car(ctx, r1, 57, C.red, C.redD, TRACK_PX_PER_M);
      car(ctx, r2, 73, C.blue, C.blueD, TRACK_PX_PER_M);
      var px = tone === 'good' ? 18 + 56 * p : (tone === 'bad' ? 66 - 34 * p : 26 + 4 * Math.sin(p * 3));
      if (tone === 'crash') {
        car(ctx, 50 + 12 * p, 64, C.gold, C.goldD, TRACK_PX_PER_M, p * 2.2);
        ctx.globalAlpha = Math.max(0, 0.6 - p * 0.6);
        rect(ctx, 50, 56, 36, 18, C.red);
        ctx.globalAlpha = 1;
      } else {
        car(ctx, px, 65, C.gold, C.goldD, TRACK_PX_PER_M);
      }
      if (tone !== 'bad' && tone !== 'crash') {
        for (var i = 0; i < 4; i++) {
          var sx = 12 + ((i * 23 + p * 44) % 136);
          rect(ctx, sx, 62 + (i % 3) * 6, 6, 1, 'rgba(242,193,78,.35)');
        }
      }
      if (tone !== 'crash') {
        var lx = Math.round(px + carW / 2 - 3);
        rect(ctx, lx, 61, 6, 1, C.gold);
        rect(ctx, lx + 2, 62, 2, 1, C.gold);
      }
    } else if (type === 'garage') {
      car(ctx, 40, floorY + 1 - carH, C.gold, C.goldD, PX_PER_M);
      var mx = 24 + (tone === 'good' ? Math.round(3 * p) : (tone === 'bad' ? Math.round(-4 * p) : 0));
      person(ctx, mx, floorY + 1 - PERSON_H, C.blue, '#1e2533');
      var sx = 64 + Math.sin(st.t * 9) * 2;
      if (tone === 'good') {
        rect(ctx, sx, 62, 1, 1, C.white);
        rect(ctx, sx + 2, 64, 1, 1, C.amber);
        rect(ctx, sx - 2, 65, 1, 1, C.white);
      }
      if (tone === 'bad') {
        rect(ctx, 64, 70, 3, 2, C.red);
        rect(ctx, 68, 72, 2, 1, C.redD);
      }
    } else if (type === 'home') {
      person(ctx, 52, floorY - PERSON_H, C.gold, '#2a2f3a');
      var gap = tone === 'good' ? 12 - 4 * p : (tone === 'bad' ? 14 + 10 * p : 12);
      person(ctx, 52 + gap, floorY - PERSON_H, '#7d8ea6', '#2a2f3a');
      person(ctx, 60 + gap, floorY - PERSON_H, '#8f7da6', '#2a2f3a');
      if (tone === 'bad') rect(ctx, 52, floorY - PERSON_H - 4, 5, 1, C.red);
    } else if (type === 'street') {
      var pcx = tone === 'good' ? 18 + 42 * p : 18;
      var copX = 92 - (tone === 'bad' ? 14 * p : 0);
      car(ctx, pcx, 67 - carH, tone === 'bad' ? C.blue : C.gold, C.goldD, PX_PER_M);
      car(ctx, copX, 82 - carH, '#4c5a73', '#2a3446', PX_PER_M);
      if (tone === 'bad') {
        var f = Math.floor(st.t * 6) % 2;
        rect(ctx, copX + 24, 82 - carH - 2, 4, 2, f ? C.red : C.blue);
        rect(ctx, copX + 28, 82 - carH - 2, 4, 2, f ? C.blue : C.red);
        ctx.globalAlpha = 0.10 + 0.06 * f;
        rect(ctx, copX + 16, 82 - carH - 6, 24, 14, f ? C.red : C.blue);
        ctx.globalAlpha = 1;
      }
      person(ctx, 134, 52 - PERSON_H, '#5b6d87', '#1a2130');
    } else if (type === 'exam') {
      car(ctx, tone === 'good' ? 12 + 44 * p : 12, 81 - carH, C.gold, C.goldD, PX_PER_M);
      person(ctx, 24, 52 - PERSON_H, '#4d617a', '#1e2736');
      rect(ctx, 29, 43, 3, 4, C.white);
      if (tone === 'bad') {
        rect(ctx, 24, 52 - PERSON_H - 4, 5, 1, C.red);
        rect(ctx, 26, 52 - PERSON_H - 6, 1, 5, C.red);
      }
    } else if (type === 'money') {
      var grow = tone === 'good' ? p : (tone === 'bad' ? 1 - p * 0.8 : 0.5);
      var bills = Math.max(1, Math.round(grow * 5));
      for (var k = 0; k < bills; k++) {
        rect(ctx, 81, 63 - k, 3, 1, k % 2 ? C.green : '#3f7d5d');
        if (k < bills - 1) rect(ctx, 85, 63 - k, 3, 1, k % 2 ? '#3f7d5d' : C.green);
      }
      var step = tone === 'good' ? Math.round(3 * p) : (tone === 'bad' ? Math.round(-4 * p) : 0);
      person(ctx, 54 + step, floorY - PERSON_H, C.gold, '#2a2f3a');
      person(ctx, 102 - step, floorY - PERSON_H, '#4d617a', '#1a2130');
    } else if (type === 'hospital') {
      var vx = 80 + (tone === 'bad' ? Math.round(6 * p) : Math.round(-3 * p));
      person(ctx, vx, floorY - PERSON_H, '#dfe6ef', '#2f3a4a');
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
