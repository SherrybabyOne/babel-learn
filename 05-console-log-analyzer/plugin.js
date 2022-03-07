const generate = require('@babel/generator').default;

module.exports = ({ types, template }) => ({
  visitor: {
    CallExpression(path, state) {
      const { node } = path;

      if (node.isNew) {
        return;
      }

      const calleeName = generate(node.callee.property).code;

      if (['log', 'info', 'error', 'debug'].includes(calleeName)) {
        console.log(node.loc);
        const { line, column } = node.loc.start;
        const newNode = template.expression(`console.log('filename: (${line}, ${column})')`)();
        newNode.isNew = true;

        if (path.findParent(p => p.isJSXElement())) {
          path.replaceWith(types.arrayExpression([newNode, node]));
          path.skip();
        } else {
          path.insertBefore(newNode);
        }
      }
    },
  },
});
