import 'package:flutter/material.dart';
import 'package:shared_preferences/shared_preferences.dart';

import 'state/store.dart';
import 'ui/common.dart';
import 'ui/shop.dart';

Future<void> main() async {
  WidgetsFlutterBinding.ensureInitialized();
  try {
    final prefs = await SharedPreferences.getInstance();
    runApp(PseraApp(store: Store(prefs)));
  } catch (_) {
    runApp(
      MaterialApp(
        theme: appTheme(),
        home: const Scaffold(
          body: Center(
            child: Padding(
              padding: EdgeInsets.all(32),
              child: Text(
                'PSERA could not open local storage. Please restart the app.',
              ),
            ),
          ),
        ),
      ),
    );
  }
}

class PseraApp extends StatelessWidget {
  final Store store;
  const PseraApp({super.key, required this.store});
  @override
  Widget build(BuildContext context) => MaterialApp(
    title: 'PSERA',
    debugShowCheckedModeBanner: false,
    theme: appTheme(),
    home: PseraShell(store: store),
  );
}
