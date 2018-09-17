import {
  oneOfType,
  oneOf,
  shape,

  func,
  number,
  string
} from 'prop-types'

export const KRB = null
export const EUR = 'EUR'
export const USD = 'USD'

export const amountType = oneOfType([number, string])
export const currencyType = oneOf([KRB, EUR, USD])

export const currencyDisplayType = shape({
  amount: amountType,
  currency: currencyType,
  onChange: func
})
