const NodePath = require('./path/NodePath');
const { visitorKeys } = require('../types');

/**
 *
 * @param {Node} node
 * @param {Visitors} visitors
 * @param {Node} parent
 * @param {NodePath} parentPath
 * @param {string} key
 * @param {number} listKey
 * @returns
 */
function traverse(node, visitors, parent, parentPath, key, listKey) {
  const definition = visitorKeys.get(node.type);
  let visitorFuncs = visitors[node.type] || {};

  if (typeof visitorFuncs === 'function') {
    visitorFuncs = {
      enter: visitorFuncs,
    };
  }

  const path = new NodePath(node, parent, parentPath, key, listKey);

  // 遍历子节点之前
  visitorFuncs.enter && visitorFuncs.enter(path);

  if (node.__shouldSkip) {
    delete node.__shouldSkip;
    return;
  }

  if (definition.visitor) {
    definition.visitor.forEach(key => {
      const childNode = node[key];

      if (Array.isArray(childNode)) {
        childNode.forEach((n, index) => traverse(n, visitors, node, path, key, index));
      } else {
        traverse(childNode, visitors, node, path, key);
      }
    });
  }

  // // 遍历子节点之后
  visitorFuncs.exit && visitorFuncs.exit(path);
}

module.exports = traverse;
