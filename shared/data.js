// shared/data.js — localStorage cache + Firebase Realtime Database sync
// On every page load, content is fetched from Firebase and written to localStorage.
// Admin writes are pushed to Firebase so all devices see the same content.

// ── Firebase Realtime Database config ─────────────────────
// 1. Go to Firebase Console → Create project → Realtime Database → Create database
// 2. Replace the values below with your project's details
// 3. Firebase Console → Project Settings → Service Accounts → Database secrets → Show → copy secret
const FIREBASE_DB_URL = "https://mtogan-b3877-default-rtdb.firebaseio.com/";
const FIREBASE_ADMIN_SECRET = "zBW6OcrpDPETNPNOc1JyGHp0NxKZmfDAJh1MHiV4";
// ──────────────────────────────────────────────────────────

// Detect if running inside the admin panel
const _isAdmin = () => window.location.pathname.includes("/admin");

// Collections synced with Firebase (adminPin stays local only)
const REMOTE_COLLECTION_KEYS = [
  "apps",
  "books",
  "circles",
  "posts",
  "quests",
  "notifications",
  "subscribers",
  "profile",
  "stories",
  "recommends",
  "polls",
  "messages",
  "sales",
];

const DATA_KEYS = {
  apps: "mt_apps",
  books: "mt_books",
  circles: "mt_circles",
  posts: "mt_posts",
  quests: "mt_quests",
  notifications: "mt_notifications",
  subscribers: "mt_subscribers",
  profile: "mt_profile",
  adminPin: "mt_admin_pin",
  stories: "mt_stories",
  recommends: "mt_recommends",
  polls: "mt_polls",
  messages: "mt_messages",
  sales: "mt_sales",
};

// ── Helpers ──────────────────────────────────────────────

function _get(key) {
  try {
    return JSON.parse(localStorage.getItem(key)) || [];
  } catch (e) {
    return [];
  }
}

function _set(key, data) {
  localStorage.setItem(key, JSON.stringify(data));
  // Always push to Firebase — user votes/likes/impressions must count globally
  _remoteSet(key, data);
}

// Push a collection to Firebase (fire-and-forget)
function _remoteSet(key, data) {
  if (FIREBASE_DB_URL.includes("YOUR_PROJECT_ID")) return; // not configured yet
  const entry = Object.entries(DATA_KEYS).find(([, v]) => v === key);
  if (!entry) return;
  const [collectionName] = entry;
  if (!REMOTE_COLLECTION_KEYS.includes(collectionName)) return;
  fetch(
    `${FIREBASE_DB_URL}/mt/${collectionName}.json?auth=${FIREBASE_ADMIN_SECRET}`,
    {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(data),
    },
  ).catch((e) => console.warn("[DATA] _remoteSet failed:", e.message));
}

function _uid() {
  return Date.now().toString(36) + Math.random().toString(36).slice(2, 7);
}

// ── Generic CRUD ─────────────────────────────────────────

const DataStore = {
  // READ all
  getAll(type) {
    return _get(DATA_KEYS[type]);
  },

  // READ one
  getById(type, id) {
    return _get(DATA_KEYS[type]).find((item) => item.id === id) || null;
  },

  // CREATE
  add(type, item) {
    const list = _get(DATA_KEYS[type]);
    item.id = _uid();
    item.createdAt = new Date().toISOString();
    list.push(item);
    _set(DATA_KEYS[type], list);
    return item;
  },

  // UPDATE
  update(type, id, updates) {
    const list = _get(DATA_KEYS[type]);
    const idx = list.findIndex((item) => item.id === id);
    if (idx === -1) return null;
    list[idx] = {
      ...list[idx],
      ...updates,
      updatedAt: new Date().toISOString(),
    };
    _set(DATA_KEYS[type], list);
    return list[idx];
  },

  // DELETE
  remove(type, id) {
    const list = _get(DATA_KEYS[type]).filter((item) => item.id !== id);
    _set(DATA_KEYS[type], list);
  },

  // REORDER (move item to new index)
  reorder(type, id, newIndex) {
    const list = _get(DATA_KEYS[type]);
    const oldIdx = list.findIndex((item) => item.id === id);
    if (oldIdx === -1) return;
    const [item] = list.splice(oldIdx, 1);
    list.splice(newIndex, 0, item);
    _set(DATA_KEYS[type], list);
  },

  // COUNT
  count(type) {
    return _get(DATA_KEYS[type]).length;
  },

  // ── Profile (single object, not array) ───────────────

  getProfile() {
    try {
      return JSON.parse(localStorage.getItem(DATA_KEYS.profile)) || {};
    } catch (e) {
      return {};
    }
  },

  setProfile(data) {
    const current = this.getProfile();
    const updated = { ...current, ...data };
    localStorage.setItem(DATA_KEYS.profile, JSON.stringify(updated));
    _remoteSet(DATA_KEYS.profile, updated);
    return updated;
  },

  // ── Auth ─────────────────────────────────────────────

  getPin() {
    return localStorage.getItem(DATA_KEYS.adminPin) || "1234";
  },

  setPin(pin) {
    localStorage.setItem(DATA_KEYS.adminPin, pin);
  },

  checkPin(pin) {
    return pin === this.getPin();
  },

  // ── Initial sync ─────────────────────────────────────
  // Fetches all content from Firebase and writes it to localStorage.
  // Call this on every page load before rendering. Returns a Promise.
  async syncFromRemote() {
    if (FIREBASE_DB_URL.includes("YOUR_PROJECT_ID")) return;
    try {
      const res = await fetch(`${FIREBASE_DB_URL}/mt.json`);
      const remote = await res.json();
      if (!remote) return;
      _applyRemoteSnapshot(remote);
    } catch (e) {
      console.warn("[DATA] syncFromRemote failed (offline?):", e.message);
    }
  },

  // ── Real-time sync (Firebase SSE) ────────────────────
  // Opens a persistent SSE connection to Firebase. When any data changes
  // (from any device), updates localStorage and dispatches 'mt:remote-update'
  // so the UI refreshes without a page reload.
  startSync() {
    if (FIREBASE_DB_URL.includes("YOUR_PROJECT_ID")) return;
    let isFirstEvent = true;
    const es = new EventSource(`${FIREBASE_DB_URL}/mt.json`);

    es.addEventListener("put", (e) => {
      try {
        const { path, data } = JSON.parse(e.data);
        if (!data) return;
        if (path === "/") {
          // Initial snapshot — just sync to localStorage, no UI event
          // (page already rendered from syncFromRemote)
          if (isFirstEvent) {
            isFirstEvent = false;
            _applyRemoteSnapshot(data);
            return;
          }
          // Subsequent full-replace at root
          _applyRemoteSnapshot(data);
          _dispatchRemoteUpdate(null);
        } else {
          isFirstEvent = false;
          // Incremental update e.g. path "/posts" or "/posts/0/likes"
          const col = path.replace(/^\//, "").split("/")[0];
          if (REMOTE_COLLECTION_KEYS.includes(col) && DATA_KEYS[col]) {
            // Re-fetch the full collection to ensure consistency
            fetch(`${FIREBASE_DB_URL}/mt/${col}.json`)
              .then((r) => r.json())
              .then((colData) => {
                if (colData !== null) {
                  localStorage.setItem(DATA_KEYS[col], JSON.stringify(colData));
                  _dispatchRemoteUpdate(col);
                }
              })
              .catch(() => {});
          }
        }
      } catch (err) {
        /* ignore parse errors */
      }
    });

    es.addEventListener("patch", (e) => {
      try {
        const { path, data } = JSON.parse(e.data);
        if (!data) return;
        const col = path.replace(/^\//, "").split("/")[0];
        if (REMOTE_COLLECTION_KEYS.includes(col) && DATA_KEYS[col]) {
          fetch(`${FIREBASE_DB_URL}/mt/${col}.json`)
            .then((r) => r.json())
            .then((colData) => {
              if (colData !== null) {
                localStorage.setItem(DATA_KEYS[col], JSON.stringify(colData));
                _dispatchRemoteUpdate(col);
              }
            })
            .catch(() => {});
        }
      } catch (err) {
        /* ignore */
      }
    });
  },
};

// ── SSE helpers (module-private) ─────────────────────────
function _applyRemoteSnapshot(data) {
  for (const col of REMOTE_COLLECTION_KEYS) {
    if (data[col] === undefined || data[col] === null) continue;
    const key = DATA_KEYS[col];
    if (key) localStorage.setItem(key, JSON.stringify(data[col]));
  }
}

function _dispatchRemoteUpdate(changedCollection) {
  window.dispatchEvent(
    new CustomEvent("mt:remote-update", {
      detail: { changed: changedCollection },
    }),
  );
}

// ── Seed data (runs once if stores are empty) ────────────

function seedIfEmpty() {
  if (_get(DATA_KEYS.apps).length > 0) return; // already seeded

  // Apps — localStorage only, never push seed data to Firebase
  localStorage.setItem(
    DATA_KEYS.apps,
    JSON.stringify([
      {
        id: _uid(),
        pinned: true,
        name: "Store",
        platform: "Web App",
        version: "v1.0",
        img: "https://i.postimg.cc/qRJFJjhQ/image.png",
        visual: "https://i.postimg.cc/85p8K3Xg/image.png",
        ctaimg: "https://i.postimg.cc/85p8K3Xg/image.png",
        short: "Explore the latest offerings, connect with reputable sellers.",
        desc: "Access meticulously designed digital and physical tools, including flirting guides, conversation frameworks, lifestyle enhancement programmes, and practical resources developed by Master Togan and verified contributors. Every item is selected or created to deliver tangible results in building attraction, confidence, and long-term connection. Browse and acquire a comprehensive collection of books on dating strategy, relationship psychology, self-mastery, and modern courtship.",
        rating: "4.4",
        ratingcount: "188",
        ratingtext:
          "The platform operates on a transparent buyer-seller model that ensures quality, fair pricing, and mutual respect",
        letter: "S",
        likes: 0,
        createdAt: new Date().toISOString(),
      },
      {
        id: _uid(),
        pinned: false,
        name: "Master",
        platform: "Web App",
        version: "v1.0",
        img: "https://i.postimg.cc/qRJFJjhQ/image.png",
        visual: "https://i.postimg.cc/qRJFJjhQ/image.png",
        ctaimg: "https://i.postimg.cc/qRJFJjhQ/image.png",
        short:
          "The home of Master Togan's world. Access all tools, content and community in one place.",
        desc: "Access meticulously designed digital and physical tools, including flirting guides, conversation frameworks, lifestyle enhancement programmes, and practical resources developed by Master Togan and verified contributors. Every item is selected or created to deliver tangible results in building attraction, confidence, and long-term connection.",
        rating: "4.4",
        ratingcount: "188",
        ratingtext:
          "The platform operates on a transparent buyer-seller model that ensures quality, fair pricing, and mutual respect",
        letter: "M",
        likes: 0,
        createdAt: new Date().toISOString(),
      },
      {
        id: _uid(),
        pinned: false,
        name: "Stories Vibe",
        platform: "Web App",
        version: "v1.0",
        img: "https://i.postimg.cc/508MnvsH/image.png",
        visual: "https://i.postimg.cc/508MnvsH/image.png",
        ctaimg: "https://i.postimg.cc/508MnvsH/image.png",
        short: "Short-form stories and experiences from the dating world.",
        desc: "Stories Vibe is a curated feed of real stories, insights and lived experiences from people navigating modern dating and relationships. Browse daily updates, relatable situations and raw honest takes on attraction, commitment and self-development.",
        rating: "4.2",
        ratingcount: "94",
        ratingtext:
          "Community-driven stories that reflect real dating dynamics and lived experiences.",
        letter: "S",
        likes: 0,
        createdAt: new Date().toISOString(),
      },
    ]),
  );

  // Books
  localStorage.setItem(
    DATA_KEYS.books,
    JSON.stringify([
      {
        id: _uid(),
        pinned: true,
        name: "The Red Pill Game",
        price: "$29.01",
        img: "https://i.postimg.cc/508MnvsH/image.png",
        visual: "https://i.postimg.cc/508MnvsH/image.png",
        ctaimg: "https://i.postimg.cc/508MnvsH/image.png",
        short:
          "The Red Pill Game is the foundational text for understanding modern dating dynamics as they truly are — not as you were told they should be.",
        desc: "The Wisdom of Master Togan. Learn the fundamental principles to unlock your inner GAME. This book strips away illusions and presents the raw truths about attraction, female nature, and what it really takes to win in the dating marketplace.",
        keypoints:
          "Understanding the real rules of attraction and modern dating. Deprogramming from idealised narratives that hold men back. Building a frame of abundance, self-worth and masculine purpose.",
        rating: "4.6",
        ratingcount: "3,240",
        ratingplatforms: "Gumroad, Selar, Payhip",
        ratingtext:
          "The book that started it all. Master Togan's original blueprint for the modern man.",
        likes: 0,
        createdAt: new Date().toISOString(),
      },
      {
        id: _uid(),
        pinned: false,
        name: "Cold Approach",
        price: "$19.99",
        img: "https://i.postimg.cc/508MnvsH/image.png",
        visual: "https://i.postimg.cc/508MnvsH/image.png",
        ctaimg: "https://i.postimg.cc/508MnvsH/image.png",
        short:
          "Cold Approach is the essential field manual for any man who wants to meet women in real life — without apps, without gimmicks, and without fear.",
        desc: "Learn the art of approaching women you've never met before with confidence and composure. This book covers openers, body language, tonality, and the mindset shifts required to make cold approach a natural part of your life.",
        keypoints:
          "Practical techniques for approaching women in any setting. Overcoming approach anxiety through progressive desensitisation. Reading signals and calibrating your energy to the environment.",
        rating: "3.8",
        ratingcount: "1,420",
        ratingplatforms: "Gumroad, Selar, Payhip",
        ratingtext:
          "In this guide you will learn exactly how to walk up to any woman and start a conversation that leads somewhere real.",
        likes: 0,
        createdAt: new Date().toISOString(),
      },
      {
        id: _uid(),
        pinned: false,
        name: "How to Flirt",
        price: "$14.99",
        img: "https://i.postimg.cc/508MnvsH/image.png",
        visual: "https://i.postimg.cc/508MnvsH/image.png",
        ctaimg: "https://i.postimg.cc/508MnvsH/image.png",
        short:
          "How to Flirt teaches you the subtle art of playful communication that sparks attraction and keeps her engaged.",
        desc: "Flirting is a skill, not a talent. This book breaks down the mechanics of teasing, push-pull dynamics, and how to create tension that makes interactions exciting.",
        keypoints:
          "Mastering the push-pull dynamic to keep conversations exciting. Using humour and wit to build instant chemistry. Reading her responses and escalating at the right pace.",
        rating: "4.1",
        ratingcount: "960",
        ratingplatforms: "Gumroad, Selar",
        ratingtext:
          "A concise playbook for understanding the language of flirtation and putting it to work immediately.",
        likes: 0,
        createdAt: new Date().toISOString(),
      },
      {
        id: _uid(),
        pinned: false,
        name: "The Money Game",
        price: "$34.99",
        img: "https://i.postimg.cc/508MnvsH/image.png",
        visual: "https://i.postimg.cc/508MnvsH/image.png",
        ctaimg: "https://i.postimg.cc/508MnvsH/image.png",
        short:
          "The Money Game is a no-nonsense guide to building financial power as a man and using it to elevate every area of your life.",
        desc: "Money changes everything. This book covers the mindset, strategies and disciplines needed to build wealth from scratch. It connects financial mastery with dating success, lifestyle freedom and long-term respect.",
        keypoints:
          "Building income streams that give you freedom and options. The psychology of money and how it affects attraction. Practical wealth-building strategies for the modern man.",
        rating: "4.5",
        ratingcount: "2,180",
        ratingplatforms: "Gumroad, Selar, Payhip",
        ratingtext:
          "Master Togan breaks down the real connection between financial discipline and romantic success.",
        likes: 0,
        createdAt: new Date().toISOString(),
      },
      {
        id: _uid(),
        pinned: false,
        name: "Frame Control",
        price: "$29.01",
        img: "https://i.postimg.cc/508MnvsH/image.png",
        visual: "https://i.postimg.cc/508MnvsH/image.png",
        ctaimg: "https://i.postimg.cc/508MnvsH/image.png",
        short:
          "Frame Control is a short yet powerful resource for any man who wishes to stop being reactive and start leading his romantic life with certainty and strength.",
        desc: "Your frame is how you see things. What you choose to focus on. The meaning you assign to those things. In any interaction, the various frames clash. The stronger frame wins, and becomes the consensus reality.",
        keypoints:
          "Drawing from real-world principles of self-improvement and interpersonal dynamics. Frame Control emphasizes discipline, high standards, and purposeful leadership.",
        rating: "3.4",
        ratingcount: "2,670",
        ratingplatforms: "Gumroad, Selar, Payhip",
        ratingtext:
          "In this short concise course you will learn how to control the frame and maintain a strong frame.",
        likes: 0,
        createdAt: new Date().toISOString(),
      },
    ]),
  );

  // Circles
  localStorage.setItem(
    DATA_KEYS.circles,
    JSON.stringify([
      {
        id: _uid(),
        name: "Alpha Kings",
        category: "Masculine World",
        platform: "X",
        about:
          "A circle for men building their best selves with discipline and purpose.",
        img: "https://i.postimg.cc/508MnvsH/image.png",
        url: "#",
        likes: 0,
        createdAt: new Date().toISOString(),
      },
      {
        id: _uid(),
        name: "Iron Mind",
        category: "Masculine World",
        platform: "X",
        about: "Mental toughness and masculine virtues in modern life.",
        img: "https://i.postimg.cc/508MnvsH/image.png",
        url: "#",
        likes: 0,
        createdAt: new Date().toISOString(),
      },
      {
        id: _uid(),
        name: "Purpose Driven",
        category: "Masculine World",
        platform: "X",
        about: "Live with intention, clear direction and unshakeable focus.",
        img: "https://i.postimg.cc/508MnvsH/image.png",
        url: "#",
        likes: 0,
        createdAt: new Date().toISOString(),
      },
      {
        id: _uid(),
        name: "Wild Brothers",
        category: "Wild & Adventures",
        platform: "X",
        about: "Brotherhood of men who embrace the outdoors and challenges.",
        img: "https://i.postimg.cc/508MnvsH/image.png",
        url: "#",
        likes: 0,
        createdAt: new Date().toISOString(),
      },
      {
        id: _uid(),
        name: "Peak Seekers",
        category: "Wild & Adventures",
        platform: "X",
        about: "Pushing limits through physical adventure and exploration.",
        img: "https://i.postimg.cc/508MnvsH/image.png",
        url: "#",
        likes: 0,
        createdAt: new Date().toISOString(),
      },
      {
        id: _uid(),
        name: "Nomad Code",
        category: "Wild & Adventures",
        platform: "X",
        about: "Life on your own terms — freedom, travel, and grit.",
        img: "https://i.postimg.cc/508MnvsH/image.png",
        url: "#",
        likes: 0,
        createdAt: new Date().toISOString(),
      },
      {
        id: _uid(),
        name: "Female Thoughts",
        category: "Romance",
        platform: "X",
        about: "The thoughts from female minds on dating and relationships.",
        img: "https://i.postimg.cc/508MnvsH/image.png",
        url: "https://x.com",
        likes: 280,
        createdAt: new Date().toISOString(),
      },
      {
        id: _uid(),
        name: "Inner Game",
        category: "Romance",
        platform: "X",
        about:
          "Master your inner world to attract and sustain great relationships.",
        img: "https://i.postimg.cc/508MnvsH/image.png",
        url: "#",
        likes: 0,
        createdAt: new Date().toISOString(),
      },
      {
        id: _uid(),
        name: "Social Dynamics",
        category: "Romance",
        platform: "X",
        about: "Understanding people, attraction and social environments.",
        img: "https://i.postimg.cc/508MnvsH/image.png",
        url: "#",
        likes: 0,
        createdAt: new Date().toISOString(),
      },
    ]),
  );

  // Posts
  localStorage.setItem(
    DATA_KEYS.posts,
    JSON.stringify([
      {
        id: _uid(),
        subject: "Definition of Predators in world",
        author: "Master Togan",
        date: "15 Apr ~ 26",
        color: "#7a3232",
        content:
          "Man: Be more masculine (stronger, bolder, more decisive). Woman: Be more feminine (softer, more submissive, more receptive). When the polarity is right, dating suddenly becomes simple",
        threads: [
          {
            title: "Step 1 - Be Direct",
            text: "When you see a girl you want, you approach her. When you want to kiss her, you kiss her. When you want to take her home, you lead her there.",
          },
          {
            title: "Step 2 - Lead Strongly",
            text: "No hesitation. No over-explaining. She wants to feel your raw, unapologetic masculine desire.",
          },
          {
            title: "Key Takeaways",
            text: "Be direct. Be hungry. Be unashamed. That's the kind of man women actually crave. No apologies. Just pure masculine intent.",
          },
          {
            title: "Book Recommendation",
            text: "Learn all the techniques and strategies to get better with women fast.",
          },
        ],
        timeframe: "~24min ago",
        ctaLabel: "Get Frame Control ~ $29.01",
        createdAt: new Date().toISOString(),
      },
      {
        id: _uid(),
        subject: "Masculine & Feminine",
        author: "Master Togan",
        date: "20 Apr ~ 26",
        color: "#b5601e",
        content:
          "Man: Be more masculine (stronger, bolder, more decisive). Woman: Be more feminine (softer, more submissive, more receptive). When the polarity is right, dating suddenly becomes simple.",
        threads: [],
        timeframe: "~2hrs ago",
        ctaLabel: "",
        createdAt: new Date().toISOString(),
      },
    ]),
  );

  // Quests
  localStorage.setItem(
    DATA_KEYS.quests,
    JSON.stringify([
      {
        id: _uid(),
        subject: "How do you approach a girl in a club",
        author: "Master Togan",
        threads: [
          {
            title: "Step 1 - Eye Contact",
            text: "Lock eyes across the room. If she holds your gaze, she's interested. Walk over with confidence.",
          },
          {
            title: "Step 2 - Open Direct",
            text: "Don't overthink it. Walk up, introduce yourself, and tell her she caught your attention.",
          },
        ],
        thumbsUp: 24,
        thumbsDown: 2,
        createdAt: new Date().toISOString(),
      },
      {
        id: _uid(),
        subject: "What is the best way to build confidence",
        author: "Master Togan",
        threads: [
          {
            title: "Daily Practice",
            text: "Confidence is built through repeated action. Start small — talk to one stranger a day. Gradually increase the stakes.",
          },
        ],
        thumbsUp: 18,
        thumbsDown: 1,
        createdAt: new Date().toISOString(),
      },
    ]),
  );

  // Notifications
  localStorage.setItem(
    DATA_KEYS.notifications,
    JSON.stringify([
      {
        id: _uid(),
        title: "Welcome to the Battlefield",
        author: "Master Togan",
        content:
          "You've officially stepped into the arena. Stay sharp, stay focused, and keep building.",
        timeframe: "~24min ago",
        createdAt: new Date().toISOString(),
      },
      {
        id: _uid(),
        title: "Master Togan & Weekend Vibes",
        author: "Master Togan",
        content:
          "The weekend is your training ground. Use it wisely while others waste it.",
        timeframe: "~4hr ago",
        createdAt: new Date().toISOString(),
      },
      {
        id: _uid(),
        title: "Have you Heard about the Red Pill Game",
        author: "Master Togan",
        content:
          "Women can switch up fast. One day she's all over you, calling you \"baby,\" and acting like you're her whole world. A few weeks or months later, she can disappear, ghost, or act like you never mattered.",
        timeframe: "~3d ago",
        createdAt: new Date().toISOString(),
      },
      {
        id: _uid(),
        title: "Master Introduction",
        author: "Master Togan",
        content:
          "The weekend is your training ground. Use it wisely while others waste it.",
        timeframe: "~4hr ago",
        createdAt: new Date().toISOString(),
      },
      {
        id: _uid(),
        title: "This Weekend is for Improving Your Game",
        author: "Master Togan",
        content:
          "The weekend is your training ground. Use it wisely while others waste it.",
        timeframe: "~4hr ago",
        createdAt: new Date().toISOString(),
      },
    ]),
  );

  // Subscribers (empty by default)
  localStorage.setItem(DATA_KEYS.subscribers, JSON.stringify([]));

  // Profile
  localStorage.setItem(
    DATA_KEYS.profile,
    JSON.stringify({
      mentorshipPrice: "$14.01",
      mentorshipPeriod: "/Monthly",
      aboutText:
        "Master Togan is an author and coach specializes in helping individuals build strong, purposeful lives and successful relationships.\n\nHis teaching focuses on three core pillars:\n• Putting your mission first\n• Building a powerful lifestyle\n• Achieving financial independence\n\nMaster Togan provides clear, practical guidance on how both men and women should behave to attract love, maintain healthy relationships, and avoid common mistakes in dating and marriage. His content emphasizes discipline, high standards, patience in partner selection, and sacrificing short-term pleasures for long-term success.\n\nWith a direct and no-nonsense approach, he shares actionable advice on self-improvement, masculinity, femininity, attraction, and sustaining meaningful connections.",
    }),
  );
}

seedIfEmpty();

// ── Block page seed (stories / recommends / polls) ────────
// Runs independently so existing users also get block seed data.
function seedBlockIfEmpty() {
  if (_get(DATA_KEYS.stories).length > 0) return;

  localStorage.setItem(
    DATA_KEYS.stories,
    JSON.stringify([
      {
        id: _uid(),
        label: "Wild",
        subject: "When Passion Feels Like Fireworks but Burns Out Too Fast",
        author: "Master Togan",
        body: "It started on a humid Friday night in Lagos. He wasn't planning to meet anyone—just out with friends at a rooftop party overlooking the city lights. The music was pulsing, laughter filled the air, and then he saw her. She had that magnetic energy: bold, carefree, and impossible to ignore. Within minutes, they were talking like old friends, sharing jokes, and daring each other to dance harder than the DJ's beats.\n\nBy midnight, they slipped away from the crowd, sprinting down the street to grab suya from a roadside stand. They ate with their hands, laughing at the mess, and the night felt like a movie scene. The next few weeks were a blur of late-night adventures, spontaneous trips, and fiery passion. Every moment was unpredictable—one day they were skydiving, the next they were arguing over something trivial.\n\nThe thrill was intoxicating, but cracks began to show. Their connection was built on adrenaline, not stability. He realized that while the wild energy kept things exciting, it also made trust fragile and communication shaky. Eventually, the fire burned out, leaving behind lessons about the difference between passion and partnership.",
        takeaways: [
          "Chemistry isn't enough – attraction can spark, but compatibility sustains.",
          "Excitement fades, values endure – shared principles matter more than thrill.",
          "Boundaries protect you – don't ignore red flags just because the ride feels fun.",
          "Slow down to build deep – real love is built in calm moments, not just highs.",
          "Know your needs – excitement is valid, but so is peace, trust, and consistency.",
        ],
        likes: 0,
        totalRatingScore: 0,
        totalRatingCount: 0,
        createdAt: new Date("2026-04-18").toISOString(),
      },
      {
        id: _uid(),
        label: "Romance",
        subject: "Small Acts of Care Turn Into Lasting Love",
        author: "Master Togan",
        body: "He wanted something different—something meaningful. So instead of a flashy first date, he chose a quiet dinner at a small, cozy restaurant tucked away by the waterfront. He arrived early, dressed neatly, and greeted her with genuine warmth. Over dinner, he didn't just talk about himself; he asked questions, listened intently, and shared stories that revealed his character. She felt seen, valued, and safe.\n\nWeeks passed. He remembered small things—her favourite drink, the name of her childhood dog, the book she mentioned wanting to read. He sent it without being asked. He showed up on time. He said what he meant. No games, no mixed signals.\n\nThose small, consistent acts of care spoke louder than grand gestures ever could. She found herself looking forward to every conversation, every quiet evening, every message. The relationship deepened not through drama or intensity, but through reliability and presence. That is the kind of love that lasts.",
        takeaways: [
          "Attention is the highest form of love – remember what matters to her.",
          "Consistency builds trust – showing up repeatedly is more powerful than one grand gesture.",
          "Listen to understand, not to respond – make her feel genuinely heard.",
          "Actions speak permanently – let your behaviour define your character.",
          "Peace is romantic – a calm, stable connection is a sign of real depth.",
        ],
        likes: 0,
        totalRatingScore: 0,
        totalRatingCount: 0,
        createdAt: new Date("2026-04-14").toISOString(),
      },
    ]),
  );

  localStorage.setItem(
    DATA_KEYS.recommends,
    JSON.stringify([
      {
        id: _uid(),
        subject:
          "Money can't talk but it can hear, if you call it, it will come",
        author: "Master Togan",
        items: [
          "Money can't talk but it can hear, if you call it, it will come.\n\nBut you gotta understand how to get it.",
          "Most men chase money with desperation. Desperation repels. Build value, build skills, build discipline — money follows that energy.",
          "Money is fine as a bonus, but never make it your main selling point.\n\nBest approach:\n\nBuild yourself into a high-value man first — strong body, strong mindset, strong game.",
          "The men who have money and still can't attract anyone — they skipped the fundamentals. Financial success without personal growth is just a richer version of the same problem.",
          "Invest in yourself before you invest in anything else. Your mind is your most valuable asset.",
        ],
        ctaLabel: "Get The Money Game",
        ctaUrl: "#",
        createdAt: new Date("2026-04-12").toISOString(),
      },
      {
        id: _uid(),
        subject:
          "The ability to walk up and start conversations with women in everyday situations",
        author: "Master Togan",
        items: [
          "Cold approach is the most underrated skill a man can develop. It builds confidence, character, and options.",
          "Most men are waiting for the perfect moment. There is no perfect moment. There is only the moment you decide to move.",
          "She doesn't care about your opening line. She cares about your energy, your eye contact, your composure. Speak from that place.",
          "Every approach — successful or not — makes you more comfortable in your own skin. The rep matters more than the result.",
          "Stop asking for permission to be interested. Walk up, introduce yourself, and lead from there.",
        ],
        ctaLabel: "Get Cold Approach",
        ctaUrl: "#",
        createdAt: new Date("2026-04-07").toISOString(),
      },
    ]),
  );

  localStorage.setItem(
    DATA_KEYS.polls,
    JSON.stringify([
      {
        id: _uid(),
        subject: "How do you show interest in someone you like?",
        options: [
          { text: "Direct and confident approach", votes: 100 },
          { text: "Subtle hints and playful teasing", votes: 150 },
          { text: "Let actions speak louder than words", votes: 2250 },
        ],
        totalVotes: 2500,
        status: "ended",
        endsAt: null,
        createdAt: new Date("2026-04-10").toISOString(),
      },
      {
        id: _uid(),
        subject: "What's most attractive in a partner to you?",
        options: [
          { text: "Confidence and ambition", votes: 2100 },
          { text: "Kindness and emotional depth", votes: 4620 },
          { text: "Humor and playfulness", votes: 3781 },
        ],
        totalVotes: 10501,
        status: "ended",
        endsAt: null,
        createdAt: new Date("2026-04-05").toISOString(),
      },
    ]),
  );
}

seedBlockIfEmpty();
