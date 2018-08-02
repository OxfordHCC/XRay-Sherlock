const Sherlock = require('../sherlock/sherlock');

const regex = /((?:(http|https|Http|Https|rtsp|Rtsp):\/\/(?:(?:[a-zA-Z0-9\$\-\_\.\+\!\*\'\(\)\,\;\?\&\=]|(?:\%[a-fA-F0-9]{2})){1,64}(?:\:(?:[a-zA-Z0-9\$\-\_\.\+\!\*\'\(\)\,\;\?\&\=]|(?:\%[a-fA-F0-9]{2})){1,25})?\@)?)?((?:(?:[a-zA-Z0-9][a-zA-Z0-9\-]{0,64}\.)+(?:(?:aero|arpa|asia|a[cdefgilmnoqrstuwxz])|(?:biz|b[abdefghijmnorstvwyz])|(?:cat|com|coop|c[acdfghiklmnoruvxyz])|d[ejkmoz]|(?:edu|e[cegrstu])|f[ijkmor]|(?:gov|g[abdefghilmnpqrstuwy])|h[kmnrtu]|(?:info|int|i[delmnoqrst])|(?:jobs|j[emop])|k[eghimnrwyz]|l[abcikrstuvy]|(?:mil|mobi|museum|m[acdghklmnopqrstuvwxyz])|(?:name|net|n[acefgilopruz])|(?:org|om)|(?:pro|p[aefghklmnrstwy])|qa|r[eouw]|s[abcdeghijklmnortuvyz]|(?:tel|travel|t[cdfghjklmnoprtvwz])|u[agkmsyz]|v[aceginu]|w[fs]|y[etu]|z[amw]))|(?:(?:25[0-5]|2[0-4][0-9]|[0-1][0-9]{2}|[1-9][0-9]|[1-9])\.(?:25[0-5]|2[0-4][0-9]|[0-1][0-9]{2}|[1-9][0-9]|[1-9]|0)\.(?:25[0-5]|2[0-4][0-9]|[0-1][0-9]{2}|[1-9][0-9]|[1-9]|0)\.(?:25[0-5]|2[0-4][0-9]|[0-1][0-9]{2}|[1-9][0-9]|[0-9])))(?:\:\d{1,5})?)(\/(?:(?:[a-zA-Z0-9\;\/\?\:\@\&\=\#\~\-\.\+\!\*\'\(\)\,\_])|(?:\%[a-fA-F0-9]{2}))*)?(?:\b|$)/gi;

class ExampleAdHoc extends Sherlock {

    /**
     * Analyse Unpacked APK files.
     *
     * Overrides the parent process APK Manifest method.
     *
     * @param {JSON equivalent of the AndroidManifest.xml file.} mainfest
     * @param {A string array of lines found in each of the classes.dex files} dexLines
     * @param {} smali
     *
     * @returns {The results of analysis as a JSON object.}
     */
    async analyseApp(manifest, dexLines, smali) {
        // Build a JSON object of the results
        console.log(`Using Example Analysis App method`)

        // Using the classes.dex
        const urls = dexLines.map((line) => line.match(regex)).reduce((a,b) => a.concat(b), []).filter((match) => match);

        // using the AndroidManifest.xml
        const permissions = manifest['manifest']['uses-permission'].map((perm) => perm['$']['android:name'])
        const jsonResult = {
            httpLines : urls,
            httpCount : urls.length,

            permission : permissions,
            permissionCount : permissions.length
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