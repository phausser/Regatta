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

    const scoreName = this.playerName(playername);
    const timeValue = Number(timeSeconds).toFixed(3);
    const hash = await this._sha256(`${timeValue}:${session.secret}:${scoreName}`);
    const result = await this._post('/submit-score', {
      session_id: session.session_id,
      playername: scoreName,
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
    const url = `${this.baseUrl}${path}`;
    let res;
    try {
      res = await fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      });
    } catch (err) {
      throw this._requestError('Network request failed', {
        cause: err,
        method: 'POST',
        url,
        body,
      });
    }

    const data = await res.json().catch(() => null);
    if (!res.ok) {
      throw this._requestError((data && data.error) || `Request failed: ${res.status}`, {
        method: 'POST',
        url,
        status: res.status,
        statusText: res.statusText,
        body,
        response: data,
      });
    }
    return data || {};
  },

  _requestError(message, details) {
    const err = new Error(message);
    err.details = details;
    if (details && details.cause) err.cause = details.cause;
    return err;
  },

  _requestDetails(err) {
    if (!err) return {};
    const details = err.details || {};
    return {
      message: err.message || String(err),
      method: details.method,
      url: details.url,
      status: details.status,
      statusText: details.statusText,
      response: details.response,
      requestBody: details.body,
      cause: details.cause || err.cause,
    };
  },

  playerName(name) {
    return String(name || 'Anonymous').trim().slice(0, 30) || 'Anonymous';
  },

  async _sha256(text) {
    if (!crypto.subtle) throw new Error('Web Crypto unavailable');
    const bytes = new TextEncoder().encode(text);
    const digest = await crypto.subtle.digest('SHA-256', bytes);
    return Array.from(new Uint8Array(digest), b => b.toString(16).padStart(2, '0')).join('');
  },
};
