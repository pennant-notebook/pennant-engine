const esprima = require('esprima');

function extractVariables(code) {
  try {
    const ast = esprima.parseScript(code, { range: true, comment: false });
    const declarations = ast.body
      .filter(node => node.type === 'VariableDeclaration')
      .flatMap(node => node.declarations.flatMap(declaration => {
        if (declaration.id.type === "Identifier") {
          return [{
            name: declaration.id.name,
            type: node.kind,
            decPattern: 'VariableDeclaration',
            decStart: node.range[0],
          }];
        } else if (declaration.id.type === "ObjectPattern") {
          return declaration.id.properties.map(property => ({
            name: property.key.name,
            type: node.kind,
            decPattern: "ObjectPattern",
            decStart: node.range[0],
          }));
        }
        return [];
      }));

    return declarations;

  } catch (error) {
    console.log('script has errors; no variables extracted', error);
    return [];
  }
}

module.exports = {extractVariables};