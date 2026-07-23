import 'package:go_router/go_router.dart';
import 'package:mobile/core/routing/app_routes.dart';
import 'package:mobile/features/auth/login/pages/login_screen.dart';
import 'package:mobile/features/auth/otp/pages/otp_screen.dart';
import 'package:mobile/features/auth/register/pages/register_screen.dart';
import 'package:mobile/features/booking_confirmed_screen.dart/pages/booking_confirmed_screen.dart';
import 'package:mobile/features/companies/pages/shipping_companies_screen.dart';
import 'package:mobile/features/create_parcel/pages/create_parcel_screen.dart';
import 'package:mobile/features/offer_details/pages/offer_details_screen.dart';

class RouterGenerationConfig {
  static GoRouter mainRouterGenerator() {
    return GoRouter(
      initialLocation: AppRoutes.loginScreen,
      routes: [
        GoRoute(
          path: AppRoutes.loginScreen,
          name: AppRoutes.loginScreen,
          builder: (context, state) => LoginScreen(),
        ),

        GoRoute(
          path: AppRoutes.registerScreen,
          name: AppRoutes.registerScreen,
          builder: (context, state) => RegisterScreen(),
        ),
        GoRoute(
          path: AppRoutes.otpScreen,
          name: AppRoutes.otpScreen,
          builder: (context, state) => OtpVerificationScreen(),
        ),

        GoRoute(
          path: AppRoutes.createParcelScreen,
          name: AppRoutes.createParcelScreen,
          builder: (context, state) => CreateParcelScreen(),
        ),

        GoRoute(
          path: AppRoutes.shippingCompaniesScreen,
          name: AppRoutes.shippingCompaniesScreen,
          builder: (context, state) => ShippingCompaniesScreen(),
        ),

        GoRoute(
          path: AppRoutes.offerDetailsScreen,
          name: AppRoutes.offerDetailsScreen,
          builder: (context, state) => OfferDetailsScreen(),
        ),

        GoRoute(
          path: AppRoutes.bookingConfirmedScreen,
          name: AppRoutes.bookingConfirmedScreen,
          builder: (context, state) => BookingConfirmedScreen(),
        ),

      ],
    );
  }
}
