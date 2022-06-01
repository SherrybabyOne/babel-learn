class DependencyNode {
  constructor(path = '', imports = {}, exports = []) {
    // 当前模块的路径
    this.path = path;
    // 从哪个模块引入了哪些变量
    this.imports = imports;
    // 导出了哪些变量
    this.exports = exports;
    this.subModules = {};
  }
}

module.exports = DependencyNode;
