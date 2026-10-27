import express from 'express';
import {
  applyLeave,
  getMyLeaves,
  getPendingLeaves,
  getAllLeaves,
  updateLeaveStatus,
} from '../controllers/leaveController.js';
import { protect, authorize } from '../middleware/auth.js';

const router = express.Router();

router.use(protect);

router.post('/apply', applyLeave);
router.get('/my-leaves', getMyLeaves);
router.get('/pending', authorize('HR', 'Manager'), getPendingLeaves);
router.get('/all', authorize('HR', 'Manager'), getAllLeaves);
router.put('/:id/status', authorize('HR', 'Manager'), updateLeaveStatus);

export default router;
