import express from 'express';
import {
  createProjectController,
  getAllProjectsController,
  getProjectByIdController,
  updateProjectController,
  deleteProjectController,
  addProjectMemberController,
  removeProjectMemberController,
} from './project.controller';
import { authenticateJWT } from '../../middleware/auth.middleware';
import { apiRateLimiter } from '../../middleware/rateLimit.middleware';

const router = express.Router();

router.use(authenticateJWT);


router.post('/', apiRateLimiter, createProjectController);
router.patch('/:id', apiRateLimiter, updateProjectController);
router.delete('/:id', apiRateLimiter, deleteProjectController);
router.post('/:id/members', apiRateLimiter, addProjectMemberController);
router.delete('/:id/members/:userId', apiRateLimiter, removeProjectMemberController);


router.get('/', getAllProjectsController);
router.get('/:id', getProjectByIdController);

export default router;
