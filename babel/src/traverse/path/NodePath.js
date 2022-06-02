const types = require('../../types');

class NodePath {
  constructor(node, parent, parentPath, key, listKey) {
    this.node = node;
    this.parent = parent;
    this.parentPath = parentPath;
    this.key = key;
    this.listKey = listKey;

    Object.keys(types).forEach(key => {
      if (key.startsWith('is')) {
        this[key] = types[key].bind(this.find, node);
      }
    });
  }

  /**
   * 用某个节点替换当前节点
   * @param {NodePath} node
   */
  replaceWith(node) {
    if (this.listKey !== undefined) {
      this.parent[this.key].splice(this.listKey, 1, node);
    } else {
      this.parent[this.key] = node;
    }
  }

  /**
   * 删除节点
   */
  remove() {
    if (this.listKey !== undefined) {
      this.parent[this.key].splice(this.listKey, 1);
    } else {
      this.parent[this.key] = null;
    }
  }

  /**
   * 从当前节点到根节点来查找节点（包括当前节点）
   */
  find(callback) {
    let curPath = this;

    while (curPath && !callback(curPath)) {
      curPath = curPath.parentPath;
    }

    return curPath;
  }

  /**
   * 从当前节点到根节点来查找节点（不包括当前节点）
   */
  findParent(callback) {
    let curPath = this.parentPath;

    while (curPath && !callback(curPath)) {
      curPath = curPath.parentPath;
    }

    return curPath;
  }

  /**
   * 遍历当前节点的子节点
   * @param {*} visitor
   * @param {*} state
   */
  traverse(visitors, state) {
    const traverse = require('../index');
    const definition = types.visitorKeys.get(this.node.type);

    if (definition.visitor) {
      definition.visitor.forEach(key => {
        const prop = this.node[key];

        if (Array.isArray(prop)) {
          // 如果该属性是数组
          prop.forEach((childNode, index) => {
            traverse(childNode, visitors, this.node, this, key, index);
          });
        } else {
          traverse(prop, visitors, this.node, this, key);
        }
      });
    }
  }

  /**
   * 跳过当前节点的子节点的遍历
   */
  skip() {
    this.node.____shouldSkip = true;
  }

  /**
   * 把当前节点打印成目标代码
   * @returns string
   */
  // toString() {
  //   return generate(this.node).code;
  // }
}

module.exports = NodePath;
