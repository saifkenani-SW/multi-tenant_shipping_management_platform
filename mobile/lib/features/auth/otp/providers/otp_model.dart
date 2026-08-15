class OtpModel {
  final String otp;
  final String email;

  OtpModel({ required this.otp, required this.email});

  Map<String, dynamic> toJson() => {
    'otp': otp,
    'email': email,
  };
}