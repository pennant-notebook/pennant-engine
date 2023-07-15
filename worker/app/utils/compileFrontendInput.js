const { resetContext, getVariableMap, getCellsRun, getDeclaredAt, getChangedVariables, updateVariableMap, updateCellsRun, updateDeclaredAt, updateChangedVariables, varDeclaredInThisCell, typeofDeclaration, setVarInMap, getVarFromMapV2, getVarMapV2 } = require('./context');
const { extractVariables } = require("./extractVariables");

const findKeywordIdx = (variableName, cellVariables) => {
  for (let i = 0; i < cellVariables.length; i++) {
    let varName = cellVariables[i].name;
    if (varName === variableName) {
      // ! Object destructuring reassignments are not supported in this version
      if (cellVariables[i].decPattern === 'ObjectPattern') break;
      return [cellVariables[i].decStart, cellVariables[i].decStart + cellVariables[i].type.length];
    }
  }
  return [-1, -1];
}

const replaceWithWhitespace = (codeContent, startIdx, endIdx) => {
  let whitespace = ' '.repeat(endIdx - startIdx);
  return codeContent.slice(0, startIdx) + whitespace + codeContent.slice(endIdx);
}

const compileFrontendInput = (cell) => {
  const scriptVariables = extractVariables(cell.code);
  let codeContentCopy = cell.code.slice();

  for (let i = 0; i < scriptVariables.length; i++) {
    const candidateVariable = scriptVariables[i];
    const exists = varDeclaredInThisCell(candidateVariable.name, cell.cellId);

    if (!exists) continue;

    const declarationType = typeofDeclaration(candidateVariable.name);

    if (declarationType === 'const') {
      console.log(`${candidateVariable.name} is a const`);
      console.log('Doing nothing for now. Allow syntax error to be thrown.')

    } else if (declarationType === 'let') {
      const [start, end] = findKeywordIdx(candidateVariable.name, scriptVariables);

      if (start === -1) {
        console.error(`No declaration present for ${candidateVariable.name} / or it is an object destructuring (let)`);
        continue;
      };
      codeContentCopy = replaceWithWhitespace(codeContentCopy, start, end);
    };
  }

  cell.code = codeContentCopy;

  scriptVariables.forEach(variable => {
    setVarInMap(variable.name, variable.type, cell.cellId);
  })
}

module.exports = { compileFrontendInput };