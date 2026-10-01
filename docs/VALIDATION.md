# Verification and current limitations

## Completed

- Flutter 3.47.5 / Dart 3.13.4 used for the project.
- `flutter analyze --no-pub`: no issues.
- `flutter test --no-pub`: 13 tests pass, including an iOS-platform widget check with notch and home-indicator insets.
- Server pure calculation/security tests: 5 tests pass using Node's test runner.
- `node --check`: backend function and domain modules parse successfully.
- Flutter web release compilation succeeds as an additional cross-platform compilation check.
- Five screenshots were rendered from the actual Flutter widgets, with the bundled fonts and original local image: home, shop, product, cart and checkout. They are in `docs/previews/`.
- A responsive test checks home, catalogue, product, cart and checkout at widths 320, 390 and 768 logical pixels with no rendering exceptions.

## Test coverage

The Flutter tests check navigation from home to catalogue to product and add-to-bag; demo checkout through order confirmation; invalid address inputs; stock aggregated across polish variants; coupon cap and shipping threshold; local persistence; wishlist moves; immutable order pricing snapshots; stock reductions; unavailable products; default-address deletion and recent search deduplication.

The server tests check rejection of invalid quantities/variants/stock, canonical price calculation that ignores client prices, address format and HMAC signatures tied to the correct gateway order ID.

## Limits

- No physical Android device, Android emulator, iPhone or iPad has been used for runtime testing here.
- iOS requires a separate Mac/Xcode build and signing. No IPA has been generated.
- The iOS icon set, plist/storyboard XML and automatic-signing configuration have been checked on Linux. The Mac build script passes shell syntax checks and rejects non-macOS hosts. No native iOS compilation has been performed.
- Firebase rules and callable functions have not been run against Firebase emulators or a deployed project. Backend tests are isolated domain tests, not integration/security-rule certification.
- No live Firebase Auth, OTP, real payment, refund, webhook, shipping, push notification or production admin session has been tested.
- The app is an offline demo and remains clearly labelled. All orders, profile entries and catalogue edits are local samples.
- Screen previews generated with Flutter tests are not photographs/screenshots from a physical phone.

## Windows cloud-build configuration

- `codemagic.yaml` parses successfully and its shell steps pass Bash syntax checks.
- The IPA packaging script passes syntax checks and rejects this Linux host without producing an IPA.
- The archive checker rejects a simulator target, unsafe ZIP paths and an APK. Synthetic fixtures were used only for parser checks and were discarded; they are not compiled app artifacts.
- The configuration compiles a release iOS device app on Codemagic, then packages the real compiled app as an unsigned IPA for personal signing through AltStore.
- No Codemagic workflow, native iOS compilation, Apple signing or AltStore installation has been executed here.

## Android build results

- Gradle `assembleDebug`: successful.
- Gradle `assembleRelease`: successful.
- Gradle `bundleRelease`: successful.
- Both APK signatures pass Android `apksigner verify`.
- AAB passes JDK `jarsigner -verify` (development certificate).
- Package inspected with Android `aapt`: `com.psera.shop`, name PSERA, version 1.0.0, minimum API 24, target API 36, native ARM64, ARMv7 and x86-64 libraries.
- Debug APK is approximately 147 MiB; release-mode demo APK is approximately 51 MiB; test AAB is approximately 50 MiB.

All supplied Android builds use a development certificate. The release-mode demo APK is installable but is not a production store submission. The AAB is a test artifact, not a Play-ready signed production bundle. Configure your own upload key, complete live integrations and perform device testing before publication.
