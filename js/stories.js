/* ─── STORY LIST SCREEN ─── */
const StoryListScreen = {
  catMeta: {
    animals:    { name: 'Animal Land 🦁',    desc: 'Brave friends, wild adventures and amazing animals!' },
    adventure:  { name: 'Adventure Land 🗺️', desc: 'Bold explorers and thrilling journeys!' },
    fairytales: { name: 'Fairy Tales ✨',      desc: 'Magic, wonder, and happily ever afters.' },
    space:      { name: 'Space Explorer 🚀',  desc: 'Blast off to the stars and beyond!' },
    ocean:      { name: 'Ocean Deep 🌊',      desc: 'Dive into the deep blue world below.' },
    bedtime:    { name: 'Bedtime Stories 🌙', desc: 'Calm, dreamy stories for a peaceful night.' }
  },

  init(category) {
    if (!category || !App.storyData) return;
    const meta = this.catMeta[category] || { name: category, desc: '' };
    document.getElementById('storylist-title').textContent = meta.name;
    document.getElementById('storylist-desc').textContent  = meta.desc;

    const stories   = App.storyData.stories.filter(s => s.category === category);
    const container = document.getElementById('story-list-container');
    container.innerHTML = '';

    if (!stories.length) {
      container.innerHTML = '<div class="empty-state">📚<p>No stories in this category yet!</p></div>';
      return;
    }

    stories.forEach(story => {
      const diff   = story.difficulty === 'easy' ? '⭐' : story.difficulty === 'medium' ? '⭐⭐' : '⭐⭐⭐';
      const rating = Storage.getRating(story.id);
      const isFav  = Storage.isFavourite(story.id);
      const done   = Storage.isFinished(story.id);

      const row = document.createElement('div');
      row.className = 'story-row';
      row.setAttribute('role', 'button');
      row.setAttribute('aria-label', 'Read ' + story.title);
      row.innerHTML = '<div class="story-cover" style="background:' + story.color + '20">' + story.emoji + '</div><div class="story-info"><div class="story-t">' + story.title + '</div><div class="story-s">' + diff + (done ? ' · ✅' : '') + (rating ? ' · ' + '⭐'.repeat(rating) : '') + '</div></div><button class="fav-btn" data-id="' + story.id + '" aria-label="' + (isFav ? 'Unfavourite' : 'Favourite') + '">' + (isFav ? '❤️' : '🤍') + '</button><div class="story-arr">›</div>';

      row.onclick = e => {
        if (e.target.classList.contains('fav-btn')) {
          e.stopPropagation();
          const isNow = Storage.toggleFavourite(story.id);
          e.target.textContent = isNow ? '❤️' : '🤍';
          e.target.setAttribute('aria-label', isNow ? 'Unfavourite' : 'Favourite');
        } else {
          App.go('reading', { story });
        }
      };
      container.appendChild(row);
    });
  }
};

/* ─── READING SCREEN ─── */
const ReadingScreen = {
  story:     null,
  pageIndex: 0,
  ttsOn:     false,
  startedAt: null,

  init(story, pageIndex) {
    if (!story) return;
    this.story     = story;
    this.pageIndex = pageIndex || 0;
    this.ttsOn     = false;
    this.startedAt = Date.now();

    document.getElementById('reading-story-name').textContent = story.title;

    const isFav = Storage.isFavourite(story.id);
    const favBtn = document.getElementById('reading-fav-btn');
    favBtn.textContent = isFav ? '❤️' : '🤍';
    favBtn.onclick = () => {
      const now = Storage.toggleFavourite(story.id);
      favBtn.textContent = now ? '❤️' : '🤍';
    };

    if (!Storage.getProgress(story.id)) {
      Storage.setProgress(story.id, {
        currentPage: 1,
        totalPages: story.totalPages,
        startedAt: new Date().toISOString().slice(0, 10),
        completedAt: null
      });
    }

    document.getElementById('font-decrease').onclick = () => {
      const el = document.getElementById('reading-text');
      const sz = parseInt(getComputedStyle(el).fontSize);
      if (sz > 14) el.style.fontSize = (sz - 2) + 'px';
    };
    document.getElementById('font-increase').onclick = () => {
      const el = document.getElementById('reading-text');
      const sz = parseInt(getComputedStyle(el).fontSize);
      if (sz < 26) el.style.fontSize = (sz + 2) + 'px';
    };

    document.getElementById('prev-page-btn').onclick = () => this.prevPage();
    document.getElementById('next-page-btn').onclick = () => this.nextPage();

    document.getElementById('i-can-read-btn').onclick = () => {
      AudioManager.stop();
      this.ttsOn = false;
      this.updateTTSBtn();
      this.nextPage();
    };

    this.setupTTS();
    this.renderPage();
  },

  renderPage() {
    const page = this.story.pages[this.pageIndex];
    if (!page) return;

    document.getElementById('reading-illus').textContent      = page.illustration;
    document.getElementById('reading-illus').style.background = page.illustrationBg || '#FFF9E6';
    document.getElementById('reading-text').textContent       = page.text;

    const cur   = this.pageIndex + 1;
    const total = this.story.pages.length;
    document.getElementById('reading-page-num').textContent          = 'Page ' + cur + ' of ' + total;
    document.getElementById('reading-progress-fill').style.width     = ((cur / total) * 100) + '%';
    document.getElementById('prev-page-btn').disabled                = this.pageIndex === 0;
    document.getElementById('next-page-btn').textContent             = cur === total ? '✓' : '›';

    const existing = Storage.getProgress(this.story.id) || {};
    Storage.setProgress(this.story.id, {
      currentPage: cur,
      totalPages:  total,
      startedAt:   existing.startedAt || new Date().toISOString().slice(0, 10),
      completedAt: null
    });

    if (this.ttsOn) { AudioManager.stop(); this.ttsOn = false; this.updateTTSBtn(); }
  },

  nextPage() {
    if (this.pageIndex < this.story.pages.length - 1) {
      this.pageIndex++;
      this.renderPage();
    } else {
      const elapsed = Math.round((Date.now() - this.startedAt) / 60000);
      Storage.addReadingTime(elapsed);
      const existing = Storage.getProgress(this.story.id) || {};
      Storage.setProgress(this.story.id, { ...existing, completedAt: new Date().toISOString().slice(0, 10) });
      Storage.markFinished(this.story.id);
      App.go('completed', { story: this.story });
    }
  },

  prevPage() {
    if (this.pageIndex > 0) { this.pageIndex--; this.renderPage(); }
  },

  setupTTS() {
    const btn   = document.getElementById('read-to-me-btn');
    const speed = document.getElementById('tts-speed');
    const label = document.getElementById('tts-speed-label');

    this.updateTTSBtn();

    btn.onclick = () => {
      if (!this.ttsOn) {
        const text = this.story.pages[this.pageIndex].text;
        AudioManager.speak(text, null, () => { this.ttsOn = false; this.updateTTSBtn(); });
        this.ttsOn = true;
        btn.textContent = '⏸ Pause';
      } else {
        if (AudioManager.isPaused) {
          AudioManager.resume();
          btn.textContent = '▶ Resume';
        } else {
          AudioManager.pause();
          btn.textContent = '⏸ Pause';
        }
      }
    };

    speed.value = AudioManager.rate;
    label.textContent = AudioManager.rate + '×';
    speed.oninput = () => {
      const v = parseFloat(speed.value);
      AudioManager.setRate(v);
      label.textContent = v.toFixed(2).replace(/\.?0+$/, '') + '×';
    };
  },

  updateTTSBtn() {
    const btn = document.getElementById('read-to-me-btn');
    if (btn && !this.ttsOn) btn.textContent = '🔊 Read to Me';
  }
};

/* ─── COMPLETED SCREEN ─── */
const CompletedScreen = {
  init(story) {
    if (!story) return;
    document.getElementById('completed-story-title').textContent = story.title;
    document.getElementById('completed-emoji').textContent       = story.emoji;
    document.getElementById('completed-badge').textContent       = story.completionBadge || 'Super Reader! 🏆';

    const rating = Storage.getRating(story.id);
    this.renderStars(rating, story.id);

    document.getElementById('read-again-btn').onclick    = () => App.go('reading', { story, page: 0 });
    document.getElementById('completed-home-btn').onclick = () => App.go('home');
  },

  renderStars(current, storyId) {
    const container = document.getElementById('rating-stars');
    container.innerHTML = '';
    for (let i = 1; i <= 5; i++) {
      const btn = document.createElement('button');
      btn.className = 'rating-star';
      btn.textContent = i <= current ? '⭐' : '☆';
      btn.setAttribute('aria-label', 'Rate ' + i + ' star' + (i > 1 ? 's' : ''));
      btn.onclick = () => {
        Storage.setRating(storyId, i);
        this.renderStars(i, storyId);
      };
      container.appendChild(btn);
    }
  }
};
