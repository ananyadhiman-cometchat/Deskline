class RegisterRequestDto {
  final String name;
  final String email;
  final String password;
  final String department;

  const RegisterRequestDto({
    required this.name,
    required this.email,
    required this.password,
    required this.department,
  });

  Map<String, dynamic> toJson() => {
        'name': name,
        'email': email,
        'password': password,
        'department': department,
      };
}
