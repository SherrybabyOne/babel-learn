const { declare } = require('@babel/helper-plugin-utils');

function resolveType(targetType) {
  const tsTypeAnnotationMap = {
    TSStringKeyword: 'string',
  };
  switch (targetType.type) {
    case 'TSTypeAnnotation':
      return tsTypeAnnotationMap[targetType.typeAnnotation.type];
    case 'NumberTypeAnnotation':
      return 'number';
  }
}

const typeCheckPlugin = declare((api, options, dirname) => {
  api.assertVersion(7);

  return {
    pre(file) {
      file.set('errors', []);
    },
    visitor: {
      AssignmentExpression(path, state) {
        const leftBinding = path.scope.getBinding(path.get('left'));
        // 左边声明值的类型
        const leftType = resolveType(leftBinding.path.get('id').getTypeAnnotation());
        // 右边赋值的类型
        const rightType = resolveType(path.get('right').getTypeAnnotation());

        if (leftType !== rightType) {
          const tmp = Error.stackTraceLimit;

          Error.stackTraceLimit = 0;
          console.log(path.get('right').buildCodeFrameError(`${rightType} can not assign to ${leftType}`, Error));
          Error.stackTraceLimit = tmp;
        }
      },
    },
    post(file) {
      console.log(file.get('errors'));
    },
  };
});

module.exports = typeCheckPlugin;
