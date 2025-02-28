import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import dotenv from 'dotenv';

dotenv.config();

export const authMiddleware = (req: Request, res: Response, next: NextFunction) => {
    const token = req.headers.authorization?.split(' ')[0];

    if (!token) {
        return res.status(401).json({ message: "Unauthorized: No token provided"});
    }

    try {
        const decodedToken = jwt.verify(token, process.env.JWT_SECRET!);
        console.log("HERE1");
        (req as any).user = decodedToken;
        console.log("HERE2");
        next();
    } catch (error) {
        return res.status(401).json({ message: "Unauthorized: No token provided"});
    }
}
