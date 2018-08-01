const Sherlock = require('../sherlock/sherlock');

class ExampleAdHoc extends Sherlock {

    processAPKManifest() {
        // Overrides parent method for processing APK Manifest.
        
        let jsonResult = {
            has_thing : true,
            number_of_stuff : 9001
        }
        return jsonResult
    }
}

function main() {
    const analyser = new ExampleAdHoc();
    analyser.performAnalysis();
}