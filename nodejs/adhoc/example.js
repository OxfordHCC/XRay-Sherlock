const Sherlock = require('../sherlock/sherlock');

class ExampleAdHoc extends Sherlock {

    /**
     * Process APK Manifest.
     *
     * Overrides the parent process APK Manifest method.
     *
     * @param {Array of Strings, one for each line in the mainfest} mainfest
     * @returns {The results of analysis as a JSON object.}
     */
    async analyseApp(mainfest, dexLines, smali) {
        // Build a JSON object of the results
        console.log(`Using Example Analysis App method`)
        let jsonResult = {
            dexLength : dexLines.length,
        }

        // return the json object of results.
        return jsonResult
    }
}

function main() {
    const analyser = new ExampleAdHoc('Example','Adam');
    analyser.performAnalysis();
}

main();