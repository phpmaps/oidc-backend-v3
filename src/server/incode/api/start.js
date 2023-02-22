import { Headers as HttpHeader } from 'node-fetch';
import { doPost } from '../helpers/http-post.js';
import dotenv from 'dotenv';

dotenv.config();

export const start = async (flowId) => {
    const endpoint = "omni/start";

    //Tweak Incode's URL removing the /0 specifically for the executive login endpoint
    let url = `${process.env.API_URL.substring(0, process.env.API_URL.length - 2)}/${endpoint}`;

    const params = {
        configurationId: flowId,
        countryCode: "ALL",
        language: "en-US"
    }

    const header = new HttpHeader();
    header.append('Content-Type', "application/json");
    header.append('x-api-key', process.env.API_KEY);
    header.append('api-version', '1.0');

    try {
        const resp = await doPost(url, header, params);
        return {
            token: resp.body.token,
            interviewId: resp.body.interviewId
        };

    } catch (error) {
        throw Error(`error using ${endpoint}`);
    }
};