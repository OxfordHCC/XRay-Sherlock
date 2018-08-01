

class Sherlock {

    // App Version Filter Options
    maxDate;
    minDate;
    appPackageList;

    // App Version Filter Flags
    useMaxDate;
    useMinDate;
    useDateRange;
    useAppPackageList;
    useLatestAppVerions;
    
    constructor(
        maxDate = new Date(),
        minDate = new Date(),
        useMaxDate = false,
        useMinDate = false,
        useDateRange = false,
        useAppPackageList = false,
        appPackageList = [],
        useLatestAppVerions = true
    ) {
        this.maxDate = maxDate;
        this.minDate = minDate;
        this.useMaxDate = useMaxDate;
        this.useMinDate = useMinDate;
        this.useDateRange = useDateRange;
        this.useAppPackageList = useAppPackageList;
        this.appPackageList = appPackageList;
        this.useLatestAppVerions = useLatestAppVerions;
    }

    // Query the DB for a set of APK names.
    // Needs to be flexible, and allow condtions on what is retrieved.
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
            this.unpackAPK()
        }
    }

}
module.exports = Sherlock;