import { useState, useEffect } from "react";
import "./App.css";

const API = "https://landtherole-ai.onrender.com";

// ── FOOTER ────────────────────────────────────────────────────────────────────
function Footer() {
  return (
    <footer className="footer">
      <p><span>LandTheRole.ai</span> · Built by Bargavi Sivaraman · © 2026</p>
    </footer>
  );
}

// ── NAV ───────────────────────────────────────────────────────────────────────
function Nav({ tab, setTab }) {
  const tabs = [
    { id: "resume",    label: "Resume" },
    { id: "jobs",      label: "Jobs" },
    { id: "interview", label: "Interview Prep" },
  ];
  return (
    <nav className="main-nav">
      <div className="nav-logo" onClick={() => setTab("resume")}>🎯 LandTheRole.ai</div>
      <div className="nav-tabs">
        {tabs.map((t) => (
          <button key={t.id} className={`nav-tab ${tab === t.id ? "active" : ""}`} onClick={() => setTab(t.id)}>
            {t.label}
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
        <span className="rewriter-badge">✨ AI Rewriter</span>
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
              {result.explanation && <p className="rewrite-explanation">💡 {result.explanation}</p>}
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
    const known = { "linkedin.com":"LinkedIn","indeed.com":"Indeed","glassdoor.com":"Glassdoor","ziprecruiter.com":"ZipRecruiter","monster.com":"Monster","dice.com":"Dice","greenhouse.io":"Greenhouse","lever.co":"Lever","workday.com":"Workday","myworkdayjobs.com":"Workday","icims.com":"iCIMS","smartrecruiters.com":"SmartRecruiters","careers.google.com":"Google","jobs.apple.com":"Apple","amazon.jobs":"Amazon","microsoft.com":"Microsoft" };
    return known[host] || host;
  } catch { return "Job Board"; }
}

function formatEmploymentType(t) {
  if (!t) return null;
  return { FULLTIME:"Full-time", PARTTIME:"Part-time", CONTRACTOR:"Contract", INTERN:"Internship" }[t.toUpperCase()] || t;
}

function JobsTab({ onPrepInterview }) {
  const [country, setCountry]   = useState("US");
  const [query, setQuery]       = useState("");
  const [jobs, setJobs]         = useState([]);
  const [loading, setLoading]   = useState(false);
  const [error, setError]       = useState(null);
  const [page, setPage]         = useState(1);
  const [hasMore, setHasMore]   = useState(false);
  const [expanded, setExpanded] = useState(null);
  const [showFilters, setShowFilters] = useState(false);
  const [filters, setFilters] = useState({
    industry: "", jobType: "", expLevel: "", dateRange: "all", remote: false, stateFilter: "",
  });

  const setFilter = (key, val) => setFilters(f => ({ ...f, [key]: val }));

  const fetchJobs = async (c, kw, pg, f = filters) => {
    setLoading(true);
    setError(null);
    try {
      const params = new URLSearchParams({ country: c, page: pg, per_page: 20 });
      if (kw.trim())             params.set("keyword", kw.trim());
      if (f.industry)            params.set("industry", f.industry);
      if (f.jobType)             params.set("job_type", f.jobType);
      if (f.expLevel)            params.set("experience_level", f.expLevel);
      if (f.dateRange !== "all") params.set("date_range", f.dateRange);
      if (f.remote)              params.set("remote", "true");
      if (f.stateFilter.trim())  params.set("state_filter", f.stateFilter.trim());
      const res = await fetch(`${API}/jobs/?${params}`);
      if (!res.ok) throw new Error("Failed to fetch jobs. The server may be waking up — try again in a moment.");
      const data = await res.json();
      if (pg === 1) setJobs(data.jobs);
      else setJobs(prev => [...prev, ...data.jobs]);
      setHasMore(data.jobs.length === 20);
      setPage(pg);
    } catch (e) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchJobs(country, "", 1); }, [country]);

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

  const hasActiveFilters = filters.industry || filters.jobType || filters.expLevel || filters.dateRange !== "all" || filters.remote || filters.stateFilter;

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
              {[["entry","Entry Level"],["mid","Mid Level"],["senior","Senior"],["executive","Executive"]].map(([val, label]) => (
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

      {error && <p className="error-msg" style={{ textAlign: "center", padding: "20px 0" }}>{error}</p>}

      {loading && jobs.length === 0 ? (
        <div className="jobs-loading"><span className="spinner" /> Loading jobs…</div>
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
                        🎤 Prep Interview
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
      )}
    </div>
  );
}

// ── INTERVIEW TAB ─────────────────────────────────────────────────────────────
const Q_TYPE_COLORS = {
  technical:   { color: "#0a84ff", bg: "rgba(10,132,255,0.12)"  },
  behavioral:  { color: "#30d158", bg: "rgba(48,209,88,0.12)"   },
  situational: { color: "#ffd60a", bg: "rgba(255,214,10,0.12)"  },
  culture:     { color: "#bf5af2", bg: "rgba(191,90,242,0.12)"  },
};

function QuestionCard({ q, idx, jd }) {
  const [open, setOpen]         = useState(false);
  const [answer, setAnswer]     = useState("");
  const [evaluating, setEval]   = useState(false);
  const [evalResult, setResult] = useState(null);

  const typeStyle = Q_TYPE_COLORS[q.type] || Q_TYPE_COLORS.technical;
  const scoreColor = evalResult
    ? evalResult.score >= 75 ? "#30d158" : evalResult.score >= 50 ? "#ffd60a" : "#ff453a"
    : "#fff";

  const evaluate = async () => {
    if (answer.trim().length < 10) return;
    setEval(true);
    try {
      const res = await fetch(`${API}/evaluate-answer/`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ question: q.question, answer, job_description: jd || "" }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.detail || "Evaluation failed");
      setResult(data);
    } catch {
      setResult({ score: 0, feedback: "Evaluation failed. Please try again.", improved_answer: "", keywords_used: [], keywords_missing: [] });
    } finally {
      setEval(false);
    }
  };

  return (
    <div className={`question-card ${open ? "expanded" : ""}`}>
      <div className="question-header" onClick={() => setOpen(!open)}>
        <div className="question-left">
          <span className="q-num">Q{idx + 1}</span>
          <span className="q-type" style={{ color: typeStyle.color, borderColor: typeStyle.color, background: typeStyle.bg }}>
            {q.type}
          </span>
          <p className="q-text">{q.question}</p>
        </div>
        <span className="q-toggle">{open ? "▲" : "▼"}</span>
      </div>
      {open && (
        <div className="question-body">
          {q.why_asked && (
            <div className="why-asked">
              <span className="why-label">Why they ask this</span>
              <p>{q.why_asked}</p>
            </div>
          )}
          {q.good_answer_hints?.length > 0 && (
            <div className="hints">
              <span className="hints-label">Answer tips</span>
              <ul>{q.good_answer_hints.map((h, i) => <li key={i}>{h}</li>)}</ul>
            </div>
          )}
          <div className="answer-section">
            <span className="why-label">Your Answer</span>
            <textarea
              className="answer-textarea"
              rows={5}
              placeholder="Type your answer here, then click Evaluate to get AI feedback…"
              value={answer}
              onChange={e => setAnswer(e.target.value)}
            />
            <button
              className="evaluate-btn"
              onClick={evaluate}
              disabled={evaluating || answer.trim().length < 10}
            >
              {evaluating ? <><span className="spinner" /> Evaluating…</> : "⚡ Evaluate Answer"}
            </button>
          </div>
          {evalResult && (
            <div className="evaluation-result">
              <div className="eval-score">
                <span className="score-num" style={{ color: scoreColor }}>{evalResult.score}</span>
                <span className="score-label-sm">/ 100</span>
              </div>
              <div className="eval-feedback">
                <h5>Feedback</h5>
                <p>{evalResult.feedback}</p>
              </div>
              {evalResult.keywords_used?.length > 0 && (
                <div className="eval-keywords">
                  <h5>Keywords Used Well</h5>
                  <div className="keyword-chips">
                    {evalResult.keywords_used.map((k, i) => <span key={i} className="chip chip-matched">{k}</span>)}
                  </div>
                </div>
              )}
              {evalResult.keywords_missing?.length > 0 && (
                <div className="eval-keywords">
                  <h5>Keywords to Include</h5>
                  <div className="keyword-chips">
                    {evalResult.keywords_missing.map((k, i) => <span key={i} className="chip chip-missing">{k}</span>)}
                  </div>
                </div>
              )}
              {evalResult.improved_answer && (
                <div className="eval-improved">
                  <h5>Sample Strong Answer</h5>
                  <p>{evalResult.improved_answer}</p>
                </div>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  );
}

function InterviewTab({ prefillRole, prefillCompany }) {
  const buildDefault = (role, company) =>
    role
      ? `Role: ${role}${company ? `\nCompany: ${company}` : ""}\n\nPaste the full job description here for best results.`
      : "";

  const [jd, setJd]             = useState(() => buildDefault(prefillRole, prefillCompany));
  const [numQuestions, setNum]  = useState(10);
  const [generating, setGen]    = useState(false);
  const [session, setSession]   = useState(null);
  const [error, setError]       = useState(null);

  useEffect(() => {
    if (prefillRole && !session) {
      setJd(buildDefault(prefillRole, prefillCompany));
    }
  }, [prefillRole, prefillCompany]);

  const generate = async () => {
    if (jd.trim().length < 50) {
      setError("Please provide at least 50 characters of job description.");
      return;
    }
    setGen(true);
    setError(null);
    try {
      const res = await fetch(`${API}/generate-interview/`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ job_description: jd, num_questions: numQuestions }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.detail || "Failed to generate questions");
      setSession(data);
    } catch (e) {
      setError(e.message);
    } finally {
      setGen(false);
    }
  };

  if (session) {
    return (
      <div className="interview-page">
        <div className="interview-header">
          <h2>Interview Prep</h2>
          <p>{session.role_summary}</p>
        </div>
        <div className="interview-meta">
          <div className="meta-card">
            <span className="meta-label">Questions</span>
            <p>{session.questions.length} generated</p>
          </div>
          <div className="meta-card">
            <span className="meta-label">Difficulty</span>
            <p><span className="difficulty-badge">{session.difficulty}</span></p>
          </div>
          <button className="reset-btn" onClick={() => { setSession(null); setError(null); }}>← New Session</button>
        </div>
        <div className="questions-list">
          {session.questions.map((q, i) => (
            <QuestionCard key={q.id ?? i} q={q} idx={i} jd={jd} />
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="interview-page">
      <div className="interview-header">
        <h2>Interview Prep</h2>
        <p>Paste a job description to get AI-tailored questions and instant answer feedback.</p>
      </div>
      <div className="interview-setup">
        {prefillRole && (
          <div className="prefill-banner">
            ✅ Preparing for <strong>{prefillRole}</strong>
            {prefillCompany && <> at <strong>{prefillCompany}</strong></>}.{" "}
            Add the full JD below for best results.
          </div>
        )}
        <label className="field-label">Job Description</label>
        <textarea
          className="interview-textarea"
          rows={9}
          placeholder="Paste the full job description here. The more detail you provide, the more targeted and realistic the questions will be…"
          value={jd}
          onChange={e => { setJd(e.target.value); setError(null); }}
        />
        <p className="jd-hint">
          {jd.trim().length > 0
            ? `${jd.split(/\s+/).filter(Boolean).length} words · ${jd.trim().length} characters`
            : "Minimum 50 characters required"}
        </p>
        <div className="num-questions">
          <label className="field-label">Number of Questions</label>
          <div className="num-btns">
            {[5, 10, 15].map(n => (
              <button key={n} className={numQuestions === n ? "active" : ""} onClick={() => setNum(n)}>{n}</button>
            ))}
          </div>
        </div>
        {error && <p className="error-msg" style={{ marginTop: "16px" }}>{error}</p>}
        <button
          className="analyze-btn"
          style={{ marginTop: "28px", width: "100%", justifyContent: "center" }}
          onClick={generate}
          disabled={generating}
        >
          {generating ? <><span className="spinner" /> Generating Questions…</> : "🎤 Generate Interview Questions"}
        </button>
      </div>
    </div>
  );
}

// ── RESUME TAB ────────────────────────────────────────────────────────────────
function ResumeTab() {
  const [file, setFile]             = useState(null);
  const [jdText, setJdText]         = useState("");
  const [result, setResult]         = useState(null);
  const [loading, setLoading]       = useState(false);
  const [slowHint, setSlowHint]     = useState(false);
  const [error, setError]           = useState(null);
  const [jdExpanded, setJdExpanded] = useState(false);

  const handleFileChange = (e) => { setFile(e.target.files[0]); setError(null); };

  const handleUpload = async () => {
    if (!file) { setError("Please select a PDF file first."); return; }
    setLoading(true); setError(null); setSlowHint(false);
    const slowTimer = setTimeout(() => setSlowHint(true), 6000);
    const formData = new FormData();
    formData.append("file", file);
    if (jdText.trim()) formData.append("job_description", jdText.trim());
    try {
      const res  = await fetch(`${API}/analyze-resume/`, { method: "POST", body: formData });
      const data = await res.json();
      if (!res.ok) throw new Error(data.detail || "Failed to analyze resume");
      setResult(data);
      window.scrollTo({ top: 0, behavior: "smooth" });
    } catch (err) { setError(err.message); }
    finally { clearTimeout(slowTimer); setLoading(false); setSlowHint(false); }
  };

  const reset = () => { setResult(null); setFile(null); setError(null); setJdText(""); setJdExpanded(false); };

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

  if (!result) {
    return (
      <div className="hero">
        <div className="card">
          <div className="logo-tag">🎯 LandTheRole.ai</div>
          <h1>Get Hired Faster</h1>
          <p>AI-powered resume scoring, job match analysis, and instant bullet rewrites — built to get you shortlisted.</p>
          <div className="upload-row">
            <label className="file-label">
              <input type="file" accept=".pdf" onChange={handleFileChange} />
              <span className="file-btn">📄 {file ? file.name : "Choose Resume PDF"}</span>
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
                placeholder="Paste the job description here…"
                value={jdText}
                onChange={(e) => setJdText(e.target.value)}
                rows={6}
              />
              <p className="jd-hint">
                {jdText.length > 0
                  ? `${jdText.split(/\s+/).filter(Boolean).length} words pasted`
                  : "Tip: paste the full JD for best results"}
              </p>
            </div>
          )}
          <button className="analyze-btn" onClick={handleUpload} disabled={loading}>
            {loading && <span className="spinner" />}
            {loading ? "Analyzing…" : "Analyze My Resume"}
          </button>
          {slowHint && (
            <p style={{ fontSize: "13px", color: "rgba(255,255,255,0.35)", marginTop: "-12px", marginBottom: "16px" }}>
              ⏳ Server is waking up — this first request may take ~30s. Hang tight!
            </p>
          )}
          <div className="feature-pills">
            <span>◆ ATS Score</span>
            <span>◆ JD Match %</span>
          </div>
          {error && <p className="error-msg">{error}</p>}
        </div>
      </div>
    );
  }

  return (
    <div className="results-section">
      <div className="results-top reveal">
        <ScoreMeter score={result.ats_score} />
        <div className="results-summary">
          <h2>Your Resume Analysis</h2>
          <p>{result.summary_feedback}</p>
        </div>
      </div>
      {result.jd_match && (
        <>
          <h3 className="reveal">🎯 Job Description Match</h3>
          <JDMatchPanel jd={result.jd_match} />
        </>
      )}
      <h3 className="reveal">✅ Strengths</h3>
      <ul className="strengths stagger-list">
        {(result.strengths || []).map((s, i) => <li key={i}>{s}</li>)}
      </ul>
      <h3 className="reveal">⚠️ Weaknesses</h3>
      <ul className="weaknesses stagger-list">
        {(result.weaknesses || []).map((w, i) => <li key={i}>{w}</li>)}
      </ul>
      {result.weak_bullets?.length > 0 && (
        <>
          <h3 className="reveal">✏️ Rewrite Weak Bullets</h3>
          <BulletRewriter bullets={result.weak_bullets} jobContext={jdText} />
        </>
      )}
      <h3 className="reveal">🧩 Missing Skills</h3>
      <ul className="stagger-list">
        {(result.missing_skills || []).map((m, i) => <li key={i}>{m}</li>)}
      </ul>
      <h3 className="reveal">💡 Recommendations</h3>
      <ul className="stagger-list">
        {(result.recommendations || []).map((r, i) => <li key={i}>{r}</li>)}
      </ul>
      <div className="reveal" style={{ marginTop: "56px", textAlign: "center" }}>
        <button className="analyze-btn" onClick={reset}>Analyze Another Resume</button>
      </div>
    </div>
  );
}

// ── APP ───────────────────────────────────────────────────────────────────────
function App() {
  const [tab, setTab]                           = useState("resume");
  const [interviewRole, setInterviewRole]       = useState(null);
  const [interviewCompany, setInterviewCompany] = useState(null);

  const goToInterview = (role, company) => {
    setInterviewRole(role);
    setInterviewCompany(company);
    setTab("interview");
  };

  return (
    <>
      <Nav tab={tab} setTab={setTab} />
      <main className="main-content">
        {tab === "resume"    && <ResumeTab />}
        {tab === "jobs"      && <JobsTab onPrepInterview={goToInterview} />}
        {tab === "interview" && <InterviewTab prefillRole={interviewRole} prefillCompany={interviewCompany} />}
      </main>
      <Footer />
    </>
  );
}

export default App;
