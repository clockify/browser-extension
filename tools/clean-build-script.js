const rm = require('rimraf');
const dirPath = process.argv[2];

rm.sync(dirPath);