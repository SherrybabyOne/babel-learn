const { transformSync } = require('@babel/core');
const autoI18nPlugin = require('./plugin/auto-i18n-plugin');
const fs = require('fs');
const path = require('path');

const sourceCode = fs.readFileSync(path.join(__dirname, './sourceCode.js'), {
  encoding: 'utf-8',
});

const { code } = transformSync(sourceCode, {
  sourceType: 'unambiguous',
  parserOpts: {
    plugins: ['jsx'],
  },
  plugins: [
    [
      autoI18nPlugin,
      {
        outputDir: path.resolve(__dirname, './output'),
      },
    ],
  ],
});

console.log(code);
