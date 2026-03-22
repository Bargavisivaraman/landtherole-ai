import { useState, useEffect, useRef, useCallback } from "react";
import "./App.css";

const API = "https://landtherole-ai.onrender.com";

// Fire-and-forget warm-up ping so Render server is hot before first user action
fetch(`${API}/jobs/?country=US&per_page=1`).catch(() => {});

// ── FOOTER ────────────────────────────────────────────────────────────────────
function Footer() {
  return (
    <footer className="footer">
      <p><span>LandTheRole.ai</span> · Built by Bargavi Sivaraman · © 2026</p>
    </footer>
  );
}

// ── NAV ───────────────────────────────────────────────────────────────────────
const NAV_ICONS = {
  resume: <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/><line x1="16" y1="13" x2="8" y2="13"/><line x1="16" y1="17" x2="8" y2="17"/><polyline points="10 9 9 9 8 9"/></svg>,
  jobs:   <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="2" y="7" width="20" height="14" rx="2"/><path d="M16 7V5a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v2"/></svg>,
  interview: <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M12 1a3 3 0 0 0-3 3v8a3 3 0 0 0 6 0V4a3 3 0 0 0-3-3z"/><path d="M19 10v2a7 7 0 0 1-14 0v-2"/><line x1="12" y1="19" x2="12" y2="23"/><line x1="8" y1="23" x2="16" y2="23"/></svg>,
};

function Nav({ tab, setTab, resetApp }) {
  const tabs = [
    { id: "resume",    label: "Resume" },
    { id: "jobs",      label: "Jobs" },
    { id: "interview", label: "Interview Prep" },
  ];
  return (
    <nav className="main-nav">
      <div className="nav-logo" onClick={() => { resetApp(); setTab("resume"); }}>LandTheRole.ai</div>
      <div className="nav-tabs">
        {tabs.map(t => (
          <button
            key={t.id}
            className={`nav-tab ${tab === t.id ? "active" : ""}`}
            onClick={() => setTab(t.id)}
          >
            <span className="nav-icon">{NAV_ICONS[t.id]}</span>{t.label}
          </button>
        ))}
      </div>
    </nav>
  );
}

// ── SCORE METER ───────────────────────────────────────────────────────────────
function ScoreMeter({ score }) {
  const color = score >= 75 ? "#30d158" : score >= 50 ? "#ffd60a" : "#ff453a";
  const circumference = 2 * Math.PI * 54;
  const offset = circumference - (score / 100) * circumference;
  return (
    <div className="score-meter">
      <svg width="140" height="140" viewBox="0 0 120 120">
        <circle cx="60" cy="60" r="54" fill="none" stroke="rgba(255,255,255,0.06)" strokeWidth="8"/>
        <circle cx="60" cy="60" r="54" fill="none" stroke={color} strokeWidth="8"
          strokeDasharray={circumference} strokeDashoffset={offset}
          strokeLinecap="round" transform="rotate(-90 60 60)"
          style={{ transition: "stroke-dashoffset 1.2s cubic-bezier(0.22,1,0.36,1)" }}
        />
        <text x="60" y="56" textAnchor="middle" fill="white" fontSize="22" fontWeight="800">{score}</text>
        <text x="60" y="72" textAnchor="middle" fill="rgba(255,255,255,0.4)" fontSize="10">/100</text>
      </svg>
      <p className="score-label">ATS Score</p>
    </div>
  );
}

// ── JD MATCH PANEL ────────────────────────────────────────────────────────────
function JDMatchPanel({ jd }) {
  const color = jd.verdict_color === "green" ? "#30d158" : jd.verdict_color === "yellow" ? "#ffd60a" : "#ff453a";
  const circumference = 2 * Math.PI * 40;
  const offset = circumference - (jd.match_pct / 100) * circumference;
  return (
    <div className="jd-panel reveal">
      <div className="jd-header">
        <div className="jd-circle">
          <svg width="100" height="100" viewBox="0 0 90 90">
            <circle cx="45" cy="45" r="40" fill="none" stroke="rgba(255,255,255,0.06)" strokeWidth="7"/>
            <circle cx="45" cy="45" r="40" fill="none" stroke={color} strokeWidth="7"
              strokeDasharray={circumference} strokeDashoffset={offset}
              strokeLinecap="round" transform="rotate(-90 45 45)"
              style={{ transition: "stroke-dashoffset 1.4s cubic-bezier(0.22,1,0.36,1) 0.3s" }}
            />
            <text x="45" y="41" textAnchor="middle" fill="white" fontSize="18" fontWeight="800">{jd.match_pct}%</text>
            <text x="45" y="55" textAnchor="middle" fill="rgba(255,255,255,0.4)" fontSize="8">match</text>
          </svg>
        </div>
        <div className="jd-verdict">
          <span className="verdict-badge" style={{ color, borderColor: color }}>{jd.verdict}</span>
          <p>{jd.matched_keywords.length} of {jd.total_jd_keywords} job keywords found in your resume</p>
        </div>
      </div>
      {jd.missing_keywords.length > 0 && (
        <div className="jd-missing">
          <h4>Missing Keywords</h4>
          <div className="keyword-chips">
            {jd.missing_keywords.map((kw, i) => <span key={i} className="chip chip-missing">{kw}</span>)}
          </div>
        </div>
      )}
      {jd.matched_keywords.length > 0 && (
        <div className="jd-matched">
          <h4>Matched Keywords</h4>
          <div className="keyword-chips">
            {jd.matched_keywords.map((kw, i) => <span key={i} className="chip chip-matched">{kw}</span>)}
          </div>
        </div>
      )}
      {jd.suggestions.length > 0 && (
        <div className="jd-suggestions">
          <h4>Quick Wins</h4>
          <ul>{jd.suggestions.map((s, i) => <li key={i}>{s}</li>)}</ul>
        </div>
      )}
    </div>
  );
}

// ── BULLET REWRITER ───────────────────────────────────────────────────────────
function BulletRewriter({ bullets, jobContext }) {
  const [selected, setSelected] = useState(null);
  const [rewriting, setRewriting] = useState(false);
  const [result, setResult] = useState(null);
  const [copied, setCopied] = useState(false);

  const rewrite = async (bullet) => {
    setSelected(bullet); setRewriting(true); setResult(null); setCopied(false);
    try {
      const res = await fetch(`${API}/rewrite-bullet/`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ bullet, job_context: jobContext || "" }),
      });
      setResult(await res.json());
    } catch {
      setResult({ rewritten: "Failed to rewrite. Try again.", explanation: "" });
    } finally { setRewriting(false); }
  };

  const copy = () => {
    navigator.clipboard.writeText(result.rewritten);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="bullet-rewriter reveal">
      <div className="rewriter-intro">
        <span className="rewriter-badge">AI Rewriter</span>
        <p>Click any weak bullet below to instantly improve it with strong action verbs, metrics, and ATS keywords.</p>
      </div>
      <div className="bullet-list">
        {bullets.map((b, i) => (
          <button key={i} className={`bullet-item ${selected === b ? "selected" : ""}`} onClick={() => rewrite(b)}>
            <span className="bullet-weak-tag">weak</span>
            <span className="bullet-text">{b}</span>
            <span className="bullet-arrow">→</span>
          </button>
        ))}
      </div>
      {(rewriting || result) && (
        <div className="rewrite-result">
          {rewriting ? (
            <div className="rewrite-loading"><span className="spinner" /> Rewriting with AI…</div>
          ) : result && (
            <>
              <div className="rewrite-original"><span className="tag tag-before">Before</span><p>{selected}</p></div>
              <div className="rewrite-arrow-down">↓</div>
              <div className="rewrite-improved">
                <span className="tag tag-after">After</span>
                <p>{result.rewritten}</p>
                <button className="copy-btn" onClick={copy}>{copied ? "✓ Copied!" : "Copy"}</button>
              </div>
              {result.explanation && <p className="rewrite-explanation">{result.explanation}</p>}
            </>
          )}
        </div>
      )}
    </div>
  );
}

// ── JOBS TAB ──────────────────────────────────────────────────────────────────
const INDUSTRIES = [
  "Technology","Healthcare","Education","Finance","Legal",
  "Marketing","Sales","Design & Creative","Human Resources",
  "Supply Chain","Engineering","Government","Research & Science",
  "Retail & Hospitality","Business",
];
const INDUSTRY_COLORS = {
  "Technology":          "#0a84ff",
  "Healthcare":          "#30d158",
  "Education":           "#ff9f0a",
  "Finance":             "#5ac8fa",
  "Legal":               "#ffd60a",
  "Marketing":           "#ff2d55",
  "Sales":               "#ff6b6b",
  "Design & Creative":   "#bf5af2",
  "Human Resources":     "#5e5ce6",
  "Supply Chain":        "#ffcc00",
  "Engineering":         "#8e8e93",
  "Government":          "#64d2ff",
  "Research & Science":  "#32ade6",
  "Retail & Hospitality":"#ff375f",
  "Business":            "#aeaeb2",
  "Other":               "#636366",
};
const EXP_COLORS = {
  "Entry Level": "#30d158",
  "Mid Level":   "#0a84ff",
  "Senior":      "#ff9f0a",
  "Executive":   "#ffd60a",
};

function getSource(url) {
  try {
    const host = new URL(url).hostname.replace("www.", "");
    const known = {
      "linkedin.com":"LinkedIn","indeed.com":"Indeed","glassdoor.com":"Glassdoor",
      "ziprecruiter.com":"ZipRecruiter","monster.com":"Monster","dice.com":"Dice",
      "greenhouse.io":"Greenhouse","lever.co":"Lever","workday.com":"Workday",
      "myworkdayjobs.com":"Workday","icims.com":"iCIMS","smartrecruiters.com":"SmartRecruiters",
      "careers.google.com":"Google","jobs.apple.com":"Apple","amazon.jobs":"Amazon","microsoft.com":"Microsoft",
    };
    return known[host] || host;
  } catch { return "Job Board"; }
}

function formatEmploymentType(t) {
  if (!t) return null;
  return { FULLTIME:"Full-time", PARTTIME:"Part-time", CONTRACTOR:"Contract", INTERN:"Internship" }[t.toUpperCase()] || t;
}

const CACHE_KEY = "ltr_jobs_cache";
const CACHE_TTL = 5 * 60 * 1000; // 5 minutes

function SkeletonJobCard() {
  return (
    <div className="job-card skeleton-card">
      <div className="job-card-header">
        <div className="job-card-info">
          <div className="skeleton-line" style={{ width: "30%", height: "18px", marginBottom: "10px" }} />
          <div className="skeleton-line" style={{ width: "55%", height: "22px", marginBottom: "8px" }} />
          <div className="skeleton-line" style={{ width: "40%", height: "16px" }} />
        </div>
      </div>
      <div className="skeleton-line" style={{ width: "100%", height: "14px", marginTop: "14px" }} />
      <div className="skeleton-line" style={{ width: "80%", height: "14px", marginTop: "8px" }} />
    </div>
  );
}

function JobsTab({ onPrepInterview }) {
  const [country, setCountry]     = useState("US");
  const [query, setQuery]         = useState("");
  const [jobs, setJobs]           = useState([]);
  const [loading, setLoading]     = useState(false);
  const [error, setError]         = useState(null);
  const [retryMsg, setRetryMsg]   = useState(null);
  const [page, setPage]           = useState(1);
  const [hasMore, setHasMore]     = useState(false);
  const [expanded, setExpanded]   = useState(null);
  const [showFilters, setShowFilters] = useState(false);
  const [filters, setFilters] = useState({
    industry: "", jobType: "", expLevel: "", dateRange: "all", remote: false, stateFilter: "",
  });
  const abortRef = useRef(null);

  // Load from cache on mount
  useEffect(() => {
    try {
      const cached = JSON.parse(sessionStorage.getItem(CACHE_KEY) || "null");
      if (cached && Date.now() - cached.ts < CACHE_TTL && cached.country === "US") {
        setJobs(cached.jobs);
        setHasMore(cached.hasMore);
        setPage(cached.page);
      }
    } catch {}
  }, []);

  const setFilter = (key, val) => setFilters(f => ({ ...f, [key]: val }));

  const fetchWithRetry = async (url, signal, retries = 3) => {
    for (let attempt = 0; attempt <= retries; attempt++) {
      try {
        const res = await fetch(url, { signal });
        if (res.ok) return res;
        if (res.status < 500 || attempt === retries) return res;
        setRetryMsg(`Server warming up… (attempt ${attempt + 1}/${retries})`);
        await new Promise(r => setTimeout(r, (attempt + 1) * 3000));
      } catch (e) {
        if (e.name === "AbortError") throw e;
        if (attempt === retries) throw e;
        setRetryMsg(`Retrying… (attempt ${attempt + 1}/${retries})`);
        await new Promise(r => setTimeout(r, (attempt + 1) * 3000));
      }
    }
  };

  const fetchJobs = useCallback(async (c, kw, pg, f = filters) => {
    if (abortRef.current) abortRef.current.abort();
    const controller = new AbortController();
    abortRef.current = controller;
    if (pg === 1) setJobs([]);
    setLoading(true);
    setError(null);
    setRetryMsg(null);
    try {
      const params = new URLSearchParams({ country: c, page: pg, per_page: 20 });
      if (kw.trim())             params.set("keyword", kw.trim());
      if (f.industry)            params.set("industry", f.industry);
      if (f.jobType)             params.set("job_type", f.jobType);
      if (f.expLevel)            params.set("experience_level", f.expLevel);
      if (f.dateRange !== "all") params.set("date_range", f.dateRange);
      if (f.remote)              params.set("remote", "true");
      if (f.stateFilter.trim())  params.set("state_filter", f.stateFilter.trim());
      const res = await fetchWithRetry(`${API}/jobs/?${params}`, controller.signal);
      if (!res || controller.signal.aborted) return;
      if (!res.ok) {
        const body = await res.json().catch(() => ({}));
        throw new Error(body.detail || `Server error ${res.status}`);
      }
      const data = await res.json();
      const newJobs = pg === 1 ? (data.jobs || []) : null;
      if (pg === 1) {
        setJobs(data.jobs || []);
        try {
          sessionStorage.setItem(CACHE_KEY, JSON.stringify({
            jobs: data.jobs || [], hasMore: data.has_more === true,
            page: pg, ts: Date.now(), country: c,
          }));
        } catch {}
      } else {
        setJobs(prev => [...prev, ...(data.jobs || [])]);
      }
      setHasMore(data.has_more === true);
      setPage(pg);
    } catch (e) {
      if (e.name === "AbortError") return;
      const isColdStart = e.message.toLowerCase().includes("fetch") ||
                          e.message.toLowerCase().includes("network") ||
                          e.message.toLowerCase().includes("failed");
      setError(isColdStart ? "cold_start" : e.message);
    } finally {
      setRetryMsg(null);
      setLoading(false);
    }
  }, [filters]);

  // Initial load + country switch
  useEffect(() => { fetchJobs(country, "", 1); }, [country]);

  // Debounced search — fires 400 ms after query stops changing
  useEffect(() => {
    if (!query) return;
    const t = setTimeout(() => fetchJobs(country, query, 1), 400);
    return () => clearTimeout(t);
  }, [query]);

  const search = () => fetchJobs(country, query, 1);

  const applyFilter = (key, val) => {
    const next = { ...filters, [key]: val };
    setFilters(next);
    fetchJobs(country, query, 1, next);
  };

  const clearFilters = () => {
    const reset = { industry: "", jobType: "", expLevel: "", dateRange: "all", remote: false, stateFilter: "" };
    setFilters(reset);
    fetchJobs(country, query, 1, reset);
  };

  const hasActiveFilters = filters.industry || filters.jobType || filters.expLevel ||
                           filters.dateRange !== "all" || filters.remote || filters.stateFilter;

  const formatDate = (dateStr) => {
    if (!dateStr) return null;
    const diff = Math.floor((Date.now() - new Date(dateStr)) / 3600000);
    if (diff < 1)  return "Just now";
    if (diff < 24) return `${diff}h ago`;
    const d = Math.floor(diff / 24);
    if (d < 7)     return `${d}d ago`;
    return `${Math.floor(d / 7)}w ago`;
  };

  return (
    <div className="jobs-page">
      <div className="jobs-header">
        <h2>Find Your Next Role</h2>
        <p>Real jobs across every industry, updated every 8 hours</p>
        <div className="jobs-controls">
          <div className="country-toggle">
            {[["US", "🇺🇸 United States"], ["IN", "🇮🇳 India"]].map(([code, label]) => (
              <button key={code} className={country === code ? "active" : ""} onClick={() => { setCountry(code); setQuery(""); }}>
                {label}
              </button>
            ))}
          </div>
          <div className="job-search-form">
            <input
              placeholder="Job title, skill, or keyword…"
              value={query}
              onChange={e => setQuery(e.target.value)}
              onKeyDown={e => e.key === "Enter" && search()}
            />
            <button onClick={search}>Search</button>
          </div>
          <button className={`filter-toggle-btn ${showFilters ? "active" : ""}`} onClick={() => setShowFilters(v => !v)}>
            {showFilters ? "▲ Hide Filters" : "▼ Filters"}{hasActiveFilters ? " •" : ""}
          </button>
        </div>
      </div>

      {showFilters && (
        <div className="filter-panel">
          <div className="filter-row">
            <span className="filter-label">Industry</span>
            <div className="filter-chips">
              {INDUSTRIES.map(ind => (
                <button key={ind} className={`filter-chip ${filters.industry === ind ? "active" : ""}`}
                  style={filters.industry === ind ? { borderColor: INDUSTRY_COLORS[ind], color: INDUSTRY_COLORS[ind], background: `${INDUSTRY_COLORS[ind]}18` } : {}}
                  onClick={() => applyFilter("industry", filters.industry === ind ? "" : ind)}>
                  {ind}
                </button>
              ))}
            </div>
          </div>
          <div className="filter-row">
            <span className="filter-label">Job Type</span>
            <div className="filter-chips">
              {[["FULLTIME","Full-time"],["PARTTIME","Part-time"],["CONTRACTOR","Contract"],["INTERN","Internship"]].map(([val, label]) => (
                <button key={val} className={`filter-chip ${filters.jobType === val ? "active" : ""}`}
                  onClick={() => applyFilter("jobType", filters.jobType === val ? "" : val)}>
                  {label}
                </button>
              ))}
            </div>
          </div>
          <div className="filter-row">
            <span className="filter-label">Experience</span>
            <div className="filter-chips">
              {[["Entry Level","Entry Level"],["Mid Level","Mid Level"],["Senior","Senior"],["Executive","Executive"]].map(([val, label]) => (
                <button key={val} className={`filter-chip ${filters.expLevel === val ? "active" : ""}`}
                  onClick={() => applyFilter("expLevel", filters.expLevel === val ? "" : val)}>
                  {label}
                </button>
              ))}
            </div>
          </div>
          <div className="filter-row">
            <span className="filter-label">Posted</span>
            <div className="filter-chips">
              {[["24h","Past 24h"],["7d","Past 7 days"],["30d","Past Month"],["all","All Time"]].map(([val, label]) => (
                <button key={val} className={`filter-chip ${filters.dateRange === val ? "active" : ""}`}
                  onClick={() => applyFilter("dateRange", val)}>
                  {label}
                </button>
              ))}
            </div>
          </div>
          <div className="filter-row">
            <span className="filter-label">Work Mode</span>
            <div className="filter-chips">
              <button className={`filter-chip ${filters.remote ? "active" : ""}`}
                onClick={() => applyFilter("remote", !filters.remote)}>
                Remote Only
              </button>
            </div>
            <input
              className="filter-state-input"
              placeholder="State (e.g. CA, Texas)"
              value={filters.stateFilter}
              onChange={e => setFilter("stateFilter", e.target.value)}
              onKeyDown={e => e.key === "Enter" && applyFilter("stateFilter", filters.stateFilter)}
            />
            <button className="filter-apply-btn" onClick={() => fetchJobs(country, query, 1)}>Apply</button>
            {hasActiveFilters && <button className="filter-clear-btn" onClick={clearFilters}>Clear All</button>}
          </div>
        </div>
      )}

      {retryMsg && (
        <p className="error-msg" style={{ textAlign: "center", padding: "10px 0", opacity: 0.7 }}>
          ⏳ {retryMsg}
        </p>
      )}

      {error === "cold_start" ? (
        <div className="jobs-empty" style={{ padding: "40px 0" }}>
          <p style={{ fontSize: "1.1rem", marginBottom: "8px" }}>⏳ Server is waking up…</p>
          <p style={{ opacity: 0.6, marginBottom: "20px" }}>This can take up to 60 seconds on first load. Please wait or retry.</p>
          <button className="load-more-btn" onClick={() => fetchJobs(country, query, 1)}>Retry</button>
        </div>
      ) : error ? (
        <div className="jobs-empty" style={{ padding: "40px 0" }}>
          <p style={{ fontSize: "1rem", marginBottom: "16px", color: "#ff453a" }}>⚠ {error}</p>
          <button className="load-more-btn" onClick={() => fetchJobs(country, query, 1)}>Retry</button>
        </div>
      ) : null}

      {!error && (loading && jobs.length === 0 ? (
        <div className="jobs-list">
          {Array.from({ length: 6 }).map((_, i) => <SkeletonJobCard key={i} />)}
        </div>
      ) : jobs.length === 0 && !loading ? (
        <div className="jobs-empty">No jobs found. Try adjusting your filters or search terms.</div>
      ) : (
        <>
          {jobs.length > 0 && (
            <p className="jobs-count">{jobs.length} job{jobs.length !== 1 ? "s" : ""} loaded{hasActiveFilters ? " (filtered)" : ""}</p>
          )}
          <div className="jobs-list">
            {jobs.map(job => {
              const indColor = INDUSTRY_COLORS[job.industry] || "#636366";
              const expColor = EXP_COLORS[job.experience_level] || "#aeaeb2";
              const src = job.url ? getSource(job.url) : null;
              const empType = formatEmploymentType(job.employment_type);
              return (
                <div key={job.job_id} className="job-card">
                  <div className="job-card-header">
                    <div className="job-card-info">
                      <div className="job-badges">
                        {job.industry && job.industry !== "Other" && (
                          <span className="job-badge" style={{ color: indColor, background: `${indColor}18`, border: `1px solid ${indColor}40` }}>{job.industry}</span>
                        )}
                        {job.experience_level && (
                          <span className="job-badge" style={{ color: expColor, background: `${expColor}18`, border: `1px solid ${expColor}40` }}>{job.experience_level}</span>
                        )}
                        {job.is_remote && (
                          <span className="job-badge" style={{ color: "#30d158", background: "rgba(48,209,88,0.1)", border: "1px solid rgba(48,209,88,0.3)" }}>Remote</span>
                        )}
                        {empType && (
                          <span className="job-badge" style={{ color: "rgba(255,255,255,0.5)", background: "rgba(255,255,255,0.06)", border: "1px solid rgba(255,255,255,0.1)" }}>{empType}</span>
                        )}
                      </div>
                      <p className="job-title">{job.title || "Untitled"}</p>
                      <p className="job-company">{job.company || "Company not listed"}</p>
                      <div className="job-meta">
                        {job.location && <span>📍 {job.location}</span>}
                        {job.posted_at && formatDate(job.posted_at) && <span>🕒 {formatDate(job.posted_at)}</span>}
                        {src && <span className="job-source">via {src}</span>}
                      </div>
                    </div>
                    <div className="job-actions">
                      {job.url ? (
                        <a className="apply-btn" href={job.url} target="_blank" rel="noopener noreferrer">Apply Now</a>
                      ) : (
                        <span className="apply-btn apply-na">No Link</span>
                      )}
                      <button className="interview-btn" onClick={() => onPrepInterview(job.title, job.company)}>
                        Prep Interview
                      </button>
                    </div>
                  </div>
                  {job.description ? (
                    <p className="job-desc">
                      {expanded === job.job_id
                        ? job.description
                        : job.description.slice(0, 200) + (job.description.length > 200 ? "…" : "")}
                      {job.description.length > 200 && (
                        <button className="expand-btn" onClick={() => setExpanded(expanded === job.job_id ? null : job.job_id)}>
                          {expanded === job.job_id ? " Show less" : " Show more"}
                        </button>
                      )}
                    </p>
                  ) : (
                    <p className="job-desc" style={{ opacity: 0.3 }}>No description available.</p>
                  )}
                </div>
              );
            })}
          </div>
          {hasMore && (
            <div style={{ textAlign: "center", marginTop: "36px" }}>
              <button className="load-more-btn" onClick={() => fetchJobs(country, query, page + 1)} disabled={loading}>
                {loading ? <><span className="spinner" /> Loading…</> : "Load More Jobs"}
              </button>
            </div>
          )}
        </>
      ))}
    </div>
  );
}

// ── INTERVIEW TAB ─────────────────────────────────────────────────────────────
function InterviewPage({ prefillTitle, prefillCompany }) {
  const [jd, setJd] = useState("");
  const [resumeText, setResumeText] = useState("");
  const [numQ, setNumQ] = useState(10);
  const [loading, setLoading] = useState(false);
  const [questions, setQuestions] = useState(null);
  const [roleSummary, setRoleSummary] = useState("");
  const [difficulty, setDifficulty] = useState("");
  const [activeQ, setActiveQ] = useState(null);
  const [answers, setAnswers] = useState({});
  const [evaluations, setEvaluations] = useState({});
  const [evaluating, setEvaluating] = useState({});

  const generate = async () => {
    if (!jd.trim() || jd.trim().length < 50) return alert("Please paste a job description (at least 50 characters)");
    setLoading(true); setQuestions(null); setEvaluations({}); setAnswers({});
    try {
      const res = await fetch(`${API}/generate-interview/`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ job_description: jd, resume_text: resumeText, num_questions: numQ }),
      });
      const data = await res.json();
      setQuestions(data.questions || []);
      setRoleSummary(data.role_summary || "");
      setDifficulty(data.difficulty || "");
    } catch { alert("Failed to generate questions. Try again."); }
    finally { setLoading(false); }
  };

  const evaluate = async (q) => {
    const answer = answers[q.id];
    if (!answer || answer.trim().length < 10) return alert("Write at least a sentence before evaluating!");
    setEvaluating(prev => ({ ...prev, [q.id]: true }));
    try {
      const res = await fetch(`${API}/evaluate-answer/`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ question: q.question, answer, job_description: jd, resume_text: resumeText }),
      });
      const data = await res.json();
      setEvaluations(prev => ({ ...prev, [q.id]: data }));
    } catch { alert("Evaluation failed. Try again."); }
    finally { setEvaluating(prev => ({ ...prev, [q.id]: false })); }
  };

  const typeColors = { technical: "#0a84ff", behavioral: "#30d158", situational: "#ffd60a", culture: "#bf5af2" };
  const scoreColor = (s) => s >= 80 ? "#30d158" : s >= 60 ? "#ffd60a" : "#ff453a";

  return (
    <div className="interview-page">
      <div className="interview-header">
        <h2>Interview Prep</h2>
        <p>Get tailored questions from any job description — then practice your answers with AI feedback</p>
      </div>

      {!questions ? (
        <div className="interview-setup card">
          {prefillTitle && (
            <div className="prefill-banner">
              Prepped for: <strong>{prefillTitle}</strong>{prefillCompany ? ` at ${prefillCompany}` : ""}
            </div>
          )}
          <label className="field-label">Job Description *</label>
          <textarea
            className="interview-textarea"
            placeholder="Paste the full job description here…"
            value={jd}
            onChange={e => setJd(e.target.value)}
            rows={8}
          />
          <label className="field-label">Your Resume (optional — for personalized questions)</label>
          <textarea
            className="interview-textarea"
            placeholder="Paste your resume text here for personalized questions…"
            value={resumeText}
            onChange={e => setResumeText(e.target.value)}
            rows={4}
          />
          <div className="num-questions">
            <label className="field-label">Number of Questions</label>
            <div className="num-btns">
              {[5, 10, 15, 20].map(n => (
                <button key={n} className={numQ === n ? "active" : ""} onClick={() => setNumQ(n)}>{n}</button>
              ))}
            </div>
          </div>
          <button className="analyze-btn" onClick={generate} disabled={loading}>
            {loading ? <><span className="spinner" /> Generating Questions…</> : "Generate Interview Questions"}
          </button>
        </div>
      ) : (
        <div className="interview-results">
          <div className="interview-meta reveal">
            <div className="meta-card">
              <span className="meta-label">Role Summary</span>
              <p>{roleSummary}</p>
            </div>
            <div className="meta-card">
              <span className="meta-label">Difficulty</span>
              <span className="difficulty-badge">{difficulty}</span>
            </div>
            <button className="reset-btn" onClick={() => setQuestions(null)}>← New JD</button>
          </div>

          <div className="questions-list">
            {questions.map((q, i) => (
              <div key={q.id} className={`question-card reveal ${activeQ === q.id ? "expanded" : ""}`}>
                <div className="question-header" onClick={() => setActiveQ(activeQ === q.id ? null : q.id)}>
                  <div className="question-left">
                    <span className="q-num">Q{i + 1}</span>
                    <span className="q-type" style={{ color: typeColors[q.type] || "#fff", borderColor: typeColors[q.type] || "#fff" }}>
                      {q.type}
                    </span>
                    <p className="q-text">{q.question}</p>
                  </div>
                  <span className="q-toggle">{activeQ === q.id ? "▲" : "▼"}</span>
                </div>

                {activeQ === q.id && (
                  <div className="question-body">
                    <div className="why-asked">
                      <span className="why-label">Why they ask this:</span>
                      <p>{q.why_asked}</p>
                    </div>
                    <div className="hints">
                      <span className="hints-label">Good answer should include:</span>
                      <ul>{(q.good_answer_hints || []).map((h, j) => <li key={j}>{h}</li>)}</ul>
                    </div>
                    <div className="answer-section">
                      <label className="field-label">Your Answer</label>
                      <textarea
                        className="answer-textarea"
                        placeholder="Type your answer here and get instant AI feedback…"
                        value={answers[q.id] || ""}
                        onChange={e => setAnswers(prev => ({ ...prev, [q.id]: e.target.value }))}
                        rows={5}
                      />
                      <button className="evaluate-btn" onClick={() => evaluate(q)} disabled={evaluating[q.id]}>
                        {evaluating[q.id] ? <><span className="spinner" /> Evaluating…</> : "Get AI Feedback"}
                      </button>
                    </div>

                    {evaluations[q.id] && (
                      <div className="evaluation-result">
                        <div className="eval-score">
                          <span className="score-num" style={{ color: scoreColor(evaluations[q.id].score) }}>
                            {evaluations[q.id].score}/100
                          </span>
                          <span className="score-label-sm">Answer Score</span>
                        </div>
                        <div className="eval-feedback">
                          <h5>Feedback</h5>
                          <p>{evaluations[q.id].feedback}</p>
                        </div>
                        {evaluations[q.id].keywords_used?.length > 0 && (
                          <div className="eval-keywords">
                            <h5>Keywords Used Well</h5>
                            <div className="keyword-chips">
                              {evaluations[q.id].keywords_used.map((k, j) => <span key={j} className="chip chip-matched">{k}</span>)}
                            </div>
                          </div>
                        )}
                        {evaluations[q.id].keywords_missing?.length > 0 && (
                          <div className="eval-keywords">
                            <h5>Keywords to Add</h5>
                            <div className="keyword-chips">
                              {evaluations[q.id].keywords_missing.map((k, j) => <span key={j} className="chip chip-missing">{k}</span>)}
                            </div>
                          </div>
                        )}
                        <div className="eval-improved">
                          <h5>Improved Answer</h5>
                          <p>{evaluations[q.id].improved_answer}</p>
                          <button className="copy-btn" onClick={() => navigator.clipboard.writeText(evaluations[q.id].improved_answer)}>
                            Copy
                          </button>
                        </div>
                      </div>
                    )}
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

// ── RESUME PAGE ───────────────────────────────────────────────────────────────
function ResumePage() {
  const [file, setFile]           = useState(null);
  const [jdText, setJdText]       = useState("");
  const [result, setResult]       = useState(null);
  const [loading, setLoading]     = useState(false);
  const [error, setError]         = useState(null);
  const [jdExpanded, setJdExpanded] = useState(false);

  const handleFileChange = (e) => { setFile(e.target.files[0]); setError(null); };

  const handleUpload = async () => {
    if (!file) { setError("Please select a PDF file first."); return; }
    setLoading(true); setError(null);
    const formData = new FormData();
    formData.append("file", file);
    if (jdText.trim()) formData.append("job_description", jdText.trim());
    try {
      const res = await fetch(`${API}/analyze-resume/`, { method: "POST", body: formData });
      const data = await res.json();
      if (!res.ok) throw new Error(data.detail || "Failed to analyze resume");
      setResult(data);
      window.scrollTo({ top: 0, behavior: "smooth" });
    } catch (err) { setError(err.message); }
    finally { setLoading(false); }
  };

  const resetApp = () => { setResult(null); setFile(null); setError(null); setJdText(""); setJdExpanded(false); };

  useEffect(() => {
    if (!result) return;
    const observer = new IntersectionObserver(
      (entries) => entries.forEach((e) => { if (e.isIntersecting) e.target.classList.add("in-view"); }),
      { threshold: 0.08 }
    );
    const timer = setTimeout(() => {
      document.querySelectorAll(".reveal, .stagger-list, .score-meter").forEach((el) => observer.observe(el));
    }, 80);
    return () => { clearTimeout(timer); observer.disconnect(); };
  }, [result]);

  if (!result) return (
    <div className="hero">
      <div className="card">
        <div className="logo-tag">LandTheRole.ai</div>
        <h1>Get Hired Faster</h1>
        <p>AI-powered resume scoring, job match analysis, and instant bullet rewrites — built to get you shortlisted.</p>
        <div className="upload-row">
          <label className="file-label">
            <input type="file" accept=".pdf" onChange={handleFileChange} />
            <span className="file-btn">{file ? file.name : "Choose Resume PDF"}</span>
          </label>
        </div>
        <div className="jd-toggle">
          <button className="jd-toggle-btn" onClick={() => setJdExpanded(!jdExpanded)}>
            {jdExpanded ? "▲ Hide" : "▼ Add"} Job Description <span className="jd-badge">+Match %</span>
          </button>
        </div>
        {jdExpanded && (
          <div className="jd-input-area">
            <textarea
              placeholder="Paste the job description here to get a keyword match score and tailored suggestions…"
              value={jdText}
              onChange={(e) => setJdText(e.target.value)}
              rows={6}
            />
            <p className="jd-hint">{jdText.length > 0 ? `${jdText.split(/\s+/).filter(Boolean).length} words pasted` : "Tip: paste the full JD for best results"}</p>
          </div>
        )}
        <button className="analyze-btn" onClick={handleUpload} disabled={loading}>
          {loading && <span className="spinner" />}
          {loading ? "Analyzing…" : "Analyze My Resume"}
        </button>
        <div className="feature-pills">
          <span>◆ ATS Score</span>
          <span>◆ JD Match %</span>
          <span>◆ AI Rewrites</span>
        </div>
        {error && <p className="error-msg">{error}</p>}
      </div>
    </div>
  );

  return (
    <div className="results-section">
      <div className="results-top reveal">
        <ScoreMeter score={result.ats_score} />
        <div className="results-summary">
          <h2>Your Resume Analysis</h2>
          <p>{result.summary_feedback}</p>
        </div>
      </div>
      {result.jd_match && (<><h3 className="reveal">Job Description Match</h3><JDMatchPanel jd={result.jd_match} /></>)}
      <h3 className="reveal">Strengths</h3>
      <ul className="strengths stagger-list">{(result.strengths || []).map((s, i) => <li key={i}>{s}</li>)}</ul>
      <h3 className="reveal">Weaknesses</h3>
      <ul className="weaknesses stagger-list">{(result.weaknesses || []).map((w, i) => <li key={i}>{w}</li>)}</ul>
      {result.weak_bullets?.length > 0 && (<><h3 className="reveal">Rewrite Weak Bullets</h3><BulletRewriter bullets={result.weak_bullets} jobContext={jdText} /></>)}
      <h3 className="reveal">Missing Skills</h3>
      <ul className="stagger-list">{(result.missing_skills || []).map((m, i) => <li key={i}>{m}</li>)}</ul>
      <h3 className="reveal">Recommendations</h3>
      <ul className="stagger-list">{(result.recommendations || []).map((r, i) => <li key={i}>{r}</li>)}</ul>
      <div className="reveal" style={{ marginTop: "56px", textAlign: "center" }}>
        <button className="analyze-btn" onClick={resetApp}>Analyze Another Resume</button>
      </div>
    </div>
  );
}

// ── APP ROOT ──────────────────────────────────────────────────────────────────
function App() {
  const [tab, setTab]               = useState("resume");
  const [interviewTitle, setInterviewTitle]   = useState(null);
  const [interviewCompany, setInterviewCompany] = useState(null);

  const handlePrepInterview = (title, company) => {
    setInterviewTitle(title);
    setInterviewCompany(company);
    setTab("interview");
  };

  const resetApp = () => {
    setInterviewTitle(null);
    setInterviewCompany(null);
  };

  return (
    <>
      <Nav tab={tab} setTab={setTab} resetApp={resetApp} />
      <main className="main-content">
        <div className="tab-panel" key={tab}>
          {tab === "resume"    && <ResumePage />}
          {tab === "jobs"      && <JobsTab onPrepInterview={handlePrepInterview} />}
          {tab === "interview" && <InterviewPage prefillTitle={interviewTitle} prefillCompany={interviewCompany} />}
        </div>
      </main>
    </>
  );
}

export default App;
