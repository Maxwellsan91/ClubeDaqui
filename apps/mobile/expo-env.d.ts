/// <reference types="expo/types" />

declare namespace NodeJS {
  interface ProcessEnv {
    EXPO_PUBLIC_API_URL?: string;
    EXPO_PUBLIC_SUPABASE_URL?: string;
    EXPO_PUBLIC_SUPABASE_ANON_KEY?: string;
    GOOGLE_MAPS_ANDROID_KEY?: string;
    GOOGLE_MAPS_IOS_KEY?: string;
  }
}
