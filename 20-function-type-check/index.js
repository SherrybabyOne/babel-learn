const { transformSync } = require('@babel/core');
const functionTypeCheckPlugin = require('./plugin/function-type-check-plugin');

const sourceCode = `
function add(a: number, b: number): number{
  return a + b;
}

add(1, '2');
`;

transformSync(sourceCode, {
  sourceType: 'unambiguous',
  parserOpts: {
    plugins: ['typescript'],
  },
  plugins: [functionTypeCheckPlugin],
});
