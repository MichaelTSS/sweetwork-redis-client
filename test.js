/* eslint-disable prefer-arrow-callback, no-unused-expressions */
const chai = require('chai');
chai.config.includeStack = true; // turn on stack trace

const expect = require('chai').expect;

const SweetworkRedisClient = require('./index');
const cli = new SweetworkRedisClient('127.0.0.1', 6379, 1);

describe('SweetworkRedisClient', function () {
    describe('Simple key-value storing', function () {
        it('should throw an error', function (done) {
            cli.set({ key: 'test--name' }).catch(err => {
                expect(err.message).to.equal('Missing/invalid value=undefined in option argument => set');
                done();
            });
        });

        it('should set a value', function (done) {
            cli.set({ key: 'test--name', value: 'Batman' }).then(value => {
                expect(value).to.equal('OK');
                done();
            });
        });

        it('should get a value', function (done) {
            cli.get({ key: 'test--name' }).then(value => {
                expect(value).to.equal('Batman');
                done();
            });
        });

        it('should update a value', function (done) {
            cli.set({ key: 'test--name', value: 'Joker' }).then(v => {
                expect(v).to.equal('OK');
                cli.get({ key: 'test--name' }).then(value => {
                    expect(value).to.equal('Joker');
                    done();
                });
            });
        });

        it('should delete a value', function (done) {
            cli.del({ key: 'test--name' }).then(() => {
                cli.get({ key: 'test--name' }).then(value => {
                    expect(value).to.be.null;
                    done();
                });
            });
        });

        it('should set a value with expiry time', function (done) {
            cli.setex({ key: 'test--name', value: 'Catwoman', ex: 1 }).then(value => {
                expect(value).to.equal('OK');
                done();
            });
        });

        it('should get a value with expiry time', function (done) {
            cli.get({ key: 'test--name' }).then(value => {
                expect(value).to.equal('Catwoman');
                done();
            });
        });

        it('should NOT get a value with expiry time', function (done) {
            setTimeout(() => {
                cli.get({ key: 'test--name' }).then(value => {
                    expect(value).to.be.null;
                    done();
                });
            }, 1500);
        });
    });

    describe('Hmap key-field-value storing', function () {
        it('should store an hash map', function (done) {
            cli.hmset({ key: 'test--Elon-Musk', hash: { SpaceX: 'boss1', Tesla: 'boss2' } }).then(() => {
                cli.hmget({ key: 'test--Elon-Musk', fields: ['SpaceX', 'Tesla'] }).then(values => {
                    expect(values).to.deep.equal(['boss1', 'boss2']);
                    done();
                });
            });
        });

        it('should store complex hash map value', function (done) {
            cli.hmset({ key: 'test--Elon-Musk', hash: { SpaceX: 'boss1', Tesla: 'boss2', sources: ['buzzfeed', 'new york times'] } }).then(() => {
                cli.hmget({ key: 'test--Elon-Musk', fields: ['SpaceX', 'Tesla', 'sources'] }).then(values => {
                    expect(values).to.deep.equal(['boss1', 'boss2', 'buzzfeed,new york times']);
                    done();
                });
            });
        });

        it('should store a complex hash map', function (done) {
            cli.hmset({ key: 'test--Peter-Thiel', hash: { Palantir: 'chairman', Born: 'Frankfurt', Companies: ['PayPal', 'Palantir Technologies', 'Founders Fund', 'Clarium Capital'] } }).then(() => {
                cli.hgetall({ key: 'test--Peter-Thiel' }).then(hash => {
                    expect(hash).to.deep.equal({
                        Palantir: 'chairman',
                        Born: 'Frankfurt',
                        Companies: 'PayPal,Palantir Technologies,Founders Fund,Clarium Capital'
                    });
                    done();
                });
            });
        });

        it('should create and read field-values', function (done) {
            cli.hset({ key: 'test--Elon-Musk', field: 'wealth', value: 'millionaire' });
            cli.hset({ key: 'test--Elon-Musk', field: 'SpaceX', value: 'CEO' });
            cli.hset({ key: 'test--Elon-Musk', field: 'Tesla', value: 'CTO' });
            cli.hset({ key: 'test--Elon-Musk', field: 'SolarCity', value: 'Chairman' });
            cli.hset({ key: 'test--Elon-Musk', field: 'job', value: 'chief designer' }).then(() => {
                cli.hget({ key: 'test--Elon-Musk', field: 'job' }).then(value => {
                    expect(value).to.equal('chief designer');
                    done();
                });
            });
        });

        it('should throw an error', function (done) {
            cli.hset({ key: 'test--Elon-Musk', field: 'wealth' }).catch(err => {
                expect(err.message).to.equal('Missing/invalid value=undefined in option argument => hset');
                cli.hget({ key: 'test--Elon-Musk', field: 'wealth' }).then(value => {
                    expect(value).to.equal('millionaire');
                    done();
                });
            });
        });

        it('should update one field-value', function (done) {
            cli.hset({ key: 'test--Elon-Musk', field: 'wealth', value: 'billionaire' }).then(() => {
                cli.hget({ key: 'test--Elon-Musk', field: 'wealth' }).then(value => {
                    expect(value).not.to.equal('millionaire');
                    expect(value).to.equal('billionaire');
                    done();
                });
            });
        });

        it('should delete one field-value', function (done) {
            cli.hdel({ key: 'test--Elon-Musk', field: 'wealth' }).then(() => {
                cli.hget({ key: 'test--Elon-Musk', field: 'wealth' }).then(value => {
                    expect(value).to.be.null;
                    done();
                });
            });
        });

        it('should return an array of fields for a given hmap key', function (done) {
            cli.hkeys({ key: 'test--Elon-Musk' }).then(keys => {
                expect(keys).to.deep.equal(['SpaceX', 'Tesla', 'sources', 'SolarCity', 'job']);
                done();
            });
        });

        it('should return all json for a given hmap key', function (done) {
            cli.hgetall({ key: 'test--Elon-Musk' }).then(hash => {
                expect(hash).to.deep.equal({
                    SpaceX: 'CEO',
                    Tesla: 'CTO',
                    SolarCity: 'Chairman',
                    sources: 'buzzfeed,new york times',
                    job: 'chief designer'
                });
                done();
            });
        });

        it('should check if a hmap field exists', function (done) {
            cli.hexists({ key: 'test--Elon-Musk', field: 'job' }).then(result => {
                expect(result).to.be.equal(1);
                done();
            });
        });

        it('should check if a hmap field exists if set to empty string', function (done) {
            cli.hset({ key: 'test--Elon-Musk', field: 'job', value: '' }).then(() => {
                cli.hexists({ key: 'test--Elon-Musk', field: 'job' }).then(result => {
                    expect(result).to.be.equal(1);
                    done();
                });
            });
        });

        it('should check if a hmap field exists', function (done) {
            cli.hexists({ key: 'test--Elon-Musk', field: 'job' }).then(result => {
                expect(result).to.be.equal(1);
                done();
            });
        });

        it('should check if a hmap field does not exist', function (done) {
            cli.hdel({ key: 'test--Elon-Musk', field: 'job' }).then(() => {
                cli.hexists({ key: 'test--Elon-Musk', field: 'job' }).then(result => {
                    expect(result).to.be.equal(0);
                    done();
                });
            });
        });

        it('should convert an array to a string of values separated by commas with HSET', function (done) {
            cli.hset({ key: 'test--Elon-Musk', field: 'job', value: ['CEO', 'CTO', 'Entrepreneur'] }).then(() => {
                cli.hget({ key: 'test--Elon-Musk', field: 'job' }).then(value => {
                    expect(value).and.to.equal('CEO,CTO,Entrepreneur');
                    done();
                });
            });
        });

        it('should delete the first key', function (done) {
            cli.del({ key: 'test--Elon-Musk' }).then(() => {
                cli.hgetall({ key: 'test--Elon-Musk' }).then(hash => {
                    expect(hash).to.be.null;
                    done();
                });
            });
        });

        it('should delete the second key', function (done) {
            cli.del({ key: 'test--Peter-Thiel' }).then(() => {
                cli.hgetall({ key: 'test--Peter-Thiel' }).then(hash => {
                    expect(hash).to.be.null;
                    done();
                });
            });
        });
    });

    describe('Zset key-score-member storing', function () {
        it('should create and count three score-members', function (done) {
            cli
                .zadd({
                    key: 'test--VR-Manufacturers',
                    scomembers: [1459857600, 'HTC-Vive']
                })
                .then(() => {
                    cli.zadd({
                        key: 'test--VR-Manufacturers',
                        scomembers: [1459166400, 'Oculus', 1476360000, 'PlayStation']
                    });
                })
                .then(() => {
                    cli.zcount({ key: 'test--VR-Manufacturers' }).then(count => {
                        expect(count).to.equal(3);
                        done();
                    });
                });
        });

        it('should count two score-members with a minimum', function (done) {
            cli.zcount({ key: 'test--VR-Manufacturers', min: 1459468800 }).then(count => {
                expect(count).to.equal(2);
                done();
            });
        });

        it('should count two score-members with a maximum', function (done) {
            cli.zcount({ key: 'test--VR-Manufacturers', max: 1475323200 }).then(count => {
                expect(count).to.equal(2);
                done();
            });
        });

        it('should fetch three score-members with scores order by ASC', function (done) {
            cli.zrangebyscore({ key: 'test--VR-Manufacturers' }).then(scomembers => {
                expect(scomembers).to.deep.equal(['Oculus', '1459166400', 'HTC-Vive', '1459857600', 'PlayStation', '1476360000']);
                done();
            });
        });

        it('should fetch three score-members without scores with minimum order by ASC', function (done) {
            cli.zrangebyscore({ key: 'test--VR-Manufacturers', min: 1459468800, withscores: false }).then(members => {
                expect(members).to.deep.equal(['HTC-Vive', 'PlayStation']);
                done();
            });
        });

        it('should fetch three score-members without scores with maximum order by ASC', function (done) {
            cli.zrangebyscore({ key: 'test--VR-Manufacturers', max: 1475323200, withscores: 0 }).then(members => {
                expect(members).to.deep.equal(['Oculus', 'HTC-Vive']);
                done();
            });
        });

        it('should fetch three score-members with scores order by DESC', function (done) {
            cli.zrevrangebyscore({ key: 'test--VR-Manufacturers' }).then(scomembers => {
                expect(scomembers).to.deep.equal(['PlayStation', '1476360000', 'HTC-Vive', '1459857600', 'Oculus', '1459166400']);
                done();
            });
        });

        it('should fetch three score-members with scores with minimum order by DESC', function (done) {
            cli.zrevrangebyscore({ key: 'test--VR-Manufacturers', min: 1459468800 }).then(scomembers => {
                expect(scomembers).to.deep.equal(['PlayStation', '1476360000', 'HTC-Vive', '1459857600']);
                done();
            });
        });

        it('should delete one score-members', function (done) {
            cli.zrem({ key: 'test--VR-Manufacturers', member: 'Oculus' });
            cli.zrevrangebyscore({ key: 'test--VR-Manufacturers', withscores: 0 }).then(members => {
                expect(members).to.deep.equal(['PlayStation', 'HTC-Vive']);
                done();
            });
        });

        it('should delete two score-members', function (done) {
            const promise1 = cli.zadd({
                key: 'test--VR-Manufacturers',
                scomembers: [3000000000000, 'Haribo-VR', 3000000000001, 'Decathlon-VR', 3000000000002, 'Volvic-VR']
            });
            const promise2 = cli.zrem({ key: 'test--VR-Manufacturers', members: ['PlayStation', 'HTC-Vive', 'Volvic-VR'] });
            Promise.all([promise1, promise2]).then(() => {
                cli.zrangebyscore({ key: 'test--VR-Manufacturers', withscores: 0 }).then(members => {
                    expect(members).to.deep.equal(['Haribo-VR', 'Decathlon-VR']);
                    done();
                });
            });
        });

        it('should get no score for non-existing member', function (done) {
            cli.zscore({ key: 'test--VR-Manufacturers', member: 'non-existing-member' }).then(score => {
                expect(score).to.equal(null);
                done();
            });
        });

        it("should get Decathlon-VR's score", function (done) {
            cli.zscore({ key: 'test--VR-Manufacturers', member: 'Decathlon-VR' }).then(score => {
                expect(score).to.equal('3000000000001');
                done();
            });
        });

        it('should delete all score-members', function (done) {
            cli.del({ key: 'test--VR-Manufacturers' }).then(() => {
                cli.zrangebyscore({ key: 'test--VR-Manufacturers' }).then(scomembers => {
                    expect(scomembers).to.be.empty;
                    done();
                });
            });
        });
    });

    describe('Linked Lists members storing', function () {
        const myListKey = 'test--presidents';

        it('should find no data in the linked list', function (done) {
            cli
                .llen({
                    key: myListKey
                })
                .then(count => {
                    expect(count).to.equal(0);
                    done();
                });
        });

        it('should lpush 1 member', function (done) {
            cli
                .lpush({
                    key: myListKey,
                    members: ['Thomas Jefferson']
                })
                .then(count => {
                    expect(count).to.equal(1);
                    cli
                        .lrange({
                            key: myListKey
                        })
                        .then(members => {
                            expect(members[0]).to.equal('Thomas Jefferson');
                            expect(members.length).to.equal(1);
                            done();
                        });
                });
        });

        it('should lpush 2 members and check order', function (done) {
            cli
                .lpush({
                    key: myListKey,
                    members: ['John Adams', 'George Washington'] // place it "on the left" of the list, one item at a time, from index 0
                })
                .then(count => {
                    expect(count).to.equal(3);
                    cli
                        .lrange({
                            key: myListKey
                        })
                        .then(members => {
                            expect(members[0]).to.equal('George Washington');
                            expect(members[1]).to.equal('John Adams');
                            expect(members[2]).to.equal('Thomas Jefferson');
                            expect(members.length).to.equal(3);
                            done();
                        });
                });
        });

        it('should rpush 3 members and check order', function (done) {
            cli
                .rpush({
                    key: myListKey,
                    members: ['James Madison', 'James Monroe', 'John Quincy Adams'] // place it "on the right" of the list, one item at a time, from index 0
                })
                .then(count => {
                    expect(count).to.equal(6);
                    cli
                        .lrange({
                            key: myListKey
                        })
                        .then(members => {
                            expect(members[0]).to.equal('George Washington');
                            expect(members[1]).to.equal('John Adams');
                            expect(members[2]).to.equal('Thomas Jefferson');
                            expect(members[3]).to.equal('James Madison');
                            expect(members[4]).to.equal('James Monroe');
                            expect(members[5]).to.equal('John Quincy Adams');
                            expect(members.length).to.equal(6);
                            done();
                        });
                });
        });

        it('should lrem 1 member and check order', function (done) {
            cli
                .lrem({
                    key: myListKey,
                    count: 0, // removes all members matching 'James Monroe'
                    member: 'James Monroe'
                })
                .then(deletedCount => {
                    expect(deletedCount).to.equal(1);
                    cli
                        .lrange({
                            key: myListKey
                        })
                        .then(members => {
                            expect(members[0]).to.equal('George Washington');
                            expect(members[1]).to.equal('John Adams');
                            expect(members[2]).to.equal('Thomas Jefferson');
                            expect(members[3]).to.equal('James Madison');
                            expect(members[4]).to.equal('John Quincy Adams');
                            expect(members.length).to.equal(5);
                            done();
                        });
                });
        });

        it('should check index (1)', function (done) {
            cli
                .lindex({
                    key: myListKey,
                    index: 1 // 2nd element of list
                })
                .then(member => {
                    expect(member).to.equal('John Adams');
                    done();
                });
        });

        it('should check index (2)', function (done) {
            cli
                .lindex({
                    key: myListKey,
                    index: -1 // last element of list
                })
                .then(member => {
                    expect(member).to.equal('John Quincy Adams');
                    done();
                });
        });

        it('should lpop', function (done) {
            cli
                .lpop({
                    key: myListKey
                })
                .then(member => {
                    expect(member).to.equal('George Washington');
                    cli
                        .lrange({
                            key: myListKey
                        })
                        .then(members => {
                            expect(members[0]).to.equal('John Adams');
                            expect(members[1]).to.equal('Thomas Jefferson');
                            expect(members[2]).to.equal('James Madison');
                            expect(members[3]).to.equal('John Quincy Adams');
                            expect(members.length).to.equal(4);
                            done();
                        });
                });
        });

        it('should rpop', function (done) {
            cli
                .rpop({
                    key: myListKey
                })
                .then(member => {
                    expect(member).to.equal('John Quincy Adams');
                    cli
                        .lrange({
                            key: myListKey
                        })
                        .then(members => {
                            expect(members[0]).to.equal('John Adams');
                            expect(members[1]).to.equal('Thomas Jefferson');
                            expect(members[2]).to.equal('James Madison');
                            expect(members.length).to.equal(3);
                            done();
                        });
                });
        });

        it('should rpoplpush the key and find no data in the linked list (1)', function (done) {
            cli
                .rpoplpush({
                    source: myListKey,
                    destination: myListKey
                })
                .then(member => {
                    expect(member).to.equal('James Madison');
                    cli
                        .lrange({
                            key: myListKey
                        })
                        .then(members => {
                            expect(members[0]).to.equal('James Madison');
                            expect(members[1]).to.equal('John Adams');
                            expect(members[2]).to.equal('Thomas Jefferson');
                            expect(members.length).to.equal(3);
                            done();
                        });
                });
        });

        it('should delete the key and find no data in the linked list', function (done) {
            cli
                .del({
                    key: myListKey
                })
                .then(() => {
                    cli
                        .llen({
                            key: myListKey
                        })
                        .then(count => {
                            expect(count).to.equal(0);
                            done();
                        });
                });
        });

        it('should rpop the empty linked list and return null', function (done) {
            cli
                .rpop({
                    key: myListKey
                })
                .then(member => {
                    expect(member).to.equal(null);
                    done();
                });
        });
    });

    describe('Sets members storing', function () {
        const mySetKey = 'test--bands';

        it('should find no data in the set', function (done) {
            cli
                .scard({
                    key: mySetKey
                })
                .then(count => {
                    expect(count).to.equal(0);
                    done();
                });
        });

        it('should sadd 1 member', function (done) {
            cli
                .sadd({
                    key: mySetKey,
                    members: ['DJ Pone']
                })
                .then(count => {
                    expect(count).to.equal(1);
                    cli
                        .smembers({
                            key: mySetKey
                        })
                        .then(members => {
                            expect(members[0]).to.equal('DJ Pone');
                            expect(members.length).to.equal(1);
                            done();
                        });
                });
        });

        it('should find the newsy added member', function (done) {
            cli
                .sismember({
                    key: mySetKey,
                    member: 'DJ Pone'
                })
                .then(result => {
                    expect(result).to.be.ok;
                    done();
                });
        });

        it('should find no non-added member', function (done) {
            cli
                .sismember({
                    key: mySetKey,
                    member: 'Deluxe'
                })
                .then(result => {
                    expect(result).to.be.not.ok;
                    done();
                });
        });

        it('should sadd 2 members', function (done) {
            cli
                .sadd({
                    key: mySetKey,
                    members: ['DJ Shadow', 'Deluxe']
                })
                .then(count => {
                    expect(count).to.equal(2);
                    cli
                        .smembers({
                            key: mySetKey
                        })
                        .then(members => {
                            expect(members).to.have.all.members(['DJ Pone', 'DJ Shadow', 'Deluxe']);
                            expect(members.length).to.equal(3);
                            done();
                        });
                });
        });

        it('should srem 1 member', function (done) {
            cli
                .srem({
                    key: mySetKey,
                    members: ['DJ Pone']
                })
                .then(deletedCount => {
                    expect(deletedCount).to.equal(1);
                    cli
                        .smembers({
                            key: mySetKey
                        })
                        .then(members => {
                            expect(members).to.have.members(['DJ Shadow', 'Deluxe']);
                            expect(members.length).to.equal(2);
                            done();
                        });
                });
        });

        it('should delete the key and find no data in the set', function (done) {
            cli
                .del({
                    key: mySetKey
                })
                .then(() => {
                    cli
                        .scard({
                            key: mySetKey
                        })
                        .then(count => {
                            expect(count).to.equal(0);
                            done();
                        });
                });
        });

        it('should smembers the empty set and return null', function (done) {
            cli
                .smembers({
                    key: mySetKey
                })
                .then(member => {
                    expect(member).to.deep.equal([]);
                    done();
                });
        });
    });
});
