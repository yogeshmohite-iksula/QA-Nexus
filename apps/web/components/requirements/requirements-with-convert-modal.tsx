// Wrapper that mounts F14 underneath F14m3 (modal-on-page pattern).
// Mirrors `requirements-with-link-modal.tsx` for F14m2.

'use client';

import { useRouter } from 'next/navigation';
import { RequirementsListPage } from './requirements-list-page';
import { ConvertToJiraModal } from './convert-to-jira-modal';

interface RequirementsWithConvertModalProps {
  reqKey?: string;
}

export function RequirementsWithConvertModal({ reqKey }: RequirementsWithConvertModalProps) {
  const router = useRouter();
  return (
    <>
      <RequirementsListPage />
      <ConvertToJiraModal reqKey={reqKey} onClose={() => router.push('/requirements')} />
    </>
  );
}
