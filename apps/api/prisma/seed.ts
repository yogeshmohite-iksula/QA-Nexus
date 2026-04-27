// QA Nexus PM1 — database seed
// =============================================================================
// Spec: MS0-T020.5 + CLAUDE.md "Iksula data canon" (8-user pilot roster).
// Idempotent: safe to re-run. Uses upsert on the unique columns
//   (workspaces.name + users.email).
//
// What this seeds:
//   - 1 workspace named "Iksula" (TB-001)
//   - 8 users (TB-002): Akshay (Lead), Yogesh (Admin), 6 QA Engineers
//
// What this does NOT seed (deferred to later milestones):
//   - Sample projects / requirements / test cases — wait for MS0-T032
//     A1/A2/A4 golden-set seed.
//   - LLM provider configurations — wait for F28m1 (MS0-T021+).
//
// passwordHash placeholder:
//   The ERD TB-002 says "argon2id". BetterAuth integration is MS0-T021 — that
//   task will wire the magic-link flow that produces real argon2id hashes.
//   Until then we store a sentinel value and leave activatedAt = NULL so no
//   one can authenticate as these users by accident. The seed is a roster
//   bootstrap, not a credential bootstrap.
// =============================================================================

import { PrismaClient, UserRole } from '@prisma/client';

const prisma = new PrismaClient();

const PENDING_PASSWORD_HASH = 'PENDING_T021_BETTERAUTH_MAGIC_LINK';

const PILOT_ROSTER = [
  {
    email: 'akshay.panchal@iksula.com',
    displayName: 'Akshay Panchal',
    role: UserRole.Lead,
    organizationalLabel: 'QA Lead',
  },
  {
    email: 'yogesh.mohite@iksula.com',
    displayName: 'Yogesh Mohite',
    role: UserRole.Admin,
    organizationalLabel: 'Sr QA',
  },
  {
    email: 'kishor.kadam@iksula.com',
    displayName: 'Kishor Kadam',
    role: UserRole.QAEngineer,
    organizationalLabel: 'QA Engineer',
  },
  {
    email: 'nitin.gomle@iksula.com',
    displayName: 'Nitin Gomle',
    role: UserRole.QAEngineer,
    organizationalLabel: 'QA Engineer',
  },
  {
    email: 'nadim.siddiqui@iksula.com',
    displayName: 'Nadim Siddiqui',
    role: UserRole.QAEngineer,
    organizationalLabel: 'QA Engineer',
  },
  {
    email: 'govind.daware@iksula.com',
    displayName: 'Govind Daware',
    role: UserRole.QAEngineer,
    organizationalLabel: 'QA Engineer',
  },
  {
    email: 'mohanraj.k@iksula.com',
    displayName: 'Mohanraj K.',
    role: UserRole.QAEngineer,
    organizationalLabel: 'QA Engineer',
  },
  {
    email: 'sagar.todankar@iksula.com',
    displayName: 'Sagar Todankar',
    role: UserRole.QAEngineer,
    organizationalLabel: 'QA Engineer',
  },
] as const;

async function main() {
  console.log('Seeding QA Nexus PM1 pilot data…');

  // ─── Step 1: workspace "Iksula" (TB-001). created_by NULL initially to
  // break the workspaces ↔ users circular FK; backfilled in step 3.
  // Upsert by name (no @@unique on name in the schema, so we pre-check).
  const existing = await prisma.workspace.findFirst({
    where: { name: 'Iksula' },
  });
  const workspace = existing
    ? await prisma.workspace.update({
        where: { id: existing.id },
        data: { name: 'Iksula' }, // no-op, kept for symmetry
      })
    : await prisma.workspace.create({
        data: { name: 'Iksula', createdBy: null, settings: {} },
      });
  console.log(`  workspace: ${workspace.name} (id=${workspace.id})`);

  // ─── Step 2: 8 users (TB-002). Upsert by unique email.
  const userIds: Record<string, string> = {};
  for (const u of PILOT_ROSTER) {
    const created = await prisma.user.upsert({
      where: { email: u.email },
      update: {
        displayName: u.displayName,
        role: u.role,
        organizationalLabel: u.organizationalLabel,
        workspaceId: workspace.id,
      },
      create: {
        workspaceId: workspace.id,
        email: u.email,
        displayName: u.displayName,
        role: u.role,
        organizationalLabel: u.organizationalLabel,
        passwordHash: PENDING_PASSWORD_HASH,
        // activatedAt left NULL → cannot authenticate until T021 wires
        // BetterAuth magic-link activation.
      },
    });
    userIds[u.email] = created.id;
    console.log(
      `  user: ${u.displayName} <${u.email}> ${u.role} (id=${created.id})`,
    );
  }

  // ─── Step 3: backfill workspace.createdBy = Yogesh's id (the deployer-admin
  // per CLAUDE.md / kickoff Day-0 bootstrap).
  const yogeshId = userIds['yogesh.mohite@iksula.com'];
  if (workspace.createdBy !== yogeshId) {
    await prisma.workspace.update({
      where: { id: workspace.id },
      data: { createdBy: yogeshId },
    });
    console.log(`  workspace.createdBy backfilled = Yogesh (${yogeshId})`);
  }

  console.log(`\nSeed complete: 1 workspace, ${PILOT_ROSTER.length} users.`);
}

main()
  .catch((e) => {
    console.error('Seed FAILED:', e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
