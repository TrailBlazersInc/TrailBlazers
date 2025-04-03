import { jest } from "@jest/globals";
import crypto from 'crypto';

export class OAuth2Client {
    verifyIdToken = jest.fn(({ idToken }: { idToken: string }) => {
      if (idToken === 'valid_mock_token') {
        return {
          getPayload: () => ({
            sub: crypto.randomUUID(),
            email: 'validEmail@example.com',
            given_name: 'Mock',
            family_name: 'User',
            admin: true
          }),
        }
      }
      else if(idToken === 'no_name'){
        return {
          getPayload: () => ({
            sub: crypto.randomUUID(),
            email: 'validEmail@example.com',
            given_name: undefined,
            family_name: undefined,
            admin: true
          }),
        }
      }
      else if(idToken === 'empty_payload'){
        return {
          getPayload: () => (null),
        };
      }
      return null;
    });
  } 
  