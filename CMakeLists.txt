# ============================================
# FILE 3: CMakeLists.txt (كل الإعدادات)
# ============================================
cmake_minimum_required(VERSION 3.10)
project(SurvivalClash)

set(CMAKE_CXX_STANDARD 17)

# مكتبات Android NDK
find_library(android-lib android)
find_library(log-lib log)
find_library(egl-lib EGL)
find_library(gles-lib GLESv3)
find_library(media-lib mediandk)

add_library(game SHARED Game.cpp)

target_link_libraries(game
    ${android-lib}
    ${log-lib}
    ${egl-lib}
    ${gles-lib}
    ${media-lib}
)

# إعدادات Android APK
set_target_properties(game PROPERTIES
    LIBRARY_OUTPUT_DIRECTORY ${CMAKE_SOURCE_DIR}/android/app/src/main/jniLibs/arm64-v8a
)