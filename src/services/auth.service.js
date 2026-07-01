import logger from '#config/logger.js';
import bcrypt from 'bcrypt';
import { db } from '#config/database.js';
import { eq } from 'drizzle-orm';
import { users } from '#models/user.model.js';

export const hashPassword = async (password) => {
    try{
        return await bcrypt.hash(password, 10);
    } catch(e){
        logger.error(`Failed to hash password ${e}`);
        throw new Error ('Error hashing password');
    }
};

export const comparePassword = async (password, hashedPassword) => {
    try{
        return await bcrypt.compare(password, hashedPassword);
    } catch(e){
        logger.error(`Failed to compare password ${e}`);
        throw new Error('Error comparing password');
    }
};

export const createUser = async ({ name, email, password, role = 'user' }) => {
    try{
        const existingUser = await db.select().from(users).where(eq(users.email, email)).limit(1);
        if(existingUser.length > 0){
            throw new Error('User already exists');
        }

        const password_hash = await hashPassword(password);

        const [newUser] = await db.insert(users).values({ name, email, password: password_hash, role }).returning({ id: users.id, name: users.name, email: users.email, role: users.role, created_at: users.created_at});

        logger.info(`User created with email: ${email}`);
        return newUser;

    } catch(e){
        logger.error('Failed to create user', {
            message: e?.message,
            stack: e?.stack,
            cause: e?.cause,
            error: e,
        });
        throw new Error('Error creating user', { cause: e });
    }

};

export const authenticateUser = async ({ email, password }) => {
    try{
        const [user] = await db.select({
            id: users.id,
            name: users.name,
            email: users.email,
            role: users.role,
            password: users.password,
            created_at: users.created_at
        }).from(users).where(eq(users.email, email)).limit(1);

        if(!user){
            throw new Error('User not found');
        }

        const isPasswordValid = await comparePassword(password, user.password);
        if(!isPasswordValid){
            throw new Error('Invalid password');
        }

        const { password: _password, ...authenticatedUser } = user;
        logger.info(`User authenticated with email: ${email}`);
        return authenticatedUser;
    } catch(e){
        logger.error(`Failed to authenticate user ${e}`);
        if(e.message === 'User not found' || e.message === 'Invalid password'){
            throw e;
        }
        throw new Error('Error authenticating user');
    }
};