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
    analyseApp(mainfest, classFile, smali) {

        let hasThing = false;
        let numberOfStuff = 0;

        for(const line of classFile) {

            if(line.includes("thing")) {
                hasThing = true;
            }

            if(line.includes("stuff")) {
                numberOfStuff += 1;
            }
        }


        // Build a JSON object of the results
        let jsonResult = {
            has_thing : hasThing,
            number_of_stuff : numberOfStuff
        }

        // return the json object of results.
        return jsonResult
    }
}

function main() {
    const analyser = new ExampleAdHoc();
    analyser.performAnalysis();
}