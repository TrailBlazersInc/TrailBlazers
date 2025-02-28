import { Request, Response, NextFunction } from 'express';
import { OAuth2Client } from 'google-auth-library';
import { client } from '../services';
import jwt from 'jsonwebtoken';
import dotenv from 'dotenv';

dotenv.config();

const googleClient = new OAuth2Client(process.env.GOOGLE_CLIENT_ID);

//https://stackoverflow.com/questions/58666691/verify-google-id-token-with-node-js
export class authenticate {
    async authId(req: Request, res: Response) {
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

          let user = await client.db("test").collection("users").findOne({ social_id: response.sub });

          if (!user) {
            const user = {
              email: response.email,
              social_id: response.sub,
              first_name: response.given_name,
              last_name: response.family_name,
              pace: "10:00",
              distance: "Short",
              time: "Short",
              banned: false
            };

            await client.db("test").collection("users").insertOne(user);
          }

          if (!user) {
            return res.status(404).json({ message: 'User not found' });
          }

          const token = jwt.sign({ id: user.social_id }, process.env.JWT_SECRET!, { expiresIn: '12h' });

          res.status(200).json({ status: 'success', token });
        } catch (error) {
          res.status(500).json({ status: 'error', error: 'Internal Server Error' });
        }

    };
    async getUser(req: Request, res: Response, nextFunction: NextFunction) {
      const todos = await client.db("test").collection("users").findOne({ email: "amanvirsamra@gmail.com"});
      res.status(200).send(todos);
    };
}