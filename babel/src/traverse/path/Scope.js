class Binding {
  constructor(id, path, scope, kind) {
    this.id = id;
    this.path = path;
    // 是否被引用
    this.referenced = false;
    // 所有引用的语句的 path
    this.referencePaths = [];
  }
}

class Scope {
  constructor(parentScope, path) {
    this.parent = parentScope;
    this.bindings = {};
    this.path = path;

    path.traverse({
      VariableDeclarator: childPath => {
        this.registerBinding(childPath.node.id.name, childPath);
      },
      FunctionDeclaration: childPath => {
        // 遇到函数作用域要跳过遍历，因为它有自己独立的作用域
        childPath.skip();
        this.registerBinding(childPath.node.id.name, childPath);
      },
    });
    // 扫描所有引用该 binding 的地方，也就是扫描所有的 identifier
    path.traverse({
      Identifier: childPath => {
        // 排除声明语句里面的 identifier，那个是定义变量不是引用变量
        if (!childPath.findParent(p => p.isVariableDeclarator() || p.isFunctionDeclaration())) {
          const id = childPath.node.name;
          const binding = this.getBinding(id);

          if (binding) {
            binding.referenced = true;
            binding.referencePaths.push(childPath);
          }
        }
      },
    });
  }

  /**
   * 添加 binding
   * @param {string} id
   * @param {NodePath} path
   */
  registerBinding(id, path) {
    this.bindings[id] = new Binding(id, path);
  }

  /**
   * 从当前作用域查找 binding
   * @param {string} id
   * @returns {Binding}
   */
  getOwnBinding(id) {
    return this.bindings[id];
  }

  /**
   * 查找某个 binding，从当前作用域一直查找到根作用域
   * @param {string} id
   * @returns {Binding}
   */
  getBinding(id) {
    let res = this.getOwnBinding(id);

    if (res === undefined && this.parent) {
      res = this.parent.getOwnBinding(id);
    }
    return res;
  }

  /**
   * 从当前作用域查找 binding，可以指定是否算上全局变量，默认是 false
   * @param {string} id
   * @returns {boolean}
   */
  hasBinding(id) {
    return Boolean(this.getBinding(id));
  }
}

module.exports = Scope;
