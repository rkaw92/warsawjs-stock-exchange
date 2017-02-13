'use strict';

//TODO: Turn this into an actual unit test which verifies the operation of the offer table.

const Offer = require('../lib/classes/Offer');
const OfferTable = require('../lib/classes/OfferTable');

function dump(value) {
  return JSON.stringify(value, null, '  ');
}

// Test purchase offers:
const purchase1 = new Offer({ instrumentCode: 'ANGULAR3', type: 'purchase', price: '100.00', quantity: 5 });
const purchase2 = new Offer({ instrumentCode: 'ANGULAR3', type: 'purchase', price: '98.00', quantity: 200 });

// Test sale offers:
const sale1 = new Offer({ instrumentCode: 'ANGULAR3', type: 'sale', price: '120.00', quantity: 504 });
const sale2 = new Offer({ instrumentCode: 'ANGULAR3', type: 'sale', price: '100.00', quantity: 4 });
const sale3 = new Offer({ instrumentCode: 'ANGULAR3', type: 'sale', price: '90.00', quantity: 8 });

const table = new OfferTable({ instrumentCode: 'ANGULAR3' });

table.on('trade', function(trade) {
  console.log(dump(trade));
});

// The trade begins!
console.log('adding purchase1');
table.addOffer({ offer: purchase1 });
console.log('adding purchase2');
table.addOffer({ offer: purchase2 });
console.log('adding sale1');
table.addOffer({ offer: sale1 });
console.log('adding sale2');
table.addOffer({ offer: sale2 });
console.log('adding sale3');
table.addOffer({ offer: sale3 });
