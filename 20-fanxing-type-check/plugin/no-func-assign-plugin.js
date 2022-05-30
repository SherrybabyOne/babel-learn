const { declare } = require('@babel/helper-plugin-utils');

// 解析高级类型的值，传入泛型参数的值
function typeEval(node, params) {
  let checkType;
  if (node.checkType.type === 'TSTypeReference') {
    checkType = params[node.checkType.typeName.name];
  } else {
    checkType = resolveType(node.checkType);
  }
  const extendsType = resolveType(node.extendsType);
  // 如果 condition 表达式 的 check 部分为 true，则返回 trueType，否则返回 falseType
  if (checkType === extendsType || checkType instanceof extendsType) {
    return resolveType(node.trueType);
  } else {
    return resolveType(node.falseType);
  }
}

function resolveType(targetType, referenceTypesMap = {}, scope) {
  const tsTypeAnnotationMap = {
    TSStringKeyword: 'string',
    TSNumberKeyword: 'number',
  };
  switch (targetType.type) {
    case 'TSTypeAnnotation':
      if (targetType.typeAnnotation.type === 'TSTypeReference') {
        return referenceTypesMap[targetType.typeAnnotation.typeName.name];
      }
      return tsTypeAnnotationMap[targetType.typeAnnotation.type];
    case 'NumberTypeAnnotation':
      return 'number';
    case 'StringTypeAnnotation':
      return 'string';
    case 'TSNumberKeyword':
      return 'number';
    case 'TSTypeReference':
      const typeAlias = scope.getData(targetType.typeName.name);
      const paramTypes = targetType.typeParameters.params.map(item => resolveType(item));
      const params = typeAlias.paramNames.reduce((obj, name, index) => {
        obj[name] = paramTypes[index];
        return obj;
      }, {});
      return typeEval(typeAlias.body, params);
    case 'TSLiteralType':
      return targetType.literal.value;
  }
}

function noStackTraceWrapper(cb) {
  const tmp = Error.stackTraceLimit;
  Error.stackTraceLimit = 0;
  cb && cb(Error);
  Error.stackTraceLimit = tmp;
}

const noFuncAssignLint = declare((api, options, dirname) => {
  api.assertVersion(7);

  return {
    pre(file) {
      file.set('errors', []);
    },
    visitor: {
      TSTypeAliasDeclaration(path) {
        path.scope.setData(path.get('id').toString(), {
          paramNames: path.node.typeParameters.params.map(item => item.name),
          body: path.getTypeAnnotation(),
        });
        path.scope.setData(path.get('params'));
      },
      CallExpression(path, state) {
        const errors = state.file.get('errors');
        // 泛型参数
        const realTypes = path.node.typeParameters.params.map(item => resolveType(item, {}, path.scope));
        // 实参类型
        const argumentsTypes = path.get('arguments').map(item => resolveType(item.getTypeAnnotation()));
        const calleeName = path.get('callee').toString();
        // 根据函数名查找到函数声明
        const functionDeclarePath = path.scope.getBinding(calleeName).path;
        const realTypeMap = {};
        functionDeclarePath.node.typeParameters.params.map((item, index) => {
          realTypeMap[item.name] = realTypes[index];
        });
        // 把泛型参数传递给具体的泛型
        const declareParamsTypes = functionDeclarePath
          .get('params')
          .map(item => resolveType(item.getTypeAnnotation(), realTypeMap));

        // 声明类型和具体的类型的对比（类型检查）
        argumentsTypes.forEach((item, index) => {
          if (item !== declareParamsTypes[index]) {
            noStackTraceWrapper(Error => {
              errors.push(
                path
                  .get(`arguments.${index}`)
                  .buildCodeFrameError(`${item} can not assign to ${declareParamsTypes[index]}`, Error)
              );
            });
          }
        });
      },
    },
    post(file) {
      console.log(file.get('errors'));
    },
  };
});

module.exports = noFuncAssignLint;
