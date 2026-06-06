// Wrapper that mounts F26 Agents underneath F26m2 model-assignment modal.
//
// Why a separate component: the /admin/agents/model-assignment route renders
// the agents page in the background plus the modal on top. F26 itself doesn't
// know about the modal — keeping that decoupled. The modal's onClose routes
// back to /admin/agents so the standalone F26 page is the cancel destination.

'use client';

import { useRouter } from 'next/navigation';
import { AgentsPage } from './agents-page';
import { AgentModelModal } from './agent-model-modal';

export function AgentsWithModelAssignmentModal() {
  const router = useRouter();
  return (
    <>
      <AgentsPage />
      <AgentModelModal onClose={() => router.push('/admin/agents')} />
    </>
  );
}
