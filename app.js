const {
  useState,
  useEffect,
  useRef
} = React;
const SUPABASE_URL = "https://ukjwqevoqsdfnmylxswt.supabase.co";
const SUPABASE_ANON_KEY = "sb_publishable_1mWGhz0AjDtRhN8rOvx7FA_tZ8Ljb6L";
const PAYSTACK_PUBLIC_KEY = "pk_test_17b9fd74156e85b11f2235a62df6189a10bdcf9c";
const PAYSTACK_PLAN_CODE = "PLN_vpq9g6959dae6ns";
const PRO_PRICE_PESEWAS = 3000;
const DAYPASS_PRICE_PESEWAS = 200;
const FREE_MAX_PAGES = 4;
const FREE_DOCS_PER_DAY = 1;
const supabaseClient = supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
function todayStr() {
  return new Date().toDateString();
}
function estimatePageCount(binaryStr) {
  const matches = binaryStr.match(/\/Type\s*\/Page(?!s)/g);
  return matches ? matches.length : null;
}

// Safety-net renderer: converts a small subset of stray markdown that
// occasionally slips through the AI's plain-text instruction — **bold**
// and "- "/"* " bullet lines — into real React elements. Never uses
// dangerouslySetInnerHTML, so this stays safe against injected HTML.
function stripMarkdown(str) {
  return String(str || "")
    .replace(/\*\*(.+?)\*\*/g, "$1")
    .replace(/^[-*]\s+/gm, "")
    .replace(/^#+\s+/gm, "")
    .replace(/`/g, "");
}
function renderInline(text, keyPrefix) {
  const str = String(text || "");
  const regex = /\*\*(.+?)\*\*/g;
  const out = [];
  let lastIndex = 0, match, i = 0;
  while ((match = regex.exec(str)) !== null) {
    if (match.index > lastIndex) out.push(str.slice(lastIndex, match.index));
    out.push(/*#__PURE__*/React.createElement("strong", { key: `${keyPrefix}-b${i++}` }, match[1]));
    lastIndex = regex.lastIndex;
  }
  if (lastIndex < str.length) out.push(str.slice(lastIndex));
  return out;
}
function renderMarkdownBlock(text, keyPrefix) {
  const lines = String(text || "").split(/\n/);
  const elements = [];
  let currentList = [];
  let key = 0;
  function flushList() {
    if (currentList.length) {
      elements.push(
        /*#__PURE__*/React.createElement("ul", { key: `${keyPrefix}-ul${key++}`, className: "list-disc pl-5 space-y-1" },
          currentList.map((l, i) => /*#__PURE__*/React.createElement("li", { key: i }, renderInline(l, `${keyPrefix}-li${i}`)))
        )
      );
      currentList = [];
    }
  }
  lines.forEach((line) => {
    const trimmed = line.trim();
    const bulletMatch = trimmed.match(/^[-*]\s+(.*)/);
    if (bulletMatch) {
      currentList.push(bulletMatch[1]);
    } else if (trimmed === "") {
      flushList();
    } else {
      flushList();
      elements.push(/*#__PURE__*/React.createElement("p", { key: `${keyPrefix}-p${key++}`, className: "mb-1 last:mb-0" }, renderInline(trimmed, `${keyPrefix}-p${key}`)));
    }
  });
  flushList();
  return elements;
}
const Icon = {
  Upload: p => /*#__PURE__*/React.createElement("svg", {
    ...p,
    viewBox: "0 0 24 24",
    fill: "none",
    stroke: "currentColor",
    strokeWidth: "2"
  }, /*#__PURE__*/React.createElement("path", {
    d: "M12 16V4M12 4l-4 4M12 4l4 4M4 20h16"
  })),
  File: p => /*#__PURE__*/React.createElement("svg", {
    ...p,
    viewBox: "0 0 24 24",
    fill: "none",
    stroke: "currentColor",
    strokeWidth: "2"
  }, /*#__PURE__*/React.createElement("path", {
    d: "M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"
  }), /*#__PURE__*/React.createElement("path", {
    d: "M14 2v6h6"
  })),
  Sparkles: p => /*#__PURE__*/React.createElement("svg", {
    ...p,
    viewBox: "0 0 24 24",
    fill: "none",
    stroke: "currentColor",
    strokeWidth: "2"
  }, /*#__PURE__*/React.createElement("path", {
    d: "M12 3l1.9 4.9L19 9.8l-4.9 1.9L12 16.6l-1.9-4.9L5 9.8l4.9-1.9L12 3z"
  })),
  Send: p => /*#__PURE__*/React.createElement("svg", {
    ...p,
    viewBox: "0 0 24 24",
    fill: "none",
    stroke: "currentColor",
    strokeWidth: "2"
  }, /*#__PURE__*/React.createElement("path", {
    d: "M22 2L11 13"
  }), /*#__PURE__*/React.createElement("path", {
    d: "M22 2l-7 20-4-9-9-4 20-7z"
  })),
  Loader: p => /*#__PURE__*/React.createElement("svg", {
    ...p,
    viewBox: "0 0 24 24",
    fill: "none",
    stroke: "currentColor",
    strokeWidth: "2",
    className: (p.className || "") + " animate-spin"
  }, /*#__PURE__*/React.createElement("path", {
    d: "M21 12a9 9 0 1 1-6.219-8.56"
  })),
  Zap: p => /*#__PURE__*/React.createElement("svg", {
    ...p,
    viewBox: "0 0 24 24",
    fill: "none",
    stroke: "currentColor",
    strokeWidth: "2"
  }, /*#__PURE__*/React.createElement("path", {
    d: "M13 2L3 14h9l-1 8 10-12h-9l1-8z"
  })),
  X: p => /*#__PURE__*/React.createElement("svg", {
    ...p,
    viewBox: "0 0 24 24",
    fill: "none",
    stroke: "currentColor",
    strokeWidth: "2"
  }, /*#__PURE__*/React.createElement("path", {
    d: "M18 6L6 18M6 6l12 12"
  })),
  Check: p => /*#__PURE__*/React.createElement("svg", {
    ...p,
    viewBox: "0 0 24 24",
    fill: "none",
    stroke: "currentColor",
    strokeWidth: "2"
  }, /*#__PURE__*/React.createElement("path", {
    d: "M20 6L9 17l-5-5"
  })),
  Play: p => /*#__PURE__*/React.createElement("svg", {
    ...p,
    viewBox: "0 0 24 24",
    fill: "none",
    stroke: "currentColor",
    strokeWidth: "2"
  }, /*#__PURE__*/React.createElement("circle", {
    cx: "12",
    cy: "12",
    r: "10"
  }), /*#__PURE__*/React.createElement("path", {
    d: "M10 8l6 4-6 4V8z"
  })),
  Logout: p => /*#__PURE__*/React.createElement("svg", {
    ...p,
    viewBox: "0 0 24 24",
    fill: "none",
    stroke: "currentColor",
    strokeWidth: "2"
  }, /*#__PURE__*/React.createElement("path", {
    d: "M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"
  }), /*#__PURE__*/React.createElement("path", {
    d: "M16 17l5-5-5-5"
  }), /*#__PURE__*/React.createElement("path", {
    d: "M21 12H9"
  })),
  Mail: p => /*#__PURE__*/React.createElement("svg", {
    ...p,
    viewBox: "0 0 24 24",
    fill: "none",
    stroke: "currentColor",
    strokeWidth: "2"
  }, /*#__PURE__*/React.createElement("rect", {
    x: "2",
    y: "4",
    width: "20",
    height: "16",
    rx: "2"
  }), /*#__PURE__*/React.createElement("path", {
    d: "M22 6l-10 7L2 6"
  })),
  Bell: p => /*#__PURE__*/React.createElement("svg", {
    ...p,
    viewBox: "0 0 24 24",
    fill: "none",
    stroke: "currentColor",
    strokeWidth: "2"
  }, /*#__PURE__*/React.createElement("path", {
    d: "M18 8a6 6 0 0 0-12 0c0 7-3 9-3 9h18s-3-2-3-9"
  }), /*#__PURE__*/React.createElement("path", {
    d: "M13.73 21a2 2 0 0 1-3.46 0"
  }))
};
function DoclyLogo({
  size = 28
}) {
  return /*#__PURE__*/React.createElement("svg", {
    width: size,
    height: size,
    viewBox: "0 0 120 120"
  }, /*#__PURE__*/React.createElement("defs", null, /*#__PURE__*/React.createElement("linearGradient", {
    id: "dlogo-bg",
    x1: "0",
    y1: "0",
    x2: "1",
    y2: "1"
  }, /*#__PURE__*/React.createElement("stop", {
    offset: "0%",
    stopColor: "#2E9DF4"
  }), /*#__PURE__*/React.createElement("stop", {
    offset: "100%",
    stopColor: "#1B6FC2"
  })), /*#__PURE__*/React.createElement("linearGradient", {
    id: "dlogo-fold",
    x1: "0",
    y1: "0",
    x2: "1",
    y2: "1"
  }, /*#__PURE__*/React.createElement("stop", {
    offset: "0%",
    stopColor: "#F4F8FD"
  }), /*#__PURE__*/React.createElement("stop", {
    offset: "100%",
    stopColor: "#C9DCF2"
  })), /*#__PURE__*/React.createElement("linearGradient", {
    id: "dlogo-spark",
    x1: "0",
    y1: "0",
    x2: "1",
    y2: "1"
  }, /*#__PURE__*/React.createElement("stop", {
    offset: "0%",
    stopColor: "#FFE9B8"
  }), /*#__PURE__*/React.createElement("stop", {
    offset: "100%",
    stopColor: "#FFB020"
  }))), /*#__PURE__*/React.createElement("rect", {
    width: "120",
    height: "120",
    rx: "26",
    fill: "url(#dlogo-bg)"
  }), /*#__PURE__*/React.createElement("path", {
    d: "M40 30h30l0 0v18a2 2 0 0 0 2 2h18v40a5 5 0 0 1-5 5H40a5 5 0 0 1-5-5V35a5 5 0 0 1 5-5z",
    fill: "#EAF2FC"
  }), /*#__PURE__*/React.createElement("path", {
    d: "M70 30l20 20H72a2 2 0 0 1-2-2z",
    fill: "url(#dlogo-fold)"
  }), /*#__PURE__*/React.createElement("path", {
    d: "M40 30h30l20 20v40a5 5 0 0 1-5 5H40a5 5 0 0 1-5-5V35a5 5 0 0 1 5-5z",
    fill: "none",
    stroke: "#0B1220",
    strokeWidth: "4",
    strokeLinejoin: "round"
  }), /*#__PURE__*/React.createElement("path", {
    d: "M70 30v18a2 2 0 0 0 2 2h18",
    fill: "none",
    stroke: "#0B1220",
    strokeWidth: "4",
    strokeLinejoin: "round"
  }), /*#__PURE__*/React.createElement("line", {
    x1: "44",
    y1: "66",
    x2: "80",
    y2: "66",
    stroke: "#0B1220",
    strokeWidth: "3.5",
    strokeLinecap: "round"
  }), /*#__PURE__*/React.createElement("line", {
    x1: "44",
    y1: "75",
    x2: "80",
    y2: "75",
    stroke: "#0B1220",
    strokeWidth: "3.5",
    strokeLinecap: "round"
  }), /*#__PURE__*/React.createElement("line", {
    x1: "44",
    y1: "84",
    x2: "80",
    y2: "84",
    stroke: "#0B1220",
    strokeWidth: "3.5",
    strokeLinecap: "round"
  }), /*#__PURE__*/React.createElement("line", {
    x1: "44",
    y1: "93",
    x2: "66",
    y2: "93",
    stroke: "#0B1220",
    strokeWidth: "3.5",
    strokeLinecap: "round"
  }), /*#__PURE__*/React.createElement("path", {
    d: "M92 78l3 7.5L102 88l-7 2.5L92 98l-3-7.5L82 88l7-2.5z",
    fill: "url(#dlogo-spark)"
  }));
}
function Docly() {
  const [session, setSession] = useState(null);
  const [authEmail, setAuthEmail] = useState("");
  const [authPassword, setAuthPassword] = useState("");
  const [authMode, setAuthMode] = useState("signin");
  const [authLoading, setAuthLoading] = useState(false);
  const [authError, setAuthError] = useState(null);
  const [authNotice, setAuthNotice] = useState(null);
  const [ready, setReady] = useState(false);
  const [file, setFile] = useState(null);
  const [base64Data, setBase64Data] = useState(null);
  const [pageEstimate, setPageEstimate] = useState(null);
  const [messages, setMessages] = useState([]);
  const [gist, setGist] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [chatInput, setChatInput] = useState("");
  const [isPro, setIsPro] = useState(false);
  const [usage, setUsage] = useState({
    date: todayStr(),
    count: 0
  });
  const [showDowngradeConfirm, setShowDowngradeConfirm] = useState(false);
  const [updates, setUpdates] = useState([]);
  const [showUpdates, setShowUpdates] = useState(false);
  const [hasUnseenUpdate, setHasUnseenUpdate] = useState(false);
  const [payLoading, setPayLoading] = useState(false);
  const [payError, setPayError] = useState(null);
  const [dayPassUntil, setDayPassUntil] = useState(null);
  const [preAuthView, setPreAuthView] = useState("landing");
  const fileInputRef = useRef(null);
  const scrollRef = useRef(null);
  const dayPassActive = dayPassUntil && new Date(dayPassUntil) > new Date();
  const hasUnlimitedAccess = isPro || dayPassActive;
  function authHeaders(token) {
    return {
      "Content-Type": "application/json",
      apikey: SUPABASE_ANON_KEY,
      ...(token ? {
        Authorization: `Bearer ${token}`
      } : {})
    };
  }
  function metadataFromUser(user) {
    const meta = user?.user_metadata || {};
    const usageM = meta.usage && meta.usage.date === todayStr() ? meta.usage : {
      date: todayStr(),
      count: 0
    };
    return {
      pro: !!meta.pro,
      usage: usageM,
      dayPassUntil: meta.dayPassUntil || null
    };
  }
  async function loadSessionUser(accessToken) {
    const res = await fetch(`${SUPABASE_URL}/auth/v1/user`, {
      headers: authHeaders(accessToken)
    });
    if (!res.ok) throw new Error("Session invalid");
    const user = await res.json();
    const parsed = metadataFromUser(user);
    setIsPro(parsed.pro);
    setUsage(parsed.usage);
    setDayPassUntil(parsed.dayPassUntil);
    setSession({
      access_token: accessToken,
      user
    });
  }
  useEffect(() => {
    (async () => {
      try {
        const {
          data: sdkData
        } = await supabaseClient.auth.getSession();
        if (sdkData?.session?.access_token) {
          await loadSessionUser(sdkData.session.access_token);
          setReady(true);
          return;
        }
        if (window.location.hash.includes("access_token")) {
          const params = new URLSearchParams(window.location.hash.slice(1));
          const token = params.get("access_token");
          if (token) {
            localStorage.setItem("docly-session", JSON.stringify({
              access_token: token
            }));
            await loadSessionUser(token);
            window.history.replaceState(null, "", window.location.pathname);
            setReady(true);
            return;
          }
        }
        if (window.location.hash.includes("error") || window.location.search.includes("error")) {
          const params = new URLSearchParams(window.location.hash.slice(1) || window.location.search.slice(1));
          setAuthError("Sign-in failed: " + (params.get("error_description") || params.get("error") || "unknown error"));
          setPreAuthView("auth");
          window.history.replaceState(null, "", window.location.pathname);
        }
        const cached = localStorage.getItem("docly-session");
        if (cached) {
          const {
            access_token
          } = JSON.parse(cached);
          await loadSessionUser(access_token);
        }
      } catch (e) {
        localStorage.removeItem("docly-session");
      }
      setReady(true);
    })();
    const {
      data: listener
    } = supabaseClient.auth.onAuthStateChange((event, sdkSession) => {
      if (sdkSession?.access_token) {
        loadSessionUser(sdkSession.access_token);
      }
    });
    return () => {
      listener?.subscription?.unsubscribe();
    };
  }, []);
  useEffect(() => {
    if (scrollRef.current) scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
  }, [messages, loading]);
  async function persistMetadata(partial) {
    if (!session) return;
    const nextPro = partial.pro !== undefined ? partial.pro : isPro;
    const nextUsage = partial.usage !== undefined ? partial.usage : usage;
    const nextDayPass = partial.dayPassUntil !== undefined ? partial.dayPassUntil : dayPassUntil;
    try {
      await fetch(`${SUPABASE_URL}/auth/v1/user`, {
        method: "PUT",
        headers: authHeaders(session.access_token),
        body: JSON.stringify({
          data: {
            pro: nextPro,
            usage: nextUsage,
            dayPassUntil: nextDayPass
          }
        })
      });
    } catch (e) {}
  }
  function buyDayPass() {
    setPayError(null);
    if (!window.PaystackPop) {
      setPayError("Payment isn't ready yet — check your connection and try again.");
      return;
    }
    const handler = window.PaystackPop.setup({
      key: PAYSTACK_PUBLIC_KEY,
      email: session.user.email,
      amount: DAYPASS_PRICE_PESEWAS,
      currency: "GHS",
      ref: "docly_daypass_" + Date.now(),
      callback: function (response) {
        setPayLoading(true);
        fetch("/api/verify-payment", {
          method: "POST",
          headers: {
            "Content-Type": "application/json"
          },
          body: JSON.stringify({
            reference: response.reference
          })
        }).then(r => r.json()).then(data => {
          setPayLoading(false);
          if (data.verified) {
            const until = new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString();
            setDayPassUntil(until);
            persistMetadata({
              dayPassUntil: until
            });
            setError(prev => prev === "LIMIT_REACHED" ? null : prev);
          } else {
            setPayError("Payment could not be verified. If you were charged, contact support.");
          }
        }).catch(() => {
          setPayLoading(false);
          setPayError("Couldn't confirm payment. If you were charged, contact support.");
        });
      },
      onClose: function () {}
    });
    handler.openIframe();
  }
  async function togglePro() {
    if (isPro) {
      setShowDowngradeConfirm(true);
      return;
    }
    setPayError(null);
    if (!window.PaystackPop) {
      setPayError("Payment isn't ready yet — check your connection and try again.");
      return;
    }
    const handler = window.PaystackPop.setup({
      key: PAYSTACK_PUBLIC_KEY,
      email: session.user.email,
      plan: PAYSTACK_PLAN_CODE,
      amount: PRO_PRICE_PESEWAS,
      currency: "GHS",
      ref: "docly_" + Date.now(),
      callback: function (response) {
        setPayLoading(true);
        fetch("/api/verify-payment", {
          method: "POST",
          headers: {
            "Content-Type": "application/json"
          },
          body: JSON.stringify({
            reference: response.reference
          })
        }).then(r => r.json()).then(data => {
          setPayLoading(false);
          if (data.verified) {
            setIsPro(true);
            persistMetadata({
              pro: true
            });
          } else {
            setPayError("Payment could not be verified. If you were charged, contact support.");
          }
        }).catch(() => {
          setPayLoading(false);
          setPayError("Couldn't confirm payment. If you were charged, contact support.");
        });
      },
      onClose: function () {}
    });
    handler.openIframe();
  }
  async function confirmDowngrade() {
    setIsPro(false);
    setShowDowngradeConfirm(false);
    await persistMetadata({
      pro: false
    });
  }
  async function signInWithGoogle() {
    setAuthError(null);
    const {
      error
    } = await supabaseClient.auth.signInWithOAuth({
      provider: "google",
      options: {
        redirectTo: window.location.origin
      }
    });
    if (error) setAuthError(error.message);
  }
  async function handleAuth() {
    setAuthError(null);
    setAuthNotice(null);
    if (!authEmail.trim() || !authPassword.trim()) {
      setAuthError("Enter your email and a password.");
      return;
    }
    if (authPassword.length < 6) {
      setAuthError("Password must be at least 6 characters.");
      return;
    }
    setAuthLoading(true);
    try {
      if (authMode === "signup") {
        const res = await fetch(`${SUPABASE_URL}/auth/v1/signup`, {
          method: "POST",
          headers: authHeaders(),
          body: JSON.stringify({
            email: authEmail.trim(),
            password: authPassword
          })
        });
        const data = await res.json();
        if (!res.ok) throw new Error(data.msg || data.error_description || "Sign up failed");
        if (data.access_token) {
          localStorage.setItem("docly-session", JSON.stringify({
            access_token: data.access_token
          }));
          await loadSessionUser(data.access_token);
        } else {
          setAuthNotice("Account created — check your email to confirm it, then sign in.");
          setAuthMode("signin");
        }
      } else {
        const res = await fetch(`${SUPABASE_URL}/auth/v1/token?grant_type=password`, {
          method: "POST",
          headers: authHeaders(),
          body: JSON.stringify({
            email: authEmail.trim(),
            password: authPassword
          })
        });
        const data = await res.json();
        if (!res.ok) throw new Error(data.msg || data.error_description || "Sign in failed");
        localStorage.setItem("docly-session", JSON.stringify({
          access_token: data.access_token
        }));
        await loadSessionUser(data.access_token);
      }
    } catch (e) {
      setAuthError(e.message || "Something went wrong.");
    } finally {
      setAuthLoading(false);
    }
  }
  async function signOut() {
    setSession(null);
    setIsPro(false);
    setUsage({
      date: todayStr(),
      count: 0
    });
    resetDoc();
    localStorage.removeItem("docly-session");
    try {
      await supabaseClient.auth.signOut();
    } catch (e) {}
  }
  async function persistUsage(next) {
    setUsage(next);
    await persistMetadata({
      usage: next
    });
  }
  async function loadUpdates() {
    try {
      const res = await fetch(`${SUPABASE_URL}/rest/v1/updates?select=id,message,created_at&order=created_at.desc&limit=20`, {
        headers: authHeaders(session?.access_token)
      });
      if (!res.ok) return;
      const data = await res.json();
      setUpdates(data);
      const lastSeen = localStorage.getItem("docly-updates-seen");
      if (data.length > 0 && data[0].id.toString() !== lastSeen) setHasUnseenUpdate(true);
    } catch (e) {}
  }
  useEffect(() => {
    if (session) loadUpdates();
  }, [session]);
  function openUpdates() {
    setShowUpdates(true);
    setHasUnseenUpdate(false);
    if (updates.length > 0) localStorage.setItem("docly-updates-seen", updates[0].id.toString());
  }
  function resetDoc() {
    setFile(null);
    setBase64Data(null);
    setPageEstimate(null);
    setMessages([]);
    setGist(null);
    setError(null);
    setChatInput("");
    if (fileInputRef.current) fileInputRef.current.value = "";
  }
  function handleFile(f) {
    setError(null);
    if (!f) return;
    if (f.type !== "application/pdf") {
      setError("Docly reads PDFs only, for now.");
      return;
    }
    const reader = new FileReader();
    reader.onload = () => {
      const dataUrl = reader.result;
      const b64 = dataUrl.split(",")[1];
      let pages = null;
      try {
        pages = estimatePageCount(atob(b64));
      } catch (e) {}
      setFile(f);
      setBase64Data(b64);
      setPageEstimate(pages);
    };
    reader.onerror = () => setError("Couldn't read that file. Try again.");
    reader.readAsDataURL(f);
  }
  function onDrop(e) {
    e.preventDefault();
    handleFile(e.dataTransfer.files?.[0]);
  }
  async function callBackend(contents, mode) {
    const res = await fetch("/api/summarize", {
      method: "POST",
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify(mode ? {
        contents,
        mode
      } : {
        contents
      })
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || "Request failed");
    return data;
  }
  function toGeminiHistory(msgs) {
    return msgs.map(m => ({
      role: m.role === "assistant" ? "model" : "user",
      parts: m.parts
    }));
  }
  async function startSummary() {
    setError(null);
    if (!hasUnlimitedAccess) {
      if (pageEstimate && pageEstimate > FREE_MAX_PAGES) {
        setError(`This document is about ${pageEstimate} pages. Free accounts summarize documents up to ${FREE_MAX_PAGES} pages. Upgrade to Pro for longer documents.`);
        return;
      }
      if (usage.count >= FREE_DOCS_PER_DAY) {
        setError("LIMIT_REACHED");
        return;
      }
    }
    setLoading(true);
    setGist(null);
    setMessages([]);
    const parts = [{
      inlineData: {
        mimeType: "application/pdf",
        data: base64Data
      }
    }, {
      text: "Summarize this document."
    }];
    const requestContents = [{
      role: "user",
      parts
    }];
    try {
      const data = await callBackend(requestContents, "summary");
      if (data.gist) {
        setGist({
          title: data.gist.title || file.name,
          summary: data.gist.summary || "",
          points: Array.isArray(data.gist.points) ? data.gist.points : [],
          important: Array.isArray(data.gist.important) ? data.gist.important : [],
          tags: Array.isArray(data.gist.tags) ? data.gist.tags : []
        });
      } else {
        // Graceful fallback if the model didn't return valid JSON —
        // still show something useful rather than failing outright.
        setGist({
          title: file.name,
          summary: data.text || "Summary unavailable.",
          points: [],
          important: [],
          tags: []
        });
      }
      if (!isPro && !dayPassActive) await persistUsage({
        date: todayStr(),
        count: usage.count + 1
      });
    } catch (e) {
      setError("Something went wrong generating the summary: " + (e.message || "unknown error"));
      setGist(null);
    } finally {
      setLoading(false);
    }
  }
  function buildExportText() {
    const title = gist ? stripMarkdown(gist.title) : file ? file.name : "Docly Summary";
    let text = `Docly — ${title}\n${new Date().toLocaleDateString()}\n\n`;
    if (gist) {
      text += `TL;DR\n${stripMarkdown(gist.summary)}\n\n`;
      if (gist.points.length) {
        text += "KEY POINTS\n";
        gist.points.forEach((p, i) => {
          text += `${i + 1}. ${stripMarkdown(p)}\n`;
        });
        text += "\n";
      }
      if (gist.important.length) {
        text += "IMPORTANT TO KNOW\n";
        gist.important.forEach(p => {
          text += `• ${stripMarkdown(p)}\n`;
        });
        text += "\n";
      }
      if (gist.tags.length) {
        text += `TAGS: ${gist.tags.join(", ")}\n\n`;
      }
    }
    if (messages.length) {
      text += "Q&A\n";
      messages.forEach(m => {
        text += (m.role === "user" ? "You: " : "Docly: ") + m.display + "\n\n";
      });
    }
    return text;
  }
  function exportFileName(ext) {
    const base = file ? file.name.replace(/\.pdf$/i, "") : "docly-summary";
    return `${base}-docly.${ext}`;
  }
  function exportAsTxt() {
    const blob = new Blob([buildExportText()], {
      type: "text/plain"
    });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = exportFileName("txt");
    a.click();
    URL.revokeObjectURL(url);
  }
  function exportAsPdf() {
    if (!window.jspdf) {
      setError("PDF export isn't ready yet — try again in a moment.");
      return;
    }
    const {
      jsPDF
    } = window.jspdf;
    const doc = new jsPDF();
    const marginLeft = 14;
    let y = 20;
    function writeSection(heading, body) {
      if (y > 270) {
        doc.addPage();
        y = 20;
      }
      doc.setFontSize(12);
      doc.setTextColor(46, 157, 244);
      doc.text(heading, marginLeft, y);
      y += 7;
      doc.setFontSize(11);
      doc.setTextColor(20);
      const lines = doc.splitTextToSize(body, 180);
      lines.forEach(line => {
        if (y > 280) {
          doc.addPage();
          y = 20;
        }
        doc.text(line, marginLeft, y);
        y += 6;
      });
      y += 4;
    }
    doc.setFontSize(16);
    doc.setTextColor(20);
    doc.text(gist ? stripMarkdown(gist.title) : "Docly Summary", marginLeft, y);
    y += 8;
    doc.setFontSize(10);
    doc.setTextColor(120);
    doc.text(`${file ? file.name : ""} — ${new Date().toLocaleDateString()}`, marginLeft, y);
    y += 10;
    if (gist) {
      if (gist.summary) writeSection("TL;DR", stripMarkdown(gist.summary));
      if (gist.points.length) writeSection("Key Points", gist.points.map((p, i) => `${i + 1}. ${stripMarkdown(p)}`).join("\n"));
      if (gist.important.length) writeSection("Important to Know", gist.important.map(p => `• ${stripMarkdown(p)}`).join("\n"));
      if (gist.tags.length) writeSection("Tags", gist.tags.join(", "));
    }
    if (messages.length) {
      writeSection("Q&A", messages.map(m => (m.role === "user" ? "You: " : "Docly: ") + m.display).join("\n\n"));
    }
    doc.save(exportFileName("pdf"));
  }
  function markdownToHtml(str) {
    const escaped = String(str || "").replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
    return escaped.replace(/\*\*(.+?)\*\*/g, "<strong>$1</strong>").replace(/^[-*]\s+/gm, "").replace(/^#+\s+/gm, "");
  }
  function exportAsWord() {
    let bodyHtml = "";
    if (gist) {
      bodyHtml += `<h3>TL;DR</h3><p>${markdownToHtml(gist.summary)}</p>`;
      if (gist.points.length) {
        bodyHtml += `<h3>Key Points</h3><ol>${gist.points.map(p => `<li>${markdownToHtml(p)}</li>`).join("")}</ol>`;
      }
      if (gist.important.length) {
        bodyHtml += `<h3>Important to Know</h3><ul>${gist.important.map(p => `<li>${markdownToHtml(p)}</li>`).join("")}</ul>`;
      }
      if (gist.tags.length) {
        bodyHtml += `<p><strong>Tags:</strong> ${gist.tags.join(", ")}</p>`;
      }
    }
    if (messages.length) {
      bodyHtml += "<h3>Q&A</h3>";
      bodyHtml += messages.map(m => `<p><strong>${m.role === "user" ? "You" : "Docly"}:</strong> ${markdownToHtml(m.display).replace(/\n/g, "<br/>")}</p>`).join("");
    }
    const html = `<html xmlns:o='urn:schemas-microsoft-com:office:office' xmlns:w='urn:schemas-microsoft-com:office:word' xmlns='http://www.w3.org/TR/REC-html40'>
<head><meta charset='utf-8'><title>Docly Summary</title></head>
<body>
<h2>Docly — ${gist ? stripMarkdown(gist.title) : file ? file.name : "Summary"}</h2>
<p style="color:#888;font-size:12px;">${new Date().toLocaleDateString()}</p>
${bodyHtml}
</body></html>`;
    const blob = new Blob(["\ufeff", html], {
      type: "application/msword"
    });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = exportFileName("doc");
    a.click();
    URL.revokeObjectURL(url);
  }
  async function sendQuestion() {
    const q = chatInput.trim();
    if (!q || loading || !gist) return;
    setChatInput("");
    setError(null);
    const newUserMsg = {
      role: "user",
      parts: [{
        text: q
      }],
      display: q
    };
    const updated = [...messages, newUserMsg];
    setMessages(updated);
    setLoading(true);
    try {
      const docContext = {
        role: "user",
        parts: [{
          text: `Document context (already summarized):\nTitle: ${gist.title}\nSummary: ${gist.summary}\nKey points: ${gist.points.join("; ")}\nImportant: ${gist.important.join("; ")}\n\nAnswer the user's questions below based on this document.`
        }]
      };
      // Oldest first, newest question last — the document context anchors
      // the conversation, then every prior Q&A turn in order, then the
      // question just asked.
      const requestContents = [docContext, ...toGeminiHistory(updated)];
      const data = await callBackend(requestContents, "chat");
      const answer = data.text || "";
      setMessages(prev => [...prev, {
        role: "assistant",
        parts: [{
          text: answer
        }],
        display: answer
      }]);
    } catch (e) {
      setError("Couldn't get an answer that time. Try asking again.");
    } finally {
      setLoading(false);
    }
  }
  const docsLeftToday = hasUnlimitedAccess ? "Unlimited" : Math.max(0, FREE_DOCS_PER_DAY - usage.count);
  if (!ready) {
    return /*#__PURE__*/React.createElement("div", {
      className: "min-h-screen w-full bg-[#0B1220] flex items-center justify-center"
    }, /*#__PURE__*/React.createElement(Icon.Loader, {
      className: "w-6 h-6 text-[#2E9DF4]"
    }));
  }
  if (!session) {
    if (preAuthView === "landing") {
      return /*#__PURE__*/React.createElement("div", {
        className: "min-h-screen w-full bg-[#0B1220] text-[#E6EDF3] font-sans"
      }, /*#__PURE__*/React.createElement("style", null, `
            .mono { font-family: ui-monospace, "JetBrains Mono", "SF Mono", Menlo, Consolas, monospace; }
            .neon-glow { box-shadow: 0 0 12px rgba(46,157,244,0.55), 0 0 2px rgba(46,157,244,0.85); }
            .neon-text { text-shadow: 0 0 8px rgba(46,157,244,0.6); }
          `), /*#__PURE__*/React.createElement("header", {
        className: "max-w-4xl mx-auto px-5 py-5 flex items-center justify-between"
      }, /*#__PURE__*/React.createElement("div", {
        className: "flex items-center gap-2"
      }, /*#__PURE__*/React.createElement(DoclyLogo, {
        size: 28
      }), /*#__PURE__*/React.createElement("span", {
        className: "mono font-semibold text-[15px] text-white"
      }, "docly")), /*#__PURE__*/React.createElement("button", {
        onClick: () => setPreAuthView("auth"),
        className: "mono text-[12px] px-3 py-1.5 rounded border border-[#2E9DF4] text-[#2E9DF4] hover:bg-[#2E9DF4]/10 transition-colors"
      }, "SIGN IN")), /*#__PURE__*/React.createElement("main", {
        className: "max-w-4xl mx-auto px-5 pt-10 pb-16 flex flex-col items-center text-center"
      }, /*#__PURE__*/React.createElement("span", {
        className: "mono text-[11px] text-[#2E9DF4] neon-text tracking-widest mb-3"
      }, "DOCUMENT → GIST"), /*#__PURE__*/React.createElement("h1", {
        className: "text-4xl sm:text-5xl font-semibold tracking-tight mb-4 text-white max-w-2xl"
      }, "Read the point, skip the pages."), /*#__PURE__*/React.createElement("p", {
        className: "text-[#8CA3C7] mb-8 max-w-lg text-[15px]"
      }, "Drop in any PDF — a textbook chapter, a contract, a research paper. Docly gives you a clean summary in seconds, then answers your questions about it."), /*#__PURE__*/React.createElement("button", {
        onClick: () => setPreAuthView("auth"),
        className: "mono text-sm bg-[#2E9DF4] neon-glow text-[#0B1220] rounded-lg px-8 py-3.5 font-semibold hover:opacity-90 transition-opacity mb-16"
      }, "GET STARTED FREE"), /*#__PURE__*/React.createElement("div", {
        className: "grid sm:grid-cols-3 gap-4 w-full max-w-3xl mb-16 text-left"
      }, /*#__PURE__*/React.createElement("div", {
        className: "bg-[#16213A] border border-[#25355A] rounded-xl p-5"
      }, /*#__PURE__*/React.createElement("div", {
        className: "w-9 h-9 rounded-lg bg-[#2E9DF4]/15 flex items-center justify-center mb-3"
      }, /*#__PURE__*/React.createElement(Icon.Upload, {
        className: "w-4.5 h-4.5 text-[#2E9DF4]"
      })), /*#__PURE__*/React.createElement("div", {
        className: "mono text-[12px] text-white mb-1"
      }, "1. UPLOAD"), /*#__PURE__*/React.createElement("p", {
        className: "text-[13px] text-[#8CA3C7]"
      }, "Drop in any PDF from your device.")), /*#__PURE__*/React.createElement("div", {
        className: "bg-[#16213A] border border-[#25355A] rounded-xl p-5"
      }, /*#__PURE__*/React.createElement("div", {
        className: "w-9 h-9 rounded-lg bg-[#2E9DF4]/15 flex items-center justify-center mb-3"
      }, /*#__PURE__*/React.createElement(Icon.Sparkles, {
        className: "w-4.5 h-4.5 text-[#2E9DF4]"
      })), /*#__PURE__*/React.createElement("div", {
        className: "mono text-[12px] text-white mb-1"
      }, "2. SUMMARIZE"), /*#__PURE__*/React.createElement("p", {
        className: "text-[13px] text-[#8CA3C7]"
      }, "Get the key points in seconds, no fluff.")), /*#__PURE__*/React.createElement("div", {
        className: "bg-[#16213A] border border-[#25355A] rounded-xl p-5"
      }, /*#__PURE__*/React.createElement("div", {
        className: "w-9 h-9 rounded-lg bg-[#2E9DF4]/15 flex items-center justify-center mb-3"
      }, /*#__PURE__*/React.createElement(Icon.Send, {
        className: "w-4.5 h-4.5 text-[#2E9DF4]"
      })), /*#__PURE__*/React.createElement("div", {
        className: "mono text-[12px] text-white mb-1"
      }, "3. ASK"), /*#__PURE__*/React.createElement("p", {
        className: "text-[13px] text-[#8CA3C7]"
      }, "Chat with the document for anything it missed."))), /*#__PURE__*/React.createElement("h2", {
        className: "mono text-[13px] text-[#8CA3C7] tracking-widest mb-5"
      }, "PRICING"), /*#__PURE__*/React.createElement("div", {
        className: "grid sm:grid-cols-3 gap-4 w-full max-w-3xl text-left"
      }, /*#__PURE__*/React.createElement("div", {
        className: "bg-[#16213A] border border-[#25355A] rounded-xl p-5 flex flex-col"
      }, /*#__PURE__*/React.createElement("div", {
        className: "mono text-[12px] text-[#8CA3C7] mb-1"
      }, "FREE"), /*#__PURE__*/React.createElement("div", {
        className: "text-2xl font-semibold text-white mb-3"
      }, "GHS 0"), /*#__PURE__*/React.createElement("p", {
        className: "text-[13px] text-[#8CA3C7] flex-1"
      }, "1 document a day, up to 4 pages.")), /*#__PURE__*/React.createElement("div", {
        className: "bg-[#16213A] border border-[#25355A] rounded-xl p-5 flex flex-col"
      }, /*#__PURE__*/React.createElement("div", {
        className: "mono text-[12px] text-[#8CA3C7] mb-1"
      }, "24-HOUR PASS"), /*#__PURE__*/React.createElement("div", {
        className: "text-2xl font-semibold text-white mb-3"
      }, "GHS 2"), /*#__PURE__*/React.createElement("p", {
        className: "text-[13px] text-[#8CA3C7] flex-1"
      }, "Unlimited documents for a full day.")), /*#__PURE__*/React.createElement("div", {
        className: "bg-[#16213A] border border-[#2E9DF4] rounded-xl p-5 flex flex-col relative"
      }, /*#__PURE__*/React.createElement("div", {
        className: "absolute -top-2.5 right-4 mono text-[10px] bg-[#2E9DF4] text-[#0B1220] px-2 py-0.5 rounded font-semibold"
      }, "POPULAR"), /*#__PURE__*/React.createElement("div", {
        className: "mono text-[12px] text-[#8CA3C7] mb-1"
      }, "PRO"), /*#__PURE__*/React.createElement("div", {
        className: "text-2xl font-semibold text-white mb-3"
      }, "GHS 30", /*#__PURE__*/React.createElement("span", {
        className: "text-sm text-[#8CA3C7] font-normal"
      }, "/mo")), /*#__PURE__*/React.createElement("p", {
        className: "text-[13px] text-[#8CA3C7] flex-1"
      }, "Unlimited documents, longer docs, no ads.")))), /*#__PURE__*/React.createElement("footer", {
        className: "border-t border-[#25355A] py-6 text-center"
      }, /*#__PURE__*/React.createElement("span", {
        className: "mono text-[11px] text-[#8CA3C7]"
      }, "Docly v1.0 — built for readers who don't have time to read it all.")));
    }
    return /*#__PURE__*/React.createElement("div", {
      className: "min-h-screen w-full bg-[#0B1220] text-[#E6EDF3] font-sans flex flex-col items-center justify-center px-5"
    }, /*#__PURE__*/React.createElement("button", {
      onClick: () => setPreAuthView("landing"),
      className: "absolute top-5 left-5 text-[#8CA3C7] hover:text-[#E6EDF3] mono text-[12px]"
    }, "← BACK"), /*#__PURE__*/React.createElement("div", {
      className: "w-full max-w-sm flex flex-col gap-4"
    }, /*#__PURE__*/React.createElement("div", {
      className: "flex items-center gap-2 justify-center mb-2"
    }, /*#__PURE__*/React.createElement(DoclyLogo, {
      size: 36
    }), /*#__PURE__*/React.createElement("span", {
      className: "mono font-semibold text-lg text-white"
    }, "docly")), /*#__PURE__*/React.createElement("p", {
      className: "text-center text-[13px] text-[#8CA3C7] mb-1"
    }, authMode === "signin" ? "Sign in to summarize documents" : "Create an account to get started"), /*#__PURE__*/React.createElement("div", {
      className: "flex bg-[#16213A] border border-[#25355A] rounded-lg p-1"
    }, /*#__PURE__*/React.createElement("button", {
      onClick: () => {
        setAuthMode("signin");
        setAuthError(null);
        setAuthNotice(null);
      },
      className: `flex-1 mono text-[12px] py-2 rounded-md transition-colors ${authMode === "signin" ? "bg-[#2E9DF4] text-[#0B1220] font-semibold" : "text-[#8CA3C7]"}`
    }, "SIGN IN"), /*#__PURE__*/React.createElement("button", {
      onClick: () => {
        setAuthMode("signup");
        setAuthError(null);
        setAuthNotice(null);
      },
      className: `flex-1 mono text-[12px] py-2 rounded-md transition-colors ${authMode === "signup" ? "bg-[#2E9DF4] text-[#0B1220] font-semibold" : "text-[#8CA3C7]"}`
    }, "SIGN UP")), /*#__PURE__*/React.createElement("input", {
      type: "email",
      value: authEmail,
      onChange: e => setAuthEmail(e.target.value),
      placeholder: "you@email.com",
      className: "bg-[#16213A] border border-[#25355A] rounded-lg px-3 py-2.5 text-sm outline-none focus:border-[#2E9DF4]/60 placeholder:text-[#8CA3C7]"
    }), /*#__PURE__*/React.createElement("input", {
      type: "password",
      value: authPassword,
      onChange: e => setAuthPassword(e.target.value),
      onKeyDown: e => e.key === "Enter" && handleAuth(),
      placeholder: "Password (6+ characters)",
      className: "bg-[#16213A] border border-[#25355A] rounded-lg px-3 py-2.5 text-sm outline-none focus:border-[#2E9DF4]/60 placeholder:text-[#8CA3C7]"
    }), authError && /*#__PURE__*/React.createElement("div", {
      className: "text-[13px] text-[#FF5C5C]"
    }, authError), authNotice && /*#__PURE__*/React.createElement("div", {
      className: "text-[13px] text-[#2E9DF4]"
    }, authNotice), /*#__PURE__*/React.createElement("button", {
      onClick: handleAuth,
      disabled: authLoading,
      className: "mono text-sm bg-[#2E9DF4] neon-glow text-[#0B1220] rounded-lg py-3 flex items-center justify-center gap-2 font-semibold hover:opacity-90 transition-opacity disabled:opacity-50"
    }, authLoading ? /*#__PURE__*/React.createElement(Icon.Loader, {
      className: "w-4 h-4"
    }) : /*#__PURE__*/React.createElement(Icon.Mail, {
      className: "w-4 h-4"
    }), authMode === "signin" ? "SIGN IN" : "CREATE ACCOUNT"), /*#__PURE__*/React.createElement("div", {
      className: "flex items-center gap-3 my-1"
    }, /*#__PURE__*/React.createElement("div", {
      className: "h-px flex-1 bg-[#25355A]"
    }), /*#__PURE__*/React.createElement("span", {
      className: "mono text-[10px] text-[#8CA3C7]"
    }, "OR"), /*#__PURE__*/React.createElement("div", {
      className: "h-px flex-1 bg-[#25355A]"
    })), /*#__PURE__*/React.createElement("button", {
      onClick: signInWithGoogle,
      className: "bg-white text-[#1a1a1a] rounded-lg py-3 flex items-center justify-center gap-2 text-sm font-medium hover:opacity-90 transition-opacity"
    }, /*#__PURE__*/React.createElement("svg", {
      width: "16",
      height: "16",
      viewBox: "0 0 48 48"
    }, /*#__PURE__*/React.createElement("path", {
      fill: "#FFC107",
      d: "M43.6 20.5H42V20H24v8h11.3C33.9 32.9 29.4 36 24 36c-6.6 0-12-5.4-12-12s5.4-12 12-12c3.1 0 5.9 1.2 8 3.1l5.7-5.7C34.6 6.5 29.6 4.5 24 4.5 12.9 4.5 4 13.4 4 24.5S12.9 44.5 24 44.5 44 35.6 44 24.5c0-1.4-.1-2.7-.4-4z"
    }), /*#__PURE__*/React.createElement("path", {
      fill: "#FF3D00",
      d: "M6.3 14.7l6.6 4.8C14.6 15.9 18.9 13 24 13c3.1 0 5.9 1.2 8 3.1l5.7-5.7C34.6 6.5 29.6 4.5 24 4.5c-7.6 0-14.2 4.3-17.7 10.2z"
    }), /*#__PURE__*/React.createElement("path", {
      fill: "#4CAF50",
      d: "M24 44.5c5.5 0 10.4-1.9 14.1-5.1l-6.5-5.5C29.6 35.4 27 36 24 36c-5.4 0-9.9-3.1-11.4-7.5l-6.5 5C9.7 40.1 16.3 44.5 24 44.5z"
    }), /*#__PURE__*/React.createElement("path", {
      fill: "#1976D2",
      d: "M43.6 20.5H42V20H24v8h11.3c-.8 2.4-2.3 4.4-4.3 5.9l6.5 5.5C39.7 37.3 44 31.5 44 24.5c0-1.4-.1-2.7-.4-4z"
    })), "Continue with Google")));
  }
  return /*#__PURE__*/React.createElement("div", {
    className: "min-h-screen w-full bg-[#0B1220] text-[#E6EDF3] font-sans flex flex-col"
  }, /*#__PURE__*/React.createElement("header", {
    className: "border-b border-[#25355A] px-5 py-4 flex items-center justify-between"
  }, /*#__PURE__*/React.createElement("div", {
    className: "flex items-center gap-2"
  }, /*#__PURE__*/React.createElement(DoclyLogo, {
    size: 28
  }), /*#__PURE__*/React.createElement("span", {
    className: "mono font-semibold tracking-tight text-[15px] text-white"
  }, "docly")), /*#__PURE__*/React.createElement("div", {
    className: "flex items-center gap-3"
  }, /*#__PURE__*/React.createElement("span", {
    className: "mono text-[11px] text-[#A9C6EC] hidden sm:inline"
  }, isPro ? "PRO" : dayPassActive ? "24H PASS" : `${docsLeftToday} FREE DOC LEFT TODAY`), !isPro && !dayPassActive && /*#__PURE__*/React.createElement("button", {
    onClick: buyDayPass,
    disabled: payLoading,
    className: "mono text-[11px] px-3 py-1.5 rounded border border-[#8CA3C7] text-[#8CA3C7] hover:bg-[#8CA3C7]/10 transition-colors disabled:opacity-50"
  }, "GHS 2 / 24H"), /*#__PURE__*/React.createElement("button", {
    onClick: togglePro,
    disabled: payLoading,
    className: `mono text-[11px] px-3 py-1.5 rounded border transition-colors disabled:opacity-50 ${isPro ? "border-[#FFB020] text-[#FFB020] bg-[#FFB020]/10" : "border-[#2E9DF4] text-[#2E9DF4] hover:bg-[#2E9DF4]/10"}`
  }, payLoading ? /*#__PURE__*/React.createElement("span", {
    className: "flex items-center gap-1"
  }, /*#__PURE__*/React.createElement(Icon.Loader, {
    className: "w-3 h-3"
  }), " VERIFYING") : isPro ? /*#__PURE__*/React.createElement("span", {
    className: "flex items-center gap-1"
  }, /*#__PURE__*/React.createElement(Icon.Check, {
    className: "w-3 h-3"
  }), " PRO ACTIVE") : "UPGRADE TO PRO"), /*#__PURE__*/React.createElement("button", {
    onClick: openUpdates,
    className: "relative text-[#8CA3C7] hover:text-[#E6EDF3] transition-colors",
    title: "Updates"
  }, /*#__PURE__*/React.createElement(Icon.Bell, {
    className: "w-4 h-4"
  }), hasUnseenUpdate && /*#__PURE__*/React.createElement("span", {
    className: "absolute -top-1 -right-1 w-2 h-2 rounded-full bg-[#FF5C5C]"
  })), /*#__PURE__*/React.createElement("button", {
    onClick: signOut,
    className: "text-[#8CA3C7] hover:text-[#E6EDF3] transition-colors",
    title: "Sign out"
  }, /*#__PURE__*/React.createElement(Icon.Logout, {
    className: "w-4 h-4"
  })))), payError && /*#__PURE__*/React.createElement("div", {
    className: "bg-[#FF5C5C]/10 border-b border-[#FF5C5C]/30 text-[#FF5C5C] text-[12px] text-center py-2 px-4"
  }, payError), /*#__PURE__*/React.createElement("main", {
    className: "flex-1 flex flex-col items-center px-4 py-10"
  }, !file ? /*#__PURE__*/React.createElement("div", {
    className: "w-full max-w-xl flex flex-col items-center text-center mt-10"
  }, /*#__PURE__*/React.createElement("span", {
    className: "mono text-[11px] text-[#2E9DF4] neon-text tracking-widest mb-3"
  }, "DOCUMENT → GIST"), /*#__PURE__*/React.createElement("h1", {
    className: "text-3xl sm:text-4xl font-semibold tracking-tight mb-3 text-white"
  }, "Read the point, skip the pages."), /*#__PURE__*/React.createElement("p", {
    className: "text-[#8CA3C7] mb-8 max-w-md"
  }, "Drop in a PDF. Get a clean summary in seconds, then ask it anything about the document."), /*#__PURE__*/React.createElement("div", {
    onDragOver: e => e.preventDefault(),
    onDrop: onDrop,
    className: "relative w-full border border-dashed border-[#25355A] rounded-xl py-14 px-6 hover:border-[#2E9DF4]/60 transition-colors flex flex-col items-center gap-3 bg-[#16213A]"
  }, /*#__PURE__*/React.createElement(Icon.Upload, {
    className: "w-6 h-6 text-[#2E9DF4]"
  }), /*#__PURE__*/React.createElement("div", {
    className: "mono text-sm text-[#E6EDF3]"
  }, "Drop a PDF, or tap to choose one"), /*#__PURE__*/React.createElement("div", {
    className: "text-[11px] text-[#8CA3C7]"
  }, "Free: ", FREE_MAX_PAGES, " pages, ", FREE_DOCS_PER_DAY, " document a day"), /*#__PURE__*/React.createElement("input", {
    ref: fileInputRef,
    type: "file",
    accept: "application/pdf",
    onChange: e => handleFile(e.target.files?.[0]),
    className: "absolute inset-0 w-full h-full opacity-0 cursor-pointer"
  })), error && error !== "LIMIT_REACHED" && /*#__PURE__*/React.createElement("div", {
    className: "mt-4 text-[13px] text-[#FF5C5C]"
  }, error)) : /*#__PURE__*/React.createElement("div", {
    className: "w-full max-w-2xl flex flex-col gap-4"
  }, /*#__PURE__*/React.createElement("div", {
    className: "flex items-center justify-between bg-[#16213A] border border-[#25355A] rounded-lg px-4 py-3"
  }, /*#__PURE__*/React.createElement("div", {
    className: "flex items-center gap-3 min-w-0"
  }, /*#__PURE__*/React.createElement("div", {
    className: "relative w-9 h-11 rounded bg-[#0B1220] border border-[#25355A] overflow-hidden shrink-0 flex items-center justify-center"
  }, /*#__PURE__*/React.createElement(Icon.File, {
    className: "w-4.5 h-4.5 text-[#8CA3C7]"
  }), loading && /*#__PURE__*/React.createElement("div", {
    className: "scan-line absolute left-0 right-0 h-6 bg-gradient-to-b from-transparent via-[#2E9DF4]/70 to-transparent"
  })), /*#__PURE__*/React.createElement("div", {
    className: "min-w-0"
  }, /*#__PURE__*/React.createElement("div", {
    className: "text-sm truncate"
  }, file.name), /*#__PURE__*/React.createElement("div", {
    className: "mono text-[11px] text-[#8CA3C7]"
  }, pageEstimate ? `~${pageEstimate} pages` : "size unknown"))), /*#__PURE__*/React.createElement("button", {
    onClick: resetDoc,
    className: "text-[#8CA3C7] hover:text-[#E6EDF3] shrink-0"
  }, /*#__PURE__*/React.createElement(Icon.X, {
    className: "w-4 h-4"
  }))), !gist && !loading && error !== "LIMIT_REACHED" && /*#__PURE__*/React.createElement("button", {
    onClick: startSummary,
    className: "mono text-sm bg-[#2E9DF4] neon-glow text-[#0B1220] rounded-lg py-3 flex items-center justify-center gap-2 font-semibold hover:opacity-90 transition-opacity"
  }, /*#__PURE__*/React.createElement(Icon.Sparkles, {
    className: "w-4 h-4"
  }), " SUMMARIZE"), loading && !gist && /*#__PURE__*/React.createElement("div", {
    className: "flex items-center gap-2 justify-center py-6 text-[13px] text-[#8CA3C7]"
  }, /*#__PURE__*/React.createElement(Icon.Loader, {
    className: "w-4 h-4"
  }), " building your summary…"), error === "LIMIT_REACHED" && /*#__PURE__*/React.createElement("div", {
    className: "border border-[#2E9DF4]/40 bg-[#2E9DF4]/5 rounded-lg p-4 flex flex-col gap-3"
  }, /*#__PURE__*/React.createElement("div", {
    className: "flex items-center gap-2 text-[#2E9DF4] mono text-[12px]"
  }, /*#__PURE__*/React.createElement(Icon.Zap, {
    className: "w-3.5 h-3.5"
  }), " DAILY LIMIT REACHED"), /*#__PURE__*/React.createElement("p", {
    className: "text-[13px] text-[#8CA3C7]"
  }, "You've used today's free document. Unlock more right now, or come back tomorrow."), /*#__PURE__*/React.createElement("button", {
    onClick: buyDayPass,
    disabled: payLoading,
    className: "mono text-[13px] w-full bg-[#2E9DF4] text-[#0B1220] rounded-lg py-2.5 font-semibold hover:opacity-90 transition-opacity disabled:opacity-50"
  }, "GHS 2 FOR 24 HOURS UNLIMITED"), /*#__PURE__*/React.createElement("button", {
    onClick: togglePro,
    className: "mono text-[13px] w-full border border-[#2E9DF4] text-[#2E9DF4] rounded-lg py-2.5 hover:bg-[#2E9DF4]/10 transition-colors"
  }, "OR GO PRO — GHS 30/MONTH")), error && error !== "LIMIT_REACHED" && /*#__PURE__*/React.createElement("div", {
    className: "text-[13px] text-[#FF5C5C]"
  }, error), gist && /*#__PURE__*/React.createElement("div", {
    className: "flex flex-col gap-3"
  }, /*#__PURE__*/React.createElement("div", null, /*#__PURE__*/React.createElement("span", {
    className: "mono text-[10px] text-[#2E9DF4] tracking-widest"
  }, "DOCUMENT GIST"), /*#__PURE__*/React.createElement("h2", {
    className: "text-xl font-semibold text-white mt-1"
  }, gist.title)), /*#__PURE__*/React.createElement("div", {
    className: "bg-[#16213A] border border-[#25355A] rounded-lg p-4"
  }, /*#__PURE__*/React.createElement("div", {
    className: "mono text-[11px] text-[#8CA3C7] mb-2"
  }, "TL;DR"), /*#__PURE__*/React.createElement("div", {
    className: "text-[14px] text-[#E6EDF3] leading-relaxed"
  }, renderMarkdownBlock(gist.summary, "sum"))), gist.points.length > 0 && /*#__PURE__*/React.createElement("div", {
    className: "bg-[#16213A] border border-[#25355A] rounded-lg p-4"
  }, /*#__PURE__*/React.createElement("div", {
    className: "mono text-[11px] text-[#8CA3C7] mb-3"
  }, "KEY POINTS"), /*#__PURE__*/React.createElement("div", {
    className: "flex flex-col gap-2"
  }, gist.points.map((p, i) => /*#__PURE__*/React.createElement("div", {
    key: i,
    className: "flex gap-3 items-start bg-[#0B1220] border border-[#25355A] rounded-lg p-3"
  }, /*#__PURE__*/React.createElement("span", {
    className: "mono text-[10px] font-bold text-[#2E9DF4] bg-[#2E9DF4]/15 rounded w-5 h-5 flex items-center justify-center shrink-0"
  }, i + 1), /*#__PURE__*/React.createElement("p", {
    className: "text-[14px] text-[#E6EDF3] leading-snug"
  }, renderInline(p, `pt${i}`)))))), gist.important.length > 0 && /*#__PURE__*/React.createElement("div", {
    className: "bg-[#16213A] border border-[#FFB020]/30 rounded-lg p-4"
  }, /*#__PURE__*/React.createElement("div", {
    className: "mono text-[11px] text-[#FFB020] mb-3"
  }, "IMPORTANT TO KNOW"), /*#__PURE__*/React.createElement("div", {
    className: "flex flex-col gap-2"
  }, gist.important.map((p, i) => /*#__PURE__*/React.createElement("div", {
    key: i,
    className: "flex gap-3 items-start bg-[#0B1220] border border-[#25355A] rounded-lg p-3"
  }, /*#__PURE__*/React.createElement("span", {
    className: "mono text-[10px] font-bold text-[#FFB020] bg-[#FFB020]/15 rounded w-5 h-5 flex items-center justify-center shrink-0"
  }, "!"), /*#__PURE__*/React.createElement("p", {
    className: "text-[14px] text-[#E6EDF3] leading-snug"
  }, renderInline(p, `imp${i}`)))))), gist.tags.length > 0 && /*#__PURE__*/React.createElement("div", {
    className: "flex flex-wrap gap-2"
  }, gist.tags.map((t, i) => /*#__PURE__*/React.createElement("span", {
    key: i,
    className: "mono text-[11px] px-2.5 py-1 rounded-full border border-[#25355A] text-[#8CA3C7]"
  }, "#", t)))), gist && (messages.length > 0 || loading) && /*#__PURE__*/React.createElement("div", {
    ref: scrollRef,
    className: "flex flex-col gap-4 bg-[#16213A] border border-[#25355A] rounded-lg p-4 max-h-[50vh] overflow-y-auto"
  }, messages.map((m, i) => /*#__PURE__*/React.createElement("div", {
    key: i,
    className: `flex ${m.role === "user" ? "justify-end" : "justify-start"}`
  }, /*#__PURE__*/React.createElement("div", {
    className: `rounded-lg px-3 py-2 max-w-[85%] text-[14px] whitespace-pre-wrap ${m.role === "user" ? "bg-[#2E9DF4]/10 border border-[#2E9DF4]/30 text-[#E6EDF3]" : "bg-[#0B1220] border border-[#25355A] text-[#E6EDF3]"}`
  }, m.display))), loading && messages.length > 0 && /*#__PURE__*/React.createElement("div", {
    className: "flex justify-start"
  }, /*#__PURE__*/React.createElement("div", {
    className: "rounded-lg px-3 py-2 bg-[#0B1220] border border-[#25355A] flex items-center gap-2 text-[13px] text-[#8CA3C7]"
  }, /*#__PURE__*/React.createElement(Icon.Loader, {
    className: "w-3.5 h-3.5"
  }), " thinking…"))), gist && /*#__PURE__*/React.createElement("div", {
    className: "flex items-center gap-2"
  }, /*#__PURE__*/React.createElement("input", {
    value: chatInput,
    onChange: e => setChatInput(e.target.value),
    onKeyDown: e => e.key === "Enter" && sendQuestion(),
    placeholder: "Ask something about this document…",
    disabled: loading,
    className: "flex-1 bg-[#16213A] border border-[#25355A] rounded-lg px-3 py-2.5 text-sm outline-none focus:border-[#2E9DF4]/60 placeholder:text-[#8CA3C7] disabled:opacity-50"
  }), /*#__PURE__*/React.createElement("button", {
    onClick: sendQuestion,
    disabled: loading || !chatInput.trim(),
    className: "bg-[#2E9DF4] text-[#0B1220] rounded-lg p-2.5 disabled:opacity-40 hover:opacity-90 transition-opacity"
  }, /*#__PURE__*/React.createElement(Icon.Send, {
    className: "w-4 h-4"
  }))), !isPro && gist && /*#__PURE__*/React.createElement("div", {
    className: "mono text-[11px] text-[#8CA3C7] flex items-center gap-1.5 justify-center"
  }, /*#__PURE__*/React.createElement(Icon.Zap, {
    className: "w-3 h-3 text-[#FFB020]"
  }), " Pro removes the daily limit"), gist && hasUnlimitedAccess && /*#__PURE__*/React.createElement("div", {
    className: "flex items-center gap-2 justify-center"
  }, /*#__PURE__*/React.createElement("span", {
    className: "mono text-[10px] text-[#8CA3C7]"
  }, "EXPORT:"), /*#__PURE__*/React.createElement("button", {
    onClick: exportAsTxt,
    className: "mono text-[11px] px-2.5 py-1 rounded border border-[#25355A] text-[#8CA3C7] hover:text-[#E6EDF3] hover:border-[#2E9DF4]/60 transition-colors"
  }, ".TXT"), /*#__PURE__*/React.createElement("button", {
    onClick: exportAsPdf,
    className: "mono text-[11px] px-2.5 py-1 rounded border border-[#25355A] text-[#8CA3C7] hover:text-[#E6EDF3] hover:border-[#2E9DF4]/60 transition-colors"
  }, ".PDF"), /*#__PURE__*/React.createElement("button", {
    onClick: exportAsWord,
    className: "mono text-[11px] px-2.5 py-1 rounded border border-[#25355A] text-[#8CA3C7] hover:text-[#E6EDF3] hover:border-[#2E9DF4]/60 transition-colors"
  }, ".DOC")), gist && !hasUnlimitedAccess && /*#__PURE__*/React.createElement("div", {
    className: "mono text-[11px] text-[#8CA3C7] flex items-center gap-1.5 justify-center"
  }, /*#__PURE__*/React.createElement(Icon.Zap, {
    className: "w-3 h-3 text-[#FFB020]"
  }), " Export as PDF, Word, or text with Pro"))), showUpdates && /*#__PURE__*/React.createElement("div", {
    className: "fixed inset-0 bg-black/80 flex items-center justify-center z-50 px-4"
  }, /*#__PURE__*/React.createElement("div", {
    className: "bg-[#16213A] border border-[#25355A] rounded-xl p-5 w-full max-w-sm max-h-[70vh] flex flex-col gap-3"
  }, /*#__PURE__*/React.createElement("div", {
    className: "flex items-center justify-between"
  }, /*#__PURE__*/React.createElement("span", {
    className: "mono text-sm font-semibold text-white flex items-center gap-2"
  }, /*#__PURE__*/React.createElement(Icon.Bell, {
    className: "w-4 h-4 text-[#2E9DF4]"
  }), " UPDATES"), /*#__PURE__*/React.createElement("button", {
    onClick: () => setShowUpdates(false),
    className: "text-[#8CA3C7] hover:text-[#E6EDF3]"
  }, /*#__PURE__*/React.createElement(Icon.X, {
    className: "w-4 h-4"
  }))), /*#__PURE__*/React.createElement("div", {
    className: "flex flex-col gap-3 overflow-y-auto"
  }, updates.length === 0 ? /*#__PURE__*/React.createElement("p", {
    className: "text-[13px] text-[#8CA3C7]"
  }, "No updates yet.") : updates.map(u => /*#__PURE__*/React.createElement("div", {
    key: u.id,
    className: "border-b border-[#25355A] pb-3 last:border-0"
  }, /*#__PURE__*/React.createElement("p", {
    className: "text-[13px] text-[#E6EDF3] whitespace-pre-wrap"
  }, u.message), /*#__PURE__*/React.createElement("p", {
    className: "mono text-[10px] text-[#8CA3C7] mt-1"
  }, new Date(u.created_at).toLocaleDateString())))))), showDowngradeConfirm && /*#__PURE__*/React.createElement("div", {
    className: "fixed inset-0 bg-black/80 flex items-center justify-center z-50 px-4"
  }, /*#__PURE__*/React.createElement("div", {
    className: "bg-[#16213A] border border-[#25355A] rounded-xl p-6 w-full max-w-sm flex flex-col gap-4"
  }, /*#__PURE__*/React.createElement("p", {
    className: "text-sm"
  }, "Turn off Pro features in Docly? This stops your Pro access here, but doesn't cancel the recurring charge on Paystack's side yet — email us if you need billing stopped."), /*#__PURE__*/React.createElement("div", {
    className: "flex gap-2"
  }, /*#__PURE__*/React.createElement("button", {
    onClick: confirmDowngrade,
    className: "flex-1 mono text-[13px] border border-[#FF5C5C] text-[#FF5C5C] rounded-lg py-2.5"
  }, "TURN OFF PRO"), /*#__PURE__*/React.createElement("button", {
    onClick: () => setShowDowngradeConfirm(false),
    className: "flex-1 mono text-[13px] bg-[#2E9DF4] text-[#0B1220] rounded-lg py-2.5 font-semibold"
  }, "KEEP PRO")))));
}
ReactDOM.createRoot(document.getElementById("root")).render(/*#__PURE__*/React.createElement(Docly, null));
