// F07 Founder Onboarding wizard — orchestrator.
// FormProvider wraps all 3 steps so values persist across step transitions
// without remount. Step state is mirrored to the URL `?step=N` query param
// so /ui-check can deep-link to each step for the Rule 13 visual gate.
//
// Pattern A (PM1_PRD §F07): Steps 1 + 2 only collect data. The chosen
// data source (Jira / Upload) is STORED in wizard state but the
// data-source flow does NOT fire here. It fires from handleSubmitFinal()
// AFTER the atomic commit on Step 3 succeeds — a TODO until M1 wires it.

'use client';

import { useState, useCallback } from 'react';
import { useSearchParams, useRouter, usePathname } from 'next/navigation';
import { FormProvider, useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';

import { WizardShell } from './wizard-shell';
import { WizardProgress } from './wizard-progress';
import { StepProject } from './step-project';
import { StepDataSource } from './step-data-source';
import { StepTeamInvite } from './step-team-invite';
import {
  buildFounderAtomicPayload,
  founderWizardSchema,
  wizardDefaults,
  type FounderWizardForm,
} from './schemas';

type StepNum = 1 | 2 | 3;

function readStepFromQuery(sp: URLSearchParams | null | undefined): StepNum {
  const s = sp?.get('step');
  if (s === '2') return 2;
  if (s === '3') return 3;
  return 1;
}

export function FounderWizard() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const pathname = usePathname();

  const [step, setStep] = useState<StepNum>(() => readStepFromQuery(searchParams));

  // Note: browser back/forward URL sync (useEffect on searchParams) is
  // intentionally omitted for Step 1. State/URL stay aligned via gotoStep().
  // Re-add if a back-button regression surfaces during /ui-check on Steps 2/3.

  const methods = useForm<FounderWizardForm>({
    resolver: zodResolver(founderWizardSchema),
    mode: 'onBlur',
    defaultValues: wizardDefaults,
    shouldUnregister: false,
  });

  const gotoStep = useCallback(
    (next: StepNum) => {
      setStep(next);
      router.replace(`${pathname}?step=${next}`, { scroll: false });
    },
    [pathname, router],
  );

  const handleNext = useCallback(async () => {
    let fields: Array<keyof FounderWizardForm> = [];
    if (step === 1) fields = ['name', 'description', 'glyph', 'jiraKey'];
    else if (step === 2) fields = ['source'];
    const ok = await methods.trigger(fields, { shouldFocus: true });
    if (!ok) return;
    if (step === 1) gotoStep(2);
    else if (step === 2) gotoStep(3);
  }, [step, methods, gotoStep]);

  const handleBack = useCallback(() => {
    if (step === 2) gotoStep(1);
    else if (step === 3) gotoStep(2);
  }, [step, gotoStep]);

  const handleSubmitFinal = useCallback(async () => {
    const ok = await methods.trigger();
    if (!ok) return;
    const values = methods.getValues();
    const payload = buildFounderAtomicPayload(values);

    // Pattern A enforcement (PM1_PRD §F07):
    //   - This handler ONLY logs deferred-flow markers. It MUST NOT issue
    //     any network call: no fetch, no TanStack Query mutation, no
    //     POST /onboarding/founder. Those land in MS0-T030.4 once
    //     MS0-T021 (BetterAuth) provides a session.
    //   - The data-source flow (Jira OAuth handshake / Upload modal)
    //     fires AFTER the atomic commit succeeds — also in T030.4.
    //
    // Marker format: `pattern-a:deferred:<phase>` so log-grep tooling can
    // verify no network side-effects shipped from FE in M0.

    console.info('pattern-a:deferred:atomic-commit', payload);
    console.info('pattern-a:deferred:data-source-flow', {
      source: payload.source ?? null,
    });
  }, [methods]);

  return (
    <FormProvider {...methods}>
      <WizardShell>
        <div className="mx-auto flex w-full max-w-[640px] flex-col gap-8 sm:gap-10">
          <WizardProgress currentStep={step} />
          <section aria-live="polite">
            {step === 1 && <StepProject onNext={handleNext} />}
            {step === 2 && <StepDataSource onNext={handleNext} onBack={handleBack} />}
            {step === 3 && <StepTeamInvite onSubmit={handleSubmitFinal} onBack={handleBack} />}
          </section>
        </div>
      </WizardShell>
    </FormProvider>
  );
}
