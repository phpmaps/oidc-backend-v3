import dotenv from 'dotenv';
import { Auth } from './helpers/auth.js';

dotenv.config();

export const init = async (flowId) => {
    const auth = new Auth(flowId);
    const session = await auth.getSessionHeader();
    console.log("SESSION")
    console.log(session);
    const data = { 
        token: session.token, 
        interviewId: session.interviewId,
        apiUrl: process.env.API_URL 
    };
    return data

}

