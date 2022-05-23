const { declare } = require('@babel/helper-plugin-utils');
const importModule = require('@babel/helper-module-imports');
const generate = require('@babel/generator').default;
const fse = require('fs-extra');
const path = require('path');

let intlIndex = 0;

function nextIntlKey() {
  ++intlIndex;
  return `intl${intlIndex}`;
}

function save(file, key, value) {
  const allText = file.get('allText');

  allText.push({
    key,
    value,
  });
  file.set('allText', allText);
}

const autoI18nPlugin = declare((api, options) => {
  api.assertVersion(7);

  function getReplaceExpression(path, value, intlUid) {
    const expressionParams = path.isTemplateLiteral() ? path.node.expressions.map(item => generate(item).code) : null;
    let replaceExpression = api.template.ast(
      `${intlUid}.t('${value}'${expressionParams ? `,${expressionParams.join(',')}` : ''})`
    ).expression;

    if (path.findParent(p => p.isJSXAttribute()) && !path.findParent(p => p.isJSXExpressionContainer())) {
      replaceExpression = api.types.JSXExpressionContainer(replaceExpression);
    }
    return replaceExpression;
  }

  return {
    pre(file) {
      file.set('allText', []);
    },
    visitor: {
      Program: {
        enter(path, state) {
          // 引入 intl 模块
          let imported = false;

          path.traverse({
            ImportDeclaration(curPath) {
              const source = curPath.get('source').node.value;

              if (source === 'intl') {
                imported = true;
              }
            },
          });
          if (!imported) {
            state.intlUid = importModule.addDefault(path, 'intl', {
              nameHint: path.scope.generateUid('intl'),
            }).name;
          }

          // 对所有的有 /*i18n-disable*/ 注释的字符串和模版字符串节点打个标记，用于之后跳过处理。然后把这个注释节点从 ast 中去掉。
          path.traverse({
            'StringLiteral|TemplateLiteral'(path, state) {
              if (path.node.leadingComments) {
                path.node.leadingComments = path.node.leadingComments.filter(comment => {
                  if (comment.value.includes('i18n-disable')) {
                    path.node.skipTransform = true;
                    return false;
                  }

                  return true;
                });
              }

              if (path.findParent(p => p.isImportDeclaration())) {
                path.node.skipTransform = true;
              }
            },
          });
        },
      },
      StringLiteral(path, state) {
        if (path.node.skipTransform) {
          return;
        }

        // 生成唯一的 intl key
        const key = nextIntlKey();

        save(state.file, key, path.node.value);

        const replaceExpression = getReplaceExpression(path, key, state.intlUid);

        path.replaceWith(replaceExpression);
        path.skip();
      },
      TemplateLiteral(path, state) {
        if (path.node.skipTransform) {
          return;
        }

        const value = path
          .get('quasis')
          .map(item => item.node.value.raw)
          .join('{placeholder}');

        if (value) {
          let key = nextIntlKey();

          save(state.file, key, value);

          const replaceExpression = getReplaceExpression(path, key, state.intlUid);

          path.replaceWith(replaceExpression);
          path.skip();
        }
      },
    },
    post(file) {
      const allText = file.get('allText');
      const intlData = allText.reduce((obj, item) => {
        obj[item.key] = item.value;
        return obj;
      }, {});

      const content = `const resource = ${JSON.stringify(intlData, null, 4)};\nexport default resource;`;
      fse.ensureDirSync(options.outputDir);
      fse.writeFileSync(path.join(options.outputDir, 'zh_CN.js'), content);
      fse.writeFileSync(path.join(options.outputDir, 'en_US.js'), content);
    },
  };
});

module.exports = autoI18nPlugin;
