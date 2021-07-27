'use strict';

var _index = require('../../dist/index.node');

var _config = require('./config.js');

const statusChangedCallback = status => {
  console.log('status', _index.FlagshipStatus[status]);
};

_index.Flagship.start(_config.ENV_ID, _config.API_KEY, {
  decisionMode: _index.DecisionMode.BUCKETING,
  statusChangedCallback,
  logLevel: _index.LogLevel.ERROR
});

const visitor = _index.Flagship.newVisitor('', { key: 'value' });

visitor.on('ready', err => {
  if (err) {
    console.log('Flagship error:', err);
    return;
  }
  console.log('Flagship Ready');
});

(async () => {
  if (visitor) {
    // clear context
    visitor.clearContext();

    // Update context
    visitor.updateContext({ isVip: true });

    await visitor.synchronizeModifications();

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
      type: _index.HitType.EVENT,
      category: _index.EventCategory.ACTION_TRACKING,
      action: 'click'
    });

    // hit type Item
    const item = new _index.Item({
      transactionId: 'transaction_1',
      productName: 'product_name',
      productSku: '00255578'
    });

    visitor.sendHit(item);

    // hit type Page
    visitor.sendHit({ type: _index.HitType.PAGE, documentLocation: 'https://localhost' });

    // hit type Screen
    visitor.sendHit({ type: _index.HitType.SCREEN, documentLocation: 'https://localhost' });

    // hit type Transaction
    const transaction = new _index.Transaction({ transactionId: 'transaction_1', affiliation: 'affiliation' });
    visitor.sendHit(transaction);
  }
})();