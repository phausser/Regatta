// ScoreApi – Server-Anbindung fuer Highscores
const ScoreApi = {
  baseUrl: window.GEOSAIL_SCORE_API || 'https://regatta.binaerraum.de/api',
  _session: null,
  _sessionPromise: null,
  _startedAt: 0,

  async startSession() {
    this._startedAt = performance.now();
    this._sessionPromise = this._post('/start-session', {});
    this._session = await this._sessionPromise;
    return this._session;
  },

  clearSession() {
    this._session = null;
    this._sessionPromise = null;
    this._startedAt = 0;
  },

  hasSession() {
    return Boolean(this._sessionPromise);
  },

  sessionAgeSeconds() {
    if (!this._startedAt) return 0;
    return (performance.now() - this._startedAt) / 1000;
  },

  async submitScore(timeSeconds, playername = 'Anonymous') {
    const session = await this._sessionPromise;
    if (!session) throw new Error('No score session');

    const timeValue = Number(timeSeconds).toFixed(3);
    const hash = await this._sha256(`${timeValue}:${session.secret}:${playername}`);
    const result = await this._post('/submit-score', {
      session_id: session.session_id,
      playername,
      time: timeValue,
      hash,
    });

    this.clearSession();
    return result;
  },

  async leaderboard(limit = 5) {
    const res = await fetch(`${this.baseUrl}/leaderboard?limit=${encodeURIComponent(limit)}`);
    if (!res.ok) throw new Error(`Leaderboard failed: ${res.status}`);
    return res.json();
  },

  async _post(path, body) {
    const res = await fetch(`${this.baseUrl}${path}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    });
    const data = await res.json().catch(() => ({}));
    if (!res.ok) throw new Error(data.error || `Request failed: ${res.status}`);
    return data;
  },

  async _sha256(text) {
    if (!crypto.subtle) throw new Error('Web Crypto unavailable');
    const bytes = new TextEncoder().encode(text);
    const digest = await crypto.subtle.digest('SHA-256', bytes);
    return Array.from(new Uint8Array(digest), b => b.toString(16).padStart(2, '0')).join('');
  },
};
