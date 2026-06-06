// @Global so any module can inject EmailService.
// ADR-025: registers both EmailProvider strategies; EmailService selects the
// active one at boot from EMAIL_PROVIDER (default 'apps-script').
import { Global, Module } from '@nestjs/common';
import { EmailService } from './email.service';
import { AppsScriptEmailProvider } from './providers/apps-script.provider';
import { ResendEmailProvider } from './providers/resend.provider';

@Global()
@Module({
  providers: [EmailService, AppsScriptEmailProvider, ResendEmailProvider],
  exports: [EmailService],
})
export class EmailModule {}
