const { Parser, TokenType } = require('acorn');

Parser.acorn.keywordTypes.guang = new TokenType('guang', { keyword: 'guang' });

function wordsRegexp(words) {
  return new RegExp(`^(?:${ words.replace(/ /g, '|') })$`);
}

let guangKeyword = function (Parser) {
  return class extends Parser {
    parse(program) {
      let newKeywords =
        'break case catch continue debugger default do else finally for function if return switch throw try var while with null true false instanceof typeof void delete new in this const class extends export import super';
      newKeywords += ' guang';
      this.keywords = new RegExp(`^(?:${ newKeywords.replace(/ /g, '|') })$`);
      return super.parse(program);
    }

    parseStatement(context, topLevel, exports) {
      let starttype = this.type;

      if (starttype === Parser.acorn.keywordTypes.guang) {
        // 创建一个新的 AST 节点
        let node = this.startNode();
        return this.parseGuangStatement(node);
      } else {
        return super.parseStatement(context, topLevel, exports);
      }
    }

    parseGuangStatement(node) {
      // 消费这个 AST 节点
      this.next();
      // 返回新的 AST 节点
      return this.finishNode({ value: 'guang' }, 'GuangStatement'); // 新增加的ssh语句
    }
  };
};
const newParser = Parser.extend(guangKeyword);
