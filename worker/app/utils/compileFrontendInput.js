const { resetContext, getVariableMap, getCellsRun, getDeclaredAt, getChangedVariables, updateVariableMap, updateCellsRun, updateDeclaredAt, updateChangedVariables, varDeclaredInThisCell, typeofDeclaration, setVarInMapV2, getVarFromMapV2, getVarMapV2 } = require('./context');
const { extractVariables } = require("./extractVariables");

const variableMap = getVariableMap();
const cellsRun = getCellsRun();
const declaredAt = getDeclaredAt();
// const changedVariables = getChangedVariables()
//!
let resetter = false;

// const declaredInThisCell = (variable, cellId) => {
//   return variableMap['const'][variable.name] === cellId || variableMap['let'][variable.name] === cellId || variableMap['var'][variable.name] === cellId;


const findDeclaration =  (keyword, variableName, cellContent) => {
  const regex = new RegExp('(?:^|;|\\n)\\s*' + keyword + '\\s+' + variableName + '\\s*=', 'g');
  const matches = [...cellContent.matchAll(regex)];
  if (matches.length === 0) {
    return [-1, -1];
  }

  for (const match of matches) {
    const substringBeforeMatch = cellContent.substring(0, match.index);
    const openBrackets = (substringBeforeMatch.match(/{/g) || []).length;
    const closeBrackets = (substringBeforeMatch.match(/}/g) || []).length;

    if (openBrackets === closeBrackets) {
      const variableNameStartIndex = match[0].indexOf(variableName);
      return [match.index, match.index + variableNameStartIndex];
    }
  }

  return [-1, -1];
}

const compileFrontendInput = (cell, notebookId) => {
  console.log('variableMap at start: ', getVarMapV2())
  //third, extract all variables from the current cell

  // ! This extracts function inner scoped variables as well. This will prevent us from compiling same-cell let declarations into reassignments.
  const cellVariables = extractVariables(cell.code);
  console.log(cellVariables);

  let prevRan = false;
  //!first check if prevRun
  if (cellsRun[cell.cellId]) {
    prevRan = true;
  } else {
    cellsRun[cell.cellId] = true;
  }

  for (let i = 0; i < cellVariables.variables.length; i++) {
    const candidate = cellVariables.variables[i];
    const exists = varDeclaredInThisCell(candidate.name, cell.cellId);
    console.log(`does ${candidate.name} exist in this cell?`, exists);

    if (!exists) continue;

    const declarationType = typeofDeclaration(candidate.name);

    if (declarationType === 'const') {
      console.log(`${candidate.name} is a const`);
      console.log('Doing nothing for now')

    } else if (declarationType === 'let') {
      console.log(`${candidate.name} is a let`);
      const [start, size] = findDeclaration('let', candidate.name, cell.code);

      if (start === -1) {
        console.error(`Could not find declaration for ${candidate.name}`);
        continue;
      };

      cell.code = cell.code.slice(0, start) + cell.code.slice(start + size);
    };
  }

  // if (prevRan === true) {
  //   // cellVariables.variables.forEach(async(variable) => {
  //   //!FOR EACH VARIABLE
  //   for (let i = 0; i < cellVariables.variables.length; i++) {
  //     //!
  //     let variable = cellVariables.variables[i];
  //     console.log('this var is called: ', variable);
  //     //!if variable declared previously in this cell
  //     const decPrev = varDeclaredInThisCell(variable, cell.cellId);
  //     console.log(`was ${variable.name} declared previously in this cell?`, decPrev);

  //     if (varDeclaredInThisCell(variable, cell.cellId)) {
  //       //strip let/const/var only in first instance of variable

  //       const declarationType = typeofDeclaration(variable);
  //       console.log('declarationType 🐑', declarationType);

  //       for (let i = 0; i < variable.name.length; i++) {
  //         let k = 6 + variable.name.length;
  //         if (cell.code.slice(i, i + k) === `const ${variable.name}`) {
  //           console.log('cell.code', cell.code)
  //           if (i === 0) {
  //             cell.code = cell.code.slice(6);
  //           } else {
  //             cell.code = cell.code.slice(0, i) + cell.code.slice(i + 6);
  //           }
  //           // cell.code.split('').splice(i, 6).join('');
  //           console.log('cell.code', cell.code)
  //           //!
  //           resetter = true;
  //         }

  //         if (cell.code.slice(i, i + k - 2) === `let ${variable.name}`) {
  //           console.log('cell.code', cell.code)
  //           if (i === 0) {
  //             cell.code = cell.code.slice(4);
  //           } else {
  //             cell.code = cell.code.slice(0, i) + cell.code.slice(i + 4);
  //           }
  //           // cell.code.split('').splice(i, 4).join('');
  //           console.log('cell.code', cell.code)
  //           //!MOST RECENTLY ADDED
  //           resetter = true;
  //         }
  //       }
  //       //!DELETE BELOW?
  //       //! if cell run before and var declared w const then reset
  //       //!OR be stringent, dont let people change a const
  //       //!expected to fail if run 2x
  //       if (resetter) {
  //         resetter = false;
  //         return 'reset'
  //       }
  //     } else {
  //       //!if variable declared prev but not in this cell
  //       //!dont do anything
  //       //!if variable not declared previously
  //       //! dont do anything
  //       //reset context
  //       console.log('before reset')
  //       // resetContext(notebookId);
  //       console.log('variableMapbefore', variableMap)
  //       console.log('after reset before cellsId')
  //       //! possible duplication
  //       //!CAN PROB GET RID OF 
  //       cellsRun[cell.cellId] = true;
  //       console.log('after cellId before variableMap')
  //       //!variables newly added to prev ran cell are now in map
  //       //!CAN PROB GET RID OF 
  //       variableMap[variable.type][variable.name] = cell.cellId;
  //       console.log('after variablemap')
  //       console.log('variableMap', variableMap)
  //       //delete the other entry for the variable in the map 
  //       //and create an entry for the proper variable type
  //       //!
  //       // return 'reset';
  //     }
  //     //!
  //     // })
  //   }
  // }

  cellVariables.variables.forEach(variable => {
    setVarInMapV2(variable.name, variable.type, cell.cellId);
  })
}

module.exports = { compileFrontendInput };