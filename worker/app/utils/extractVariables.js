const extractVariables = (inputString) => {
    const regexp = /(const|let|var)\s+\S+\s*=/g;
// const str = 'const greeting = "hello"; const name = "john"';

    const array = [...inputString.matchAll(regexp)];

// console.log('array', array);
// prints: [
//     [
//       'greeting =',
//       index: 6,
//       input: 'const greeting = "hello"; const name = "john"',
//       groups: undefined
//     ],
//     [
//       'name =',
//       index: 32,
//       input: 'const greeting = "hello"; const name = "john"',
//       groups: undefined
//     ]
//   ]

    const variables = array.map(variable => {
        let target = variable[0].match(/(const|let|var)/);
        let cleaned = variable[0].replace(/(const|let|var)\s+/, "");
        let collected = cleaned.slice(0, cleaned.length-2)
        return {type: target[0], name: collected};
    })

    console.log(variables);
    const regexp2 = /=\s\S+/g;
    const array2 = [...inputString.matchAll(regexp2)];

    const values = array2.map(value => {
        let untrimmed = value[0]
        // console.log('untrimmed', untrimmed)
        const regexp = /('|")\S+('|")/g;
        let trimmed = untrimmed.match(regexp);
        //WORKING ON THIS
        if (trimmed !== null) {
            // console.log('trimmed', trimmed)
            forSlice = trimmed[0];
        } else {
            // (console.log('untrimmed', untrimmed))
            forSlice = untrimmed;
        }
        const final = forSlice.slice(1, forSlice.length - 1)
        //ABOVE

        // const final = trimmed[0].slice(1, trimmed[0].length - 1)
        return final;
    })

//now i have an arr of variables and a corresponding arr of values
// variables.forEach((variable, index) => {
//     Repl.context[variable] = values[index];
// })
//took out above, and have to now...
//

    // return variables;
    return {variables, values};
}

module.exports = {extractVariables};