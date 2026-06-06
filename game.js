/* global Phaser */

// ─── Constants ────────────────────────────────────────────────────────────────

var STARTING_BUDGET = 50000;
var COFFEE_COST = 500;
var COFFEE_ROI_BOOST = 0.03;   // +3 percentage-points per purchase
var ROI_INITIAL = 0.02;        // 2 % per second at game start
var ROI_DECAY_PER_SEC = 0.001; // rate at which ROI falls every second
var ROI_MAX = 0.08;            // 8 % per second ceiling
var ROI_MIN = -0.05;           // −5 % per second floor
var TICK_MS = 200;             // simulation update interval (ms)
var HISTORY_MAX = 120;         // number of data-points kept for the chart

// ─── Main Scene ───────────────────────────────────────────────────────────────

var GameScene = new Phaser.Class({
  Extends: Phaser.Scene,

  initialize: function GameScene() {
    Phaser.Scene.call(this, { key: 'GameScene' });
  },

  // ── lifecycle ──────────────────────────────────────────────────────────────

  create: function () {
    this.resetState();
    this.buildUI();
    this.startLoop();
  },

  // ── state ──────────────────────────────────────────────────────────────────

  resetState: function () {
    this.budget = STARTING_BUDGET;
    this.roi = ROI_INITIAL;
    this.elapsed = 0;
    this.lastHistorySec = 0;
    this.history = [STARTING_BUDGET];
    this.coffeesCount = 0;
    this.over = false;
  },

  // ── UI construction ────────────────────────────────────────────────────────

  buildUI: function () {
    var W = this.scale.width;
    var H = this.scale.height;

    // Title ----------------------------------------------------------------
    this.add.text(W / 2, 28, 'OPTIMAL', {
      fontSize: '26px',
      fontFamily: 'monospace',
      color: '#7ecfff',
      fontStyle: 'bold'
    }).setOrigin(0.5);

    this.add.text(W / 2, 56, 'Startup Clicker  —  find market fit before the money runs out', {
      fontSize: '12px',
      fontFamily: 'monospace',
      color: '#445566'
    }).setOrigin(0.5);

    // Stat labels ----------------------------------------------------------
    this.budgetText = this.add.text(24, 90, '', {
      fontSize: '17px',
      fontFamily: 'monospace',
      color: '#00ff88'
    });

    this.roiText = this.add.text(24, 116, '', {
      fontSize: '17px',
      fontFamily: 'monospace',
      color: '#ffaa00'
    });

    this.timeText = this.add.text(24, 142, '', {
      fontSize: '15px',
      fontFamily: 'monospace',
      color: '#9999bb'
    });

    this.coffeeCountText = this.add.text(24, 165, '', {
      fontSize: '13px',
      fontFamily: 'monospace',
      color: '#887755'
    });

    // Coffee button --------------------------------------------------------
    this.coffeeBtn = this.add.rectangle(W / 2, 234, 260, 56, 0x3a2010)
      .setInteractive({ useHandCursor: true })
      .on('pointerdown', this.buyCoffee, this)
      .on('pointerover', function () { this.coffeeBtn.setFillStyle(0x5a3820); }, this)
      .on('pointerout', function () { this.coffeeBtn.setFillStyle(0x3a2010); }, this);

    this.coffeeBtnLabel = this.add.text(W / 2, 234,
      '\u2615  Buy Coffee  \u2212$' + COFFEE_COST.toLocaleString(), {
        fontSize: '18px',
        fontFamily: 'monospace',
        color: '#ffdd88'
      }).setOrigin(0.5);

    this.add.text(W / 2, 266,
      'Boosts team productivity  |  [Space] shortcut', {
        fontSize: '11px',
        fontFamily: 'monospace',
        color: '#665544'
      }).setOrigin(0.5);

    // Chart ----------------------------------------------------------------
    this.add.text(24, 296, 'Budget History', {
      fontSize: '13px',
      fontFamily: 'monospace',
      color: '#445566'
    });

    this.chartGfx = this.add.graphics();

    // Game-over overlay (hidden until triggered) ---------------------------
    this.overlayBg = this.add.rectangle(W / 2, H / 2, W, H, 0x000000, 0.82)
      .setDepth(10)
      .setVisible(false);

    this.overlayTitle = this.add.text(W / 2, H / 2 - 80, 'STARTUP FAILED', {
      fontSize: '34px',
      fontFamily: 'monospace',
      color: '#ff4444',
      fontStyle: 'bold'
    }).setOrigin(0.5).setDepth(11).setVisible(false);

    this.overlayMsg = this.add.text(W / 2, H / 2 - 28, '', {
      fontSize: '15px',
      fontFamily: 'monospace',
      color: '#cccccc',
      align: 'center'
    }).setOrigin(0.5).setDepth(11).setVisible(false);

    this.restartBtn = this.add.rectangle(W / 2, H / 2 + 52, 200, 48, 0x1a3a1a)
      .setInteractive({ useHandCursor: true })
      .setDepth(11)
      .setVisible(false)
      .on('pointerdown', this.restartGame, this)
      .on('pointerover', function () { this.restartBtn.setFillStyle(0x2a5a2a); }, this)
      .on('pointerout', function () { this.restartBtn.setFillStyle(0x1a3a1a); }, this);

    this.restartLabel = this.add.text(W / 2, H / 2 + 52, '\u25b6  Try Again', {
      fontSize: '18px',
      fontFamily: 'monospace',
      color: '#88ff88'
    }).setOrigin(0.5).setDepth(12).setVisible(false);

    // Keyboard shortcut ----------------------------------------------------
    this.input.keyboard.on('keydown-SPACE', this.buyCoffee, this);

    this.updateUI();
    this.drawChart();
  },

  // ── simulation loop ────────────────────────────────────────────────────────

  startLoop: function () {
    if (this.gameTimer) {
      this.gameTimer.remove();
    }
    this.gameTimer = this.time.addEvent({
      delay: TICK_MS,
      callback: this.gameTick,
      callbackScope: this,
      loop: true
    });
  },

  gameTick: function () {
    if (this.over) { return; }

    var dt = TICK_MS / 1000;

    // Decay ROI each tick
    this.roi = Math.max(ROI_MIN, this.roi - ROI_DECAY_PER_SEC * dt);

    // Update budget based on current ROI
    this.budget += this.budget * this.roi * dt;

    // Advance clock
    this.elapsed += dt;

    // Record one history point per second
    var nowSec = Math.floor(this.elapsed);
    if (nowSec > this.lastHistorySec) {
      this.lastHistorySec = nowSec;
      this.history.push(this.budget);
      if (this.history.length > HISTORY_MAX) {
        this.history.shift();
      }
    }

    // Check failure condition
    if (this.budget <= 0) {
      this.budget = 0;
      this.over = true;
      this.showGameOver();
    }

    this.updateUI();
    this.drawChart();
  },

  // ── actions ────────────────────────────────────────────────────────────────

  buyCoffee: function () {
    if (this.over) { return; }
    if (this.budget < COFFEE_COST) { return; }

    this.budget -= COFFEE_COST;
    this.roi = Math.min(ROI_MAX, this.roi + COFFEE_ROI_BOOST);
    this.coffeesCount += 1;

    this.updateUI();
  },

  // ── display helpers ────────────────────────────────────────────────────────

  updateUI: function () {
    var sign = this.roi >= 0 ? '+' : '';
    var roiColor = this.roi >= 0 ? '#00ff88' : '#ff4444';
    var roiPct = (this.roi * 100).toFixed(1);

    this.budgetText.setText('Budget:  $' + Math.floor(this.budget).toLocaleString());
    this.roiText.setText('ROI:     ' + sign + roiPct + ' %/s').setColor(roiColor);
    this.timeText.setText('Time:    ' + Math.floor(this.elapsed) + 's');
    this.coffeeCountText.setText('Coffees: ' + this.coffeesCount);
  },

  drawChart: function () {
    this.chartGfx.clear();

    var cx = 24;
    var cy = 316;
    var cw = this.scale.width - 48;
    var ch = this.scale.height - cy - 16;
    var pts = this.history;

    // Chart background
    this.chartGfx.fillStyle(0x080810);
    this.chartGfx.fillRect(cx, cy, cw, ch);
    this.chartGfx.lineStyle(1, 0x1e2d3d);
    this.chartGfx.strokeRect(cx, cy, cw, ch);

    if (pts.length < 2) { return; }

    var maxVal = STARTING_BUDGET;
    var minVal = 0;
    var i;

    for (i = 0; i < pts.length; i++) {
      if (pts[i] > maxVal) { maxVal = pts[i]; }
      if (pts[i] < minVal) { minVal = pts[i]; }
    }

    var range = maxVal - minVal;
    if (range === 0) { range = 1; }

    // Horizontal zero-line
    var zeroY = cy + ch - ((-minVal) / range) * ch;
    this.chartGfx.lineStyle(1, 0x2a3a4a);
    this.chartGfx.beginPath();
    this.chartGfx.moveTo(cx, zeroY);
    this.chartGfx.lineTo(cx + cw, zeroY);
    this.chartGfx.strokePath();

    // Budget curve (green while healthy, red while declining)
    var healthy = this.budget > STARTING_BUDGET * 0.4;
    var lineColor = healthy ? 0x00dd77 : 0xff5533;
    this.chartGfx.lineStyle(2, lineColor);
    this.chartGfx.beginPath();

    for (i = 0; i < pts.length; i++) {
      var x = cx + (i / (pts.length - 1)) * cw;
      var y = cy + ch - ((pts[i] - minVal) / range) * ch;
      if (i === 0) {
        this.chartGfx.moveTo(x, y);
      } else {
        this.chartGfx.lineTo(x, y);
      }
    }

    this.chartGfx.strokePath();

    // Current value label on the right edge
    var lastX = cx + cw + 4;
    var lastY = cy + ch - ((pts[pts.length - 1] - minVal) / range) * ch;
    this.chartGfx.fillStyle(lineColor);
    this.chartGfx.fillCircle(cx + cw, lastY, 4);
    // label kept as UI text to avoid per-frame text object churn
  },

  // ── game-over / restart ────────────────────────────────────────────────────

  showGameOver: function () {
    var msg = 'The startup ran out of budget after ' +
      Math.floor(this.elapsed) + ' seconds.\n' +
      'The team really needed that coffee...\n' +
      'Coffees bought: ' + this.coffeesCount;

    this.overlayBg.setVisible(true);
    this.overlayTitle.setVisible(true);
    this.overlayMsg.setText(msg).setVisible(true);
    this.restartBtn.setVisible(true);
    this.restartLabel.setVisible(true);
  },

  restartGame: function () {
    this.overlayBg.setVisible(false);
    this.overlayTitle.setVisible(false);
    this.overlayMsg.setVisible(false);
    this.restartBtn.setVisible(false);
    this.restartLabel.setVisible(false);

    this.resetState();
    this.updateUI();
    this.drawChart();
    this.startLoop();
  }
});

// ─── Phaser config ────────────────────────────────────────────────────────────

// eslint-disable-next-line no-unused-vars
var game = new Phaser.Game({
  type: Phaser.AUTO,
  width: 800,
  height: 560,
  backgroundColor: '#0d0d1a',
  scene: GameScene,
  parent: document.body,
  scale: {
    mode: Phaser.Scale.FIT,
    autoCenter: Phaser.Scale.CENTER_BOTH
  }
});
