const fs = require('fs');
var path = require('path');
//var en = require('../_locales/en/messages.json');
var webKeysWeUse = require('./web-keys-we-use.json');
// import { open, close } from 'fs';

let lang = process.argv[2]
let printAllKeys = false;

if (!lang) {
  lang = 'en'
  printAllKeys = true;
}

console.log('language: ', lang)
var jsonPath = path.join(__dirname, '.', 'web-locales', `clockify-web-${lang}.json`);
console.log('Input file:', jsonPath)

var data = fs.readFileSync(jsonPath, 'utf8');
// console.log(data)
var web = JSON.parse(data);


const allKeys = {}
function parseObjectProperties (pre, obj) {
  for (var k in obj) {
    if (typeof obj[k] === 'object') {
      parseObjectProperties(pre === "" ? k : pre+"__"+k, obj[k])
    } 
    else {
      //console.log(pre, obj[k])
      allKeys[pre + '__' + k] = obj[k];
    }
  }
}

if (printAllKeys) {
  parseObjectProperties("", web);
  var outPath = path.join(__dirname, 'all-keys.txt');
  console.log('Created:', outPath)
  fs.writeFileSync(outPath, JSON.stringify(allKeys, null, 2), 'utf8');
  process.exit(0)
}

let parts = [];
const getVal = (obj, i) => {
  return i < parts.length
    ? getVal(obj[parts[i]], i+1)
    : obj
}

const missingKeys = [];
const res = {};

Object.keys(webKeysWeUse).forEach(key => {
  if (key[0] === key[0].toUpperCase()) {
    //console.log(key) //, webKeysWeUse[key].message)
    parts = key.split('__');
    //if (parts.length === 2) { // } && key === "TRACKER__DEFAULT") {
      let msg = getVal(web, 0)
      //res[key] = msg;
      if (msg) {
        if (key === 'SLAVKO__ABC') {
          console.log(key, msg)
          var match, result = "", regex = /(\{)(.*?)(\{)(.*?)(\})/ig;
          while (match = regex.exec(msg)) { 
            console.log(match[1]); 
          }
        }

        msg = msg.replace(/\{\s+/g, '\$').replace(/\s+\}/g, '\$');
        res[key] = {
          message: msg
        }
        if (webKeysWeUse[key].placeholders) {
          res[key].placeholders = webKeysWeUse[key].placeholders;
        }
        // console.log(key, msg)
      }
      else {
        missingKeys.push(key)
        // in case of miissing key, we use english
        res[key] = {
          message: webKeysWeUse[key].message
        }
      }
    //}
  }
});

if (missingKeys.length > 0) {
  console.log('MISSING KEYS')
  console.log("====================================")
  missingKeys.forEach(key => console.log(key))
  console.log("====================================")
}

res['appName'] = {
  message: res["EXTENSION__APPNAME_MESSAGE"].message,
  description: res["EXTENSION__APPNAME_DESCRIPTION"].message
}
delete res["EXTENSION__APPNAME_MESSAGE"]
delete res["EXTENSION__APPNAME_DESCRIPTION"]

res ["appDesc"] = {
  message: res["EXTENSION__APPDESC_MESSAGE"].message,
  description: res["EXTENSION__APPDESC_DESCRIPTION"].message
}
delete res["EXTENSION__APPDESC_MESSAGE"]
delete res["EXTENSION__APPDESC_DESCRIPTION"]

var outPath = path.join(__dirname, '..', '_locales', lang, 'messages.json');
console.log('Created:', outPath)
fs.writeFile(outPath, JSON.stringify(res, null, 2), 'utf8', (writeError) => {
     if (writeError) {
         process.exit(1);
     }
});

