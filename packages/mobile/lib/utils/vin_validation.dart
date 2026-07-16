// Mobile port of packages/shared/src/vinValidation.ts (ISO 3779 VIN
// check-digit algorithm). Previously mobile only checked VIN length
// (17 characters) with no checksum validation at all, unlike web/Functions
// — this closes that gap.

const Map<String, int> _vinTransliteration = {
  'A': 1,
  'B': 2,
  'C': 3,
  'D': 4,
  'E': 5,
  'F': 6,
  'G': 7,
  'H': 8,
  'J': 1,
  'K': 2,
  'L': 3,
  'M': 4,
  'N': 5,
  'P': 7,
  'R': 9,
  'S': 2,
  'T': 3,
  'U': 4,
  'V': 5,
  'W': 6,
  'X': 7,
  'Y': 8,
  'Z': 9,
};

const List<int> _vinWeights = [8, 7, 6, 5, 4, 3, 2, 10, 0, 9, 8, 7, 6, 5, 4, 3, 2];

final RegExp _vinPattern = RegExp(r'^[A-HJ-NPR-Z0-9]{17}$');
final RegExp _hinPattern = RegExp(r'^[A-HJ-NPR-Z]{3}[A-HJ-NPR-Z0-9]{9}$');

bool looksLikeVin(String value) {
  return _vinPattern.hasMatch(value.trim().toUpperCase());
}

bool hasValidHinFormat(String value) {
  return _hinPattern.hasMatch(value.trim().toUpperCase());
}

String detectVehicleIdentifierType(String identifierInput, [String? vehicleTypeInput]) {
  final identifier = identifierInput.trim().toUpperCase();
  final vehicleType = (vehicleTypeInput ?? '').trim().toLowerCase();

  if (identifier.isEmpty) {
    return 'empty';
  }

  if (looksLikeVin(identifier)) {
    return 'vin';
  }

  if (hasValidHinFormat(identifier)) {
    return 'hin';
  }

  if (vehicleType.contains('boat') && identifier.length == 12) {
    return 'hin';
  }

  return 'serial';
}

bool hasValidVinChecksum(String value) {
  final vin = value.trim().toUpperCase();

  if (!looksLikeVin(vin)) {
    return false;
  }

  var sum = 0;
  for (var i = 0; i < vin.length; i += 1) {
    final char = vin[i];
    final digit = int.tryParse(char);
    final numericValue = digit ?? _vinTransliteration[char];

    if (numericValue == null) {
      return false;
    }

    sum += numericValue * _vinWeights[i];
  }

  final remainder = sum % 11;
  final expectedCheckDigit = remainder == 10 ? 'X' : remainder.toString();
  return vin[8] == expectedCheckDigit;
}

String? getVinLookupValidationError(String value) {
  final vin = value.trim().toUpperCase();

  if (!looksLikeVin(vin)) {
    return 'VIN lookup requires a valid 17-character VIN.';
  }

  if (!hasValidVinChecksum(vin)) {
    return 'VIN lookup requires a valid 17-character VIN with a correct check digit.';
  }

  return null;
}
