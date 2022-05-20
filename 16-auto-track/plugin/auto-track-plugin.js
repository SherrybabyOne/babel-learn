const importModule = require('@babel/helper-module-imports');

module.exports = function (api, options) {
  return {
    visitor: {
      Program(path, state) {
        path.traverse({
          ImportDeclaration(curPath) {
            const requirePath = curPath.get('source').node.value;

            // import 引入模块是 tracker
            if (requirePath === options.trackerPath) {
              const specifierPath = curPath.get('specifiers.0');

              // 记录引入的 tracker id 到 state 中
              state.trackerImportId = specifierPath.get('local').toString();
              // 记录 ast
              state.trackerAST = api.template.statement(`${state.trackerImportId}()`)();
              // 检测到引入了 tracker 模块，结束遍历
              curPath.stop();
            }
          },
        });

        // 代码中没有引入 tracker 模块，引入 tracker 模块
        if (!state.trackerImportId) {
          state.trackerImportId = importModule.addDefault(path, 'tracker', {
            nameHint: path.scope.generateUid('tracker'),
          }).name;
          state.trackerAST = api.template.statement(`${state.trackerImportId}()`)();
        }
      },
      'ClassMethod|ArrowFunctionExpression|FunctionExpression|FunctionDeclaration'(path, state) {
        const bodyPath = path.get('body');

        if (bodyPath.isBlockStatement()) {
          // debugger
          bodyPath.node.body.unshift(state.trackerAST);
        } else {
          const ast = api.template.statement(`{${state.trackerImportId}();return PREV_BODY;}`)({PREV_BODY: bodyPath.node});
          
          bodyPath.replaceWith(ast);
        }
      },
    },
  };
};
