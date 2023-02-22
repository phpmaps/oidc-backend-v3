import dotenv from 'dotenv';
import { getOcr } from './api/get-ocr.js';
import { getScores } from './api/get-scores.js';
import { flatten } from './helpers/flatten.js';
import { Auth } from './helpers/auth.js';


export const fetchResults = async (interviewId, token) => {
    const header = Auth.createHeader(token);
    const scores = await getScores(interviewId, header);
    
    //const ocr = await getOcr(interviewId, header)
    
    //TODO: Doogs -Format results per study requirements
    //TODO: Action item on retention and results

    const data = { ...scores };
    const flattenData = flatten(data);
    return flattenData;

}
