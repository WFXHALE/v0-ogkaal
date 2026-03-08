// middleware.ts

import { Request, Response, NextFunction } from 'express';

// Middleware to protect routes
export const protectRoutes = (req: Request, res: Response, next: NextFunction) => {
    // Check for authentication token in headers
    const token = req.headers.authorization?.split(' ')[1];
    if (!token) {
        return res.status(401).json({ message: 'Unauthorized access. Token is missing.' });
    }

    // TODO: Add authentication logic using the token
    // If valid token, proceed to the next middleware
    // Otherwise, respond with an error

    next();
};

// Middleware to check user authentication
export const checkUserAuth = (req: Request, res: Response, next: NextFunction) => {
    // Implement your authentication logic here
    // Example: Check the user’s role or permissions
    const user = req.user; // Assume req.user is populated after authentication
    if (!user || !user.isAuthenticated) {
        return res.status(403).json({ message: 'Access forbidden. You do not have permission.' });
    }

    next();
};