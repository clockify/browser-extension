## Setup

1. Make sure you have Node, NPM, Ruby, and Compass installed on your system
2. Navigate to root folder and run `sudo npm install`
3. Build Chrome extension by running `npm run compile.dev.chrome` (to build Firefox add-on run `npm run compile.dev.firefox`)
4. Load and test the Chrome extension: 
    1. Open Chrome's Settings > Extension (or go to chrome://extensions/)
    2. Turn on "Developer mode" (located in the top right corner)
    3. Click "Load unpacked" and select the `www/chrome.dev` folder that you've built

## Developing and updating integrations

Fork the repo, update integration (or create a new one), and send us a pull request.

`/src/integrations/integrations.json` contains the URL of the app where the Clockify button appears 

`/src/integrations/myapp.js` file contains instructions when and where the button will appear, and from where it needs to pick up the description and project field.
