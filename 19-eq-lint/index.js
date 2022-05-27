const { transformFromAstSync } = require('@babel/core');
const parser = require('@babel/parser');
const eqLintPlugin = require('./plugin/eq-lint-plugin');

const sourceCode = `
a == b
foo == true
bananas != 1
value == undefined
typeof foo == 'undefined'
'hello' != 'world'
0 == 0
true == true
`;

const ast = parser.parse(sourceCode, {
  sourceType: 'unambiguous',
});

const { code } = transformFromAstSync(ast, sourceCode, {
  plugins: [[eqLintPlugin, { fix: true }]],
});

console.log(code);
