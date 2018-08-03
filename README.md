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
Sherlock cannot find the 3 expected parameters `manifest`, `dexLines`, and `smali` in
that exact spelling, capitalisation, and order, the script will not exectute.

Sherlock is expecting a JSON object to be returned from this method. Thus, the results
from any analysis of the `manifest`, `dexLines`, and `smali` parameters should be put
into a JSON Object format. This is because Sherlock will then try to insert the results
into the XRay database.

## Parameters

### `manifest`



### `dexLines`



### `smali`