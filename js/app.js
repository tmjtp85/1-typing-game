window.TypingApp = (function () {
  var state = {
    currentScreen: 'menu',
    selectedMode: 'falling',
    selectedDifficulty: 'normal',
    currentMode: null,
    animFrameId: null,
    lastTime: 0,
    paused: false,
  };

  function showScreen(screenId) {
    document.querySelectorAll('.screen').forEach(function (el) {
      el.classList.remove('visible');
    });
    var screen = document.getElementById(screenId);
    if (screen) screen.classList.add('visible');
    state.currentScreen = screenId;
    if (screenId === 'game-screen') {
      document.getElementById('game-input').focus();
    }
  }

  function selectMode(mode) {
    document.querySelectorAll('[data-mode]').forEach(function (btn) {
      btn.classList.remove('active');
    });
    var target = document.querySelector('[data-mode="' + mode + '"]');
    if (target) target.classList.add('active');
    state.selectedMode = mode;
  }

  function selectDifficulty(diff) {
    document.querySelectorAll('[data-difficulty]').forEach(function (btn) {
      btn.classList.remove('active');
    });
    var target = document.querySelector('[data-difficulty="' + diff + '"]');
    if (target) target.classList.add('active');
    state.selectedDifficulty = diff;
  }

  function updateStats() {
    if (!state.currentMode) return;
    var stats = state.currentMode.getStats();
    document.getElementById('stat-wpm').textContent = stats.wpm || 0;
    document.getElementById('stat-cpm').textContent = stats.cpm || 0;
    document.getElementById('stat-accuracy').textContent = (stats.accuracy || 0).toFixed(1) + '%';
    document.getElementById('stat-score').textContent = stats.score || 0;
    var hearts = '';
    for (var i = 0; i < (stats.lives || 0); i++) hearts += '\u2764\uFE0F';
    document.getElementById('stat-lives').textContent = hearts || '-';
  }

  function showResults(stats) {
    document.getElementById('result-wpm').textContent = stats.wpm || 0;
    document.getElementById('result-cpm').textContent = stats.cpm || 0;
    document.getElementById('result-accuracy').textContent = (stats.accuracy || 0).toFixed(1) + '%';
    document.getElementById('result-score').textContent = stats.score || 0;
    document.getElementById('result-max-combo').textContent = 'x' + (stats.maxCombo || 0);
    var lb = window.TypingStorage.getLeaderboard(1);
    var isNewRecord = lb.length === 0 || (stats.score || 0) >= lb[0].score;
    document.getElementById('new-record').style.display = isNewRecord ? '' : 'none';
  }

  function startGame() {
    if (!state.selectedMode || !state.selectedDifficulty) {
      alert('请选择游戏模式和难度');
      return;
    }
    var modeObj = window.TypingModes[state.selectedMode];
    if (!modeObj || typeof modeObj.init !== 'function') {
      alert('模式加载失败: ' + state.selectedMode);
      return;
    }
    showScreen('game-screen');
    var gameArea = document.getElementById('game-area');
    gameArea.innerHTML = '';
    var input = document.getElementById('game-input');
    input.value = '';
    input.disabled = false;
    input.focus();
    state.currentMode = modeObj;
    state.currentMode.init(gameArea, state.selectedDifficulty);
    state.lastTime = 0;
    if (state.animFrameId) cancelAnimationFrame(state.animFrameId);
    state.animFrameId = requestAnimationFrame(gameLoop);
  }

  function gameLoop(timestamp) {
    if (state.paused) return;
    if (!state.lastTime) state.lastTime = timestamp;
    var deltaTime = (timestamp - state.lastTime) / 1000;
    if (deltaTime > 0.1) deltaTime = 0.016;
    state.lastTime = timestamp;
    try {
      state.currentMode.update(deltaTime);
      state.currentMode.render();
      updateStats();
      if (state.currentMode.isGameOver()) {
        endGame();
        return;
      }
    } catch (e) {
      console.error('Game loop error:', e);
    }
    state.animFrameId = requestAnimationFrame(gameLoop);
  }

  function pauseGame() {
    if (state.paused) return;
    state.paused = true;
    if (state.animFrameId) {
      cancelAnimationFrame(state.animFrameId);
      state.animFrameId = null;
    }
    document.getElementById('game-input').disabled = true;
    document.getElementById('pause-overlay').style.display = 'flex';
  }

  function resumeGame() {
    if (!state.paused) return;
    state.paused = false;
    document.getElementById('pause-overlay').style.display = 'none';
    var input = document.getElementById('game-input');
    input.disabled = false;
    input.focus();
    state.lastTime = 0;
    if (state.animFrameId) cancelAnimationFrame(state.animFrameId);
    state.animFrameId = requestAnimationFrame(gameLoop);
  }

  function quitGame() {
    if (state.animFrameId) {
      cancelAnimationFrame(state.animFrameId);
      state.animFrameId = null;
    }
    state.paused = false;
    document.getElementById('pause-overlay').style.display = 'none';
    document.getElementById('game-input').disabled = true;
    if (state.currentMode) {
      state.currentMode.destroy();
      state.currentMode = null;
    }
    showScreen('menu-screen');
  }

  function endGame() {
    if (state.animFrameId) {
      cancelAnimationFrame(state.animFrameId);
      state.animFrameId = null;
    }
    document.getElementById('game-input').disabled = true;
    var stats = state.currentMode.getStats();
    if (stats.completed) {
      window.TypingAudio.playComplete();
    } else {
      window.TypingAudio.playGameOver();
    }
    showResults(stats);
    window.TypingStorage.saveResult({
      date: new Date().toISOString(),
      mode: state.selectedMode,
      difficulty: state.selectedDifficulty,
      score: stats.score || 0,
      wpm: stats.wpm || 0,
      cpm: stats.cpm || 0,
      accuracy: stats.accuracy || 0,
      combo: stats.maxCombo || 0,
    });
    showScreen('result-screen');
  }

  function showLeaderboard() {
    var results = window.TypingStorage.getLeaderboard();
    var tbody = document.querySelector('#leaderboard-table tbody');
    tbody.innerHTML = '';
    if (results.length === 0) {
      var row = document.createElement('tr');
      var cell = document.createElement('td');
      cell.setAttribute('colspan', '7');
      cell.textContent = '暂无记录';
      cell.style.textAlign = 'center';
      row.appendChild(cell);
      tbody.appendChild(row);
    } else {
      results.forEach(function (r, i) {
        var row = document.createElement('tr');
        var cells = [
          (i + 1).toString(),
          new Date(r.date).toLocaleDateString(),
          ({ falling: '经典坠落', paragraph: '段落竞速', timed: '限时挑战' })[r.mode] || r.mode,
          ({ 'very-easy': '非常简单', easy: '简单', normal: '普通', hard: '困难', 'very-hard': '非常困难' })[r.difficulty] || r.difficulty,
          (r.wpm || 0).toString(),
          (r.accuracy || 0).toFixed(1) + '%',
          (r.score || 0).toString(),
        ];
        cells.forEach(function (text) {
          var cell = document.createElement('td');
          cell.textContent = text;
          row.appendChild(cell);
        });
        tbody.appendChild(row);
      });
    }
    showScreen('leaderboard-screen');
  }

  function clearLeaderboard() {
    if (confirm('确定清空所有记录吗？')) {
      window.TypingStorage.clearAll();
      showLeaderboard();
    }
  }

  function toggleAudio() {
    window.TypingAudio.setEnabled(!window.TypingAudio.isEnabled());
    var btn = document.getElementById('sound-toggle');
    if (btn) btn.textContent = window.TypingAudio.isEnabled() ? '\uD83D\uDD0A' : '\uD83D\uDD07';
  }

  function setupEventListeners() {
    document.querySelectorAll('[data-mode]').forEach(function (btn) {
      btn.addEventListener('click', function () {
        selectMode(btn.dataset.mode);
      });
    });
    document.querySelectorAll('[data-difficulty]').forEach(function (btn) {
      btn.addEventListener('click', function () {
        selectDifficulty(btn.dataset.difficulty);
      });
    });
    document.getElementById('start-btn').addEventListener('click', startGame);
    document.getElementById('replay-btn').addEventListener('click', startGame);
    document.getElementById('menu-btn').addEventListener('click', function () {
      if (state.currentMode) {
        state.currentMode.destroy();
        state.currentMode = null;
      }
      showScreen('menu-screen');
    });
    document.getElementById('lb-back-btn').addEventListener('click', function () {
      showScreen('menu-screen');
    });
    document.getElementById('lb-clear-btn').addEventListener('click', clearLeaderboard);
    document.getElementById('sound-toggle').addEventListener('click', toggleAudio);
    document.querySelectorAll('[data-screen="leaderboard"]').forEach(function (btn) {
      btn.addEventListener('click', showLeaderboard);
    });
    document.getElementById('pause-btn').addEventListener('click', function () {
      if (state.currentScreen === 'game-screen' && state.currentMode) {
        if (state.paused) { resumeGame(); }
        else { pauseGame(); }
      }
    });

    document.getElementById('header-title').addEventListener('click', function () {
      if (state.currentScreen === 'game-screen' && state.currentMode) {
        if (!state.paused) pauseGame();
        if (confirm('确定返回主菜单吗？当前游戏将终止。')) {
          quitGame();
        } else {
          resumeGame();
        }
      } else {
        showScreen('menu-screen');
      }
    });

    function processInput() {
      var input = document.getElementById('game-input');
      var word = input.value.trim();
      if (word.length > 0 && state.currentMode) {
        try {
          var result = state.currentMode.handleInput(word);
          if (result && result.correct) {
            window.TypingAudio.playCorrect();
            input.classList.remove('incorrect');
            input.classList.add('correct');
          } else {
            window.TypingAudio.playWrong();
            input.classList.remove('correct');
            input.classList.add('incorrect');
          }
          updateStats();
          if (state.currentMode.isGameOver()) {
            endGame();
          }
        } catch (e) {
          console.error('Input error:', e);
        }
      }
      input.value = '';
    }

    document.getElementById('game-input').addEventListener('keydown', function (e) {
      if (e.key === ' ' || e.key === 'Enter') {
        e.preventDefault();
        processInput();
      }
    });
    document.getElementById('pause-overlay').addEventListener('click', function (e) {
      if (e.target === this) resumeGame();
    });
    document.getElementById('pause-resume-btn').addEventListener('click', resumeGame);
    document.getElementById('pause-quit-btn').addEventListener('click', function () {
      document.getElementById('pause-overlay').style.display = 'none';
      state.paused = false;
      endGame();
    });

    document.addEventListener('keydown', function (e) {
      if (e.key === 'Escape' && state.currentScreen === 'game-screen' && state.currentMode) {
        if (state.paused) {
          resumeGame();
        } else {
          pauseGame();
        }
        e.preventDefault();
      }
      if (e.key === 'Enter' && state.currentScreen === 'menu-screen') {
        var startBtn = document.getElementById('start-btn');
        if (startBtn && startBtn.offsetParent !== null) {
          startGame();
        }
      }
    });
  }

  document.addEventListener('DOMContentLoaded', function () {
    setupEventListeners();
    selectMode('falling');
    selectDifficulty('normal');
    showScreen('menu-screen');
  });

  return {
    showScreen: showScreen,
    startGame: startGame,
    showLeaderboard: showLeaderboard,
  };
})();
