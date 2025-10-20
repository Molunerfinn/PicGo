<template>
  <div
    id="app"
    class="min-h-screen bg-gray-950 text-gray-100"
  >
    <!-- Navigation -->
    <nav class="fixed top-0 w-full bg-gray-950/90 backdrop-blur-md z-50 border-b border-gray-800">
      <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div class="flex justify-between items-center h-16">
          <div class="flex items-center">
            <img
              src="https://cdn.jsdelivr.net/gh/Molunerfinn/test/picgo-site/logo.png"
              alt="PicGo"
              class="h-8 w-8 mr-3"
            >
            <span class="text-xl font-bold">PicGo</span>
          </div>

          <div class="hidden md:flex items-center space-x-8">
            <a
              href="#home"
              class="text-gray-300 hover:text-white transition-colors"
            >{{ $t('nav.home') }}</a>
            <a
              href="#features"
              class="text-gray-300 hover:text-white transition-colors"
            >{{ $t('nav.features') }}</a>
            <a
              href="#plugins"
              class="text-gray-300 hover:text-white transition-colors"
            >{{ $t('nav.plugins') }}</a>
            <a
              href="#download"
              class="text-gray-300 hover:text-white transition-colors"
            >{{ $t('nav.download') }}</a>
            <a
              href="https://picgo.github.io/PicGo-Doc/"
              target="_blank"
              class="text-gray-300 hover:text-white transition-colors"
            >{{ $t('nav.docs') }}</a>
            <a
              href="https://github.com/Molunerfinn/PicGo"
              target="_blank"
              class="text-gray-300 hover:text-white transition-colors"
            >{{ $t('nav.github') }}</a>
          </div>

          <!-- Language Switcher -->
          <div class="flex items-center space-x-4">
            <select
              v-model="currentLocale"
              class="bg-gray-800 text-white px-3 py-1 rounded-md text-sm border border-gray-700 focus:outline-none focus:border-[#409EFF]"
              @change="switchLanguage"
            >
              <option value="en">
                English
              </option>
              <option value="zh-CN">
                中文
              </option>
            </select>
          </div>

          <!-- Mobile menu button -->
          <div class="md:hidden">
            <button
              class="text-gray-300 hover:text-white"
              @click="mobileMenuOpen = !mobileMenuOpen"
            >
              <svg
                class="h-6 w-6"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  stroke-linecap="round"
                  stroke-linejoin="round"
                  stroke-width="2"
                  d="M4 6h16M4 12h16M4 18h16"
                />
              </svg>
            </button>
          </div>
        </div>
      </div>

      <!-- Mobile menu -->
      <div
        v-if="mobileMenuOpen"
        class="md:hidden bg-gray-800"
      >
        <div class="px-2 pt-2 pb-3 space-y-1">
          <a
            href="#home"
            class="block px-3 py-2 text-gray-300 hover:text-white"
          >{{ $t('nav.home') }}</a>
          <a
            href="#features"
            class="block px-3 py-2 text-gray-300 hover:text-white"
          >{{ $t('nav.features') }}</a>
          <a
            href="#plugins"
            class="block px-3 py-2 text-gray-300 hover:text-white"
          >{{ $t('nav.plugins') }}</a>
          <a
            href="#download"
            class="block px-3 py-2 text-gray-300 hover:text-white"
          >{{ $t('nav.download') }}</a>
          <a
            href="https://picgo.github.io/PicGo-Doc/"
            target="_blank"
            class="block px-3 py-2 text-gray-300 hover:text-white"
          >{{ $t('nav.docs') }}</a>
          <a
            href="https://github.com/Molunerfinn/PicGo"
            target="_blank"
            class="block px-3 py-2 text-gray-300 hover:text-white"
          >{{ $t('nav.github') }}</a>
        </div>
      </div>
    </nav>

    <!-- Hero Section -->
    <section
      id="home"
      class="hero-content relative min-h-screen flex items-center justify-center pt-16 bg-gray-950"
    >
      <div class="absolute inset-0 bg-gray-950 opacity-90" />
      <div
        class="absolute inset-0 bg-[url('data:image/svg+xml,%3Csvg%20width=%2260%22%20height=%2260%22%20viewBox=%220%200%2060%2060%22%20xmlns=%22http://www.w3.org/2000/svg%22%3E%3Cg%20fill=%22none%22%20fill-rule=%22evenodd%22%3E%3Cg%20fill=%22%23409EFF%22%20fill-opacity=%220.03%22%3E%3Cpath%20d=%22M36%2034v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6%2034v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6%204V0H4v4H0v2h4v4h2V6h4V4H6z%22/%3E%3C/g%3E%3C/g%3E%3C/svg%3E')]"
      />

      <!-- Interactive background elements -->
      <div class="absolute inset-0 overflow-hidden">
        <div class="absolute inset-0 bg-gray-950"></div>
        <div class="absolute inset-0">
          <!-- Animated grid pattern -->
          <div class="absolute inset-0 opacity-20">
            <svg class="absolute inset-0 w-full h-full" xmlns="http://www.w3.org/2000/svg">
              <defs>
                <pattern id="grid" width="40" height="40" patternUnits="userSpaceOnUse">
                  <path d="M 40 0 L 0 0 0 40" fill="none" stroke="#409EFF" stroke-width="0.5"/>
                </pattern>
              </defs>
              <rect width="100%" height="100%" fill="url(#grid)" />
            </svg>
          </div>
          
          <!-- Floating upload particles -->
          <div class="absolute top-1/4 left-1/4 opacity-30 animate-pulse">
            <svg class="w-8 h-8 text-[#409EFF]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12"/>
            </svg>
          </div>
          
          <div class="absolute top-1/3 right-1/4 opacity-20 animate-pulse delay-1000">
            <svg class="w-6 h-6 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"/>
            </svg>
          </div>
          
          <div class="absolute bottom-1/4 left-1/3 opacity-25 animate-pulse delay-2000">
            <svg class="w-10 h-10 text-[#409EFF]/70" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z"/>
            </svg>
          </div>
        </div>
        
        <!-- Subtle glow effect -->
        <div class="absolute inset-0 bg-[radial-gradient(ellipse_at_center,_var(--tw-gradient-stops))] from-[#409EFF]/5 via-transparent to-transparent"></div>
      </div>
      
      <div class="relative z-10 text-center px-4">
        <img
          src="https://cdn.jsdelivr.net/gh/Molunerfinn/test/picgo-site/logo.png"
          alt="PicGo"
          class="h-24 w-24 mx-auto mb-6 rounded-xl"
        >
        <h1 class="text-6xl md:text-8xl font-bold mb-4 text-[#409EFF]">
          {{ $t('hero.title') }}
        </h1>
        <h2 class="text-2xl md:text-4xl text-gray-300 mb-6 font-light">
          {{ $t('hero.subtitle') }}
        </h2>
        <p class="text-lg md:text-xl text-gray-400 max-w-3xl mx-auto mb-8 leading-relaxed">
          {{ $t('hero.description') }}
        </p>

        <div class="flex flex-col sm:flex-row gap-4 justify-center items-center">
          <button
            class="bg-[#409EFF] hover:bg-[#3a8fd8] text-white px-8 py-4 rounded-xl font-semibold text-lg transition-all transform hover:scale-105 shadow-lg"
            @click="downloadApp"
          >
            {{ $t('hero.download') }}
          </button>
          <a
            href="https://picgo.github.io/PicGo-Doc/"
            target="_blank"
            class="border border-gray-600 text-gray-300 hover:text-white hover:border-gray-400 px-8 py-4 rounded-xl font-semibold text-lg transition-all"
          >
            {{ $t('hero.viewDocs') }}
          </a>
        </div>

        <p
          v-if="version"
          class="text-gray-500 mt-4 text-sm"
        >
          {{ $t('hero.currentVersion') }}: {{ version }}
        </p>
      </div>
    </section>

    <!-- Features Section -->
    <section
      id="features"
      class="py-20 bg-gray-900 border-t border-gray-800"
    >
      <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div class="text-center mb-16">
          <h2 class="text-4xl md:text-5xl font-bold mb-4">
            {{ $t('features.title') }}
          </h2>
          <p class="text-xl text-gray-400">
            {{ $t('features.subtitle') }}
          </p>
        </div>

        <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          <!-- Multi-Picbed Support -->
          <div class="bg-gray-800 rounded-2xl p-8 hover:bg-gray-700 border border-gray-700 transition-all transform hover:scale-105">
            <div class="w-16 h-16 bg-[#409EFF] rounded-xl flex items-center justify-center mb-4">
              <svg
                class="w-8 h-8 text-white"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  stroke-linecap="round"
                  stroke-linejoin="round"
                  stroke-width="2"
                  d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12"
                />
              </svg>
            </div>
            <h3 class="text-2xl font-bold mb-3">
              {{ $t('features.multiPicbed.title') }}
            </h3>
            <p class="text-gray-400">
              {{ $t('features.multiPicbed.description') }}
            </p>
          </div>

          <!-- Plugin System -->
          <div class="bg-gray-800 rounded-2xl p-8 hover:bg-gray-700 border border-gray-700 transition-all transform hover:scale-105">
            <div class="w-16 h-16 bg-[#409EFF] rounded-xl flex items-center justify-center mb-4">
              <svg
                class="w-8 h-8 text-white"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  stroke-linecap="round"
                  stroke-linejoin="round"
                  stroke-width="2"
                  d="M11 4a2 2 0 114 0v1a1 1 0 001 1h3a1 1 0 011 1v3a1 1 0 01-1 1h-1a2 2 0 100 4h1a1 1 0 011 1v3a1 1 0 01-1 1h-3a1 1 0 01-1-1v-1a2 2 0 10-4 0v1a1 1 0 01-1 1H7a1 1 0 01-1-1V9a1 1 0 011-1h1a2 2 0 100-4H7a1 1 0 01-1-1V4a1 1 0 011-1h3a1 1 0 001-1V1z"
                />
              </svg>
            </div>
            <h3 class="text-2xl font-bold mb-3">
              {{ $t('features.pluginSystem.title') }}
            </h3>
            <p class="text-gray-400">
              {{ $t('features.pluginSystem.description') }}
            </p>
          </div>

          <!-- Cross-Platform -->
          <div class="bg-gray-800 rounded-2xl p-8 hover:bg-gray-700 border border-gray-700 transition-all transform hover:scale-105">
            <div class="w-16 h-16 bg-[#409EFF] rounded-xl flex items-center justify-center mb-4">
              <svg
                class="w-8 h-8 text-white"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  stroke-linecap="round"
                  stroke-linejoin="round"
                  stroke-width="2"
                  d="M9.75 17L9 20l-1 1h8l-1-1-.75-3M3 13h18M5 17h14a2 2 0 002-2V5a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"
                />
              </svg>
            </div>
            <h3 class="text-2xl font-bold mb-3">
              {{ $t('features.crossPlatform.title') }}
            </h3>
            <p class="text-gray-400">
              {{ $t('features.crossPlatform.description') }}
            </p>
          </div>

          <!-- Clipboard Upload -->
          <div class="bg-gray-800 rounded-2xl p-8 hover:bg-gray-700 transition-all transform hover:scale-105 border border-gray-700">
            <div class="w-16 h-16 bg-[#409EFF] rounded-xl flex items-center justify-center mb-4">
              <svg
                class="w-8 h-8 text-white"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  stroke-linecap="round"
                  stroke-linejoin="round"
                  stroke-width="2"
                  d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z"
                />
              </svg>
            </div>
            <h3 class="text-2xl font-bold mb-3">
              {{ $t('features.clipboardUpload.title') }}
            </h3>
            <p class="text-gray-400">
              {{ $t('features.clipboardUpload.description') }}
            </p>
          </div>

          <!-- Batch Upload -->
          <div class="bg-gray-900 rounded-2xl p-8 hover:bg-gray-800 transition-all transform hover:scale-105">
            <div class="w-16 h-16 bg-[#409EFF] rounded-xl flex items-center justify-center mb-4">
              <svg
                class="w-8 h-8 text-white"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  stroke-linecap="round"
                  stroke-linejoin="round"
                  stroke-width="2"
                  d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"
                />
              </svg>
            </div>
            <h3 class="text-2xl font-bold mb-3">
              {{ $t('features.batchUpload.title') }}
            </h3>
            <p class="text-gray-400">
              {{ $t('features.batchUpload.description') }}
            </p>
          </div>

          <!-- Gallery Management -->
          <div class="bg-gray-900 rounded-2xl p-8 hover:bg-gray-800 transition-all transform hover:scale-105">
            <div class="w-16 h-16 bg-[#409EFF] rounded-xl flex items-center justify-center mb-4">
              <svg
                class="w-8 h-8 text-white"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  stroke-linecap="round"
                  stroke-linejoin="round"
                  stroke-width="2"
                  d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"
                />
              </svg>
            </div>
            <h3 class="text-2xl font-bold mb-3">
              {{ $t('features.galleryManagement.title') }}
            </h3>
            <p class="text-gray-400">
              {{ $t('features.galleryManagement.description') }}
            </p>
          </div>
        </div>
      </div>
    </section>

    <!-- Supported Services Section -->
    <section class="py-20 bg-gray-900">
      <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div class="text-center mb-16">
          <h2 class="text-4xl md:text-5xl font-bold mb-4">
            {{ $t('supportedServices.title') }}
          </h2>
          <p class="text-xl text-gray-400">
            {{ $t('supportedServices.subtitle') }}
          </p>
        </div>

        <div class="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-5 gap-8">
          <div class="text-center">
            <div class="w-20 h-20 bg-gray-800 rounded-xl flex items-center justify-center mx-auto mb-4">
              <span class="text-2xl font-bold">GH</span>
            </div>
            <p class="text-gray-300">
              {{ $t('supportedServices.github') }}
            </p>
          </div>
          <div class="text-center">
            <div class="w-20 h-20 bg-gray-800 rounded-xl flex items-center justify-center mx-auto mb-4">
              <span class="text-2xl font-bold">SM</span>
            </div>
            <p class="text-gray-300">
              {{ $t('supportedServices.smms') }}
            </p>
          </div>
          <div class="text-center">
            <div class="w-20 h-20 bg-gray-800 rounded-xl flex items-center justify-center mx-auto mb-4">
              <span class="text-2xl font-bold">AL</span>
            </div>
            <p class="text-gray-300">
              {{ $t('supportedServices.aliyun') }}
            </p>
          </div>
          <div class="text-center">
            <div class="w-20 h-20 bg-gray-800 rounded-xl flex items-center justify-center mx-auto mb-4">
              <span class="text-2xl font-bold">QN</span>
            </div>
            <p class="text-gray-300">
              {{ $t('supportedServices.qiniu') }}
            </p>
          </div>
          <div class="text-center">
            <div class="w-20 h-20 bg-gray-800 rounded-xl flex items-center justify-center mx-auto mb-4">
              <span class="text-2xl font-bold">TC</span>
            </div>
            <p class="text-gray-300">
              {{ $t('supportedServices.tencent') }}
            </p>
          </div>
          <div class="text-center">
            <div class="w-20 h-20 bg-gray-800 rounded-xl flex items-center justify-center mx-auto mb-4">
              <span class="text-2xl font-bold">UP</span>
            </div>
            <p class="text-gray-300">
              {{ $t('supportedServices.upyun') }}
            </p>
          </div>
          <div class="text-center">
            <div class="w-20 h-20 bg-gray-800 rounded-xl flex items-center justify-center mx-auto mb-4">
              <span class="text-2xl font-bold">IM</span>
            </div>
            <p class="text-gray-300">
              {{ $t('supportedServices.imgur') }}
            </p>
          </div>
          <div class="text-center">
            <div class="w-20 h-20 bg-gray-800 rounded-xl flex items-center justify-center mx-auto mb-4">
              <span class="text-2xl font-bold">WB</span>
            </div>
            <p class="text-gray-300">
              {{ $t('supportedServices.weibo') }}
            </p>
          </div>
          <div class="text-center col-span-2 md:col-span-4 lg:col-span-1">
            <div class="w-20 h-20 bg-[#409EFF] rounded-xl flex items-center justify-center mx-auto mb-4">
              <span class="text-2xl font-bold text-white">+15</span>
            </div>
            <p class="text-gray-300">
              {{ $t('supportedServices.andMore') }}
            </p>
          </div>
        </div>
      </div>
    </section>

    <!-- Plugin Ecosystem Section -->
    <section
      id="plugins"
      class="py-20 bg-gray-800"
    >
      <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div class="text-center mb-16">
          <h2 class="text-4xl md:text-5xl font-bold mb-4">
            {{ $t('plugins.title') }}
          </h2>
          <p class="text-xl text-gray-400 mb-4">
            {{ $t('plugins.subtitle') }}
          </p>
          <p class="text-lg text-gray-500 max-w-3xl mx-auto">
            {{ $t('plugins.description') }}
          </p>
        </div>

        <div class="grid grid-cols-1 md:grid-cols-2 gap-8">
          <div class="bg-gray-900 rounded-2xl p-8">
            <h3 class="text-2xl font-bold mb-4">
              {{ $t('plugins.viewPlugins') }}
            </h3>
            <p class="text-gray-400 mb-4">
              Explore the rich ecosystem of PicGo plugins created by the community.
            </p>
            <a
              href="https://github.com/PicGo/awesome-picgo"
              target="_blank"
              class="inline-flex items-center text-[#409EFF] hover:text-[#3a8fd8]"
            >
              Browse Plugins
              <svg
                class="w-4 h-4 ml-2"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  stroke-linecap="round"
                  stroke-linejoin="round"
                  stroke-width="2"
                  d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14"
                />
              </svg>
            </a>
          </div>
          <div class="bg-gray-900 rounded-2xl p-8">
            <h3 class="text-2xl font-bold mb-4">
              {{ $t('plugins.createPlugin') }}
            </h3>
            <p class="text-gray-400 mb-4">
              Build your own plugin with our comprehensive development guide.
            </p>
            <a
              href="https://picgo.github.io/PicGo-Doc/en/dev-guide/"
              target="_blank"
              class="inline-flex items-center text-[#409EFF] hover:text-[#3a8fd8]"
            >
              Development Guide
              <svg
                class="w-4 h-4 ml-2"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  stroke-linecap="round"
                  stroke-linejoin="round"
                  stroke-width="2"
                  d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14"
                />
              </svg>
            </a>
          </div>
        </div>
      </div>
    </section>

    <!-- Download Section -->
    <section
      id="download"
      class="py-20 bg-gray-900"
    >
      <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div class="text-center mb-16">
          <h2 class="text-4xl md:text-5xl font-bold mb-4">
            {{ $t('download.title') }}
          </h2>
          <p class="text-xl text-gray-400">
            {{ $t('download.subtitle') }}
          </p>
        </div>

        <div class="grid grid-cols-1 md:grid-cols-3 gap-8 max-w-4xl mx-auto">
          <div class="bg-gray-800 rounded-2xl p-8 text-center hover:bg-gray-700 transition-all">
            <div class="w-20 h-20 bg-gray-800 rounded-xl flex items-center justify-center mx-auto mb-4 border border-gray-700">
              <svg
                class="w-10 h-10 text-white"
                fill="currentColor"
                viewBox="0 0 24 24"
              >
                <path d="M18.71 19.5c-.83 1.24-1.71 2.45-3.05 2.47-1.34.03-1.77-.79-3.29-.79-1.53 0-2 .77-3.27.82-1.31.05-2.3-1.32-3.14-2.53C4.25 17.48 2.94 12.04 4.95 9.36c1.07-1.51 2.8-2.48 4.74-2.48 1.35 0 2.8.83 3.68.83.78 0 2.33-1.04 3.94-.99.68.01 2.59.27 3.92 2.03-3.28 1.7-2.91 6.16.53 7.38-.75 1.95-2.09 3.1-3.54 3.19z" />
              </svg>
            </div>
            <h3 class="text-xl font-bold mb-2">
              macOS
            </h3>
            <button
              class="bg-[#409EFF] hover:bg-[#3a8fd8] text-white px-6 py-3 rounded-lg transition-all"
              @click="downloadPlatform('macos')"
            >
              {{ $t('download.macos') }}
            </button>
          </div>

          <div class="bg-gray-800 rounded-2xl p-8 text-center hover:bg-gray-700 transition-all">
            <div class="w-20 h-20 bg-gray-800 rounded-xl flex items-center justify-center mx-auto mb-4 border border-gray-700">
              <svg
                class="w-10 h-10 text-white"
                fill="currentColor"
                viewBox="0 0 24 24"
              >
                <path d="M0 12v3h3l8-8-3-3-8 8zm3 2H1v-2h1v1h1v1zm10.3-9.3L12 6 9 3l1.3-1.3a.996.996 0 011.41 0l1.59 1.59c.39.39.39 1.02 0 1.41z" />
              </svg>
            </div>
            <h3 class="text-xl font-bold mb-2">
              Windows
            </h3>
            <button
              class="bg-[#409EFF] hover:bg-[#3a8fd8] text-white px-6 py-3 rounded-lg transition-all"
              @click="downloadPlatform('windows')"
            >
              {{ $t('download.windows') }}
            </button>
          </div>

          <div class="bg-gray-800 rounded-2xl p-8 text-center hover:bg-gray-700 transition-all">
            <div class="w-20 h-20 bg-gray-800 rounded-xl flex items-center justify-center mx-auto mb-4 border border-gray-700">
              <svg
                class="w-10 h-10 text-white"
                fill="currentColor"
                viewBox="0 0 24 24"
              >
                <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-2 15l-5-5 1.41-1.41L10 14.17l7.59-7.59L19 8l-9 9z" />
              </svg>
            </div>
            <h3 class="text-xl font-bold mb-2">
              Linux
            </h3>
            <button
              class="bg-[#409EFF] hover:bg-[#3a8fd8] text-white px-6 py-3 rounded-lg transition-all"
              @click="downloadPlatform('linux')"
            >
              {{ $t('download.linux') }}
            </button>
          </div>
        </div>

        <div class="text-center mt-8">
          <p class="text-gray-400 mb-4">
            {{ $t('download.or') }}
          </p>
          <a
            href="https://github.com/Molunerfinn/PicGo/releases"
            target="_blank"
            class="text-[#409EFF] hover:text-[#3a8fd8]"
          >
            {{ $t('download.viewReleases') }}
          </a>
        </div>
      </div>
    </section>

    <!-- Footer -->
    <footer class="bg-gray-800 border-t border-gray-700 py-12">
      <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div class="text-center">
          <p class="text-gray-400 mb-2">
            {{ $t('footer.copyright') }}
            <a
              href="https://github.com/Molunerfinn"
              target="_blank"
              class="text-[#409EFF] hover:text-[#3a8fd8]"
            >{{ $t('footer.author') }}</a>
          </p>
          <p class="text-gray-500 text-sm mb-4">
            {{ $t('footer.license') }}
          </p>
          <div class="flex justify-center space-x-6">
            <a
              href="https://github.com/Molunerfinn/PicGo"
              target="_blank"
              class="text-gray-400 hover:text-white"
            >{{ $t('footer.links.github') }}</a>
            <a
              href="https://github.com/Molunerfinn/PicGo/issues"
              target="_blank"
              class="text-gray-400 hover:text-white"
            >{{ $t('footer.links.issues') }}</a>
            <a
              href="https://github.com/Molunerfinn/PicGo/discussions"
              target="_blank"
              class="text-gray-400 hover:text-white"
            >{{ $t('footer.links.discussions') }}</a>
            <a
              href="https://github.com/sponsors/Molunerfinn"
              target="_blank"
              class="text-gray-400 hover:text-white"
            >{{ $t('footer.links.sponsor') }}</a>
          </div>
        </div>
      </div>
    </footer>
  </div>
</template>

<script>
import { ref } from 'vue'
import { useI18n } from 'vue-i18n'

export default {
  name: 'App',
  setup () {
    const { locale } = useI18n()
    const version = ref('')
    const mobileMenuOpen = ref(false)
    const currentLocale = ref('en')

    const fetchVersion = async () => {
      try {
        const response = await fetch('https://api.github.com/repos/Molunerfinn/PicGo/releases/latest')
        const data = await response.json()
        version.value = data.tag_name || data.name
      } catch (error) {
        console.error('Failed to fetch version:', error)
      }
    }

    const switchLanguage = () => {
      locale.value = currentLocale.value
    }

    const downloadApp = () => {
      const platform = navigator.platform.toLowerCase()
      if (platform.includes('mac')) {
        downloadPlatform('macos')
      } else if (platform.includes('win')) {
        downloadPlatform('windows')
      } else if (platform.includes('linux')) {
        downloadPlatform('linux')
      } else {
        window.open('https://github.com/Molunerfinn/PicGo/releases', '_blank')
      }
    }

    const downloadPlatform = () => {
      const baseUrl = 'https://github.com/Molunerfinn/PicGo/releases/latest'
      window.open(baseUrl, '_blank')
    }

    // Smooth scroll for anchor links
    const initSmoothScroll = () => {
      document.querySelectorAll('a[href^="#"]').forEach(anchor => {
        anchor.addEventListener('click', function (e) {
          e.preventDefault()
          const target = document.querySelector(this.getAttribute('href'))
          if (target) {
            target.scrollIntoView({
              behavior: 'smooth',
              block: 'start'
            })
          }
        })
      })
    }

    // Initialize
    fetchVersion()
    initSmoothScroll()

    return {
      version,
      mobileMenuOpen,
      currentLocale,
      switchLanguage,
      downloadApp,
      downloadPlatform
    }
  }
}
</script>

<style>
@import 'tailwindcss/base';
@import 'tailwindcss/components';
@import 'tailwindcss/utilities';

body {
  font-family: 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', 'Roboto', 'Oxygen',
    'Ubuntu', 'Cantarell', 'Fira Sans', 'Droid Sans', 'Helvetica Neue',
    sans-serif;
  -webkit-font-smoothing: antialiased;
  -moz-osx-font-smoothing: grayscale;
}

[v-cloak] {
  display: none;
}

/* Custom scrollbar */
::-webkit-scrollbar {
  width: 8px;
}

::-webkit-scrollbar-track {
  background: #1f2937;
}

::-webkit-scrollbar-thumb {
  background: #4b5563;
  border-radius: 4px;
}

::-webkit-scrollbar-thumb:hover {
  background: #6b7280;
}

/* Floating animations */
.floating-icon {
  animation: float 6s ease-in-out infinite;
}

.floating-icon-delay {
  animation: float 8s ease-in-out infinite;
  animation-delay: 2s;
}

.floating-icon-slow {
  animation: float 10s ease-in-out infinite;
  animation-delay: 4s;
}

@keyframes float {
  0%, 100% {
    transform: translateY(0px) rotate(0deg);
  }
  50% {
    transform: translateY(-20px) rotate(5deg);
  }
}

/* Grid animation */
#grid rect {
  animation: gridPulse 4s ease-in-out infinite;
}

@keyframes gridPulse {
  0%, 100% {
    opacity: 0.1;
  }
  50% {
    opacity: 0.3;
  }
}

/* Interactive hover effects */
.hero-content:hover .floating-icon,
.hero-content:hover .floating-icon-delay,
.hero-content:hover .floating-icon-slow {
  animation-play-state: paused;
}
</style>
