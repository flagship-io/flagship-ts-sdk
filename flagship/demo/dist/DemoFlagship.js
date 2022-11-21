'use strict';

var _ = require('../..');

var _2 = _interopRequireDefault(_);

var _config = require('./config.js');

var _campaigns = require('./campaigns');

var _ioredis = require('ioredis');

var _ioredis2 = _interopRequireDefault(_ioredis);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

const redis = new _ioredis2.default({
  host: '127.0.0.1',
  port: '6379'
});

const sleep = ms => {
  return new Promise(resolve => setTimeout(resolve, ms));
};

const statusChangedCallback = status => {
  console.log('status', _.FlagshipStatus[status]);
};

const check = {};

const FS_HIT_PREFIX = 'FS_DEFAULT_HIT_CACHE_TS';
const hitCacheImplementation = {

  async cacheHit(hits) {
    await redis.set(FS_HIT_PREFIX, JSON.stringify(hits));
  },
  async lookupHits() {
    const data = await redis.get(FS_HIT_PREFIX);
    return data ? JSON.parse(data) : data;
  }
};

_2.default.start(_config.ENV_ID, _config.API_KEY, {
  // decisionMode: DecisionMode.BUCKETING,
  hitCacheImplementation,
  statusChangedCallback,
  logLevel: _.LogLevel.ALL,
  fetchNow: false,
  timeout: 10,
  trackingMangerConfig: {
    batchIntervals: 30,
    batchLength: 10,
    batchStrategy: _.BatchStrategy.PERIODIC_CACHING
  }
});

const start = async (visitor, index) => {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  visitor.on('ready', async err => {
    if (err) {
      console.log('Flagship error:', err);
      return;
    }
    console.log('Flagship Ready');

    // getFlag
    const flag = visitor.getFlag('js-qa-app', 'test');

    const value = flag.getValue();

    console.log('flag.value', value);

    // send hit

    // hit type Event
    await visitor.sendHit({
      type: _.HitType.EVENT,
      category: _.EventCategory.ACTION_TRACKING,
      action: 'KPI2',
      value: 10
    });

    console.log('hit type Event');

    // hit type Page
    await visitor.sendHit({ type: _.HitType.PAGE, documentLocation: 'https://www.sdk.com/abtastylab/js/151021-' + index });
    console.log('hit type Page');

    // hit type Screen
    await visitor.sendHit({ type: _.HitType.SCREEN, documentLocation: 'abtastylab-js-' + index });

    // hit type Transaction
    const transaction = new _.Transaction({ transactionId: visitor.visitorId, affiliation: 'KPI1' });
    await visitor.sendHit(transaction);

    console.log('hit type transaction');

    console.log('check', check);
  });

  await visitor.fetchFlags();
};

async function script() {
  await sleep(2000);
  for (let index = 0; index < 10; index++) {
    const visitor = _2.default.newVisitor({ visitorId: 'visitor_a', context: { qa_report: true } });
    await start(visitor, index);
  }
}

script();