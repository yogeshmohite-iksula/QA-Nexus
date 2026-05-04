// F27 stub seed — view-fixture only, dropped from prod bundles via
// tree-shaking once the real `fetch('/api/admin/users')` lands.
//
// Mirrors CLAUDE.md Iksula data canon (8-user roster). Names + IDs
// resolve via SEED_IDS so the stub stays consistent with the rest
// of the FE seed layer.

import { SEED_IDS } from '@/lib/demo-seed';
import type { AdminUserListItem, AdminUserListResponse } from './users-api';

const ISO = '2026-04-29T10:00:00Z';
const RECENT = '2026-05-04T08:30:00Z';

const SEED_USERS: AdminUserListItem[] = [
  {
    id: SEED_IDS.users.akshay,
    email: 'akshay.panchal@iksula.com',
    displayName: 'Akshay Panchal',
    role: 'Lead',
    status: 'active',
    projectKeys: ['RET', 'CART', 'PAY'],
    lastActiveAt: RECENT,
    createdAt: ISO,
  },
  {
    id: SEED_IDS.users.yogesh,
    email: 'yogesh.mohite@iksula.com',
    displayName: 'Yogesh Mohite',
    role: 'Admin',
    status: 'active',
    projectKeys: ['RET', 'CART', 'PAY', 'AUTH', 'OPS'],
    lastActiveAt: RECENT,
    createdAt: ISO,
  },
  {
    id: SEED_IDS.users.kishor,
    email: 'kishor.kadam@iksula.com',
    displayName: 'Kishor Kadam',
    role: 'QAEngineer',
    status: 'active',
    projectKeys: ['RET'],
    lastActiveAt: RECENT,
    createdAt: ISO,
  },
  {
    id: SEED_IDS.users.nitin,
    email: 'nitin.gomle@iksula.com',
    displayName: 'Nitin Gomle',
    role: 'QAEngineer',
    status: 'active',
    projectKeys: ['RET', 'CART'],
    lastActiveAt: '2026-05-03T16:00:00Z',
    createdAt: ISO,
  },
  {
    id: SEED_IDS.users.nadim,
    email: 'nadim.siddiqui@iksula.com',
    displayName: 'Nadim Siddiqui',
    role: 'QAEngineer',
    status: 'active',
    projectKeys: ['RET', 'PAY'],
    lastActiveAt: RECENT,
    createdAt: ISO,
  },
  {
    id: SEED_IDS.users.govind,
    email: 'govind.daware@iksula.com',
    displayName: 'Govind Daware',
    role: 'QAEngineer',
    status: 'active',
    projectKeys: ['RET'],
    lastActiveAt: '2026-05-03T11:00:00Z',
    createdAt: ISO,
  },
  {
    id: SEED_IDS.users.mohanraj,
    email: 'mohanraj.k@iksula.com',
    displayName: 'Mohanraj K',
    role: 'QAEngineer',
    status: 'active',
    projectKeys: ['RET', 'AUTH'],
    lastActiveAt: '2026-05-02T14:00:00Z',
    createdAt: ISO,
  },
  {
    id: SEED_IDS.users.sagar,
    email: 'sagar.todankar@iksula.com',
    displayName: 'Sagar Todankar',
    role: 'QAEngineer',
    status: 'active',
    projectKeys: ['RET', 'OPS'],
    lastActiveAt: RECENT,
    createdAt: ISO,
  },
];

export const stubAdminUserList: AdminUserListResponse = {
  users: SEED_USERS,
  total: SEED_USERS.length,
};
