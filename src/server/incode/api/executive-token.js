import { Headers as HttpHeader } from 'node-fetch';
import { doPost } from '../helpers/http-post.js';
import dotenv from 'dotenv';

dotenv.config();

export const executiveToken = async () => {
    const endpoint = "executive/log-in";

    //Tweak Incode's URL removing the /0 specifically for the executive login endpoint
    let url = `${process.env.API_URL.substring(0, process.env.API_URL.length - 2)}/${endpoint}`;

    const params = {
        email: process.env.USERNAME,
        password: process.env.PASSWORD
    }

    const header = new HttpHeader();
    header.append('Content-Type', "application/json");
    header.append('x-api-key', process.env.API_KEY);
    header.append('api-version', '1.0');

    try {
        const resp = await doPost(url, header, params);
        return resp.body.token;

    } catch (error) {
        throw Error(`error using ${endpoint}`);
    }

};