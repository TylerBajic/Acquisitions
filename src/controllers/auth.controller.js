import logger from '#config/logger.js';
import { signupSchema } from '#validations/auth.validation.js';
import { formatValidationErrors } from '#utils/format.js';
import { createUser } from '#services/auth.service.js';
import jwttoken from 'jsonwebtoken';
import cookies from 'cookie-parser';


export const signup = async(req, res, next) => {
    try{
        const validationResult = signupSchema.safeParse(req.body);

        if(!validationResult.success){
            return res.status(400).json({
                error: 'Validation failed',
                details: formatValidationError(validationResult.error)
            });
        }

        const {name, email, password, role} = validationResult.data;

        //AUTH SERVICE
        const user = await createUser({ name, email, password, role });

        const token = jwttoken.sign({ id: user.id, email: user.email, role: user.role });

        cookies.set(res, 'token', token);

        logger.info(`Creating user with email: ${email}`);
        res.status(201).json({
            message: 'User created successfully',
            user: {
                id: user.id, name: user.name, email: user.email, role: user.role
            }
        });
    }catch(e){
        logger.error('Signup error', e);

        if(e.message === 'User already exists'){
            return res.status(409).json({ message: 'User already exists' });
        }

        next(e);
    }
};