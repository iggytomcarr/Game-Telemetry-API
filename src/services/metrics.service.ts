import { Event } from '../models/mongo/Event';
import { query } from '../config/mysql';
import { logger } from '../utils/logger';

interface SummaryMetrics {
  gameId: string;
  period: string;
  crashCount: number;
  sessionCount: number;
  eventCount: number;
  criticalCount: number;
}

interface TimeSeriesPoint {
  timestamp: string;
  value: number;
}

export class MetricsService {
  async getSummary(gameId: string, hours: number = 24): Promise<SummaryMetrics> {
    const since = new Date(Date.now() - hours * 60 * 60 * 1000);

    const [crashCount, sessionCount, eventCount, criticalCount] = await Promise.all([
      Event.countDocuments({ gameId, eventType: 'crash', timestamp: { $gte: since } }),
      Event.countDocuments({ gameId, eventType: 'session', timestamp: { $gte: since } }),
      Event.countDocuments({ gameId, timestamp: { $gte: since } }),
      Event.countDocuments({ gameId, severity: 'critical', timestamp: { $gte: since } })
    ]);

    return {
      gameId,
      period: `${hours}h`,
      crashCount,
      sessionCount,
      eventCount,
      criticalCount
    };
  }

  async getTimeSeries(
    gameId: string,
    metric: 'crashes' | 'sessions' | 'events',
    interval: 'hour' | 'day' = 'hour',
    hours: number = 24
  ): Promise<TimeSeriesPoint[]> {
    const since = new Date(Date.now() - hours * 60 * 60 * 1000);
    
    const eventTypeFilter = {
      crashes: 'crash',
      sessions: 'session',
      events: null // all events
    };

    const matchStage: any = {
      gameId,
      timestamp: { $gte: since }
    };

    if (eventTypeFilter[metric]) {
      matchStage.eventType = eventTypeFilter[metric];
    }

    const dateFormat = interval === 'hour' 
      ? { $dateToString: { format: '%Y-%m-%dT%H:00:00Z', date: '$timestamp' } }
      : { $dateToString: { format: '%Y-%m-%dT00:00:00Z', date: '$timestamp' } };

    const result = await Event.aggregate([
      { $match: matchStage },
      {
        $group: {
          _id: dateFormat,
          value: { $sum: 1 }
        }
      },
      { $sort: { _id: 1 } },
      {
        $project: {
          _id: 0,
          timestamp: '$_id',
          value: 1
        }
      }
    ]);

    return result;
  }

  async getTopErrors(gameId: string, limit: number = 10): Promise<any[]> {
    const oneDayAgo = new Date(Date.now() - 24 * 60 * 60 * 1000);

    const result = await Event.aggregate([
      {
        $match: {
          gameId,
          eventType: 'crash',
          timestamp: { $gte: oneDayAgo }
        }
      },
      {
        $group: {
          _id: '$payload.errorType',
          count: { $sum: 1 },
          lastSeen: { $max: '$timestamp' },
          sample: { $first: '$payload' }
        }
      },
      { $sort: { count: -1 } },
      { $limit: limit },
      {
        $project: {
          _id: 0,
          errorType: '$_id',
          count: 1,
          lastSeen: 1,
          sample: 1
        }
      }
    ]);

    return result;
  }

  async getGamesList(): Promise<string[]> {
    const games = await Event.distinct('gameId');
    return games;
  }
}
