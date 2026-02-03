// ============================================
// FILE 2: Game.cpp (التنفيذ الكامل)
// ============================================
#include "Game.hpp"
#include <jni.h>

// شادر بسيط للتحميل
static const char* vertexShader = R"(
    #version 300 es
    layout(location = 0) in vec2 pos;
    void main() { gl_Position = vec4(pos, 0.0, 1.0); }
)";

static const char* loadingFragment = R"(
    #version 300 es
    precision mediump float;
    uniform float u_progress;
    uniform float u_time;
    out vec4 fragColor;
    
    void main() {
        vec2 uv = gl_FragCoord.xy / vec2(1080.0, 1920.0);
        
        // خلفية سوداء
        vec3 color = vec3(0.0);
        
        // شريط تحميل
        float barY = 0.5;
        float barHeight = 0.02;
        float glow = smoothstep(barHeight * 3.0, 0.0, abs(uv.y - barY));
        
        // تقدم ملون
        float fill = step(uv.x, u_progress);
        vec3 neon = mix(vec3(0.0, 0.8, 1.0), vec3(1.0, 0.0, 0.8), 
                       sin(u_time * 3.0) * 0.5 + 0.5);
        
        color += neon * glow * fill;
        
        // نص "صراع البقاء" متوهج
        float textGlow = 0.0; // تبسيط
        
        fragColor = vec4(color, 1.0);
    }
)";

// تنفيذ VideoPlayer
void Game::VideoPlayer::play(const char* path) {
    AAssetManager* mgr = AAssetManager_fromJava(
        nullptr,  // سيتم تعيينه من JNI
        nullptr
    );
    
    AAsset* asset = AAssetManager_open(mgr, path, AASSET_MODE_STREAMING);
    if (!asset) return;
    
    off_t start, length;
    int fd = AAsset_openFileDescriptor(asset, &start, &length);
    
    extractor = AMediaExtractor_new();
    AMediaExtractor_setDataSourceFd(extractor, fd, start, length);
    
    size_t trackCount = AMediaExtractor_getTrackCount(extractor);
    for (size_t i = 0; i < trackCount; i++) {
        AMediaFormat* format = AMediaExtractor_getTrackFormat(extractor, i);
        const char* mime;
        AMediaFormat_getString(format, AMEDIAFORMAT_KEY_MIME, &mime);
        
        if (strncmp(mime, "video/", 6) == 0) {
            AMediaExtractor_selectTrack(extractor, i);
            codec = AMediaCodec_createDecoderByType(mime);
            AMediaCodec_configure(codec, format, window, nullptr, 0);
            AMediaCodec_start(codec);
            break;
        }
        AMediaFormat_delete(format);
    }
    
    AAsset_close(asset);
    playing = true;
}

void Game::VideoPlayer::renderFrame() {
    if (!playing) return;
    
    ssize_t idx = AMediaCodec_dequeueInputBuffer(codec, 10000);
    if (idx >= 0) {
        size_t size;
        uint8_t* buf = AMediaCodec_getInputBuffer(codec, idx, &size);
        
        ssize_t sampleSize = AMediaExtractor_readSampleData(extractor, buf, size);
        int64_t time = AMediaExtractor_getSampleTime(extractor);
        
        if (sampleSize < 0) {
            AMediaExtractor_seekTo(extractor, 0, AMEDIAEXTRACTOR_SEEK_NEXT_SYNC);
            sampleSize = AMediaExtractor_readSampleData(extractor, buf, size);
        }
        
        AMediaCodec_queueInputBuffer(codec, idx, 0, sampleSize, time, 0);
        AMediaExtractor_advance(extractor);
    }
    
    AMediaCodecBufferInfo info;
    ssize_t outIdx = AMediaCodec_dequeueOutputBuffer(codec, &info, 10000);
    if (outIdx >= 0) {
        AMediaCodec_releaseOutputBuffer(codec, outIdx, true);
    }
}

// تنفيذ LoadingScreen
void Game::LoadingScreen::init() {
    // تجميع الشادر
    GLuint vs = glCreateShader(GL_VERTEX_SHADER);
    glShaderSource(vs, 1, &vertexShader, nullptr);
    glCompileShader(vs);
    
    GLuint fs = glCreateShader(GL_FRAGMENT_SHADER);
    glShaderSource(fs, 1, &loadingFragment, nullptr);
    glCompileShader(fs);
    
    shaderProgram = glCreateProgram();
    glAttachShader(shaderProgram, vs);
    glAttachShader(shaderProgram, fs);
    glLinkProgram(shaderProgram);
    
    glDeleteShader(vs);
    glDeleteShader(fs);
    
    // VAO بسيط
    float quad[] = {-1,-1, 1,-1, -1,1, 1,1};
    glGenVertexArrays(1, &vao);
    glGenBuffers(1, &vbo);
    glBindVertexArray(vao);
    glBindBuffer(GL_ARRAY_BUFFER, vbo);
    glBufferData(GL_ARRAY_BUFFER, sizeof(quad), quad, GL_STATIC_DRAW);
    glEnableVertexAttribArray(0);
    glVertexAttribPointer(0, 2, GL_FLOAT, GL_FALSE, 0, nullptr);
}

void Game::LoadingScreen::forceRotation(ANativeActivity* activity) {
    JNIEnv* env;
    activity->vm->AttachCurrentThread(&env, nullptr);
    
    jclass activityClass = env->FindClass("android/app/NativeActivity");
    jmethodID getWindow = env->GetMethodID(activityClass, "getWindow", 
        "()Landroid/view/Window;");
    jobject window = env->CallObjectMethod(activity->clazz, getWindow);
    
    // تدوير تلقائي
    jmethodID setRequestedOrientation = env->GetMethodID(activityClass, 
        "setRequestedOrientation", "(I)V");
    env->CallVoidMethod(activity->clazz, setRequestedOrientation, 6); // LANDSCAPE_SENSOR
    
    // ملء الشاشة
    jclass windowClass = env->FindClass("android/view/Window");
    jmethodID getDecorView = env->GetMethodID(windowClass, "getDecorView", 
        "()Landroid/view/View;");
    jobject decorView = env->CallObjectMethod(window, getDecorView);
    
    jclass viewClass = env->FindClass("android/view/View");
    jmethodID setSystemUiVisibility = env->GetMethodID(viewClass, 
        "setSystemUiVisibility", "(I)V");
    env->CallVoidMethod(decorView, setSystemUiVisibility, 0x00001006);
    
    env->DeleteLocalRef(window);
    env->DeleteLocalRef(decorView);
    activity->vm->DetachCurrentThread();
}

void Game::LoadingScreen::render(float dt) {
    static float time = 0;
    time += dt;
    
    // تحديث التقدم 1-100% على 45 ثانية
    if (!done) {
        progress.store(1 + (int)(time / 45.0f * 100));
        if (progress >= 100) done = true;
    }
    
    glClear(GL_COLOR_BUFFER_BIT);
    glUseProgram(shaderProgram);
    glUniform1f(glGetUniformLocation(shaderProgram, "u_progress"), progress / 100.0f);
    glUniform1f(glGetUniformLocation(shaderProgram, "u_time"), time);
    glBindVertexArray(vao);
    glDrawArrays(GL_TRIANGLE_STRIP, 0, 4);
}

// تنفيذ Engine
void Game::Engine::init() {
    // EGL
    display = eglGetDisplay(EGL_DEFAULT_DISPLAY);
    eglInitialize(display, nullptr, nullptr);
    
    EGLConfig config;
    EGLint numConfigs;
    EGLint attribs[] = {
        EGL_SURFACE_TYPE, EGL_WINDOW_BIT,
        EGL_BLUE_SIZE, 8, EGL_GREEN_SIZE, 8, EGL_RED_SIZE, 8,
        EGL_RENDERABLE_TYPE, EGL_OPENGL_ES3_BIT,
        EGL_NONE
    };
    eglChooseConfig(display, attribs, &config, 1, &numConfigs);
    
    surface = eglCreateWindowSurface(display, config, window, nullptr);
    
    EGLint contextAttribs[] = {EGL_CONTEXT_CLIENT_VERSION, 3, EGL_NONE};
    context = eglCreateContext(display, config, EGL_NO_CONTEXT, contextAttribs);
    eglMakeCurrent(display, surface, surface, context);
    
    glViewport(0, 0, 1920, 1080);
    
    loading.init();
    loading.forceRotation(activity);
}

void Game::Engine::run() {
    auto lastTime = std::chrono::steady_clock::now();
    
    // مرحلة التحميل
    while (!loading.done) {
        auto now = std::chrono::steady_clock::now();
        float dt = std::chrono::duration<float>(now - lastTime).count();
        lastTime = now;
        
        loading.render(dt);
        eglSwapBuffers(display, surface);
    }
    
    // تشغيل اللوبي
    dances.lobby.play("videos/lobby.mp4");
    
    // اللوب الرئيسي
    while (true) {
        dances.lobby.renderFrame();
        renderLobby();
        eglSwapBuffers(display, surface);
    }
}

void Game::Engine::renderLobby() {
    // UI بسيط: شعار + زر رقصات
    // (يتم الرندر فوق الفيديو)
}

// ============================================
// JNI Entry Point
// ============================================
static Game::Engine* engine = nullptr;

extern "C" {
    JNIEXPORT void ANativeActivity_onCreate(ANativeActivity* activity, 
        void* savedState, size_t savedStateSize) {
        
        engine = new Game::Engine();
        engine->activity = activity;
        
        // انتظار النافذة
        while (activity->window == nullptr) {
            usleep(1000);
        }
        engine->window = activity->window;
        
        engine->init();
        engine->run();
    }
}