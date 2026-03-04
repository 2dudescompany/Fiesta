(function () {
    /* ═══════════════════════════════════════════════════════════
       HAVY UAT Tracker v3
  
       Path A (dashboard shortcut):
         uatEmbed.ts sets window.HAVY_CLIENT_ID + window.HAVY_CHATBOT_KEY
         → starts tracking immediately (no anon lookup needed)
  
       Path B (external embed):
         Snippet sets window.HAVY_CHATBOT_KEY
         → resolves UUID via anon DB lookup, then tracks
  
       All captured fields are optional / try-catch wrapped.
       If a browser blocks an API, that field is null — tracking continues.
    ═══════════════════════════════════════════════════════════ */

    var SUPABASE_URL = window.HAVY_SUPABASE_URL;
    var SUPABASE_ANON = window.HAVY_SUPABASE_ANON_KEY;
    var CHATBOT_KEY = window.HAVY_CHATBOT_KEY;
    var PRE_SET_ID = window.HAVY_CLIENT_ID;   // only set by Path A

    if (!SUPABASE_URL || !SUPABASE_ANON) return;
    if (!PRE_SET_ID && !CHATBOT_KEY) return;
    if (window.__HAVY_UAT_INIT__) return;
    window.__HAVY_UAT_INIT__ = true;

    var HEADERS = {
        'Content-Type': 'application/json',
        apikey: SUPABASE_ANON,
        Authorization: 'Bearer ' + SUPABASE_ANON,
    };

    /* ── Session ID (shared with Chatbot + TTS for cross-feature tracking) ── */
    var sessionId = null;
    try {
        sessionId = sessionStorage.getItem('havy_session');
        if (!sessionId) {
            sessionId = crypto.randomUUID();
            sessionStorage.setItem('havy_session', sessionId);
        }
    } catch (e) {
        sessionId = crypto.randomUUID(); // fallback if sessionStorage blocked
    }

    /* ── Capture viewport (device classification) — once per load ── */
    var viewportWidth = null;
    try { viewportWidth = window.innerWidth; } catch (e) { }

    /* ── Scroll depth helper — captured at event time ── */
    function getScrollDepth() {
        try {
            var scrolled = window.scrollY || window.pageYOffset || 0;
            var total = Math.max(
                document.body.scrollHeight - window.innerHeight, 1
            );
            return Math.round((scrolled / total) * 100);
        } catch (e) { return null; }
    }

    /* ── Queue + flush ── */
    var queue = [];
    var CLIENT_ID = null;
    var ready = false;
    var MAX_BATCH = 20;
    var API = SUPABASE_URL + '/rest/v1/uat_events';

    function flush() {
        if (!ready || !CLIENT_ID || !queue.length) return;
        var batch = queue.splice(0, MAX_BATCH);
        fetch(API, {
            method: 'POST',
            headers: Object.assign({}, HEADERS, { Prefer: 'return=minimal' }),
            body: JSON.stringify(batch),
            keepalive: true,
        }).catch(function () { queue.unshift.apply(queue, batch); });
    }

    setInterval(flush, 3000);
    window.addEventListener('beforeunload', flush);

    /* ── Initialise CLIENT_ID ── */
    if (PRE_SET_ID) {
        // PATH A: UUID already resolved, start immediately
        CLIENT_ID = PRE_SET_ID;
        ready = true;
    } else {
        // PATH B: resolve chatbot_key → business UUID via anon call
        fetch(
            SUPABASE_URL + '/rest/v1/businesses' +
            '?chatbot_key=eq.' + encodeURIComponent(CHATBOT_KEY) +
            '&select=id,allowed_domains&limit=1',
            { headers: HEADERS }
        )
            .then(function (r) { return r.json(); })
            .then(function (rows) {
                if (!rows || !rows.length) return;
                var biz = rows[0];
                var domains = biz.allowed_domains || [];
                var host = window.location.hostname;
                if (domains.length > 0 && !domains.includes(host)) {
                    console.warn('[HAVY UAT] Domain "' + host + '" not in allowed list.');
                    return;
                }
                CLIENT_ID = biz.id;
                ready = true;
                flush();
            })
            .catch(function () { });
    }

    /* ── Element detection ── */
    var TRACKED = ['button', 'a', 'input', 'textarea', 'select',
        'label', 'p', 'h1', 'h2', 'h3', 'h4', 'h5', 'h6'];

    function meaningful(el) {
        while (el && el !== document.body) {
            if (TRACKED.includes((el.tagName || '').toLowerCase())) return el;
            if (el.innerText && el.innerText.trim().length > 20) return el;
            el = el.parentElement;
        }
        return null;
    }

    /* ── Build event row ── */
    function buildRow(type, el, extra) {
        var row = {
            client_id: CLIENT_ID,
            session_id: sessionId,
            event_type: type,
            occurred_at: new Date().toISOString(),
            page_url: window.location.pathname,
            scroll_depth: getScrollDepth(),
            viewport_width: viewportWidth,
            // Element fields — all nullable
            tag: null,
            text_content: null,
            element_id: null,
            element_class: null,
            href: null,
            dom_path: null,
            data_attrs: null,
        };

        if (el) {
            try { row.tag = (el.tagName || '').toLowerCase() || null; } catch (e) { }
            try { row.text_content = el.innerText ? el.innerText.trim().slice(0, 150) : null; } catch (e) { }
            try { row.element_id = el.id || null; } catch (e) { }
            try { row.element_class = el.className || null; } catch (e) { }
            try { row.href = el.href || null; } catch (e) { }
            try { row.data_attrs = el.dataset ? JSON.parse(JSON.stringify(el.dataset)) : null; } catch (e) { }
            try {
                // Build simple dom_path: tagName#id.class > parent ...
                var path = [];
                var node = el;
                var depth = 0;
                while (node && node !== document.body && depth < 4) {
                    var part = (node.tagName || '').toLowerCase();
                    if (node.id) part += '#' + node.id;
                    else if (node.className) part += '.' + node.className.toString().split(' ')[0];
                    path.unshift(part);
                    node = node.parentElement;
                    depth++;
                }
                row.dom_path = path.join(' > ') || null;
            } catch (e) { }
        }

        return Object.assign(row, extra || {});
    }

    /* ── Enqueue ── */
    function enqueue(type, el, extra) {
        if (!ready || !CLIENT_ID) return;
        el = meaningful(el);
        if (!el && type !== 'scroll') return;
        queue.push(buildRow(type, el, extra));
        if (queue.length >= MAX_BATCH) flush();
    }

    /* ── Rage click detection ── */
    var clickLog = {};   // element → [timestamps]
    function checkRageClick(el) {
        var key = (el.id || el.className || el.tagName || '');
        var now = Date.now();
        clickLog[key] = (clickLog[key] || []).filter(function (t) { return now - t < 2000; });
        clickLog[key].push(now);
        return clickLog[key].length >= 3;
    }

    /* ── Listeners ── */
    document.addEventListener('click', function (e) {
        var el = e.target;
        var rage = false;
        try { rage = checkRageClick(el); } catch (e_) { }

        if (rage) {
            // Rage clicks bypass the meaningful() filter — always record them
            if (!ready || !CLIENT_ID) return;
            queue.push(buildRow('rage_click', el));
            if (queue.length >= MAX_BATCH) flush();
        } else {
            enqueue('click', el);
        }
    });

    var hoverTimer = null;
    var hoverTarget = null;
    document.addEventListener('mouseover', function (e) {
        hoverTarget = e.target;
        clearTimeout(hoverTimer);
        hoverTimer = setTimeout(function () {
            if (hoverTarget === e.target) enqueue('hover', e.target);
        }, 600);
    });

    // Track focus on inputs (form engagement signal)
    document.addEventListener('focusin', function (e) {
        var tag = (e.target.tagName || '').toLowerCase();
        if (['input', 'textarea', 'select'].includes(tag)) {
            enqueue('focus', e.target);
        }
    });

})();
