import { Router, Request, Response, NextFunction } from 'express';
import { z } from 'zod';
import { EventsService } from '../services/events.service';
import { logger } from '../utils/logger';

const router = Router();
const eventsService = new EventsService();

// Validation schemas
const CreateEventSchema = z.object({
  gameId: z.string().min(1).max(50),
  eventType: z.enum(['crash', 'performance', 'session', 'custom']),
  severity: z.enum(['info', 'warning', 'critical']).optional(),
  payload: z.record(z.any()).optional(),
  timestamp: z.string().datetime().optional()
});

const BatchEventsSchema = z.object({
  events: z.array(CreateEventSchema).min(1).max(100)
});

// POST /api/events - Create single event
router.post('/', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const validated = CreateEventSchema.parse(req.body);
    const event = await eventsService.createEvent(validated);
    res.status(201).json(event);
  } catch (error) {
    if (error instanceof z.ZodError) {
      res.status(400).json({ error: 'Validation failed', details: error.errors });
    } else {
      next(error);
    }
  }
});

// POST /api/events/batch - Create multiple events
router.post('/batch', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const validated = BatchEventsSchema.parse(req.body);
    const events = await eventsService.createEvents(validated.events);
    res.status(201).json({ inserted: events.length, events });
  } catch (error) {
    if (error instanceof z.ZodError) {
      res.status(400).json({ error: 'Validation failed', details: error.errors });
    } else {
      next(error);
    }
  }
});

// GET /api/events - Query events
router.get('/', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const query = {
      gameId: req.query.gameId as string,
      eventType: req.query.eventType as string,
      severity: req.query.severity as string,
      from: req.query.from as string,
      to: req.query.to as string,
      limit: req.query.limit ? parseInt(req.query.limit as string) : undefined,
      offset: req.query.offset ? parseInt(req.query.offset as string) : undefined
    };

    const result = await eventsService.getEvents(query);
    res.json(result);
  } catch (error) {
    next(error);
  }
});

// GET /api/events/:id - Get single event
router.get('/:id', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const event = await eventsService.getEventById(req.params.id);
    if (!event) {
      res.status(404).json({ error: 'Event not found' });
      return;
    }
    res.json(event);
  } catch (error) {
    next(error);
  }
});

export default router;
