// Wrapper that mounts F27 underneath F27m1.
//
// Why a separate component: the /admin/users/invite route renders the
// users page in the background plus the modal on top. F27 itself doesn't
// know about the modal — keeping that decoupled. The modal's `onClose`
// routes back to /admin/users so the standalone F27 page is the cancel
// destination.

'use client';

import { useRouter } from 'next/navigation';
import { UsersRolesPage } from './users-roles-page';
import { InviteUserModal } from './invite-user-modal';

export function UsersRolesWithModal() {
  const router = useRouter();
  return (
    <>
      <UsersRolesPage />
      <InviteUserModal onClose={() => router.push('/admin/users')} />
    </>
  );
}
