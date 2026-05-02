// Wrapper that mounts F14 underneath F14m2 (modal-on-page pattern).
//
// Mirrors `requirements-with-form-modal.tsx` for F14m1.

'use client';

import { useRouter } from 'next/navigation';
import { RequirementsListPage } from './requirements-list-page';
import { LinkTestCaseModal } from './link-test-case-modal';

interface RequirementsWithLinkModalProps {
  reqKey?: string;
}

export function RequirementsWithLinkModal({ reqKey }: RequirementsWithLinkModalProps) {
  const router = useRouter();
  return (
    <>
      <RequirementsListPage />
      <LinkTestCaseModal reqKey={reqKey} onClose={() => router.push('/requirements')} />
    </>
  );
}
