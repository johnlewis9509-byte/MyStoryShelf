const App = {
  currentScreen: 'splash',
  storyData: null,

  go(screenId, opts = {}) {
    AudioManager.stop();
    document.querySelectorAll('.screen').forEach(s => s.classList.remove('active'));
    const screen = document.getElementById('screen-' + screenId);
    if (!screen) return;
    screen.classList.add('active');
    this.currentScreen = screenId;
    window.scrollTo(0, 0);

    document.querySelectorAll('.nav-item').forEach(n => n.classList.remove('on'));
    const navMap = { home: 'nav-home', categories: 'nav-stories', play: 'nav-play', mybooks: 'nav-mybooks' };
    if (navMap[screenId]) document.getElementById(navMap[screenId])?.classList.add('on');

    const inits = {
      home:       () => HomeScreen.init(),
      categories: () => CategoriesScreen.init(),
      storylist:  () => StoryListScreen.init(opts.category),
      reading:    () => ReadingScreen.init(opts.story, opts.page),
      completed:  () => CompletedScreen.init(opts.story),
      mybooks:    () => MyBooksScreen.init(),
      parent:     () => ParentScreen.init(),
      bedtime:    () => BedtimeScreen.init()
    };
    if (inits[screenId]) inits[screenId]();
  },

  async init() {
    try {
      const resp = await fetch('data/stories.json');
      this.storyData = await resp.json();
    } catch {
      this.storyData = { stories: [] };
    }

    if ('serviceWorker' in navigator) {
      navigator.serviceWorker.register('service-worker.js').catch(() => {});
    }

    const name  = Storage.get('childName');
    const buddy = Storage.get('buddy');
    setTimeout(() => {
      if (name && buddy) this.go('home');
      else if (name)     this.go('character');
      else               this.go('name');
    }, 2500);
  }
};

const NameScreen = {
  setup() {
    const input  = document.getElementById('name-input');
    const btn    = document.getElementById('name-btn');
    const bubble = document.getElementById('name-bubble');
    const span   = document.getElementById('name-span');

    input.value = '';
    bubble.style.display = 'none';
    btn.disabled = true;

    const saved = Storage.get('childName');
    if (saved) { input.value = saved; span.textContent = saved; bubble.style.display = 'block'; btn.disabled = false; }

    input.oninput = () => {
      const val = input.value.trim();
      if (val.length >= 2) {
        span.textContent = val;
        bubble.style.display = 'block';
        btn.disabled = false;
      } else {
        bubble.style.display = 'none';
        btn.disabled = true;
      }
    };

    btn.onclick = () => {
      const val = input.value.trim();
      if (val.length >= 2) { Storage.set('childName', val); App.go('character'); }
    };

    input.addEventListener('keydown', e => { if (e.key === 'Enter' && !btn.disabled) btn.click(); });
  }
};

const CharacterScreen = {
  setup() {
    const btn    = document.getElementById('char-btn');
    const saved  = Storage.get('buddy');
    let selected = saved || null;

    document.querySelectorAll('.char-card').forEach(card => {
      card.classList.remove('sel');
      if (card.dataset.name === saved) card.classList.add('sel');

      card.onclick = () => {
        document.querySelectorAll('.char-card').forEach(c => c.classList.remove('sel'));
        card.classList.add('sel');
        selected = card.dataset.name;
        btn.disabled = false;
      };
    });

    btn.disabled = !selected;
    btn.onclick = () => {
      if (selected) { Storage.set('buddy', selected); App.go('home'); }
    };
  }
};

const HomeScreen = {
  init() {
    const name  = Storage.get('childName', 'Friend');
    const buddy = Storage.get('buddy', 'Puppy');
    const buddyEmoji = { Puppy:'🐶', Bunny:'🐰', Kitty:'🐱', Panda:'🐼', Fox:'🦊', Unicorn:'🦄' }[buddy] || '🐶';
    const hour  = new Date().getHours();
    const greet = hour < 12 ? 'Good Morning' : hour < 17 ? 'Good Afternoon' : 'Good Evening';

    document.getElementById('home-greeting').textContent = greet + ', ' + name + '! ☀️';
    document.getElementById('home-buddy').textContent    = buddyEmoji;

    const cont = document.getElementById('continue-card');
    if (!App.storyData) { cont.style.display = 'none'; return; }

    let lastStory = null;
    for (const s of App.storyData.stories) {
      const prog = Storage.getProgress(s.id);
      if (prog && !prog.completedAt && prog.currentPage > 0) lastStory = { story: s, prog };
    }
    if (lastStory) {
      cont.style.display = 'flex';
      document.getElementById('cont-title').textContent = lastStory.story.title;
      document.getElementById('cont-sub').textContent   = 'Page ' + lastStory.prog.currentPage + ' of ' + lastStory.story.totalPages;
      cont.onclick = () => App.go('reading', { story: lastStory.story, page: lastStory.prog.currentPage - 1 });
    } else {
      cont.style.display = 'none';
    }
  }
};

const CategoriesScreen = {
  init() {
    if (!App.storyData) return;
    document.querySelectorAll('.cat-card[data-cat]').forEach(card => {
      const count = App.storyData.stories.filter(s => s.category === card.dataset.cat).length;
      const countEl = card.querySelector('.cat-count');
      if (countEl) countEl.textContent = count + ' ' + (count === 1 ? 'story' : 'stories');
      card.onclick = () => App.go('storylist', { category: card.dataset.cat });
    });
  }
};

const MyBooksScreen = {
  init() {
    this.renderTab('reading');
    document.querySelectorAll('#mybooks-tabs .tab').forEach(tab => {
      tab.onclick = () => {
        document.querySelectorAll('#mybooks-tabs .tab').forEach(t => t.classList.remove('on'));
        tab.classList.add('on');
        this.renderTab(tab.dataset.tab);
      };
    });
  },

  renderTab(tabName) {
    const container = document.getElementById('mybooks-list');
    container.innerHTML = '';
    if (!App.storyData) return;

    let stories = [];
    if (tabName === 'reading') {
      stories = App.storyData.stories.filter(s => {
        const p = Storage.getProgress(s.id);
        return p && !p.completedAt;
      });
    } else if (tabName === 'finished') {
      stories = App.storyData.stories.filter(s => Storage.isFinished(s.id));
    } else {
      stories = App.storyData.stories.filter(s => Storage.isFavourite(s.id));
    }

    if (!stories.length) {
      container.innerHTML = '<div class="empty-state">📖<p>No books here yet!<br>Start reading to see them here.</p></div>';
      return;
    }

    stories.forEach(story => {
      const prog   = Storage.getProgress(story.id);
      const rating = Storage.getRating(story.id);
      const pct    = prog ? Math.round((prog.currentPage / prog.totalPages) * 100) : 0;
      const sub    = tabName === 'reading'  ? 'Page ' + (prog?.currentPage || 1) + ' of ' + story.totalPages :
                     tabName === 'finished' ? (rating ? '⭐'.repeat(rating) : '✅ Finished') :
                                              '❤️ Favourite';
      const row = document.createElement('div');
      row.className = 'book-row';
      row.innerHTML = '<div class="book-cover" style="background:' + story.color + '20">' + story.emoji + '</div><div class="book-info"><div class="book-t">' + story.title + '</div><div class="book-s">' + sub + '</div><div class="book-prog"><div class="book-fill" style="width:' + pct + '%"></div></div></div><div class="book-arr">›</div>';
      row.onclick = () => App.go('reading', { story });
      container.appendChild(row);
    });
  }
};

const ParentScreen = {
  pin: [],

  init() {
    this.pin = [];
    document.getElementById('parent-dashboard').style.display = 'none';
    document.getElementById('parent-pin-section').style.display = 'flex';
    document.getElementById('parent-error').style.display = 'none';
    this.updateDots();
  },

  addDigit(d) {
    if (d === 'del') {
      this.pin.pop();
    } else if (this.pin.length < 4) {
      this.pin.push(d);
    }
    this.updateDots();
    if (this.pin.length === 4) setTimeout(() => this.checkPin(), 120);
  },

  updateDots() {
    for (let i = 0; i < 4; i++) {
      document.getElementById('pd' + (i + 1))?.classList.toggle('on', i < this.pin.length);
    }
  },

  checkPin() {
    const stored  = Storage.get('parentPin', '1234');
    const entered = this.pin.join('');
    if (entered === stored) {
      document.getElementById('parent-pin-section').style.display = 'none';
      document.getElementById('parent-dashboard').style.display = 'block';
      this.loadStats();
    } else {
      document.getElementById('parent-error').style.display = 'block';
      const dots = document.getElementById('pin-dots-container');
      dots.classList.add('shake');
      setTimeout(() => dots.classList.remove('shake'), 500);
      this.pin = [];
      this.updateDots();
    }
  },

  loadStats() {
    const name   = Storage.get('childName', 'Your child');
    const total  = Storage.get('totalStoriesRead', 0);
    const last   = Storage.get('lastReadDate', '—');
    const fin    = Storage.getFinished();

    document.getElementById('pstat-name').textContent    = name + "'s Reading Stats";
    document.getElementById('pstat-total').textContent   = total;
    document.getElementById('pstat-last').textContent    = last;
    document.getElementById('pstat-fin').textContent     = fin.length;

    const hist = document.getElementById('parent-history');
    hist.innerHTML = '';
    if (!App.storyData || !fin.length) {
      hist.innerHTML = '<div class="history-item" style="color:var(--muted)">No completed stories yet.</div>';
      return;
    }
    fin.slice(-10).reverse().forEach(id => {
      const s = App.storyData.stories.find(x => x.id === id);
      if (!s) return;
      const p  = Storage.getProgress(id);
      const li = document.createElement('div');
      li.className = 'history-item';
      li.textContent = s.emoji + ' ' + s.title + (p?.completedAt ? '  · ' + p.completedAt : '');
      hist.appendChild(li);
    });
  },

  changePin() {
    const newPin = prompt('Enter a new 4-digit PIN:');
    if (newPin && /^\d{4}$/.test(newPin)) {
      Storage.set('parentPin', newPin);
      alert('PIN changed successfully!');
    } else if (newPin !== null) {
      alert('Please enter exactly 4 digits.');
    }
  },

  resetData() {
    if (!confirm('Reset ALL app data? This cannot be undone.')) return;
    localStorage.clear();
    App.go('splash');
    setTimeout(() => App.go('name'), 100);
  }
};

const BedtimeScreen = {
  init() {
    const name = Storage.get('childName', 'Friend');
    const el   = document.getElementById('bedtime-name');
    if (el) el.textContent = name;
    AudioManager.setRate(0.8);
  }
};

document.addEventListener('DOMContentLoaded', () => {
  NameScreen.setup();
  CharacterScreen.setup();
  App.init();
});
