import logger from '#config/logger.js';
import bcrypt from 'bcrypt';
import { db } from '#config/db.js';
import {eq} from 'drizzle-orm';
import { users } from '#models/user.model.js';

export const hashPassword = async (password) => {
    try{
        return await bcrypt.hash(password, 10);
    } catch(e){
        logger.error(`Failed to hash password ${e}`);
        throw new Error ('Error hashing password');
    }
};

export const createUser = async ({ name, email, password, role = 'user' }) => {
    try{
        const existingUser = db.select().from(users).where(eq(users.email, email)).limit(1);
        if(existingUser.length > 0){
            throw new Error('User already exists');
        }

        const password_hash = await hashPassword(password);

        const [newUser] = await db.insert(users).values({ name, email, password: password_hash, role }).returning({ id: users.id, name: users.name, email: users.email, role: users.role, created_at: users.created_at});

        logger.info(`User created with email: ${email}`);
        return newUser;

    } catch(e){
        logger.error(`Failed to create user ${e}`);
        throw new Error('Error creating user');
    }

};