---
title: QA Nexus PM4 Initiative — Career Compass (L7 Career Intelligence)
initiative_id: PM4-CC-001
parent: PM4 (v2+ — Career Intelligence + Enterprise SaaS)
phase: [PM4]
estimated_duration_quarters: 4 (W47–W60, 2027-04-06 → 2027-07-30)
owner: Product
start_date: 2027-04-06
dependencies: PM1 (A1/A2/A4), PM2 (A6/A7/A8 adv), PM3 (A3/A5/A8 full, VCG) — mature portfolio artifacts
status: Executive Review
---

# QA Nexus PM4 Initiative: Career Compass (L7 Career Intelligence)

**Version:** 1.0  
**Last Updated:** 2026-04-23  
**Audience:** Product, Engineering, Leadership  
**Canonical Source:** PROJECT_ROADMAP.md v1.1, PRD.md v2.2  

---

## 1. Initiative Front Matter

| Field | Value |
|-------|-------|
| **Initiative ID** | PM4-CC-001 |
| **Parent Phase** | PM4 (v2+) |
| **[PM4] Phase Tag** | [PM4] |
| **Owner** | Product |
| **Estimated Duration** | 4 quarters (W47–W60, 2027-04-06 → 2027-07-30) |
| **Start Date (Earliest)** | 2027-04-06 |
| **Exit Gate** | Career Compass platform live, skills graph indexed 10K+ profiles, portfolio builder live, job marketplace functional, mentor matching Q1 ready |
| **Success Tier** | Strategic (revenue-neutral engagement driver, profession-empowerment narrative) |

### Cross-Initiative Dependencies

**Depends On (Must be stable):**
- **PM1 A1/A2/A4** — Test case, defect, RCA artifacts form portfolio evidence
- **PM2 A6/A7/A8 adv** — Synthetic data + self-healing + predictive planning records showcase autonomous work
- **PM3 A3/A5/A8 full** — Low-code + test selection + full planning prove skill depth; Vibe Code Governor demonstrates governance expertise

**Feeds Into (Enables):**
- Multi-Tenant SaaS (PM4-MTS-001) — Tenant isolation required for cross-org anonymized career data
- Enterprise Compliance GxP (PM4-ECC-001) — HIPAA BAA needed to protect career/salary/health data

---

## 2. Why This Initiative

### Strategic Rationale

**Crisis Context:** Market research indicates 65%+ of QA professionals fear AI displacement and lack clear career development pathways. The profession faces a trust crisis: "Will AI take my job?" QA Nexus solves this by inverting the narrative from "QA Nexus replaces QA" to "QA Nexus empowers QA professionals."

**Market Opportunity:**
- **Talent Retention:** QA teams using Career Compass increase engagement and reduce turnover by 30-40% (working hypothesis, to be validated)
- **Premium Tier Revenue:** Career Compass Premium (salary data, mentorship matching, learning recommendations) can drive USD 500K-2M ARR at scale
- **Ecosystem Play:** Career marketplace (QA professionals, mentors, training partners) locks in ecosystem dependency

**Positioning Shift:**
- **Before:** "QA Nexus is a test management tool" → commodity play, competitive commoditization risk
- **After:** "QA Nexus is the platform for QA profession growth" → community value, defensible moat

### Customer Insight

From pilot feedback (PM1 post-GA):
- 72% of QA leads asked: "Can we track skill progression on our teams?"
- 58% of individual QAs asked: "What's my salary/seniority relative to market?"
- 45% expressed interest in mentorship and learning paths

**JTBD:** "Show me how my QA work is making me more valuable and hireable" + "Help me grow as a QA leader without leaving the profession"

---

## 3. Outcomes & Success Metrics

### Measurable Goals (North Star Metrics)

| Metric | Q1 Target | Q2 Target | Q3 Target | Q4 Target | Definition |
|--------|-----------|-----------|-----------|-----------|-----------|
| **Active Career Compass users** | 500 | 2K | 5K | 10K+ | Users who have created profile + viewed skills graph |
| **Skills graph coverage** | 10K profiles indexed | 25K | 50K | 100K+ | Profiles whose artifacts (cases, defects, RCAs, plans) indexed for skill inference |
| **Portfolio exports** | 100/month | 500/month | 2K/month | 5K+/month | PDF exports + LinkedIn shares of skill profiles |
| **Mentor matching success** | 50 matches | 250 matches | 800 matches | 2K+ matches | Mentor-mentee pairs (30-day+ active engagement) |
| **Job board engagement** | 20 job postings | 100 postings | 300+ postings | 1K+ postings | Active recruiting partner job openings; apply rate ≥5% |
| **Learning path completion** | 10% | 25% | 45% | 65%+ | Users who complete ≥1 learning path start-to-finish |
| **Salary transparency adoption** | 5% | 15% | 35% | 50%+ | Users who opt into salary data visibility (anonymized benchmarking) |

### Leading Indicators (Week-by-Week Health)

- Skill inference accuracy (% cases correctly mapped to skill tags via A1 artifact analysis)
- Portfolio view frequency (avg views per profile per month; target: 5+)
- Mentor inquiry response time (target: <24h)
- Onboarding funnel drop-off (target: <10% at "create profile" step)

### Lagging Indicators (Post-Launch)

- Premium tier adoption rate (Career Compass Premium) — target ≥20% of active users
- Job placement rate (users who apply via job board, then report success) — target ≥15%
- Team retention (orgs using Career Compass see lower turnover) — measure at 6-month mark
- Mentorship ROI (mentees self-report salary/title improvement after mentorship) — target ≥60% report positive change

---

## 4. Scope

### In-Scope

**Core Feature Set (MVP):**

1. **Skills Graph (Q1–Q2)**
   - Skill taxonomy (80+ QA skills: manual testing, automation, performance, accessibility, API testing, mobile, security, governance, data QA, requirements analysis, test planning, test design, RCA, etc.)
   - Auto-inference of skills from artifacts (A1-generated cases → "test design", A7 self-healing → "automation maintenance", A4 RCA → "root cause analysis", A8 planning → "test strategy")
   - Skill endorsement from peers (other QA pros can endorse your skills, with confidence scoring)
   - Skill level progression (Novice → Intermediate → Advanced → Expert) based on artifact volume + complexity

2. **Portfolio Builder (Q1–Q2)**
   - Automatically curate best-of work (10 most-complex test cases authored, 5 highest-impact RCAs, 3 major automation projects)
   - Public/private toggle per artifact; anonymization option (hide org/customer names)
   - PDF export (professional layout, watermark, skill badges)
   - LinkedIn integration (share profile, sync endorsements)

3. **Job Market Matching (Q2–Q3)**
   - Job board (partner JDs from recruiting agencies, tech companies, consulting firms)
   - Skill-to-JD matching: "You match 92% of QA Lead role at TechCorp" with missing skill gaps highlighted
   - Salary benchmarking (anonymized, by seniority + location + skills; locked behind HIPAA BAA for healthcare users)
   - Apply workflow (apply via QA Nexus; recruiter sees anonymized profile + portfolio)

4. **Mentorship Marketplace (Q2–Q4)**
   - Mentor profiles (experience, specialization, availability, hourly rate)
   - Matching algorithm (mentee skill gap ↔ mentor expertise)
   - Scheduling + session notes (integrated calendar, post-session summary)
   - Feedback loops (mentee rates mentor; mentor rates mentee for learnings demonstrated)
   - Engagement incentive (mentor referral bounty: $50 per successful mentee hire)

5. **Learning Paths (Q3–Q4)**
   - Curated learning journeys (e.g., "Performance Testing Master Path: 12 weeks")
   - Partner integrations (Pluralsight, Coursera, LinkedIn Learning for course links)
   - Skill milestones (complete 5 courses → "Intermediate Performance Tester" badge)
   - Guided projects (contribute to open-source QA frameworks, publish case studies)

### Out-of-Scope

- **Resume building** — Career Compass is portfolio-first, not resume-first (resumes stay outside QA Nexus)
- **Salary negotiation coaching** — Out of scope (potential future add-on)
- **Team leadership training** — Out of scope (potential future add-on with external partner)
- **Direct employment** — QA Nexus is not a staffing agency; we facilitate connections, not placements

### Deferred (Future PM4 Waves)

- **Skill certification exams** — Potential Q4 2027 or later
- **Internal mobility matching** (move between roles within same org) — Post-PM4 Q1 2028
- **Diversity analytics** (hiring partner sees diversity metrics of their matches) — Post-PM4 (compliance review needed)

---

## 5. Phasing (Q1–Q4)

### Q1 Exit Criteria
- Skill taxonomy locked (80+ skills, 5 proficiency levels)
- Skill inference engine live (≥85% accuracy)
- Portfolio builder live with PDF export
- 500+ users onboarded
- Privacy review passed

### Q2 Exit Criteria
- Job board live (100+ postings)
- Skill-to-JD matching ≥92% accurate
- Salary benchmarking dashboard live (anonymized)
- 250+ mentor-mentee matches
- Mentor referral program launched

### Q3 Exit Criteria
- 5 learning paths launched
- Partner integrations live (Pluralsight, Coursera)
- 2K+ learning enrollments, 25%+ completion
- 500+ mentor sessions/month
- Job board traffic 5K+ monthly

### Q4 Exit Criteria
- Career Compass Premium live (USD 9.99/month)
- 20%+ Premium adoption
- 100+ job placements via board
- Learning completion 45%+
- Mentor NPS ≥8.0/10
- ≥USD 100K ARR contribution

---

## 6. Task Breakdown

**Q1 Core Tasks:**
- Design skill taxonomy (80+ skills, 5 levels) — 8 pts
- Build skill inference engine (≥85% accuracy) — 13 pts
- Implement portfolio curation algorithm — 8 pts
- Build portfolio builder UI (PDF export) — 13 pts
- Career profiles CRUD + onboarding — 13 pts
- Peer skill endorsement system — 8 pts
- Privacy + data retention policy review — 5 pts
- Load production data, train inference model — 8 pts

**Q1 Total: 76 story points**

**Q2 Core Tasks:**
- Job-to-skill matching algorithm — 8 pts
- Recruit + onboard job board partners (10-15) — 8 pts
- Job board UI + job search — 13 pts
- Salary benchmarking backend — 13 pts
- Mentor matching algorithm — 8 pts
- Mentor marketplace UI — 13 pts
- Mentorship session tracking — 10 pts
- Mentor referral bounty program — 5 pts
- E2E integration testing — 8 pts

**Q2 Total: 86 story points**

**Q3 Core Tasks:**
- Design 5 learning paths — 8 pts
- Partner integrations (Pluralsight, Coursera) — 13 pts
- Learning path UI + enrollment — 13 pts
- Progress + milestone tracking — 8 pts
- Premium tier (billing, feature gating) — 13 pts
- Premium onboarding + upsell flow — 8 pts
- Mentor engagement NPS tracking — 5 pts
- Job placement tracking — 5 pts

**Q3 Total: 73 story points**

**Q4 Core Tasks:**
- Scale mentor matching (2K+ mentors) — 13 pts
- Advanced salary analytics dashboard — 10 pts
- Mentor income dashboard — 8 pts
- Job placement attribution for partners — 8 pts
- Career Compass marketing — 8 pts
- Support + CS playbook — 5 pts
- Observability (OTel, metrics, SLIs) — 8 pts
- Post-PM4 retrospective — 5 pts

**Q4 Total: 65 story points**

**Program Total: ~300 story points (sustainable for 2-FTE team)**

---

## 7. API & Contracts (Representative Endpoints)

### Profile Management
```
POST /api/v1/career/profiles
  Request: { first_name, last_name, headline, bio, visibility, allow_job_matching }
  Response: { profile_id, user_id, slug, created_at }

GET /api/v1/career/profiles/:profile_id
  Response: { profile_id, user_id, headline, bio, visibility, skills, portfolio_artifacts, premium_subscriber }
```

### Skills & Endorsements
```
GET /api/v1/career/profiles/:profile_id/skills
  Response: { skills: [ { skill_id, name, category, proficiency_level, endorsement_count, confidence_pct } ] }

POST /api/v1/career/skills/:skill_id/endorse
  Request: { endorsee_user_id, endorser_user_id, confidence_pct }
  Response: { endorsement_id, skill_id, endorsed_at }
```

### Portfolio
```
GET /api/v1/career/profiles/:profile_id/portfolio
  Response: { artifacts: [ { rank, artifact_type, artifact_id, title, visibility, anonymized } ] }

GET /api/v1/career/profiles/:profile_id/portfolio/export-pdf
  Response: { pdf_url, expires_at }
```

### Job Board
```
GET /api/v1/career/jobs?skill_match_min=0.7&location=USA
  Response: { jobs: [ { job_id, title, company, location, salary_range, required_skills, match_pct, gap_skills } ] }

POST /api/v1/career/jobs/:job_id/apply
  Request: { user_id, message }
  Response: { application_id, job_id, applied_at, status }
```

### Salary Benchmarking
```
GET /api/v1/career/salary-benchmark?role=QA+Lead&location=USA
  Response: { benchmark: { role, location, sample_size, salary_usd: { p25, median, p75 }, your_position } }
```

### Mentorship
```
GET /api/v1/career/mentors?skill_match=performance_testing
  Response: { mentors: [ { mentor_id, name, headline, specialization, availability_hours, hourly_rate_usd, match_score } ] }

POST /api/v1/career/mentorship/request
  Request: { mentee_user_id, mentor_user_id, skill_gaps, goal }
  Response: { match_id, matched_at, suggested_schedule }

POST /api/v1/career/mentorship/:match_id/schedule
  Request: { scheduled_at, duration_mins, topic }
  Response: { session_id, status, calendar_invite_sent }

POST /api/v1/career/mentorship/:session_id/feedback
  Request: { mentee_rating, mentor_rating, mentee_notes, mentor_notes }
  Response: { feedback_id, recorded_at }
```

### Learning Paths
```
GET /api/v1/career/learning-paths
  Response: { paths: [ { path_id, name, description, duration_weeks, skills_covered, enrollment_count, completion_rate_pct } ] }

POST /api/v1/career/learning-paths/:path_id/enroll
  Request: { user_id }
  Response: { enrollment_id, enrolled_at, progress_pct }

GET /api/v1/career/learning-paths/:path_id/courses
  Response: { courses: [ { course_id, partner_id, title, url, duration_mins, difficulty } ] }

POST /api/v1/career/milestones/:milestone_id/complete
  Request: { user_id, evidence }
  Response: { completion_id, completed_at, badge_earned }
```

### Premium
```
POST /api/v1/career/premium/subscribe
  Request: { user_id, tier, billing_interval, stripe_payment_method_id }
  Response: { subscription_id, tier, price_usd, started_at, features_unlocked }

GET /api/v1/career/salary-analytics (Premium only)
  Response: { analytics: { salary_trend, your_percentile, growth_yoy_pct, top_paying_companies } }
```

---

## 8. Database Changes

### New Tables (TB-052 through TB-065)

| TB-ID | Table Name | Columns | FK | Indexes | Phase | Rationale |
|-------|------------|---------|-----|---------|-------|-----------|
| TB-052 | career_profiles | profile_id, user_id, slug, visibility, premium_subscriber | user_id | (user_id), (slug) | Q1 | User career profile identity |
| TB-053 | skill_tags | skill_id, name, category, proficiency_level, endorsement_count | — | (category), (name) | Q1 | Skill taxonomy |
| TB-054 | skill_endorsements | endorsement_id, endorsee_user_id, endorser_user_id, skill_id, confidence_pct | skill_id, user_ids | (skill_id), (endorsee_user_id) | Q1 | Peer endorsements |
| TB-055 | portfolio_artifacts | artifact_id, profile_id, artifact_type, artifact_ref_id, rank, visibility | profile_id | (profile_id, rank), (artifact_type) | Q1 | Curated portfolio |
| TB-056 | job_postings | job_id, partner_id, title, jd_text, required_skills_json, location, salary_range | — | (location), (created_at) | Q2 | Job board postings |
| TB-057 | job_applications | app_id, user_id, job_id, portfolio_snapshot_json, applied_at | user_id, job_id | (job_id), (applied_at) | Q2 | Job applications |
| TB-058 | mentor_profiles | mentor_id, user_id, headline, specialization, availability_hours, hourly_rate_usd | user_id | (user_id), (specialization) | Q2 | Mentor identity |
| TB-059 | mentorship_matches | match_id, mentee_id, mentor_id, skill_gap_analysis_json, matched_at | user_ids | (mentee_id), (mentor_id) | Q2 | Mentor-mentee pairs |
| TB-060 | mentorship_sessions | session_id, match_id, scheduled_at, duration_mins, mentee_rating, mentor_rating | match_id | (match_id), (scheduled_at) | Q2 | Sessions + feedback |
| TB-061 | learning_paths | path_id, name, description, skills_covered_json, duration_weeks | — | (name) | Q3 | Learning journeys |
| TB-062 | learning_enrollments | enr_id, user_id, path_id, enrolled_at, progress_pct, completed_at | user_id, path_id | (user_id), (path_id) | Q3 | Enrollment + progress |
| TB-063 | course_milestones | ms_id, path_id, course_id, title, partner_id, url | path_id | (path_id) | Q3 | Milestones in paths |
| TB-064 | premium_subscriptions | sub_id, user_id, tier, stripe_sub_id, started_at, cancelled_at | user_id | (user_id), (tier) | Q4 | Premium billing |
| TB-065 | job_placements | placement_id, user_id, job_id, mentor_id, salary_reported_usd, accepted_at | user_ids, job_id | (user_id), (accepted_at) | Q4 | Placement tracking |

**Migration Strategy:** Append-only; no renumbering. New tables deployed at quarter start via zero-downtime migration; feature flags control visibility.

---

## 9. AI Agent Spec

**Skill Inference Agent** (auto-infers skills from artifacts):
- **Inputs:** User artifact library (cases, defects, RCAs, plans)
- **Process:** Embed artifact text → match to skill taxonomy (80 skills) → count volume → map proficiency level
- **Outputs:** Skill tags with confidence % (≥90% auto-apply, 70–89% suggest, <70% ignore)
- **Training:** 1K manually-labeled artifacts (QA leads tag 10 artifacts each; consensus ≥2/3); validate ≥85% accuracy

---

## 10. Test Strategy

**Unit Tests:** 50 test cases (skill inference, portfolio curation, job matching, mentorship matching)
**Integration Tests:** Full onboarding → job apply → mentor match → learning path enrollment
**E2E Tests (Playwright):** Onboarding flow, job application, mentorship request+session, learning path completion
**Security/Privacy:** Anonymization tested, HIPAA readiness (salary BAA), GDPR DSAR, data retention (30d delete)
**Performance:** Inference P95 <5s, job matching <1h for 10K jobs × 5K users, mentor matching <500ms
**Compliance:** GDPR, HIPAA, CCPA, EU AI Act (confidence scores visible, user can override)

---

## 11. Risks + Mitigations

| Risk | Likelihood | Impact | Mitigation |
|------|-----------|--------|-----------|
| Skill inference accuracy <85% | Medium | High | (1) Manually-labeled training data; (2) Start with 80% threshold; (3) User override UI; (4) Weekly audit of 50 profiles |
| Privacy breach (salary data leak) | Low | Critical | (1) Encryption at rest; (2) Row-level access; (3) Anonymization logic in CI/CD; (4) Pen test Q4 |
| Job board partner churn | Medium | Medium | (1) Revenue share model; (2) 99% uptime SLA; (3) Partner success manager |
| Mentor supply shortage | Medium | Medium | (1) Onboard from community; (2) Mentor referral (USD 50); (3) Volunteer mentors |
| Premium adoption <15% | Medium | Medium | (1) Free tier limits (3 salary benchmarks/month); (2) Upsell at job apply; (3) Early adopter discount (USD 4.99/mo) |
| Regulatory changes (GDPR/HIPAA) | Low | High | (1) Legal review Q1; (2) Join EU AI Act working group; (3) Prepare multi-jurisdiction policies Q3 |
| Mentor 1099 classification (IRS) | Low | Medium | (1) Tax attorney consult; (2) Templates for income tracking; (3) Issue 1099s ≥USD 600 |
| Competing platforms launch job board | Medium | High | (1) Differentiate on QA Nexus skill data; (2) Focus on mentor marketplace; (3) Lock partners with revenue share |

---

## 12. Rollback Plan

**Feature Flags:**
- `feature_career_compass_skills_q1` — Disable if inference accuracy <85%
- `feature_career_compass_portfolio_q1` — Rollback to skills-only view
- `feature_career_compass_jobs_q2` — Hide job board; show "Coming Q2"
- `feature_career_compass_mentorship_q2` — Hide matching; show profiles (read-only)
- `feature_career_compass_learning_q3` — Hide learning paths
- `feature_career_compass_premium_q4` — Refund Premium users, all features free

**Data Rollback:** Daily pg_dump → S3 (30d retention); restore from prior-day snapshot if corruption detected

**Communication:** "Coming Soon" messaging on status page + email to Premium users; target resume <48h

---

## 13. Observability

**Key Metrics:** Daily new profiles, onboarding funnel, skill inference accuracy, portfolio views, job postings, applications per job, applications-to-offer conversion, mentor profiles, matches, sessions/month, mentor NPS, learning path enrollments, completion rate, learning earnings, Premium subscribers, monthly churn, ARPU

**Dashboards (SigNoz):** Career Compass Health (profile creation, inference latency, job matching latency), Conversion Funnel, Partner Health

**OTel Instrumentation:** Skill inference (embedding latency, confidence %), job matching (score, latency), mentor matching (gap calc, availability check)

---

## 14. Handoff / Cross-Initiative Interactions

**Multi-Tenant SaaS (PM4-MTS-001):** Career Compass salary data must be tenant-isolated; mentorship crosses orgs with privacy controls; RLS must be live before Premium ships (Q4)

**Enterprise Compliance GxP (PM4-ECC-001):** Salary data requires HIPAA BAA; profiles contain PII (health, tenure); encryption per HIPAA; BAA must be complete before Premium ships

**Cloud Device Grid, Full 70-Doc Catalog, White-Label:** No direct dependencies; orthogonal or post-PM4

---

## 15. Definition of Done (Per Quarter)

**Q1 DoD:** All EP-001–EP-005 endpoints implemented + tested; TB-052–TB-055 tables created + migrated; skill inference ≥85% accurate; E2E onboarding flow passing; privacy review passed; feature flags enabled; SigNoz dashboards live

**Q2 DoD:** EP-006–EP-012 implemented; TB-056–TB-060 created; job matching ≥92%; mentor matching live; salary benchmarking backend live; E2E job apply + mentor request passing; Privacy access control audit; Staging + prod deployment

**Q3 DoD:** EP-013–EP-016 implemented; TB-061–TB-063 created; 5 learning paths launched; partner integrations live; learning path E2E passing; Baseline completion rate measured

**Q4 DoD:** EP-017–EP-018 implemented; TB-064–TB-065 created; Stripe integration live; E2E Premium subscribe + salary analytics passing; Mentor payout (sandbox); Job placement tracking live; Prod deployment + monitoring configured

---

## 16. Appendix

**Glossary:** Skills Graph (80+ skills, 5 levels), Portfolio (10-artifact curated), Skill Inference (artifact → skill tag mapping), Job Board (recruiting partner postings), Salary Benchmarking (anonymized by role/location/skill), Mentor Matching (skill gap ↔ mentor expertise pairing), Learning Paths (8–12 week curated journeys), Premium Tier (USD 9.99/month)

**References:** PROJECT_ROADMAP.md v1.1, PRD.md v2.2 (§8 PM4), MILESTONE_REGISTRY.md v3.2, ERD.md v2.2 (§7 L7), QA_Nexus_Master_Brainstorm.md (§10 L7 vision)

**Compliance Mapping:** GDPR (DSAR, delete), HIPAA (encryption, BAA, audit log), CCPA (opt-out), EU AI Act (confidence visible, user override, audit trail)
