/*
 * requires Redis ReJSON plugin (https://oss.redislabs.com/rejson/)
 */

import dotenv from 'dotenv';
// npm i ioredis@^4.0.0
import Redis from 'ioredis'; // eslint-disable-line import/no-unresolved

dotenv.config();

//const client = new Redis(process.env.REDIS_HOST, process.env.REDIS_PORT, {username:"default", password:"zTr7RM2EEJIGwxPg0pn9pAWJyOJl1hqg"}) ;

console.log({
  host: process.env.REDIS_HOST,
  port: process.env.REDIS_PORT,
  password: process.env.REDIS_PASSWORD
});

const client = new Redis(
  process.env.REDIS_HOST,
  process.env.REDIS_PORT,
  {
    password: process.env.REDIS_PASSWORD
  })
  .on('connect', function () {
    console.log('Redis connected ' + process.env.REDIS_HOST + ":" + process.env.REDIS_PORT);
  })
  .on('error', (err) => {
    if (err.code == 'ECONNREFUSED') {
      console.log("ERROR Redis: Express cannot create a Redis connection, ECONNREFUSED")
      client.disconnect()
      return;
    } else {
      console.log("ERROR Redis: Express unable to connect to Redis");
      console.log(err)
    }
  });

const grantable = new Set([
  'AccessToken',
  'AuthorizationCode',
  'RefreshToken',
  'DeviceCode',
  'BackchannelAuthenticationRequest',
]);

function grantKeyFor(id) {
  return `oidc:grant:${id}`;
}

function userCodeKeyFor(userCode) {
  return `oidc:userCode:${userCode}`;
}

function uidKeyFor(uid) {
  return `oidc:uid:${uid}`;
}

class RedisAdapter {
  constructor(name) {
    this.name = name;
  }

  async upsert(id, payload, expiresIn) {
    const key = this.key(id);

    const multi = client.multi();

    multi.call('JSON.SET', key, '.', JSON.stringify(payload));

    if (expiresIn) {
      multi.expire(key, expiresIn);
    }

    if (grantable.has(this.name) && payload.grantId) {
      const grantKey = grantKeyFor(payload.grantId);
      multi.rpush(grantKey, key);
      // if you're seeing grant key lists growing out of acceptable proportions consider using LTRIM
      // here to trim the list to an appropriate length
      const ttl = await client.ttl(grantKey);
      if (expiresIn > ttl) {
        multi.expire(grantKey, expiresIn);
      }
    }

    if (payload.userCode) {
      const userCodeKey = userCodeKeyFor(payload.userCode);
      multi.set(userCodeKey, id);
      multi.expire(userCodeKey, expiresIn);
    }

    if (payload.uid) {
      const uidKey = uidKeyFor(payload.uid);
      multi.set(uidKey, id);
      multi.expire(uidKey, expiresIn);
    }

    await multi.exec();
  }

  async find(id) {
    const key = this.key(id);
    const data = await client.call('JSON.GET', key);
    if (!data) return undefined;
    return JSON.parse(data);
  }

  async findByUid(uid) {
    const id = await client.get(uidKeyFor(uid));
    return this.find(id);
  }

  async findByUserCode(userCode) {
    const id = await client.get(userCodeKeyFor(userCode));
    return this.find(id);
  }

  async destroy(id) {
    const key = this.key(id);
    await client.del(key);
  }

  async revokeByGrantId(grantId) { // eslint-disable-line class-methods-use-this
    const multi = client.multi();
    const tokens = await client.lrange(grantKeyFor(grantId), 0, -1);
    tokens.forEach((token) => multi.del(token));
    multi.del(grantKeyFor(grantId));
    await multi.exec();
  }

  async consume(id) {
    await client.call('JSON.SET', this.key(id), 'consumed', Math.floor(Date.now() / 1000));
  }

  key(id) {
    return `oidc:${this.name}:${id}`;
  }
}

export default RedisAdapter;