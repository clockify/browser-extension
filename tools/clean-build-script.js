const fs = require('fs-extra');
const dirPath = process.argv[2];

fs.removeSync(dirPath);
