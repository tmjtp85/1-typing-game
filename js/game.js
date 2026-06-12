window.TypingGame = {
  getDifficultyConfig(difficulty) {
    var configs = {
      'very-easy': { scoreMultiplier: 0.8, lives: 8, fallSpeed: 35, paragraphLength: 15, wordCount: 20, color: '#4ecdc4', spawnMin: 1.5, spawnMax: 3.0 },
      easy: { scoreMultiplier: 1, lives: 6, fallSpeed: 55, paragraphLength: 20, wordCount: 30, color: '#4caf50', spawnMin: 1.2, spawnMax: 2.5 },
      normal: { scoreMultiplier: 1.5, lives: 4, fallSpeed: 80, paragraphLength: 30, wordCount: 50, color: '#ff9800', spawnMin: 1.0, spawnMax: 2.0 },
      hard: { scoreMultiplier: 2, lives: 3, fallSpeed: 110, paragraphLength: 40, wordCount: 80, color: '#f44336', spawnMin: 0.8, spawnMax: 1.5 },
      'very-hard': { scoreMultiplier: 3, lives: 2, fallSpeed: 150, paragraphLength: 50, wordCount: 100, color: '#9c27b0', spawnMin: 0.5, spawnMax: 1.0 }
    };
    return configs[difficulty] || configs.normal;
  },

  calculateScore(word, combo) {
    var base = word.length * 10;
    var comboBonus = Math.floor(combo / 5) * 0.2;
    return Math.floor(base * (1 + comboBonus));
  },

  calculateWPM(totalChars, elapsedSeconds) {
    if (elapsedSeconds <= 0) return 0;
    return Math.round((totalChars / 5) / (elapsedSeconds / 60));
  },

  calculateCPM(totalChars, elapsedSeconds) {
    if (elapsedSeconds <= 0) return 0;
    return Math.round(totalChars / (elapsedSeconds / 60));
  },

  calculateAccuracy(correctCount, totalCount) {
    if (totalCount <= 0) return 0;
    return Math.round(correctCount / totalCount * 100 * 10) / 10;
  },

  _bankForDifficulty(difficulty) {
    var map = { 'very-easy': 'easy', easy: 'easy', normal: 'normal', hard: 'hard', 'very-hard': 'hard' };
    return map[difficulty] || 'normal';
  },

  getRandomWord(difficulty) {
    var bankName = this._bankForDifficulty(difficulty);
    var bank = window.WORD_BANKS[bankName];
    if (!bank || !bank.length) bank = window.WORD_BANKS.normal;
    return bank[Math.floor(Math.random() * bank.length)];
  },

  getMultipleWords(difficulty, count) {
    var words = [];
    for (var i = 0; i < count; i++) {
      words.push(this.getRandomWord(difficulty));
    }
    return words;
  },

  generateParagraph(difficulty, wordCount) {
    if (wordCount == null) wordCount = 30;
    return this.getMultipleWords(difficulty, wordCount).join(' ');
  }
};
