# PSERA: build an IPA from Windows using Codemagic

This guide is for personal testing on your own iPhone. You use Windows to upload
the project and start a cloud Mac build. The build creates `PSERA-unsigned.ipa`;
AltStore Classic signs and installs it using your Apple account.

**The provided download is a source/configuration ZIP, not a compiled IPA.**
The cloud workflow and native iPhone installation have not been run here.
PSERA remains an offline demo with sample products and local demo checkout.

## 1. Get the accounts and tools

You need a Windows laptop, an iPhone running iOS 15 or later that is compatible
with the current AltStore Classic release, a USB cable,
internet, a free Apple account, a GitHub account and a Codemagic personal account.

Install [GitHub Desktop](https://desktop.github.com/) on Windows. You do not need
Flutter, Xcode or a Mac installed locally for these steps.

Codemagic currently gives personal accounts 500 free macOS M2 minutes per month.
Use the personal account and M2 machine, keep within the allowance, and do not
enable paid usage if you want to avoid charges. Team accounts have different
terms. Check https://docs.codemagic.io/billing/pricing/ before starting.

## 2. Extract the download

Right-click `PSERA-Windows-iPhone-build.zip` in File Explorer and choose
**Extract All**. Open the extracted `psera` folder.

The important files are:

| File | Purpose |
| --- | --- |
| `pubspec.yaml` | Flutter app and dependencies |
| `codemagic.yaml` | Cloud build settings |
| `scripts/package_unsigned_ipa.sh` | Packages the compiled device app |
| `scripts/verify_ipa.py` | Checks the IPA layout and native iOS target |
| `ios/` | Xcode project |
| `lib/`, `assets/`, `test/` | App source, images/fonts and tests |

## 3. Create your private repository

Open GitHub Desktop and sign in to GitHub. Choose **File → New repository**.
Name it `psera` and choose a local parent folder. Create the repository, then use
**Repository → Show in Explorer** to open its newly created folder.

Copy the **contents** of the extracted `psera` folder into this repository folder.
Do not copy the enclosing `psera` folder into it. If asked about replacing the
new repository's README or ignore file, use the project's supplied files.

The repository root must contain both `codemagic.yaml` and `pubspec.yaml`.
`ios/`, `lib/` and `scripts/` must also be directly inside that root.

## 4. Upload the source to GitHub

Return to GitHub Desktop. The copied files should appear as changes.
Enter a commit summary such as `Add PSERA app and iPhone cloud build` and click
**Commit to main** (or the branch name shown).

Click **Publish repository**, keep **Keep this code private** selected, and publish.
Open the repository on GitHub and confirm `codemagic.yaml` and `pubspec.yaml`
are visible on the first file-list page. Upload the extracted source files,
not the ZIP or an APK.

## 5. Connect Codemagic

Open https://codemagic.io/ in your Windows browser and create/sign in to your
personal account. Connect GitHub and grant access to the `psera` repository.
Choose **Add application**, select the repository and finish adding it.

Use **codemagic.yaml / YAML configuration**. If it is not detected, select your
branch and use **Check for configuration file**. The file must be named exactly
`codemagic.yaml` at the repository root.

## 6. Select the prepared workflow

Select the workflow named:

**PSERA iPhone - unsigned IPA for AltStore**

Its ID is `psera-ios-unsigned`. It uses macOS M2, Flutter 3.47.5, the latest stable
Xcode offered by Codemagic, and a 90-minute build timeout. The timeout is a limit,
not an estimated build time.

No Apple signing certificates, App Store Connect API keys, Apple passwords or
paid Apple membership are needed for this unsigned build. Do not add them to this
workflow. Signing happens on your own devices through AltStore afterward.

## 7. Start the build

Choose **Start new build**, select your branch and the workflow, and start it.
Leave the YAML workflow's machine selection as M2.

The workflow gets dependencies, runs Flutter analysis/tests, compiles a release
iOS device app with `--no-codesign`, packages it and checks the archive. It rejects
missing app output or a simulator binary. There is no automatic publishing.

If a step fails, open that step's log. Fix the error before attempting installation;
a ZIP of source files renamed to `.ipa` is not an app.

## 8. Download the actual IPA

After a successful build, open its **Artifacts** section and download:

- `PSERA-unsigned.ipa` — the compiled app awaiting device signing.
- `PSERA-unsigned.ipa.sha256` — checksum for the downloaded file.
- `BUILD-INFO.txt` — version, bundle ID and native target information.

Keep the `.ipa` extension. It cannot be installed by simply tapping it in Safari.

## 9. Install AltServer on Windows

Follow the current official Windows guide:
https://faq.altstore.io/altstore-classic/how-to-install-altstore-windows

Install its required Apple iTunes/iCloud components using the installers linked
there, then download and install **AltServer for Windows**. Launch AltServer.
Use **AltStore Classic**, which supports this Windows sideloading route.

## 10. Install AltStore on your iPhone

Connect and unlock your iPhone. Trust the computer when prompted and enable
Wi-Fi syncing in iTunes. From AltServer's Windows system-tray menu choose
**Install AltStore → your iPhone**.

Enter your Apple account details in AltServer's own prompt. Complete device
trust and, on iOS 16 or later, Developer Mode setup as directed by the official
guide. Never put your Apple password into GitHub or `codemagic.yaml`.

## 11. Import PSERA into AltStore

Download your compiled `PSERA-unsigned.ipa` onto your iPhone, or transfer it into
the iPhone's Files app. Keep AltServer running and your devices connected by USB
or on the same network for the AltStore process.

Open **AltStore → My Apps**, use its add/import IPA control, and select the file.
Let AltStore sign and install it. Open PSERA and test browsing, wishlist, cart
and demo checkout. This workflow uses release mode, so it does not require
Flutter's debug JIT to run.

Installation still depends on your iOS version, available sideloading slots,
Apple account and AltStore compatibility; it has not been verified on your phone.

## 12. Refresh the app

With a free Apple account, sideloaded apps expire after seven days. Use AltStore's
**Refresh All** while AltServer is reachable before that period ends. There is a
three-active-app limit, including AltStore itself.

This is a personal-testing route. Sharing via TestFlight or distributing through
the App Store requires the corresponding Apple developer membership and signing.

## Troubleshooting

| Problem | Action |
| --- | --- |
| Codemagic cannot find YAML | Put `codemagic.yaml` at the GitHub repository root; scan the correct branch. |
| `pubspec.yaml` missing | Move the contents of the inner `psera` folder up to the repository root. |
| Flutter 3.47.5 cannot be installed | Check Codemagic's available Flutter versions. Use a supported stable SDK satisfying Dart >=3.13.4 and <4.0.0, then rerun analysis/tests. Do not silently lower the SDK requirement. |
| Native compilation fails | Download the Xcode log or copy its first actual error. The native project has not been compiled in this workspace. |
| No IPA artifact | The compilation or packaging step failed; inspect its log. |
| Cannot find AltServer | Keep it running; reconnect USB or use the same network and follow AltStore's connection troubleshooting. |
| App limit reached | Remove/deactivate another sideloaded app before importing PSERA. |
| Expired app | Refresh through AltStore/AltServer; follow its reinstall steps if AltStore itself expired. |

## Updating PSERA later

Edit the project, commit the changes in GitHub Desktop, and click **Push origin**.
Start the Codemagic workflow again and install the new IPA through AltStore.
Keep a consistent Apple account and bundle ID where possible. Reinstallation
behaviour and local data retention must be checked on your device.

## What has been checked here

The YAML can be parsed and the shell scripts can be syntax-checked on Linux.
The archive verifier can be checked against malformed input. Earlier Flutter
app validation passed 13 tests. **This cloud workflow, the native iOS build,
Apple signing and iPhone installation have not been executed here.**

Official references:

- Codemagic configuration: https://docs.codemagic.io/yaml-quick-start/building-a-flutter-app/
- Free allowance: https://docs.codemagic.io/billing/pricing/
- GitHub Desktop: https://docs.github.com/en/desktop/overview/getting-started-with-github-desktop
- AltStore Windows setup: https://faq.altstore.io/altstore-classic/how-to-install-altstore-windows
- AltStore refresh/limits: https://faq.altstore.io/altstore-classic/your-altstore
