const fs = require('fs-extra');

const source = process.argv[2];
const destination = process.argv[3];

fs.copy(source, destination);
