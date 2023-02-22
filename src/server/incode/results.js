import dotenv from 'dotenv';
import { getOcr } from './api/get-ocr.js';
import { getScores } from './api/get-scores.js';
import { flatten } from './helpers/flatten.js';
import { Auth } from './helpers/auth.js';


export const fetchResults = async (interviewId, token) => {
    const header = Auth.createHeader(token);
    const scores = await getScores(interviewId, header);
    
    const ocr = await getOcr(interviewId, header)
    const data = { ...scores, ...ocr.body };
    const flattenData = flatten(data);
    return flattenData;

}
