import { useState, useEffect, useRef } from "react";
import "./App.css";

const API = "https://landtherole-ai.onrender.com";

// ─── FOOTER ────────────────────────────────────────────────────────────────
function Footer() {
  return (
    <footer className="footer">
      <p><span>LandTheRole.ai</span> · Built by Bargavi Sivaraman · © 2026</p>
    </footer>
  );
}

// ─── NAV ───────────────────────────────────────────────────────────────────
function Nav({ tab, setTab, resetApp }) {
  const tabs = [
    { id: "resume", label: "📄 Resume" },
    { id: "jobs",   label: "💼 Jobs" },
    { id: "interview", label: "🎤 Interview Prep" },
  ];
  return (
    <nav className="main-nav">
      <div className="nav-logo" onClick={() => { resetApp(); setTab("resume"); }}>🚀 LandTheRole.ai</div>
      <div className="nav-tabs">
        {tabs.map(t => (
          <button
            key={t.id}
            className={`nav-tab ${tab === t.id ? "active" : ""}`}
            onClick={() => setTab(t.id)}
          >
            {t.label}
          </button>
        ))}
      </div>
    </nav>
  );
}

// ─── SCORE METER ───────────────────────────────────────────────────────────
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

// ─── JD MATCH PANEL ────────────────────────────────────────────────────────
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

// ─── BULLET REWRITER ───────────────────────────────────────────────────────
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
  const copy = () => { navigator.clipboard.writeText(result.rewritten); setCopied(true); setTimeout(() => setCopied(false), 2000); };
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
          {rewriting ? <div className="rewrite-loading"><span className="spinner" /> Rewriting with AI…</div> : result && (
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

// ─── JOB CARD ──────────────────────────────────────────────────────────────
function JobCard({ job, onUseForInterview }) {
  const [expanded, setExpanded] = useState(false);
  const timeAgo = (dateStr) => {
    if (!dateStr) return "Recently";
    const diff = Date.now() - new Date(dateStr).getTime();
    const h = Math.floor(diff / 3600000);
    if (h < 1) return "Just now";
    if (h < 24) return `${h}h ago`;
    return `${Math.floor(h / 24)}d ago`;
  };
  return (
    <div className="job-card">
      <div className="job-card-header">
        <div className="job-info">
          <h3 className="job-title">{job.title}</h3>
          <p className="job-company">{job.company}</p>
          <div className="job-meta">
            <span className="job-location">📍 {job.location || "Remote"}</span>
            <span className="job-type">{job.employment_type || "Full-time"}</span>
            <span className="job-time">{timeAgo(job.posted_at)}</span>
          </div>
        </div>
        <div className="job-actions">
          <a href={job.url} target="_blank" rel="noopener noreferrer" className="apply-btn">Apply →</a>
          <button className="interview-btn" onClick={() => onUseForInterview(job)}>🎤 Prep Interview</button>
        </div>
      </div>
      {job.description && (
        <>
          <p className="job-desc">{expanded ? job.description : job.description.slice(0, 200) + "…"}</p>
          <button className="expand-btn" onClick={() => setExpanded(!expanded)}>
            {expanded ? "Show less ▲" : "Show more ▼"}
          </button>
        </>
      )}
    </div>
  );
}

// ─── JOBS PAGE ─────────────────────────────────────────────────────────────
function JobsPage({ onUseForInterview, setTab }) {
  const [country, setCountry] = useState("IN");
  const [jobs, setJobs] = useState([]);
  const [loading, setLoading] = useState(false);
  const [keyword, setKeyword] = useState("");
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);

  const fetchJobs = async (kw, pg, ctry) => {
    setLoading(true);
    try {
      const params = new URLSearchParams({ country: ctry, page: pg, per_page: 20 });
      if (kw) params.set("keyword", kw);
      const res = await fetch(`${API}/jobs/?${params}`);
      const data = await res.json();
      if (pg === 1) setJobs(data.jobs || []);
      else setJobs(prev => [...prev, ...(data.jobs || [])]);
      setHasMore((data.jobs || []).length === 20);
    } catch (e) {
      console.error(e);
    } finally { setLoading(false); }
  };

  useEffect(() => { setPage(1); fetchJobs(search, 1, country); }, [country, search]);

  const loadMore = () => { const next = page + 1; setPage(next); fetchJobs(search, next, country); };

  const handleSearch = (e) => { e.preventDefault(); setSearch(keyword); };

  return (
    <div className="jobs-page">
      <div className="jobs-header">
        <h2>Find Your Next Role</h2>
        <p>Real jobs updated every hour from LinkedIn, Indeed & more</p>

        <div className="jobs-controls">
          <div className="country-toggle">
            <button className={country === "IN" ? "active" : ""} onClick={() => setCountry("IN")}>🇮🇳 India</button>
            <button className={country === "US" ? "active" : ""} onClick={() => setCountry("US")}>🇺🇸 USA <span className="free-badge">Free</span></button>
          </div>

          <form className="job-search-form" onSubmit={handleSearch}>
            <input
              type="text"
              placeholder="Search jobs e.g. React developer, Data scientist…"
              value={keyword}
              onChange={e => setKeyword(e.target.value)}
            />
            <button type="submit">Search</button>
          </form>
        </div>
      </div>

      {loading && page === 1 ? (
        <div className="jobs-loading">
          <span className="spinner" /> Loading jobs…
        </div>
      ) : jobs.length === 0 ? (
        <div className="jobs-empty">
          <p>No jobs found. Try a different search or check back soon!</p>
        </div>
      ) : (
        <>
          <div className="jobs-count">{jobs.length} jobs found in {country === "IN" ? "India" : "USA"}</div>
          <div className="jobs-list">
            {jobs.map((job, i) => (
              <JobCard key={job.job_id || i} job={job} onUseForInterview={(job) => { onUseForInterview(job); setTab("interview"); }} />
            ))}
          </div>
          {hasMore && (
            <div style={{ textAlign: "center", marginTop: "32px" }}>
              <button className="analyze-btn" onClick={loadMore} disabled={loading}>
                {loading ? <><span className="spinner" /> Loading…</> : "Load More Jobs"}
              </button>
            </div>
          )}
        </>
      )}
    </div>
  );
}

// ─── INTERVIEW PREP PAGE ────────────────────────────────────────────────────
function InterviewPage({ prefillJob }) {
  const [jd, setJd] = useState(prefillJob?.description || "");
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

  useEffect(() => {
    if (prefillJob?.description) setJd(prefillJob.description);
  }, [prefillJob]);

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
    } catch (e) { alert("Failed to generate questions. Try again."); }
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
    } catch (e) { alert("Evaluation failed. Try again."); }
    finally { setEvaluating(prev => ({ ...prev, [q.id]: false })); }
  };

  const typeColors = { technical: "#0a84ff", behavioral: "#30d158", situational: "#ffd60a", culture: "#bf5af2" };
  const scoreColor = (s) => s >= 80 ? "#30d158" : s >= 60 ? "#ffd60a" : "#ff453a";

  return (
    <div className="interview-page">
      <div className="interview-header">
        <h2>🎤 Interview Prep</h2>
        <p>Get tailored questions from any job description — then practice your answers with AI feedback</p>
      </div>

      {!questions ? (
        <div className="interview-setup card">
          {prefillJob && (
            <div className="prefill-banner">
              ✅ Loaded from job: <strong>{prefillJob.title}</strong> at <strong>{prefillJob.company}</strong>
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
                      <span className="hints-label">💡 Good answer should include:</span>
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
                      <button
                        className="evaluate-btn"
                        onClick={() => evaluate(q)}
                        disabled={evaluating[q.id]}
                      >
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
                            <h5>✅ Keywords Used Well</h5>
                            <div className="keyword-chips">
                              {evaluations[q.id].keywords_used.map((k, j) => <span key={j} className="chip chip-matched">{k}</span>)}
                            </div>
                          </div>
                        )}
                        {evaluations[q.id].keywords_missing?.length > 0 && (
                          <div className="eval-keywords">
                            <h5>⚠️ Keywords to Add</h5>
                            <div className="keyword-chips">
                              {evaluations[q.id].keywords_missing.map((k, j) => <span key={j} className="chip chip-missing">{k}</span>)}
                            </div>
                          </div>
                        )}
                        <div className="eval-improved">
                          <h5>⭐ Improved Answer</h5>
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

// ─── RESUME PAGE (original) ─────────────────────────────────────────────────
function ResumePage() {
  const [file, setFile] = useState(null);
  const [jdText, setJdText] = useState("");
  const [result, setResult] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
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
        <div className="logo-tag">📄 Resume Analyzer</div>
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
      {result.jd_match && (<><h3 className="reveal">🎯 Job Description Match</h3><JDMatchPanel jd={result.jd_match} /></>)}
      <h3 className="reveal">✅ Strengths</h3>
      <ul className="strengths stagger-list">{(result.strengths || []).map((s, i) => <li key={i}>{s}</li>)}</ul>
      <h3 className="reveal">⚠️ Weaknesses</h3>
      <ul className="weaknesses stagger-list">{(result.weaknesses || []).map((w, i) => <li key={i}>{w}</li>)}</ul>
      {result.weak_bullets?.length > 0 && (<><h3 className="reveal">✏️ Rewrite Weak Bullets</h3><BulletRewriter bullets={result.weak_bullets} jobContext={jdText} /></>)}
      <h3 className="reveal">🧩 Missing Skills</h3>
      <ul className="stagger-list">{(result.missing_skills || []).map((m, i) => <li key={i}>{m}</li>)}</ul>
      <h3 className="reveal">💡 Recommendations</h3>
      <ul className="stagger-list">{(result.recommendations || []).map((r, i) => <li key={i}>{r}</li>)}</ul>
      <div className="reveal" style={{ marginTop: "56px", textAlign: "center" }}>
        <button className="analyze-btn" onClick={resetApp}>Analyze Another Resume</button>
      </div>
    </div>
  );
}

// ─── APP ROOT ───────────────────────────────────────────────────────────────
function App() {
  const [tab, setTab] = useState("resume");
  const [interviewJob, setInterviewJob] = useState(null);

  const handleUseForInterview = (job) => { setInterviewJob(job); };
  const resetApp = () => { setInterviewJob(null); };

  return (
    <>
      <Nav tab={tab} setTab={setTab} resetApp={resetApp} />
      <main className="main-content">
        {tab === "resume"    && <ResumePage />}
        {tab === "jobs"      && <JobsPage onUseForInterview={handleUseForInterview} setTab={setTab} />}
        {tab === "interview" && <InterviewPage prefillJob={interviewJob} />}
      </main>
      <Footer />
    </>
  );
}

export default App;