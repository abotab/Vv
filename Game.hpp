// ============================================
// FILE 1: Game.hpp (كل شي بالكود الواحد)
// ============================================
#pragma once

#include <GLES3/gl3.h>
#include <EGL/egl.h>
#include <android/native_activity.h>
#include <android/asset_manager.h>
#include <media/NdkMediaCodec.h>
#include <media/NdkMediaExtractor.h>
#include <pthread.h>
#include <atomic>
#include <chrono>
#include <cmath>

// كل شي بالهيدر الواحد
namespace Game {
    // فيديو هاردوير ديكود
    struct VideoPlayer {
        AMediaCodec* codec;
        AMediaExtractor* extractor;
        ANativeWindow* window;
        std::atomic<bool> playing{false};
        
        void play(const char* path);
        void renderFrame();
    };
    
    // نظام الرقصات
    struct DanceSystem {
        VideoPlayer lobby;
        VideoPlayer dances[3]; // Booby, Gooby, Bear
        int currentDance = -1;
        
        void openMenu();
        void playDance(int id);
    };
    
    // تحميل تلقائي
    struct LoadingScreen {
        std::atomic<int> progress{0};
        std::atomic<bool> done{false};
        GLuint shaderProgram;
        GLuint vao, vbo;
        
        void init();
        void render(float dt);
        void forceRotation(ANativeActivity* activity);
    };
    
    // اللعبة الكاملة
    struct Engine {
        ANativeActivity* activity;
        ANativeWindow* window;
        EGLDisplay display;
        EGLSurface surface;
        EGLContext context;
        
        LoadingScreen loading;
        DanceSystem dances;
        
        void init();
        void run();
        void renderLobby();
    };
}