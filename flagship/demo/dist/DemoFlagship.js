'use strict';

var _flagship = require('flagship');

var _config = require('./config.js');

const sleep = ms => {
  return new Promise(resolve => setTimeout(resolve, ms));
};

const statusChangedCallback = status => {
  console.log('status', _flagship.FlagshipStatus[status]);
};

_flagship.Flagship.start(_config.ENV_ID, _config.API_KEY, {
  decisionMode: _flagship.DecisionMode.BUCKETING,
  statusChangedCallback,
  logLevel: _flagship.LogLevel.ERROR,
  fetchNow: false
});

const visitor = _flagship.Flagship.newVisitor('visitor_id', { key: 'value' });

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

    await sleep(5000);
    // clear context
    visitor.clearContext();

    // Update context
    visitor.updateContext({ isVip: true });

    // optional when fetchNow = true, this method is call on each newVisitor
    await visitor.synchronizeModifications();
    visitor.setConsent(true);

    // getModification
    visitor.getModification({ key: 'object', defaultValue: {} }).then(modification => {
      console.log('modification:', modification);
    });

    visitor.getModification([{ key: 'array', defaultValue: [] }, {
      key: 'object',
      defaultValue: {},
      activate: true
    }]).then(modifications => {
      console.log('modifications:', modifications);
    });

    // activateModification
    visitor.activateModification('object');

    visitor.activateModification(['array', 'object']);

    // getModificationInfo
    visitor.getModificationInfo('array').then(data => {
      console.log('info', data);
    });

    // send hit

    // hit type Event
    visitor.sendHit({
      type: _flagship.HitType.EVENT,
      category: _flagship.EventCategory.ACTION_TRACKING,
      action: 'click'
    });

    // hit type Item
    const item = new _flagship.Item({
      transactionId: 'transaction_1',
      productName: 'product_name',
      productSku: '00255578'
    });

    visitor.sendHit(item);

    // hit type Page
    visitor.sendHit({ type: _flagship.HitType.PAGE, documentLocation: 'https://localhost' });

    // hit type Screen
    visitor.sendHit({ type: _flagship.HitType.SCREEN, documentLocation: 'https://localhost' });

    // hit type Transaction
    const transaction = new _flagship.Transaction({ transactionId: 'transaction_1', affiliation: 'affiliation' });
    visitor.sendHit(transaction);
  }
};
start();