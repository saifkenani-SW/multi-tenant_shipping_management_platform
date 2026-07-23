
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:mobile/features/booking_confirmed_screen.dart/model/booking_details.dart';

final bookingDetailsProvider = Provider<BookingDetails>((ref) {
  return BookingDetails(
    bookingId: '#KP-88293',
    companyName: 'Aramex',
    content: 'Personal Effects',
    parcelDetails: '2.5 KG, 20×15×10 cm',
    senderName: 'Ahmed Al-Riyadh',
    receiverName: 'Khalid Jeddah',
  );
});
