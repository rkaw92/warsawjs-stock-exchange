'use strict';

const Big =  require('big.js');

/**
 * Return the lesser of two big.js numbers. If both are equal to the same value,
 *  return that value.
 * @param {external:Big} a
 * @param {external:Big} b
 * @returns {external:Big}
 */
module.exports.min = function min(a, b) {
  if (a.lt(b)) {
    return a;
  } else {
    return b;
  }
};

/**
 * Return the greater of two big.js numbers. If both are equal to the same
 * value, return that value.
 * @param {external:Big} a
 * @param {external:Big} b
 * @returns {external:Big}
 */
module.exports.max = function max(a, b) {
  if (a.gt(b)) {
    return a;
  } else {
    return b;
  }
};
