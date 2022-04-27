try {
    importScripts(
      "contentScripts/service-localstorage.js",
      "contentScripts/defaultProject.js",
      "contentScripts/service-background.js",
      "contentScripts/userWorkspaceStorage.js",
      "contentScripts/token-service-background.js",
      "contentScripts/user-service-background.js",
      "contentScripts/integration-background.js",
      "contentScripts/task-service-background.js",
      "contentScripts/project-service-background.js",
      "contentScripts/tag-service-background.js",
      "contentScripts/custom-field-service-background.js",
      "contentScripts/timeEntry.js",
      "contentScripts/clockifyLocales.js",
      "contentScripts/background.js",
      "contentScripts/webSocket-background.js",
      "contentScripts/idle-detection-background.js",
      "contentScripts/context-menu.background.js",
      "contentScripts/notification-background.js",
      "contentScripts/reminder-background.js",
      "contentScripts/pomodoro-background.js"
    );
  } catch (error) {
    console.log(error);
  }