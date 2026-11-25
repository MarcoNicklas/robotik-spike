(() => {
  'use strict';

  const matBounds = { x: 20, y: 30, width: 600, height: 850 };
  const matGrid = { x: 32.5, y: 50.5, width: 535, height: 749 };
  const colors = {
    ink: '#15243b',
    muted: '#495d71',
    route: '#087768',
    reverse: '#284aab',
    start: '#065b4f',
    load: '#9a4b13',
    turn: '#284aab',
    target: '#543889',
  };
  const marks = [
    ['A', 1.5, 7.5],
    ['B', 1.5, 5.75],
    ['C', 1.5, 4],
    ['D', 1.5, 2.25],
    ['E', 1.5, 0.5],
  ];
  const goals = [
    ['R3', 2.375, 2.25, 'below'],
    ['L2', 0.625, 4, 'farther'],
    ['L1', 1.0625, 4, 'below'],
    ['R1', 1.9375, 4, 'below'],
    ['R2', 2.375, 4, 'farther'],
    ['L3', 1.0625, 5.75, 'below'],
  ];

  function point(x, y) {
    // The task data places E and A seven units apart. Their field centers are six cells apart.
    const cellSize = matGrid.width / 5;
    const taskUnit = 6 * cellSize / 7;
    const redCenterX = matBounds.x + matGrid.x + 1.5 * cellSize;
    const redCenterY = matBounds.y + matGrid.y + 0.5 * cellSize;
    return [redCenterX + (x - 1.5) * taskUnit, redCenterY + (y - 0.5) * taskUnit];
  }

  function label(ctx, text, x, y, options = {}) {
    const { color = colors.ink, size = 14, weight = 700, align = 'center', family = 'system-ui, sans-serif' } = options;
    ctx.fillStyle = color;
    ctx.font = `${weight} ${size}px ${family}`;
    ctx.textAlign = align;
    ctx.textBaseline = 'middle';
    ctx.fillText(text, x, y);
  }

  function stroke(ctx, points, color, width = 1) {
    ctx.beginPath();
    ctx.moveTo(...points[0]);
    for (const vertex of points.slice(1)) ctx.lineTo(...vertex);
    ctx.strokeStyle = color;
    ctx.lineWidth = width;
    ctx.stroke();
  }

  function drawMat(ctx, canvas) {
    ctx.fillStyle = '#eef2f5';
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    const { x, y, width, height } = matBounds;
    const floor = ctx.createLinearGradient(x, y, x + width, y + height);
    floor.addColorStop(0, '#bcbdbd');
    floor.addColorStop(0.48, '#a8a9a9');
    floor.addColorStop(1, '#b7b8b8');
    ctx.fillStyle = floor;
    ctx.fillRect(x, y, width, height);

    ctx.save();
    ctx.beginPath();
    ctx.rect(x, y, width, height);
    ctx.clip();
    // One grid square is 100 drawing units. The surrounding print extends past the grid.
    ctx.translate(x + matGrid.x, y + matGrid.y);
    ctx.scale(matGrid.width / 500, matGrid.height / 700);

    drawMatEdge(ctx);
    drawMatGrid(ctx);
    drawMatBay(ctx, 100, 0, '#c73f40', '#852347', '#ae4571', false);
    drawMatBay(ctx, 500, 200, '#234b91', '#3882a0', '#6fbdd8', true);
    drawMatGuideLines(ctx);
    drawMatStorage(ctx, 300, 200);
    drawMatStorage(ctx, 100, 300);
    drawMatConveyor(ctx);
    drawMatShelves(ctx);
    drawMatPanels(ctx);
    drawMatLooseCartons(ctx);
    drawMatRobotArm(ctx, 76, 340, 27, 320);
    drawMatRobotArm(ctx, 284, 582, 298, 638);
    drawMatMeasure(ctx);
    drawMatStart(ctx);
    ctx.restore();
  }

  function drawMatEdge(ctx) {
    ctx.fillStyle = '#383a3b';
    ctx.fillRect(-22, -15, 122, 13);
    ctx.fillRect(201, -15, 316, 13);
    ctx.fillRect(503, -15, 14, 213);
    ctx.fillRect(503, 301, 14, 453);

    ctx.strokeStyle = '#656667';
    ctx.lineWidth = 1.6;
    ctx.strokeRect(-22, -15, 122, 13);
    ctx.strokeRect(201, -15, 316, 13);
    ctx.strokeRect(503, -2, 14, 200);
    ctx.strokeRect(503, 301, 14, 453);

    ctx.fillStyle = '#f0f0ed';
    ctx.fillRect(27, -2, 48, 4);
    ctx.fillRect(498, 124, 4, 48);
    ctx.strokeStyle = '#454648';
    ctx.lineWidth = 1;
    ctx.strokeRect(27, -2, 48, 4);
    ctx.strokeRect(498, 124, 4, 48);
  }

  function drawMatGrid(ctx) {
    ctx.beginPath();
    for (let column = 0; column <= 5; column += 1) {
      ctx.moveTo(column * 100, 0);
      ctx.lineTo(column * 100, 700);
    }
    for (let row = 0; row <= 7; row += 1) {
      ctx.moveTo(0, row * 100);
      ctx.lineTo(500, row * 100);
    }
    ctx.strokeStyle = '#f4f4f1';
    ctx.lineWidth = 1.15;
    ctx.stroke();
  }

  function drawMatBay(ctx, x, y, bayColor, truckColor, truckHighlight, facesLeft) {
    ctx.save();
    ctx.translate(x + (facesLeft ? 0 : 50), y + (facesLeft ? 50 : 0));
    if (facesLeft) ctx.rotate(Math.PI / 2);

    ctx.fillStyle = bayColor;
    ctx.fillRect(-48, 2, 96, 96);

    ctx.fillStyle = '#202325';
    ctx.fillRect(-42, -44, 9, 40);
    ctx.fillRect(33, -44, 9, 40);
    ctx.fillStyle = '#5a5a58';
    ctx.fillRect(-38, -33, 76, 73);

    const loadingDeck = ctx.createLinearGradient(0, 7, 0, 41);
    loadingDeck.addColorStop(0, '#7b7b79');
    loadingDeck.addColorStop(0.7, '#989996');
    loadingDeck.addColorStop(1, '#b3b5b2');
    ctx.fillStyle = loadingDeck;
    ctx.fillRect(-37, 11, 74, 29);
    ctx.fillStyle = '#646663';
    ctx.fillRect(-33, 34, 5, 4);
    ctx.fillRect(28, 34, 5, 4);

    const truckRoof = ctx.createLinearGradient(0, -47, 0, 12);
    truckRoof.addColorStop(0, truckHighlight);
    truckRoof.addColorStop(1, truckColor);
    ctx.fillStyle = truckRoof;
    ctx.fillRect(-38, -49, 76, 61);
    ctx.strokeStyle = truckColor;
    ctx.lineWidth = 2.5;
    ctx.strokeRect(-35, -46, 70, 55);
    ctx.restore();
  }

  function drawMatStorage(ctx, x, y) {
    ctx.save();
    ctx.translate(x, y);
    ctx.beginPath();
    const corners = [[7, 7, 21, 21], [93, 7, -21, 21], [93, 93, -21, -21], [7, 93, 21, -21]];
    for (const [cornerX, cornerY, dx, dy] of corners) {
      ctx.moveTo(cornerX, cornerY + dy);
      ctx.lineTo(cornerX, cornerY);
      ctx.lineTo(cornerX + dx, cornerY);
    }
    for (const [x1, y1, x2, y2] of [[38, 7, 62, 7], [93, 38, 93, 62], [38, 93, 62, 93], [7, 38, 7, 62]]) {
      ctx.moveTo(x1, y1);
      ctx.lineTo(x2, y2);
    }
    ctx.strokeStyle = '#f5c43c';
    ctx.lineWidth = 7;
    ctx.stroke();
    ctx.fillStyle = '#f7ca43';
    ctx.translate(20, 15);
    ctx.rotate(Math.PI / 2);
    ctx.font = '700 9px system-ui, sans-serif';
    ctx.textBaseline = 'middle';
    ctx.textAlign = 'left';
    ctx.fillText('Lagerplatz', 0, 0);
    ctx.restore();
  }

  function drawMatGuideLines(ctx) {
    ctx.beginPath();
    ctx.moveTo(59, 340);
    ctx.lineTo(281, 340);
    ctx.lineTo(281, 577);
    ctx.moveTo(224, 340);
    ctx.lineTo(224, 750);
    ctx.lineWidth = 11;
    ctx.strokeStyle = '#969795';
    ctx.stroke();
    ctx.lineWidth = 9;
    ctx.strokeStyle = '#edeeeb';
    ctx.stroke();
  }

  function drawMatConveyor(ctx) {
    ctx.save();
    ctx.beginPath();
    ctx.moveTo(24, 300);
    ctx.lineTo(24, 630);
    ctx.lineTo(47, 653);
    ctx.lineTo(386, 653);
    ctx.lineTo(402, 669);
    ctx.lineTo(402, 756);
    ctx.lineJoin = 'bevel';
    ctx.lineWidth = 50;
    ctx.strokeStyle = '#303034';
    ctx.stroke();
    ctx.lineWidth = 42;
    ctx.strokeStyle = '#d3d3d0';
    ctx.stroke();

    for (const [x, y] of [[0, 302], [47, 302], [0, 624], [47, 624], [51, 678], [202, 629], [202, 678], [375, 628], [378, 679], [428, 679]]) {
      ctx.fillStyle = '#4b4540';
      ctx.fillRect(x - 3.5, y - 2.5, 7, 5);
      ctx.fillStyle = '#e7b945';
      ctx.fillRect(x - 2.5, y - 1.5, 5, 3);
    }

    const cartons = [
      [23, 361, 13, 14, 90], [23, 383, 13, 14, 90],
      [21, 446, 30, 22, 90], [22, 489, 31, 22, 90],
      [22, 556, 22, 17, 90], [20, 582, 14, 14, 90], [21, 609, 20, 20, 90],
      [22, 642, 15, 15, 57], [46, 653, 25, 14], [72, 653, 18, 21],
      [211, 650, 17, 21], [242, 652, 18, 20], [347, 648, 19, 20],
      [393, 655, 20, 20, -45], [406, 684, 20, 19, 90], [405, 734, 21, 20, 90]
    ];
    drawMatCartons(ctx, cartons);
    ctx.restore();
  }

  function drawMatShelves(ctx) {
    drawMatRack(ctx, 201, 1, 98, 48, true, [
      [10, 16, 14, 19, 90], [33, 14, 21, 18, 90], [54, 26, 12, 40, 90],
      [70, 12, 12, 19, 90], [70, 35, 12, 19, 90], [86, 15, 13, 21, 90]
    ]);
    drawMatRack(ctx, 301, 1, 98, 48, true, [
      [10, 14, 14, 17, 90], [29, 13, 20, 19, 90], [29, 36, 21, 19, 90],
      [68, 11, 13, 16, 90], [68, 24, 13, 11, 90],
      [86, 13, 13, 19, 90], [86, 36, 13, 18, 90]
    ]);
    drawMatRack(ctx, 1, 101, 98, 98, false, [
      [38, 28, 19, 15], [38, 46, 20, 17], [13, 69, 20, 12], [36, 69, 24, 12],
      [36, 86, 22, 11], [63, 12, 17, 19], [85, 12, 22, 19],
      [63, 35, 13, 17], [77, 35, 13, 17], [66, 57, 23, 17], [88, 57, 15, 16],
      [64, 81, 18, 21], [85, 81, 22, 19]
    ]);
    drawMatRack(ctx, 1, 201, 98, 98, false, [
      [10, 11, 21, 13], [27, 11, 10, 13], [40, 11, 14, 13],
      [23, 54, 43, 14], [40, 68, 10, 10], [36, 86, 22, 12],
      [63, 13, 19, 19], [59, 36, 17, 17], [78, 36, 18, 17],
      [92, 36, 10, 17], [63, 83, 18, 21], [84, 83, 22, 21]
    ]);
    drawMatRack(ctx, 301, 401, 98, 98, false, [
      [13, 12, 23, 18], [36, 12, 17, 18], [24, 36, 13, 21], [38, 36, 12, 21],
      [34, 60, 23, 23], [13, 84, 22, 20], [35, 84, 18, 20],
      [62, 10, 19, 13], [83, 10, 20, 13], [57, 27, 9, 12], [73, 46, 43, 12],
      [63, 65, 20, 20], [61, 87, 17, 13], [82, 87, 23, 13]
    ]);
    drawMatRack(ctx, 301, 501, 98, 98, false, [
      [34, 38, 23, 19], [11, 60, 15, 19], [26, 60, 13, 19], [40, 60, 13, 19],
      [15, 84, 24, 20], [37, 84, 17, 20], [62, 10, 19, 13],
      [56, 27, 11, 12], [68, 27, 14, 12], [63, 48, 22, 20], [84, 48, 20, 20],
      [60, 70, 19, 13], [78, 70, 11, 13], [90, 70, 12, 13]
    ]);
    drawMatRack(ctx, 450, 401, 49, 98, false, [
      [10, 11, 18, 13], [24, 11, 9, 13], [37, 11, 14, 13],
      [22, 70, 15, 13], [36, 70, 11, 13], [8, 88, 15, 13], [28, 88, 23, 13]
    ]);
  }

  function drawMatRack(ctx, x, y, width, height, horizontal, cartons) {
    ctx.save();
    ctx.translate(x, y);
    ctx.fillStyle = '#313234';
    ctx.fillRect(0, 0, width, height);
    ctx.fillStyle = '#9a9a98';
    if (horizontal) {
      for (let position = 4; position < height; position += 4) {
        ctx.fillRect(1, position, width - 2, 1.5);
      }
    } else {
      for (let position = 4; position < width; position += 4) {
        ctx.fillRect(position, 1, 1.5, height - 2);
      }
    }

    ctx.strokeStyle = '#d1d1cd';
    ctx.lineWidth = 1.3;
    ctx.strokeRect(0, 0, width, height);
    ctx.strokeRect(3, 3, width - 6, height - 6);
    if (!horizontal && width > 50) ctx.strokeRect(48, 1, 3, height - 2);
    drawMatCartons(ctx, cartons);
    ctx.restore();
  }

  function drawMatCartons(ctx, cartons) {
    for (const [x, y, width, height, angle = 0] of cartons) {
      ctx.save();
      ctx.translate(x, y);
      ctx.rotate(angle * Math.PI / 180);
      ctx.fillStyle = '#5d432d';
      ctx.fillRect(-width / 2 + 0.7, -height / 2 + 0.8, width, height);
      ctx.fillStyle = '#9d6b41';
      ctx.fillRect(-width / 2, -height / 2, width, height);
      ctx.fillStyle = '#a97a4f';
      ctx.fillRect(-width / 2, -height / 2, width, height * 0.48);
      ctx.fillStyle = '#efd29f';
      ctx.fillRect(-width / 2, -height * 0.08, width, Math.max(1.4, height * 0.16));
      ctx.restore();
    }
  }

  function drawMatPanels(ctx) {
    for (const [x, y, width, height] of [[36, 35, 27, 27], [240, 435, 26, 27], [439, 7, 57, 89]]) {
      ctx.fillStyle = '#9a9c9b';
      ctx.fillRect(x, y, width, height);
      ctx.strokeStyle = '#505254';
      ctx.lineWidth = 2.2;
      ctx.strokeRect(x, y, width, height);
      ctx.fillStyle = '#55575a';
      ctx.fillRect(x + width / 2 - 5, y + 4, 10, 1);
      ctx.fillRect(x + width / 2 - 5, y + height - 5, 10, 1);
    }

    ctx.save();
    ctx.translate(470, 51);
    ctx.rotate(Math.PI / 2);
    ctx.fillStyle = '#f8f8f5';
    ctx.fillRect(-23, -8, 46, 14);
    ctx.fillStyle = '#66696b';
    ctx.font = '9px system-ui, sans-serif';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText('Christiani', 0, -1);
    ctx.restore();
  }

  function drawMatLooseCartons(ctx) {
    drawMatCartons(ctx, [
      [21, 27, 19, 14], [36, 19, 17, 16, 90], [39, 36, 21, 13], [26, 37, 14, 13, 58],
      [12, 51, 17, 14], [36, 52, 15, 13, 54], [64, 62, 16, 13], [12, 66, 18, 19, 90],
      [417, 40, 26, 19], [422, 61, 16, 13], [441, 62, 16, 14, 22],
      [402, 72, 22, 20, 13], [426, 81, 20, 19],
      [158, 323, 15, 13, -30], [179, 324, 18, 13, -29], [166, 333, 15, 10, 17],
      [451, 382, 23, 18, -38], [471, 373, 13, 14, 90], [471, 390, 15, 13, 30],
      [263, 515, 20, 19, 90], [254, 538, 22, 19, 17]
    ]);
  }

  function drawMatRobotArm(ctx, x, y, clawX, clawY) {
    ctx.fillStyle = '#e8e8e2';
    ctx.fillRect(x - 17, y - 17, 34, 34);
    ctx.strokeStyle = '#686965';
    ctx.lineWidth = 0.9;
    ctx.strokeRect(x - 17, y - 17, 34, 34);
    ctx.beginPath();
    ctx.arc(x, y, 15, 0, 2 * Math.PI);
    ctx.fillStyle = '#2d2c2c';
    ctx.fill();
    ctx.strokeStyle = '#eab53c';
    ctx.lineWidth = 2;
    ctx.stroke();

    ctx.save();
    ctx.translate(x, y);
    ctx.rotate(Math.atan2(clawY - y, clawX - x));
    const armLength = Math.hypot(clawY - y, clawX - x);
    ctx.fillStyle = '#edbd42';
    ctx.fillRect(-11, -7, 15, 14);
    ctx.fillStyle = '#8b6b25';
    ctx.fillRect(-7, -6, armLength - 6, 12);
    ctx.fillStyle = '#f6c643';
    ctx.fillRect(-7, -5, armLength - 13, 10);
    ctx.fillRect(armLength - 19, -6, 15, 12);
    ctx.strokeStyle = '#e3b34a';
    ctx.lineWidth = 2;
    ctx.strokeRect(armLength - 13, -8, 14, 16);
    ctx.restore();

    drawMatCartons(ctx, [[clawX, clawY, 17, 17, -18]]);
  }

  function drawMatMeasure(ctx) {
    ctx.save();
    ctx.beginPath();
    ctx.rect(450, 500, 50, 200);
    ctx.clip();
    ctx.fillStyle = '#151616';
    ctx.fillRect(450, 500, 50, 200);
    ctx.strokeStyle = '#efbc30';
    ctx.lineWidth = 13;
    for (let y = 480; y < 700; y += 34) {
      ctx.beginPath();
      ctx.moveTo(445, y);
      ctx.lineTo(505, y + 63);
      ctx.stroke();
    }

    ctx.strokeStyle = '#fffdf5';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(471, 502);
    ctx.lineTo(471, 698);
    for (let step = 0; step <= 6; step += 1) {
      const y = 502 + step * 196 / 6;
      const halfTick = step % 3 === 0 ? 15 : 9;
      ctx.moveTo(471 - halfTick, y);
      ctx.lineTo(471 + halfTick, y);
    }
    ctx.stroke();

    ctx.fillStyle = '#fffdf5';
    ctx.font = '700 9px system-ui, sans-serif';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    for (const [y, text] of [[506, '0'], [600, '15 cm'], [691, '30']]) {
      ctx.save();
      ctx.translate(490, y);
      ctx.rotate(Math.PI / 2);
      ctx.fillText(text, 0, 0);
      ctx.restore();
    }
    ctx.restore();
  }

  function drawMatStart(ctx) {
    ctx.fillStyle = '#77787a';
    ctx.fillRect(101, 601, 98, 98);

    ctx.beginPath();
    ctx.moveTo(150, 603);
    ctx.lineTo(184, 638);
    ctx.lineTo(184, 663);
    ctx.lineTo(160, 641);
    ctx.lineTo(160, 698);
    ctx.lineTo(140, 698);
    ctx.lineTo(140, 641);
    ctx.lineTo(116, 663);
    ctx.lineTo(116, 638);
    ctx.closePath();
    ctx.fillStyle = '#fffefa';
    ctx.fill();

    ctx.save();
    ctx.translate(150, 666);
    ctx.rotate(Math.PI / 2);
    ctx.fillStyle = '#d2a32e';
    ctx.font = '900 15px system-ui, sans-serif';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText('START', 0, 0, 58);
    ctx.restore();
  }

  function arrow(ctx, x, y, heading, color) {
    ctx.save();
    ctx.translate(x, y);
    ctx.rotate(heading * Math.PI / 180);
    ctx.beginPath();
    ctx.moveTo(0, -10);
    ctx.lineTo(9, 6);
    ctx.lineTo(-9, 6);
    ctx.closePath();
    ctx.fillStyle = color;
    ctx.strokeStyle = '#fff';
    ctx.lineWidth = 3;
    ctx.lineJoin = 'round';
    ctx.stroke();
    ctx.fill();
    ctx.restore();
  }

  function drawLeg(ctx, start, destination, heading, offset, color) {
    const [fromX, fromY] = point(...start);
    const [toX, toY] = point(...destination);
    const line = [[fromX + offset, fromY], [toX + offset, toY]];
    stroke(ctx, line, '#fff', 10);
    stroke(ctx, line, color, 5);
    arrow(ctx, fromX + (toX - fromX) * 0.5 + offset, fromY + (toY - fromY) * 0.5, heading, color);
  }

  function drawRoute(ctx, variant) {
    ctx.save();
    ctx.lineCap = 'round';
    drawLeg(ctx, variant.start, variant.load, variant.heading, -8, colors.route);
    drawLeg(ctx, variant.load, variant.turnPoint, variant.heading + 180, 8, colors.reverse);
    drawLeg(ctx, variant.turnPoint, variant.target, variant.heading + variant.turn, 0, colors.route);
    ctx.restore();
  }

  function marker(ctx, x, y, glyph, { caption, color = colors.muted, placement = 'right' } = {}) {
    const active = Boolean(caption);
    const [px, py] = point(x, y);
    ctx.beginPath();
    ctx.arc(px, py, active ? 15 : 5, 0, Math.PI * 2);
    ctx.fillStyle = color;
    ctx.fill();
    ctx.strokeStyle = '#fff';
    ctx.lineWidth = active ? 3 : 2;
    ctx.stroke();
    if (active) label(ctx, glyph, px, py, { color: '#fff', size: 15 });
    const text = caption ?? glyph;
    const textSize = active ? 15 : 13;
    ctx.font = `700 ${textSize}px system-ui, sans-serif`;
    const width = ctx.measureText(text).width + 12;
    const left = placement === 'right' ? px + (active ? 19 : 9) : px - width / 2;
    const topOffsets = { right: -10, above: -47, below: 18, farther: 42 };
    const top = py + topOffsets[placement];
    ctx.fillStyle = active ? color : '#fff';
    pill(ctx, left, top, width, 20, 5);
    ctx.fill();
    label(ctx, text, left + width / 2, top + 10, { color: active ? '#fff' : colors.muted, size: textSize });
  }

  function pill(ctx, x, y, width, height, radius) {
    ctx.beginPath();
    ctx.moveTo(x + radius, y);
    ctx.arcTo(x + width, y, x + width, y + height, radius);
    ctx.arcTo(x + width, y + height, x, y + height, radius);
    ctx.arcTo(x, y + height, x, y, radius);
    ctx.arcTo(x, y, x + width, y, radius);
    ctx.closePath();
  }

  function samePoint(x, y, coordinates) {
    return Math.abs(x - coordinates[0]) < 0.001 && Math.abs(y - coordinates[1]) < 0.001;
  }

  function drawMarkers(ctx, variant) {
    for (const [letter, x, y] of marks) {
      const isStart = samePoint(x, y, variant.start);
      if (samePoint(x, y, variant.load)) {
        marker(ctx, x, y, 'A', { caption: variant.loadLabel, color: colors.load });
      } else if (samePoint(x, y, variant.turnPoint)) {
        marker(ctx, x, y, isStart ? 'S' : letter, {
          caption: isStart ? `Start / Drehung ${letter}` : `Drehung ${letter}`,
          color: isStart ? colors.start : colors.turn,
          placement: 'above',
        });
      } else if (isStart) {
        marker(ctx, x, y, 'S', { caption: `Start ${letter}`, color: colors.start });
      } else {
        marker(ctx, x, y, letter);
      }
    }
    for (const [code, x, y, placement] of goals) {
      const active = samePoint(x, y, variant.target);
      if (active) {
        marker(ctx, x, y, 'Z', { caption: variant.targetLabel, color: colors.target, placement });
      } else {
        marker(ctx, x, y, code, { placement });
      }
    }
  }

  function drawRobot(ctx, x, y, heading) {
    ctx.save();
    ctx.translate(...point(x, y));
    ctx.rotate(heading * Math.PI / 180);
    ctx.fillStyle = colors.ink;
    for (const left of [-20, 13]) {
      pill(ctx, left, -12, 7, 28, 3);
      ctx.fill();
    }
    pill(ctx, -15, -21, 30, 43, 6);
    ctx.fillStyle = '#ffcf55';
    ctx.fill();
    ctx.strokeStyle = colors.ink;
    ctx.lineWidth = 1.8;
    ctx.stroke();
    ctx.fillStyle = '#fff8db';
    pill(ctx, -8, -1, 16, 13, 2);
    ctx.fill();
    ctx.beginPath();
    ctx.moveTo(0, -17);
    ctx.lineTo(8, -5);
    ctx.lineTo(-8, -5);
    ctx.closePath();
    ctx.fillStyle = colors.ink;
    ctx.fill();
    ctx.restore();
  }

  function makePhases(variant) {
    const { start, load, turnPoint, target } = variant;
    const turnSide = variant.turn < 0 ? 'links' : 'rechts';
    const travelTime = (from, to) => 1200 * Math.hypot(to[0] - from[0], to[1] - from[1]);
    const phases = [
      { duration: travelTime(start, load), from: start, to: load, text: `Vorwärts zu ${variant.loadLabel}` },
      { duration: variant.holdSeconds * 1000, from: load, display: variant.loadWord, text: `${variant.loadLabel} · ${variant.holdSeconds} s Stillstand` },
      { duration: travelTime(load, turnPoint), from: load, to: turnPoint, text: `Rückwärts zu ${variant.turnLabel}` },
      { duration: 950, from: turnPoint, turn: true, text: `Auf der Stelle 90° nach ${turnSide}` },
      { duration: travelTime(turnPoint, target), from: turnPoint, to: target, turned: true, text: `Vorwärts zu ${variant.targetLabel}` },
      { duration: 800, from: target, turned: true, display: variant.unloadWord, text: `${variant.targetLabel} · Signalton`, sound: { frequency: variant.tone, seconds: 0.4 } },
      { duration: 0, from: target, turned: true, display: variant.unloadWord, text: `Fertig am ${variant.targetLabel}` },
    ];
    let elapsed = 0;
    for (const phase of phases) {
      phase.start = elapsed;
      elapsed += phase.duration;
    }
    return phases;
  }

  globalThis.mountSimulation = function mountSimulation(root, variant) {
    const scope = root.matches('[data-sim-task]') ? root : root.querySelector('[data-sim-task]');
    if (!scope) return;
    const canvas = scope.querySelector('[data-sim-map]');
    const ctx = canvas.getContext('2d');
    const play = scope.querySelector('[data-sim-play]');
    const step = scope.querySelector('[data-sim-step]');
    const reset = scope.querySelector('[data-sim-reset]');
    const mute = scope.querySelector('[data-sim-mute]');
    const status = scope.querySelector('[data-sim-status]');
    const display = scope.querySelector('[data-sim-display]');
    if (!ctx) {
      status.textContent = 'Die Simulation ist in diesem Browser nicht verfügbar.';
      play.disabled = step.disabled = reset.disabled = mute.disabled = true;
      return;
    }

    const base = document.createElement('canvas');
    base.width = canvas.width;
    base.height = canvas.height;
    const baseContext = base.getContext('2d');
    drawMat(baseContext, base);
    drawRoute(baseContext, variant);
    drawMarkers(baseContext, variant);
    const phases = makePhases(variant);
    const end = phases[phases.length - 1].start;
    let elapsed = -1;
    let running = false;
    let animation = 0;
    let lastFrame = 0;
    let previousPhase;
    let audio;
    let oscillator;
    let soundGeneration = 0;

    function prepareAudio() {
      const Audio = globalThis.AudioContext || globalThis.webkitAudioContext;
      if (!Audio || mute.checked) return;
      try {
        audio ??= new Audio();
        if (audio.state !== 'running') audio.resume().catch(() => {});
      } catch {
        // Playback remains usable when browser audio is unavailable.
      }
    }

    function stopTone() {
      soundGeneration += 1;
      oscillator?.stop();
      oscillator = undefined;
    }

    function tone({ frequency, seconds }) {
      const node = audio.createOscillator();
      oscillator = node;
      const gain = audio.createGain();
      node.frequency.value = frequency;
      node.connect(gain);
      gain.connect(audio.destination);
      const now = audio.currentTime;
      gain.gain.setValueAtTime(0.0001, now);
      gain.gain.exponentialRampToValueAtTime(0.16, now + 0.02);
      gain.gain.exponentialRampToValueAtTime(0.0001, now + seconds - 0.02);
      node.onended = () => {
        node.disconnect();
        gain.disconnect();
        if (oscillator === node) oscillator = undefined;
      };
      node.start(now);
      node.stop(now + seconds);
    }

    function playPhaseSound(sound) {
      stopTone();
      if (!sound || !audio || mute.checked) return;
      const generation = soundGeneration;
      function playIfCurrent() {
        if (generation === soundGeneration && !mute.checked && scope.isConnected && audio.state === 'running') {
          tone(sound);
        }
      }
      if (audio.state === 'running') playIfCurrent();
      else audio.resume().then(playIfCurrent).catch(() => {});
    }

    function draw() {
      const phase = phases.findLast((candidate) => elapsed >= candidate.start);
      const progress = phase?.duration ? (elapsed - phase.start) / phase.duration : 0;
      const from = phase?.from ?? variant.start;
      const to = phase?.to ?? from;
      const turnProgress = phase?.turn ? progress : Number(Boolean(phase?.turned));
      const x = from[0] + (to[0] - from[0]) * progress;
      const y = from[1] + (to[1] - from[1]) * progress;
      ctx.drawImage(base, 0, 0);
      drawRobot(ctx, x, y, variant.heading + variant.turn * turnProgress);

      if (phase !== previousPhase) {
        display.textContent = phase?.display ?? '—';
        status.textContent = phase?.text ?? 'Bereit';
        previousPhase = phase;
        playPhaseSound(phase?.sound);
      }
      play.textContent = running ? 'Pausieren' : elapsed >= end ? 'Erneut abspielen' : 'Abspielen';
      step.disabled = elapsed >= end;
    }

    function pause() {
      running = false;
      if (animation) cancelAnimationFrame(animation);
      animation = 0;
      stopTone();
    }

    function frame(now) {
      if (!scope.isConnected) {
        pause();
        return;
      }
      elapsed = Math.min(end, elapsed + Math.min(now - lastFrame, 100));
      lastFrame = now;
      if (elapsed >= end) pause();
      draw();
      if (running) animation = requestAnimationFrame(frame);
    }

    play.addEventListener('click', () => {
      if (running) {
        pause();
      } else {
        prepareAudio();
        if (elapsed < 0 || elapsed >= end) elapsed = 0;
        running = true;
        lastFrame = performance.now();
        animation = requestAnimationFrame(frame);
      }
      draw();
    });

    step.addEventListener('click', () => {
      pause();
      prepareAudio();
      const next = phases.find((phase) => phase.start > elapsed);
      if (next) elapsed = next.start;
      draw();
    });

    reset.addEventListener('click', () => {
      pause();
      elapsed = -1;
      draw();
    });

    mute.addEventListener('change', () => {
      if (mute.checked) stopTone();
      else prepareAudio();
    });

    draw();
    return () => {
      pause();
      audio?.close().catch(() => {});
    };
  };
})();
