## Get started

You will need [Node v16 or later](https://nodejs.org/en/) installed, then clone this repo and change into the folder you have cloned into:

```sh
git clone https://github.com/digidem/mapeo-iccas-web-portal
cd mapeo-iccas-web-portal
```

Then install dependencies with `npm` (npm is installed with Node)

```sh
npm install
```

## Start Dev server

### 1. Start the Firebase emulators

In a terminal window, run:

```sh
npm run start:emulators
```

### 2. Start the web app

Open a new terminal window, run:

```sh
npm start
```

This will open a browser window for the app. Note that the emulator command above will also serve the app on port 4000, but this is based on the static build in the `build` folder. The server on port 3000 is from `react-scripts` and will update based on code in `src`, and does not need to be built on every change.

## Testing

To run all tests:

```sh
npm test
```

To run frontend tests in watch mode (tests will re-run when you edit code):

```sh
npm run test:frontend
```

## Deploy to firebase

In a terminal window, run:

```sh
npm run build
firebase deploy
```

## Troubleshooting 

### Errors on `npm test`, `npm run start:emulators` or deployment

#### 1. Dependencies:

**Firebase tools**

- node version needed is 16.4.0 or higher
- `npm install -g firebase-tools`

#### 2. Java errors on macOS - https://stackoverflow.com/questions/44009058/even-though-jre-8-is-installed-on-my-mac-no-java-runtime-present-requesting-t

```sh
brew install openjdk
sudo ln -sfn /opt/homebrew/opt/openjdk/libexec/openjdk.jdk /Library/Java/JavaVirtualMachines/openjdk.jdk
```

#### 3. Errors on running locally emulators

Might need to change port 5000 in firebase.json - to run locally.
if error occurs (don’t commit those changes) - line 34 firebase.json

>     "hosting": {
>      "port": 5000
>    },


```sh
cd functions
firebase functions:config:get > .runtimeconfig.json.
```