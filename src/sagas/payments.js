import Big from 'big.js'
import { v4 as uuid } from 'uuid'

import {
  all,
  call,
  fork,
  put,
  select,
  take,
  takeEvery
} from 'redux-saga/effects'

import { requestPayment } from '../../lib/fetch-krb'
import { fetchExchangeRate } from '../../lib/exchange-rates'

import {
  getSettings
} from '../reducers'

import {
  createPayment,
  updatePayment
} from '../actions/payments'

import * as types from '../actions/constants/payments'

function * listenForTip (id, paymentRequest, name, receipt) {
  while (true) {
    const setTip = yield take(types.SET_TIP)
    const { tip } = setTip.payload
    const convertedTip = parseInt(new Big(tip).times(1e12).round(), 10)
    const { uri } = yield call([paymentRequest, 'makeUri'], convertedTip, name, receipt)
    yield put(updatePayment(id, { tip, uri }))
  }
}

function * listenForCancel () {
  yield take(types.CANCEL_PAYMENT)
  throw new Error('Payment request cancelled')
}

function * awaitPayment (paymentRequest, pollingInterval) {
  const cancelSaga = yield fork(listenForCancel)
  const onFulfilled = yield call([paymentRequest, 'onFulfilled'], pollingInterval)
  cancelSaga.cancel()
  return onFulfilled
}
function* awaitUnconfirmPayment(paymentRequest, pollingInterval) {
  const cancelSaga = yield fork(listenForCancel)
  const onUnconfirmedTransaction = yield call([paymentRequest,'onUnconfirmedTransaction'], pollingInterval)
  cancelSaga.cancel()
  return onUnconfirmedTransaction;
}

export function * processPayment (action) {
  const {
    resolve
  } = action.payload

  const settings = yield select(getSettings)

  const walletUrl = settings.walletUrl || "http://karbo.club/api";
  const krbaddress = settings.krbaddress || "krbaddres";
  const fiatCurrency = settings.fiatCurrency || 'EUR'
  const merchantName = settings.name || 'Coffee shop'
  const pollingInterval = settings.pollingInterval || 2000
  const { username, password } = settings

  const id = uuid()

  // create the initial payment in the store
  yield put(createPayment(id, { fiatCurrency }))

  // let the view know the payment was created
  yield call(resolve, id)

  const [rate, paymentRequest] = yield all([
    call(fetchExchangeRate, fiatCurrency),
    call(requestPayment, walletUrl, username, password, null, krbaddress)
  ])

  const {
    address,
    integratedAddress,
    height,
    paymentId
  } = paymentRequest

  yield put(updatePayment(id, { address, integratedAddress, height, paymentId, rate }))

  const setAmount = yield take(types.SET_AMOUNT)

  const { requestedAmount, receipt } = setAmount.payload
  const convertedAmount = new Big(requestedAmount).times(1e12).div(rate).round()

  yield put(updatePayment(id, {
    requestedAmount,
    convertedAmount: convertedAmount.div(1e12).toFixed(12),
    receipt
  }))

  paymentRequest.setAmount(parseInt(convertedAmount, 10))

  const { uri } = yield call([paymentRequest, 'makeUri'], 0, merchantName, receipt)
  yield put(updatePayment(id, { uri }))

  const tipSaga = yield fork(listenForTip, id, paymentRequest, merchantName, receipt)

  try {
    const onUnconfirmedTransaction = yield call(awaitUnconfirmPayment, paymentRequest, pollingInterval)

    yield put(updatePayment(id, {status: onUnconfirmedTransaction.status}))
  } catch (e) {
    console.warn('Error', e)
    //paymentRequest.cancel()
  } finally {
    console.log("finally");
    //tipSaga.cancel()
  }
  try {
    const onFulfilled = yield call(awaitPayment, paymentRequest, pollingInterval)

    yield put(updatePayment(id, { status: onFulfilled.status , receivedAmount: new Big(onFulfilled.amountReceived).div(1e12).toFixed(12) }))
  } catch (e) {
    console.warn('Error', e)
    paymentRequest.cancel()
  } finally {
    tipSaga.cancel()
  }
}

export function * watchCreatePayment () {
  yield takeEvery(types.REQUEST_PAYMENT, processPayment)
}
