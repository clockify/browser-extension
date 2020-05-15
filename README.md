# Clockify extension for Chrome and Firefox

Add Clockify one-click time tracking button to popular web tools. 

[About Clockify →](https://clockify.me)
[List of integrations →](https://clockify.me/integrations)

## Adding integration

Want to create an integration or improve an existing one? Awesome! Just fork the repo, make your changes, and send us a pull request. 

Adding your tool is super easy and quick. You need basic web programming skills (HTML, Javascript, Git) and can be done in a couple of hours.

## Something needs fixing?

[Create an issue](https://github.com/clockify/browser-extension/issues) here on Github.

Our team will take a look once we get the chance, but that may take a few weeks or more (depending on our workload). 

If you need the fix quicker, feel free to update the integration yourself and send us a pull request. We typically take care of them within a few days, meaning your fix can sometimes go live within the same week.

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

#### For use compiled firefox addon you need:
1. Go to `www/firefox.dev` and compress to `zip`
2. Change name of compressed file to *.xpi
3. Go to `about:config` from firefox
4. Type `xpinstall.signatures.required` and chenge to `false`
5. Go to `about:addons` and click `Install addons from file`, choose file `*.xpi`


### Adding a new tool

Add the url of the new tool in `/src/integrations/integrations.json`. Then, create a `/src/integrations/myapp.js` file. It in, define where the button appears and from which element it needs to pick up the description field. 

When the extension recognizes that you're on that url, it will load the necessary script. 

The extension can pick up (and create): description, project, task, and tag. 

If you need an example, you can see how [Asana](/src/integrations/asana.js) or [Gitlab](/src/integrations/gitlab.js) are implemented.

Use `createButton()` so both the icon and "Start timer" is displayed. If there's not enough space, you can use `createSmallButton` (so only the icon is displayed).

Before sending us a pull request, make sure you test it in both Chrome and Firefox.
