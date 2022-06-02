const acorn = require('acorn');

const { Parser } = acorn;
const { TokenType } = acorn;

Parser.acorn.keywordTypes.guang = new TokenType('guang', { keyword: 'guang' });

module.exports = function (Parser) {
  return class extends Parser {
    parse(program) {
      let newKeywords =
        'break case catch continue debugger default do else finally for function if return switch throw try var while with null true false instanceof typeof void delete new in this const class extends export import super';
      newKeywords += ' guang';

      this.keywords = new RegExp(`^(?:${newKeywords.replace(/ /g, '|')})$`);
      return super.parse(program);
    }

    parseStatement(context, topLevel, exports) {
      let starttype = this.type;

      if (starttype === Parser.acorn.keywordTypes.guang) {
        let node = this.startNode();
        return this.parseGuangStatement(node);
      } else {
        return super.parseStatement(context, topLevel, exports);
      }
    }

    parseGuangStatement(node) {
      this.next();
      return this.finishNode({ value: 'guang' }, 'GuangStatement');
    }
  };
};
