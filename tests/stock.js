'use strict'

const tap = require('tap')

const Stock = require('../lib/Stock')

var intel
var apple

tap.test('should initialize Intel stock', function initIntelTest(t) {
  intel = new Stock('INTC')

  t.equals(intel.ticker, 'INTC')

  t.end()
})

tap.test('should add 3 ticks of data w/ average calcs', function tickTest(t) {
  intel.push(10, 20)

  t.equals(100, intel.average)

  intel.push(20, 30)

  t.equals(75, intel.average)

  intel.push(30, 15)

  t.equals(100 / 3, intel.average)

  t.end()
})

tap.test('should initialize Apple stock', function initApplTest(t) {
  apple = new Stock('AAPL')

  t.equals(apple.ticker, 'AAPL')

  t.end()
})

tap.test('should add 3 ticks of data w/ a delayed avg', function delayTest(t) {
  apple.push(10, 20, true)
  apple.push(20, 30, true)
  apple.push(30, 15, true)

  t.equals(0, apple.average)
  t.equals(100 / 3, apple.calculateAverage())

  t.end()
})
