

class Sherlock {
    
    constructor() {

    }

    getAppPackageNames() {

    }

    getAPK(apkPath) {

    }

    unpackAPK(apk) {

    }

    getAPKManifest(apk) {

    }

    processAPKManifest(mainfest) {

    }

    storeAnalysisResults(results) {

    }

    performAnalysis() {
        const appPackageNames = this.getAppPackageNames();
        for(const pName of appPackageNames) {
            const apk = this.getAPK(pName)
        }
    }

}
module.exports = Sherlock;