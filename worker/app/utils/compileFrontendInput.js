const { resetContext, getVariableMap, getCellsRun, getDeclaredAt, getChangedVariables, updateVariableMap, updateCellsRun, updateDeclaredAt, updateChangedVariables } = require('./context');
const {extractVariables} = require("./extractVariables");

const variableMap = getVariableMap();
const cellsRun = getCellsRun();
const declaredAt = getDeclaredAt();
// const changedVariables = getChangedVariables()

const compileFrontendInput = (cell, notebookId) => {
//third, extract all variables from the current cell
const cellVariables = extractVariables(cell.code);
let prevRan = false;
//!first check if prevRun
if (cellsRun[cell.cellId]) {
  prevRan=true;
} else {
  cellsRun[cell.cellId] = true;
}
//!if not ran previously
if (prevRan === false) {
  cellVariables.variables.forEach(variable => {
    variableMap[variable.type[0]][variable.name] = cell.cellId;
    console.log('variableMap', variableMap)
  })
}
if (prevRan === true) {
  cellVariables.variables.forEach(async(variable) => {
    if (variableMap[variable.type[0]][variable.name] === cell.cellId) {
      //strip let/const/var only in first instance of variable
      for (let i=0; i<variable.name.length; i++) {
        let k = 6+ variable.name.length;
        if (cell.code.slice(i, i+k) === `const ${variable.name}`) {
          console.log('cell.code', cell.code)
          if (i=0) {
            cell.code = cell.code.slice(6);
          } else {
            cell.code = cell.code.slice(0,i) + cell.code.slice(i+6);
          }
          // cell.code.split('').splice(i, 6).join('');
          console.log('cell.code', cell.code)
          break;
        }
        if (cell.code.slice(i, i+k-2) === `const ${variable.name}`) {
          console.log('cell.code', cell.code)
          if (i=0) {
            cell.code = cell.code.slice(4);
          } else {
            cell.code = cell.code.slice(0,i) + cell.code.slice(i+4);
          }
          // cell.code.split('').splice(i, 4).join('');
          console.log('cell.code', cell.code)
          break;
        }
      }  
      return 'reset'   
    } else {
      //reset context
      console.log('before reset')
      // resetContext(notebookId);
      console.log('variableMapbefore', variableMap)
      console.log('after reset before cellsId')
      cellsRun[cell.cellId] = true;
      console.log('after cellId before variableMap')
      variableMap[variable.type[0]][variable.name] = cell.cellId;
      console.log('after variablemap')
      console.log('variableMap', variableMap)
      //delete the other entry for the variable in the map 
      //and create an entry for the proper variable type
      return 'reset';
    }
  })
}
// console.log(cellVariables);
// let sameRun = {};
// let sameRunCheckPassed = true;
// for (let i=0; i< cellVariables.variables.length; i++) {
//   if (sameRun[cellVariables.variables[i]]){
//     console.log('sameRunFailed')
//     sameRunCheckPassed = false;
//   }
//   sameRun[variable] = true;
// }

// if (sameRunCheckPassed) {
//   //first replace all instances of const and var and let with ' '
//       if (cell.code.match(/\bconst\b/)) {
//         console.log('cell.code after', cell.code)
//         cell.code = cell.code.replace(/const/g, '');
//         console.log('cell.code after', cell.code)
//         }
//       if (cell.code.match(/\bvar\b/)) {
//       cell.code = cell.code.replace(/var/g, '');
//       }
//       if (cell.code.match(/\blet\b/)) {
//         cell.code = cell.code.replace(/let/g, '');
//         }
//       }
// //second make sure the variables are in the variable map so can be accessed throughout the environment
//           cellVariables.variables.forEach((variable, index) => {
//               updateVariableMap(variable, true);
//           })
return 'reset';
}

module.exports = {compileFrontendInput};