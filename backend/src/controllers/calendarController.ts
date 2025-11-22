import { Request, Response } from 'express';
import { asyncHandler } from '../middleware/errorHandler';
import { UserRepository } from '../repositories/userRepository';
import { AppError } from '../utils/appError';
import ical from 'node-ical';

const userRepo = new UserRepository();

export const getGoogleCalendarEvents = asyncHandler(async (req: Request, res: Response) => {
  if (!req.user) {
    throw new AppError('Authentication required', 401);
  }

  const user = await userRepo.findById(req.user.id);
  if (!user || !user.google_calendar_link) {
    return res.status(200).json({ status: 'success', data: [] });
  }

  try {
    const response = await fetch(user.google_calendar_link);
    if (!response.ok) {
        throw new Error('Failed to fetch calendar');
    }
    const text = await response.text();
    const data = ical.parseICS(text);
    
    const events = Object.values(data).filter((event: any) => event.type === 'VEVENT').map((event: any) => ({
       id: event.uid,
       title: event.summary,
       start: event.start,
       end: event.end,
       description: event.description,
       location: event.location,
       source: 'google'
    }));

    res.status(200).json({
      status: 'success',
      data: events,
    });
  } catch (error) {
    console.error('Error fetching Google Calendar:', error);
    res.status(200).json({
      status: 'success',
      data: [],
    });
  }
});
