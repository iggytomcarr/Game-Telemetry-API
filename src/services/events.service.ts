import { Event, IEvent } from '../models/mongo/Event';
import { AlertService } from './alerts.service';
import { logger } from '../utils/logger';

interface CreateEventDTO {
  gameId: string;
  eventType: 'crash' | 'performance' | 'session' | 'custom';
  severity?: 'info' | 'warning' | 'critical';
  payload?: Record<string, any>;
  timestamp?: string;
}

interface EventQuery {
  gameId?: string;
  eventType?: string;
  severity?: string;
  from?: string;
  to?: string;
  limit?: number;
  offset?: number;
}

export class EventsService {
  private alertService: AlertService;

  constructor() {
    this.alertService = new AlertService();
  }

  async createEvent(data: CreateEventDTO): Promise<IEvent> {
    const event = new Event({
      gameId: data.gameId,
      eventType: data.eventType,
      severity: data.severity || 'info',
      payload: data.payload || {},
      timestamp: data.timestamp ? new Date(data.timestamp) : new Date(),
      processedAt: new Date()
    });

    await event.save();
    logger.debug(`Event created: ${event._id}`);

    // Check if we need to send an alert for crashes
    if (data.eventType === 'crash') {
      await this.checkCrashThreshold(data.gameId);
    }

    return event;
  }

  async createEvents(events: CreateEventDTO[]): Promise<IEvent[]> {
    const docs = events.map(data => ({
      gameId: data.gameId,
      eventType: data.eventType,
      severity: data.severity || 'info',
      payload: data.payload || {},
      timestamp: data.timestamp ? new Date(data.timestamp) : new Date(),
      processedAt: new Date()
    }));

    const inserted = await Event.insertMany(docs);
    logger.debug(`Batch inserted ${inserted.length} events`);

    // Check crash thresholds for any games with crashes
    const gamesWithCrashes = [...new Set(
      events.filter(e => e.eventType === 'crash').map(e => e.gameId)
    )];
    
    for (const gameId of gamesWithCrashes) {
      await this.checkCrashThreshold(gameId);
    }

    return inserted;
  }

  async getEvents(query: EventQuery): Promise<{ events: IEvent[]; total: number }> {
    const filter: any = {};
    
    if (query.gameId) filter.gameId = query.gameId;
    if (query.eventType) filter.eventType = query.eventType;
    if (query.severity) filter.severity = query.severity;
    
    if (query.from || query.to) {
      filter.timestamp = {};
      if (query.from) filter.timestamp.$gte = new Date(query.from);
      if (query.to) filter.timestamp.$lte = new Date(query.to);
    }

    const limit = Math.min(query.limit || 100, 1000);
    const offset = query.offset || 0;

    const [events, total] = await Promise.all([
      Event.find(filter)
        .sort({ timestamp: -1 })
        .skip(offset)
        .limit(limit)
        .lean(),
      Event.countDocuments(filter)
    ]);

    return { events: events as IEvent[], total };
  }

  async getEventById(id: string): Promise<IEvent | null> {
    return Event.findById(id).lean();
  }

  private async checkCrashThreshold(gameId: string): Promise<void> {
    const oneHourAgo = new Date(Date.now() - 60 * 60 * 1000);
    const threshold = parseInt(process.env.DISCORD_ALERT_THRESHOLD || '10');

    const crashCount = await Event.countDocuments({
      gameId,
      eventType: 'crash',
      timestamp: { $gte: oneHourAgo }
    });

    if (crashCount >= threshold) {
      await this.alertService.sendCrashAlert(gameId, crashCount, threshold);
    }
  }
}
