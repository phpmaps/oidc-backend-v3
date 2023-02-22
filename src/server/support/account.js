import { nanoid } from 'nanoid';
import { fetchResults } from '../incode/results.js';

export const store = new Map();
export const logins = new Map();

class Account {
  constructor(session, profile) {
    this.session = session;
    this.accountId = session.interviewId || nanoid();
    this.profile = profile;
    store.set(this.accountId, this);
  }

  /**
   * @param use - can either be "id_token" or "userinfo", depending on
   *   where the specific claims are intended to be put in.
   * @param scope - the intended scope, while oidc-provider will mask
   *   claims depending on the scope automatically you might want to skip
   *   loading some claims from external resources etc. based on this detail
   *   or not return them in id tokens but only userinfo and so on.
   */
  async claims(use, scope) { // eslint-disable-line no-unused-vars

    if (this.profile) {
      console.log(":::Results has profile")
      return {
        sub: this.accountId, // it is essential to always return a sub claim
      };
    }

    //TODO: Doogs need to make sure this.session works in CF
    console.log(":::Results no profile")
    const results = await fetchResults(this.session.interviewId, this.session.token);
    results.sub = this.accountId;
    this.profile = results;
    store.set(this.accountId, this);
    return {
      sub: this.accountId, // it is essential to always return a sub claim
    };
  }

  static async findByFederated(provider, claims) {
    const id = `${provider}.${claims.sub}`;
    if (!logins.get(id)) {
      logins.set(id, new Account(id, claims));
    }
    return logins.get(id);
  }

  static async findByLogin(session) {
    if (!logins.get(session.interviewId)) {
      logins.set(session.interviewId, new Account(session));
    }

    return logins.get(session.interviewId);
  }

  static async findAccount(ctx, id, token) { // eslint-disable-line no-unused-vars
    // token is a reference to the token used for which a given account is being loaded,
    //   it is undefined in scenarios where account claims are returned from authorization endpoint
    // ctx is the koa request context
    console.log(":::findAccount");
    if (!store.get(id)) new Account(id); // eslint-disable-line no-new
    return store.get(id);
  }
}

export default Account;
