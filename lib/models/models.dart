class Product {
  final String id, sku, name, category, description, material;
  final int price, mrp, stock, art;
  final bool active, featured, newArrival;
  final List<String> polishes;
  const Product({
    required this.id,
    required this.sku,
    required this.name,
    required this.category,
    required this.price,
    required this.mrp,
    this.stock = 15,
    this.art = 0,
    this.active = true,
    this.featured = false,
    this.newArrival = false,
    this.polishes = const ['Gold', 'Silver', 'Rose Gold'],
    this.material = 'Demo gold-tone alloy',
    this.description = 'A little detail. A lasting impression. A thoughtfully styled piece for your everyday collection. This is a sample product for exploring PSERA.',
  });
  Product copy({String? name, int? price, int? stock, bool? active}) => Product(
    id: id,
    sku: sku,
    name: name ?? this.name,
    category: category,
    price: price ?? this.price,
    mrp: (price ?? this.price) > mrp ? (price ?? this.price) : mrp,
    stock: stock ?? this.stock,
    art: art,
    active: active ?? this.active,
    featured: featured,
    newArrival: newArrival,
    polishes: polishes,
    material: material,
    description: description,
  );
  Map<String, dynamic> toJson() => {
    'id': id,
    'sku': sku,
    'name': name,
    'category': category,
    'price': price,
    'mrp': mrp,
    'stock': stock,
    'art': art,
    'active': active,
    'featured': featured,
    'newArrival': newArrival,
    'polishes': polishes,
    'material': material,
    'description': description,
  };
  factory Product.fromJson(Map<String, dynamic> j) => Product(
    id: j['id'],
    sku: j['sku'],
    name: j['name'],
    category: j['category'],
    price: j['price'],
    mrp: j['mrp'],
    stock: j['stock'],
    art: j['art'],
    active: j['active'],
    featured: j['featured'],
    newArrival: j['newArrival'],
    polishes: List<String>.from(j['polishes']),
    material: j['material'],
    description: j['description'],
  );
}

class CartItem {
  final String productId, polish;
  int quantity;
  CartItem(this.productId, this.polish, [this.quantity = 1]);
  String get key => '$productId:$polish';
  Map<String, dynamic> toJson() => {
    'productId': productId,
    'polish': polish,
    'quantity': quantity,
  };
  factory CartItem.fromJson(Map<String, dynamic> j) =>
      CartItem(j['productId'], j['polish'], j['quantity']);
}

class Address {
  final String name, phone, street, city, state, pin;
  const Address({
    required this.name,
    required this.phone,
    required this.street,
    required this.city,
    required this.state,
    required this.pin,
  });
  String get display => '$name · $phone\n$street\n$city, $state $pin · India';
  Map<String, dynamic> toJson() => {
    'name': name,
    'phone': phone,
    'street': street,
    'city': city,
    'state': state,
    'pin': pin,
  };
  factory Address.fromJson(Map<String, dynamic> j) => Address(
    name: j['name'],
    phone: j['phone'],
    street: j['street'],
    city: j['city'],
    state: j['state'],
    pin: j['pin'],
  );
}

class DemoOrder {
  final String id, createdAt, payment;
  final Address address;
  final List<Map<String, dynamic>> items;
  final int subtotal, discount, shipping, total;
  String status;
  DemoOrder({
    required this.id,
    required this.createdAt,
    required this.payment,
    required this.address,
    required this.items,
    required this.subtotal,
    required this.discount,
    required this.shipping,
    required this.total,
    this.status = 'Order placed',
  });
  Map<String, dynamic> toJson() => {
    'id': id,
    'createdAt': createdAt,
    'payment': payment,
    'address': address.toJson(),
    'items': items,
    'subtotal': subtotal,
    'discount': discount,
    'shipping': shipping,
    'total': total,
    'status': status,
  };
  factory DemoOrder.fromJson(Map<String, dynamic> j) => DemoOrder(
    id: j['id'],
    createdAt: j['createdAt'],
    payment: j['payment'],
    address: Address.fromJson(j['address']),
    items: List<Map<String, dynamic>>.from(j['items']),
    subtotal: j['subtotal'],
    discount: j['discount'],
    shipping: j['shipping'],
    total: j['total'],
    status: j['status'],
  );
}

String money(int paise) =>
    '₹${(paise / 100).toStringAsFixed(paise % 100 == 0 ? 0 : 2)}';
