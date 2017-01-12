'use strict';

const Big = require('big.js');

/**
 * The Offer class represents a single trade offer put forth on the market.
 * The price in the offer represents respectively the maximum or the minimum
 *  price that the buyer or seller is willing to accept, respectively.
 * @class
 */
class Offer {
  constructor({ instrumentCode, type, date = new Date(), price, quantity, remainingQuantity = quantity }) {
    if (!Offer.types.has(type)) {
      throw new Error('Invalid offer type.');
    }

    this.instrumentCode = instrumentCode.toUpperCase();
    this.type = type;
    this.date = new Date(date);
    this.price = new Big(price);
    this.quantity = new Big(quantity);
    this.remainingQuantity = new Big(remainingQuantity);
  }
}

Offer.types = new Set([ 'purchase', 'sale' ]);

module.exports = Offer;
