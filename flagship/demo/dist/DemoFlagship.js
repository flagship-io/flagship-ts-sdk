'use strict';

var _jsSdk = require('@flagship.io/js-sdk');

var _jsSdk2 = _interopRequireDefault(_jsSdk);

var _config = require('./config.js');

var _campaigns = require('./campaigns');

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

const sleep = ms => {
    return new Promise(resolve => setTimeout(resolve, ms));
};

const statusChangedCallback = status => {
    console.log('status', _jsSdk.FlagshipStatus[status]);
};

const check = {};

_jsSdk2.default.start(_config.ENV_ID, _config.API_KEY, {
    // decisionMode: DecisionMode.BUCKETING,
    statusChangedCallback,
    logLevel: _jsSdk.LogLevel.ERROR,
    fetchNow: false,
    timeout: 10
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

        const value = flag.getValue(false);

        if (check[value]) {
            check[value] += 1;
        } else {
            check[value] = 1;
        }

        console.log('flag.value', value);

        await flag.userExposed();

        console.log('flag.userExposed');
        // send hit

        // hit type Event
        await visitor.sendHit({
            type: _jsSdk.HitType.EVENT,
            category: _jsSdk.EventCategory.ACTION_TRACKING,
            action: 'KPI2',
            value: 10
        });

        console.log('hit type Event');

        await flag.userExposed();
        // hit type Page
        await visitor.sendHit({ type: _jsSdk.HitType.PAGE, documentLocation: 'https://www.sdk.com/abtastylab/js/151021-' + index });
        console.log('hit type Page');

        await flag.userExposed();
        // hit type Screen
        await visitor.sendHit({ type: _jsSdk.HitType.SCREEN, documentLocation: 'abtastylab-js-' + index });

        console.log('hit type Screen');

        await flag.userExposed();
        // hit type Transaction
        const transaction = new _jsSdk.Transaction({ transactionId: visitor.visitorId, affiliation: 'KPI1' });
        await visitor.sendHit(transaction);

        console.log('hit type transaction');

        console.log('check', check);
    });

    await visitor.fetchFlags();
};

async function script() {
    await sleep(2000);
    for (let index = 0; index <= 1; index++) {
        const visitor = _jsSdk2.default.newVisitor({ visitorId: 'visitor_a', context: { qa_report: true } });
        await start(visitor, index);
    }
}

script();