const fs = require('fs-extra');

fs.copy("node_modules/antd/lib/time-picker/style/index.css", "styles/antd-time-picker.css");
fs.copy("node_modules/antd/lib/switch/style/index.css", "styles/antd-switch.css");