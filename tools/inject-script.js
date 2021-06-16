const fs = require('fs');

const htmlPath = process.argv[2];
const str = (process.argv[3] === "win") ? "<script>var _isLinux = false;</script>" : "<script>var _isLinux = true;</script>";

fs.readFile(htmlPath, 'utf8', (htmlReadErr, htmlContent) => {
  if (htmlReadErr) {
    process.exit(1);
  }

    const index = htmlContent.indexOf('</head>');
    const resultingHtml =
        `${htmlContent.substr(0, index)}${str}<script src='electron-helpers.js'></script>${htmlContent.substr(index)}`;

    fs.writeFile(htmlPath, resultingHtml, 'utf8', (writeError) => {
        if (writeError) {
            process.exit(1);
        }
    });
});