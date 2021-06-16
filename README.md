Start the development server with this command:
 
```
npm start
```
 
 
  
Setup
---
 
```
sudo apt-get install ruby-dev
sudo gem install compass
sudo npm install
```
 
Compile
---
 
```
npm run compile.dev.chrome
npm run compile.prod.chrome
npm run compile.dev.firefox
npm run compile.prod.firefox
```

Debug
---
```
Windows/Linux
In ext/main.js in method createWindow change width of window to 1000px and add
mainWindow.webContents.openDevTools(); for debbuging
After that: 
npm run start.electron
```
