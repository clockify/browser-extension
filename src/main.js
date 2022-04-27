import React from 'react';
import {Application} from "./application";
import {determineAppType} from "./helpers/app-types-helper";
import {checkConnection} from "./components/check-connection";
import * as moment from 'moment-timezone';
import {LocalStorageService} from "./services/localStorage-service";

const localStorageService = new LocalStorageService();

/* Temporary workaround for secondary monitors on MacOS where redraws don't happen
 * @See https://bugs.chromium.org/p/chromium/issues/detail?id=971701
 */

function Mek() {
if (
  // From testing the following conditions seem to indicate that the popup was opened on a secondary monitor
  window.screenLeft < 0 ||
  window.screenTop < 0 ||
  window.screenLeft > window.screen.width ||
  window.screenTop > window.screen.height
) {
  chrome.runtime.getPlatformInfo(function (info) {
    if (info.os === 'mac') {
      const fontFaceSheet = new CSSStyleSheet()
      fontFaceSheet.insertRule(`
        @keyframes redraw {
          0% {
            opacity: 1;
          }
          100% {
            opacity: .99;
          }
        }
      `)
      fontFaceSheet.insertRule(`
        html {
          animation: redraw 1s linear infinite;
        }
      `)
      document.adoptedStyleSheets = [
        ...document.adoptedStyleSheets,
        fontFaceSheet,
      ]
    }
  })
}
}


document.addEventListener('DOMContentLoaded', async () => {
    await checkConnection();
    
    Mek();
    const application = new Application();

    localStorage.setItem('timeZone', moment.tz.guess());

    application.afterLoad();
});