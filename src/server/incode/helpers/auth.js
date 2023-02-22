import { Headers as HttpHeader } from 'node-fetch';
import { executiveToken } from "../api/executive-token.js";
import { start } from '../api/start.js';

export class Auth {
    auth;
    interviewId;
    token;
    apikey;
    apiversion;
    flowId;

    constructor(flowId) {
        this.apikey = process.env.API_KEY;
        this.apiversion = process.env.API_VERSION;
        this.flowId = flowId;
    }

    async getLoginHeader() {
        this.token = await executiveToken();
        const header = new HttpHeader();
        header.append('Content-Type', "application/json");
        header.append('x-incode-hardware-id', this.token);
        header.append('api-version', this.apiversion);
        header.append('x-api-key', process.env.API_KEY);
        return header;
    }

    async getSessionHeader() {
        this.auth = await start(this.flowId);
        this.token = this.auth.token;
        this.interviewId = this.auth.interviewId;
        const header = new HttpHeader();
        header.append('Content-Type', "application/json");
        header.append('x-incode-hardware-id', this.token);
        header.append('api-version', this.apiversion);
        //header.append('x-api-key', process.env.API_KEY);
        return {
            header: header,
            token: this.token,
            interviewId: this.interviewId
        };
    }

    static createHeader(token) {
        const header = new HttpHeader();
        header.append('Content-Type', "application/json");
        header.append('x-incode-hardware-id', token);
        header.append('api-version', "1.0");
        return header;
    }
};