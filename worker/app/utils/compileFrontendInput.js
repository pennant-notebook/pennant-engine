const { resetContext, getVariableMap, getCellsRun, getFlagged, getChangedVariables, updateVariableMap, updateCellsRun, updateFlagged, updateChangedVariables } = require('./context');
const {extractVariables} = require("./extractVariables");

const variableMap = getVariableMap();
const cellsRun = getCellsRun();
const flagged = getFlagged();
const changedVariables = getChangedVariables()

const compileFrontendInput = (cell, notebookId) => {
 //first check if cell has been ran (has implications immediately and throughout)
      let previouslyRan = false;
      let needABreak = false;
      if (!cellsRun[cell.cellId]) {
        updateCellsRun(cell.cellId, 1)
      } else {
        previouslyRan = true;
        updateCellsRun(cell.cellId, cellsRun[cell.cellId] + 1)
      }
      //then extract variables and check them against the variable map  
      //payload below is {variables:[], values:[]}, but can change it to just [] (variables)
      const cellVariables = extractVariables(cell.code);
      if (previouslyRan) {
        console.log('here')
        //check all variables in this cell (cellVariables)
        //if they are in variableMap, extract const/let/var from just in front of that one
          //if they are not in variableMap, leave be
        for (let variable of cellVariables.variables) {
          if (variableMap[variable]) {
            let replaced = `const ${variable}`;
            let replaced2 = `let ${variable}`;
            let replaced3 = `var ${variable}`;
            //if has been run previously and has const, dont want to break the code, instead, reset context
            if (variableMap[variable] == 2 && (cell.code.match(replaced2) || cell.code.match(replaced3))) {
              needABreak = true;
              console.log('broke out because const had been declared earlier')
              break;
            }

            //now we mark the variable to be changed (on backend only)
            if (cell.code.match(`const ${variable}`) || variableMap[variable] == 2) {
              updateFlagged(variable)
              updateChangedVariables(variable, cell.cellId)
              cell.code = cell.code.replace(replaced, `${variable}${cellsRun[cell.cellId]}`);
            }
            cell.code = cell.code.replace(replaced2, variable);
            cell.code = cell.code.replace(replaced3, variable);
          }
        }
        //if the variable is in changedVariable make sure we replace it in any of these situations
        Object.keys(changedVariables).forEach(variable => {
          cell.code = cell.code.replace(` ${variable} `, ` ${variable}${cellsRun[cell.cellId]} `)
          cell.code = cell.code.replace(` ${variable},`, ` ${variable}${cellsRun[cell.cellId]},`)
          cell.code = cell.code.replace(`,${variable},`, `,${variable}${cellsRun[cell.cellId]},`)
          cell.code = cell.code.replace(`,${variable}`, `,${variable}${cellsRun[cell.cellId]}`)
          cell.code = cell.code.replace(` ${variable}.`, ` ${variable}${cellsRun[cell.cellId]}.`)
          cell.code = cell.code.replace(`.${variable}.`, `.${variable}${cellsRun[cell.cellId]}.`)
          cell.code = cell.code.replace(`.${variable}`, `.${variable}${cellsRun[cell.cellId]}`)
        }) 
        //if has been run previously and has const, break out of outer loop and reset context
        if (needABreak) {
          // executeCode(submissionId, cell.cellId, cell.code, notebookId);
          delete cellsRun[cell.cellId];
          resetContext(notebookId);
          console.log('broke out from running all cells bc of const has already been run already')
        //   break;
        return 'ok';
        }
      } else {
        //check all variables in cellVariables
          //if they are in variableMap, 
            //1throw Error('variable declared twice (DO WE WANT THE CELL IT WAS DECLARED IN?)')
            //2reset context which runs current + allPrev
        let errorRiden = false;
        for (let i=0; i< cellVariables.variables.length; i++) {    
          if (variableMap[cellVariables.variables[i]]) {
            errorRiden = true;
            console.log('broke out from not-run previously variable check bc of duplicate')
            break;
          }
        }
        if (errorRiden) {
          // executeCode(submissionId, cell.cellId, cell.code, notebookId);
          delete cellsRun[cell.cellId];
          resetContext(notebookId);
          console.log('broke out from running all cells bc of a not-run-prev duplicate')
        //   break;
        return 'broken';
        }
      }

      cell.code.split(' ').forEach(word => {
        if (changedVariables[word]) {
          cell.code.replaceAll(word, changedVariables[word])
        }
      })

      cellVariables.variables.forEach((variable, index) => {
        updateVariableMap(variable, true);
          if (flagged[variable] || cell.code.match(`const ${variable}`)) {
          updateVariableMap(variable, 2)
        }
      })

}

module.exports = {compileFrontendInput};