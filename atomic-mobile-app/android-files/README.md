# Android

These are files located under `android` folder

### Location


SAMPLE-AndroidManifest.xml
`
android/app/src/main/AndroidManifest.xml
`

SAMPLE-build.gradle
`
android/app/build.gradle
`

SAMPLE2-build.gradle
`
android/build.gradle
`

SAMPLE-settings.gradle
`
android/settings.gradle
`

### Instructions

1. Copy over SAMPLE-AndroidManifest.xml file over to above mentioned [location](#location)

2. Replace the package name `YOUR-PACKAGE-NAME` with your own. For example, com.atomic

3. Edit your [build.gradle](#location) to match with `SAMPLE-build.gradle` provided in this folder

- you can enable Hermes if you want. Check official documentation on how to do this
- copy over `apply from ` values
- other values if necessary

4. Edit your parent [build.gradle](#location) to match with `SAMPLE2-build.gradle`

- pay attention to values under
`
buildscript {
    ext {
        
    }
    
    dependencies {

    }
}
`

- pay attention to values under

`
subprojects {

}
`

5. Edit your [settings.gradle](#location) to match `include (... )` values 



