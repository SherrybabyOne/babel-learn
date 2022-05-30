const { transformSync } = require('@babel/core');
const noFuncAssignLint = require('./plugin/no-func-assign-plugin');

const sourceCode = `
type Res<Param> = Param extends 1 ? number : string;
function add<T>(a: T, b: T) {
  return a + b;
}
add<Res<1>>(1, '2');
`;

transformSync(sourceCode, {
  sourceType: 'unambiguous',
  parserOpts: {
    plugins: ['typescript'],
  },
  plugins: [noFuncAssignLint],
});
