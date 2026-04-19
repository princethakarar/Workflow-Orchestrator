import express from 'express';
import { getDeveloperProjectView } from '../controllers/projectController.js';
import { toggleSubtaskForDeveloper } from '../controllers/taskController.js';
import { protect, authorize } from '../middlewares/auth_middleware.js';

const router = express.Router();

// All routes require developer authentication
router.use(protect);
router.use(authorize('developer'));

// Developer project view
router.get('/projects/:id', getDeveloperProjectView);

// Toggle subtask (developer can only toggle their own)
router.patch('/tasks/:taskId/subtasks/:subtaskId/toggle', toggleSubtaskForDeveloper);

export default router;
