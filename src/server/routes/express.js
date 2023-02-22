/* eslint-disable no-console, camelcase, no-unused-vars */
import { strict as assert } from 'node:assert';
import * as querystring from 'node:querystring';
import { inspect } from 'node:util';

import isEmpty from 'lodash/isEmpty.js';
import { urlencoded } from 'express'; // eslint-disable-line import/no-unresolved

import Account from '../support/account.js';

import { init } from '../incode/init.js';

import { errors } from '../../lib/index.js'; // from 'oidc-provider';

const body = urlencoded({ extended: false });

const keys = new Set();
const debug = (obj) => querystring.stringify(Object.entries(obj).reduce((acc, [key, value]) => {
  keys.add(key);
  if (isEmpty(value)) return acc;
  acc[key] = inspect(value, { depth: null });
  return acc;
}, {}), '<br/>', ': ', {
  encodeURIComponent(value) { return keys.has(value) ? `<strong>${value}</strong>` : value; },
});

export default (app, provider) => {
  if (provider?.errors) {
    const { constructor: { errors: { SessionNotFound } } } = provider;
  }

  app.use((req, res, next) => {
    const orig = res.render;
    res.render = (view, locals) => {
      app.render(view, locals, (err, html) => {
        if (view !== 'login') {
          if (err) throw err;
          orig.call(res, '_layout', {
            ...locals,
            body: html,
          });

        } else {
          orig.call(res, view, {
            ...locals
          });
        }

      });
    };
    next();
  });

  function setNoCache(req, res, next) {
    res.set('cache-control', 'no-store');
    next();
  }

  app.get('/interaction/:uid', setNoCache, async (req, res, next) => {
    try {
      const {
        uid, prompt, params, session,
      } = await provider.interactionDetails(req, res);

      const client = await provider.Client.find(params.client_id);

      switch (prompt.name) {
        case 'login': {
          if (client.clientId === process.env.OIDC_CLIENT_ID) {
            const frontendHostname = process.env.FRONTEND_HOSTNAME;
            const flow = await init(process.env.FLOW_ID);
            const iid = flow.interviewId;
            const flows = {
              gov_id_selfie: JSON.stringify(flow)
            }


            return res.render('login', {
              client,
              frontendHostname,
              uid,
              flows,
              iid,
              details: prompt.details,
              params,
              title: 'Sign-in',
              session: session ? debug(session) : undefined,
              dbg: {
                params: debug(params),
                prompt: debug(prompt),
              },
            });

          } else {

            //TODO: Create visual error screen for unrecognized clientId.

            return res.render('login', {
              client,
              uid,
              onboardingUrls,
              details: prompt.details,
              params,
              title: 'Sign-in',
              session: session ? debug(session) : undefined,
              dbg: {
                params: debug(params),
                prompt: debug(prompt),
              },
            });

          }
        }
        case 'consent': {
          return res.render('interaction', {
            client,
            uid,
            details: prompt.details,
            params,
            title: 'Authorize',
            session: session ? debug(session) : undefined,
            dbg: {
              params: debug(params),
              prompt: debug(prompt),
            },
          });
        }
        default:
          return undefined;
      }
    } catch (err) {
      return next(err);
    }
  });

  app.post('/interaction/:uid/login', setNoCache, body, async (req, res, next) => {
    try {
      //TODO: Doogs monitor this.
      // const temp = await provider.interactionDetails(req, res);
      // console.log(":::interactionDetails")
      // console.log(temp);
      const { grantId, params, prompt: { name } } = await provider.interactionDetails(req, res);
      assert.equal(name, 'login');

    
      const account = await Account.findByLogin({
        token: req.body.id,
        interviewId: req.body.interview
      });

      let grant;
      if (grantId) {
        grant = await provider.Grant.find(grantId);
      } else {
        grant = new provider.Grant({ accountId: account.accountId, clientId: params.client_id });
        if (params?.scope) {
          grant.addOIDCScope(params?.scope);
        }
      }

      const result = {
        consent: {
          grantId: await grant.save()
        },
        login: {
          accountId: account.accountId,
        },
      };

      await provider.interactionFinished(req, res, result, { mergeWithLastSubmission: false });
    } catch (err) {
      next(err);
    }
  });

  app.post('/interaction/:uid/confirm', setNoCache, body, async (req, res, next) => {
    try {
      const interactionDetails = await provider.interactionDetails(req, res);
      const { prompt: { name, details }, params, session: { accountId } } = interactionDetails;
      assert.equal(name, 'consent');

      let { grantId } = interactionDetails;
      let grant;

      if (grantId) {
        grant = await provider.Grant.find(grantId);
      } else {
        grant = new provider.Grant({
          accountId,
          clientId: params.client_id,
        });
      }

      if (details.missingOIDCScope) {
        grant.addOIDCScope(details.missingOIDCScope.join(' '));
      }

      if (details.missingOIDCClaims) {
        grant.addOIDCClaims(details.missingOIDCClaims);
      }
      
      if (details.missingResourceScopes) {
        for (const [indicator, scopes] of Object.entries(details.missingResourceScopes)) {
          grant.addResourceScope(indicator, scopes.join(' '));
        }
      }

      grantId = await grant.save();

      const consent = {};
      if (!interactionDetails.grantId) {
        consent.grantId = grantId;
      }

      const result = { consent };
      await provider.interactionFinished(req, res, result, { mergeWithLastSubmission: true });
    } catch (err) {
      next(err);
    }
  });

  app.get('/interaction/:uid/abort', setNoCache, async (req, res, next) => {
    try {
      const result = {
        error: 'access_denied',
        error_description: 'End-User aborted interaction',
      };
      await provider.interactionFinished(req, res, result, { mergeWithLastSubmission: false });
    } catch (err) {
      next(err);
    }
  });

  app.use((err, req, res, next) => {
    //if (err instanceof SessionNotFound) {
    console.log("Error catch mode.");
    console.log(err);
    // handle interaction expired / session not found error
    //}
    next(err);
  });
};
