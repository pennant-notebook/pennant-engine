const { resetContext, getVariableMap, getCellsRun, getDeclaredAt, getChangedVariables, updateVariableMap, updateCellsRun, updateDeclaredAt, updateChangedVariables } = require('./context');
const {extractVariables} = require("./extractVariables");

const variableMap = getVariableMap();
const cellsRun = getCellsRun();
const declaredAt = getDeclaredAt();
// const changedVariables = getChangedVariables()
//!
let resetter = false;

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
//!if not ran previously putting var in var map
// if (prevRan === false) {
//   cellVariables.variables.forEach(variable => {
//     variableMap[variable.type[0]][variable.name] = cell.cellId;
//     console.log('variableMap', variableMap)
//   })
// }
if (prevRan === true) {
  // cellVariables.variables.forEach(async(variable) => {
    //!FOR EACH VARIABLE
    for (let i=0; i<cellVariables.variables.length; i++) {
      //!
      let variable = cellVariables.variables[i];
      console.log(variable);
      //!if variable declared previously in this cell
    if (variableMap['const'][variable.name] === cell.cellId || variableMap['let'][variable.name] === cell.cellId || variableMap['var'][variable.name] === cell.cellId) {
      //strip let/const/var only in first instance of variable
      for (let i=0; i<variable.name.length; i++) {
        let k = 6+ variable.name.length;
        if (cell.code.slice(i, i+k) === `const ${variable.name}`) {
          console.log('cell.code', cell.code)
          if (i===0) {
            cell.code = cell.code.slice(6);
          } else {
            cell.code = cell.code.slice(0,i) + cell.code.slice(i+6);
          }
          // cell.code.split('').splice(i, 6).join('');
          console.log('cell.code', cell.code)
          //!
          resetter = true;
          break;
        }
        if (cell.code.slice(i, i+k-2) === `let ${variable.name}`) {
          console.log('cell.code', cell.code)
          if (i===0) {
            cell.code = cell.code.slice(4);
          } else {
            cell.code = cell.code.slice(0,i) + cell.code.slice(i+4);
          }
          // cell.code.split('').splice(i, 4).join('');
          console.log('cell.code', cell.code)
          //!MOST RECENTLY ADDED
          resetter = true;
          break;
        }
      }  
      //!DELETE BELOW?
      //! if cell run before and var declared w const then reset
      //!OR be stringent, dont let people change a const
      //!expected to fail if run 2x
      if (resetter) {
        resetter = false;
      return 'reset'
      }
    } else {
      //!if variable declared prev but not in this cell
        //!dont do anything
      //!if variable not declared previously
        //! dont do anything
      //reset context
      console.log('before reset')
      // resetContext(notebookId);
      console.log('variableMapbefore', variableMap)
      console.log('after reset before cellsId')
      //! possible duplication
      //!CAN PROB GET RID OF 
      cellsRun[cell.cellId] = true;
      console.log('after cellId before variableMap')
      //!variables newly added to prev ran cell are now in map
      //!CAN PROB GET RID OF 
      variableMap[variable.type[0]][variable.name] = cell.cellId;
      console.log('after variablemap')
      console.log('variableMap', variableMap)
      //delete the other entry for the variable in the map 
      //and create an entry for the proper variable type
      //!
      // return 'reset';
    }
    //!
  // })
    }
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
//!
// return 'reset';
//!populate variable map every time (unless reset)
//!ADDED MOST RECENTLY
cellVariables.variables.forEach(variable => {
  // if (variableMap['const'][variable.name] === cell.cellId || !variableMap['let'][variable.name]=== cell.cellId || !variableMap['var'][variable.name]=== cell.cellId) {
  //   delete variableMap['const'][variable.name];
  //   delete variableMap['let'][variable.name];
  //   delete variableMap['var'][variable.name];
  // }
    if (!variableMap['const'][variable.name] && !variableMap['let'][variable.name] && !variableMap['var'][variable.name]) {
  variableMap[variable.type[0]][variable.name] = cell.cellId;
  }
  console.log('variableMap', variableMap)
})
}

module.exports = {compileFrontendInput};