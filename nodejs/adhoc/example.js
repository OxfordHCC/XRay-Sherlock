const Sherlock = require('../sherlock/sherlock');

const regex = /((?:(http|https|Http|Https|rtsp|Rtsp):\/\/(?:(?:[a-zA-Z0-9\$\-\_\.\+\!\*\'\(\)\,\;\?\&\=]|(?:\%[a-fA-F0-9]{2})){1,64}(?:\:(?:[a-zA-Z0-9\$\-\_\.\+\!\*\'\(\)\,\;\?\&\=]|(?:\%[a-fA-F0-9]{2})){1,25})?\@)?)?((?:(?:[a-zA-Z0-9][a-zA-Z0-9\-]{0,64}\.)+(?:(?:aero|arpa|asia|a[cdefgilmnoqrstuwxz])|(?:biz|b[abdefghijmnorstvwyz])|(?:cat|com|coop|c[acdfghiklmnoruvxyz])|d[ejkmoz]|(?:edu|e[cegrstu])|f[ijkmor]|(?:gov|g[abdefghilmnpqrstuwy])|h[kmnrtu]|(?:info|int|i[delmnoqrst])|(?:jobs|j[emop])|k[eghimnrwyz]|l[abcikrstuvy]|(?:mil|mobi|museum|m[acdghklmnopqrstuvwxyz])|(?:name|net|n[acefgilopruz])|(?:org|om)|(?:pro|p[aefghklmnrstwy])|qa|r[eouw]|s[abcdeghijklmnortuvyz]|(?:tel|travel|t[cdfghjklmnoprtvwz])|u[agkmsyz]|v[aceginu]|w[fs]|y[etu]|z[amw]))|(?:(?:25[0-5]|2[0-4][0-9]|[0-1][0-9]{2}|[1-9][0-9]|[1-9])\.(?:25[0-5]|2[0-4][0-9]|[0-1][0-9]{2}|[1-9][0-9]|[1-9]|0)\.(?:25[0-5]|2[0-4][0-9]|[0-1][0-9]{2}|[1-9][0-9]|[1-9]|0)\.(?:25[0-5]|2[0-4][0-9]|[0-1][0-9]{2}|[1-9][0-9]|[0-9])))(?:\:\d{1,5})?)(\/(?:(?:[a-zA-Z0-9\;\/\?\:\@\&\=\#\~\-\.\+\!\*\'\(\)\,\_])|(?:\%[a-fA-F0-9]{2}))*)?(?:\b|$)/gi;


/**
 *                               Example Ad Hoc
 *                               **************
 * This class serves as an example of how to extend and implement Sherlock.
 *
 * There is essentially only one method that needs to be implemented:
 *
 *          async analyseApp(manifest, dexlines, smali) {...}
 *
 * For each app that is unpacked and then analysed, this is the method that
 * is invoked and will then carry out the analysis.
 *
 * when searching for specific permissions in the manifest, snippets in the
 * classes.dex, or hunting through the smali files, this is the method that
 * you need to implement in order to do that.
 *
 * The analysApp method must have 3 parameters, the first is the AndroidManifest.xml
 * passed into the method as a JSON object. The second is an array of strings, each
 * string is a line found in the classes.dex file(s). The third is a JSON object
 * that contains the file paths for each smali file, as well as the equivalent
 * java package name for each file.
 *
 *                                  Manifest
 *                                  ********
 * The manifest param will contain things like permission information, and sometimes
 * even API keys.
 *
 *                                  dexLines
 *                                  ********
 * The dexLines param will contain evidence of hostnames and function calls.
 *
 *                                   smali
 *                                   *****
 * The smali param will contain information about the packages used in the application.
 *
 * More in depth searching can be performed on the smali files by opening and reading
 * the file at the provided path. None of the smali files will be removed until
 * after the results are entered into the database.
 *
 *                        Overriding getAppVersionIDs()
 *                        *****************************
 * You can also override any of the methods implemented in Sherlock if you so wish,
 * and it might be of use to override the 'getAppVersionIDs()' method, which returns
 * an array of id values found in the app_versions table.
 *
 * The version of the method implemented in sherlock utilises some built in flags
 * to provide some flexibility, the default behaviour of the method with the
 * default flag values is to select the app version ID for the latest version
 * of all apps in the app_versions table.
 */
class ExampleAdHoc extends Sherlock {

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
        console.log(`Using Example Analysis App method`)

        // Using the classes.dex
        //const urls = dexLines.map((line) => line.match(regex)).reduce((a,b) => a.concat(b), []).filter((match) => match);

        // using the AndroidManifest.xml
        //const permissions = manifest['manifest']['uses-permission'].map((perm) => perm['$']['android:name'])

        // using the smali info.
        const packages = smali.packages;
        const hasGoogleConsent = smali.packages.some((name) => name.includes('com.google.ads.consent'));
        const hasGoogleAds = smali.packages.some((name) => name.includes('com.google.ads'));
        const jsonResult = {
            // httpLines : urls,
            // httpCount : urls.length,

            // permission : permissions,
            // permissionCount : permissions.length,

            hasGoogleConsent : hasGoogleConsent,
            hasGoogleAds : hasGoogleAds ,
            packageCount : packages.length
        }

        // return the json object of results.
        return jsonResult
    }
}

function main() {
    const analyser = new ExampleAdHoc('Example','Adam');
    analyser.performAnalysis().catch(err => console.log(err));
}

main();