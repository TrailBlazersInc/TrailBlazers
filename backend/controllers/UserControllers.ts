import { Request, Response } from 'express';
import { OAuth2Client } from 'google-auth-library';
import { User, Location, Availability } from '../models/user'
import { Report } from '../models/report'
import jwt from 'jsonwebtoken';
import dotenv from 'dotenv';

dotenv.config();

const defaultLocation: Location = {
  latitude: 49.2,
  longitude: -123
}

const defaultAvailability: Availability = {
  monday: true,
  tuesday: true,
  wednesday: true,
  thursday: true,
  friday: true,
  saturday: true,
  sunday: true
}

const googleClient = new OAuth2Client(process.env.GOOGLE_CLIENT_ID);

export class UserController {
    async authId(req: Request, res: Response) {
        let new_user = false;
        const { googleId } = req.body;
        if (!googleId) {
            return res.status(400).json({ status: 'error', error: 'ID is required' });
        }

        try{
            const ticket = await googleClient.verifyIdToken({
                idToken: googleId,
                audience: process.env.GOOGLE_CLIENT_ID,
            });

            const response = ticket.getPayload();

            if (!response) {
                return res.status(400).json({ status: 'error', error: 'Bad Request' });
            }

            let user = await User.findOne({ social_id: response.sub });

            if (!user) {
                const first_name = response.given_name?? "Guest"
                const last_name = response.family_name?? "User"
                user = new User ({
                    email: response.email,
                    social_id: response.sub,
                    first_name,
                    last_name,
                    pace: 1,
                    distance: "Short",
                    time: "Short",
                    availability: defaultAvailability,
                    loc: defaultLocation,
                    banned: false,
                    admin: false
                });
                await user.save();
                new_user = true;
            }

            const jwtSecret = process.env.JWT_SECRET;
            if (!jwtSecret) {
                throw new Error("Missing JWT_SECRET environment variable.");
            }

            const token = jwt.sign({ id: user.social_id }, jwtSecret, { expiresIn: '12h' });

            res.status(200).json({ status: 'success', token, new_user, banned: user.banned, admin: user.admin });

        } catch (error) {
            console.error("GoogleAuth error:", error);
            res.status(500).json({ status: 'error', error: 'Internal Server Error' });
        }

    }
    
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
            res.status(500).json({ error: 'Internal server error' });
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
            return res.status(500).json({ error: "Could not Report User" })
        }
        
    }
}