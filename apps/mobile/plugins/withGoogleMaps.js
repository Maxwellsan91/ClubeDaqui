const { withAndroidManifest, withInfoPlist } = require("expo/config-plugins");

function withGoogleMaps(config, options = {}) {
  config = withAndroidManifest(config, (mod) => {
    const application = mod.modResults.manifest.application?.[0];
    if (!application) return mod;
    application["meta-data"] = application["meta-data"] ?? [];
    application["meta-data"] = application["meta-data"].filter(
      (entry) => entry.$?.["android:name"] !== "com.google.android.geo.API_KEY",
    );
    application["meta-data"].push({
      $: {
        "android:name": "com.google.android.geo.API_KEY",
        "android:value": options.androidKey ?? "",
      },
    });
    return mod;
  });
  return withInfoPlist(config, (mod) => {
    mod.modResults.GMSApiKey = options.iosKey ?? "";
    return mod;
  });
}

module.exports = withGoogleMaps;
