# Master's Hut — Full Webapp Documentation

---

## 1. Overview

**Master's Hut** is a mobile-first Single Page Application (SPA) built with vanilla HTML, CSS, and JavaScript — no frameworks, no build step. It belongs to Master Togan and serves as a central hub for content, tools, community, and commerce around dating and masculine self-development.

### Core Traits

- Mobile-only by design. Tablet and desktop users are shown a redirect/error page.
- All content is stored in Firebase Realtime Database and cached in `localStorage`. No page reloads are needed for updates.
- Every user-facing page is a clean URL (`/feed`, `/store`, `/post/<id>`, etc.) supported by Vercel's SPA rewrite rule.
- The admin panel lives at `/admin` and is completely separate from the public-facing app.

---

## 2. Technology Stack

| Layer   | Technology                                                |
| ------- | --------------------------------------------------------- |
| Markup  | HTML5 — one shell `index.html`, page partials in `pages/` |
| Styling | CSS — one file per page in `css/`                         |
| Logic   | Vanilla JavaScript — one file per page in `js/`           |
| Data    | Firebase Realtime Database + `localStorage` cache         |
| Hosting | Vercel (SPA rewrite: all paths → `index.html`)            |
| Fonts   | Custom font loaded via `font.css` from `font/` folder     |

---

## 3. File Structure

```
index.html           ← Shell: header, footer nav, <main> mount point
appindex.js          ← Boot script: loads page partials + JS in order
vercel.json          ← Hosting config (SPA rewrite rule)
font.css             ← Custom font declarations

pages/               ← HTML partials injected into <main> at boot
  home.html
  profile.html
  feed.html
  quest.html
  block.html
  noti.html
  menu.html
  about.html

js/                  ← Page logic (loaded after partials)
  index.js           ← Global bootstrap: router, nav, page switching
  home.js
  profile.js
  feed.js
  quest.js
  block.js
  noti.js
  menu.js
  about.js
  error.js

css/                 ← Styles per page
  index.css
  home.css  profile.css  feed.css  quest.css
  block.css  noti.css  menu.css  about.css  error.css
  universal-modal.css

shared/
  data.js            ← DataStore API + Firebase sync
  universal-modal.js ← Shared alert/confirm modal component

admin/               ← Admin panel (separate SPA)

404.html / 500.html / 503.html / 504.html / error.html
```

---

## 4. Boot Sequence

When a user opens any URL, the following happens in order:

1. **`index.html` loads** — renders the shell: header, empty `<main>`, footer nav.
2. **`appindex.js` runs** — the `boot()` function:
   - Fetches all 8 page HTML partials in parallel (`home.html`, `profile.html`, etc.).
   - Injects all of them into `<main>`. All pages exist in the DOM simultaneously; visibility is controlled by `display`.
   - Loads `shared/data.js` (DataStore API).
   - Calls `DataStore.syncFromRemote()` — fetches all content from Firebase and writes it to `localStorage`. This is **awaited** so content is ready before any page renders.
   - Loads all JS files in order: `index.js`, `home.js`, `profile.js`, `feed.js`, `quest.js`, `noti.js`, `menu.js`, `about.js`, `block.js`.
   - When each script loads, it renders its page from the now-populated `localStorage`.
   - After all scripts load, `DataStore.startSync()` opens a Firebase SSE stream for real-time updates.
3. **`index.js` runs** — calls `_router()` which reads the URL and shows the right page, storing any deep-link target in `window._routerDeepLink` for the relevant page script to pick up after rendering.
4. **Each page script runs** — renders content from DataStore, then checks `window._routerDeepLink` to handle direct URL opens (e.g. `/post/<id>`).

---

## 5. Data Layer — DataStore

`shared/data.js` exports a global `DataStore` object. It is the single source of truth for all content.

### Collections (synced with Firebase)

| Collection      | Contents                                           |
| --------------- | -------------------------------------------------- |
| `apps`          | Store apps                                         |
| `books`         | Store books                                        |
| `circles`       | Store circles                                      |
| `posts`         | Feed posts                                         |
| `quests`        | Quest items                                        |
| `notifications` | Notification cards                                 |
| `stories`       | Block → Stories tab                                |
| `recommends`    | Block → Updates tab                                |
| `polls`         | Block → Poll tab                                   |
| `subscribers`   | Email subscription entries                         |
| `profile`       | Single profile object (likes, visitor count, etc.) |
| `messages`      | Contact/message submissions                        |
| `sales`         | Sales records                                      |

### DataStore API

```js
DataStore.getAll("posts")            // returns full array
DataStore.getById("posts", id)       // returns one item or null
DataStore.add("posts", { ... })      // creates + assigns id + createdAt
DataStore.update("posts", id, {...}) // merges updates + sets updatedAt
DataStore.remove("posts", id)        // deletes item
DataStore.reorder("posts", id, 2)   // moves item to index 2
DataStore.count("posts")             // returns length

DataStore.getProfile()               // returns profile object
DataStore.setProfile({ key: val })   // merges + syncs to Firebase
```

### Sync Flow

- **On boot**: `syncFromRemote()` does a one-time `GET /mt.json` and writes all collections to `localStorage`.
- **Real-time**: `startSync()` opens a Firebase SSE connection. Every change from any device/tab updates `localStorage` and dispatches a `mt:remote-update` event so the UI refreshes without reloading.
- **On write**: Every `DataStore.update/add/remove` call also pushes the full collection to Firebase via `_remoteSet()` (fire-and-forget `PUT`).

---

## 6. Global Layout

### Header (always visible)

- **Left side**: Profile icon + "Master's Hut" title → tapping opens Profile page.
- **Right side**:
  - Bell icon with red dot → opens Notifications page.
  - Store/menu icon with dot → opens Store page.

### Footer Navigation Bar (always visible)

Five nav items, each with an icon and label:

| Nav Item | `data-nav` | Page Shown     |
| -------- | ---------- | -------------- |
| Home     | `home`     | Home page      |
| Feed     | `feed`     | Feed page      |
| Quest    | `Quest`    | Quest page     |
| Block    | `Block`    | Block page     |
| App      | `about`    | About/App page |

- Feed, Quest, and Block each have a red unread dot that appears when new content has been added since the user's last visit.
- The active nav item gets an `.active` CSS class.

### Main Content Area

- A single `<main class="main">` element holds all page partials.
- All pages are in the DOM simultaneously. Only the active one has `display: block` (or `flex`); all others are `display: none`.
- `hideAllPages()` in `index.js` hides every page and resets all open panels/expanded states before switching to a new page.

---

## 7. Pages

### 7.1 Home Page

**URL:** `/` or `/home`

The home page is a marketing-style landing split into multiple full-height blocks:

- **Block 1 — Hero**: Title "Master's Hut", tagline "Essential Dating World with Master Togan", three visual images.
- **Block 2 — Library**: A 25-icon grid (`home-library-grid`), rendered dynamically by `home.js`. Labeled "Store & Library".
- **Block 3 — Apps**: Large headline, three app icons. Static content.
- **Block 4** _(and further blocks)_: Additional marketing sections with taglines and visuals.
- **Block 5 — Subscribe form**: Name + email inputs. On submit, creates a `subscribers` entry in DataStore. Button briefly shows "Subscribed!" on success.

### 7.2 Profile Page

**URL:** `/profile`

Displays Master Togan's personal profile. Has three internal sub-views navigated by tapping a board button.

**Profile Home View:**

- Hero image (profile photo).
- Three action buttons in a row:
  - **Call** — triggers `tel:` link.
  - **Email** — copies the email address to clipboard, shows a modal confirmation.
  - **Like** — global like counter. One like per device stored in `localStorage`. Counter synced to Firebase.
- Large gradient "Master Togan" title.
- Three square board buttons that open sub-views:

| Board      | Sub-View                                    |
| ---------- | ------------------------------------------- |
| Mentorship | Mentorship details panel                    |
| Message    | Message/contact panel                       |
| About      | Expanded about/bio panel with search filter |

**Sub-Views:**

- Each sub-view replaces the profile home with a full-page view.
- A back button (or tapping the header) returns to the profile home.
- The About sub-view has a search filter that filters boards by label/text.
- Each sub-view may contain `.profile-sub-board` toggle items that expand/collapse on tap.

**X (Twitter) Link:** A profile X/Twitter link button that opens an external link.

### 7.3 Feed Page

**URL:** `/feed`

A chronological content stream of posts from Master Togan.

**Layout:**

- Header with title "Master's Feed", unread dot, and a back/feed icon.
- Scrollable list of post cards.

**Post Card (collapsed):**

- Profile image, subject/title, author name.
- Short content preview.
- "Read More..." label if the post has thread content.
- Footer row: like count + impression count on the left; timestamp + optional CTA tag on the right.

**Post Card (expanded):**

- Tap any collapsed post to expand it. All other posts hide; this post fills the view.
- Full content + thread blocks (title: body paragraphs) are shown.
- Back icon or tapping the feed header collapses back to the list.

**Interactions:**

- **Like**: Tap the heart icon to like. One like per device (localStorage key `mt_post_like_<id>`). A rapid-click guard (`btn.dataset.busy`) prevents miscounting.
- **Impression**: Counted once per device per post (localStorage key `mt_post_imp_<id>`) when the post is first expanded.
- **CTA Tag**: If a post is linked to a store item (app, book, or circle), a colored tag appears. Its label is derived live from the current item's data. Tapping opens the external CTA URL.

**Unread Dot:** Red dot appears on the nav icon and header when posts exist that aren't in the device's seen list (`localStorage` key `mt_feed_seen`). Cleared when the page is opened.

**Shareable URL:** Opening a post pushes `/post/<id>` to browser history. Sharing that URL loads the feed page with that specific post already expanded.

### 7.4 Quest Page

**URL:** `/quest`

A collection of questions, challenges, and frameworks with voted solutions.

**Layout:**

- Header with title "Master's Quest", unread dot, and quest icon.
- Scrollable list of quest boards.

**Quest Board (collapsed):**

- Question/subject (auto-appended `?` if missing).
- "Open to Read Solution" label if a solution exists.
- Thumbs up / thumbs down vote buttons with counts.

**Quest Board (expanded):**

- Tap to expand — all other boards hide, this one fills the view.
- Shows the full solution (thread blocks: title + text paragraphs).
- Shows a "Key Takeaway" block if one exists.
- Back icon or header tap collapses back to list.

**Voting:**

- One vote per device per quest (localStorage key `mt_quest_vote_<id>` stores `"up"` or `"down"`).
- Voting is only active when a quest is expanded.
- Tapping the same vote button again removes the vote. Tapping the other button switches it.

**Unread Dot:** Same pattern as Feed — appears when new quests exist, cleared on page open.

**Shareable URL:** Opening a quest pushes `/quest/<id>`. Sharing that URL lands on the quest expanded.

### 7.5 Block Page

**URL:** `/block`

A multi-tab content hub with three independent content types.

**Tabs (always visible at top):**

| Tab          | Label   | Content              |
| ------------ | ------- | -------------------- |
| `stories`    | Stories | Story cards          |
| `recommends` | Updates | Recommendation cards |
| `polls`      | Poll    | Poll cards           |

**Stories Tab:**

- Cards show: label, subject, author, 244-character body preview, rating badge.
- Heart icon on each card to like/unlike a story (one per device per story).
- Tap a card (not the heart) → opens **Full Story View**.

**Full Story View:**

- Replaces the tab list with a full-page reading view.
- Shows: label, subject, author, all body paragraphs + extra paragraphs, Lessons & Takeaways list.
- 5-star rating section at the bottom — one rating per device per story, undo by tapping the same star.
- Back icon or header area tap returns to the stories list.
- **Shareable URL:** `/story/<id>`

**Updates Tab (Recommends):**

- Cards show: icon, subject, short date, "Read More..." label, optional CTA link.
- Tap a card → opens **Full Update View**.

**Full Update View:**

- Shows: icon, subject, up to 5 recommendation items, author, date, CTA button.
- Back icon returns to the list.
- **Shareable URL:** `/update/<id>`

**Poll Tab:**

- Shows poll cards with subject, up to 3 vote options, status (ongoing / ended with vote count).
- Each option shows current percentage.
- One vote per device per poll. After voting, all options become non-interactive.
- Ended polls display "Final Result".

**Unread Dot:** Appears on the nav icon when any story, recommend, or poll is new. Cleared on page open.

### 7.6 Notifications Page

**URL:** `/notifications`

Accessible via the bell icon in the header (not in the bottom nav, which is commented out).

**Layout:**

- Hero section with bell icon and "Notification" title.
- Search bar to filter notifications by text.
- Summary line showing total count + unread count.
- Scrollable list of notification cards, grouped by date.

**Notification Card:**

- Shows title, body, and relative timestamp.
- Unread cards have a visual badge/indicator.
- Tapping a card marks it as read (stored in `localStorage` key `mt_noti_read`).

**Unread Dot:** Red dot on the header bell icon when unread notifications exist.

### 7.7 Store / Menu Page

**URL:** `/store` or `/menu`

The store is the shopping and discovery hub. It has three tabs (Apps, Books, Circle) and a detail panel system.

**Store Home View:**

- "store" hero text at the top.
- Tab switcher: **Apps** | **Books** | **Circle**
- Search bar with live filtering.
- Filter icon acts as a "back" button when inside an expand view.

---

#### 7.7.1 Apps Tab

**URL for tab:** `/store` (with Apps active)

**Layout:**

- **Pinned App Board**: The one app marked as `pinned: true` is shown prominently at the top with name, short description, and "View >>" CTA.
- **Alphabetical groups**: All remaining apps are sorted A-Z and grouped by first letter. Each group is shown as a labeled section with a grid of icon + name items.
- **Expand View**: Tapping a letter-group header opens an expand view showing only that group's items in a larger grid. The filter icon becomes a back button.

**App Detail Panel (`/app/<slug>`):**

Tapping any app item opens a full-page slide-in panel showing:

- Topbar with back button, "Apps" label, app name, and app icon.
- **Hero row**: large icon + app name, category, short description, price.
- **Visual strip**: two promo images (falls back to default if less than two provided).
- **CTA button**: links to the app's external URL.
- **Description section**: full description text.
- **Likes**: heart button with count. One like per device (`mt_app_like_<id>`).
- **Tags**: category labels.
- **Visual board 2**: additional screenshots.
- Back button returns to store home and updates URL back to `/store`.

---

#### 7.7.2 Books Tab

**URL for tab:** `/store` (with Books active)

**Layout:**

- Sorted and grouped like Apps (alphabetical by first letter).
- Expand view per group.

**Book Detail Panel (`/book/<slug>`):**

Tapping a book item opens a panel showing:

- Topbar with back button, "Books" label, book name, and icon.
- **CTA cover image**: wide banner/cover image (16:9 aspect ratio).
- **Book hero**: icon + name + genre + short description + price.
- **Platform links**: if multiple purchase URLs exist, each platform is shown as a separate link button.
- **Description**: full book description.
- **Ratings panel**: star rating system + ratings overlay.
- **Visual strip**: two promo images.
- **Likes**: same as apps.
- Back button returns to store home.

---

#### 7.7.3 Circle Tab

**URL for tab:** `/store` (with Circle active)

Circles are community groups/platforms (e.g. a Discord, Telegram, or external community).

**Layout:**

- Grouped by category/platform name rather than letter.
- A "circle board section" shows groups visually.

**Circle Detail Panel (`/circle/<slug>`):**

Tapping a circle item opens a panel showing:

- Topbar with back button, "Circle" label, circle name.
- Platform name badge.
- Full description.
- Member count / status.
- CTA button to join the external circle URL.
- Likes.
- Back button returns to store home.

---

#### 7.7.4 Store Search

The search bar in the store header filters whichever tab is currently active:

- Filters items whose name matches the typed text (case-insensitive).
- Works in normal list view and inside expand views.
- Placeholder text changes per tab: "Search Apps", "Search Books", "Search Circle".

### 7.8 About / App Page

**URL:** `/about`

This page is labeled "App" in the nav bar but contains app information and policy sections.

**Layout:**

- Hero with "App" title and a search bar.
- A vertical list of expandable accordion boards.

**Boards (expand/collapse on tap):**

- **About** — ownership and copyright statement.
- **How to Use App** — user guide explaining every page of the app.
- **Privacy** — privacy policy.
- Other policy/info sections as added.

**Search Filter:**

- Typing in the search bar shows only boards whose label or text content matches.
- Matching is live as the user types.

---

## 8. URL Routing

The app uses the HTML5 History API for clean shareable URLs. `vercel.json` rewrites all paths to `index.html` so direct URL opens work.

### URL Map

| URL Pattern      | Page Shown    | Detail                            |
| ---------------- | ------------- | --------------------------------- |
| `/`              | Home          | Default landing                   |
| `/home`          | Home          | Alias for `/`                     |
| `/profile`       | Profile       | Profile home view                 |
| `/feed`          | Feed          | Posts list                        |
| `/post/<id>`     | Feed          | Specific post expanded            |
| `/quest`         | Quest         | Quests list                       |
| `/quest/<id>`    | Quest         | Specific quest expanded           |
| `/block`         | Block         | Block page, Stories tab           |
| `/story/<id>`    | Block         | Specific story full view          |
| `/update/<id>`   | Block         | Specific recommendation full view |
| `/store`         | Store         | Store home, Apps tab              |
| `/menu`          | Store         | Alias for `/store`                |
| `/app/<slug>`    | Store         | App detail panel open             |
| `/book/<slug>`   | Store         | Book detail panel open            |
| `/circle/<slug>` | Store         | Circle detail panel open          |
| `/notifications` | Notifications | —                                 |
| `/notif`         | Notifications | Alias                             |
| `/about`         | About/App     | —                                 |

### Slug Format

Item slugs are generated from the item's name:

- Lowercased, trimmed.
- Non-alphanumeric characters removed.
- Spaces replaced with `-`.
- Multiple dashes collapsed to one.

Example: `"Frame Control"` → `frame-control`, `"My App Pro!"` → `my-app-pro`

### Deep-Link Mechanism

When the URL targets an inner item (e.g. `/post/abc123`), the router runs **before** the page scripts have loaded. To solve this:

1. The router calls `showPage()` to activate the correct page visually.
2. It stores `window._routerDeepLink = { type: "post", id: "abc123" }`.
3. After each page script finishes rendering its content, it checks `window._routerDeepLink` and opens the specific item, then clears the flag.

### Back / Forward Navigation

- `window.addEventListener("popstate", () => _router())` handles browser back/forward.
- When opening a detail panel (post, quest, story, app, etc.), a `history.pushState` call records the URL.
- When closing a panel, `history.replaceState` reverts the URL to the parent page cleanly.
- `history.replaceState` is used (not `pushState`) when arriving from a direct URL to avoid a duplicate history entry.

---

## 9. Unread Dots & Seen State

Each content page tracks which items the current device has already seen, stored in `localStorage`:

| Page          | localStorage Key | What It Tracks                         |
| ------------- | ---------------- | -------------------------------------- |
| Feed          | `mt_feed_seen`   | Array of seen post IDs                 |
| Quest         | `mt_quest_seen`  | Array of seen quest IDs                |
| Block         | `mt_block_seen`  | Array of seen story/recommend/poll IDs |
| Notifications | `mt_noti_read`   | Array of read notification IDs         |

- Dots appear when new items exist that are not in the seen array.
- Dots are cleared (seen list updated) when the user opens the respective page.

---

## 10. Real-Time Updates

When data changes from any device (e.g. the admin publishes a new post):

1. Firebase SSE fires a `put` event to all connected clients.
2. `data.js` receives it, updates `localStorage`.
3. A custom DOM event `mt:remote-update` is dispatched.
4. `index.js` listens for this event and calls the appropriate re-render function for the currently visible page (e.g. `renderFeedPosts()`, `syncFeedCounts()`).
5. Counts (likes, impressions, thumbs) are updated surgically without a full re-render, preserving expanded states.

---

## 11. Analytics — Visitor Tracking

A daily unique visitor count is tracked per device:

- On each page load, `index.js` checks if `localStorage` has a key `mt_visited_<YYYY-MM-DD>` for today's UTC date.
- If not, it sets the key, reads the current `profile.dailyVisits`, increments it (or resets to 1 if the date changed), and writes it back to `DataStore.setProfile()`.
- This syncs to Firebase so the admin dashboard can display today's visitor count.
- Resets automatically at UTC midnight (new date = new key).

---

## 12. Error Pages

| File         | Code    | Shown When                                              |
| ------------ | ------- | ------------------------------------------------------- |
| `404.html`   | 404     | Page/resource not found                                 |
| `500.html`   | 500     | Server error                                            |
| `503.html`   | 503     | Service unavailable                                     |
| `504.html`   | 504     | Timeout (also used for tablet/desktop redirect message) |
| `error.html` | Dynamic | Catch-all, receives `?code=` query param                |

`appindex.js` redirects to `error.html?code=<N>` if the boot sequence fails (network error, timeout, Firebase failure). If the device is offline, it redirects to the `0` code page.

---

## 13. Admin Panel

Located at `/admin`. A completely separate SPA with its own `appindex.js`, pages, and scripts.

The admin panel allows Master Togan to:

- Create, edit, delete, and reorder all content (posts, quests, stories, updates, polls, apps, books, circles, notifications).
- Manage subscribers, messages, and sales records.
- View stats (daily visitors, likes, impressions).
- Control which app is "pinned" (featured at top of store).
- Set and change the admin PIN.

Admin writes use the same `DataStore` API as the public app. All changes sync to Firebase and propagate to all connected user devices in real time.

---

## 14. Hosting

- **Platform**: Vercel
- **SPA Rewrite**: All incoming paths are served `index.html` so History API URLs work as direct links.
- **Trailing slash**: Disabled (`"trailingSlash": false`).
- **`vercel.json`**:
  ```json
  {
    "trailingSlash": false,
    "rewrites": [{ "source": "/(.*)", "destination": "/index.html" }]
  }
  ```
- **Domain**: `https://master-t.vercel.app` (production)

---

## 15. Open Graph / Social Sharing

`index.html` includes full Open Graph and Twitter Card meta tags so shared links render rich previews on WhatsApp, Twitter/X, Discord, LinkedIn, etc.:

- `og:title` — "Master's Hut — get In With game"
- `og:description` — "Apps, books, circles and insights from Master Togan. Join the hut."
- `og:image` — Banner image URL
- `og:url` — Site URL
- `twitter:card` — `summary_large_image`

---

## 16. Key localStorage Keys Reference

| Key Pattern                 | Purpose                                             |
| --------------------------- | --------------------------------------------------- |
| `mt_apps`, `mt_books`, etc. | Cached collection data from Firebase                |
| `mt_profile`                | Profile object (likes, visitor date/count)          |
| `mt_post_like_<id>`         | Records that this device liked a post               |
| `mt_post_imp_<id>`          | Records that this device opened a post (impression) |
| `mt_quest_vote_<id>`        | Stores `"up"` or `"down"` vote for a quest          |
| `mt_story_like_<id>`        | Like state for a story                              |
| `mt_story_rated_<id>`       | Star rating (1–5) given to a story                  |
| `mt_poll_voted_<id>`        | Option index voted for in a poll                    |
| `mt_feed_seen`              | JSON array of seen post IDs                         |
| `mt_quest_seen`             | JSON array of seen quest IDs                        |
| `mt_block_seen`             | JSON array of seen block item IDs                   |
| `mt_noti_read`              | JSON array of read notification IDs                 |
| `mt_visited_<YYYY-MM-DD>`   | Marks this device as counted for that UTC date      |
| `mt_admin_pin`              | Admin PIN (admin panel only)                        |
