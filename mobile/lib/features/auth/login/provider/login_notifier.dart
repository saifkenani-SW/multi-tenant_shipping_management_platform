import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:mobile/features/auth/register/register_dto.dart';
import 'package:mobile/features/auth/repository/auth_repository.dart';

class LoginProvider extends AsyncNotifier<void> {
  @override
  RegisterDto? build() {
    return null;
  }

  Future<void> login(String email, String password) async {
    state = const AsyncValue.loading();

    state = await AsyncValue.guard(() async {
      await ref.read(authRepositoryProvider).login(email, password);
    });
  }

  Future<void> logOut() async {
    state = const AsyncValue.loading();

    state = await AsyncValue.guard(() async {
      await ref.read(authRepositoryProvider).logOut();
    });
  }

  
}

final loginNotifierProvider =
    AsyncNotifierProvider<LoginProvider, void>(() {
      return LoginProvider();
    });
