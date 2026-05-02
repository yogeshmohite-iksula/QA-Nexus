import { Global, Module, forwardRef } from '@nestjs/common';
import { AuditService } from './audit.service';
import { AuditController } from './audit.controller';
import { AuthModule } from '../auth/auth.module';

@Global()
@Module({
  // forwardRef to break the AuditModule ↔ AuthModule cycle
  // (AuthModule's RolesGuard depends on AuditService for rbac_denied audits;
  //  AuditController depends on AuthService for session resolution).
  imports: [forwardRef(() => AuthModule)],
  controllers: [AuditController],
  providers: [AuditService],
  exports: [AuditService],
})
export class AuditModule {}
