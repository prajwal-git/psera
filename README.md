# PSERA — jewellery shopping app

A real Flutter mobile project for Android and iOS, inspired by the supplied shopping flows, with an original cream, plum and gold design. This delivered version is an **offline demo**, not a live shop.

## Start here

For a Windows laptop and personal iPhone testing, see `docs/WINDOWS-FREE-IPHONE.md`.
The supplied `codemagic.yaml` builds on a cloud Mac and packages an unsigned IPA
for subsequent device signing through AltStore. This workflow has not been run here.

Install `PSERA-demo.apk` on a compatible Android phone (Android 7.0/API 24 or later, ARM or x86-64). Open the downloaded file, allow installation from that source if Android asks, and open **PSERA**. Security settings and manufacturer policies vary; the APK cannot be guaranteed to run on every Android device.

The demo needs no login, API key or internet connection for shopping. Use fictional profile and delivery details. Checkout creates a local demo order and collects no money.

An APK cannot be installed on an iPhone. The included `ios/` Xcode project needs a Mac, Xcode and appropriate Apple signing/provisioning. See `docs/IPHONE.md`; `bash scripts/ios.sh prepare` prepares the project on a Mac.

## Features implemented

- Three sliding collection banners, seven jewellery categories, featured and new-arrival sections.
- Catalogue of 12 original sample products; search by name, SKU, category and material; recent searches.
- Sort by recommendation, newest, price and demo featured popularity; filters for polish, price and stock.
- Product details, polish variants, quantity, image paging and zoom; care and demo delivery information.
- Saved wishlist; persistent shopping bag; stock limits across polish variants; removal and move to wishlist.
- WELCOME10 demo discount (10%, maximum ₹200); configurable flat shipping and free-shipping threshold.
- Local demo profile; saved addresses with edit, delete and default selection; Indian mobile/PIN format checks.
- Clearly labelled demo UPI, card and COD checkout; order confirmation, history, detail and status timeline.
- Local notifications from demo orders; Instagram link; configurable WhatsApp number.
- Demo store management: add/edit products, price and stock, hide a product, update order status and shipping/support settings.
- Empty states, offline operation, local persistence, tablet grids, bundled fonts, branded app icons.

## What is not connected

The app intentionally uses `lib/state/store.dart`, a local demo repository. It does not connect to Firebase or Razorpay. The profile is not authentication; it has no OTP verification, email/password login or password reset. The management screen is a public local demo feature, not a secured production admin panel. Notifications are local, not push notifications. No courier, serviceability API, real fulfilment, analytics or Crashlytics is connected.

`backend/` contains a Firebase/Firestore **test backend starter**, server-side calculation and inventory reservation, callable admin operations and Razorpay TEST payment verification. It is not deployed, integrated into the mobile app, or certified for live commerce. See `docs/BACKEND.md` for the integration work and credentials needed.

Real product photos, final specifications, shipping/returns policies and business details must replace sample content before launch. The sample illustrations and AI collection image do not depict PSERA's actual stock.

## Run from source

Verified toolchain: Flutter **3.47.5**, Dart **3.13.4**, JDK 17, Android SDK 36, build-tools 36.0.0, NDK 28.2.13676358. Install Flutter and Android Studio/SDK first.

```sh
flutter pub get
flutter run
flutter analyze
flutter test
flutter build apk --debug
flutter build apk --release
flutter build appbundle --release
```

The Gradle project uses a development certificate if `android/key.properties` is absent. Such release-mode APKs/AABs are for testing, not store submission. Configure your own signing key before publication. The supplied AAB is a test build.

## Project map

| Path | Purpose |
|---|---|
| `lib/main.dart` | App startup and storage error handling |
| `lib/models/` | Products, variants/cart lines, addresses, order snapshots |
| `lib/data/catalog.dart` | Original demo catalogue |
| `lib/state/store.dart` | Observable state and serial local persistence |
| `lib/ui/shop.dart` | Home, catalogue, search, filters, product details, wishlist |
| `lib/ui/shopping.dart` | Bag, coupon, checkout, orders |
| `lib/ui/account.dart` | Profile, addresses, notifications, support, demo management |
| `lib/ui/common.dart` | Theme, original jewellery illustration renderer and shared UI |
| `assets/` | Offline image and fonts |
| `android/`, `ios/` | Native platform projects |
| `backend/` | Test backend starter, rules and pure server calculation tests |
| `docs/` | Build, launch/integration guide, validation and actual rendered previews |

## Customise

Change the brand colours, serif typography and components in `lib/ui/common.dart`. Replace `assets/collection.jpg` with an authorised banner image. Replace the original demo entries in `lib/data/catalog.dart` or use the local demo management screen to try price/stock changes. Real image galleries require image URL fields and an image widget in place of `JewelleryArt`.

Open **You → Demo store management → Edit shipping and WhatsApp** to test shipping charges and support. Enter a number including country code without `+` (for example, a configured business number beginning with `91`). Leave it empty until you have a real support number. Product enquiries and catalogue links can be added when real product URLs exist.

Local data uses app preferences and is not encrypted. Reset it through **You → Demo store management → Reset demo data**. Uninstalling normally deletes app data; changing signing certificates may require uninstalling the earlier build.

## Validation

See `docs/VALIDATION.md` for the exact checks completed and limitations. This app has not been tested on physical Android/iOS devices and no iOS binary has been generated.
