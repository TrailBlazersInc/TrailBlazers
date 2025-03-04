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
        const { email, aggressor_email, description } = req.body;
        let user = await User
            .findOne({ email: email })
            .catch((err) => {
                res.status(400).json({ status: 'error', error: err });
            });
        if (!user) {
            res.status(404).json({ status: 'error', error: 'User not found' });
        }
        let report = new Report({
            type: 'report',
            aggressorEmail: aggressor_email,
            reporterEmail: email,
            description: description
        });
        await report.save();
        res.status(200).json({ status: 'success', report });
        
    }
}