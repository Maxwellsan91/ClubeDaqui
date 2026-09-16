/** @type {import('expo/config').ExpoConfig} */
const config = {
  name: "Clube Ribatejo",
  slug: "clube-ribatejo",
  version: "0.1.0",
  orientation: "portrait",
  userInterfaceStyle: "automatic",
  scheme: "cluberibatejo",
  plugins: [
    "expo-router",
    "expo-secure-store",
    ["expo-location", { locationWhenInUsePermission: "Permita ao Clube Ribatejo mostrar parceiros perto de si." }],
    ["./plugins/withGoogleMaps", { androidKey: process.env.GOOGLE_MAPS_ANDROID_KEY, iosKey: process.env.GOOGLE_MAPS_IOS_KEY }],
  ],
  ios: { supportsTablet: true, bundleIdentifier: "pt.cluberibatejo.app" },
  android: { package: "pt.cluberibatejo.app" },
  experiments: { typedRoutes: true },
};

module.exports = config;
