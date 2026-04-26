// Stub for F06c Reset Password (MS0-T029 + M1 BetterAuth wiring).
// Route exists so the F06 "Forgot password?" link doesn't 404.
// Full UI port lands in M0 Phase 3 alongside MS0-T029.

export default function ForgotPasswordPage() {
  return (
    <div className="bg-canvas mx-auto flex min-h-screen w-[1600px] items-center justify-center">
      <div className="text-text-secondary text-center">
        <h1
          className="text-text-primary text-[24px] font-semibold"
          style={{ fontFamily: 'var(--font-dm-sans), system-ui, sans-serif' }}
        >
          Forgot password
        </h1>
        <p className="mt-2 text-[14px]">
          F06c Reset Password UI scaffold lands in MS0-T029 (BetterAuth wiring in MS0-T021). Route
          placeholder so the F06 link does not 404.
        </p>
      </div>
    </div>
  );
}
