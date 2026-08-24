<template>
  <ThemeToggle />
  <router-view />
  <ToastContainer />
</template>

<script setup>
import ThemeToggle from './components/ThemeToggle.vue'
import ToastContainer from './components/ToastContainer.vue'
</script>
