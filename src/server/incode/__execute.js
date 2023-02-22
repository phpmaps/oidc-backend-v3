import dotenv from 'dotenv';
import { getOcr } from './api/get-ocr';
import { getScores } from './api/get-scores';
import { flatten } from './helpers/flatten';
import { Auth } from './helpers/auth';

dotenv.config();

const interviewId = "63883b19c5517ed9b826f4f2";

const auth = new Auth();

(async () => {
    const header = await auth.getLoginHeader();
    const scores = await getScores(interviewId, header);
    const ocr = await getOcr(interviewId, header);
    //TODO: Make results aligned to study spec
    const data = { ...scores.body };
})();
