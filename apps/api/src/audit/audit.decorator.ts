// @Audit({ entityType, action }) — opt-in declarative audit for controller
// methods. Read by AuditInterceptor; the interceptor writes the row only
// AFTER the handler resolves successfully (2xx). For nuanced cases (e.g.,
// the audit_log_id needs to appear in the response body), write directly
// via AuditService.write() in the controller.
//
// Spec: MS0-T027.
import { SetMetadata } from '@nestjs/common';

export const AUDIT_KEY = 'qa-nexus:audit:meta';

export interface AuditMeta {
  /** Logical entity type, e.g. "workspace", "test_case". */
  entityType: string;
  /** Snake-case action verb, e.g. "created", "updated", "deleted". */
  action: string;
  /** Optional: function to derive entity_id from the response body or
   *  request params. Default = null (sweeping action). */
  entityIdFrom?: 'response.id' | 'params.id' | 'body.id';
}

export const Audit = (meta: AuditMeta) => SetMetadata(AUDIT_KEY, meta);
