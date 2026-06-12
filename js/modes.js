window.TypingModes = window.TypingModes || {};

(function() {
  function getRandomInt(min, max) {
    return Math.floor(Math.random() * (max - min + 1)) + min;
  }

  // ======================== 经典坠落 ========================
  window.TypingModes.falling = {
    init(areaElement, difficulty) {
      var config = window.TypingGame.getDifficultyConfig(difficulty);
      this._state = {
        areaElement: areaElement,
        difficulty: difficulty,
        words: [],
        score: 0,
        combo: 0,
        maxCombo: 0,
        lives: config.lives || 3,
        correctCount: 0,
        totalAttempts: 0,
        fallSpeed: config.fallSpeed || 80,
        spawnTimer: 1.5 + Math.random() * 1.0,
        spawnMin: config.spawnMin || 1.0,
        spawnMax: config.spawnMax || 2.0,
        maxWords: 10,
        elapsed: 0,
        gameOver: false,
        lastScore: 0,
        lastScoreTimer: 0,
        debugLastTyped: '',
        debugMatchResult: ''
      };
      areaElement.style.position = 'relative';
      areaElement.style.overflow = 'hidden';
      areaElement.innerHTML = '';
    },

    handleInput: function(word) {
      var s = this._state;
      if (!s || s.gameOver) return { correct: false, score: 0, combo: 0 };
      s.totalAttempts++;
      s.debugLastTyped = word;
      var clean = word.toLowerCase().trim();
      if (!s.words || s.words.length === 0) {
        s.debugMatchResult = '无单词可匹配 (words=' + (s.words ? s.words.length : 0) + ')';
        s.combo = 0;
        return { correct: false, score: 0, combo: 0 };
      }
      for (var i = 0; i < s.words.length; i++) {
        var w = s.words[i];
        if (!w) continue;
        if (w.correct) continue;
        var wt = (w.text || '').toLowerCase().trim();
        if (wt === clean) {
          s.combo++;
          if (s.combo > s.maxCombo) s.maxCombo = s.combo;
          var pts = Math.floor(w.text.length * 10 * (1 + Math.floor(s.combo / 5) * 0.2));
          s.score += pts;
          s.correctCount++;
          w.correct = true;
          w.correctTimer = 0.3;
          s.lastScore = pts;
          s.lastScoreTimer = 0.8;
          s.debugMatchResult = '✓ 匹配 "' + w.text + '" +' + pts;
          return { correct: true, score: pts, combo: s.combo };
        }
      }
      s.debugMatchResult = '✗ 无匹配 (输入="' + clean + '")';
      s.combo = 0;
      return { correct: false, score: 0, combo: 0 };
    },

    update: function(deltaTime) {
      var s = this._state;
      if (s.gameOver) return;
      s.elapsed += deltaTime;
      if (s.lastScoreTimer > 0) s.lastScoreTimer -= deltaTime;
      var areaH = s.areaElement.clientHeight || 400;
      for (var i = s.words.length - 1; i >= 0; i--) {
        var w = s.words[i];
        if (!w) { s.words.splice(i, 1); continue; }
        if (w.correct) {
          w.correctTimer -= deltaTime;
          if (w.correctTimer <= 0) s.words.splice(i, 1);
          continue;
        }
        w.y += s.fallSpeed * deltaTime;
        if (w.y > areaH) {
          s.words.splice(i, 1);
          s.lives--;
          s.combo = 0;
          s.totalAttempts++;
          if (s.lives <= 0) { s.gameOver = true; return; }
        }
      }
      s.spawnTimer -= deltaTime;
      if (s.spawnTimer <= 0) {
        var active = 0;
        for (var k = 0; k < s.words.length; k++) { if (s.words[k] && !s.words[k].correct) active++; }
        if (active < s.maxWords) {
          var newWord = window.TypingGame.getRandomWord(s.difficulty);
          var aw = s.areaElement.clientWidth || 600;
          var laneC = Math.min(6, Math.max(3, Math.floor(aw / 90)));
          var lw = aw / laneC;
          var lane = getRandomInt(0, laneC - 1);
          var occ = {};
          for (var li = 0; li < s.words.length; li++) {
            var ww = s.words[li];
            if (ww && !ww.correct && ww.y < 300) {
              var wl = Math.floor(ww.x / lw);
              if (wl >= 0 && wl < laneC) occ[wl] = true;
            }
          }
          var tries = 0;
          while (occ[lane] && tries < laneC) { lane = (lane + 1) % laneC; tries++; }
          var xp = lane * lw + lw / 2 - newWord.length * 6;
          xp = Math.max(5, Math.min(xp, aw - newWord.length * 12 - 5));
          s.words.push({ text: newWord, x: xp, y: -30, correct: false });
        }
        s.spawnTimer = s.spawnMin + Math.random() * (s.spawnMax - s.spawnMin);
      }
    },

    render: function() {
      var s = this._state;
      var el = s.areaElement;
      if (!el) return;
      var h = '';
      for (var hi = 0; hi < Math.max(0, s.lives); hi++) h += '❤';
      var html = '<div style="position:absolute;top:4px;left:8px;right:8px;z-index:10;display:flex;justify-content:space-between;font-size:15px;font-weight:600;pointer-events:none;">' +
        '<span style="color:#e94560">得分: ' + s.score + '</span>' +
        '<span style="color:#f7b731">连击: ' + s.combo + '</span>' +
        '<span style="color:#e94560">生命: ' + (h || '无') + '</span>' +
        '</div>';
      html += '<div style="position:absolute;top:30px;left:8px;right:8px;font-size:11px;color:#666;pointer-events:none;z-index:10">' + s.debugMatchResult + '</div>';
      for (var i = 0; i < s.words.length; i++) {
        var w = s.words[i];
        if (!w) continue;
        if (w.correct) {
          html += '<span style="position:absolute;left:' + w.x + 'px;top:' + w.y + 'px;font-size:17px;padding:3px 9px;border-radius:4px;white-space:nowrap;opacity:0.3;color:#4caf50;text-decoration:line-through;">' + w.text + '</span>';
        } else {
          html += '<span style="position:absolute;left:' + w.x + 'px;top:' + w.y + 'px;font-size:17px;padding:3px 9px;border-radius:4px;white-space:nowrap;background:rgba(233,69,96,0.12);border:1px solid rgba(233,69,96,0.3);color:#e0e0e0;">' + w.text + '</span>';
        }
      }
      if (s.lastScoreTimer > 0) {
        html += '<div style="position:absolute;top:40%;left:50%;transform:translate(-50%,-50%);font-size:38px;font-weight:bold;color:#4ecdc4;pointer-events:none;text-shadow:0 0 20px rgba(78,205,196,0.5);animation:fadeInUp 0.6s ease forwards;z-index:20">+' + s.lastScore + '</div>';
      }
      if (s.gameOver) {
        html += '<div style="position:absolute;top:50%;left:50%;transform:translate(-50%,-50%);font-size:30px;font-weight:bold;color:#f44336;background:rgba(0,0,0,0.85);padding:18px 36px;border-radius:10px;z-index:30">游戏结束</div>';
      }
      el.innerHTML = html;
    },

    getStats: function() {
      var s = this._state;
      var m = s.elapsed > 0 ? s.elapsed / 60 : 0.001;
      return {
        score: s.score,
        wpm: s.correctCount > 0 ? Math.round(s.correctCount / m) : 0,
        cpm: s.correctCount > 0 ? Math.round(s.correctCount * 5 / m) : 0,
        accuracy: s.totalAttempts > 0 ? Math.round((s.correctCount / s.totalAttempts) * 100) : 100,
        combo: s.combo,
        maxCombo: s.maxCombo,
        lives: s.lives,
        completed: false,
        elapsed: Math.round(s.elapsed * 10) / 10
      };
    },

    isGameOver: function() { return this._state.gameOver; },

    destroy: function() {
      if (this._state && this._state.areaElement) this._state.areaElement.innerHTML = '';
      this._state = {};
    }
  };

  // ======================== 段落竞速 ========================
  window.TypingModes.paragraph = {
    _state: {},

    init: function(areaElement, difficulty) {
      var paragraph = window.TypingGame.generateParagraph(difficulty);
      var words = paragraph.split(/\s+/).filter(function(w) { return w.length > 0; });
      this._state = {
        areaElement: areaElement,
        difficulty: difficulty,
        words: words,
        wordStates: words.map(function() { return ''; }),
        currentIndex: 0,
        score: 0,
        combo: 0,
        maxCombo: 0,
        correctCount: 0,
        totalAttempts: 0,
        elapsed: 0,
        finished: false,
        gameOver: false
      };

      areaElement.style.overflowY = 'auto';
      areaElement.style.position = 'relative';
      areaElement.innerHTML = '';
      this.render();
    },

    handleInput: function(word) {
      var state = this._state;
      if (state.gameOver || state.finished) return { correct: false, score: 0, combo: 0, message: '' };

      state.totalAttempts++;
      var currentWord = state.words[state.currentIndex];

      if (currentWord && word.toLowerCase().trim() === currentWord.toLowerCase().trim()) {
        state.wordStates[state.currentIndex] = 'correct';
        state.combo++;
        if (state.combo > state.maxCombo) state.maxCombo = state.combo;
        var pts = window.TypingGame.calculateScore(word.length, state.combo);
        state.score += pts;
        state.correctCount++;
        state.currentIndex++;

        if (state.currentIndex >= state.words.length) {
          state.finished = true;
        }

        return {
          correct: true,
          score: pts,
          combo: state.combo,
          message: state.combo > 1 ? '+' + pts + ' 连击x' + state.combo + '!' : ''
        };
      }

      state.wordStates[state.currentIndex] = 'incorrect';
      state.combo = 0;
      state.currentIndex++;

      if (state.currentIndex >= state.words.length) {
        state.finished = true;
      }

      return { correct: false, score: 0, combo: 0, message: '' };
    },

    update: function(deltaTime) {
      var state = this._state;
      if (!state.finished && !state.gameOver) {
        state.elapsed += deltaTime;
      }
    },

    render: function() {
      var state = this._state;
      var el = state.areaElement;
      if (!el) return;

      var html = '<div class="paragraph-container" style="padding:20px;line-height:2.2;font-size:18px;">';
      for (var i = 0; i < state.words.length; i++) {
        var cls = '';
        var extraStyle = '';

        if (i < state.currentIndex && state.wordStates[i] === 'correct') {
          cls = 'correct';
          extraStyle = 'color:#4caf50;';
        } else if (i < state.currentIndex && state.wordStates[i] === 'incorrect') {
          cls = 'incorrect';
          extraStyle = 'color:#f44336;text-decoration:line-through;';
        } else if (i === state.currentIndex) {
          cls = 'current';
          extraStyle = 'background:#ffeb3b;padding:2px 6px;border-radius:4px;font-weight:bold;color:#333;';
        }

        var displayWord = typeof window.TypingGame.escapeHtml === 'function' ? window.TypingGame.escapeHtml(state.words[i]) : state.words[i];
        html += '<span class="word ' + cls + '" data-index="' + i + '" style="margin:0 3px;' + extraStyle + '">' + displayWord + '</span>';
      }
      html += '</div>';

      if (state.finished) {
        html += '<div class="paragraph-done" style="text-align:center;margin-top:30px;font-size:28px;font-weight:bold;color:#4caf50;">全部完成!</div>';
      }

      el.innerHTML = html;

      if (!state.finished && state.currentIndex < state.words.length) {
        var currentSpan = el.querySelector('[data-index="' + state.currentIndex + '"]');
        if (currentSpan) currentSpan.scrollIntoView({ behavior: 'smooth', block: 'center' });
      }
    },

    getStats: function() {
      var s = this._state;
      var minutes = s.elapsed > 0 ? s.elapsed / 60 : 0.001;
      var total = s.totalAttempts || 1;
      return {
        score: s.score,
        wpm: s.correctCount > 0 ? Math.round(s.correctCount / minutes) : 0,
        cpm: s.correctCount > 0 ? Math.round(s.correctCount * 5 / minutes) : 0,
        accuracy: Math.round((s.correctCount / total) * 100),
        combo: s.combo,
        maxCombo: s.maxCombo,
        lives: undefined,
        completed: s.finished,
        elapsed: Math.round(s.elapsed * 10) / 10
      };
    },

    isGameOver: function() {
      return this._state.gameOver || this._state.finished;
    },

    destroy: function() {
      if (this._state.areaElement) this._state.areaElement.innerHTML = '';
      this._state = {};
    }
  };

  // ======================== 限时挑战 ========================
  window.TypingModes.timed = {
    _state: {},

    init: function(areaElement, difficulty) {
      this._state = {
        areaElement: areaElement,
        difficulty: difficulty,
        currentWord: window.TypingGame.getRandomWord(difficulty),
        score: 0,
        combo: 0,
        maxCombo: 0,
        correctCount: 0,
        totalAttempts: 0,
        timeLimit: 60,
        timeLeft: 60,
        elapsed: 0,
        gameOver: false
      };

      areaElement.style.position = 'relative';
      areaElement.style.display = 'flex';
      areaElement.style.flexDirection = 'column';
      areaElement.style.alignItems = 'center';
      areaElement.style.justifyContent = 'center';
      areaElement.innerHTML = '';
      this.render();
    },

    handleInput: function(word) {
      var state = this._state;
      if (state.gameOver) return { correct: false, score: 0, combo: 0, message: '' };

      state.totalAttempts++;
      if (state.currentWord && word.toLowerCase().trim() === state.currentWord.toLowerCase().trim()) {
        state.combo++;
        if (state.combo > state.maxCombo) state.maxCombo = state.combo;
        var pts = window.TypingGame.calculateScore(word.length, state.combo);
        state.score += pts;
        state.correctCount++;
        state.currentWord = window.TypingGame.getRandomWord(state.difficulty);

        return {
          correct: true,
          score: pts,
          combo: state.combo,
          message: state.combo > 1 ? '+' + pts + ' 连击x' + state.combo + '!' : ''
        };
      }

      state.combo = 0;
      return { correct: false, score: 0, combo: 0, message: '' };
    },

    update: function(deltaTime) {
      var state = this._state;
      if (state.gameOver) return;

      state.timeLeft -= deltaTime;
      state.elapsed += deltaTime;
      if (state.timeLeft <= 0) {
        state.timeLeft = 0;
        state.gameOver = true;
      }
    },

    render: function() {
      var state = this._state;
      var el = state.areaElement;
      if (!el) return;

      var pct = Math.max(0, (state.timeLeft / state.timeLimit) * 100);
      var barColor = pct > 20 ? '#4caf50' : '#f44336';

      var html =
        '<div class="timed-progress-wrap" style="width:90%;height:10px;background:#e0e0e0;border-radius:5px;overflow:hidden;margin-bottom:16px;">' +
          '<div class="timed-progress-bar" style="height:100%;width:' + pct + '%;background:' + barColor + ';transition:width 0.3s;"></div>' +
        '</div>' +
        '<div class="timed-info" style="width:90%;display:flex;justify-content:space-between;font-size:16px;margin-bottom:20px;">' +
          '<span>得分: ' + state.score + '</span>' +
          '<span>连击: ' + state.combo + '</span>' +
          '<span>已输入: ' + state.correctCount + ' 个</span>' +
        '</div>' +
        '<h1 class="timed-word" style="font-size:48px;text-align:center;margin:20px 0;padding:20px 40px;background:#f5f5f5;border-radius:8px;border:2px solid #ddd;min-width:200px;user-select:none;">' + state.currentWord + '</h1>' +
        '<div class="timed-clock" style="font-size:28px;font-weight:bold;color:' + (state.timeLeft <= 10 ? '#f44336' : '#333') + ';">' + Math.ceil(state.timeLeft) + 's</div>';

      if (state.gameOver) {
        html += '<div class="timed-gameover" style="font-size:28px;font-weight:bold;color:#f44336;margin-top:24px;">时间到!</div>';
      }

      el.innerHTML = html;
    },

    getStats: function() {
      var s = this._state;
      var minutes = s.elapsed > 0 ? s.elapsed / 60 : 0.001;
      var total = s.totalAttempts || 1;
      return {
        score: s.score,
        wpm: s.correctCount > 0 ? Math.round(s.correctCount / minutes) : 0,
        cpm: s.correctCount > 0 ? Math.round(s.correctCount * 5 / minutes) : 0,
        accuracy: Math.round((s.correctCount / total) * 100),
        combo: s.combo,
        maxCombo: s.maxCombo,
        lives: undefined,
        completed: false,
        elapsed: Math.round(s.elapsed * 10) / 10
      };
    },

    isGameOver: function() {
      return this._state.gameOver;
    },

    destroy: function() {
      if (this._state.areaElement) this._state.areaElement.innerHTML = '';
      this._state = {};
    }
  };
})();
