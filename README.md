sweetwork-redis-client - a home brewed redis wrapper
===========================

# Usage

```js
const SweetworkRedisClient = require('sweetwork-redis-client');
const redis = new SweetworkRedisClient(/* optional db_index */); // default db_index = 9


redis.zcount(myRedisKey).then(count => {
    // do stuff...
}, error => {
    // oops!
});

// or

try {
  const count = await redis.zcount(myRedisKey);
} catch (e) {
  // oops!
}

```

# Test

```

npm test

```

# Todo

* Move const variables in a `config.js` file
