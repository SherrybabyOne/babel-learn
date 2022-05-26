const { declare } = require('@babel/helper-plugin-utils');
const doctrine = require('doctrine');
const fse = require('fs-extra');
const path = require('path');
const renderer = require('./render');

function parseComment(commentStr) {
  if (!commentStr) {
    return;
  }

  return doctrine.parse(commentStr, {
    unwrap: true,
  });
}

function resolveType(tsType) {
  const { typeAnnotation } = tsType;

  if (!typeAnnotation) {
    return;
  }

  switch (typeAnnotation.type) {
    case 'TSStringKeyword':
      return 'string';
    case 'TSNumberKeyword':
      return 'number';
    case 'TSBooleanKeyword':
      return 'boolean';
  }
}

function generate(docs, format = 'json') {
  if (format === 'markdown') {
    return {
      ext: '.md',
      content: renderer.markdown(docs),
    };
  } else if (format === 'html') {
    return {
      ext: 'html',
      content: renderer.html(docs),
    };
  } else {
    return {
      ext: 'json',
      content: renderer.json(docs),
    };
  }
}

const autoDocumentPlugin = declare((api, options, dirname) => {
  api.assertVersion(7);

  return {
    pre(file) {
      file.set('docs', []);
    },
    visitor: {
      FunctionDeclaration(path, state) {
        const docs = state.file.get('docs');

        docs.push({
          type: 'function',
          name: path.get('id').toString(),
          params: path.get('params').map(param => ({
            name: param.toString(),
            // 对类型进行进一步处理
            type: resolveType(param.getTypeAnnotation()),
          })),
          return: resolveType(path.get('returnType').getTypeAnnotation()),
          // 对注释进一步处理
          doc: path.node.leadingComments && parseComment(path.node.leadingComments[0].value),
        });
      },
      ClassDeclaration(path, state) {
        const docs = state.file.get('docs');
        // 收集 class 的整体信息
        const classInfo = {
          type: 'class',
          name: path.get('id').toString(),
          constructorInfo: {},
          methodsInfo: [],
          propertiesInfo: [],
        };

        if (path.node.leadingComments) {
          classInfo.doc = parseComment(path.node.leadingComments[0].value);
        }

        // 遍历 ClassProperty 和 ClassMethod 并提取信息
        path.traverse({
          ClassProperty(path) {
            classInfo.propertiesInfo.push({
              name: path.get('key').toString(),
              type: resolveType(path.getTypeAnnotation()),
              doc: [path.node.leadingComments, path.node.trailingComments]
                .filter(Boolean)
                .map(comment => parseComment(comment.value))
                .filter(Boolean),
            });
          },
          ClassMethod(path) {
            if (path.node.kind === 'constructor') {
              classInfo.constructorInfo = {
                params: path.get('params').map(paramPath => ({
                  name: paramPath.toString(),
                  type: resolveType(paramPath.getTypeAnnotation()),
                  doc: parseComment(path.node.leadingComments[0].value),
                })),
              };
            } else {
              classInfo.methodsInfo.push({
                name: path.get('key').toString(),
                doc: parseComment(path.node.leadingComments[0].value),
                params: path.get('params').map(paramPath => ({
                  name: paramPath.toString(),
                  type: resolveType(paramPath.getTypeAnnotation()),
                })),
                return: resolveType(path.getTypeAnnotation()),
              });
            }
          },
        });
        docs.push(classInfo);
      },
    },
    post(file) {
      const docs = file.get('docs');
      const res = generate(docs, options.format);

      fse.ensureDirSync(options.outputDir);
      fse.writeFileSync(path.join(options.outputDir, `docs${res.ext}`), res.content);
    },
  };
});

module.exports = autoDocumentPlugin;
