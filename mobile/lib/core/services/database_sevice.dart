// import 'package:flutter_riverpod/flutter_riverpod.dart';
// import 'package:sharaf_ai_cv/features/authentication/login/providers/login_model.dart';
// import 'package:shared_preferences/shared_preferences.dart';

// final databaseServiceProvider = Provider((ref) {
//   return DatabaseService();
// });

// class DatabaseService {
//   DatabaseService();
//   static const accessToken = "accessToken";
//   static const tokenType = "tokenType";

//   Future<void> saveToken(String accessToken, String tokenType) async {
//     try {
//       final SharedPreferences prefs = await SharedPreferences.getInstance();
//       await prefs.setString(DatabaseService.accessToken, accessToken);
//       await prefs.setString(DatabaseService.tokenType, tokenType);
//     } catch (e) {
//       print(e);
//     }
//   }

//   Future<LoginModel?> getToken() async {
//     try {
//       final SharedPreferences prefs = await SharedPreferences.getInstance();
//       String? accessToken = prefs.getString(DatabaseService.accessToken);
//       String? tokenType = prefs.getString(DatabaseService.tokenType);
//       if (accessToken == null || tokenType == null) {
//         return null;
//       }
//       LoginModel loginModel = LoginModel(
//         access_token: accessToken,
//         token_type: tokenType,
//       );
//       return loginModel;
//     } catch (e) {
//       print(e);
//     }
//     return null;
//   }
// }
