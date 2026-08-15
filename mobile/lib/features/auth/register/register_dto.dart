class RegisterDto {
  final String name;
  final String email;
  final String phone;
  final String password;

  RegisterDto({required this.name, required this.email, required this.phone, required this.password});

  Map<String, dynamic> toJson() => {
    'fullName': name,
    'email': email,
    'password': password,
    'phone':phone
  };

}