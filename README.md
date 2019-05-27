# Clockify extension for Chrome and Firefox

Add Clockify one-click time tracking button to popular web tools. 

[See the full list of integrations →](https://clockify.me/integrations)

## Setup 

1. Make sure you have Node, NPM, Ruby, and Compass installed on your system
2. Clone the repository `git clone git@github.com:clockify/browser-extension.git`
3. Run `npm install`

## Loading and testing

### Chrome extension

1. Build Chrome extension by running `npm run compile.dev.chrome`
2. Navigate to `chrome://extensions/`
3. Enable "Developer mode" (located in the top right corner)
4. Click "Load unpacked" and select the `www/chrome.dev/` folder that you've built
    
### Firefox extension

1. Build Firefox add-on by running `npm run compile.dev.firefox`
2. Navigate to `about:debugging`
3. Click "Load Temporary Add-on"
4. Select the `www/firefox.dev/manifest.json` file

## Contributing

Want to improve an existing integration or create a new one? That's great!

Just fork the repo, make your changes, and send us a pull request. 

### Adding a new tool

Add the url of the new tool in `/src/integrations/integrations.json`. Then, create a `/src/integrations/myapp.js` file. It in, define where the button appears and from which element it needs to pick up the description field. 

When the extension recognizes that you're on that url, it will load the necessary script. 

If you need an example, you can see how [Trello](/src/integrations/trello.js) is implemented.

Use `createButton()` so both the icon and "Start timer" is displayed. If there's not enough space, you can use `createSmallButton` (so only the icon is displayed).

Before sending us a pull request, make sure you test it in both Chrome and Firefox.
