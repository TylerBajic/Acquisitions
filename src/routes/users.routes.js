import express from 'express';
import {
  fetchAllUsers,
  fetchUserById,
  updateUser,
  deleteUser,
} from '#controllers/user.controller.js';

const router = express.Router();

router.get('/', fetchAllUsers);
router.get('/:id', fetchUserById);
router.put('/:id', updateUser);
router.delete('/:id', deleteUser);

export default router;