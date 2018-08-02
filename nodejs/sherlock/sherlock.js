const config = require('../config/config.json');
const pg = require('pg');
const fs = require('fs-extra');
const util = require('util');
const bashExec = util.promisify(require('child_process').exec);
const parseString = util.promisify(require('xml2js').parseString);

const MAX_DATE = new Date('2070-01-01Z00:00:00:000');
const MIN_DATE = new Date('1970-01-01Z00:00:00:000');

class Sherlock {

    constructor(
        analyserName,
        analysisBy,
        maxDate= MAX_DATE,
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

        if(this.appPackageList.length == 0 && !this.useLatestAppVerions) {
            return await this.getAllAppVersions();
        }

        if(this.appPackageList.length != 0 && this.useLatestAppVerions) {
            return await this.getLatestAppVersionsFiltered();
        }

        if(this.appPackageList.length != 0 && !this.useLatestAppVerions) {
            return await this.getAllAppVersionsFiltered();
        }
    }

    async selectAppVersionDetails(appID) {
        try {
            let res = await this.query("select * from app_versions where id=$1", [appID]);
            return res.rows[0];
        }
        catch(err) {
            console.log(`Error selecting app version ${appID}. Error: ${err}`);
        }
    }

    getAPKPath(appInfo) {
        let appPath = '';

        if(appInfo.apk_location) {
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


    async unpackAPK(appInfo) {
        console.log(`Unpacking App: ${appInfo.app}`);
        const apkPath = this.getAPKPath(appInfo);
        const {stdout, stderr} = await bashExec(
            `apktool d -s ${apkPath} -o ${config.apk_unpack_root}/${appInfo.app} -f`        );
    }

    removeAPKUnpack(appInfo) {
        console.log(`removing APK Unpack: ${appInfo.app}`);
        fs.removeSync(`${config.apk_unpack_root}/${appInfo.app}`);
    }

    async getAPKManifest(appInfo) {
        console.log(`Loading App Mainfest: ${appInfo.app}`);
        const manifest =  fs.readFileSync(`${config.apk_unpack_root}/${appInfo.app}/AndroidManifest.xml`).toString();
        return await parseString(manifest);
    }

    getAPKSmali() {

    }

    async getAPKDex(appInfo) {

        const dexFiles = fs.readdirSync(
            `${config.apk_unpack_root}/${appInfo.app}`
        ).filter((fileName) => fileName.endsWith('.dex'));

        console.log(`Number of Dex Files found: ${dexFiles.length}`);

        let dexLines = [];

        for(const dex of dexFiles) {
            const { stdout, stderr } = await bashExec(
                `strings -n 11 ${config.apk_unpack_root}/${appInfo.app}/${dex}`,
                {maxBuffer: Infinity}
            );
            dexLines = dexLines.concat(stdout.split('\n'));
        }
        return dexLines;
    }

    async analyseApp(manifest, dexLines, smali) {
        console.log(`Default 'analyseApp' method called. Doing Nothing.`);
        return;
    }

    async storeAnalysisResults(appInfo, results) {
        if(!results) {
            console.log(`No results provided.`);
            return;
        }
        try{
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
        catch(err) {
            console.log(`Error inserting results into the database. AppID: ${appInfo.id}. App Package Name: ${appInfo.app}. Error: ${err}`);
        }
    }

    async performAnalysis() {
        const rows = await this.getAppVersionIDs();
        for(const row of rows) {
            console.log(`Analysing AppID: ${row.id}`);
            const appInfo = await this.selectAppVersionDetails(row.id)

            await this.unpackAPK(appInfo)

            const mainfest = await this.getAPKManifest(appInfo);
            const classDex = await this.getAPKDex(appInfo);
            const smalis   = this.getAPKSmali();

            const results = await this.analyseApp(mainfest, classDex, smalis);

            await this.storeAnalysisResults(appInfo, results);

            this.removeAPKUnpack(appInfo);
        }
    }
}

module.exports = Sherlock;