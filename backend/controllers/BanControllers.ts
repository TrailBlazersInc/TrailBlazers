import { Request, Response } from 'express';
import { User } from '../models/user';
import { Ban } from '../models/ban';


export class BanController {
    public async banUser(req: Request, res: Response) {
        try {
            var newValues = { $set: {banned: true } };
            var result = await User.updateOne({ email: req.params.email }, newValues);

            if(!result.acknowledged || result.modifiedCount == 0){
                return res.status(404).json({ error: "User not found" });
            }
            else {
                res.status(200).json({ message: "User banned" });
            }
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