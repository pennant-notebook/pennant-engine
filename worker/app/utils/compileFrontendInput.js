const { resetContext, getVariableMap, getCellsRun, getFlagged, getChangedVariables, updateVariableMap, updateCellsRun, updateFlagged, updateChangedVariables } = require('./context');
const {extractVariables} = require("./extractVariables");

const variableMap = getVariableMap();
const cellsRun = getCellsRun();
const flagged = getFlagged();
const changedVariables = getChangedVariables()

const compileFrontendInput = (cell) => {
//third, extract all variables from the current cell
const cellVariables = extractVariables(cell.code);

  //first replace all instances of const and var and let with ' '
      if (cell.code.match(/\bconst\b/)) {
        console.log('cell.code after', cell.code)
        cell.code = cell.code.replace(/const/g, '');
        console.log('cell.code after', cell.code)
        }
      if (cell.code.match(/\bvar\b/)) {
      cell.code = cell.code.replace(/var/g, '');
      }
      if (cell.code.match(/\blet\b/)) {
        cell.code = cell.code.replace(/let/g, '');
        }
//second make sure the variables are in the variable map so can be accessed throughout the environment
          cellVariables.variables.forEach((variable, index) => {
              updateVariableMap(variable, true);
          })
}

module.exports = {compileFrontendInput};