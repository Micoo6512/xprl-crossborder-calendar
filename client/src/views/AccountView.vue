<script setup>
import { onMounted, reactive, ref } from 'vue';
import { useRouter } from 'vue-router';
import dayjs from 'dayjs';
import { ElMessage } from 'element-plus';
import { userApi } from '../api/index.js';
import { useAuthStore } from '../stores/auth.js';

const router = useRouter();
const auth = useAuthStore();

const orders = ref([]);
const loading = ref(false);

// 修改密码
const pwdVisible = ref(false);
const pwdSaving = ref(false);
const pwdForm = reactive({
  oldPassword: '',
  newPassword: '',
  confirmPassword: '',
});

function openPasswordDialog() {
  pwdForm.oldPassword = '';
  pwdForm.newPassword = '';
  pwdForm.confirmPassword = '';
  pwdVisible.value = true;
}

async function submitPassword() {
  if (!pwdForm.oldPassword || !pwdForm.newPassword || !pwdForm.confirmPassword) {
    ElMessage.warning('请填写完整的密码信息');
    return;
  }
  if (pwdForm.newPassword.length < 6 || pwdForm.newPassword.length > 32) {
    ElMessage.warning('新密码长度需为 6–32 个字符');
    return;
  }
  if (pwdForm.newPassword !== pwdForm.confirmPassword) {
    ElMessage.warning('两次输入的新密码不一致');
    return;
  }
  if (pwdForm.newPassword === pwdForm.oldPassword) {
    ElMessage.warning('新密码不能与原密码相同');
    return;
  }

  pwdSaving.value = true;
  try {
    await userApi.changePassword(pwdForm.oldPassword, pwdForm.newPassword);
    ElMessage.success('密码修改成功，下次登录请使用新密码');
    pwdVisible.value = false;
  } finally {
    pwdSaving.value = false;
  }
}

onMounted(async () => {
  loading.value = true;
  try {
    await auth.fetchProfile();
    const { data } = await userApi.orders();
    orders.value = data;
  } finally {
    loading.value = false;
  }
});

function statusTag(status) {
  if (status === 'paid') return { type: 'success', text: '已支付' };
  if (status === 'pending') return { type: 'warning', text: '待支付' };
  return { type: 'info', text: status };
}

function formatTime(value) {
  return value ? dayjs(value).format('YYYY-MM-DD HH:mm') : '—';
}
</script>

<template>
  <div class="container-page py-8 sm:py-10">
    <h1 class="text-2xl font-bold text-slate-900">个人中心</h1>

    <!-- 会员信息卡 -->
    <div class="mt-6 overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-card">
      <div
        class="px-6 py-5"
        :class="auth.isMember
          ? 'bg-gradient-to-r from-amber-50 to-transparent'
          : 'bg-gradient-to-r from-slate-50 to-transparent'"
      >
        <div class="flex flex-wrap items-start justify-between gap-4">
          <div>
            <div class="flex items-center gap-2">
              <h2 class="text-lg font-bold text-slate-900">{{ auth.user?.account }}</h2>
              <el-tag
                v-if="auth.isMember"
                type="warning" effect="dark" round
              >
                会员有效
              </el-tag>
              <el-tag v-else round type="info">免费用户</el-tag>
            </div>
            <p class="mt-2 text-sm text-slate-500">
              注册时间：{{ formatTime(auth.user?.registerTime) }}
            </p>
          </div>

          <div class="flex gap-2">
            <el-button size="large" @click="openPasswordDialog">修改密码</el-button>
            <el-button
              type="primary"
              size="large"
              :class="auth.isMember ? '' : '!bg-brand-500'"
              @click="router.push('/pricing')"
            >
              {{ auth.isMember ? '会员续费' : '升级会员' }}
            </el-button>
          </div>
        </div>
      </div>

      <div class="grid gap-px bg-slate-100 sm:grid-cols-3">
        <div class="bg-white px-6 py-4">
          <p class="text-xs text-slate-400">会员到期时间</p>
          <p class="mt-1 text-sm font-semibold" :class="auth.isMember ? 'text-amber-600' : 'text-slate-600'">
            {{ auth.user?.membershipExpire || '未开通' }}
          </p>
        </div>
        <div class="bg-white px-6 py-4">
          <p class="text-xs text-slate-400">今日搜索跳转</p>
          <p class="mt-1 text-sm font-semibold text-slate-700">
            <template v-if="auth.isMember">不限次</template>
            <template v-else>
              剩余 {{ auth.user?.jump.remainingToday ?? 2 }} 次
              <span class="text-xs font-normal text-slate-400">
                （每日 {{ auth.user?.jump.dailyLimit ?? 2 }} 次）
              </span>
            </template>
          </p>
        </div>
        <div class="bg-white px-6 py-4">
          <p class="text-xs text-slate-400">会员状态</p>
          <p class="mt-1 text-sm font-semibold text-slate-700">
            {{ auth.isMember ? '有效' : auth.user?.membershipStatus === 'expired' ? '已过期' : '未开通' }}
          </p>
        </div>
      </div>
    </div>

    <!-- 我的订单 -->
    <h2 class="mt-10 text-lg font-bold text-slate-900">我的订单</h2>
    <div class="mt-4 overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-card">
      <el-table :data="orders" v-loading="loading" class="w-full">
        <el-table-column label="订单号" prop="id" width="90" />
        <el-table-column label="方案" prop="planName" min-width="120" />
        <el-table-column label="金额" min-width="100">
          <template #default="{ row }">
            <span class="font-semibold text-red-500">¥{{ row.amount }}</span>
          </template>
        </el-table-column>
        <el-table-column label="状态" min-width="100">
          <template #default="{ row }">
            <el-tag :type="statusTag(row.status).type" size="small">
              {{ statusTag(row.status).text }}
            </el-tag>
          </template>
        </el-table-column>
        <el-table-column label="下单时间" min-width="160">
          <template #default="{ row }">{{ formatTime(row.createdAt) }}</template>
        </el-table-column>
        <el-table-column label="支付时间" min-width="160">
          <template #default="{ row }">{{ formatTime(row.paidAt) }}</template>
        </el-table-column
        >
      </el-table>

      <el-empty
        v-if="!loading && orders.length === 0"
        description="还没有订单，去开通会员吧"
      />
    </div>

    <!-- 修改密码弹窗 -->
    <el-dialog v-model="pwdVisible" width="420px" align-center title="修改密码">
      <el-form label-position="top" class="py-2">
        <el-form-item label="原密码" required>
          <el-input
            v-model="pwdForm.oldPassword"
            type="password"
            show-password
            placeholder="请输入原密码"
          />
        </el-form-item>
        <el-form-item label="新密码（6–32 个字符）" required>
          <el-input
            v-model="pwdForm.newPassword"
            type="password"
            show-password
            placeholder="请输入新密码"
          />
        </el-form-item>
        <el-form-item label="确认新密码" required>
          <el-input
            v-model="pwdForm.confirmPassword"
            type="password"
            show-password
            placeholder="请再次输入新密码"
            @keyup.enter="submitPassword"
          />
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="pwdVisible = false">取消</el-button>
        <el-button
          type="primary"
          class="!bg-brand-500"
          :loading="pwdSaving"
          @click="submitPassword"
        >
          确认修改
        </el-button>
      </template>
    </el-dialog>
  </div>
</template>
