const { declare } = require('@babel/helper-plugin-utils');

const lintForPlugin = declare((api, options) => {
  api.assertVersion(7);

  return {
    pre(file) {
      file.set('errors', []);
    },
    visitor: {
      ForStatement(path, state) {
        const testOperator = path.node.test.operator;
        const updateOperator = path.node.update.operator;
        const errors = state.file.get('errors');
        let shouldUpdateOperator;

        if (['<', '<='].includes(testOperator)) {
          shouldUpdateOperator = '++';
        }

        if (['>', '>='].includes(testOperator)) {
          shouldUpdateOperator = '--';
        }

        if (shouldUpdateOperator !== updateOperator) {
          const tmp = Error.stackTraceLimit;

          Error.stackTraceLimit = 0;
          errors.push(path.get('update').buildCodeFrameError('for direction error', Error));
          Error.stackTraceLimit = tmp;
        }
      },
    },
    post(file) {
      console.log(file.get('errors'));
    },
  };
});

module.exports = lintForPlugin;
