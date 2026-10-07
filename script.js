/* ==========================================================================
   Portfolio runtime
   1. Draws the pixel-art sprites as inline SVG (no image files needed)
   2. Turns any .video[data-youtube] into a thumbnail that opens YouTube
   3. Scroll reveal + retro stat-bar fill
   ========================================================================== */
(function () {
  'use strict';

  /* ------------------------------------------------------------------
     1. PIXEL ART
     Each sprite is an 8x8 character map. '.' is transparent; every other
     character indexes the shared palette below.
     ------------------------------------------------------------------ */
  var PALETTE = {
    k: '#0a0814', // outline (violet-black)
    w: '#ffffff', // highlight
    y: '#fbbf24', // reward gold
    o: '#d97706', // gold shade
    r: '#f43f5e', // rose
    d: '#9f1239', // rose shade
    c: '#22d3ee', // electric cyan
    p: '#ec4899', // magenta
    u: '#a855f7', // electric violet
    g: '#4ade80', // lime
    b: '#6366f1', // indigo
    s: '#c7d2fe', // silver-indigo
    e: '#6366a8', // steel shade
    n: '#b45309'  // wood / cork
  };

  var SPRITES = {
    coin: [
      '..kkkk..',
      '.kyyyyk.',
      'kywwyoyk',
      'kywyyoyk',
      'kyyyyoyk',
      'kyyooyyk',
      '.kooook.',
      '..kkkk..'
    ],
    heart: [
      '.kk..kk.',
      'krrkkrrk',
      'krrrrrrk',
      'krrrrrrk',
      'krrrrrrk',
      '.krrrrk.',
      '..kddk..',
      '...kk...'
    ],
    star: [
      '...kk...',
      '..kyyk..',
      '..kyyk..',
      'kkyyyykk',
      'kyyyyyyk',
      '.kyyyyk.',
      '.ky..yk.',
      '.k....k.'
    ],
    trophy: [
      'kkkkkkkk',
      'kyyyyyyk',
      '.kyyyyk.',
      '..kyyk..',
      '..kkkk..',
      '...kk...',
      '..kkkk..',
      '.kkkkkk.'
    ],
    floppy: [
      'kkkkkkkk',
      'kssssssk',
      'kskkkksk',
      'kskeeesk',
      'kskeeesk',
      'kssssssk',
      'kssssssk',
      'kkkkkkkk'
    ],
    potion: [
      '...nn...',
      '..nnnn..',
      '..kkkk..',
      '.krrrrk.',
      'krwrrrrk',
      'krrrrrrk',
      '.krrrrk.',
      '..kkkk..'
    ],
    sword: [
      '...kk...',
      '..kssk..',
      '..kssk..',
      '..kssk..',
      'kkksskkk',
      '..knnk..',
      '..knnk..',
      '...kk...'
    ],
    ghost: [
      '..kkkk..',
      '.kppppk.',
      'kpwppwpk',
      'kpwppwpk',
      'kppppppk',
      'kppppppk',
      'kppppppk',
      'kkkkkkkk'
    ],
    invader: [
      '..k..k..',
      '...kk...',
      '..kkkk..',
      '.kkkkkk.',
      'kk.kk.kk',
      'kkkkkkkk',
      '..k..k..',
      '.k....k.'
    ],
    joystick: [
      '...kk...',
      '..kcck..',
      '..kcck..',
      '...kk...',
      '...kk...',
      '.kkkkkk.',
      'kssssssk',
      'kkkkkkkk'
    ],
    play: [
      'w.......',
      'www.....',
      'wwwww...',
      'wwwwwww.',
      'wwwwwww.',
      'wwwww...',
      'www.....',
      'w.......'
    ]
  };

  /* Trim fully transparent edges so every sprite is optically centred. */
  function trim(rows) {
    var h = rows.length, w = 0, i;
    for (i = 0; i < h; i++) if (rows[i].length > w) w = rows[i].length;

    var minX = w, maxX = -1, minY = h, maxY = -1;
    for (var y = 0; y < h; y++) {
      for (var x = 0; x < rows[y].length; x++) {
        if (rows[y][x] === '.') continue;
        if (x < minX) minX = x;
        if (x > maxX) maxX = x;
        if (y < minY) minY = y;
        if (y > maxY) maxY = y;
      }
    }
    if (maxX < 0) return { rows: rows, w: w, h: h };

    var out = [];
    for (var ry = minY; ry <= maxY; ry++) out.push(rows[ry].slice(minX, maxX + 1));
    return { rows: out, w: maxX - minX + 1, h: maxY - minY + 1 };
  }

  var uriCache = {};

  function spriteUri(name) {
    if (uriCache[name] !== undefined) return uriCache[name];

    var rows = SPRITES[name];
    if (!rows) { uriCache[name] = ''; return ''; }

    var t = trim(rows);
    var body = '';
    for (var y = 0; y < t.rows.length; y++) {
      for (var x = 0; x < t.rows[y].length; x++) {
        var ch = t.rows[y][x];
        if (ch === '.') continue;
        var color = PALETTE[ch];
        if (!color) continue;
        body += '<rect x="' + x + '" y="' + y + '" width="1.05" height="1.05" fill="' + color + '"/>';
      }
    }

    var svg = '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ' + t.w + ' ' + t.h +
              '" shape-rendering="crispEdges">' + body + '</svg>';

    var uri = 'data:image/svg+xml,' + encodeURIComponent(svg);
    uriCache[name] = uri;
    return uri;
  }

  function paintPixelArt(root) {
    var scope = root || document;
    var nodes = scope.querySelectorAll('[data-sprite]');
    for (var i = 0; i < nodes.length; i++) {
      var el = nodes[i];
      var uri = spriteUri(el.getAttribute('data-sprite'));
      if (uri) el.style.backgroundImage = 'url("' + uri + '")';
    }
  }

  /* ------------------------------------------------------------------
     2. YOUTUBE THUMBNAILS
     data-poster on a card  -> the thumbnail only; the card link covers it, so
                               clicking anywhere (video included) opens the page.
     data-youtube on a page -> the thumbnail plus the pixel play button, as a
                               link out to YouTube (no embedded player, so no
                               bot check and no error 153 from file://).
     Both accept a bare video ID or any common YouTube URL form; leave it empty
     and the "coming soon" placeholder stays.
     ------------------------------------------------------------------ */
  function youtubeId(raw) {
    if (!raw) return '';
    var v = String(raw).trim();
    if (!v) return '';
    var m = v.match(/(?:youtu\.be\/|[?&]v=|embed\/|shorts\/|live\/)([A-Za-z0-9_-]{11})/);
    if (m) return m[1];
    if (/^[A-Za-z0-9_-]{11}$/.test(v)) return v;
    return '';
  }

  /* YouTube's best still: maxresdefault is 1280x720 — the same 16:9 shape as
     our frames, so nothing gets cropped. Not every upload has one, and when it
     is missing YouTube still answers HTTP 200 with a 120x90 placeholder, so
     onerror never fires: the loaded size is the only reliable signal. */
  function thumbSrc(img, id) {
    var hq = 'https://i.ytimg.com/vi/' + id + '/hqdefault.jpg';
    function useHq() {
      img.onload = null;
      img.onerror = null;
      img.src = hq;
    }
    img.onerror = useHq;
    img.onload = function () {
      if (img.naturalWidth >= 640) return;   // a real maxresdefault
      useHq();                               // the 120x90 placeholder
    };
    img.src = 'https://i.ytimg.com/vi/' + id + '/maxresdefault.jpg';
  }

  function mountThumb(fig) {
    var id = youtubeId(fig.getAttribute('data-youtube'));
    if (!id) return;                       // keep the "coming soon" placeholder

    var frame = fig.querySelector('.video-frame');
    if (!frame) return;

    var title = fig.getAttribute('data-title') || 'Project video';

    var link = document.createElement('a');
    link.className = 'video-link';
    link.href = 'https://www.youtube.com/watch?v=' + id;
    link.target = '_blank';
    link.rel = 'noopener';
    link.setAttribute('aria-label', 'Watch ' + title + ' on YouTube');

    var img = document.createElement('img');
    img.className = 'video-thumb';
    thumbSrc(img, id);
    img.alt = '';
    img.loading = 'lazy';
    img.decoding = 'async';

    var play = document.createElement('span');
    play.className = 'video-play';
    var glyph = document.createElement('span');
    glyph.className = 'px icon-play';
    glyph.setAttribute('data-sprite', 'play');
    glyph.setAttribute('aria-hidden', 'true');
    play.appendChild(glyph);

    var badge = document.createElement('span');
    badge.className = 'video-badge';
    badge.textContent = 'WATCH ON YOUTUBE';

    link.appendChild(img);
    link.appendChild(play);
    link.appendChild(badge);

    frame.innerHTML = '';
    frame.appendChild(link);
    paintPixelArt(link);
  }

  /* Cards on the index: the thumbnail only — no link and no play button, so
     the whole card (video included) stays a link to the project page.
     data-poster takes a YouTube ID/URL, or any image path for a local still. */
  function mountPoster(fig) {
    var raw = (fig.getAttribute('data-poster') || '').trim();
    if (!raw) return;                      // keep the "coming soon" placeholder

    var frame = fig.querySelector('.video-frame');
    if (!frame) return;

    var id = youtubeId(raw);
    var img = document.createElement('img');
    img.className = 'video-poster';
    if (id) { thumbSrc(img, id); } else { img.src = raw; }
    img.alt = '';
    img.loading = 'lazy';
    img.decoding = 'async';

    frame.innerHTML = '';
    frame.appendChild(img);
  }

  /* ------------------------------------------------------------------
     3. SCROLL RUNNER
     Fixed progress bar at the bottom of the viewport. The sprite frame
     advances while the page scrolls and rests on the first frame (the
     idle pose) once scrolling stops. Travel is driven by scroll progress,
     left to right as you move down the page.
     ------------------------------------------------------------------ */
  function initRunner() {
    var bar = document.getElementById('runbar');
    var runner = document.getElementById('runner');
    var fill = document.getElementById('runFill');
    var pct = document.getElementById('runPct');
    var bubble = document.getElementById('runBubble');
    var bubbleText = document.getElementById('runBubbleText');
    if (!bar || !runner || !fill) return;

    var frames = (runner.getAttribute('data-frames') || '')
      .split(',')
      .map(function (s) { return s.trim(); })
      .filter(function (s) { return s.length > 0; });
    if (!frames.length) return;

    /* ---- what he says ------------------------------------------------
       priority 3 = story beats (never interrupted), 2 = one-offs,
       1 = repeatable chatter. Edit freely — text is plain, no markup. */
    var MESSAGES = {
      welcome:  'Scroll down \u2014 I\u2019ll race you.',
      end:      'Am I hired?',
      endAgain: 'I can start Monday.',
      missed:   'Ooh, we missed something\u2026',
      impressed:'Pretty impressive, right? :)',
      top:      'Back to the top? Bold choice.',
      find:     'Speedrun strats!',
      fast: [
        'Wheee!',
        'Wheeee! Faster!',
        'I am speed!',
        'My legs! My beautiful legs!'
      ],
      // instant jumps — find-in-page, anchor links, Home/End
      teleport: [
        'I am Flash!',
        'Teleportation!',
        'Over here!',
        'Missed me!'
      ],
      idle: [
        'You still there?',
        'My legs are fine. Totally fine.',
        'Take your time \u2014 I bill by the pixel.',
        'I can do this all day. (I cannot.)'
      ],
      quarter:  'Warming up.',
      half:     'Halfway. This is my cardio.'
    };

    var FRAME_MS = 90;   // run cadence while scrolling
    var IDLE_MS = 140;   // quiet time before settling back to the idle pose
    var FLIP_ON_SCROLL_UP = true;   // mirror the sprite when scrolling up
    var reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

    // "At the end" is measured in pixels, not percent. The page is effectively
    // finished as soon as the footer is on screen, and that lands well short of
    // the last pixel — the runner bar's own bottom padding is ~81px, and the
    // footer another ~90px. A percentage threshold missed both.
    var END_PX = Math.max(220, Math.round(window.innerHeight * 0.3));
    var END_ARM_PX = END_PX + Math.max(700, Math.round(window.innerHeight * 0.8));

    // Preload every frame so the cycle never flickers on its first pass.
    frames.forEach(function (src) { var im = new Image(); im.src = src; });

    var index = 0, ticker = null, quiet = null, lastP = -1;
    var facing = 1, lastY = window.pageYOffset || 0;
    var lastT = Date.now(), idleSay = null;

    /* ---- speech bubble state ---- */
    var bubbleShown = false, bubbleW = 140, bubblePrio = 0, bubbleTimer = null;
    var lastPick = null;
    var maxP = 0, peakSinceTop = 0, hitEnd = false, endAgainSaid = false;
    var endTimer = null;
    // Owed lines: reaching the bottom owes a "we missed something" on the way
    // up, which in turn owes a "pretty impressive" on the way back down. These
    // are deliberately independent of distance, so a fast flick away from the
    // bottom can't skip the beat.
    var endPending = false, impressPending = false;
    var findArmed = 0;                      // when Ctrl/Cmd+F was last pressed
    var FIND_WINDOW = 8000;                 // how long a find session stays armed
    var saidQuarter = false, saidHalf = false;
    var lastFast = 0;

    function pick(list) {
      if (list.length < 2) return list[0];
      var i;
      do { i = Math.floor(Math.random() * list.length); } while (list[i] === lastPick);
      lastPick = list[i];
      return list[i];
    }

    // Anchors the bubble over the runner, clamped to the viewport, and aims
    // the tail back at him.
    function placeBubble() {
      if (!bubble || !bubbleShown) return;
      var travel = Math.max(0, bar.clientWidth - runner.offsetWidth);
      var p = lastP > 0 ? lastP : 0;
      var centre = p * travel + runner.offsetWidth / 2;
      var maxLeft = Math.max(6, bar.clientWidth - bubbleW - 6);
      var left = Math.min(Math.max(6, centre - bubbleW / 2), maxLeft);
      bubble.style.transform = 'translateX(' + left.toFixed(1) + 'px)';
      var tail = Math.min(Math.max(centre - left, 18), Math.max(18, bubbleW - 18));
      bubble.style.setProperty('--tail', tail.toFixed(1) + 'px');
    }

    function say(text, priority, holdMs) {
      if (!bubble || !bubbleText || !text) return;
      priority = priority || 1;
      // a lower-priority line never cuts off a better one
      if (bubbleShown && priority < bubblePrio) return;

      bubbleText.textContent = text;
      bubble.classList.add('show');
      bubbleShown = true;
      bubblePrio = priority;
      bubbleW = bubble.offsetWidth || 140;   // measure once, after the text lands
      placeBubble();

      if (bubbleTimer) clearTimeout(bubbleTimer);
      bubbleTimer = setTimeout(function () {
        bubble.classList.remove('show');
        bubbleShown = false;
        bubblePrio = 0;
      }, holdMs || 2200);
    }

    function react(dy, speed, p, now) {
      if (!bubble) return;

      // track the deepest point reached, before any early return
      if (p > peakSinceTop) peakSinceTop = p;

      var dist = distanceFromBottom();
      if (dist > END_ARM_PX) hitEnd = false;   // far away: the next arrival is a fresh one

      // at the end of the page
      if (dist <= END_PX) {
        if (!hitEnd) {
          hitEnd = true;
          endPending = true;                   // owes a line on the way back up
          impressPending = false;
          endAgainSaid = false;
          say(MESSAGES.end, 3, 4200);
        }
        // if he is left sitting down here, he adds one more line
        if (!endAgainSaid) {
          if (endTimer) clearTimeout(endTimer);
          endTimer = setTimeout(function () {
            if (distanceFromBottom() <= END_PX && !bubbleShown) {
              endAgainSaid = true;
              say(MESSAGES.endAgain, 2, 3000);
            }
          }, 4700);
        }
        return;
      }

      // after reaching the end, the first look back up — driven by its own
      // flag rather than by distance, so a long flick up still pays it off
      if (endPending && dy < 0) {
        endPending = false;
        impressPending = true;
        say(MESSAGES.missed, 3, 3400);
        return;
      }
      // ...then the first move back down
      if (impressPending && dy > 0) {
        impressPending = false;
        say(MESSAGES.impressed, 3, 3400);
        return;
      }

      // an instant jump — find-in-page, an anchor link, Home/End. Measured by
      // distance, not speed: after typing in the find bar the previous scroll
      // event can be seconds old, which would make a velocity test miss it.
      if (Math.abs(dy) > 900) {
        if (now - findArmed < FIND_WINDOW || Math.abs(dy) > 1600) {
          // a jump skips whatever milestones were in between — mark them seen
          // so they cannot turn up late and out of order
          if (p >= 0.25) saidQuarter = true;
          if (p >= 0.5) saidHalf = true;
          findArmed = now;               // keep stepping through matches armed
          say(pick(MESSAGES.teleport), 2, 1900);
          return;
        }
      }

      // milestones — marked as seen even when passed too fast to speak
      if (!saidQuarter && p >= 0.25) {
        saidQuarter = true;
        if (dy > 0 && speed < 1.4) { say(MESSAGES.quarter, 2, 1800); return; }
      }
      if (!saidHalf && p >= 0.5) {
        saidHalf = true;
        if (dy > 0 && speed < 1.4) { say(MESSAGES.half, 2, 2200); return; }
      }

      // back at the very top after a real trip down
      if (p <= 0.005 && peakSinceTop > 0.4) {
        peakSinceTop = 0;
        say(MESSAGES.top, 2, 2600);
        return;
      }

      // going too fast
      if (speed > 2.2 || Math.abs(dy) > 260) {
        if (now - lastFast > 3200) {
          lastFast = now;
          say(pick(MESSAGES.fast), 1, 1600);
        }
      }
    }

    function showFrame(i) {
      index = ((i % frames.length) + frames.length) % frames.length;
      runner.style.backgroundImage = 'url("' + frames[index] + '")';
    }

    function startRunning() {
      if (reduced || ticker) return;
      ticker = setInterval(function () { showFrame(index + 1); }, FRAME_MS);
    }

    function stopRunning() {
      if (ticker) { clearInterval(ticker); ticker = null; }
      showFrame(0);                       // idle pose
    }

    function progress() {
      var doc = document.documentElement;
      var full = Math.max(doc.scrollHeight, document.body ? document.body.scrollHeight : 0);
      var span = full - window.innerHeight;
      if (span <= 0) return 0;
      var y = window.pageYOffset || doc.scrollTop || 0;
      return Math.min(1, Math.max(0, y / span));
    }

    // how far the viewport still has to travel before the document ends
    function distanceFromBottom() {
      var doc = document.documentElement;
      var full = Math.max(doc.scrollHeight, document.body ? document.body.scrollHeight : 0);
      var y = window.pageYOffset || doc.scrollTop || 0;
      return full - (y + window.innerHeight);
    }

    function paint() {
      var p = progress();
      var travel = Math.max(0, bar.clientWidth - runner.offsetWidth);
      runner.style.transform =
        'translateX(' + (p * travel).toFixed(1) + 'px)' + (facing < 0 ? ' scaleX(-1)' : '');
      fill.style.transform = 'scaleX(' + p + ')';
      if (pct) pct.textContent = Math.round(p * 100) + '%';
      lastP = p;
      if (bubbleShown) placeBubble();
      return p;
    }

    function onScroll() {
      var y = window.pageYOffset || 0;
      var now = Date.now();
      var dy = y - lastY;
      var dt = Math.max(4, now - lastT);
      var speed = Math.abs(dy) / dt;        // px per ms

      // Only re-read direction when the position actually moved: the same
      // scroll can be delivered more than once (e.g. on document and window),
      // and a repeat with an unchanged y must not flip him back.
      if (FLIP_ON_SCROLL_UP && y !== lastY) {
        facing = dy < 0 ? -1 : 1;
      }
      lastY = y;
      lastT = now;

      var p = progress();
      if (p !== lastP) paint();
      if (p > maxP) maxP = p;

      react(dy, speed, p, now);

      startRunning();
      if (quiet) clearTimeout(quiet);
      quiet = setTimeout(function () {
        stopRunning();
        // he gets chatty once you have been sitting still for a while
        idleSay = setTimeout(function () {
          if (lastP < 0.99) say(pick(MESSAGES.idle), 1, 3000);
        }, 7000);
      }, IDLE_MS);
      if (idleSay) { clearTimeout(idleSay); idleSay = null; }
    }

    // capture:true also catches scrolls coming from inner scroll containers
    document.addEventListener('scroll', onScroll, { passive: true, capture: true });

    // Ctrl/Cmd+F: the browser's find bar is not exposed to the page, so we can
    // only notice the shortcut. The jump it causes is caught in react().
    document.addEventListener('keydown', function (e) {
      var k = e.key ? String(e.key).toLowerCase() : '';
      if ((e.ctrlKey || e.metaKey) && k === 'f') {
        findArmed = Date.now();
        say(MESSAGES.find, 2, 2400);
      }
    }, true);
    window.addEventListener('resize', function () { lastP = -1; paint(); });
    window.addEventListener('load', function () { lastP = -1; paint(); });
    showFrame(0);
    paint();

    // a hello, unless they are already off and running
    setTimeout(function () {
      if (maxP < 0.02) say(MESSAGES.welcome, 2, 3200);
    }, 1500);
  }

  /* ------------------------------------------------------------------
     4. BOOT
     ------------------------------------------------------------------ */
  // The "add data-youtube to embed" hints are for the owner only: mark the
  // document so they show while previewing locally and stay hidden once the
  // site is published on GitHub Pages.
  var host = window.location.hostname;
  var isLocal = host === '' || host === 'localhost' || host === '127.0.0.1' || host === '::1' ||
                /^(10|127)\./.test(host) || /^192\.168\./.test(host) || /^172\.(1[6-9]|2\d|3[01])\./.test(host) ||
                /\.local$/.test(host);
  if (isLocal) document.documentElement.classList.add('is-local');

  paintPixelArt(document);

  var videos = document.querySelectorAll('.video[data-youtube]');
  for (var v = 0; v < videos.length; v++) mountThumb(videos[v]);

  var posters = document.querySelectorAll('.video[data-poster]');
  for (var pi = 0; pi < posters.length; pi++) mountPoster(posters[pi]);

  initRunner();

  var year = document.getElementById('year');
  if (year) year.textContent = String(new Date().getFullYear());

  var items = document.querySelectorAll('.reveal');
  var reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  if (!('IntersectionObserver' in window) || reduced) {
    for (var r = 0; r < items.length; r++) items[r].classList.add('visible');
    return;
  }

  var observer = new IntersectionObserver(function (entries) {
    entries.forEach(function (entry) {
      if (!entry.isIntersecting) return;
      entry.target.classList.add('visible');
      observer.unobserve(entry.target);
    });
  }, { rootMargin: '0px 0px -6% 0px', threshold: 0.08 });

  for (var i = 0; i < items.length; i++) {
    items[i].style.transitionDelay = Math.min(i % 3, 2) * 70 + 'ms';
    observer.observe(items[i]);
  }
})();
