

## Getting Started

Kasisto consists of an app running on a mobile phone or tablet and a server to which the app connects to listen for incoming payments.

### The mobile app

Kasisto is implemented as a [Progressive Web App](https://en.wikipedia.org/wiki/Progressive_web_app). It's targeted to run on any modern mobile browser, including Chrome for Android, Firefox, Safari iOS and Edge. It can be added to the home screen and will run without showing the browser's address bar if done so.

All payment details and configuration settings are stored locally in the app, the server is accessed in a read-only way to listen for incoming transactions.




## Development

Clone, install dependencies and run `yarn` to install dependencies. (`npm install` should work just fine).

To start a local server, run `yarn start`.


## Start

### Setup
Go to 
http://localhost:8000/

![image](https://user-images.githubusercontent.com/3770296/45736182-ded85780-bbf2-11e8-80c8-06bd8237cf8f.png)
![image](https://user-images.githubusercontent.com/3770296/45643999-23fe6b80-bac5-11e8-9c52-103f9312c27c.png)

1) Set shop name
2) Set `Wallet URL` to https://www.karbo.club/api and karbo address must be generate on  https://www.karbo.club/
3) Set shop logo

### Create payment
![image](https://user-images.githubusercontent.com/3770296/45738466-2e218680-bbf9-11e8-8907-c85c55d57ae1.png)
![image](https://user-images.githubusercontent.com/3770296/45738635-b30ca000-bbf9-11e8-8fbf-bc2b56eb7170.png)

## Build
`yarn run dist`
