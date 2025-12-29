import { Router, Request, Response, NextFunction } from 'express';
import { MetricsService } from '../services/metrics.service';

const router = Router();
const metricsService = new MetricsService();

// GET /api/metrics/summary?gameId=xxx&hours=24
router.get('/summary', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const gameId = req.query.gameId as string;
    const hours = req.query.hours ? parseInt(req.query.hours as string) : 24;

    if (!gameId) {
      res.status(400).json({ error: 'gameId is required' });
      return;
    }

    const summary = await metricsService.getSummary(gameId, hours);
    res.json(summary);
  } catch (error) {
    next(error);
  }
});

// GET /api/metrics/timeseries?gameId=xxx&metric=crashes&interval=hour&hours=24
router.get('/timeseries', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const gameId = req.query.gameId as string;
    const metric = (req.query.metric as 'crashes' | 'sessions' | 'events') || 'events';
    const interval = (req.query.interval as 'hour' | 'day') || 'hour';
    const hours = req.query.hours ? parseInt(req.query.hours as string) : 24;

    if (!gameId) {
      res.status(400).json({ error: 'gameId is required' });
      return;
    }

    const data = await metricsService.getTimeSeries(gameId, metric, interval, hours);
    res.json({ gameId, metric, interval, data });
  } catch (error) {
    next(error);
  }
});

// GET /api/metrics/errors?gameId=xxx&limit=10
router.get('/errors', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const gameId = req.query.gameId as string;
    const limit = req.query.limit ? parseInt(req.query.limit as string) : 10;

    if (!gameId) {
      res.status(400).json({ error: 'gameId is required' });
      return;
    }

    const errors = await metricsService.getTopErrors(gameId, limit);
    res.json({ gameId, errors });
  } catch (error) {
    next(error);
  }
});

// GET /api/metrics/games - List all games with data
router.get('/games', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const games = await metricsService.getGamesList();
    res.json({ games });
  } catch (error) {
    next(error);
  }
});

export default router;
