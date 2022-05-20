const { transformSync } = require('@babel/core');
const fs = require('fs');
const path = require('path');
const autoTrackPlugin = require('./auto-track-plugin');

const sourceCode = fs.readFileSync(path.join(__dirname, './sourceCode.js'), {
  encoding: 'utf-8',
});

const { code } = transformSync(sourceCode, {
  sourceType: 'unambiguous',
  plugins: [
    [
      autoTrackPlugin,
      {
        trackerPath: 'tracker',
      },
    ],
  ],
});

console.log(code);
