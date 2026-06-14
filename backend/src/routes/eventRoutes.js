import express from 'express';
import * as eventController from '../controllers/eventController.js';
import { requireAuth, requireRole } from '../middleware/authMiddleware.js';

const router = express.Router();

router.get('/', requireAuth, eventController.getAllEvents);
router.post('/', requireAuth, requireRole(['ADMIN', 'TREASURER']), eventController.createEvent);

router.get('/attendance/me', requireAuth, eventController.getMyAttendance);
router.get('/attendance/all', requireAuth, requireRole(['ADMIN', 'TREASURER']), eventController.getAllAttendance);

router.get('/:eventId/attendance', requireAuth, eventController.getEventAttendance);
router.post('/:eventId/attendance', requireAuth, requireRole(['ADMIN']), eventController.markAttendance);
router.delete('/:eventId/attendance/:profileId', requireAuth, requireRole(['ADMIN']), eventController.removeAttendance);

// Attendance Verification endpoints
router.post('/:eventId/attendance/apply', requireAuth, eventController.applyForAttendance);
router.get('/attendance/pending', requireAuth, requireRole(['ADMIN', 'TREASURER']), eventController.getPendingAttendanceRequests);
router.post('/attendance/verify/:requestId', requireAuth, requireRole(['ADMIN', 'TREASURER']), eventController.verifyAttendanceRequest);

export default router;
