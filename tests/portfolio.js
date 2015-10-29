'use strict'

const Matrix = require('sylvester').Matrix
const tap = require('tap')

const Stock = require('../lib/Stock')
const Portfolio = require('../lib/Portfolio')

var intel
var apple

var portfolio

tap.test('should add apple and intel to a new portfolio', function initTest(t) {
  portfolio = new Portfolio()

  intel = new Stock('intel')
  intel.push(10, 20)
  intel.push(20, 30)
  intel.push(30, 15)
  apple = new Stock('apple')
  apple.push(10, 20)
  apple.push(20, 30)

  portfolio.addStock(intel, 30)
  portfolio.addStock(apple, 20)

  t.similar({intel: intel, apple: apple}, portfolio.stocks)

  t.end()
})

tap.test('should calculate total value', function totalValueTest(t) {
  t.equal(portfolio.calculateTotalValue(), 50)

  t.end()
})

tap.test('should calculate weights', function weightsTest(t) {
  portfolio.calculateWeights()

  t.equal(intel.weight, 3 / 5)
  t.equal(apple.weight, 2 / 5)

  t.end()
})

tap.test('should calculate covariance', function covarianceTest(t) {
  t.equal(portfolio.calculateCovariance(intel, apple), 1250)

  t.end()
})

tap.test('should create a weight matrix', function weightMatrixTest(t) {
  const matrix = Matrix.create([3 / 5, 2 / 5])

  t.similar(portfolio.createWeightMatrix(), matrix)

  t.end()
})

tap.test('should create a covariance matrix', function covarianceMatrixTest(t) {
  const matrix = Matrix.create(
    [1, 1250]
  , [1250, 1]
  )

  t.similar(portfolio.createCovarianceMatrix(), matrix)

  t.end()
})

tap.test('should calculate risk', function riskTest(t) {
  t.equal(portfolio.calculateRisk(), 600.52)

  t.end()
})
