import 'package:flutter/material.dart';
import 'package:go_router/go_router.dart';
import 'package:mobile_scanner/mobile_scanner.dart';

const bool _screenshotMode = bool.fromEnvironment('VV_SCREENSHOT_MODE');

class ScanVINScreen extends StatefulWidget {
  const ScanVINScreen({super.key});

  @override
  State<ScanVINScreen> createState() => _ScanVINScreenState();
}

class _ScanVINScreenState extends State<ScanVINScreen> {
  final MobileScannerController _cameraController = MobileScannerController(
    formats: [BarcodeFormat.code39, BarcodeFormat.code128],
  );
  bool _screenOpened = false;

  @override
  void dispose() {
    _cameraController.dispose();
    super.dispose();
  }

  void _foundBarcode(BarcodeCapture capture) {
    if (_screenOpened) return;

    for (final barcode in capture.barcodes) {
      final code = barcode.rawValue?.trim().toUpperCase();
      if (code == null || code.length != 17) {
        continue;
      }

      _screenOpened = true;
      final colorScheme = Theme.of(context).colorScheme;
      ScaffoldMessenger.of(context).showSnackBar(
        SnackBar(
          content: Text('VIN detected: $code'),
          backgroundColor: colorScheme.primary,
        ),
      );
      context.go('/app/add-vehicle/$code');
      return;
    }
  }

  @override
  Widget build(BuildContext context) {
    final colorScheme = Theme.of(context).colorScheme;

    return Scaffold(
      appBar: AppBar(
        title: const Text('Scan VIN'),
        leading: IconButton(
          icon: const Icon(Icons.arrow_back),
          onPressed: () => context.go('/app/add-vehicle'),
        ),
      ),
      body: Column(
        children: [
          Expanded(
            child: _screenshotMode
                ? Container(
                    width: double.infinity,
                    color: Colors.black87,
                    child: Center(
                      child: Container(
                        margin: const EdgeInsets.all(32),
                        padding: const EdgeInsets.all(20),
                        decoration: BoxDecoration(
                          border: Border.all(color: Colors.white, width: 3),
                          borderRadius: BorderRadius.circular(16),
                        ),
                        child: const Column(
                          mainAxisSize: MainAxisSize.min,
                          children: [
                            Icon(
                              Icons.document_scanner,
                              color: Colors.white,
                              size: 72,
                            ),
                            SizedBox(height: 16),
                            Text(
                              'VIN barcode frame',
                              style: TextStyle(
                                color: Colors.white,
                                fontSize: 22,
                                fontWeight: FontWeight.bold,
                              ),
                            ),
                            SizedBox(height: 8),
                            Text(
                              '1FTEW1EP8NFA23457',
                              style: TextStyle(
                                color: Colors.white70,
                                fontSize: 16,
                                letterSpacing: 1,
                              ),
                            ),
                          ],
                        ),
                      ),
                    ),
                  )
                : MobileScanner(
                    controller: _cameraController,
                    onDetect: _foundBarcode,
                  ),
          ),
          Container(
            width: double.infinity,
            color: colorScheme.surface,
            padding: const EdgeInsets.fromLTRB(16, 14, 16, 20),
            child: Text(
              'Center the VIN barcode in the camera frame. If scan fails, go back and enter VIN manually.',
              textAlign: TextAlign.center,
              style: TextStyle(
                color: colorScheme.onSurfaceVariant,
                fontSize: 14,
              ),
            ),
          ),
        ],
      ),
    );
  }
}
