/* eslint-disable no-param-reassign, no-console */
'use strict';
const redis = require('redis');
const PORT = '6379';
const HOST = '127.0.0.1';
const DB = 9;
const NO_FIELDS = 'No fields to parse';

const clientsHash = {};
let redisClient;
function initClient(db, port, host) {
    // console.log('creating new connector!');
    redisClient = redis.createClient({
        port,
        host,
        db
    });
    redisClient.on('connect', err => {
        clientsHash[port] = true;
        // console.log('successfully connected');
    });
    redisClient.on('error', err => {
        delete clientsHash[port];
        console.error(err);
        throw err;
    });
    return redisClient;
}

class SweetworkRedisClient {
    constructor(host, port, dbIdx) {
        if (!redisClient) {
            if (dbIdx === null || dbIdx === undefined) dbIdx = DB;
            if (port === null || port === undefined) port = PORT;
            if (host === null || host === undefined) host = HOST;
            initClient(dbIdx, port, host);
        }
    }

    /**
     * @return {instance of redisClient}
     */
    getRawClient() {
        return redisClient;
    }

    // helper functions
    parseOpt(command, opt, fields) {
        if (!Array.isArray(fields)) throw new Error(NO_FIELDS);
        fields.forEach(item => {
            if (['key', 'field', 'member', 'source', 'destination'].indexOf(item) > -1) {
                // strings
                if (typeof opt[item] !== 'string') {
                    throw new TypeError(`Missing/invalid ${item}=${JSON.stringify(opt[item])} in option argument => ${command}`);
                }
            } else if (['score', 'offset', 'limit', 'count', 'index', 'start', 'stop', 'ex'].indexOf(item) > -1) {
                // integers
                if (!isFinite(parseInt(opt[item], 10))) {
                    throw new TypeError(`Missing/invalid ${item}=${JSON.stringify(opt[item])} in option argument => ${command}`);
                }
            } else if (['min', 'max', 'value'].indexOf(item) > -1) {
                // strings or integers
                if (!isFinite(parseInt(opt[item], 10)) && typeof opt[item] !== 'string') {
                    throw new TypeError(`Missing/invalid ${item}=${JSON.stringify(opt[item])} in option argument => ${command}`);
                }
            } else if (['keys', 'fields', 'members'].indexOf(item) > -1) {
                // arrays
                if (!Array.isArray(opt[item])) {
                    throw new TypeError(`Missing/invalid ${item}=${JSON.stringify(opt[item])} in option argument => ${command}`);
                }
            } else if (['hash'].indexOf(item) > -1) {
                // object
                if (typeof opt[item] === 'object' && Array.isArray(opt[item])) {
                    throw new TypeError(`Missing/invalid ${item}=${JSON.stringify(opt[item])} in option argument => ${command}`);
                }
            } else if (['scomembers'].indexOf(item) > -1) {
                // arrays of arrays cycling through ints and strings
                if (!Array.isArray(opt[item])) {
                    throw new TypeError(`Missing/invalid ${item}=${JSON.stringify(opt[item])} in option argument => ${command}`);
                } else if (opt[item].length > 0) {
                    opt[item].forEach((i, idx) => {
                        if (idx % 2 !== 0 && typeof i !== 'string') {
                            // odd values
                            throw new TypeError(`Missing/invalid ${item}=${JSON.stringify(i)} in option argument => ${command}`);
                        } else if (idx % 2 === 0 && !isFinite(parseInt(i, 10))) {
                            // even values
                            throw new TypeError(`Missing/invalid ${item}=${JSON.stringify(i)} in option argument => ${command}`);
                        }
                    });
                }
            } else {
                throw new Error(`Option argument ${item}=${JSON.stringify(opt[item])} not supported => ${command}`);
            }
        });
    }
    quit() {
        return redisClient.quit();
    }

    // simple key-value
    set(opt) {
        // TODO implement EX PX NX XX args
        const that = this;
        return new Promise((resolve, reject) => {
            try {
                that.parseOpt('set', opt, ['key', 'value']);
                redisClient.set(opt.key, opt.value, (e, r) => {
                    if (e) reject(e);
                    else resolve(r);
                });
            } catch (err) {
                reject(err);
            }
        });
    }
    setex(opt) {
        // TODO implement EX PX NX XX args
        const that = this;
        return new Promise((resolve, reject) => {
            try {
                that.parseOpt('set', opt, ['key', 'value', 'ex']);
                redisClient.setex(opt.key, opt.ex, opt.value, (e, r) => {
                    if (e) reject(e);
                    else resolve(r);
                });
            } catch (err) {
                reject(err);
            }
        });
    }
    get(opt) {
        const that = this;
        return new Promise((resolve, reject) => {
            try {
                that.parseOpt('get', opt, ['key']);
                redisClient.get(opt.key, (e, r) => {
                    if (e) reject(e);
                    else resolve(r);
                });
            } catch (err) {
                reject(err);
            }
        });
    }
    del(opt) {
        const that = this;
        return new Promise((resolve, reject) => {
            try {
                that.parseOpt('get', opt, ['key']);
                redisClient.del(opt.key, (e, r) => {
                    if (e) reject(e);
                    else resolve(r);
                });
            } catch (err) {
                reject(err);
            }
        });
    }

    // hmap key-field-value
    hset(opt) {
        const that = this;
        return new Promise((resolve, reject) => {
            try {
                // Deprecated: The HSET command contains a argument of type Array, please use toString()
                if (Array.isArray(opt.value)) {
                    opt.value = opt.value.join(',');
                }
                that.parseOpt('hset', opt, ['key', 'field', 'value']);
                redisClient.hset(opt.key, opt.field, opt.value, (e, r) => {
                    if (e) reject(e);
                    else resolve(r);
                });
            } catch (err) {
                reject(err);
            }
        });
    }
    hget(opt) {
        const that = this;
        return new Promise((resolve, reject) => {
            try {
                that.parseOpt('hget', opt, ['key', 'field']);
                redisClient.hget(opt.key, opt.field, (e, r) => {
                    if (e) reject(e);
                    else resolve(r);
                });
            } catch (err) {
                reject(err);
            }
        });
    }
    hlen(opt) {
        const that = this;
        return new Promise((resolve, reject) => {
            try {
                that.parseOpt('hlen', opt, ['key']);
                redisClient.hlen(opt.key, (e, r) => {
                    if (e) reject(e);
                    else resolve(r);
                });
            } catch (err) {
                reject(err);
            }
        });
    }
    hgetall(opt) {
        const that = this;
        return new Promise((resolve, reject) => {
            try {
                that.parseOpt('hgetall', opt, ['key']);
                redisClient.hgetall(opt.key, (e, r) => {
                    if (e) reject(e);
                    else resolve(r);
                });
            } catch (err) {
                reject(err);
            }
        });
    }
    hmset(opt) {
        const that = this;
        return new Promise((resolve, reject) => {
            try {
                that.parseOpt('hmset', opt, ['key', 'hash']);
                const fieldValues = [];
                const hashKeys = Object.keys(opt.hash);
                hashKeys.forEach(key => {
                    // Deprecated: The HMSET command contains a argument of type Array, please use toString()
                    if (Array.isArray(opt.hash[key])) {
                        opt.hash[key] = opt.hash[key].join(',');
                    }
                    fieldValues.push(...[key, opt.hash[key]]);
                });
                redisClient.hmset(opt.key, ...fieldValues, (e, r) => {
                    if (e) reject(e);
                    else resolve(r);
                });
            } catch (err) {
                reject(err);
            }
        });
    }
    hmget(opt) {
        const that = this;
        return new Promise((resolve, reject) => {
            try {
                if (opt.field !== undefined) opt.fields = [opt.field];
                that.parseOpt('hmget', opt, ['key', 'fields']);
                redisClient.hmget(opt.key, ...opt.fields, (e, r) => {
                    if (e) reject(e);
                    else resolve(r);
                });
            } catch (err) {
                reject(err);
            }
        });
    }
    hexists(opt) {
        const that = this;
        return new Promise((resolve, reject) => {
            try {
                that.parseOpt('hexists', opt, ['key', 'field']);
                redisClient.hexists(opt.key, opt.field, (e, r) => {
                    if (e) reject(e);
                    else resolve(r);
                });
            } catch (err) {
                reject(err);
            }
        });
    }
    hdel(opt) {
        const that = this;
        return new Promise((resolve, reject) => {
            try {
                if (opt.field !== undefined) opt.fields = [opt.field];
                that.parseOpt('hdel', opt, ['key', 'fields']);
                redisClient.hdel(opt.key, opt.fields, (e, r) => {
                    if (e) reject(e);
                    else resolve(r);
                });
            } catch (err) {
                reject(err);
            }
        });
    }
    hkeys(opt) {
        const that = this;
        return new Promise((resolve, reject) => {
            try {
                that.parseOpt('hkeys', opt, ['key']);
                redisClient.hkeys(opt.key, (e, r) => {
                    if (e) reject(e);
                    else resolve(r);
                });
            } catch (err) {
                reject(err);
            }
        });
    }

    // sorted sets key-score-member
    zadd(opt) {
        const that = this;
        return new Promise((resolve, reject) => {
            try {
                if (opt.scomember !== undefined) opt.scomembers = [opt.scomember];
                // TODO implement INCR CH NX XX args
                that.parseOpt('zadd', opt, ['key', 'scomembers']);
                redisClient.zadd(opt.key, ...opt.scomembers, (e, r) => {
                    if (e) reject(e);
                    else resolve(r);
                });
            } catch (err) {
                reject(err);
            }
        });
    }
    zcount(opt) {
        const that = this;
        return new Promise((resolve, reject) => {
            try {
                if (opt.min === undefined) opt.min = '-inf';
                if (opt.max === undefined) opt.max = '+inf';
                that.parseOpt('zcount', opt, ['key', 'min', 'max']);
                redisClient.zcount(opt.key, opt.min, opt.max, (e, r) => {
                    if (e) reject(e);
                    else resolve(r);
                });
            } catch (err) {
                reject(err);
            }
        });
    }
    zrangebyscore(opt, order) {
        const that = this;
        return new Promise((resolve, reject) => {
            try {
                if (order === undefined) order = 'asc';
                if (opt.min === undefined) opt.min = '-inf';
                if (opt.max === undefined) opt.max = '+inf';
                if (opt.offset === undefined) opt.offset = 0;
                if (opt.limit === undefined) opt.limit = 1000;
                if (opt.withscores === undefined) opt.withscores = true; // default is true
                that.parseOpt('zrangebyscore', opt, ['key', 'min', 'max', 'offset', 'limit']);
                if (order === 'asc') {
                    if (opt.withscores) {
                        redisClient.zrangebyscore(opt.key, opt.min, opt.max, 'WITHSCORES', 'LIMIT', opt.offset, opt.limit, (e, r) => {
                            if (e) reject(e);
                            else resolve(r);
                        });
                    } else {
                        redisClient.zrangebyscore(opt.key, opt.min, opt.max, 'LIMIT', opt.offset, opt.limit, (e, r) => {
                            if (e) reject(e);
                            else resolve(r);
                        });
                    }
                } else if (order === 'desc') {
                    if (opt.withscores) {
                        redisClient.zrevrangebyscore(opt.key, opt.max, opt.min, 'WITHSCORES', 'LIMIT', opt.offset, opt.limit, (e, r) => {
                            if (e) reject(e);
                            else resolve(r);
                        });
                    } else {
                        redisClient.zrevrangebyscore(opt.key, opt.max, opt.min, 'LIMIT', opt.offset, opt.limit, (e, r) => {
                            if (e) reject(e);
                            else resolve(r);
                        });
                    }
                }
            } catch (err) {
                reject(err);
            }
        });
    }
    zrevrangebyscore(opt) {
        return this.zrangebyscore(opt, 'desc');
    }
    zscore(opt) {
        const that = this;
        return new Promise((resolve, reject) => {
            try {
                that.parseOpt('zscore', opt, ['key', 'member']);
                redisClient.zscore(opt.key, opt.member, (e, r) => {
                    if (e) reject(e);
                    else resolve(r);
                });
            } catch (err) {
                reject(err);
            }
        });
    }
    zrem(opt) {
        const that = this;
        return new Promise((resolve, reject) => {
            try {
                if (opt.member !== undefined) opt.members = [opt.member];
                that.parseOpt('zrem', opt, ['key', 'members']);
                redisClient.zrem(opt.key, ...opt.members, (e, r) => {
                    if (e) reject(e);
                    else resolve(r);
                });
            } catch (err) {
                reject(err);
            }
        });
    }
    // linked list
    lpush(opt) {
        const that = this;
        return new Promise((resolve, reject) => {
            try {
                that.parseOpt('lpush', opt, ['key', 'members']);
                redisClient.lpush(opt.key, ...opt.members, (e, r) => {
                    if (e) reject(e);
                    else resolve(r);
                });
            } catch (err) {
                reject(err);
            }
        });
    }
    rpush(opt) {
        const that = this;
        return new Promise((resolve, reject) => {
            try {
                that.parseOpt('rpush', opt, ['key', 'members']);
                redisClient.rpush(opt.key, ...opt.members, (e, r) => {
                    if (e) reject(e);
                    else resolve(r);
                });
            } catch (err) {
                reject(err);
            }
        });
    }
    lrem(opt) {
        const that = this;
        return new Promise((resolve, reject) => {
            try {
                that.parseOpt('lrem', opt, ['key', 'count', 'member']);
                redisClient.lrem(opt.key, opt.count, opt.member, (e, r) => {
                    if (e) reject(e);
                    else resolve(r);
                });
            } catch (err) {
                reject(err);
            }
        });
    }
    lindex(opt) {
        const that = this;
        return new Promise((resolve, reject) => {
            try {
                that.parseOpt('lindex', opt, ['key', 'index']);
                redisClient.lindex(opt.key, opt.index, (e, r) => {
                    if (e) reject(e);
                    else resolve(r);
                });
            } catch (err) {
                reject(err);
            }
        });
    }
    lpop(opt) {
        const that = this;
        return new Promise((resolve, reject) => {
            try {
                that.parseOpt('lpop', opt, ['key']);
                redisClient.lpop(opt.key, (e, r) => {
                    if (e) reject(e);
                    else resolve(r);
                });
            } catch (err) {
                reject(err);
            }
        });
    }
    rpop(opt) {
        const that = this;
        return new Promise((resolve, reject) => {
            try {
                that.parseOpt('rpop', opt, ['key']);
                redisClient.rpop(opt.key, (e, r) => {
                    if (e) reject(e);
                    else resolve(r);
                });
            } catch (err) {
                reject(err);
            }
        });
    }
    rpoplpush(opt) {
        const that = this;
        return new Promise((resolve, reject) => {
            try {
                that.parseOpt('rpoplpush', opt, ['source', 'destination']);
                redisClient.rpoplpush(opt.source, opt.destination, (e, r) => {
                    if (e) reject(e);
                    else resolve(r);
                });
            } catch (err) {
                reject(err);
            }
        });
    }
    llen(opt) {
        const that = this;
        return new Promise((resolve, reject) => {
            try {
                that.parseOpt('llen', opt, ['key']);
                redisClient.llen(opt.key, (e, r) => {
                    if (e) reject(e);
                    else resolve(r);
                });
            } catch (err) {
                reject(err);
            }
        });
    }
    lrange(opt) {
        const that = this;
        return new Promise((resolve, reject) => {
            try {
                if (opt.start === undefined) opt.start = 0;
                if (opt.stop === undefined) opt.stop = -1;
                that.parseOpt('lrange', opt, ['key', 'start', 'stop']);
                redisClient.lrange(opt.key, opt.start, opt.stop, (e, r) => {
                    if (e) reject(e);
                    else resolve(r);
                });
            } catch (err) {
                reject(err);
            }
        });
    }
    // sets
    sadd(opt) {
        const that = this;
        return new Promise((resolve, reject) => {
            try {
                that.parseOpt('sadd', opt, ['key', 'members']);
                redisClient.sadd(opt.key, ...opt.members, (e, r) => {
                    if (e) reject(e);
                    else resolve(r);
                });
            } catch (err) {
                reject(err);
            }
        });
    }
    scard(opt) {
        const that = this;
        return new Promise((resolve, reject) => {
            try {
                that.parseOpt('scard', opt, ['key']);
                redisClient.scard(opt.key, (e, r) => {
                    if (e) reject(e);
                    else resolve(r);
                });
            } catch (err) {
                reject(err);
            }
        });
    }
    sismember(opt) {
        const that = this;
        return new Promise((resolve, reject) => {
            try {
                that.parseOpt('sismember', opt, ['key', 'member']);
                redisClient.sismember(opt.key, opt.member, (e, r) => {
                    if (e) reject(e);
                    else resolve(r);
                });
            } catch (err) {
                reject(err);
            }
        });
    }
    smembers(opt) {
        const that = this;
        return new Promise((resolve, reject) => {
            try {
                that.parseOpt('smembers', opt, ['key']);
                redisClient.smembers(opt.key, (e, r) => {
                    if (e) reject(e);
                    else resolve(r);
                });
            } catch (err) {
                reject(err);
            }
        });
    }
    srem(opt) {
        const that = this;
        return new Promise((resolve, reject) => {
            try {
                that.parseOpt('srem', opt, ['key', 'members']);
                redisClient.srem(opt.key, ...opt.members, (e, r) => {
                    if (e) reject(e);
                    else resolve(r);
                });
            } catch (err) {
                reject(err);
            }
        });
    }
}

module.exports = SweetworkRedisClient;
