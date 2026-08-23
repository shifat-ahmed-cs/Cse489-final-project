# Proguard rules for BodyPilot
-keepattributes *Annotation*
-keepclassmembers class * {
    @com.google.gson.annotations.SerializedName <fields>;
}
-keep class com.bodypilot.app.data.models.** { *; }
