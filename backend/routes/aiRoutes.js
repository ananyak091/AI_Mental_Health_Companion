import express from 'express';
import { analyze } from '../controllers/aiController.js';
import { protect } from '../middlewares/authMiddlewares.js';

const router = express.Router();

router.post('/analyze', analyze);

export default router;