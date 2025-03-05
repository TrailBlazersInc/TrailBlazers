import { Request, Response, NextFunction } from 'express';
import { User } from '../models/user'
import { Report } from '../models/report'

export class ReportController {
    
    async getUserData(req: Request, res: Response, next: NextFunction){
        let user = await User.findOne({ email: req.params.email });
        res.status(200).json({ status: 'success', user });
    }

    async getReports(req: Request, res: Response, next: NextFunction) {
        let reports = await Report.find();
        res.status(200).json({ status: 'success', reports });
    }

    async postReport(req: Request, res: Response, next: NextFunction) {
        try{
            console.log("posting report")
            const email = req.params.email
            const { aggressor_email, description } = req.body;
            let user = await User.findOne({ email: email })
            if (!user) {
                return res.status(404).send('User not found' );
            }
            let report = new Report({
                description: description,
                aggressorEmail: aggressor_email,
                reporterEmail: email
            });
            await report.save();
            return res.status(200).json({ status: 'success', report });
        } catch (error){
            console.log(error)
            return res.status(500).send("Could not Report User")
        }
        
    }
}