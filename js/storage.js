const Storage = {
  get(key, def = null) {
    try { const v = localStorage.getItem(key); return v !== null ? JSON.parse(v) : def; }
    catch { return def; }
  },
  set(key, val) { try { localStorage.setItem(key, JSON.stringify(val)); } catch {} },
  remove(key) { try { localStorage.removeItem(key); } catch {} },

  getProgress(id) { return this.get('prog_' + id, null); },
  setProgress(id, data) { this.set('prog_' + id, data); },

  getFinished() { return this.get('finished', []); },
  isFinished(id) { return this.getFinished().includes(id); },
  markFinished(id) {
    const list = this.getFinished();
    if (!list.includes(id)) { list.push(id); this.set('finished', list); }
    this.set('totalStoriesRead', (this.get('totalStoriesRead', 0)) + 1);
    this.set('lastReadDate', new Date().toISOString().slice(0, 10));
  },

  getFavourites() { return this.get('favourites', []); },
  isFavourite(id) { return this.getFavourites().includes(id); },
  toggleFavourite(id) {
    const list = this.getFavourites();
    const idx = list.indexOf(id);
    if (idx >= 0) list.splice(idx, 1); else list.push(id);
    this.set('favourites', list);
    return idx < 0;
  },

  getRating(id) { return this.get('rating_' + id, 0); },
  setRating(id, stars) { this.set('rating_' + id, stars); },

  addReadingTime(mins) {
    this.set('totalMinutesRead', (this.get('totalMinutesRead', 0)) + mins);
  }
};
