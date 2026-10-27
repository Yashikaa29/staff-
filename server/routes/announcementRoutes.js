import express from 'express';
import {
  getAllAnnouncements,
  createAnnouncement,
  updateAnnouncement,
  deleteAnnouncement,
} from '../controllers/announcementController.js';
import { protect, authorize } from '../middleware/auth.js';

const router = express.Router();

router.use(protect);

router
  .route('/')
  .get(getAllAnnouncements)
  .post(authorize('HR'), createAnnouncement);

router
  .route('/:id')
  .put(authorize('HR'), updateAnnouncement)
  .delete(authorize('HR'), deleteAnnouncement);

export default router;
