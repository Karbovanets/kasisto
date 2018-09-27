import {
  SAVE_SETTINGS
} from '../../actions/constants/settings'

export const getSettings = (state) => Object.assign({}, state)

export const defaultSettings = { hasTips: 2, pollingInterval: 5000, fiatCurrency: "EUR", krbaddress: "icahHD5KESPNBnDUsRNdpZyDbtiTAt1fF5sGPeiNwG3EG1uoUhXNzej455jtAiweTGW5U81HhJbuY34gXBCR2sB9ZfLQmL", name: "KRB SHOP" };

const settings = (state = defaultSettings, action) => {
  const { type, payload } = action
  switch (type) {
    case SAVE_SETTINGS: {
      return Object.assign({}, state, payload)
    }
    default: {
      return state
    }
  }
}

export default settings
