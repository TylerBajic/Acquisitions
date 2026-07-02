import logger from '#config/logger.js';
import { formatValidationErrors } from '#utils/format.js';
import { cookies } from '#utils/cookies.js';
import { jwttoken } from '#utils/jwt.js';
import {
  getAllUsers,
  getUserById as getUserByIdService,
  updateUser as updateUserService,
  deleteUser as deleteUserService,
} from '#services/users.services.js';
import { userIdSchema, updateUserSchema } from '#validations/users.validation.js';

const getAuthenticatedUser = (req) => {
  const token = cookies.get(req, 'token') || (req.headers.authorization?.startsWith('Bearer ') ? req.headers.authorization.split(' ')[1] : null);
  if (!token) {
    throw new Error('Authentication required');
  }

  return jwttoken.verify(token);
};

export const fetchAllUsers = async (req, res, next) => {
  try {
    logger.info('Fetching all users');
    const allUsers = await getAllUsers();
    res.json({
      message: 'Successfully fetched all users',
      users: allUsers,
      count: allUsers.length,
    });
  } catch (e) {
    logger.error(`Error in fetchAllUsers: ${e.message}`);
    next(e);
  }
};

export const fetchUserById = async (req, res, next) => {
  try {
    const validationResult = userIdSchema.safeParse(req.params);
    if (!validationResult.success) {
      return res.status(400).json({
        error: 'Validation failed',
        details: formatValidationErrors(validationResult.error),
      });
    }

    const { id } = validationResult.data;
    logger.info(`Fetching user by id: ${id}`);

    const user = await getUserByIdService(id);
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    res.json({ message: 'Successfully fetched user', user });
  } catch (e) {
    logger.error(`Error in fetchUserById: ${e.message}`);
    next(e);
  }
};

export const updateUser = async (req, res, next) => {
  try {
    const idValidation = userIdSchema.safeParse(req.params);
    if (!idValidation.success) {
      return res.status(400).json({
        error: 'Validation failed',
        details: formatValidationErrors(idValidation.error),
      });
    }

    const bodyValidation = updateUserSchema.safeParse(req.body);
    if (!bodyValidation.success) {
      return res.status(400).json({
        error: 'Validation failed',
        details: formatValidationErrors(bodyValidation.error),
      });
    }

    const user = getAuthenticatedUser(req);
    const { id } = idValidation.data;
    const updates = bodyValidation.data;

    if (user.id !== id && user.role !== 'admin') {
      return res.status(403).json({ message: 'Forbidden: cannot update another user' });
    }

    if (updates.role && user.role !== 'admin') {
      return res.status(403).json({ message: 'Forbidden: only admin can update user roles' });
    }

    logger.info(`Updating user with id: ${id} by user ${user.id}`);
    const updatedUser = await updateUserService(id, updates);
    res.json({ message: 'User updated successfully', user: updatedUser });
  } catch (e) {
    logger.error(`Error in updateUser: ${e.message}`);
    if (e.message === 'User not found') {
      return res.status(404).json({ message: 'User not found' });
    }
    if (e.message === 'Authentication required' || e.message === 'Failed to authenticate token') {
      return res.status(401).json({ message: 'Authentication required' });
    }
    next(e);
  }
};

export const deleteUser = async (req, res, next) => {
  try {
    const validationResult = userIdSchema.safeParse(req.params);
    if (!validationResult.success) {
      return res.status(400).json({
        error: 'Validation failed',
        details: formatValidationErrors(validationResult.error),
      });
    }

    const user = getAuthenticatedUser(req);
    const { id } = validationResult.data;

    if (user.id !== id && user.role !== 'admin') {
      return res.status(403).json({ message: 'Forbidden: cannot delete another user' });
    }

    logger.info(`Deleting user with id: ${id} by user ${user.id}`);
    await deleteUserService(id);
    res.json({ message: 'User deleted successfully' });
  } catch (e) {
    logger.error(`Error in deleteUser: ${e.message}`);
    if (e.message === 'User not found') {
      return res.status(404).json({ message: 'User not found' });
    }
    if (e.message === 'Authentication required' || e.message === 'Failed to authenticate token') {
      return res.status(401).json({ message: 'Authentication required' });
    }
    next(e);
  }
};