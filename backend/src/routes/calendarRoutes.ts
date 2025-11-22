import { Router } from 'express';
import { getGoogleCalendarEvents } from '../controllers/calendarController';
import { authenticate } from '../middleware/auth';

const router = Router();

router.get(
  '/google',
  authenticate,
  getGoogleCalendarEvents
);

export default router;
