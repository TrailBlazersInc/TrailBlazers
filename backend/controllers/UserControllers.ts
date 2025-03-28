import { Request, Response } from 'express';
import { User } from '../models/user'
import { Report } from '../models/report'

export class UserController {
    async getUserData(req: Request, res: Response){
        let user = await User.findOne({ email: req.params.email });
        res.status(200).json({ status: 'success', user });
    }
    async putUserData(req: Request, res: Response){
        try {
            const { distance, time, pace, availability } = req.body;
            var newValues = { $set: {distance, time, pace, availability } };
            var result = await User.updateOne({ email: req.params.email }, newValues);
            if(!result.acknowledged || result.modifiedCount == 0){
                return res.status(400).json({ error: "User not found" });
            }
            else {
                res.status(200).json({ message: "User data updated successfully" });
            }
        } catch (error) {
            res.status(500).json({ status: 'error', error: 'Error Updating User' });
        }
    }
    public async banUser(req: Request, res: Response) {
        try {
            var newValues = { $set: {banned: true } };
            var result = await User.updateOne({ email: req.params.email }, newValues);
            console.log(result.modifiedCount)
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
    async getReports(req: Request, res: Response) {
        let reports = await Report.find();
        let formattedReports = reports.map( report => ({
            id: report._id,
            agressrEmail: report.aggressorEmail,
            reporterEmail: report.reporterEmail,
            description: report.description
        }))
        res.status(200).json(formattedReports);
    }

    async postReport(req: Request, res: Response) {
        try{
            const email = req.params.email
            const { aggressor_email, description } = req.body;
            let user = await User.findOne({ email })
            if (!user) {
                return res.status(404).send('User not found' );
            }
            let report = new Report({
                description,
                aggressorEmail: aggressor_email,
                reporterEmail: email
            });
            await report.save();
            return res.status(200).json({ status: 'success', report });
        } catch (error){
            return res.status(500).send("Could not Report User")
        }
        
    }
}