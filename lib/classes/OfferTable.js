'use strict';

const EventEmitter = require('events');
const Big = require('big.js');
const Offer = require('./Offer');
const Trade = require('./Trade');
const { min, max } = require('../utils/math');

/**
 * The Offer Table tracks sale and purchase offers for a given tracked instrument,
 *  reconciles them whenever a price match occurs, and emits events informing
 *  of this occurrence. It effectively computes and carries out trades of
 *  the modelled financial instruments.
 * @class
 */
class OfferTable extends EventEmitter {
  /**
   * Create a new OfferTable for a given instrument. Normally, only a single
   *  offer table should exist within one stock exchange for a given instrument
   *  at a time. Enforcing this, however, is outside the scope of this class.
   * @param {Object} options
   * @param {string} options.instrumentCode - The code designation of the instrument tracked by this offer table.
   */
  constructor({ instrumentCode }) {
    super();

    /**
     * The code designation of the instrument tracked by this offer table.
     * @type {string}
     */
    this._instrumentCode = instrumentCode;
    /**
     * A list of sale offers for this instrument. Always sorted from cheapest
     *  to the most expensive (since the cheapest offers must always be
     *  the first to trade). Between same-priced offers, the first one to arrive
     *  is the one to be traded first (FIFO).
     * @type {Offer[]}
     */
    this._saleOffers = [];
    /**
     * A list of purchase offers. Always sorted from the most expensive to the
     *  cheapest. Out of several offers at the same price, the first ones to
     *  have been placed are the ones to be traded first (FIFO).
     * @type {Offer[]}
     */
    this._purchaseOffers = [];
  }

  /**
   * Add an offer to the offer table. If an opposing offer with a price equal to
   *  or beyond the price point set in this offer already exists, a trade is
   *  carried out at the price in the pre-existing offer.
   * @type {Offer} offer - The offer to add to the table.
   */
  addOffer({ offer }) {
    // First, we unconditionally add the offer to the appropriate list:
    if (offer.type === 'purchase') {
      this._addPurchaseOffer(offer);
    } else {
      this._addSaleOffer(offer);
    }
    // Whatever the offer type was, we try to match it with opposing offers:
    const applicableTrades = this._findTrades(offer);
    // We immediately apply all computed trades:
    applicableTrades.forEach(function(trade) {
      this._performTrade(trade);
    }, this);
  }

  _addPurchaseOffer(offer) {
    // Find the index at which we should insert the offer - that is, before the first index that contains an offer that should be traded after us:
    let insertionIndex = this._purchaseOffers.findIndex(function(existingOffer) {
      // cut out:  || (existingOffer.amount.eq(offer.amount) && existingOffer.time > offer.time)
      return (existingOffer.price.lt(offer.price));
    });

    if (insertionIndex === -1) {
      // No offers are cheaper than ours - ours is the worst offer.
      this._purchaseOffers.push(offer);
    } else {
      // Insert before the strictly-worse offer, but after equal offers that have been added before ours.
      this._purchaseOffers.splice(insertionIndex, 0, offer);
    }
  }

  _addSaleOffer(offer) {
    // Find the index at which we should insert the offer - that is, before the first index that contains an offer that should be traded after us:
    let insertionIndex = this._saleOffers.findIndex(function(existingOffer) {
      return (existingOffer.price.gt(offer.price));
    });

    if (insertionIndex === -1) {
      // We are the most expensive sale offer - the last anyone would ever take!
      this._saleOffers.push(offer);
    } else {
      this._saleOffers.splice(insertionIndex, 0, offer);
    }
  }

  /**
   * Find offers with matching prices.
   * @returns {Trade[]} An array of trades that should take place.
   */
  _findTrades(offer) {
    let remainingQuantity = offer.remainingQuantity;
    let trades = [];
    if (offer.type === 'purchase') {
      for (let i = 0; i < this._saleOffers.length && this._saleOffers[i].price.lte(offer.price) && remainingQuantity.gt(0); i += 1) {
        // We've got a trade:
        let quantityToTrade = min(remainingQuantity, this._saleOffers[i].remainingQuantity);
        // Since we're reconciling with a pre-existing offer, we need to accept that offer's set price:
        trades.push(new Trade({ purchase: offer, sale: this._saleOffers[i], quantity: quantityToTrade, price: this._saleOffers[i].price }));
        // The trade we've just found decreases the remaining quantity that we seek:
        remainingQuantity = remainingQuantity.minus(quantityToTrade);
      }
    } else {
      for (let i = 0; i < this._purchaseOffers.length && this._purchaseOffers[i].price.gte(offer.price) && remainingQuantity.gt(0); i += 1) {
        let quantityToTrade = min(remainingQuantity, this._purchaseOffers[i].remainingQuantity);
        trades.push(new Trade({ purchase: this._purchaseOffers[i], sale: offer, quantity: quantityToTrade, price: this._purchaseOffers[i].price }));
        remainingQuantity = remainingQuantity.minus(quantityToTrade);
      }
    }

    return trades;
  }

  /**
   * Perform a trade in an instrument between two parties.
   * The trade is finalized at the price provided in the input, and with the
   *  traded quantity taken from the input, too.
   * Note that this needs to be called immediately after _findTrades, since
   *  it relies on the order of trades to work.
   * @param {Trade} trade - The trade to take place.
   */
  _performTrade(trade) {
    // To perform a trade, we need to modify both sides of the deal.
    const { purchase, sale, quantity, price } = trade;
    // Start with the purchase - compute the new quantity:
    const newPurchase = new Offer(Object.assign({}, purchase, {
      remainingQuantity: purchase.remainingQuantity.minus(quantity)
    }));
    // If zero, remove the purchase from the offer list:
    if (newPurchase.remainingQuantity.eq(0)) {
      // (We know we should remove the first element, because it must be
      //  the highest offer.)
      this._purchaseOffers.splice(0, 1);
    } else {
      this._purchaseOffers[0] = newPurchase;
    }
    // Now we have to deal with the sale offer in the same way:
    const newSale = new Offer(Object.assign({}, sale, {
      remainingQuantity: sale.remainingQuantity.minus(quantity)
    }));
    if (newSale.remainingQuantity.eq(0)) {
      this._saleOffers.splice(0, 1);
    } else {
      this._saleOffers[0] = newSale;
    }
    // This is it. Now we just have to notify listeners that a transaction
    //  took place!
    this.emit('trade', trade);
  }
}

module.exports = OfferTable;
