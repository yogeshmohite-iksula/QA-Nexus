// F12 KB Upload — Knowledge Base document upload (M2 Pattern A scaffold).
//
// Spec: PM1_UI_v2/frame  html view/F12 Upload Requirements · Test Cases.html
// Mounted at: /kb/upload
//
// Pattern A: ZERO real fetch. The presigned-upload + finalize-upload flow
// from ADR-005 + Step 7 is deferred to Pattern B (Thu 7 May, TASK 2).
// Upload progress is a stub setInterval 0→100%; the Success state fires
// the Pattern A marker and displays "processing in background" copy.
//
// 5 UI states:
//   initial   — drag-drop zone + browse button
//   selected  — file name / size / type preview + Upload CTA
//   uploading — animated progress bar (stub)
//   success   — "Document uploaded — processing in background"
//   error     — descriptive error message + Retry
//
// File whitelist: .pdf .docx .md .txt   · Size cap: 50 MB (ERD §5 TB-017)
// Pattern B flip target: POST /api/kb/upload-init → PUT R2 → POST /api/kb/finalize-upload

import type { Metadata } from 'next';
import { KbUploadPage } from '@/components/kb/kb-upload-page';

export const metadata: Metadata = {
  title: 'Upload document · QA Nexus KB',
  description: 'Add a PDF, Word doc, Markdown, or text file to the QA Nexus knowledge base.',
};

export default function KbUploadRoute() {
  return <KbUploadPage />;
}
