financier
=========

[![Build Status](https://api.travis-ci.org/suitupalex/financier.svg)](https://travis-ci.org/suitupalex/financier)
[![npm version](https://badge.fury.io/js/financier.svg)](https://badge.fury.io/js/financier)
[![Dependencies](https://david-dm.org/suitupalex/financier.svg)](https://david-dm.org/suitupalex/financier)

A Node.js module that helps with calculations concerning stocks and portfolios.

## Introduction

Financier is a simple, object-oriented way of managing a portfolio.
Please feel free to request any features.  Code contributions are always welcome!

## Installation

`$ npm install financier`

Financier uses the [Sylvester matrix math library](https://github.com/NaturalNode/node-sylvester)
for calculations.  NPM will automatically install Sylvester as a dependency.

```js
var financier = require('financier');
var Stock = financier.Stock;
var Portfolio = financier.Portfolio;
```

## Usage
Here is an example featuring comprehensive usage of Financier.

```js
// Load financier.
var financier = require('financier');
var Stock = financier.Stock;
var Portfolio = financier.Portfolio;

var stocks = {};
// A bit of pseudo-code to load return data from a CSV.
var stockData = CSV.load('nasdaq-historical-returns.csv');

// Initialize the stocks.
for (var stock in stockData) {
    stocks[stock] = new Stock(stock);
    for (var tick in stockData[stock]) {
        stocks[stock].push(tick.open, tick.close, true);
    }
    stocks[stock].calculateAverage();
}

// Gather the securities for the portfolio.
var securities = [
    {
        stock: stocks.AAPL,
        value: 10234.34
    },
    {
        stock: stocks.GOOG,
        value: 63464.53
    },
    {
        stock: stocks.MSFT,
        value: 4352.2
    },
    {
        stock: stocks.AIG,
        value: 630.99,
    },
    {
        stock: stocks.C,
        value: 902.11
    }
];

// Build the portfolio.
var clientPortfolio = new Portfolio();
for (var i = 0; i < securities.length; i++) {
    var security = securities[i];
    clientPortfolio.addStock(security.stock, security.value, true);
}

// Spit out the risk.
console.log(clientPortfolio.calculateRisk());
```

## API

### Stock(_String_ ticker)

Used to calculate returns and averages for individual stocks.  The parameter
`ticker` determines the stock symbol for the stock.

```js
var AAPL = new Stock('AAPL');
```
#### Properties

* __ticker__ - `String` The stock symbol.
* __returns__ - `Array` The array of tick returns for the stock.
* __average__ - `Float` The average of all the tick returns.
* __value__ - `Float` The market value of the stock. (Initialized when added to a
portfolio.)
* __weight__ - `Float` The weight of the stock in comparison to the total portfolio
market value.  (Initialized when added to a portfolio.)

#### Stock.push(_Float_ open, _Float_ close, _Boolean_ _[Opt]_ wait)
Add a tick of data to the stock history.  This new return is stored in
`Stock.returns`.  Default behaviour immediately recalculates the overall average on
returns.

The parameters `open` and `close` are `floats` representing the price of the stock.
If `wait` is `true`, the average is not calculated.

```js
// Push a return of 5.8 to the list of returns.  The overall average return will
// be automagically calculated.
AAPL.push(106.5, 112.3);
```

#### _Float_ Stock.calculateAverage()
Calculate the average of all the returns.  This new average is both returned and
stored in `Stock.average`.

It is only necessary to call this function if you are adding returns in bulk.

```js
function randomValue() {
    return 100 + Math.random() * 30;
}

// Simulate adding thousands of returns to a stock.
for (var i = 0; i < 10000; i++) {
    // Push the data, but hold off on calculating the average.
    AAPL.push(randomValue(), randomValue(), true);
}

// Now calculate the overall average.
AAPL.calculateAverage();
```

### Portfolio()

Keeps data on a portfolio, and has methods to calculate its attributes.

```js
var clientPortfolio = new Portfolio();
```

#### Properties

* __stocks__ - `Object` Stocks included in the portfolio.
* __value__ - `Float` Total market value for the stock.
* __risk__ - `Float` Risk for the entire portfolio.
* __cache__ - `Cache` Cache of portfolio securities.

#### Portfolio.addStock(_Stock_ stock, _Float_ value, _Boolean_ _[Opt]_ clone)
Add a stock to the portfolio.  This stock is stored in the `Portfolio.stocks`.
`Stock.weight` for all securities are automagically recalculated.

The parameter `stock` is the `Stock` object being added.  `value` represents the
market value for the security as a `float`.  Currency should be kept consistent.
If `clone` is `true`, a new `Stock` is created with identical `Stock.ticker`,
`Stock.return`, and `Stock.average` properties.

__IMPORTANT:__ If stocks are reused in multiple portfolios, or need to be kept
independent of the portfolio, they _MUST_ be cloned to prevent discrepencies with
how JavaScript passes objects by reference.

```js
// Add AAPL to multiple client portfolios:
clientPortfolio.addStock(AAPL, 100323.33, true);
otherClientPortfolio.addStock(AAPL, 1483.63, true);

var open = 135.3;
var close = 123.53;

// If new return history needs to be added, it must be done individually.
AAPL.push(open, close);
clientPortfolio.stocks.AAPL.push(open, close);
otherClientPortfolio.stocks.AAPL.push(open, close);
```

#### Portfolio.removeStock(_Stock|String_ stock)
Remove a stock from the portfolio.  `Portfolio.stocks` is updated.  Additionally,
`Stock.weight` for all stocks are recalculated.

```js
// Both of these are valid:
clientPortfolio.removeStock('AAPL');
clientPortfolio.removeStock(AAPL);
```

#### Portfolio.updateStock(_Stock|String_ stock, _Float_ value)
Update a stock with a new market value.  Weights for all the stocks are recalculated.
However, the new value is not validated.  Stocks are not deleted if the value is 0 or
negative.

#### _Array_ Portfolio.getStockTickers()
Get the tickers for all the stocks in the portfolio.

#### _Boolean_ Portfolio.hasStock(_Stock|String_ stock)
Checks if the stock is currently in the portfolio.

#### _Float_ Portfolio.calculateTotalValue()
Calculate the total market value of the portfolio.  `Portfolio.value` is updated, as
well as returned.  This function is called everytime `Portfolio.calculateWeights()`
is called.

#### Portfolio.calculateWeights()
Calculate and update `Stock.weight` for all securities in the portfolio.  This
function is called whenever securities in the portfolio are altered.

#### _Float_ Portfolio.calculateCovariance(_Stock_ stockA, _Stock_ stockB)
Calculate the covariance between two stocks.  If `stockA` and `stockB` are the same
instance of `Stock` the function returns 1 by definition.

While it is better to create a `Portfolio` to calculate covariance, this function can
be called to examine individual stocks.

```js
var GOOG = new Stock('GOOG');
var AAPL = new Stock('AAPL');

// Pretend that we have filled out the stocks with tick history...
GOOG.push(...);
AAPL.push(...);

// Find the covariance between Google and Apple.
var covariance = Portfolio.calculateCovariance(GOOG, AAPL);
```

#### _Sylvester.Matrix_ Portfolio.createWeightMatrix()
Create the matrix of security weights.  We do not use `Sylvestor.Vector` because it does
not have a transpose method.  `Portfolio.calculateRisk()` calls this function.

#### _Sylvester.Matrix_ Portfolio.createCovarianceMatrix()
Create the covariance matrix of all securities.  `Portfolio.caulcateCovariance()` is called
for every possible pair of securities.  `Portfolio.calculateRisk()` calls this function.

#### _Float_ Portfolio.calculateRisk()
Calculate risk for the entire portfolio.  We first check against `Portfolio.cache` to prevent any
unnecessary work (i.e. securities have not been altered since last time the risk was calculated).
`Portfolio.cache` and `Portfolio.risk` are then updated.
