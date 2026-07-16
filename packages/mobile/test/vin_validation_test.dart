import 'package:flutter_test/flutter_test.dart';
import 'package:vehicle_vitals_flutter/utils/vin_validation.dart';

void main() {
  test('accepts a VIN with valid checksum', () {
    expect(hasValidVinChecksum('1HGCM82633A004352'), true);
    expect(getVinLookupValidationError('1HGCM82633A004352'), null);
  });

  test('rejects VIN with invalid check digit', () {
    expect(hasValidVinChecksum('1HGCM82633A004353'), false);
    expect(
      getVinLookupValidationError('1HGCM82633A004353'),
      contains('correct check digit'),
    );
  });

  test('rejects VIN values that are not 17 characters', () {
    expect(
      getVinLookupValidationError('TESTVIN123'),
      contains('17-character VIN'),
    );
  });

  test('detects HIN and validates supported format', () {
    expect(hasValidHinFormat('ABC12345A595'), true);
    expect(detectVehicleIdentifierType('ABC12345A595', 'Boat'), 'hin');
  });

  test('falls back to serial for non-standard identifiers', () {
    expect(detectVehicleIdentifierType('SN-123-ABC', 'Other'), 'serial');
  });
}
