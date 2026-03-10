import 'package:flutter/material.dart';
import 'package:go_router/go_router.dart';

class ScanVINScreen extends StatefulWidget {
  const ScanVINScreen({super.key});

  @override
  State<ScanVINScreen> createState() => _ScanVINScreenState();
}

class _ScanVINScreenState extends State<ScanVINScreen> {
  // MobileScannerController cameraController = MobileScannerController(
  //   formats: [BarcodeFormat.code39, BarcodeFormat.code128],
  // );

  @override
  void dispose() {
    // cameraController.dispose();
    super.dispose();
  }

  // void _foundBarcode(BarcodeCapture capture) {
  //   /// Prevent opening the same screen multiple times
  //   if (_screenOpened) return;
  //   _screenOpened = true;

  //   final List<Barcode> barcodes = capture.barcodes;
  //   for (final barcode in barcodes) {
  //     final String? code = barcode.rawValue;
  //     if (code != null && code.length == 17) {
  //       // Found a valid 17-character VIN
  //       Navigator.of(context).pop();
  //       context.go('/add-vehicle/$code');
  //       ScaffoldMessenger.of(context).showSnackBar(
  //         SnackBar(
  //           content: Text('VIN detected: $code'),
  //           backgroundColor: Colors.green,
  //         ),
  //       );
  //       return;
  //     }
  //   }
  // }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(
        title: const Text('Scan VIN - DISABLED'),
        leading: IconButton(
          icon: const Icon(Icons.arrow_back),
          onPressed: () => context.go('/app/add-vehicle'),
        ),
      ),
      body: const Center(
        child: Column(
          mainAxisAlignment: MainAxisAlignment.center,
          children: [
            Icon(Icons.camera_alt, size: 64, color: Colors.grey),
            SizedBox(height: 16),
            Text(
              'VIN Scanning Disabled',
              style: TextStyle(fontSize: 24, fontWeight: FontWeight.bold),
            ),
            SizedBox(height: 8),
            Text(
              'Camera scanning is disabled for TestFlight build.\nPlease enter VIN manually.',
              textAlign: TextAlign.center,
              style: TextStyle(fontSize: 16, color: Colors.grey),
            ),
            SizedBox(height: 24),
            ElevatedButton(
              onPressed: null, // Disabled
              child: Text('Scan VIN (Disabled)'),
            ),
          ],
        ),
      ),
    );
  }
}
