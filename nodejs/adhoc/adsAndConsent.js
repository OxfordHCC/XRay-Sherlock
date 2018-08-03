const Sherlock = require('../sherlock/sherlock');

class AdsAndConsentAnalyser extends Sherlock {

    /**
     * Analyse Unpacked APK files.
     *
     * Overrides the parent process APK Manifest method.
     *
     * @param {JSON equivalent of the AndroidManifest.xml file.} mainfest
     * @param {A string array of lines found in each of the classes.dex files} dexLines
     * @param {A JSON object of smali filepaths and converted Java package names} smali
     *
     * @returns {The results of analysis as a JSON object.}
     */
    async analyseApp(manifest, dexLines, smali) {
        // Build a JSON object of the results
        console.log(`Analysing Package Usage in app.`)

        const packages = smali.packages;

        const hasGoogleConsent = smali.packages.some((name) => name.includes('com.google.ads.consent'));
        const hasGoogleAds = smali.packages.some((name) => name.includes('com.google.ads'));

        const jsonResult = {
            hasGoogleConsent : hasGoogleConsent,
            hasGoogleAds : hasGoogleAds ,
        }

        // return the json object of results.
        return jsonResult
    }
}

function main() {
    const analyser = new AdsAndConsentAnalyser('AdsAndConsent','Adam');
    analyser.performAnalysis().catch(err => console.log(err));
}

main();