(function () {
  /* ================= SAFETY ================= */

  // Do NOT run inside HAVY dashboard
  if (window.location.pathname.startsWith("/dashboard")) return;

  const CLIENT_ID = window.HAVY_CLIENT_ID;
  if (!CLIENT_ID) return;

  const SUPABASE_URL = window.HAVY_SUPABASE_URL;
  const SUPABASE_ANON_KEY = window.HAVY_SUPABASE_ANON_KEY;

  if (!SUPABASE_URL || !SUPABASE_ANON_KEY) return;

  const API_URL = `${SUPABASE_URL}/rest/v1/uat_events`;

  const MAX_BATCH = 10;
  const SEND_INTERVAL = 3000;
  const HOVER_DELAY = 600;

  /* ================= SESSION ================= */

  let sessionId = sessionStorage.getItem("havy_session");

  if (!sessionId) {
    sessionId = crypto.randomUUID();
    sessionStorage.setItem("havy_session", sessionId);
  }

  /* ================= QUEUE ================= */

  const queue = [];

  function findMeaningfulElement(el) {
    while (el && el !== document.body) {
      const tag = el.tagName?.toLowerCase();

      const useful = [
        "button",
        "a",
        "input",
        "textarea",
        "select",
        "label",
        "p",
        "h1",
        "h2",
        "h3",
        "h4",
        "h5",
        "h6",
      ];

      if (useful.includes(tag)) return el;

      if (el.innerText && el.innerText.trim().length > 20)
        return el;

      el = el.parentElement;
    }

    return null;
  }

  function enqueue(type, el) {
    el = findMeaningfulElement(el);
    if (!el) return;

    queue.push({
      client_id: CLIENT_ID,
      session_id: sessionId,
      event_type: type,
      tag: el.tagName?.toLowerCase() || null,
      text_content: el.innerText
        ? el.innerText.trim().slice(0, 150)
        : null,
      page_url: window.location.pathname,
      occurred_at: new Date().toISOString(),
      data_attrs: el.dataset
        ? JSON.parse(JSON.stringify(el.dataset))
        : null,
    });

    if (queue.length >= MAX_BATCH) flush();
  }

  function flush() {
    if (!queue.length) return;

    const payload = queue.splice(0, queue.length);

    fetch(API_URL, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        apikey: SUPABASE_ANON_KEY,
        Authorization: `Bearer ${SUPABASE_ANON_KEY}`,
        Prefer: "return=minimal",
      },
      body: JSON.stringify(payload),
      keepalive: true,
    }).catch(() => {
      queue.unshift(...payload);
    });
  }

  setInterval(flush, SEND_INTERVAL);
  window.addEventListener("beforeunload", flush);

  /* ================= EVENTS ================= */

  document.addEventListener("click", (e) => {
    enqueue("click", e.target);
  });

  let hoverTimer = null;
  let current = null;

  document.addEventListener("mouseover", (e) => {
    current = e.target;

    clearTimeout(hoverTimer);

    hoverTimer = setTimeout(() => {
      if (current === e.target) {
        enqueue("hover", e.target);
      }
    }, HOVER_DELAY);
  });

})();