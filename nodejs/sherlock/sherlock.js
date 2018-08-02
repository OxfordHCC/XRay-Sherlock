const config = require('../config/config.json');
const pg = require('pg');
const fs = require('fs');

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

    // Database connection pool
    pool;

    // Name of the Analyser. Used to distinguish between results in the DB.
    analyserName;

    constructor(
        analyserName,
        maxDate = new Date(), // Need to Default to a date 1000 years in the future
        minDate = new Date(), // Need to Default to a date 1000 years in the past
        appPackageList = [],
        useLatestAppVerions = true
    ) {
        // Must be set.
        this.analyserName = analyserName

        // optional Params
        this.maxDate = maxDate;
        this.minDate = minDate;
        this.appPackageList = appPackageList;
        this.useLatestAppVerions = useLatestAppVerions;

        // DB setup
        const dbConfig = config.db_info;
        dbConfig.max = 10;
        dbCfg.idleTimeoutMillis = 30000;

        this.pool = new pg.Pool(dbConfig);
        this.pool.on('error', (err) => {
            console.log('idle client error', err.message, err.stack);
        });
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
            let res = this.query(`
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
            let res = this.query(`
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
            let res = this.query("select * from app_versions where id=$1", appID);
            return res.rows[0];
        }
        catch(err) {
            console.log(`Error selecting app version ${appID}. Error: ${err}`);
        }
    }

    async getAPKPath(appInfo) {
        let appPath = '';

        if(appInfo.apk_location) {
            appPath = `${appInfo.apk_location}/${appInfo.app}.apk`;
        }

    }

    async getAPK(apkPath) {

    }

    async unpackAPK(apk) {

    }

    async getAPKManifest(apk) {

    }

    async analyseApp(mainfest) {
        return;
    }

    async storeAnalysisResults(results) {

    }

    async performAnalysis() {
        const appPackageNames = await this.getAppVersionIDs();

        for(const pName of appPackageNames) {
            const apk = await this.getAPK(pName)
            await this.unpackAPK()
        }
    }
}

module.exports = Sherlock;