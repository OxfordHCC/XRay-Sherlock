# XRay-Sherlock

## Introduction

Sherlock is an interface that serves the purpose of you with a means of processing a set
of android APKs found in the XRay App Observatory.

In order to begin using Sherlock, all you need to do is 'require' it in your project.

Example
```js
const Sherlock = require('../sherlock/sherlock');
```

The above example will allow you to include the Sherlock class in your project, if you
have created an analysis script in the `nodejs/adhoc/` directory.

In order to implement the Sherlock interface, you are required extend the Sherlock class,
and then define one function.

```js
class CustomAnalyser extends Sherlock {

    async analyseApp(manifest, dexlines, smali) {...}

}

```

The `analyseApp` function is what is executed for each android APK that is unpacked. The
parameters of the function are fixed, and must be present in the implemented method. If
Sherlock cannot find the 3 expected parameters `manifest`, `dex`, and `smali` in
that exact spelling, capitalisation, and order, the script will not exectute.

Sherlock is expecting a JSON object to be returned from this method. Thus, the results
from any analysis of the `manifest`, `dex`, and `smali` parameters should be put
into a JSON Object format. This is because Sherlock will then try to insert the results
into the XRay database.

## Parameters

### First: `manifest`

The Android Manifest describes information essential for  the buidling of an Android Project. It includes information about what permissions the app requires, as well as declarations of components within the app.

The `manifest`  parameter will hold a JSON object equivalent of the `AndroidManifest.xml` that was unpacked from the APK.

#### Usage Example

You might want to extract the permissions that a given app requests, that can be done by accessing the `'uses-permission'` array within the `'manifest'` element.

```js
const permissions = manifest['manifest']['uses-permission'].map((perm) => perm['$']['android:name'])
```


### Second: `dex`

The classes.dex files in an APK are the `Dalvik Executables` that run on the `Dalvik Virtual Machine` on an Android device. In a `multidex` application, there may be more than one `classes.dex` file.

The `dex` parameter will hold a string representing all the `classes.dex` files found within an APK. An array of each line in `dex` obtained by splitting on `'\n'`

**Dex file format:**

     1. File Header
     2. String Table
     3. Class List
     4. Field Table
     5. Method Table
     6. Class Definition Table
     7. Field List
     8. Method List
     9. Code Header
    10. Local Variable List

A nice description can be found on [StackOverflow](https://stackoverflow.com/questions/7750448/what-are-dex-files-in-android).

#### Example Usage

You may wish to extract the hostnames and IP Addresses that are present within an APK. Using regex, you can achieve somewhat comprehensive results with ease.

```js
const regex = /((?:(http|https|Http|Https|rtsp|Rtsp):\/\/(?:(?:[a-zA-Z0-9\$\-\_\.\+\!\*\'\(\)\,\;\?\&\=]|(?:\%[a-fA-F0-9]{2})){1,64}(?:\:(?:[a-zA-Z0-9\$\-\_\.\+\!\*\'\(\)\,\;\?\&\=]|(?:\%[a-fA-F0-9]{2})){1,25})?\@)?)?((?:(?:[a-zA-Z0-9][a-zA-Z0-9\-]{0,64}\.)+(?:(?:aero|arpa|asia|a[cdefgilmnoqrstuwxz])|(?:biz|b[abdefghijmnorstvwyz])|(?:cat|com|coop|c[acdfghiklmnoruvxyz])|d[ejkmoz]|(?:edu|e[cegrstu])|f[ijkmor]|(?:gov|g[abdefghilmnpqrstuwy])|h[kmnrtu]|(?:info|int|i[delmnoqrst])|(?:jobs|j[emop])|k[eghimnrwyz]|l[abcikrstuvy]|(?:mil|mobi|museum|m[acdghklmnopqrstuvwxyz])|(?:name|net|n[acefgilopruz])|(?:org|om)|(?:pro|p[aefghklmnrstwy])|qa|r[eouw]|s[abcdeghijklmnortuvyz]|(?:tel|travel|t[cdfghjklmnoprtvwz])|u[agkmsyz]|v[aceginu]|w[fs]|y[etu]|z[amw]))|(?:(?:25[0-5]|2[0-4][0-9]|[0-1][0-9]{2}|[1-9][0-9]|[1-9])\.(?:25[0-5]|2[0-4][0-9]|[0-1][0-9]{2}|[1-9][0-9]|[1-9]|0)\.(?:25[0-5]|2[0-4][0-9]|[0-1][0-9]{2}|[1-9][0-9]|[1-9]|0)\.(?:25[0-5]|2[0-4][0-9]|[0-1][0-9]{2}|[1-9][0-9]|[0-9])))(?:\:\d{1,5})?)(\/(?:(?:[a-zA-Z0-9\;\/\?\:\@\&\=\#\~\-\.\+\!\*\'\(\)\,\_])|(?:\%[a-fA-F0-9]{2}))*)?(?:\b|$)/gi;

const urls = dex.split('\n').map((line) => line.match(regex)).reduce((a,b) => a.concat(b), []).filter((match) => match);

```

### Third: `smali`

Decompiling `classes.dex` produces a set of `.smali` files. Each smali file represents the assembly for a single package within the APK. The code within a smali file is in the assembly language for the DalvikVM.

The `smali` parameter will provide access to a JSON object consisting of 2 structures. `smaliPaths` contains an array of paths to all smali files within the APK, and `packages` contains an array of the names of each package that a smali file represents. The JSON takes the following structure:

```json
{
    "smaliPaths" : [
        "/tmp/xray/unpack/smali/com/google/ads/consent",
        ...
    ],
    "packages" : [
        "com.google.ads.consent"
        ...
    ]

}
```

#### Example Usage

You may wish to search for specific packages that are used within an APK, a possible usage would be to check if an application uses the Google Ads package, as well as the Google Ads Consent package.

```js
        const hasGoogleConsent = smali.packages.some((name) => name.includes('com.google.ads.consent'));
        const hasGoogleAds = smali.packages.some((name) => name.includes('com.google.ads'));

```