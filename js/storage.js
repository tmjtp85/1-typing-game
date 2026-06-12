window.TypingStorage = {
  _KEY: 'typing-game-results',

  _read() {
    try {
      const raw = localStorage.getItem(this._KEY);
      if (!raw) return [];
      const data = JSON.parse(raw);
      return Array.isArray(data) ? data : [];
    } catch {
      return [];
    }
  },

  _write(data) {
    try {
      localStorage.setItem(this._KEY, JSON.stringify(data));
    } catch {
      // storage full or unavailable — silently ignore
    }
  },

  saveResult(result) {
    const results = this._read();
    results.push(result);
    this._write(results);
  },

  getLeaderboard(limit = 20) {
    const results = this._read();
    return results
      .sort((a, b) => (b.score || 0) - (a.score || 0))
      .slice(0, limit);
  },

  clearAll() {
    try {
      localStorage.removeItem(this._KEY);
    } catch {
      // silently ignore
    }
  },

  getStats() {
    const results = this._read();
    if (results.length === 0) {
      return { totalGames: 0, bestWpm: 0, avgAccuracy: 0, bestScore: 0 };
    }
    const totalGames = results.length;
    const bestWpm = Math.max(...results.map((r) => r.wpm || 0));
    const bestScore = Math.max(...results.map((r) => r.score || 0));
    const avgAccuracy =
      results.reduce((sum, r) => sum + (r.accuracy || 0), 0) / totalGames;
    return { totalGames, bestWpm, avgAccuracy, bestScore };
  },
};
