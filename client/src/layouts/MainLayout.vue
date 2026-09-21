<script setup>
import { onBeforeUnmount, onMounted, ref } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import { useAuthStore } from '../stores/auth.js';
import AuthDialog from '../components/AuthDialog.vue';

const auth = useAuthStore();
const router = useRouter();
const route = useRoute();

const authVisible = ref(false);
const mobileMenuVisible = ref(false);

function openAuth() {
  authVisible.value = true;
}

function onLoginEvent() {
  openAuth();
}

// Token 失效：先清空内存登录态（拦截器只清了 localStorage），再唤起登录
function onUnauthorizedEvent() {
  auth.logout();
  openAuth();
}

function handleCommand(command) {
  if (command === 'account') router.push('/account');
  if (command === 'pricing') router.push('/pricing');
  if (command === 'logout') auth.logout();
}

onMounted(() => {
  window.addEventListener('xprl:login', onLoginEvent);
  window.addEventListener('xprl:unauthorized', onUnauthorizedEvent);
});

onBeforeUnmount(() => {
  window.removeEventListener('xprl:login', onLoginEvent);
  window.removeEventListener('xprl:unauthorized', onUnauthorizedEvent);
});
</script>

<template>
  <div class="flex min-h-full flex-col">
    <header class="sticky top-0 z-40 border-b border-slate-200/70 bg-white/90 backdrop-blur">
      <div class="container-page flex h-16 items-center justify-between gap-4">
        <RouterLink to="/" class="flex items-center gap-2">
          <span class="text-2xl">📅</span>
          <span class="text-base font-bold text-slate-900">跨境选品日历</span>
        </RouterLink>

        <!-- 桌面端导航 -->
        <nav class="hidden items-center gap-1 md:flex">
          <RouterLink
            to="/"
            class="rounded-lg px-3 py-2 text-sm font-medium transition"
            :class="route.name === 'home'
              ? 'bg-brand-50 text-brand-600'
              : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900'"
          >
            首页
          </RouterLink>
          <RouterLink
            to="/pricing"
            class="rounded-lg px-3 py-2 text-sm font-medium transition"
            :class="route.name === 'pricing'
              ? 'bg-brand-50 text-brand-600'
              : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900'"
          >
            会员定价
          </RouterLink>
        </nav>

        <div class="flex items-center gap-2">
          <template v-if="auth.isLoggedIn">
            <el-dropdown trigger="click" @command="handleCommand">
              <button class="flex items-center gap-2 rounded-full border border-slate-200 py-1 pl-1 pr-3 transition hover:border-brand-300">
                <span
                  class="flex h-7 w-7 items-center justify-center rounded-full text-xs font-bold text-white"
                  :class="auth.isMember ? 'bg-amber-500' : 'bg-brand-500'"
                >
                  {{ auth.user?.account?.slice(0, 1)?.toUpperCase() }}
                </span>
                <span class="hidden max-w-[100px] truncate text-sm text-slate-700 sm:inline">
                  {{ auth.user?.account }}
                </span>
                <el-icon class="text-slate-400"><ArrowDown /></el-icon>
              </button>
              <template #dropdown>
                <el-dropdown-menu>
                  <el-dropdown-item command="account">
                    <el-icon><User /></el-icon>个人中心
                  </el-dropdown-item>
                  <el-dropdown-item command="pricing">
                    <el-icon><GoldMedal /></el-icon>
                    {{ auth.isMember ? '会员续费' : '升级会员' }}
                  </el-dropdown-item>
                  <el-dropdown-item command="logout" divided>
                    <el-icon><SwitchButton /></el-icon>退出登录
                  </el-dropdown-item>
                </el-dropdown-menu>
              </template>
            </el-dropdown>
            <el-tag
              v-if="auth.isMember"
              type="warning"
              effect="dark"
              round
              class="hidden sm:inline-flex"
            >
              会员
            </el-tag>
          </template>
          <template v-else>
            <el-button text @click="openAuth">登录</el-button>
            <el-button type="primary" class="!bg-brand-500" @click="openAuth">
              免费注册
            </el-button>
          </template>

          <!-- 移动端菜单按钮 -->
          <el-button class="md:hidden" text @click="mobileMenuVisible = !mobileMenuVisible">
            <el-icon size="20">
              <component :is="mobileMenuVisible ? 'Close' : 'Menu'" />
            </el-icon>
          </el-button>
        </div>
      </div>

      <!-- 移动端下拉菜单 -->
      <div v-if="mobileMenuVisible" class="border-t border-slate-100 bg-white md:hidden">
        <nav class="container-page flex flex-col py-2">
          <RouterLink
            to="/"
            class="rounded-lg px-3 py-2.5 text-sm font-medium text-slate-700 hover:bg-slate-100"
            @click="mobileMenuVisible = false"
          >
            首页
          </RouterLink>
          <RouterLink
            to="/pricing"
            class="rounded-lg px-3 py-2.5 text-sm font-medium text-slate-700 hover:bg-slate-100"
            @click="mobileMenuVisible = false"
          >
            会员定价
          </RouterLink>
        </nav>
      </div>
    </header>

    <main class="flex-1">
      <RouterView />
    </main>

    <footer class="border-t border-slate-200 bg-white py-8">
      <div class="container-page flex flex-col items-center justify-between gap-3 text-sm text-slate-400 sm:flex-row">
        <p>© 2026 跨境选品日历 · 节日备货不迷路</p>
        <p>数据每年更新 · 覆盖北美 / 欧洲 / 中亚中东 / 东南亚 / 拉美</p>
      </div>
    </footer>

    <AuthDialog v-model="authVisible" />
  </div>
</template>
