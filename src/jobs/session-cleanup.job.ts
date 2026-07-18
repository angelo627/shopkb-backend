import { sessionService } from "../modules/sessions/session.service";

export function startSessionCleanupJob(): void {
  const ONE_DAY = 24 * 60 * 60 * 1000;

  setInterval(async () => {
    try {
      const deleted = await sessionService.cleanupExpiredSessions();

      console.log(
        `[Session Cleanup] Deleted ${deleted} expired/revoked sessions.`
      );
    } catch (error) {
      console.error("[Session Cleanup]", error);
    }
  }, ONE_DAY);
}