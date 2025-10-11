import 'dart:io';
import 'package:csv/csv.dart';
import 'package:pdf/pdf.dart';
import 'package:pdf/widgets.dart' as pw;
import 'package:path_provider/path_provider.dart';
import 'package:share_plus/share_plus.dart';
import 'package:cloud_firestore/cloud_firestore.dart';
import 'package:firebase_auth/firebase_auth.dart';

class DataExportService {
  final FirebaseFirestore _firestore = FirebaseFirestore.instance;

  // Export maintenance history as CSV
  Future<void> exportMaintenanceAsCSV(String vin) async {
    final maintenanceData = await _getMaintenanceData(vin);

    if (maintenanceData.isEmpty) {
      throw Exception('No maintenance data found for this vehicle');
    }

    // Create CSV data
    final csvData = [
      ['Date', 'Title', 'Cost', 'Mileage', 'Notes'], // Header
      ...maintenanceData.map(
        (entry) => [
          entry['date']?.toDate()?.toString() ?? '',
          entry['title'] ?? '',
          entry['cost']?.toString() ?? '',
          entry['mileage']?.toString() ?? '',
          entry['notes'] ?? '',
        ],
      ),
    ];

    final csvString = const ListToCsvConverter().convert(csvData);

    // Save to temporary file
    final tempDir = await getTemporaryDirectory();
    final fileName =
        'maintenance_${vin}_${DateTime.now().millisecondsSinceEpoch}.csv';
    final file = File('${tempDir.path}/$fileName');
    await file.writeAsString(csvString);

    // Share the file
    await Share.shareXFiles([
      XFile(file.path),
    ], text: 'Maintenance history for vehicle $vin');
  }

  // Export maintenance history as PDF
  Future<void> exportMaintenanceAsPDF(String vin) async {
    final maintenanceData = await _getMaintenanceData(vin);

    if (maintenanceData.isEmpty) {
      throw Exception('No maintenance data found for this vehicle');
    }

    final pdf = pw.Document();

    pdf.addPage(
      pw.MultiPage(
        pageFormat: PdfPageFormat.a4,
        build: (pw.Context context) {
          return [
            pw.Header(
              level: 0,
              child: pw.Text(
                'Vehicle Maintenance History',
                style: pw.TextStyle(
                  fontSize: 24,
                  fontWeight: pw.FontWeight.bold,
                ),
              ),
            ),
            pw.Text('VIN: $vin', style: const pw.TextStyle(fontSize: 16)),
            pw.SizedBox(height: 20),
            pw.Table.fromTextArray(
              headers: ['Date', 'Title', 'Cost', 'Mileage', 'Notes'],
              data: maintenanceData
                  .map(
                    (entry) => [
                      entry['date']?.toDate()?.toString() ?? '',
                      entry['title'] ?? '',
                      entry['cost']?.toString() ?? '',
                      entry['mileage']?.toString() ?? '',
                      entry['notes'] ?? '',
                    ],
                  )
                  .toList(),
              headerStyle: pw.TextStyle(fontWeight: pw.FontWeight.bold),
              cellAlignment: pw.Alignment.centerLeft,
              cellPadding: const pw.EdgeInsets.all(4),
            ),
          ];
        },
      ),
    );

    // Save to temporary file
    final tempDir = await getTemporaryDirectory();
    final fileName =
        'maintenance_${vin}_${DateTime.now().millisecondsSinceEpoch}.pdf';
    final file = File('${tempDir.path}/$fileName');
    await file.writeAsBytes(await pdf.save());

    // Share the file
    await Share.shareXFiles([
      XFile(file.path),
    ], text: 'Maintenance history for vehicle $vin');
  }

  // Export all vehicles and their maintenance as comprehensive report
  Future<void> exportAllDataAsPDF() async {
    final user = FirebaseAuth.instance.currentUser;
    if (user == null) throw Exception('User not authenticated');

    final vehiclesSnapshot = await _firestore
        .collection('users')
        .doc(user.uid)
        .collection('vehicles')
        .get();

    if (vehiclesSnapshot.docs.isEmpty) {
      throw Exception('No vehicles found');
    }

    final pdf = pw.Document();

    pdf.addPage(
      pw.MultiPage(
        pageFormat: PdfPageFormat.a4,
        build: (pw.Context context) {
          return [
            pw.Header(
              level: 0,
              child: pw.Text(
                'Complete Vehicle Report',
                style: pw.TextStyle(
                  fontSize: 24,
                  fontWeight: pw.FontWeight.bold,
                ),
              ),
            ),
            pw.Text(
              'Generated on: ${DateTime.now().toString()}',
              style: const pw.TextStyle(fontSize: 12),
            ),
            pw.SizedBox(height: 20),

            // Vehicles summary
            pw.Text(
              'Vehicles Owned:',
              style: pw.TextStyle(fontSize: 18, fontWeight: pw.FontWeight.bold),
            ),
            pw.SizedBox(height: 10),
            pw.Table.fromTextArray(
              headers: ['VIN', 'Make', 'Model', 'Year', 'Mileage'],
              data: vehiclesSnapshot.docs.map((doc) {
                final data = doc.data();
                return [
                  doc.id,
                  data['make'] ?? '',
                  data['model'] ?? '',
                  data['year']?.toString() ?? '',
                  data['mileage']?.toString() ?? '',
                ];
              }).toList(),
              headerStyle: pw.TextStyle(fontWeight: pw.FontWeight.bold),
              cellPadding: const pw.EdgeInsets.all(4),
            ),
            pw.SizedBox(height: 30),

            // Maintenance details for each vehicle
            ...vehiclesSnapshot.docs
                .map((vehicleDoc) {
                  final vehicleData = vehicleDoc.data();
                  return [
                    pw.Text(
                      'Maintenance History - ${vehicleData['make']} ${vehicleData['model']} (${vehicleDoc.id})',
                      style: pw.TextStyle(
                        fontSize: 16,
                        fontWeight: pw.FontWeight.bold,
                      ),
                    ),
                    pw.SizedBox(height: 10),
                    // This would need to be expanded to include actual maintenance data
                    pw.Text('Maintenance data would be included here...'),
                    pw.SizedBox(height: 20),
                  ];
                })
                .expand((element) => element),
          ];
        },
      ),
    );

    // Save to temporary file
    final tempDir = await getTemporaryDirectory();
    final fileName =
        'complete_vehicle_report_${DateTime.now().millisecondsSinceEpoch}.pdf';
    final file = File('${tempDir.path}/$fileName');
    await file.writeAsBytes(await pdf.save());

    // Share the file
    await Share.shareXFiles([
      XFile(file.path),
    ], text: 'Complete vehicle report');
  }

  // Helper method to get maintenance data for a vehicle
  Future<List<Map<String, dynamic>>> _getMaintenanceData(String vin) async {
    final user = FirebaseAuth.instance.currentUser;
    if (user == null) return [];

    final maintenanceSnapshot = await _firestore
        .collection('users')
        .doc(user.uid)
        .collection('vehicles')
        .doc(vin)
        .collection('maintenance')
        .orderBy('date', descending: true)
        .get();

    return maintenanceSnapshot.docs.map((doc) => doc.data()).toList();
  }
}
