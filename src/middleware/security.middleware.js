import aj from '#config/arcjet.js';
import logger from '#config/logger.js';
import { slidingWindow } from '@arcjet/node';

const securityMiddleware = async (req, res, next) => {
  try{
    const role = req.user?.role || 'guest'; // Default to 'guest' if no user is authenticated

    let limit;
    let message;

    switch(role){
      case 'admin':
        limit = 20; // Admins can make 20 requests per minute
        message = 'Admin rate limit exceeded. Please try again later.';
        break;
      case 'user':
        limit = 10; // Regular users can make 10 requests per minute
        message = 'User rate limit exceeded. Please try again later.';
        break;
      default:
        limit = 5; // Guests and fallthrough default
        message = 'Guest rate limit exceeded. Please try again later.';
        break;
    }

    // Ensure the Arcjet client and helper exist before using them
    const rule = slidingWindow ? slidingWindow({ mode: 'LIVE', interval: 60, max: limit, name: `${role}-rate-limit` }) : null;
    const client = (aj && typeof aj.withRule === 'function' && rule) ? aj.withRule(rule) : aj;

    const decision = client && typeof client.protect === 'function' ? await client.protect(req) : null;

    // If Arcjet didn't return a decision, continue without enforcing
    if(!decision){
      logger.warn('Arcjet returned no decision; skipping security checks');
      return next();
    }

    // Guard against missing reason or missing helper methods
    const denied = typeof decision.isDenied === 'function' ? decision.isDenied() : false;
    const reason = decision.reason || null;

    if(denied && reason && typeof reason.isBot === 'function' && reason.isBot()){
      logger.warn(`Bot detected: ${typeof reason.getDetails === 'function' ? reason.getDetails() : 'n/a'}`);
      return res.status(403).json({ message: 'Access denied. Bot activity detected.' });
    }

    if(denied && reason && typeof reason.isShield === 'function' && reason.isShield()){
      logger.warn(`Request denied by Arcjet Shield: ${typeof reason.getDetails === 'function' ? reason.getDetails() : 'n/a'}`);
      return res.status(403).json({ message: 'Access denied. Suspicious activity detected.' });
    }

    if(denied && reason && typeof reason.isRateLimit === 'function' && reason.isRateLimit()){
      logger.warn(`Rate limit exceeded for role ${role}: ${typeof reason.getDetails === 'function' ? reason.getDetails() : 'n/a'}`);
      return res.status(403).json({ message: `Too many requests. ${message}` });
    }

    return next();

  }catch(e){
    // Log full error stack and continue without crashing the request pipeline
    logger.error('Arcjet security middleware error', e?.stack || e);
    console.error('Arcjet security middleware error', e);
    // Instead of blocking requests when security middleware fails, allow them through
    return next();
  }
};

export default securityMiddleware;