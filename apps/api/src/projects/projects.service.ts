// QA Nexus PM1 — Projects service.
//
// Spec: PM1_ERD §3 (TB-003 projects + TB-004 project_members + TB-021
// jira_connections) + MS0-T038. Workspace-scoped CRUD + Jira OAuth
// connection lifecycle. Today's scope:
//   - POST /api/projects                (create — Admin / Lead)
//   - GET  /api/projects                (list workspace projects — any authed)
//   - GET  /api/projects/:slug          (read by key — any authed)
//   - POST /api/projects/:slug/sources/jira/oauth/start    (stub)
//   - GET  /api/projects/:slug/sources/jira/oauth/callback (stub)
//
// "slug" in the route maps to project.key (UPPER_SNAKE — see
// CreateProjectInput in @qa-nexus/shared). The Iksula canon uses RET / CART
// / PAY / AUTH / OPS — humans read these from the URL, so we keep them as
// the public identifier instead of the UUID id.
//
// Multi-tenant isolation: every query filters on workspaceId — the scoping
// boundary RLS will enforce when row-level policies land in M1 hardening.

import {
  Injectable,
  Logger,
  NotFoundException,
  ConflictException,
} from '@nestjs/common';
import type { Project } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { AuditService } from '../audit/audit.service';

export interface ActorContext {
  workspaceId: string;
  actorId: string;
  actorEmail: string;
}

export interface ProjectListItem {
  id: string;
  key: string;
  name: string;
  description: string | null;
  createdAt: string;
  memberCount: number;
}

@Injectable()
export class ProjectsService {
  private readonly logger = new Logger(ProjectsService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly audit: AuditService,
  ) {}

  /**
   * Create a project + audit. Throws ConflictException(409) if the
   * (workspaceId, key) pair already exists (Prisma P2002 unique constraint).
   */
  async create(
    input: { key: string; name: string; description?: string },
    ctx: ActorContext,
  ): Promise<Project> {
    try {
      const project = await this.prisma.project.create({
        data: {
          workspaceId: ctx.workspaceId,
          key: input.key,
          name: input.name,
          description: input.description ?? null,
          createdBy: ctx.actorId,
        },
      });
      await this.audit.write({
        workspaceId: ctx.workspaceId,
        actorId: ctx.actorId,
        entityType: 'project',
        entityId: project.id,
        action: 'project_created',
        payload: {
          project_id: project.id,
          project_key: project.key,
          project_name: project.name,
          actor_email: ctx.actorEmail,
        },
      });
      return project;
    } catch (err: unknown) {
      // Prisma uniqueness violation = (workspaceId, key) collision.
      if (
        typeof err === 'object' &&
        err !== null &&
        'code' in err &&
        (err as { code: string }).code === 'P2002'
      ) {
        throw new ConflictException(
          `project key '${input.key}' already exists in this workspace`,
        );
      }
      throw err;
    }
  }

  /** List all projects in the actor's workspace, ordered by createdAt asc. */
  async list(ctx: ActorContext): Promise<ProjectListItem[]> {
    const rows = await this.prisma.project.findMany({
      where: { workspaceId: ctx.workspaceId },
      orderBy: { createdAt: 'asc' },
      include: {
        _count: { select: { members: true } },
      },
    });
    return rows.map((p) => ({
      id: p.id,
      key: p.key,
      name: p.name,
      description: p.description,
      createdAt: p.createdAt.toISOString(),
      memberCount: p._count.members,
    }));
  }

  /** Get one project by its (workspaceId, key) — 404 if absent. */
  async getBySlug(slug: string, ctx: ActorContext): Promise<Project> {
    const project = await this.prisma.project.findUnique({
      where: { workspaceId_key: { workspaceId: ctx.workspaceId, key: slug } },
    });
    if (!project) {
      throw new NotFoundException(
        `project with key '${slug}' not found in this workspace`,
      );
    }
    return project;
  }

  /**
   * Stub: produce the Jira OAuth-2 (3LO) authorization URL the Admin/Lead
   * would redirect to. Real implementation (deferred until Atlassian app
   * provisioning lands) will:
   *   1. Generate a `state` param (CSRF token, persisted as a TB-021
   *      jira_connection_state row tied to the workspace + project).
   *   2. Compose Atlassian's /authorize URL with our client_id + scopes
   *      + redirect_uri + state.
   *   3. Return the URL — caller redirects the browser to it.
   *
   * Today: return a clearly-marked stub URL and audit the call so Yogesh
   * sees the trail when the real provisioning lands.
   */
  async jiraOAuthStart(
    slug: string,
    ctx: ActorContext,
  ): Promise<{ stub: true; authorizeUrl: string; note: string }> {
    const project = await this.getBySlug(slug, ctx); // 404 if no project
    await this.audit.write({
      workspaceId: ctx.workspaceId,
      actorId: ctx.actorId,
      entityType: 'jira_connection',
      entityId: project.id,
      action: 'jira_oauth_start_stub',
      payload: {
        project_id: project.id,
        project_key: project.key,
        actor_email: ctx.actorEmail,
        note: 'STUB — real Atlassian OAuth provisioning deferred',
      },
    });
    return {
      stub: true,
      authorizeUrl:
        `https://auth.atlassian.com/authorize?STUB=1&project=${project.key}` +
        `&workspace=${ctx.workspaceId}&note=replace_when_t017_jira_provisioned`,
      note: 'Atlassian OAuth app not yet provisioned — see followup (j) Jira OAuth wiring.',
    };
  }

  /**
   * Stub: handle the redirect from Atlassian after the user grants consent.
   * Real implementation will:
   *   1. Validate the `state` param against the persisted CSRF row.
   *   2. POST the `code` to Atlassian's /oauth/token endpoint with our
   *      client_secret to exchange for an access_token + refresh_token.
   *   3. Persist the tokens encrypted in TB-021 jira_connections.
   *   4. Audit `jira_oauth_completed` with cloud_id + project_id.
   *   5. Redirect the user back to the Settings page.
   *
   * Today: audit the stub callback + return a stub-acknowledgement payload.
   */
  async jiraOAuthCallback(
    slug: string,
    queryParams: Record<string, string | undefined>,
    ctx: ActorContext,
  ): Promise<{ stub: true; received: Record<string, string | undefined> }> {
    const project = await this.getBySlug(slug, ctx);
    await this.audit.write({
      workspaceId: ctx.workspaceId,
      actorId: ctx.actorId,
      entityType: 'jira_connection',
      entityId: project.id,
      action: 'jira_oauth_callback_stub',
      payload: {
        project_id: project.id,
        project_key: project.key,
        actor_email: ctx.actorEmail,
        // We log keys but redact values — even stub query params shouldn't
        // bloat the audit chain with sensitive (eventually-real) tokens.
        received_keys: Object.keys(queryParams).sort(),
        note: 'STUB — token exchange deferred',
      },
    });
    return {
      stub: true,
      received: queryParams,
    };
  }
}
