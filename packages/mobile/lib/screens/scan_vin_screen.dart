import 'package:flutter/material.dart';
import 'package:go_router/go_router.dart';
import 'package:mobile_scanner/mobile_scanner.dart';

class ScanVINScreen extends StatefulWidget {
  const ScanVINScreen({super.key});

  @override
  State<ScanVINScreen> createState() => _ScanVINScreenState();
}

class _ScanVINScreenState extends State<ScanVINScreen> {
  MobileScannerController cameraController = MobileScannerController(
    formats: [BarcodeFormat.code39, BarcodeFormat.code128],
  );
  bool _screenOpened = false;

  @override
  void dispose() {
    cameraController.dispose();
    super.dispose();
  }

  void _foundBarcode(BarcodeCapture capture) {
    /// Prevent opening the same screen multiple times
    if (_screenOpened) return;
    _screenOpened = true;

    final List<Barcode> barcodes = capture.barcodes;
    for (final barcode in barcodes) {
      final String? code = barcode.rawValue;
      if (code != null && code.length == 17) {
        // Found a valid 17-character VIN
        Navigator.of(context).pop();
        context.go('/add-vehicle/$code');
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(
            content: Text('VIN detected: $code'),
            backgroundColor: Colors.green,
          ),
        );
        return;
      }
    }
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(
        title: const Text('Scan VIN'),
        backgroundColor: Colors.black,
        foregroundColor: Colors.white,
        iconTheme: const IconThemeData(color: Colors.white),
      ),
      body: Stack(
        children: [
          // Camera preview
          MobileScanner(controller: cameraController, onDetect: _foundBarcode),

          // Overlay with scanning instructions
          Container(
            decoration: BoxDecoration(
              gradient: LinearGradient(
                begin: Alignment.topCenter,
                end: Alignment.bottomCenter,
                colors: [
                  Colors.black.withValues(alpha: 0.8),
                  Colors.transparent,
                  Colors.transparent,
                  Colors.black.withValues(alpha: 0.8),
                ],
                stops: const [0.0, 0.3, 0.7, 1.0],
              ),
            ),
          ),

          // Scanning frame
          Center(
            child: Container(
              width: 300,
              height: 150,
              decoration: BoxDecoration(
                border: Border.all(color: Colors.white, width: 2),
                borderRadius: BorderRadius.circular(8),
              ),
            ),
          ),

          // Instructions
          const Positioned(
            top: 100,
            left: 0,
            right: 0,
            child: Text(
              'Position the VIN barcode within the frame',
              textAlign: TextAlign.center,
              style: TextStyle(
                color: Colors.white,
                fontSize: 16,
                fontWeight: FontWeight.w600,
              ),
            ),
          ),

          // Manual entry button
          Positioned(
            bottom: 50,
            left: 20,
            right: 20,
            child: ElevatedButton(
              onPressed: () {
                Navigator.of(context).pop();
                context.go('/add-vehicle');
              },
              style: ElevatedButton.styleFrom(
                backgroundColor: const Color(0xFFF59E0B),
                foregroundColor: Colors.white,
                padding: const EdgeInsets.symmetric(vertical: 16),
              ),
              child: const Text('Enter VIN Manually'),
            ),
          ),
        ],
      ),
    );
  }
}
