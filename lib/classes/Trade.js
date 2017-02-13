'use strict';

const Big = require('big.js');
const Offer = require('./Offer');

/**
 * A Trade is a ValueObject that describes a transaction that has taken place,
 *  or one that is going to take place in the future. It details the traded
 *  instruments, the quantity and the agreed-upon price of the trade.
 * @class
 */
class Trade {
  constructor({ purchase, sale, quantity, price }) {
    this.price = (new Big(price)).round(2, 1);
    this.quantity = (new Big(quantity)).round(0, 1);
    // Cast/copy the offers, since they are value objects, too:
    this.purchase = new Offer(purchase);
    this.sale = new Offer(sale);
  }
}

module.exports = Trade;
