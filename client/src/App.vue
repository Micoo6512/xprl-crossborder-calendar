<script setup>
import { onMounted, watch } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import MainLayout from './layouts/MainLayout.vue';
import { useAuthStore } from './stores/auth.js';

const auth = useAuthStore();
const route = useRoute();
const router = useRouter();

onMounted(() => {
  if (auth.isLoggedIn) auth.fetchProfile();
});

// 需要登录的页面：未登录则回首页并唤起登录弹窗
watch(
  () => route.fullPath,
  () => {
    if (route.meta.requiresAuth && !auth.isLoggedIn) {
      router.replace('/');
      window.dispatchEvent(new CustomEvent('xprl:login'));
    }
  },
  { immediate: true },
);
</script>

<template>
  <MainLayout />
</template>
