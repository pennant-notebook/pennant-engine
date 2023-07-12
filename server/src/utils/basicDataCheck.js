const basicDataCheck = (req, thrown) => {
if(req.body.timeout && !(typeof req.body.timeout === "string" && !(isNaN(Number(req.body.timeout)))) &&
      !(typeof req.body.timeout === "number")    
    ) {
      thrown.yes = true;
      throw 'that data is in the wrong format'
    }
    let cellers = req.body.cells;
    let props = Object.keys(req.body);
    if (!(props.length == 2 && props.includes('notebookId') && props.includes('cells')) &&
    !(props.length == 3 && props.includes('notebookId') && props.includes('cells') && props.includes('timeout'))) {
      thrown.yes = true;
      throw 'that data is in the wrong format'
    }
    for (let i=0; i<cellers.length; i++) {
      let cellProps = Object.keys(cellers[i]);
      if(! (cellProps.length == 2 && cellProps.includes('cellId') && cellProps.includes('code'))) {
        thrown.yes = true;
        throw 'that data is in the wrong format'
      }
      if(! (typeof cellers[i].cellId == 'string' && typeof cellers[i].code == 'string')) {
          thrown.yes = true;
          throw 'that data is in the wrong format'
        }
      }
    }

    module.exports = {basicDataCheck};