'use strict'

/**
 * Stock Object - Used to calculate returns and averages for individual stocks.
 *
 * @class Stock
 * @constructor
 * @param {String} ticker - Assigns the ticker symbol for the stock.
 */
function Stock(ticker) {
  /**
   * Stock's ticker symbol.
   *
   * @property ticker
   * @type String
   */
  this.ticker = ticker

  /**
   * Array of tick returns.
   *
   * @property returns
   * @type Array
   */
  this.returns = []

  /**
   * Average of all tick returns.
   *
   * @property average
   * @type Float
   */
  this.average = 0
}

// Stock Methods


/**
 * Add a tick of data to the stock's history.  This new return is stored in
 * the `returns` property for the stock.  Default behaviour immediately
 * recalculates the overall average on returns.
 *
 * @param {Float} open - Tick opening price.
 * @param {Float} close - Tick closing price.
 * @param {Boolean} wait - Optional.  If true, do not calculate average.
 */
Stock.prototype.push = function push(open, close, wait) {
  this.returns.push((close - open) / open * 100)

  if (typeof wait !== 'boolean' || !wait) {
    this.calculateAverage()
  }
}

/**
 * Calculate average of all the returns.  This new average is stored in the
 * `average` property for the stock.
 *
 * @return {Float} Newly calculated average.
 */
Stock.prototype.calculateAverage = function calculateAverage() {
  var sum = 0
  for (var i = 0; i < this.returns.length; i++) {
    sum += this.returns[i]
  }

  this.average = sum / this.returns.length
  return this.average
}

module.exports = Stock
