# Add project specific ProGuard rules here.
# By default, the flags in this file are appended to flags specified
# in /usr/local/Cellar/android-sdk/24.3.3/tools/proguard/proguard-android.txt
# You can edit the include path and order by changing the proguardFiles
# directive in build.gradle.
#
# For more details, see
#   http://developer.android.com/guide/developing/tools/proguard.html

# react-native-reanimated
-keep class com.swmansion.reanimated.** { *; }
-keep class com.facebook.react.turbomodule.** { *; }

# React Native Fabric - Boolean casting protection
# Prevent ProGuard from optimizing boolean type conversions
-keepclassmembers class * {
    boolean *;
}
-keepattributes *Annotation*
-keepclassmembers class com.facebook.react.uimanager.** {
    *;
}

# Prevent boolean type erasure in native bridge
-keep class com.facebook.react.bridge.** { *; }
-keep class com.facebook.react.uimanager.** { *; }

# Add any project specific keep options here:
