'use strict';

// Load the Sylvester matrix object for calculations.
var Matrix = require('sylvester').Matrix;

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
    this.ticker = ticker;

    /**
     * Array of tick returns.
     *
     * @property returns
     * @type Array
     */
    this.returns = [];

    /**
     * Average of all tick returns.
     *
     * @property average
     * @type Float
     */
    this.average = 0;
}

// Stock Methods
Stock.prototype = {
    /**
     * Add a tick of data to the stock's history.  This new return is stored in
     * the `returns` property for the stock.  Default behaviour immediately
     * recalculates the overall average on returns.
     *
     * @param {Float} open - Tick opening price.
     * @param {Float} close - Tick closing price.
     * @param {Boolean} wait - Optional.  If true, do not calculate average.
     */
    push: function(open, close, wait) {
        this.returns.push((close - open) / open * 100);
        if (typeof wait !== 'boolean' || !wait) {
            this.calculateAverage();
        }
    },

    /**
     * Calculate average of all the returns.  This new average is stored in the
     * `average` property for the stock.
     *
     * @return {Float} Newly calculated average.
     */
    calculateAverage: function() {
        var sum = 0;
        for (var i = 0; i < this.returns.length; i++) {
            sum += this.returns[i];
        }

        this.average = sum / this.returns.length;
        return this.average;
    }
};

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
    this.stocks = {};

    /**
     * Total market value for the stock.
     *
     * @property value
     * @type Float
     */
    this.value = 0;

    /**
     * Risk for the entire portfolio.
     *
     * @property risk
     * @type Float
     */
    this.risk = 0;

    /**
     * Cache of portfolio securities.
     *
     * @property cache
     * @type String
     */
    this.cache = null;
}

// Portfolio Methods
Portfolio.prototype = {
    /**
     * Add a stock to the portfolio.  This stock is stored in the `stocks` property
     * for the portfolio.  Relative weights for the entire portfolio are automagially
     * recalculated.
     *
     * IMPORTANT: If stocks are reused in multiple portfolios, they MUST be cloned to
     * prevent discrepencies with how JavaScript passes objects by reference.
     *
     * @param {Stock} stock - Stock to add to portfolio.
     * @param {Float} value - Market value of the stock.  Currency must be consistent.
     * @param {Boolean} clone - Optional.  If true, clone the stock object.
     */
    addStock: function(stock, value, clone) {
        if (typeof clone === 'boolean' && clone) {
            var copy = new Stock(stock.ticker);
            copy.ticker = stock.ticker;
            copy.returns = stock.returns;
            copy.average = stock.average;

            this.stocks[stock.ticker] = copy;
        } else {
            this.stocks[stock.ticker] = stock;
        }

        this.stocks[stock.ticker].value = value;
        this.calculateWeights();
    },

    /**
     * Remove a stock from the portfolio.  The `stocks` property for the portfolio is
     * updated.  Additionally, weights for all stocks are recalculated.
     *
     * @param {Stock|String} stock - Stock to be removed.
     */
    removeStock: function(stock) {
        var ticker = typeof stock === 'string' ? stock : stock.ticker;
        delete this.stocks[ticker];
        this.calculateWeights();
    },

    /**
     * Update a stock with a new market value.  The value is not validated.  Stocks
     * are not deleted if the value is 0 or negative.  Weights for all stocks are
     * recalculated.
     *
     * @param {Stock|String} stock - Stock to be updated.
     * @param {Float} value - Updated market value.
     */
    updateStock: function(stock, value) {
        var ticker = typeof stock === 'string' ? stock : stock.ticker;
        this.stocks[ticker].value = value;
        this.calculateWeights();
    },

    /**
     * Get the tickers for all stocks in the portfolio.
     *
     * @return {Array} List of tickers of stocks in the portfolio.
     */
    getStockTickers: function() {
        return Object.keys(this.stocks);
    },

    /**
     * Checks if the stock is currently in the portfolio.
     *
     * @param {Stock|String} stock - Stock to be checked.
     * @return {Boolean} Whether stock is in the portfolio or not.
     */
    hasStock: function(stock) {
        var ticker = typeof stock === 'string' ? stock : stock.ticker;
        return this.stocks.hasOwnProperty(ticker);
    },

    /**
     * Calculates the total market value of the portfolio.
     *
     * @return {Float} Total market value.
     */
    calculateTotalValue: function() {
        var tickers = Object.keys(this.stocks);

        var value = 0;
        for (var i = 0; i < tickers.length; i++) {
            value += this.stocks[tickers[i]].value;
        }

        this.value = value;
        return this.value;
    },

    /**
     * Calculate weights of all securities in the portfolio.
     */
    calculateWeights: function() {
        var tickers = Object.keys(this.stocks);

        this.calculateTotalValue();

        for (var i = 0; i < tickers.length; i++) {
            var stock = this.stocks[tickers[i]];
            stock.weight = stock.value / this.value;
        }
    },

    /**
     * Calculate covariance between two stocks.
     *
     * @param {Stock} stockA - First stock to compare.
     * @param {Stock} stockB - Second stock to compare.
     * @return {Float} Covariance between the two stocks.
     */
    calculateCovariance: function(stockA, stockB) {
        // Covariance of a variable against itself always equals 1
        if (stockA === stockB) { return 1; }

        var n = Math.min(stockA.returns.length, stockB.returns.length);
        var diffSum = 0;
        for (var i = 0; i < n; i++) {
            diffSum += (stockA.returns[i] - stockA.average) * (stockB.returns[i] - stockB.average);
        }

        return diffSum / (n - 1);
    },

    /**
     * Creates matrix of security weights.  We don't use a Sylvester Vector object
     * because it does not have a transpose method.
     *
     * @return {Matrix} Matrix of security weights.
     */
    createWeightMatrix: function() {
        var weights = [];
        var tickers = Object.keys(this.stocks);

        for (var i = 0; i < tickers.length; i++) {
            var weight = this.stocks[tickers[i]].weight;
            weights.push(weight);
        }

        return Matrix.create(weights);
    },

    /**
     * Create the covariance matrix of all securities.
     *
     * @return {Matrix} Covariance matrix of all securities.
     */
    createCovarianceMatrix: function() {
        var covariances = [];
        var tickers = Object.keys(this.stocks);

        for (var i = 0; i < tickers.length; i++) {
            var row = [];
            var stockA = this.stocks[tickers[i]];

            for (var j = 0; j < tickers.length; j++) {
                var stockB = this.stocks[tickers[j]];
                row.push(this.calculateCovariance(stockA, stockB));
            }

            covariances.push(row);
        }
        
        return Matrix.create(covariances);
    },

    /**
     * Calculate risk for the entire portfolio.  We first check against the
     * cache to ensure we're not doing unnecessary work (e.g. Stock weights
     * remain unchanged).  Cache and risk are then updated.
     *
     * @return {Float} Risk of the entire portfolio.
     */
    calculateRisk: function() {
        // Make sure the portfolio isn't empty.
        if (this.value > 0) {

            // Check latest cache.
            var current = JSON.stringify(this.stocks);
            if (this.cache !== current) {
                var weightMatrix = this.createWeightMatrix();
                var covarianceMatrix = this.createCovarianceMatrix();

                // Multiply weight and covariance matrices.
                var intermediate = covarianceMatrix.multiply(weightMatrix);

                // Update cache.
                this.cache = current;

                // Tranpose the weight matrix, multiply against the intermediate,
                // and get the cell value containing the risk.
                this.risk = weightMatrix.transpose().multiply(intermediate).e(1,1);
            }

            return this.risk;
        }

        return 0;
    }
};

// Export Stock and Portfolio classes.
module.exports = {
    Stock: Stock,
    Portfolio: Portfolio
};
