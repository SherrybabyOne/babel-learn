const { transformSync } = require('@babel/core');
const typeCheckPlugin = require('./plugin/type-check-plugin');

const sourceCode = `
  let name: string;

  name = 111;
`;

transformSync(sourceCode, {
  sourceType: 'unambiguous',
  parserOpts: {
    plugins: ['typescript'],
  },
  plugins: [typeCheckPlugin],
});
