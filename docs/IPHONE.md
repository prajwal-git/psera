# PSERA for iPhone and iPad

This package contains the PSERA Flutter source and its native Xcode project.
It is an offline shopping demo. It is **not an installable IPA** and has not
been compiled with Xcode or tested on a physical iPhone in this Linux workspace.

## What is included

- Home, categories, search, filters, product details and variants.
- Persistent local cart, wishlist, addresses and demo order history.
- Demo checkout, catalogue management and configurable support links.
- Cream, plum and gold design, bundled fonts and offline collection image.
- PSERA iOS app icon and native launch screen.
- Native Swift app/scene delegates and Flutter Swift Package Manager integration.
- iPhone/iPad deployment target: iOS 15.0 or later. Bundle ID: `com.psera.shop`.
- Shared shopping tests and iOS-platform widget tests for notches and home indicators.

The minimum version is a project setting, not a guarantee that every device has
been tested. All orders and payments in this version are local demos.

## Build on a Mac

1. Install full Xcode and its iOS platform components. Open Xcode once to complete
   setup and accept its licence. Install Flutter **3.47.5** (Dart **3.13.4**) and
   ensure `flutter` is on your shell's PATH.
2. Extract this ZIP and open Terminal in the `psera` folder, beside `pubspec.yaml`.
3. Run `flutter doctor` and resolve any iOS toolchain issues.
4. Prepare generated files and open the Xcode workspace:

   ```sh
   bash scripts/ios.sh prepare
   ```

   Flutter recreates `Generated.xcconfig`, the plugin registrant and ephemeral
   Swift package files for your Mac. These generated files are deliberately
   excluded from this source package. This Flutter project uses Swift Package
   Manager; the locked iOS plugins have Swift package definitions.
5. In Xcode select **Runner → Signing & Capabilities**. Enable automatic signing,
   select your Apple Team, and choose a bundle identifier your account controls.
   `com.psera.shop` is a proposed ID; its registration has not been verified.
6. Select an iPhone simulator or a connected iPhone, then press **Run**. Follow
   Xcode's device pairing, signing and Developer Mode instructions if prompted.

To compile for the simulator without device signing:

```sh
bash scripts/ios.sh simulator
```

The output is `build/ios/iphonesimulator/Runner.app`. It is a simulator binary,
not a file you can install on an iPhone. Use `flutter devices` then
`flutter run -d DEVICE_ID` to run the app on your selected simulator/device.

## Create an IPA for TestFlight

After configuring signing and the app record with your enrolled Apple Developer
account, run:

```sh
bash scripts/ios.sh ipa
```

Flutter builds an archive in `build/ios/archive/` and attempts to export a signed
IPA into `build/ios/ipa/`. If the archive succeeds but export fails, open it in
Xcode Organizer, fix the signing issue and use **Distribute App**. Upload through
Xcode Organizer or Transporter, then make the processed build available through
TestFlight in App Store Connect. This script does not upload or publish the app.

An IPA is tied to its signing and distribution method. Sending an arbitrary IPA
by WhatsApp or downloading it in Safari does not make it installable. Development
and ad hoc distribution require appropriate provisioning for the target devices.
Use TestFlight for your normal tester installation flow.

Do not send private keys or account passwords in chat. Configure signing on your
Mac or within a build service's secure credentials settings.

## Before using it as a live shop

Replace demo inventory, connect the backend/authentication/payment services,
provide your store policies and support details, and test on real devices.
See `BACKEND.md` and `VALIDATION.md`. No OTP, payment processing, push notifications
or live order fulfilment is connected in this demo.

The locked shared-preferences plugin includes its Apple privacy manifest for
UserDefaults access. Inspect the generated archive's privacy report and update
App Store privacy answers for the final integrations. The current demo stores
sample data locally and does not transmit orders to PSERA.

## Verification performed here

Flutter analysis and widget/store tests can run on Linux. iOS configuration,
storyboard XML and icon assets can also be checked here. Native compilation,
Apple signing, installation and TestFlight remain **unverified** until run on
a Mac with Xcode. A passing widget test does not verify native iOS plugins.

Official build reference: https://docs.flutter.dev/deployment/ios
