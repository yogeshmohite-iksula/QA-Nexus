// Wrapper that mounts F14 underneath F14m1 (modal-on-page pattern).
//
// Why a separate component: /requirements/new + /requirements/[key]/edit
// each render the F14 list page in the background plus the modal on top.
// F14 itself doesn't know about the modal — keeping that decoupled. The
// modal's `onClose` routes back to /requirements so the standalone F14
// is the cancel destination.

'use client';

import { useRouter } from 'next/navigation';
import { RequirementsListPage } from './requirements-list-page';
import { RequirementFormModal } from './requirement-form-modal';

interface RequirementsWithFormModalProps {
  /** Pass `reqKey` for edit mode (matches a seed RET-### key); omit for create mode. */
  reqKey?: string;
}

export function RequirementsWithFormModal({ reqKey }: RequirementsWithFormModalProps) {
  const router = useRouter();
  return (
    <>
      <RequirementsListPage />
      <RequirementFormModal reqKey={reqKey} onClose={() => router.push('/requirements')} />
    </>
  );
}
