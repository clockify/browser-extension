# Clockify Extension for Chrome & Firefox

Insert Clockify's "Start timer" button to any webpage. 

[About Clockify →](https://clockify.me)

[List of integrations →](https://clockify.me/integrations)

## Develop Your Own Integration

Want to create an integration or improve an existing one? Awesome! Adding an integration is super easy: all you need is some basic web programming skills (HTML, Javascript, Git) and a couple of hours.

Just fork the repo, make your changes, and send us a pull request.

### How adding an integration works

Add the url of the new tool in `/src/integrations/integrations.json`. Then, create a `/src/integrations/myapp.js` file. It in, define where the button appears and from which element it needs to pick up description, project, task, and tag fields. 

When the extension recognizes that you're on that url, it will load the necessary script. 

If you need an example, you can see how [Trello](/src/integrations/trello.js) is implemented.

Use `createButton()` if you wish to display both the icon and "Start timer". If there's not enough space, you can use `createSmallButton` to display only the icon.

Before sending us a pull request, make sure you test the integration in both Chrome and Firefox.

### Something needs fixing?

[Create an issue](https://github.com/clockify/browser-extension/issues) here on Github and our team will take a look the first chance we get (may take a few days, depending on our workload).

If you need the fix quicker, feel free to update the integration yourself and send us a pull request. We typically take care of them within a few days.

---

## Generic Integration

You can also integrate any webpage with Clockify without having to develop a custom integration and go though the whole push/pull process.

All you need to do is add a class or a data-attribute to your webpage and Clockify will automatically recognize it and display the "Start timer" button if a user has the Clockify extension installed.

By adding classes or data attributes to DOM elements, you can control the description, project, task, tags, and whether the full or small version of the timer button appears.

There are two ways you can integrate your webpage with Clockify: by using attributes, or by using classes.

### A) Integrate via data-attributes

Just add a "clockify-data-container" class to an element and define data for each field using data-attribute. If you add "data-small" attribute, just an icon will be displayed for starting a timer.

```
<div class="clockify-data-container"
     data-description="My description"
     data-project="My Project" 
     data-task="Task 1" 
     data-tags="Tag1,Tag2,Tag3" 
     data-small>
</div>
```

### B) Integrate via classes

If you wish to display just one instance of a timer button on a page (e.g. a timer on a task's details page), you need to add "clockify-single-container" class to where you wish to attach the timer button, and add data classes to where different data is displayed (e.g. project and description).

```
<div class="clockify-single-container">Attach timer to this element</div>
<h1 class="clockify-single-project">Project</h1>
<p class="clockify-single-task">Task</p>
<p class="clockify-single-description">Description</p>
<ul>
  <li class="clockify-single-tag">Tag1</li>
  <li class="clockify-single-tag">Tag2</li>
  <li class="clockify-single-tag">Tag3</li>
</ul>
```

If you wish to display multiple instances of a timer button on a page (e.g. a timer for each item in a to-do list), you need to change the class name from single to multi.

```
<div class="clockify-multi-container">Attach timer to this element</div>
<h1 class="clockify-multi-project">Project</h1>
<p class="clockify-multi-task">Task</p>
<p class="clockify-multi-description">Description</p>
<ul>
  <li class="clockify-multi-tag">Tag1</li>
  <li class="clockify-multi-tag">Tag2</li>
  <li class="clockify-multi-tag">Tag3</li>
</ul>
```

If you also add a "clockify-small" class, a small version of the button will be displayed instead of the full one.

---

## Building & Testing

### Chrome Extension

1. Make sure you have Node and NPM installed on your system (see setup instructions below)
2. Clone the repository
3. Run `npm install --legacy-peer-deps`
4. Build Chrome extension by running: `npm run compile.dev.chrome`
5. Navigate to `chrome://extensions/`
6. Enable "Developer mode" (located in the top right corner)
7. Click "Load unpacked" and select the `www/chrome.dev/` folder that you've built

### Firefox Extension

1. Make sure you have Node and NPM installed on your system (see setup instructions below)
2. Clone the repository
3. Run `npm install`
4. Build Firefox add-on by running: `npm run compile.dev.firefox`
5. Navigate to `about:debugging`
6. Click "Load Temporary Add-on"
7. Select the `www/firefox.dev/manifest.json` file

---

## Environment Setup

### Setup (Ubuntu)
```
sudo apt-get install nodejs
sudo npm install --legacy-peer-deps
```
### Setup (Windows)
```
install Node https://nodejs.org/en/download/
npm install --legacy-peer-deps
```

### Setup (Mac)
```
sudo npm install --legacy-peer-deps
npm install @popperjs/core
```

### Compile
```
npm run compile.dev.chrome
npm run compile.dev.firefox
```
