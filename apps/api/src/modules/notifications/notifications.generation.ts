import type {
  NotificationGenerationPort,
  NotificationGenerationUseCase,
} from './notifications.types.js';

const NOTICE_WINDOW_HOURS = 48;

export class NotificationGenerationService implements NotificationGenerationUseCase {
  public constructor(private readonly repository: NotificationGenerationPort) {}

  public execute(now = new Date()): Promise<number> {
    const dueAt = new Date(
      now.getTime() + NOTICE_WINDOW_HOURS * 60 * 60 * 1_000,
    );
    return this.repository.generate(now, dueAt);
  }
}
