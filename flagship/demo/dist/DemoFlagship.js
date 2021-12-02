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

_jsSdk2.default.start(_config.ENV_ID, _config.API_KEY, {
  decisionMode: _jsSdk.DecisionMode.BUCKETING,
  statusChangedCallback,
  logLevel: _jsSdk.LogLevel.ERROR,
  fetchNow: false
});

const initialModifications = new Map([['array', {
  key: 'array',
  campaignId: 'c3ev1afkprbg5u3burag',
  variationGroupId: 'c3ev1afkprbg5u3burbg',
  variationId: 'c3ev1afkprbg5u3burcg',
  isReference: false,
  value: [1, 1, 1]
}]]);

const visitor = _jsSdk2.default.newVisitor({ visitorId: 'visitor_id', context: { key: 'value' }, initialModifications, initialCampaigns: _campaigns.campaigns.campaigns });

const start = async () => {
  if (visitor) {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    visitor.on('ready', async err => {
      if (err) {
        console.log('Flagship error:', err);
        return;
      }
      console.log('Flagship Ready');
    });

    // await sleep(5000)
    // clear context
    visitor.clearContext();

    // Update context
    visitor.updateContext({ isVip: true });

    // optional when fetchNow = true, this method is call on each newVisitor
    // await visitor.synchronizeModifications()
    visitor.setConsent(true);

    // getModification
    visitor.getModification({ key: 'object', defaultValue: {} }).then(modification => {
      console.log('modification:', modification);
    });

    visitor.getModifications([{ key: 'array', defaultValue: [] }, {
      key: 'object',
      defaultValue: {},
      activate: true
    }]).then(modifications => {
      console.log('modifications:', modifications);
    });

    // activateModification
    visitor.activateModification('object');

    visitor.activateModifications(['array', 'object']);

    // getModificationInfo
    visitor.getModificationInfo('array').then(data => {
      console.log('info', data);
    });

    // send hit

    // hit type Event
    visitor.sendHit({
      type: _jsSdk.HitType.EVENT,
      category: _jsSdk.EventCategory.ACTION_TRACKING,
      action: 'click'
    });

    // hit type Item
    const item = new _jsSdk.Item({
      transactionId: 'transaction_1',
      productName: 'product_name',
      productSku: '00255578'
    });

    visitor.sendHit(item);

    // hit type Page
    visitor.sendHit({ type: _jsSdk.HitType.PAGE, documentLocation: 'https://localhost' });

    // hit type Screen
    visitor.sendHit({ type: _jsSdk.HitType.SCREEN, documentLocation: 'https://localhost' });

    // hit type Transaction
    const transaction = new _jsSdk.Transaction({ transactionId: 'transaction_1', affiliation: 'affiliation' });
    visitor.sendHit(transaction);
  }
};
start();