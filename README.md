# XRay-Sherlock

Sherlock is an interface that serves the purpose of you with a means of processing a set
of android APKs found in the XRay App Observatory.

In order to begin using Sherlock, all you need to do is 'require' it in your project.

Example
```
const Sherlock = require('../sherlock/sherlock);
```

The above example will allow you to include the Sherlock class in your project, if you
have created an analysis script in the `nodejs/adhoc/` directory.

In order to implement the Sherlock interface, you are required to define one function.

```
    async analyseApp(manifest, dexlines, smali) {...}
```

The `analyseApp` function is what is executed for each android APK that is unpacked.