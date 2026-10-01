import 'dart:convert';

import 'package:flutter/foundation.dart';
import 'package:shared_preferences/shared_preferences.dart';

import '../data/catalog.dart';
import '../models/models.dart';

/// Offline demo repository. No authentication or real payment is simulated as genuine.
class Store extends ChangeNotifier {
  final SharedPreferences prefs;
  List<Product> products = List.of(demoCatalog);
  List<CartItem> cart = [];
  Set<String> wishlist = {};
  List<Address> addresses = [];
  List<DemoOrder> orders = [];
  List<String> recentSearches = [];
  String profileName = '', profilePhone = '', coupon = '', whatsapp = '';
  int defaultAddress = 0, shippingFee = 5900, freeShippingAt = 99900;
  String? storageWarning;
  Future<void> _saveQueue = Future.value();
  Store(this.prefs) {
    try {
      final raw = prefs.getString('psera.v1');
      if (raw != null) {
        final j = jsonDecode(raw) as Map<String, dynamic>;
        products = (j['products'] as List)
            .map((x) => Product.fromJson(x))
            .toList();
        cart = (j['cart'] as List).map((x) => CartItem.fromJson(x)).toList();
        wishlist = Set<String>.from(j['wishlist']);
        addresses = (j['addresses'] as List)
            .map((x) => Address.fromJson(x))
            .toList();
        orders = (j['orders'] as List)
            .map((x) => DemoOrder.fromJson(x))
            .toList();
        recentSearches = List<String>.from(j['searches']);
        profileName = j['profileName'];
        profilePhone = j['profilePhone'];
        coupon = j['coupon'];
        whatsapp = j['whatsapp'];
        defaultAddress = j['defaultAddress'];
        shippingFee = j['shippingFee'];
        freeShippingAt = j['freeShippingAt'];
      }
    } catch (_) {
      storageWarning = 'Saved demo data could not be loaded. A fresh catalogue is available.';
    }
  }
  Product product(String id) => products.firstWhere((p) => p.id == id);
  List<Product> get visible => products.where((p) => p.active).toList();
  int get count => cart.fold(0, (a, b) => a + b.quantity);
  int get subtotal =>
      cart.fold(0, (a, b) => a + product(b.productId).price * b.quantity);
  int get discount =>
      coupon == 'WELCOME10' ? (subtotal / 10).floor().clamp(0, 20000) : 0;
  int get shipping =>
      cart.isEmpty || subtotal >= freeShippingAt ? 0 : shippingFee;
  int get total => subtotal - discount + shipping;
  void changed() {
    notifyListeners();
    final data = jsonEncode({
      'products': products.map((p) => p.toJson()).toList(),
      'cart': cart.map((p) => p.toJson()).toList(),
      'wishlist': wishlist.toList(),
      'addresses': addresses.map((a) => a.toJson()).toList(),
      'orders': orders.map((o) => o.toJson()).toList(),
      'searches': recentSearches,
      'profileName': profileName,
      'profilePhone': profilePhone,
      'coupon': coupon,
      'whatsapp': whatsapp,
      'defaultAddress': defaultAddress,
      'shippingFee': shippingFee,
      'freeShippingAt': freeShippingAt,
    });
    _saveQueue = _saveQueue
        .then((_) async {
          if (!await prefs.setString('psera.v1', data)) {
            storageWarning = 'Your changes could not be saved on this device.';
            notifyListeners();
          }
        })
        .catchError((Object e) {
          storageWarning = 'Your changes could not be saved on this device.';
          notifyListeners();
        });
  }

  Future<void> flush() => _saveQueue;
  void toggleWish(String id) {
    wishlist.contains(id) ? wishlist.remove(id) : wishlist.add(id);
    changed();
  }

  String? addCart(String id, String polish, [int qty = 1]) {
    final p = product(id);
    if (!p.active || p.stock < 1) return 'This piece is currently unavailable.';
    if (!p.polishes.contains(polish)) return 'Choose an available polish.';
    final held = cart
        .where((x) => x.productId == id)
        .fold(0, (a, b) => a + b.quantity);
    if (qty < 1 || held + qty > p.stock) {
      return 'Only ${p.stock} pieces are available.';
    }
    final matches = cart.where((x) => x.key == '$id:$polish');
    if (matches.isEmpty) {
      cart.add(CartItem(id, polish, qty));
    } else {
      matches.first.quantity += qty;
    }
    changed();
    return null;
  }

  String? quantity(CartItem item, int value) {
    if (value < 1) return null;
    final other = cart
        .where((x) => x.productId == item.productId && x.key != item.key)
        .fold(0, (a, b) => a + b.quantity);
    if (value + other > product(item.productId).stock) {
      return 'Maximum available stock reached.';
    }
    item.quantity = value;
    changed();
    return null;
  }

  void remove(CartItem item) {
    cart.remove(item);
    if (cart.isEmpty) coupon = '';
    changed();
  }

  void moveToWish(CartItem item) {
    wishlist.add(item.productId);
    remove(item);
  }

  String? applyCoupon(String code) {
    if (code.trim().toUpperCase() != 'WELCOME10') {
      return 'Try WELCOME10 for 10% off (up to ₹200).';
    }
    coupon = 'WELCOME10';
    changed();
    return null;
  }

  void addAddress(Address a, {int? edit}) {
    if (edit != null) {
      addresses[edit] = a;
    } else {
      addresses.add(a);
    }
    changed();
  }

  void deleteAddress(int index) {
    addresses.removeAt(index);
    defaultAddress = defaultAddress.clamp(
      0,
      addresses.isEmpty ? 0 : addresses.length - 1,
    );
    changed();
  }

  void search(String query) {
    final q = query.trim();
    if (q.isEmpty) return;
    recentSearches.remove(q);
    recentSearches.insert(0, q);
    if (recentSearches.length > 6) recentSearches.removeLast();
    changed();
  }

  void signInDemo(String name, String phone) {
    profileName = name;
    profilePhone = phone;
    changed();
  }

  void signOut() {
    profileName = '';
    profilePhone = '';
    changed();
  }

  DemoOrder checkout(Address address, String payment) {
    if (cart.isEmpty) throw StateError('Your bag is empty.');
    for (final item in cart) {
      final p = product(item.productId);
      final n = cart
          .where((x) => x.productId == p.id)
          .fold(0, (a, b) => a + b.quantity);
      if (!p.active || n > p.stock) {
        throw StateError('${p.name} is unavailable in this quantity.');
      }
    }
    final o = DemoOrder(
      id: 'PS-${DateTime.now().microsecondsSinceEpoch}',
      createdAt: DateTime.now().toIso8601String(),
      payment: payment,
      address: address,
      items: cart
          .map(
            (x) => {
              'name': product(x.productId).name,
              'sku': product(x.productId).sku,
              'price': product(x.productId).price,
              'art': product(x.productId).art,
              'polish': x.polish,
              'quantity': x.quantity,
            },
          )
          .toList(),
      subtotal: subtotal,
      discount: discount,
      shipping: shipping,
      total: total,
    );
    for (final item in cart) {
      final i = products.indexWhere((p) => p.id == item.productId);
      products[i] = products[i].copy(stock: products[i].stock - item.quantity);
    }
    orders.insert(0, o);
    cart.clear();
    coupon = '';
    changed();
    return o;
  }

  void updateProduct(Product p) {
    final i = products.indexWhere((x) => x.id == p.id);
    if (i < 0) {
      products.add(p);
    } else {
      products[i] = p;
    }
    changed();
  }

  void resetDemo() {
    products = List.of(demoCatalog);
    cart.clear();
    wishlist.clear();
    addresses.clear();
    orders.clear();
    recentSearches.clear();
    profileName = '';
    profilePhone = '';
    coupon = '';
    defaultAddress = 0;
    whatsapp = '';
    shippingFee = 5900;
    freeShippingAt = 99900;
    changed();
  }
}
