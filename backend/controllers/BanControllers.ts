import { Request, Response } from 'express';
import { User } from '../models/user';
import { Ban } from '../models/ban';


export class BanController {
    public async banUser(req: Request, res: Response): Promise<void> {
        try {
            const { userId, reason } = req.body;
            const user = await User.findById(userId);

            if (!user) {
                res.status(404).send({ message: 'User not found' });
                return;
            }

            const ban = new Ban({ userId, reason, date: new Date() });
            await ban.save();

            user.banned = true;
            await user.save();

            res.status(200).send({ message: 'User banned successfully' });
        } catch (error) {
            res.status(500).send({ message: 'Internal server error', error });
        }
    }

    public async unbanUser(req: Request, res: Response): Promise<void> {
        try {
            const { userId } = req.body;
            const user = await User.findById(userId);

            if (!user) {
                res.status(404).send({ message: 'User not found' });
                return;
            }

            await Ban.deleteOne({ userId });

            user.banned = false;
            await user.save();

            res.status(200).send({ message: 'User unbanned successfully' });
        } catch (error) {
            res.status(500).send({ message: 'Internal server error', error });
        }
    }
}