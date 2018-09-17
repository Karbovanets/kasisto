import camelCaseKeys from 'camelcase-keys'
import snakeCaseKeys from 'snakecase-keys'
import Big from "big.js";

const { fetch } = window

export const rawRpc = (url, username = null, password = null, method, params) => new Promise((resolve, reject) => {
  const headers = { "Content-Type": "application/x-www-form-urlencoded; charset=UTF-8" };

  if (username != null || password != null) {
  //  headers['Authorization'] = `Basic ${window.btoa(`${username}:${password}`)}`
  }

  const body = { jsonrpc: "2.0", id: "test", method, params };
  return fetch(url, {
    method: 'POST',
    headers,
    body: JSON.stringify(body)
  }).then((response) => {
    if (response.ok) {
      response.json().then((json) => {
        if (json && json.error) {
          reject(json.error)
        } else if (json && json.result) {
          resolve(json.result)
        } else {
          reject(json)
        }
      })
    } else {
      reject(response)
    }
  },(error,status)=>{
    console.log(error);
    console.log(status);
  })
})

export const wrapRpc = (url, username, password, method, options = {}, mapOptions = snakeCaseKeys, mapResponse = camelCaseKeys) =>
  rawRpc(url, username, password, method, mapOptions(options)).then(mapResponse)

export const getAddress = (url, username, password) => Promise.resolve(_address);

export const getHeight = (url, username, password) => rawRpc(url, username, password, "getStatus", {});

export const makeIntegratedAddress = (url, username, password, options) =>
  wrapRpc(url, username, password, 'make_integrated_address', options)

export const makeUri = (url, username, password, options) =>{

  return Promise.resolve({
    uri:
      "karbowanec:" +
      options.address +
      "?" +
      "payment_id=" +
      options.paymentId +
      "&" +
      "amount=" +
      new Big(options.amount).div(1e12).toFixed(12)
  });
}
  //old wrapRpc(url, username, password, 'make_uri', options)

export const getTransfers = (url, username, password, options) => rawRpc(url, username, password, "getTransactions", options);
export const getUnconfirmedTransactionHashes = (url, username, password, options) => rawRpc(url, username, password, "getUnconfirmedTransactionHashes", options);


const curryUrl = (fn, url, username, password) => (options) => fn(url, username, password, options)

export const connect = (url, username, password) => ({ getAddress: curryUrl(getAddress, url, username, password), getHeight: curryUrl(getHeight, url, username, password), makeUri: curryUrl(makeUri, url, username, password), getTransfers: curryUrl(getTransfers, url, username, password), getUnconfirmedTransaction: curryUrl(getUnconfirmedTransactionHashes, url, username, password) });

function guid() {
  return (Date.now().toString(16) + Math.random()
      .toString(16)
      .substring(2, 4) + Math.random()
      .toString(16)
      .substring(2) + Math.random()
      .toString(16)
      .substring(2) + Math.random()
      .toString(16)
      .substring(2) + "" + Math.random()
      .toString(16)
      .substring(2)).substring(0, 64).padEnd(64,"0");
}
export const requestPayment = (url, username, password, amount = null, address = "KRB") => {
  let _address = address
  let _amountRequested = amount
  let _amountReceived
  let _height
  let _paymentId
  let _tip
  let _transactions
  let _integratedAddress
  let _status;

  const wallet = connect(url, username, password)
  
  const ready = Promise.all([
    wallet.getHeight()
  ]).then((data) => {
     
    _integratedAddress = _address;
    _paymentId = guid();
    _height = data[0].blockCount-1;
    return payment
  })

  let handle = null

  let cancel = () => {
    if (handle == null) {
      throw new Error('onFulfilled has not been called')
    }
    window.clearInterval(handle)
  }

  const onFulfilled = (pollingInterval = 5000) => new Promise((resolve, reject) => {
    const poll = () => {
      wallet
        .getTransfers({
          blockCount: 360,
          firstBlockIndex: _height,
          paymentId: _paymentId,
          addresses: [_address]
        })
        .then(result => {
          const items = result.items || [];
          var r = items.filter(item => item.transactions.length > 0);

          //var _paymentId = "72c9549b6586d799dc5885f795ca07f66be2bdec2ac071e2b05151987329d22e";


          const allTransactions= r.reduce((accumulator, currentValue) => accumulator = accumulator.concat(currentValue.transactions), []);

          const transactions = allTransactions.filter(tx => tx.paymentId === _paymentId);

          const received = transactions.reduce((sum, { amount }) => sum + amount, 0);

          if (received >= _amountRequested) {
            window.clearInterval(handle);
            _amountReceived = received;
            _tip = _amountReceived - _amountRequested;
            _transactions = transactions;
            _status = "confirm";
            resolve(payment);
          }
        });
    }
    handle = window.setInterval(poll, pollingInterval)
    // poll()
  })



  const setAmount = (amount) => {
    if (_amountRequested != null) {
      throw new Error(`amount already set: ${_amountRequested}`)
    }
    _amountRequested = amount
    return payment
  }

  const makeUri = (tip = 0, recipientName, description) =>{
    return wallet.makeUri({
      address: _address,
      amount: _amountRequested + tip,
      paymentId: _paymentId,
      recipientName,
      txDescription: description
    })
  }

  const payment = {
    get address () { return _address },
    get amountRequested () { return _amountRequested },
    get amountReceived () { return _amountReceived },
    get height () { return _height },
    get paymentId () { return _paymentId },
    get tip () { return _tip },
    get transactions () { return _transactions },
    get integratedAddress() { return _integratedAddress },
    get getStatus() { return _status },
    setAmount,
    onFulfilled,
    makeUri,
    cancel
  }

  return ready
}
