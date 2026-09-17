/** @type {import('expo/config').ExpoConfig} */
const config = {
  name: "Clube Daqui",
  slug: "clube-daqui",
  version: "0.1.0",
  orientation: "portrait",
  userInterfaceStyle: "automatic",
  scheme: "clubedaqui",
  plugins: [
    "expo-router",
    "expo-secure-store",
    "expo-status-bar",
    [
      "expo-build-properties",
      {
        ios: {
          deploymentTarget: "16.4",
          enableSceneSupport: true,
        },
      },
    ],
    [
      "expo-location",
      {
        locationWhenInUsePermission:
          "Permita ao Clube Daqui mostrar parceiros perto de si.",
      },
    ],
    [
      "./plugins/withGoogleMaps",
      {
        androidKey: process.env.GOOGLE_MAPS_ANDROID_KEY,
        iosKey: process.env.GOOGLE_MAPS_IOS_KEY,
      },
    ],
  ],
  ios: {
    supportsTablet: true,
    deploymentTarget: "16.4",
    bundleIdentifier: "pt.clubedaqui.app",
    infoPlist: { ITSAppUsesNonExemptEncryption: false },
  },
  android: { package: "pt.clubedaqui.app" },
  experiments: { typedRoutes: true },
  extra: {
    eas: { projectId: "60279e41-ac9e-4098-bbef-d799f680e64d" },
  },
};

module.exports = config;
