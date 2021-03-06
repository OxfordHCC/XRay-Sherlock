const config = require('../config/config.json');
const pg = require('pg');
const fs = require('fs-extra');
const util = require('util');
const bashExec = util.promisify(require('child_process').exec);
const parseString = util.promisify(require('xml2js').parseString);
const glob = require('glob').Glob;

const MAX_DATE = new Date('2070-01-01Z00:00:00:000');
const MIN_DATE = new Date('1970-01-01Z00:00:00:000');

class Sherlock {

    constructor(
        analyserName,
        analysisBy,
        maxDate = MAX_DATE,
        minDate = MIN_DATE,
        appPackageList = [],
        useLatestAppVerions = true
    ) {

        console.log(config);
        // Must be set.
        this.analyserName = analyserName;
        this.analysisBy = analysisBy;

        // optional Params
        this.maxDate = maxDate;
        this.minDate = minDate;
        this.appPackageList = appPackageList;
        this.useLatestAppVerions = useLatestAppVerions;

        // DB setup
        const dbConfig = config.db_info;
        dbConfig.max = 10;
        dbConfig.idleTimeoutMillis = 30000;

        this.pool = new pg.Pool(dbConfig);
        this.pool.on('error', (err) => {
            console.log('idle client error', err.message, err.stack);
        });


        // Ensure APK Unpack Root exists.
        fs.ensureDirSync(config.apk_unpack_root);
        this.ensureValidUnpackFailureLogfile();
    }

    // export the query method for passing queries to the pool
    query(text, values) {
        try {
            if (values) {
                console.log('query:', text, values);
            }
            else {
                console.log('query:', text);
            }

            return this.pool.query(text, values);
        }
        catch (err) {
            console.log('Error With Postgres Query');
            throw err;
        }
    }

    async getLatestAppVersion() {
        try {
            let res = await this.query(`
                select app_versions.id, app_versions.app, a.max
                    from app_versions, (
                            select app, max(last_dl_attempt)
                                from app_versions
                                    where downloaded
                                    and last_dl_attempt >= $1
                                    and last_dl_attmept <= $2
                                    group by app
                        ) as a
                    where a.app = app_versions.app
                    and downloaded
                    and app_versions.last_dl_attempt >= a.max;
                    and app_versions.last_dl_attempt >= $1
                    and app_versions.last_dl_attempt <= $2
                `,
                [this.minDate, this.maxDate]
            )
            return res.rows;
        }
        catch (err) {
            console.log(`Error retrieving package names from the DB. Error: ${err}`);
        }
    }

    async getLatestAppVersions() {
        try {
            let res = await this.query(`
                select id, app from app_versions
                    where downloaded
                    and last_dl_attempt >= $1
                    and last_dl_attempt <= $2`,
                [this.minDate, this.maxDate]
            )
            return res.rows;
        }
        catch (err) {
            console.log(`Error retrieving package names from the DB. Error: ${err}`);
        }
    }

    async getLatestAppVersionsFiltered() {

    }

    async getAllAppVersionsFiltered() {

    }

    async getAppVersionIDs() {
        if (this.appPackageList.length == 0 && this.useLatestAppVerions) {
            return await this.getLatestAppVersions();
        }

        if (this.appPackageList.length == 0 && !this.useLatestAppVerions) {
            return await this.getAllAppVersions();
        }

        if (this.appPackageList.length != 0 && this.useLatestAppVerions) {
            return await this.getLatestAppVersionsFiltered();
        }

        if (this.appPackageList.length != 0 && !this.useLatestAppVerions) {
            return await this.getAllAppVersionsFiltered();
        }
    }

    async selectAppVersionDetails(appID) {
        try {
            let res = await this.query("select * from app_versions where id=$1", [appID]);
            return res.rows[0];
        }
        catch (err) {
            console.log(`Error selecting app version ${appID}. Error: ${err}`);
        }
    }

    getAPKPath(appInfo) {
        let appPath = '';

        if (appInfo.apk_location) {
            appPath = `${appInfo.apk_location}/${appInfo.app}.apk`;
        }
        else {
            let apkDirectory = [
                config.apk_root,
                appInfo.app,
                appInfo.store,
                appInfo.region,
                appInfo.ver
            ].join('/');
            appPath = `${apkDirectory}/${appInfo.app}.apk`;
        }
        return appPath;
    }

    ensureValidUnpackFailureLogfile() {
        if (!fs.existsSync(config.unpack_failure_logfile)) {
            fs.writeFileSync(
                config.unpack_failure_logfile,
                JSON.stringify({ failedApps: [] }),
                'utf-8'
            )
        }
        try {
            require(config.unpack_failure_logfile);
        }
        catch (err) {
            console.log(`Logfile Invalid. Error: ${err}`);
            throw err;
        }
    }

    logUnpackFailure(appInfo, err) {
        let errLog = require(config.unpack_failure_logfile);
        appInfo.failureInfo = {
            failureDate: new Date(Date.now()).toLocaleString(),
            analyserName: this.analyserName,
            analysisBy: this.analysisBy,
            failureError: err
        }

        errLog.failedApps.push(appInfo);
        const errLogStr = JSON.stringify(errLog, null, 2);
        fs.writeFileSync(config.unpack_failure_logfile, errLogStr, 'utf-8');
    }

    async unpackAPK(appInfo, keepDex = true) {
        console.log(`Unpacking App for ${keepDex ? 'Manifest and Dex' : 'smali files'}: ${appInfo.app}`);
        const apkPath = this.getAPKPath(appInfo);
        try {
            const { stdout, stderr } = await bashExec(
                `apktool d ${apkPath} -o ${config.apk_unpack_root}/${appInfo.app} -f ${keepDex ? '-s' : ''}`);
        }
        catch (err) {
            console.log(`Critial Error Using APK Tool. Error: ${err}`);
            this.logUnpackFailure(appInfo, err);
            return false;
        }
        return true;
    }

    removeAPKUnpack(appInfo) {
        console.log(`removing APK Unpack: ${appInfo.app}`);
        fs.removeSync(`${config.apk_unpack_root}/${appInfo.app}`);
    }

    async getAPKManifest(appInfo) {
        console.log(`Loading App Mainfest: ${appInfo.app}`);
        const manifest = fs.readFileSync(`${config.apk_unpack_root}/${appInfo.app}/AndroidManifest.xml`).toString();
        return await parseString(manifest);
    }

    async getAPKSmali(appInfo) {
        console.log('Finding all smali file paths.')
        const smaliRoot = `${config.apk_unpack_root}/${appInfo.app}/smali/`;
        const { stdout, stderr } = await bashExec(
            `find ${smaliRoot} -name '*.smali'`,
            { maxBuffer: Infinity }
        );
        if (stderr) {
            console.log(stderr);
        }

        const paths = stdout.split('\n');

        const packages = paths.map((path) => path.replace(smaliRoot, '').replace('.smali', '').replace(/\//g, '.'));

        const smaliInfo = {
            smaliPaths: paths,
            packages: packages
        }

        return smaliInfo
    }

    async getAPKDex(appInfo) {

        const dexFiles = fs.readdirSync(
            `${config.apk_unpack_root}/${appInfo.app}`
        ).filter((fileName) => fileName.endsWith('.dex'));

        console.log(`Number of Dex Files found: ${dexFiles.length}`);

        let dex = "";

        for (const dexFile of dexFiles) {
            const { stdout, stderr } = await bashExec(
                `strings -n 11 ${config.apk_unpack_root}/${appInfo.app}/${dexFile}`,
                { maxBuffer: Infinity }
            );
            dex = dex.concat("\n").concat(stdout);
        }
        return dex;
    }

    async analyseApp() {
        return;
    }

    async storeAnalysisResults(appInfo, results) {
        if (!results) {
            console.log(`No results provided.`);
            return;
        }
        try {
            await this.query(
                `insert into ad_hoc_analysis(app_id, analyser_name, analysis_by, results) values ($1,$2,$3,$4)`,
                [
                    appInfo.id,
                    this.analyserName,
                    this.analysisBy,
                    results
                ]
            )
        }
        catch (err) {
            console.log(`Error inserting results into the database. AppID: ${appInfo.id}. App Package Name: ${appInfo.app}. Error: ${err}`);
        }
    }

    verifyAnalysisMethodParameters() {
        const methodString = this.analyseApp.toString();
        let args = [];
        try {
            args = methodString.match(/\(\s*([^)]+?)\s*\)/)[1].split(', ');
        }
        catch (err) {
            console.log(`Unable to verify analysis method has valid parameters. Error: ${err}`)
            return false;
        }

        if (args.length != 3) {
            console.log(`Invalid number of parameters on the implemented 'analyseApp' method. Expected 3, found ${args.length}`);
            return false;
        }

        if (args[0] != 'manifest') {
            console.log(`Invalid first parameter name for the implemented 'analyseApp' method. Expected 'manifest', found ${args[0]}`);
            return false;
        }

        if (args[1] != 'dex') {
            console.log(`Invalid second parameter name for the implemented 'analyseApp' method. Expected 'dex', found ${args[1]}`);
            return false;
        }

        if (args[2] != 'smali') {
            console.log(`Invalid third parameter name for the implemented 'analyseApp' method. Expected 'smali', found ${args[2]}`);
            return false;
        }

        console.log(`Implemented 'analyseApp' method passes validation checks.`);
        return true;
    }

    async performAnalysis() {

        const isAnalysisMethodValid = this.verifyAnalysisMethodParameters();
        if (!isAnalysisMethodValid) {
            console.log(`Analysis Method Invalid.`);
            return isAnalysisMethodValid;
        }

        const rows = await this.getAppVersionIDs();
        for (const row of rows) {
            console.log(`Analysing AppID: ${row.id}`);
            const appInfo = await this.selectAppVersionDetails(row.id)

            let successfulUnpack = await this.unpackAPK(appInfo)

            if (successfulUnpack) {

                const mainfest = await this.getAPKManifest(appInfo);
                const classDex = await this.getAPKDex(appInfo);

                await this.unpackAPK(appInfo, false);
                const smalis = await this.getAPKSmali(appInfo);

                const results = await this.analyseApp(mainfest, classDex, smalis);

                await this.storeAnalysisResults(appInfo, results);

                this.removeAPKUnpack(appInfo);

            }
        }
    }
}

module.exports = Sherlock;