let variableMap = {};

const setVarInMap = (variable, declaration, cellId) => {
  if (variableMap[variable]) {
    console.log(`variable ${variable} already exists in variableMap`);
    return;
  }
  variableMap[variable] = { declaration, cellId };
}

const varDeclaredInThisCell = (variable, cellId) => {
  if (!variableMap[variable]) return false;
  return variableMap[variable].cellId === cellId;
}

const typeofDeclaration = (variable) => {
  if (!variableMap[variable]) return null;
  return variableMap[variable].declaration;
}

module.exports = { setVarInMap, varDeclaredInThisCell, typeofDeclaration};