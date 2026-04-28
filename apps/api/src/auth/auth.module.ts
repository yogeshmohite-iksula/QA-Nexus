import { Module } from '@nestjs/common';
import { AuthController } from './auth.controller';
import { AuthService } from './auth.service';
import { RolesGuard } from './rbac/roles.guard';
import { RbacDemoController } from './rbac/rbac-demo.controller';

@Module({
  controllers: [AuthController, RbacDemoController],
  providers: [AuthService, RolesGuard],
  exports: [AuthService, RolesGuard],
})
export class AuthModule {}
