// Load the Sylvester matrix object for calculations.
'use strict'

const Matrix = require('sylvester').Matrix

// Load Stock Class
const Stock = require('./Stock')

/**
 * Portfolio Object - Keeps data on a portfolio and has methods to calculate
 * attributes of the portfolio.
 *
 * @class Portfolio
 * @constructor
 */
function Portfolio() {
  /**
   * Stocks included in the portfolio.
   *
   * @property stocks
   * @type Object
   */
  this.stocks = {}

  /**
   * Total market value for the stock.
   *
   * @property value
   * @type Float
   */
  this.value = 0

  /**
   * Risk for the entire portfolio.
   *
   * @property risk
   * @type Float
   */
  this.risk = 0

  /**
   * Cache of portfolio securities.
   *
   * @property cache
   * @type String
   */
  this.cache = null
}

// Portfolio Methods

/**
 * Add a stock to the portfolio. This stock is stored in the `stocks` property
 * for the portfolio. Relative weights for the entire portfolio are
 * automagially recalculated.
 *
 * IMPORTANT: If stocks are reused in multiple portfolios, they MUST be cloned
 * to prevent discrepencies with how JavaScript passes objects by reference.
 *
 * @param {Stock} stock - Stock to add to portfolio.
 * @param {Float} value - Market value of stock. Currency must be consistent.
 * @param {Boolean} clone - Optional. If true, clone the stock object.
 */
Portfolio.prototype.addStock = function addStock(stock, value, clone) {
  if (typeof clone === 'boolean' && clone) {
    const copy = new Stock(stock.ticker)
    copy.ticker = stock.ticker
    copy.returns = stock.returns
    copy.average = stock.average

    this.stocks[stock.ticker] = copy
  } else {
    this.stocks[stock.ticker] = stock
  }

  this.stocks[stock.ticker].value = value
  this.calculateWeights()
}

/**
 * Remove a stock from the portfolio. The `stocks` property for the portfolio is
 * updated. Additionally, weights for all stocks are recalculated.
 *
 * @param {Stock|String} stock - Stock to be removed.
 */
Portfolio.prototype.removeStock = function removeStock(stock) {
  const ticker = typeof stock === 'string' ? stock : stock.ticker
  delete this.stocks[ticker]
  this.calculateWeights()
}

/**
 * Update a stock with a new market value. The value is not validated. Stocks
 * are not deleted if the value is 0 or negative. Weights for all stocks are
 * recalculated.
 *
 * @param {Stock|String} stock - Stock to be updated.
 * @param {Float} value - Updated market value.
 */
Portfolio.prototype.updateStock = function updateStock(stock, value) {
  const ticker = typeof stock === 'string' ? stock : stock.ticker
  this.stocks[ticker].value = value
  this.calculateWeights()
}

/**
 * Get the tickers for all stocks in the portfolio.
 *
 * @return {Array} List of tickers of stocks in the portfolio.
 */
Portfolio.prototype.getStockTickers = function getStockTickers() {
  return Object.keys(this.stocks)
}

/**
 * Checks if the stock is currently in the portfolio.
 *
 * @param {Stock|String} stock - Stock to be checked.
 * @return {Boolean} Whether stock is in the portfolio or not.
 */
Portfolio.prototype.hasStock = function hasStock(stock) {
  const ticker = typeof stock === 'string' ? stock : stock.ticker
  return this.stocks.hasOwnProperty(ticker)
}

/**
 * Calculates the total market value of the portfolio.
 *
 * @return {Float} Total market value.
 */
Portfolio.prototype.calculateTotalValue = function calculateTotalValue() {
  const tickers = Object.keys(this.stocks)

  var value = 0
  for (var i = 0; i < tickers.length; i++) {
    value += this.stocks[tickers[i]].value
  }

  this.value = value
  return this.value
}

/**
 * Calculate weights of all securities in the portfolio.
 */
Portfolio.prototype.calculateWeights = function calculateWeights() {
  const tickers = Object.keys(this.stocks)

  this.calculateTotalValue()

  for (var i = 0; i < tickers.length; i++) {
    const stock = this.stocks[tickers[i]]
    stock.weight = stock.value / this.value
  }
}

/**
 * Calculate covariance between two stocks.
 *
 * @param {Stock} stockA - First stock to compare.
 * @param {Stock} stockB - Second stock to compare.
 * @return {Float} Covariance between the two stocks.
 */
Portfolio.prototype.calculateCovariance = function calculateCovariance(
  stockA
, stockB
) {
  // Covariance of a variable against itself always equals 1
  if (stockA === stockB) { return 1 }

  const n = Math.min(stockA.returns.length, stockB.returns.length)
  var diffSum = 0
  for (var i = 0; i < n; i++) {
    const diffA = stockA.returns[i] - stockA.average
    const diffB = stockB.returns[i] - stockB.average
    diffSum += diffA * diffB
  }

  return diffSum / (n - 1)
}

/**
 * Creates matrix of security weights. We don't use a Sylvester Vector object
 * because it does not have a transpose method.
 *
 * @return {Matrix} Matrix of security weights.
 */
Portfolio.prototype.createWeightMatrix = function createWeightMatrix() {
  const weights = []
  const tickers = Object.keys(this.stocks)

  for (var i = 0; i < tickers.length; i++) {
    const weight = this.stocks[tickers[i]].weight
    weights.push(weight)
  }

  return Matrix.create(weights)
}

/**
 * Create the covariance matrix of all securities.
 *
 * @return {Matrix} Covariance matrix of all securities.
 */
Portfolio.prototype.createCovarianceMatrix = function createCovarianceMatrix() {
  const covariances = []
  const tickers = Object.keys(this.stocks)

  for (var i = 0; i < tickers.length; i++) {
    const row = []
    const stockA = this.stocks[tickers[i]]

    for (var j = 0; j < tickers.length; j++) {
      const stockB = this.stocks[tickers[j]]
      row.push(this.calculateCovariance(stockA, stockB))
    }

    covariances.push(row)
  }
  
  return Matrix.create(covariances)
}

/**
 * Calculate risk for the entire portfolio. We first check against the
 * cache to ensure we're not doing unnecessary work (e.g. Stock weights
 * remain unchanged). Cache and risk are then updated.
 *
 * @return {Float} Risk of the entire portfolio.
 */
Portfolio.prototype.calculateRisk = function calculateRisk() {
  // Make sure the portfolio isn't empty.
  if (this.value <= 0) {
    return 0
  }

  // Check latest cache.
  const current = JSON.stringify(this.stocks)
  if (this.cache !== current) {
    const weightMatrix = this.createWeightMatrix()
    const covarianceMatrix = this.createCovarianceMatrix()

    // Multiply weight and covariance matrices.
    const intermediate = covarianceMatrix.multiply(weightMatrix)

    // Update cache.
    this.cache = current

    // Tranpose the weight matrix, multiply against the intermediate,
    // and get the cell value containing the risk.
    this.risk = weightMatrix.transpose().multiply(intermediate).e(1,1)
  }

  return this.risk
}

module.exports = Portfolio
