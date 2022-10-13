import React from 'react';
import { createRoot } from 'react-dom/client';
import {Application} from "./application";
import {checkConnection} from "./components/check-connection";
import * as moment from 'moment-timezone';
import ClockifyButton from "./components/integrationPopup/ClockifyButton";
import "../sass/main-integration.scss";

/* Temporary workaround for secondary monitors on MacOS where redraws don't happen
 * @See https://bugs.chromium.org/p/chromium/issues/detail?id=971701
 */


function Mac() {
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


if(window.location.href.includes('chrome-extension://') || window.location.href.includes('moz-extension://')) {

  import("antd/lib/date-picker/style/css");
  import("antd/lib/switch/style/css");
  import("../sass/main.scss");

  window.mountHtmlElement = document.getElementById('mount');
  window.reactRoot = createRoot(window.mountHtmlElement);

  document.addEventListener('DOMContentLoaded', async () => {
      await checkConnection();
      
      Mac();
      const application = new Application();

      localStorage.setItem('timeZone', moment.tz.guess());

      application.afterLoad();
  });
} else {

  let integrationRoots = [];
  const renderClockifyButton = (props) => {
    let counter = 0;
    const intervalId = setInterval(() => {
      const entryPoints = document.querySelectorAll('.clockifyButton');
      if (entryPoints?.length) {
        entryPoints.forEach((entryPoint, index) => {
          const buttonId = entryPoint.className.match(/clockifyButtonId(\d+)/)[1];
          const currBtnProps = props.btnProps[buttonId];
          if(!currBtnProps) return;
          if (!integrationRoots[buttonId] || currBtnProps.newRoot) {
            if (currBtnProps.newRoot) {
              currBtnProps.newRoot = false;
            }
            if (integrationRoots[buttonId]) {
              integrationRoots[buttonId].unmount;
              delete integrationRoots[buttonId];
            }
            integrationRoots[buttonId] = createRoot(entryPoint, {
              identifierPrefix: buttonId
            });
          }
          integrationRoots[buttonId].render(
              <ClockifyButton {...currBtnProps} {...(index === 0 ? props.popupProps : {inProgressDescription: props.popupProps.inProgressDescription})} 
              updateButtonProps={(btnProps, popupProps) => window.updateButtonProperties(btnProps && {...btnProps, buttonId: buttonId}, popupProps)}/>
          );
        });
        clearInterval(intervalId);
      }
      counter++;
      if(counter > 5) {
        clearInterval(intervalId);
      }
    }, 700);
  }  

  window.updateButtonProperties = ((props = {
    popupProps: {},
    btnProps: []
  }) => { 
    return (newBtnProps, newPopupProps) => {
      if(newBtnProps){
        if(!props.btnProps[newBtnProps.buttonId]) {
          props.btnProps[newBtnProps.buttonId] = {};
        }
        props.btnProps[newBtnProps.buttonId] = {...props.btnProps[newBtnProps.buttonId], ...newBtnProps};
      }
      if(newPopupProps){
        props.popupProps = {...props.popupProps, ...newPopupProps};
      }
      renderClockifyButton(props);
    }
  })();
}
