import 'package:go_router/go_router.dart';
import 'package:mobile/core/routing/app_routes.dart';
import 'package:mobile/features/auth/login/screen/login_screen.dart';
import 'package:mobile/features/auth/otp/pages/otp_screen.dart';
import 'package:mobile/features/auth/register/pages/register_screen.dart';
import 'package:mobile/features/booking_confirmed_screen.dart/pages/booking_confirmed_screen.dart';
import 'package:mobile/features/companies/models/quotation_model.dart';
import 'package:mobile/features/companies/pages/shipping_companies_screen.dart';
import 'package:mobile/features/create_parcel/pages/create_shipment_request.dart';
import 'package:mobile/features/home/screen/home_screen.dart';
import 'package:mobile/features/map/screen/map_screen.dart';
import 'package:mobile/features/my_shipments/screen/my_shipments_screen.dart';
import 'package:mobile/features/notifications/screen/notification_screen.dart';
import 'package:mobile/features/offer_details/pages/offer_details_screen.dart';
import 'package:mobile/features/profile/screen/profile_screen.dart';
import 'package:mobile/features/shipment_details/screen/shipment_details_screen.dart';
import 'package:mobile/features/splash/screen/splash_screen.dart';
import 'package:mobile/shared/shell/main_shell.dart';

class RouterProvider {
  static GoRouter mainRouterGenerator() {
    return GoRouter(
      initialLocation: AppRoutes.splashsScreen,
      routes: [
        StatefulShellRoute.indexedStack(
          builder: (context, state, navigationShell) {
            return MainShell(navigationShell: navigationShell);
          },
          branches: <StatefulShellBranch>[
            StatefulShellBranch(
              routes: [
                GoRoute(
                  path: AppRoutes.homeScreen,
                  name: AppRoutes.homeScreen,
                  builder: (context, state) {
                    return HomeScreen();
                  },
                ),
                GoRoute(
                  path: AppRoutes.createParcelScreen,
                  name: AppRoutes.createParcelScreen,
                  builder: (context, state) => CreateShipmentRequest(),
                ),
                GoRoute(
                  path: AppRoutes.shippingCompaniesScreen,
                  name: AppRoutes.shippingCompaniesScreen,
                  builder: (context, state) => ShippingCompaniesScreen(),
                ),
                GoRoute(
                  name: AppRoutes.offerDetailsScreen,
                  path: AppRoutes.offerDetailsScreen,
                  builder: (context, state) {
                    final quotation = state.extra as Quotation;

                    return OfferDetailsScreen(quotation: quotation);
                  },
                ),
                GoRoute(
                  path: AppRoutes.bookingConfirmedScreen,
                  name: AppRoutes.bookingConfirmedScreen,
                  builder: (context, state) => BookingConfirmedScreen(),
                ),
              ],
            ),
            StatefulShellBranch(
              routes: [
                GoRoute(
                  path: AppRoutes.myShipmentsScreen,
                  name: AppRoutes.myShipmentsScreen,
                  builder: (context, state) => MyShipmentsScreen(),
                ),
                GoRoute(
                  path: AppRoutes.shipmentDetailsScreen,
                  name: AppRoutes.shipmentDetailsScreen,
                  builder: (context, state) => ShipmentDetailsScreen(),
                ),
              ],
            ),
            StatefulShellBranch(
              routes: [
                GoRoute(
                  path: AppRoutes.mapScreen,
                  name: AppRoutes.mapScreen,
                  builder: (context, state) => MapScreen(),
                ),
              ],
            ),
            StatefulShellBranch(
              routes: [
                GoRoute(
                  path: AppRoutes.profileScreen,
                  name: AppRoutes.profileScreen,
                  builder: (context, state) => ProfileScreen(),
                ),
              ],
            ),
          ],
        ),

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
          path: AppRoutes.splashsScreen,
          name: AppRoutes.splashsScreen,
          builder: (context, state) => SplashScreen(),
        ),
        GoRoute(
          path: AppRoutes.otpScreen,
          name: AppRoutes.otpScreen,
          builder: (context, state) {
            final email = state.extra as String;
            return OtpVerificationScreen(email: email);
          },
        ),

        GoRoute(
          path: AppRoutes.notificationsScreen,
          name: AppRoutes.notificationsScreen,
          builder: (context, state) => NotificationsScreen(),
        ),
      ],
    );
  }
}
