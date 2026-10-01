# Firebase and payments: test integration starter

## Delivered status

The mobile app runs completely offline with sample data. The source in `backend/` is a separate, undeployed starter for Firebase Cloud Functions, Firestore and Razorpay test payments. It is not automatically activated by adding credentials. The Flutter live repository/auth/payment SDK integration still needs to be implemented and tested.

The starter deliberately rejects Razorpay keys that do not begin with `rzp_test_`. Do not remove this guard until live payment handling, webhook reconciliation, refunds and device integration have been reviewed.

## Required accounts and configuration

1. A Firebase project with the billing plan needed for Cloud Functions, and Authentication, Firestore and Storage enabled.
2. Android registration for `com.psera.shop`, Android signing SHA fingerprints and the Firebase configuration file. iOS registration for the chosen bundle ID and corresponding Apple configuration file.
3. Enable phone and/or email/password authentication, configure test numbers, authentication quotas, region policy, abuse controls and account deletion.
4. Configure Firebase App Check. All included callable functions enforce App Check; use official debug tokens only for development/emulator testing.
5. A Razorpay account and **test** key ID/secret. Set them via Firebase Secret Manager, not in Flutter code.
6. Real product catalogue, tax/business rules, courier/serviceability integration, fulfilment contacts and final privacy/return policies.
7. Google Play/Apple Developer credentials for publication. Keep private keys out of source archives and chat.

## Prepare the starter backend

Install Node 22 and the Firebase CLI, authenticate locally, then:

```sh
cd backend
firebase use --add
cd functions
npm install
npm test
cd ..
firebase functions:secrets:set RAZORPAY_KEY_ID
firebase functions:secrets:set RAZORPAY_KEY_SECRET
firebase emulators:start
```

Configure credentials through the prompted secret commands locally. Set project-specific configuration via the Firebase CLI. No service account, Firebase admin credential or payment secret is bundled. Secret values must never be stored in public settings documents.

Test with emulators and staging first. Deploying this backend to your account is a separate operation and has not been performed:

```sh
firebase deploy --only functions,firestore:rules,firestore:indexes,storage
```

## Firestore data contract

Amounts are integer paise; `64900` means ₹649.

| Collection/path | Data and access |
|---|---|
| `products/{id}` | `sku`, `name`, `category`, `description`, `images`, `price`, `mrp`, `stock`, `polishes`, `active`, `featured`, `newArrival`; public active catalogue reads, callable admin writes |
| `categories/{id}` | Name, image URL, ordering; server-managed public reads |
| `banners/{id}` | Image URL, collection/category target, ordering; server-managed public reads |
| `settings/store` | Public-only `shippingFee`, `freeShippingAt`, support number; no secrets |
| `users/{uid}` | Owner-readable profile; allowed fields only; never store admin role here |
| `users/{uid}/addresses/{id}` | Customer address data, owner-only |
| `users/{uid}/wishlist/{id}` | Owner-only saved product references |
| `users/{uid}/cart/{id}` | Owner-only bag data; final prices never trusted from this collection |
| `orders/{uid_requestId}` | Canonical snapshots/totals/status/payment references; owner/admin reads, server-only writes |

The sample coupon is currently fixed to `WELCOME10` in the server calculation module. General coupon schedules, usage limits and coupon admin CRUD are not implemented. Collections, detailed colour/material variants, campaign banners and courier tracking need live API/admin integration.

Product image uploads are restricted to admins, image MIME types and 5 MB per file. Storage rules cannot guarantee file authenticity from MIME type alone; implement server image validation before live uploads.

## Callable functions

| Function | Purpose |
|---|---|
| `quoteCart` | Recompute totals using server product prices, aggregate stock limits and shipping settings |
| `createDemoCodOrder` | Create an idempotent test COD order and reserve inventory in a Firestore transaction |
| `createTestPaymentOrder` | Reserve stock and create a Razorpay test gateway order using secret credentials |
| `verifyTestPayment` | Validate signature using the server-stored gateway order ID; fetch the payment and verify amount, currency, order and captured status |
| `adminUpsertProduct` | Validate/update products after checking the authenticated custom `admin` claim |
| `adminSetOrderStatus` | Update fulfilment stages for confirmed orders with an admin claim |
| `expireTestReservations` | Scheduled expiration of unpaid reservations with no gateway reference; mark gateway-associated reservations for reconciliation |

Use a stable `requestId` for retrying checkout; a different request ID creates a new order. Client requests send IDs, selected polish and quantity, not authoritative totals.

If a gateway request times out, the starter keeps its claim and reserved stock to avoid creating duplicate charges on retries. An admin must inspect the Razorpay test dashboard and reconcile the reservation. Once a gateway order exists, the scheduler does not release its stock blindly because delayed payment capture is possible. This is an intentional conservative starter behaviour, not a complete automated live-payment lifecycle.

Before going live implement authenticated, verified Razorpay webhooks, replay deduplication, capture/reconciliation jobs, expiration/refunds, inventory release, cancellation rules, coupon usage transactions and audit logging. These are not implemented in the delivered starter.

## Connect the Flutter app

1. Add and configure `firebase_core`, `firebase_auth`, `cloud_firestore`, `cloud_functions`, `firebase_storage`, `firebase_app_check`, `firebase_messaging` and the chosen native payment SDK with maintained, compatible versions. Generate Firebase options using FlutterFire CLI.
2. Create a live repository implementing the same observable shop operations as `Store`; query/paginate active catalogue data and retrieve owner-specific wishlist, cart, addresses and orders.
3. Implement real phone OTP verification (including resend, expiry and errors), optional email/password/reset and guest-to-account migration. Replace the **local demo profile** screen; its name/mobile fields are not security controls.
4. Replace local checkout with `quoteCart` and server-order calls. Require an authenticated identity and App Check. Display server-returned totals, open Razorpay in test mode and call verification on return. Do not mark payment paid from an SDK callback alone.
5. Create a separate production admin interface. Hide the local demo management screen in customer builds. Provision custom admin claims only through a trusted Admin SDK operation on a server. Firestore `users` fields must never grant roles.
6. Fetch real image galleries and backend-managed banner/category data. Add image caching, pagination, loading/offline/error screens and stock refresh for the live repository.
7. Register device push tokens after consent, then add server-triggered order notifications. Add secure logging, Crashlytics and analytics only with appropriate privacy disclosures.
8. Implement account deletion, full privacy/business policies, support, actual tax totals and fulfilment rules. Verify every flow on real Android and iOS devices.

Official references:
- https://firebase.google.com/docs/flutter/setup
- https://firebase.google.com/docs/auth/flutter/phone-auth
- https://firebase.google.com/docs/functions/callable
- https://firebase.google.com/docs/rules/basics
- https://razorpay.com/docs/payments/server-integration/nodejs/integration-steps/
