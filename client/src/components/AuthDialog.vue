<script setup>
import { ref, watch } from 'vue';
import { ElMessage } from 'element-plus';
import { useAuthStore } from '../stores/auth.js';

const props = defineProps({
  modelValue: { type: Boolean, default: false },
});
const emit = defineEmits(['update:modelValue', 'success']);

const auth = useAuthStore();
const activeTab = ref('login');
const form = ref({ account: '', password: '' });
const loading = ref(false);

watch(
  () => props.modelValue,
  (visible) => {
    if (visible) {
      form.value = { account: '', password: '' };
      activeTab.value = 'login';
    }
  },
);

function close() {
  emit('update:modelValue', false);
}

async function submit() {
  const { account, password } = form.value;
  if (account.trim().length < 3) return ElMessage.warning('账号长度至少 3 个字符');
  if (password.length < 6) return ElMessage.warning('密码长度至少 6 个字符');

  loading.value = true;
  try {
    if (activeTab.value === 'login') {
      await auth.login(account.trim(), password);
      ElMessage.success('登录成功');
    } else {
      await auth.register(account.trim(), password);
      ElMessage.success('注册成功，已自动登录');
    }
    emit('success', auth.user);
    close();
  } catch {
    // 错误提示已由拦截器统一处理
  } finally {
    loading.value = false;
  }
}
</script>

<template>
  <el-dialog
    :model-value="modelValue"
    width="400px"
    align-center
    :show-close="true"
    @update:model-value="emit('update:modelValue', $event)"
  >
    <div class="mb-5 text-center">
      <div class="text-3xl">📅</div>
      <h3 class="mt-2 text-lg font-semibold text-slate-800">跨境选品日历</h3>
      <p class="mt-1 text-xs text-slate-400">登录后每日 2 次免费一键搜品，升级会员不限次</p>
    </div>

    <el-tabs v-model="activeTab" class="auth-tabs" stretch>
      <el-tab-pane label="登录" name="login" />
      <el-tab-pane label="注册" name="register" />
    </el-tabs>

    <el-form label-position="top" @submit.prevent="submit">
      <el-form-item label="账号">
        <el-input
          v-model="form.account"
          size="large"
          placeholder="3–20 个字符"
          clearable
        />
      </el-form-item>
      <el-form-item label="密码">
        <el-input
          v-model="form.password"
          size="large"
          type="password"
          placeholder="6–32 个字符"
          show-password
          @keyup.enter="submit"
        />
      </el-form-item>
    </el-form>

    <template #footer>
      <el-button size="large" @click="close">取消</el-button>
      <el-button
        size="large"
        type="primary"
        class="!bg-brand-500"
        :loading="loading"
        @click="submit"
      >
        {{ activeTab === 'login' ? '登录' : '注册并登录' }}
      </el-button>
    </template>
  </el-dialog>
</template>

<style scoped>
:deep(.auth-tabs .el-tabs__item) {
  font-weight: 500;
}
</style>
