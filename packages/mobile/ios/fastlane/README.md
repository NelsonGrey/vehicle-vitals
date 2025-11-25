fastlane documentation
----

# Installation

Make sure you have the latest version of the Xcode command line tools installed:

```sh
xcode-select --install
```

For _fastlane_ installation instructions, see [Installing _fastlane_](https://docs.fastlane.tools/#installing-fastlane)

# Available Actions

## iOS

### ios distribute

```sh
[bundle exec] fastlane ios distribute
```

Distribute iOS app to Firebase App Distribution

### ios debug

```sh
[bundle exec] fastlane ios debug
```

Distribute debug build to internal testers

### ios sync_signing

```sh
[bundle exec] fastlane ios sync_signing
```

Sync code signing certificates

### ios certificates_development

```sh
[bundle exec] fastlane ios certificates_development
```

Generate development certificates

### ios certificates_appstore

```sh
[bundle exec] fastlane ios certificates_appstore
```

Zero-touch certificate management - automatically handles certificate acquisition and sharing

### ios certificates_all

```sh
[bundle exec] fastlane ios certificates_all
```



### ios build_development

```sh
[bundle exec] fastlane ios build_development
```

Build iOS app for development without code signing

### ios beta

```sh
[bundle exec] fastlane ios beta
```

Upload to TestFlight

----

This README.md is auto-generated and will be re-generated every time [_fastlane_](https://fastlane.tools) is run.

More information about _fastlane_ can be found on [fastlane.tools](https://fastlane.tools).

The documentation of _fastlane_ can be found on [docs.fastlane.tools](https://docs.fastlane.tools).
