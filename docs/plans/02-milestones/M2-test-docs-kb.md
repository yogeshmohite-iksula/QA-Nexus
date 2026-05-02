# M2 — Test Documents & Knowledge Base

> **Last updated:** 2026-05-02 (Day 6 — pre-kickoff snapshot)
> **Authority:** Summary view. Binding spec:
> `../../../QA Nexus/PM1/PM1_milestone/M2/Milestone_M2_Docs_KB.md` (v1.0 with v8.1 banner).

---

## Goal

Document Catalog with 12 binding doc templates (Test Plan, Test Strategy, Test
Case template, Defect template, RCA template, Sprint Report, Release Report,
etc. — full list in PM1_ERD v2.1 §2). Knowledge Base ingestion: file upload via
F12 → embedding → pgvector HNSW index → F15 query with AI Answer Preview Card.
TipTap rich-text editor in F15.

**Window:** 2026-05-25 → 2026-06-14 (3 weeks)
**Status:** NOT STARTED

---

## Frames in scope

| Frame | File                                             | Owner | Status                                               |
| ----- | ------------------------------------------------ | ----- | ---------------------------------------------------- |
| F12   | F12 Upload Modal                                 | FE    | ✅ ported in M0 (PR #19) — refine for KB ingest path |
| F13   | F13 Imported Files List                          | FE    | ✅ ported in M0 (PR #19) — refine for KB filter      |
| F14   | F14 Requirements                                 | FE    | NOT STARTED                                          |
| F14m1 | F14m1 Edit Requirement Modal                     | FE    | NOT STARTED                                          |
| F15   | F15 Knowledge Base (with AI Answer Preview Card) | FE    | NOT STARTED                                          |

---

## Tasks (high-level)

### BE

| Task     | Description                                                                                         |
| -------- | --------------------------------------------------------------------------------------------------- |
| MS2-T001 | TB-017 `kb_document` + TB-018 `kb_document_chunk` tables (PM1_ERD v2.1 §5)                          |
| MS2-T002 | KB ingestion service: parse uploaded file → chunk → embed (bge-small) → write rows                  |
| MS2-T003 | HNSW index on `kb_document_chunk.embedding` with `m=16, ef_construction=64` (per pgvector defaults) |
| MS2-T004 | KB query endpoint: embed query → cosine search → return top-K chunks with provenance                |
| MS2-T005 | 12 doc-template seeders (verbatim from PM1_ERD §2)                                                  |
| MS2-T006 | TB-006 `requirement` table + F14 endpoints (CRUD + Jira link FK)                                    |
| MS2-T007 | Audit-log integration (every doc upload + edit + delete writes a chained row)                       |
| MS2-T008 | Backup pipeline weekly `pg_dump` to R2 (unblocks GA-12)                                             |

### FE

| Task     | Description                                                                           |
| -------- | ------------------------------------------------------------------------------------- |
| MS2-FE01 | F14 Requirements list (Pattern A + RWD)                                               |
| MS2-FE02 | F14m1 Edit Requirement Modal                                                          |
| MS2-FE03 | F15 Knowledge Base shell + TipTap editor for rich-text doc creation                   |
| MS2-FE04 | F15 AI Answer Preview Card (query → backend → render top-K with provenance footnotes) |
| MS2-FE05 | F12 + F13 refinement for KB-mode (vs imports-mode) routing                            |

---

## Acceptance criteria

| AC        | Description                                                                                                     |
| --------- | --------------------------------------------------------------------------------------------------------------- |
| MS2-AC001 | All 12 doc templates seeded and visible in F15                                                                  |
| MS2-AC002 | Upload `return_policy_v2.xlsx` → KB query "what is the new return window?" → top-K hit returned with provenance |
| MS2-AC003 | F14 lists Iksula `RET-###` requirements after Jira sync                                                         |
| MS2-AC004 | F15 TipTap editor saves rich-text docs cleanly                                                                  |
| MS2-AC005 | HNSW index used (verified via `EXPLAIN ANALYZE`)                                                                |
| MS2-AC006 | Weekly `pg_dump` cron writes to R2 (unblocks GA-12)                                                             |
| MS2-AC007 | Embedding latency p50 <100ms, p95 <200ms (CPU-only on Render Free)                                              |
| MS2-AC008 | KB query latency p50 <300ms, p95 <800ms                                                                         |

---

## Dependencies

**Needs from M1:**

- 4-role RBAC enforced
- Iksula 8-user roster seeded
- audit_log middleware live
- F26 + F28 + F27 ported (so KB doc owners can be assigned roles)

**Hands forward to M3:**

- KB document table populated (A1 reads context from KB at generation time)
- Embedding service warm in dyno (A2 dedup uses same embeddings)
- F14 Requirements wired (A1 reads requirements as input)
- 12 doc templates available for A1's "Generate test cases from this Test Plan" flow

---

## Risks

| #   | Risk                                                               | Mitigation                                                                                          |
| --- | ------------------------------------------------------------------ | --------------------------------------------------------------------------------------------------- |
| R1  | Render Free 512 MB OOM during large-file ingestion (>10 MB upload) | Stream chunks instead of buffering whole file; presigned-URL upload bypasses dyno                   |
| R2  | Neon free 0.5 GB exhaustion if KB grows >50K chunks                | Followup `(m)` quota alert system (M1 deliverable) provides early warning                           |
| R3  | TipTap bundle size adds to FE cold-start                           | Lazy-load TipTap only on F15 route; verify Lighthouse score before commit                           |
| R4  | HNSW build latency on first index creation (~minutes for 50K rows) | Build index during low-traffic window; schema migration runs index creation                         |
| R5  | bge-small recall vs bge-large gap on long technical docs           | Acceptable for PM1 pilot (MTEB 62.17 vs 64.23 = 2pt gap). Revisit at M3 close — see drift D6 below. |

---

## Notes / decisions log (will fill during M2)

_Empty until M2 Day 1 (2026-05-25)._

---

## Drift items

| #     | Item                                                                                                                                                                             | Action                                                                                                                                                                                                                                           |
| ----- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| M2-D1 | M2 binding file cites `Qwen3-Embedding-0.6B (1024-dim)` as if implemented. Live state: bge-small (384-dim).                                                                      | Banner at top of binding file overrides; no edit needed. **Plan recommendation:** revisit at M3 close.                                                                                                                                           |
| M2-D2 | **NEW (May 2026 web research):** `onnx-community/Qwen3-Embedding-0.6B-ONNX` is now available + Transformers.js 3.6.0 supports Qwen3. Migration path opens earlier than expected. | **Plan recommendation:** at M3 close, A/B-test bge-small vs Qwen3-Embedding-0.6B-ONNX. If Qwen3 fits Render Free 512 MB budget (TBD — needs measurement), migrate via env var `EMBEDDING_MODEL_ID` swap. Followup `(l)` covers the eval harness. |
| M2-D3 | M2 binding file references "bge-large via separate FastAPI service" in places. Live state: in-process via `@xenova/transformers`.                                                | Banner overrides; no edit needed.                                                                                                                                                                                                                |

---

## Cross-references

- Binding milestone file: `../../../QA Nexus/PM1/PM1_milestone/M2/Milestone_M2_Docs_KB.md`
- KB schema canon: `../../../QA Nexus/PM1/PM1_ERD/PM1_ERD.md` §5 (TB-017 + TB-018) + §8.5
- Doc-template canon: `../../../QA Nexus/PM1/PM1_ERD/PM1_ERD.md` §2
- Locked frames: `F14`, `F14m1`, `F15` in `../../../QA Nexus/PM1/PM1_UI_v2/`
- ADR-003 + amendment: `../../architecture/adr-003-embedding-model.md`
- ADR-005 R2 storage: `../../architecture/adr-005-r2-storage.md`
- Followup `(l)` (embedding eval): `../../followups.md` (l)
- Followup `(m)` (quota alert): `../../followups.md` (m)
