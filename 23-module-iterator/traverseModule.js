const parser = require('@babel/parser');
const traverse = require('@babel/traverse').default;
const fs = require('fs');
const path = require('path');
const DependencyNode = require('./DependencyNode');

const visitedModules = new Set();
const IMPORT_TYPE = {
  deconstruct: 'deconstruct',
  default: 'default',
  namespace: 'namespace',
};
const EXPORT_TYPE = {
  all: 'all',
  default: 'default',
  named: 'named',
};

function resolveBabelSyntaxPlugins(modulePath) {
  const plugins = [];
  if (['.tsx', '.jsx'].some(ext => modulePath.endsWith(ext))) {
    plugins.push('jsx');
  }
  if (['.ts', '.tsx'].some(ext => modulePath.endsWith(ext))) {
    plugins.push('typescript');
  }
  return plugins;
}

function isDirectory(filePath) {
  try {
    return fs.statSync(filePath).isDirectory();
  } catch (e) {}
  return false;
}

function completeModulePath(modulePath) {
  const EXTS = ['.tsx', '.ts', '.jsx', '.js'];

  if (modulePath.match(/\.[a-zA-Z]+$/)) {
    return modulePath;
  }

  function tryCompletePath(resolvePath) {
    for (let i = 0; i < EXTS.length; i++) {
      const tryPath = resolvePath(EXTS[i]);

      if (fs.existsSync(tryPath)) {
        return tryPath;
      }
    }
  }

  function reportModuleNotFoundError(modulePath) {
    throw `module not found: ${modulePath}`;
  }

  if (isDirectory(modulePath)) {
    const tryModulePath = tryCompletePath(ext => path.join(modulePath, `index${ext}`));

    if (!tryModulePath) {
      reportModuleNotFoundError(modulePath);
    } else {
      return tryModulePath;
    }
  } else if (!EXTS.some(ext => modulePath.endsWith(ext))) {
    const tryModulePath = tryCompletePath(ext => modulePath + ext);

    if (!tryModulePath) {
      reportModuleNotFoundError(modulePath);
    } else {
      return tryModulePath;
    }
  }
  return modulePath;
}

function moduleResolver(curModulePath, requirePath) {
  requirePath = path.resolve(path.dirname(curModulePath), requirePath);

  // 过滤掉第三方模块
  if (requirePath.includes('node_modules')) {
    return '';
  }

  requirePath = completeModulePath(requirePath);

  if (visitedModules.has(requirePath)) {
    return '';
  } else {
    visitedModules.add(requirePath);
  }
  return requirePath;
}

function traverseJsModule(curModulePath, dependencyGraphNode, allModules) {
  const moduleFileContent = fs.readFileSync(curModulePath, {
    encoding: 'utf-8',
  });

  dependencyGraphNode.path = curModulePath;

  const ast = parser.parse(moduleFileContent, {
    sourceType: 'unambiguous',
    // 根据不同的文件后缀添加指定的的插件支持
    plugins: resolveBabelSyntaxPlugins(curModulePath),
  });

  traverse(ast, {
    ImportDeclaration(path) {
      // 把路径转成绝对路径并进行路径补全的处理
      const subModulePath = moduleResolver(curModulePath, path.node.source.value);

      if (!subModulePath) {
        return;
      }

      const specifierPaths = path.get('specifiers');
      dependencyGraphNode.imports[subModulePath] = specifierPaths.map(specifierPath => {
        if (specifierPath.isImportSpecifier()) {
          return {
            type: IMPORT_TYPE.deconstruct,
            imported: specifierPath.get('imported').node.name,
            local: specifierPath.get('local').node.name,
          };
        } else if (specifierPath.isImportDefaultSpecifier()) {
          return {
            type: IMPORT_TYPE.default,
            local: specifierPath.get('local').node.name,
          };
        } else {
          return {
            type: IMPORT_TYPE.namespace,
            local: specifierPath.get('local').node.name,
          };
        }
      });

      const subModule = new DependencyNode();

      traverseJsModule(subModulePath, subModule, allModules);
      dependencyGraphNode.subModules[subModule.path] = subModule;
    },
    ExportDeclaration(path) {
      if (path.isExportNamedDeclaration()) {
        const specifiers = path.get('specifiers');

        dependencyGraphNode.exports = specifiers.map(specifierPath => ({
          type: EXPORT_TYPE.named,
          exported: specifierPath.get('exported').node.name,
          local: specifierPath.get('local').node.name,
        }));
      } else if (path.isExportDefaultDeclaration()) {
        const declarationPath = path.get('declaration');
        let exportName;

        if (declarationPath.isAssignmentExpression()) {
          exportName = declarationPath.get('left').toString();
        } else {
          exportName = declarationPath.toString();
        }
        dependencyGraphNode.exports.push({
          type: EXPORT_TYPE.default,
          exported: exportName,
        });
      } else {
        dependencyGraphNode.exports.push({
          type: EXPORT_TYPE.all,
          exported: path.get('exported').node.name,
          source: path.get('source').node.value,
        });
      }
    },
  });

  allModules[curModulePath] = dependencyGraphNode;
}

module.exports = function (curModulePath) {
  const dependencyGraph = {
    root: new DependencyNode(),
    allModules: {},
  };
  traverseJsModule(curModulePath, dependencyGraph.root, dependencyGraph.allModules);
  return dependencyGraph;
};
