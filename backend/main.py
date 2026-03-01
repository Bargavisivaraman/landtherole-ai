from fastapi import FastAPI, UploadFile, File, HTTPException, Form
from pydantic import BaseModel
from typing import List, Optional
from PyPDF2 import PdfReader
from openai import OpenAI
from dotenv import load_dotenv
import io
import json
import os
from fastapi.middleware.cors import CORSMiddleware
import re

load_dotenv()

app = FastAPI()

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173", "http://127.0.0.1:5173", "https://landtherole-ai.vercel.app"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

client = OpenAI(api_key=os.getenv("OPENAI_API_KEY"))


class ResumeAnalysis(BaseModel):
    summary_feedback: str
    strengths: List[str]
    weaknesses: List[str]
    missing_skills: List[str]
    ats_score: int
    ats_breakdown: dict
    recommendations: List[str]
    weak_bullets: List[str]
    jd_match: Optional[dict] = None


class RewriteRequest(BaseModel):
    bullet: str
    job_context: Optional[str] = ""


class RewriteResponse(BaseModel):
    rewritten: str
    explanation: str


def extract_text_from_pdf(contents: bytes) -> str:
    pdf = PdfReader(io.BytesIO(contents))
    text = ""
    for page in pdf.pages:
        extracted = page.extract_text()
        if extracted:
            text += extracted + "\n"
    return text


def is_valid_resume(text: str) -> bool:
    text_lower = text.lower()
    resume_signals = [
        "experience", "work experience", "education", "skills", "projects",
        "summary", "objective", "employment", "career", "qualifications"
    ]
    signal_hits = sum(1 for s in resume_signals if s in text_lower)
    has_email = bool(re.search(r"[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}", text))
    has_dates = bool(re.search(r"(19|20)\d{2}", text))
    word_count = len(text.split())
    return word_count >= 200 and signal_hits >= 2 and has_email and has_dates


SECTION_WEIGHTS = {
    "experience":     {"aliases": ["experience", "work experience", "employment history", "professional experience"], "weight": 20},
    "education":      {"aliases": ["education", "academic background", "qualifications"], "weight": 12},
    "skills":         {"aliases": ["skills", "technical skills", "core competencies", "expertise"], "weight": 12},
    "summary":        {"aliases": ["summary", "profile", "objective", "about me", "professional summary"], "weight": 8},
    "projects":       {"aliases": ["projects", "personal projects", "key projects"], "weight": 6},
    "certifications": {"aliases": ["certifications", "certificates", "licenses"], "weight": 5},
    "achievements":   {"aliases": ["achievements", "awards", "honors", "accomplishments"], "weight": 4},
    "contact":        {"aliases": ["phone", "email", "linkedin", "github", "portfolio"], "weight": 3},
}

KEYWORD_GROUPS = {
    "languages":    ["python", "java", "javascript", "typescript", "c++", "c#", "ruby", "go", "rust", "kotlin", "swift", "php", "scala", "r", "matlab", "bash", "shell"],
    "web_frontend": ["react", "angular", "vue", "nextjs", "svelte", "html", "css", "tailwind", "webpack", "redux", "graphql", "rest api", "restful"],
    "web_backend":  ["node.js", "django", "flask", "fastapi", "spring", "express", "rails", "laravel", "microservices", "api", "backend"],
    "databases":    ["sql", "mysql", "postgresql", "mongodb", "redis", "elasticsearch", "dynamodb", "sqlite", "oracle", "nosql", "database"],
    "cloud_devops": ["aws", "azure", "gcp", "google cloud", "docker", "kubernetes", "terraform", "ci/cd", "jenkins", "github actions", "linux", "ansible", "devops"],
    "data_ml":      ["machine learning", "deep learning", "nlp", "data science", "tensorflow", "pytorch", "scikit-learn", "pandas", "numpy", "data analysis", "statistics", "tableau", "power bi", "spark", "etl"],
    "soft_tools":   ["agile", "scrum", "jira", "git", "github", "gitlab", "figma", "confluence", "leadership", "communication", "collaboration"],
    "security":     ["cybersecurity", "unit testing", "jest", "pytest", "selenium", "qa", "test automation", "oauth", "ssl"],
}

STRONG_ACTION_VERBS = [
    "developed", "designed", "built", "led", "architected", "engineered", "launched",
    "delivered", "implemented", "created", "spearheaded", "managed", "optimized",
    "reduced", "increased", "improved", "automated", "scaled", "deployed", "drove",
    "established", "oversaw", "coordinated", "mentored", "trained", "analyzed",
    "streamlined", "migrated", "integrated", "transformed"
]

WEAK_ACTION_PHRASES = [
    "worked on", "helped with", "responsible for", "assisted with",
    "was involved in", "participated in", "contributed to", "handled",
    "dealt with", "tried to"
]


def score_sections(text_lower):
    breakdown = {}
    total = 0
    for section, cfg in SECTION_WEIGHTS.items():
        found = any(alias in text_lower for alias in cfg["aliases"])
        pts = cfg["weight"] if found else 0
        total += pts
        breakdown[section] = {"found": found, "points": pts, "max": cfg["weight"]}
    return total, breakdown


def score_quantification(text):
    lines = re.split(r'\n', text)
    bullet_lines = [l.strip().lstrip("-•▪▸►◦●✓✔* ").strip() for l in lines if len(l.strip()) > 20]
    if not bullet_lines:
        return 0, {"metric_density": 0, "points": 0, "max": 30}
    metric_pattern = re.compile(
        r'(\d+[\.,]?\d*\s*(%|percent|x|times|k|m|bn|million|billion|thousand)?|\$[\d,]+|increased|decreased|reduced|improved|grew|saved|generated)\b',
        re.IGNORECASE
    )
    lines_with_metrics = sum(1 for line in bullet_lines if metric_pattern.search(line))
    density = lines_with_metrics / len(bullet_lines)
    if density >= 0.60:   pts = 30
    elif density >= 0.45: pts = 24
    elif density >= 0.30: pts = 18
    elif density >= 0.15: pts = 10
    elif density >= 0.05: pts = 5
    else:                 pts = 0
    return pts, {
        "bullet_lines_found": len(bullet_lines),
        "lines_with_metrics": lines_with_metrics,
        "metric_density_pct": round(density * 100, 1),
        "points": pts,
        "max": 30
    }


def score_action_verbs(text):
    lines = [l.strip().lstrip("-•▪▸►◦●✓✔* ").strip() for l in text.split("\n") if len(l.strip()) > 20]
    strong_hits = sum(1 for line in lines if any(line.lower().startswith(verb) for verb in STRONG_ACTION_VERBS))
    weak_hits = sum(1 for line in lines if any(line.lower().startswith(phrase) for phrase in WEAK_ACTION_PHRASES))
    strong_ratio = strong_hits / max(len(lines), 1)
    if strong_ratio >= 0.60:   pts = 20
    elif strong_ratio >= 0.40: pts = 15
    elif strong_ratio >= 0.20: pts = 10
    elif strong_ratio >= 0.05: pts = 5
    else:                      pts = 2
    penalty = min(weak_hits * 3, 10)
    pts = max(0, pts - penalty)
    return pts, {
        "strong_verb_lines": strong_hits,
        "weak_phrase_lines": weak_hits,
        "strong_ratio_pct": round(strong_ratio * 100, 1),
        "penalty_applied": penalty,
        "points": pts,
        "max": 20
    }


def score_keyword_relevance(text_lower):
    domain_hits = {domain: [kw for kw in keywords if kw in text_lower] for domain, keywords in KEYWORD_GROUPS.items()}
    domains_covered = sum(1 for hits in domain_hits.values() if hits)
    total_keywords = sum(len(hits) for hits in domain_hits.values())
    breadth_pts = min(domains_covered * 2, 15)
    if total_keywords >= 20:   depth_pts = 15
    elif total_keywords >= 12: depth_pts = 11
    elif total_keywords >= 7:  depth_pts = 7
    elif total_keywords >= 3:  depth_pts = 4
    else:                      depth_pts = 1
    pts = breadth_pts + depth_pts
    return pts, {
        "domains_covered": domains_covered,
        "total_keywords_found": total_keywords,
        "per_domain": {d: len(h) for d, h in domain_hits.items()},
        "breadth_points": breadth_pts,
        "depth_points": depth_pts,
        "points": pts,
        "max": 30
    }


def score_length_and_format(text):
    word_count = len(text.split())
    if 350 <= word_count <= 800:   length_pts = 10
    elif 250 <= word_count < 350:  length_pts = 7
    elif 800 < word_count <= 1100: length_pts = 8
    elif word_count > 1100:        length_pts = 4
    else:                          length_pts = 3
    bullet_count = len(re.findall(r'^\s*[-•▪▸►◦●✓✔*]', text, re.MULTILINE))
    format_pts = min(bullet_count // 3, 5)
    pts = length_pts + format_pts
    return pts, {
        "word_count": word_count,
        "bullet_count": bullet_count,
        "length_points": length_pts,
        "format_points": format_pts,
        "points": pts,
        "max": 15
    }


def score_contact_info(text):
    checks = {
        "email":    bool(re.search(r"[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}", text)),
        "phone":    bool(re.search(r"\+?\d[\d\s\-().]{7,}\d", text)),
        "linkedin": bool(re.search(r"linkedin", text, re.IGNORECASE)),
        "github":   bool(re.search(r"github", text, re.IGNORECASE)),
        "location": bool(re.search(r"\b[A-Z][a-z]+,\s*[A-Z]{2}\b|\bremote\b", text)),
    }
    pts = sum([3, 2, 2, 2, 1][i] for i, v in enumerate(checks.values()) if v)
    return min(pts, 10), {"checks": checks, "points": min(pts, 10), "max": 10}


def calculate_ats_score(text):
    text_lower = text.lower()
    section_raw, section_detail = score_sections(text_lower)
    quant_pts, quant_detail     = score_quantification(text)
    verb_pts, verb_detail       = score_action_verbs(text)
    kw_pts, kw_detail           = score_keyword_relevance(text_lower)
    len_pts, len_detail         = score_length_and_format(text)
    contact_pts, contact_detail = score_contact_info(text)
    max_section_raw = sum(cfg["weight"] for cfg in SECTION_WEIGHTS.values())
    section_pts = round((section_raw / max_section_raw) * 30)
    raw_total = section_pts + quant_pts + verb_pts + kw_pts + len_pts + contact_pts
    max_possible = 135
    scaled = round((raw_total / max_possible) * 100)
    final_score = min(max(scaled, 1), 97)
    breakdown = {
        "sections":       {**section_detail, "normalised_points": section_pts, "max": 30},
        "quantification": quant_detail,
        "action_verbs":   verb_detail,
        "keywords":       kw_detail,
        "length_format":  len_detail,
        "contact_info":   contact_detail,
        "raw_total":      raw_total,
        "max_possible":   max_possible,
        "final_score":    final_score,
    }
    return final_score, breakdown


def extract_weak_bullets(text):
    lines = [l.strip().lstrip("-•▪▸►◦●✓✔* ").strip() for l in text.split("\n") if len(l.strip()) > 20]
    weak = []
    for line in lines:
        ll = line.lower()
        if any(ll.startswith(phrase) for phrase in WEAK_ACTION_PHRASES):
            weak.append(line)
    return weak[:6]


def analyze_jd_match(resume_text: str, jd_text: str) -> dict:
    resume_lower = resume_text.lower()
    jd_lower = jd_text.lower()
    jd_words = re.findall(r'\b[a-z][a-z+#.]{2,}\b', jd_lower)
    stopwords = {
        "the", "and", "for", "are", "you", "with", "that", "this", "will", "have",
        "from", "they", "been", "their", "your", "our", "all", "can", "not", "but",
        "about", "work", "role", "team", "join", "must", "able", "well", "also",
        "each", "into", "more", "some", "such", "than", "then", "there", "these",
        "those", "what", "when", "which", "who", "why", "how",
        # location & logistics
        "level", "location", "united", "states", "remote", "hybrid", "onsite",
        "office", "fulltime", "parttime", "contract", "permanent", "relocation",
        # generic job posting words
        "responsibilities", "maintain", "modern", "consume", "functional",
        "including", "position", "looking", "salary", "benefits", "equal",
        "opportunity", "employer", "apply", "candidate", "candidates", "qualified",
        "minimum", "preferred", "required", "plus", "bonus",
        # vague adjectives
        "strong", "excellent", "ability", "skills", "knowledge", "understanding",
        "familiar", "familiarity", "proficiency", "proficient", "comfortable",
        "passionate", "motivated", "driven", "detail", "oriented", "fast", "paced",
        # company generic words
        "company", "organization", "business", "product", "products", "service",
        "services", "customer", "client", "clients", "users", "startup", "environment",
        # prepositions & conjunctions
        "across", "within", "without", "between", "through", "during",
        "before", "after", "above", "below", "other", "using", "based",
        # numbers & time
        "years", "experience", "year", "month", "week", "time", "day",
        # cities & locations
        "francisco", "angeles", "york", "chicago", "austin", "seattle",
        "boston", "denver", "atlanta", "dallas", "london", "toronto",
        # more generic filler
        "ideal", "enjoy", "working", "write", "clean", "thousands", "seeking",
        "contribute", "full", "used", "daily", "collaborating", "development",
        "interfaces", "frontend", "backend", "responsive", "environments",
        "stack", "engineering", "applications", "deployment", "scalable",
        "looking", "great", "good", "best", "high", "low", "new", "old",
        "large", "small", "many", "few", "every", "never", "always", "often",
        "help", "make", "take", "need", "want", "love", "like", "know",
        "think", "feel", "come", "give", "find", "keep", "let", "put",
        "seem", "turn", "show", "hear", "play", "run", "move", "live",
        "believe", "hold", "bring", "happen", "write", "provide", "include",
        "continue", "set", "learn", "change", "lead", "understand", "watch",
        "follow", "stop", "create", "speak", "read", "spend", "grow", "open",
        "walk", "win", "offer", "remember", "love", "consider", "appear",
        "ensure", "drive", "support", "manage", "review", "maintain",
    }
    jd_keywords = list(dict.fromkeys([w for w in jd_words if w not in stopwords and len(w) > 3]))[:80]
    matched = [kw for kw in jd_keywords if kw in resume_lower]
    missing = [kw for kw in jd_keywords if kw not in resume_lower]
    match_pct = round((len(matched) / max(len(jd_keywords), 1)) * 100)
    top_missing = missing[:12]
    if match_pct >= 75:
        verdict = "Strong Match"
        verdict_color = "green"
    elif match_pct >= 50:
        verdict = "Moderate Match"
        verdict_color = "yellow"
    else:
        verdict = "Weak Match"
        verdict_color = "red"
    return {
        "match_pct": match_pct,
        "matched_keywords": matched[:15],
        "missing_keywords": top_missing,
        "total_jd_keywords": len(jd_keywords),
        "verdict": verdict,
        "verdict_color": verdict_color,
        "suggestions": [f"Add '{kw}' to your skills or experience section" for kw in top_missing[:5]]
    }


@app.post("/analyze-resume/", response_model=ResumeAnalysis)
async def analyze_resume(
    file: UploadFile = File(...),
    job_description: Optional[str] = Form(default="")
):
    if file.content_type != "application/pdf":
        raise HTTPException(status_code=400, detail="Only PDF files are allowed")

    contents = await file.read()
    if len(contents) > 5 * 1024 * 1024:
        raise HTTPException(status_code=400, detail="File size exceeds 5MB limit")

    try:
        text = extract_text_from_pdf(contents)
        if not text.strip():
            raise HTTPException(status_code=400, detail="Could not extract text from PDF")
    except Exception:
        raise HTTPException(status_code=500, detail="Failed to process PDF file")

    text = text[:8000]

    if not is_valid_resume(text):
        return {
            "summary_feedback": "The uploaded document does not appear to be a valid professional resume.",
            "strengths": [],
            "weaknesses": ["Missing essential resume sections or professional formatting."],
            "missing_skills": [],
            "ats_score": 0,
            "ats_breakdown": {},
            "recommendations": ["Upload a structured resume including Experience, Education, Skills, and contact information."],
            "weak_bullets": [],
            "jd_match": None
        }

    ats_score, ats_breakdown = calculate_ats_score(text)
    weak_bullets = extract_weak_bullets(text)
    jd_match = analyze_jd_match(text, job_description) if job_description and job_description.strip() else None

    quant_info = ats_breakdown["quantification"]
    verb_info  = ats_breakdown["action_verbs"]
    kw_info    = ats_breakdown["keywords"]

    scoring_context = f"""
ATS Score: {ats_score}/100
Quantification: {quant_info['metric_density_pct']}% of bullet lines contain numbers/metrics ({quant_info['points']}/{quant_info['max']} pts)
Action Verbs: {verb_info['strong_verb_lines']} strong, {verb_info['weak_phrase_lines']} weak phrase lines ({verb_info['points']}/{verb_info['max']} pts)
Keywords: {kw_info['total_keywords_found']} total across {kw_info['domains_covered']} domains ({kw_info['points']}/{kw_info['max']} pts)
"""
    jd_context = (
        f"\nJob Description Match: {jd_match['match_pct']}% — missing: {', '.join(jd_match['missing_keywords'][:8])}"
        if jd_match else ""
    )

    try:
        response = client.chat.completions.create(
            model="gpt-4o-mini",
            response_format={"type": "json_object"},
            messages=[
                {
                    "role": "system",
                    "content": "You are a professional resume coach and ATS specialist. Return ONLY valid JSON. Be specific and actionable."
                },
                {
                    "role": "user",
                    "content": f"""
Evaluate this resume. Use the scoring data for targeted feedback.

{scoring_context}{jd_context}

Resume:
{text}

Return this exact JSON:
{{
  "summary_feedback": "2-3 sentence overall assessment mentioning ATS score and key issues",
  "strengths": ["3-5 specific strengths with evidence"],
  "weaknesses": ["3-5 specific weaknesses tied to scoring data"],
  "missing_skills": ["skills/keywords missing that are common in this field"],
  "recommendations": ["5 specific actionable improvements ordered by impact"]
}}
"""
                }
            ],
            max_tokens=1200,
            temperature=0.3,
        )

        structured_output = json.loads(response.choices[0].message.content.strip())
        structured_output["ats_score"]     = ats_score
        structured_output["ats_breakdown"] = ats_breakdown
        structured_output["weak_bullets"]  = weak_bullets
        structured_output["jd_match"]      = jd_match

    except json.JSONDecodeError:
        raise HTTPException(status_code=500, detail="Model returned invalid JSON")
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error communicating with OpenAI: {str(e)}")

    return structured_output


@app.post("/rewrite-bullet/", response_model=RewriteResponse)
async def rewrite_bullet(req: RewriteRequest):
    if not req.bullet or len(req.bullet.strip()) < 5:
        raise HTTPException(status_code=400, detail="Bullet text too short")

    job_hint = f"\nJob context: {req.job_context}" if req.job_context else ""

    try:
        response = client.chat.completions.create(
            model="gpt-4o-mini",
            response_format={"type": "json_object"},
            messages=[
                {
                    "role": "system",
                    "content": "You are an expert resume writer. Rewrite weak bullet points to be powerful, metric-driven, and ATS-optimized. Return only JSON."
                },
                {
                    "role": "user",
                    "content": f"""
Rewrite this weak resume bullet point to be much stronger.{job_hint}

Original: "{req.bullet}"

Rules:
- Start with a strong action verb (Led, Built, Engineered, Optimized, Delivered, etc.)
- Add a specific metric or quantifiable result (even a suggested placeholder like [X%] is fine)
- Include 1-2 relevant ATS keywords naturally
- Keep it under 20 words
- Sound natural, not robotic

Return JSON:
{{
  "rewritten": "the improved bullet point",
  "explanation": "one sentence explaining what was improved and why"
}}
"""
                }
            ],
            max_tokens=300,
            temperature=0.5,
        )
        return json.loads(response.choices[0].message.content.strip())
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Rewrite failed: {str(e)}")