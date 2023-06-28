const vm = require('vm');
const { Console } = require('console');
const { loadContext, updateContextWrapper, resetContext } = require('./context');
const { updateSubmissionOutput } = require('./submissionOutput');
const {extractVariables} = require("./extractVariables");

//below has implications: is this engine containerized per session? assumption yes
//if so, we dont need to worry about everyone else's variables polluting the maps below
let variableMap = {};
let cellsRun = {};
const engine = async (submissionId, cells, notebookId) => {
  //added
  let changedVariables = {}
  for (let cell of cells) {    
    try {
      let flagged = {};
      //first check if cell has been ran (has implications immediately and throughout)
      let previouslyRan = false;
      let needABreak = false;
      if (!cellsRun[cell.cellId]) {
        cellsRun[cell.cellId] = 1;
      } else {
        previouslyRan = true;
        cellsRun[cell.cellId] += 1;
      }
      //then extract variables and check them against the variable map  
     //payload below is {variables:[], values:[]}, but can change it to just [] (variables)
      const cellVariables = extractVariables(cell.code);
      console.log('cellVariables', cellVariables);
      if (previouslyRan) {
        //check all variables in this cell (cellVariables)
        //if they are in variableMap, extract const/let/var from just in front of that one
          //if they are not in variableMap, leave be
        for (let variable of cellVariables.variables) {
          if (variableMap[variable]) {
            let replaced = `const ${variable}`;
            let replaced2 = `let ${variable}`;
            let replaced3 = `var ${variable}`;
            //added check to see if const is in there
            if (variableMap[variable] == 2) {
              needABreak = true;
              // console.log('broke out because const had been declared earlier')
              break;
            }

              //now we mark the variable to be changed (on backend only)
              if (cell.code.match(`const ${variable}`) || variableMap[variable] == 2) {
                flagged[variable] = true;
              
            changedVariables[variable] = `${variable}${cellsRun[cell.cellId]}` 
            cell.code = cell.code.replace(replaced, `${variable}${cellsRun[cell.cellId]}`);
          }
            cell.code = cell.code.replace(replaced2, variable);
            cell.code = cell.code.replace(replaced3, variable);
          }
        }

        if (needABreak) {
          executeCode(submissionId, cell.cellId, cell.code, notebookId);
          delete cellsRun[cell.cellId];
          resetContext(notebookId);
          variableMap = {};
          cellsRun = {};
          console.log('broke out from running all cells bc of const has already been run already')
          break;
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
            executeCode(submissionId, cell.cellId, cell.code, notebookId);
            delete cellsRun[cell.cellId];
            resetContext(notebookId);
            variableMap = {};
            cellsRun = {};
            console.log('broke out from running all cells bc of a not-run-prev duplicate')
            break;
          }
        }

      cell.code.split(' ').forEach(word => {
        if (changedVariables[word]) {
          cell.code.replaceAll(word, changedVariables[word])
        }
      })

      cellVariables.variables.forEach((variable, index) => {
        variableMap[variable] = true;
          if (flagged[variable]) {
          variableMap[variable] = 2;
        }
      })

      
     
      //NOW THE ISSUE IS THAT ON CHANGES OF CONST => LET/VAR OR ON COPY/PASTE OF CONST TO A NEW CELL 
      //IT SENDS AN ERROR/RESETS FIRST TIME, EVEN THOUGH SHOULDNT BE AN ERROR (SHOULD WE LEAVE IT)?
    //added above  
    executeCode(submissionId, cell.cellId, cell.code, notebookId);
    } catch (error) {
      console.error("running cells raised an error: ", error);
      break;
    }
  }
  console.log('variableMap', variableMap)
  // console.log('cellsRun', cellsRun)
}

// we might want to reset context when the code raises errors.

const executeCode = async (submissionId, cellId, code, notebookId) => {

  const stream = require('stream'); 
  var util = require('util');
  const arr = [];
  function EchoStream () { // step 2
    stream.Writable.call(this);
  };
  util.inherits(EchoStream, stream.Writable); // step 1
  EchoStream.prototype._write = function (chunk, encoding, done) { // step 3
    arr.push(chunk.toString())
    done();
  }

  var writableStream = new EchoStream(); 

  const customConsole = new Console(writableStream, writableStream);
  const context = loadContext(notebookId);
  context.console = customConsole;

  let isSyntaxOrRuntimeError = false;

  try {
    await vm.runInNewContext(code, context);
    updateContextWrapper(notebookId);
  } catch (error) {
    arr.push(String(error));
    isSyntaxOrRuntimeError = true;
  } finally {
    writableStream.end();
    // console.log('arr', arr)
    updateSubmissionOutput(submissionId, cellId, isSyntaxOrRuntimeError, arr[0]);
  }
}


module.exports = engine;

