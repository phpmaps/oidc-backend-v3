/* eslint-disable no-console */

import * as path from 'node:path';
import * as url from 'node:url';
import dotenv from 'dotenv';

import { dirname } from 'desm';
import express from 'express'; // eslint-disable-line import/no-unresolved
import helmet from 'helmet';

import Provider from '../lib/index.js'; // from 'oidc-provider';

import Account from './support/account.js';
import configuration from './support/configuration.js';
import routes from './routes/express.js';

const __dirname = dirname(import.meta.url);
dotenv.config();

const { PORT = 3000, ISSUER = process.env.OIDC_ISSUER } = process.env;
configuration.findAccount = Account.findAccount;

const app = express();
//app.use(express.json())
app.use(express.static(path.join(__dirname, 'public')))

const directives = helmet.contentSecurityPolicy.getDefaultDirectives();
delete directives['form-action'];
app.use(helmet({
    contentSecurityPolicy: {
        useDefaults: false,
        directives,
    },
}));

app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'ejs');

let server;
try {
    let adapter;
    if (process.env.MONGODB_URI) {
        ({ default: adapter } = await import('./adapters/mongodb.js'));
        await adapter.connect();
    }

    const prod = process.env.NODE_ENV === 'production';

    const provider = new Provider(ISSUER, { adapter, ...configuration });

    //TODO: Doogs to check
    provider.proxy = true;

    if (prod) {
        console.log('trust proxy')
        app.enable('trust proxy');
        provider.proxy = true;

        app.use((req, res, next) => {
            if (req.secure) {
                next();
            } else if (req.method === 'GET' || req.method === 'HEAD') {
                res.redirect(url.format({
                    protocol: 'https',
                    host: req.get('host'),
                    pathname: req.originalUrl,
                }));
            } else {
                res.status(400).json({
                    error: 'invalid_request',
                    error_description: 'do yourself a favor and only use https',
                });
            }
        });
    }


    routes(app, provider);

    app.use(provider.callback());
    server = app.listen(PORT, () => {
        console.log(`application is listening on port ${PORT}, check its /.well-known/openid-configuration`);
    });
    
} catch (err) {
    if (server?.listening) server.close();
    console.error(err);
    process.exitCode = 1;
}
