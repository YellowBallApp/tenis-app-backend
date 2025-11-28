package com.tenisapp.frontend

import android.app.Application
import android.content.res.Configuration

import com.facebook.react.PackageList
import com.facebook.react.ReactApplication
import com.facebook.react.ReactNativeApplicationEntryPoint.loadReactNative
import com.facebook.react.ReactNativeHost
import com.facebook.react.ReactPackage
import com.facebook.react.ReactHost
import com.facebook.react.common.ReleaseLevel
import com.facebook.react.defaults.DefaultNewArchitectureEntryPoint
import com.facebook.react.defaults.DefaultReactNativeHost

import expo.modules.ApplicationLifecycleDispatcher
import expo.modules.ReactNativeHostWrapper

class MainApplication : Application(), ReactApplication {

  override val reactNativeHost: ReactNativeHost = ReactNativeHostWrapper(
      this,
      object : DefaultReactNativeHost(this) {
        override fun getPackages(): List<ReactPackage> =
            PackageList(this).packages.apply {
              // Packages that cannot be autolinked yet can be added manually here, for example:
              // add(MyReactNativePackage())
            }

          override fun getJSMainModuleName(): String = ".expo/.virtual-metro-entry"

          override fun getUseDeveloperSupport(): Boolean = BuildConfig.DEBUG

          override val isNewArchEnabled: Boolean = BuildConfig.IS_NEW_ARCHITECTURE_ENABLED
      }
  )

  override val reactHost: ReactHost
    get() = ReactNativeHostWrapper.createReactHost(applicationContext, reactNativeHost)

  override fun onCreate() {
    super.onCreate()
    
    // Global exception handler - Native hataları yakala
    setupGlobalExceptionHandler()
    
    DefaultNewArchitectureEntryPoint.releaseLevel = try {
      ReleaseLevel.valueOf(BuildConfig.REACT_NATIVE_RELEASE_LEVEL.uppercase())
    } catch (e: IllegalArgumentException) {
      ReleaseLevel.STABLE
    }
    loadReactNative(this)
    ApplicationLifecycleDispatcher.onApplicationCreate(this)
  }

  private fun setupGlobalExceptionHandler() {
    val defaultHandler = Thread.getDefaultUncaughtExceptionHandler()
    
    Thread.setDefaultUncaughtExceptionHandler { thread, exception ->
      // Boolean casting hatası kontrolü
      val isBooleanCastingError = exception.message?.contains("Boolean") == true ||
                                  exception.message?.contains("cast") == true ||
                                  exception.stackTraceToString().contains("Boolean") ||
                                  exception.stackTraceToString().contains("cast")
      
      // Detaylı log
      android.util.Log.e("TENIS_APP_ERROR", "🚨 UNCAUGHT EXCEPTION:")
      android.util.Log.e("TENIS_APP_ERROR", "Thread: ${thread.name}")
      android.util.Log.e("TENIS_APP_ERROR", "Message: ${exception.message}")
      
      if (isBooleanCastingError) {
        android.util.Log.e("TENIS_APP_ERROR", "⚠️ BOOLEAN CASTING ERROR DETECTED!")
        android.util.Log.e("TENIS_APP_ERROR", "Error Details:")
        android.util.Log.e("TENIS_APP_ERROR", "  - Message: ${exception.message}")
        android.util.Log.e("TENIS_APP_ERROR", "  - Exception Type: ${exception.javaClass.name}")
        android.util.Log.e("TENIS_APP_ERROR", "  - Full Stack Trace:")
        exception.stackTrace.forEach { element ->
          android.util.Log.e("TENIS_APP_ERROR", "    at ${element.className}.${element.methodName}(${element.fileName}:${element.lineNumber})")
        }
        android.util.Log.e("TENIS_APP_ERROR", "  - Cause: ${exception.cause?.message}")
      } else {
        android.util.Log.e("TENIS_APP_ERROR", "Full Stack Trace:")
        android.util.Log.e("TENIS_APP_ERROR", exception.stackTraceToString())
      }
      
      // AndroidRuntime log'larını da yakala
      android.util.Log.e("AndroidRuntime", "FATAL EXCEPTION: ${thread.name}")
      android.util.Log.e("AndroidRuntime", "Process: ${android.os.Process.myPid()}")
      android.util.Log.e("AndroidRuntime", exception.toString())
      exception.stackTrace.forEach { element ->
        android.util.Log.e("AndroidRuntime", "    at ${element.className}.${element.methodName}(${element.fileName}:${element.lineNumber})")
      }
      
      // Orijinal handler'ı çağır
      defaultHandler?.uncaughtException(thread, exception)
    }
    
    // React Native'in kendi exception handler'ını da yakalayalım
    try {
      val reactExceptionHandler = Class.forName("com.facebook.react.bridge.NativeModuleCallExceptionHandler")
      // React Native exception handler varsa onu da log'la
      android.util.Log.d("TENIS_APP_ERROR", "React Native exception handler setup başarılı")
    } catch (e: ClassNotFoundException) {
      android.util.Log.d("TENIS_APP_ERROR", "React Native exception handler bulunamadı (normal)")
    }
  }

  override fun onConfigurationChanged(newConfig: Configuration) {
    super.onConfigurationChanged(newConfig)
    ApplicationLifecycleDispatcher.onConfigurationChanged(this, newConfig)
  }
}
