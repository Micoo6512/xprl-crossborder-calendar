<script setup>
import { onMounted, ref } from 'vue';
import { useRouter } from 'vue-router';
import { ElMessage } from 'element-plus';
import { orderApi } from '../api/index.js';
import { useAuthStore } from '../stores/auth.js';

const router = useRouter();
const auth = useAuthStore();

const plans = ref([]);
const cashierVisible = ref(false);
const paying = ref(false);
const currentOrder = ref(null);

const benefitRows = [
  { label: '开放区域', free: '北美、欧洲', paid: '五大区域全开' },
  { label: '节日数据', free: '30–60 天（限北美/欧洲）', paid: '30–60 天完整数据' },
  { label: '一键搜索跳转', free: '2 次 / 天', paid: '不限次数' },
  { label: '商品推荐清单', free: '每节日 5 件（共 10 件）', paid: '每节日 10 件完整清单' },
];

const faqs = [
  { q: '为什么这么便宜？', a: '产品定位是薄利多销的刚需工具，节日数据每年仅需更新一次，维护成本低，所以把利润让给卖家。' },
  { q: '会员到期后数据还能看吗？', a: '到期后自动回到免费版，可继续查看北美、欧洲区域与每日 2 次搜索；续费后立即恢复全部权益。' },
  { q: '当前支付是真实扣款吗？', a: 'V1.0 演示环境为模拟支付，不会产生真实扣款；正式上线后接入支付宝/微信扫码支付。' },
];

onMounted(async () => {
  const { data } = await orderApi.plans();
  plans.value = data;
});

async function choosePlan(planCode) {
  if (!auth.isLoggedIn) {
    window.dispatchEvent(new CustomEvent('xprl:login'));
    return;
  }

  const { data } = await orderApi.create(planCode);
  currentOrder.value = data.order;
  cashierVisible.value = true;
}

async function confirmPay() {
  paying.value = true;
  try {
    const { data } = await orderApi.pay(currentOrder.value.id);
    cashierVisible.value = false;
    ElMessage.success('支付成功，会员已开通！');
    await auth.fetchProfile();
    router.push('/account');
  } finally {
    paying.value = false;
  }
}
</script>

<template>
  <div class="container-page py-10 sm:py-14">
    <div class="text-center">
      <h1 class="text-2xl font-bold text-slate-900 sm:text-3xl">会员定价</h1>
      <p class="mt-2 text-sm text-slate-500">
        一天不到 3 毛钱，全年节日备货不迷路
      </p>
    </div>

    <!-- 方案卡片 -->
    <div class="mx-auto mt-10 grid max-w-3xl gap-5 sm:grid-cols-2">
      <div
        v-for="plan in plans"
        :key="plan.code"
        class="relative flex flex-col rounded-2xl border bg-white p-6 shadow-card transition hover:shadow-cardHover"
        :class="plan.recommended ? 'border-brand-400 ring-2 ring-brand-100' : 'border-slate-200'"
      >
        <span
          v-if="plan.recommended"
          class="absolute -top-3 left-1/2 -translate-x-1/2 rounded-full bg-brand-500 px-3 py-1 text-xs font-bold text-white"
        >
          主推 · 最划算
        </span>

        <h3 class="text-base font-semibold text-slate-700">{{ plan.name }}</h3>
        <div class="mt-4 flex items-baseline gap-1">
          <span class="text-4xl font-bold text-slate-900">¥{{ plan.price }}</span>
          <span class="text-sm text-slate-400">/ {{ plan.code === 'monthly' ? '月' : '年' }}</span>
        </div>
        <p class="mt-2 text-sm text-slate-500">{{ plan.tagline }}</p>

        <ul class="mt-5 flex-1 space-y-2 text-sm text-slate-600">
          <li v-for="row in benefitRows" :key="row.label" class="flex gap-2">
            <el-icon class="mt-0.5 text-brand-500"><Check /></el-icon>
            {{ row.label }}：{{ row.paid }}
          </li>
        </ul>

        <el-button
          size="large"
          class="mt-6"
          :type="plan.recommended ? 'primary' : 'default'"
          :class="plan.recommended ? '!bg-brand-500' : ''"
          @click="choosePlan(plan.code)"
        >
          立即开通
        </el-button>
      </div>
    </div>

    <!-- 权益对比表 -->
    <div class="mt-14 overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-card">
      <table class="w-full text-sm">
        <thead>
          <tr class="bg-slate-50 text-left text-slate-500">
            <th class="px-5 py-3 font-medium">权益对比</th>
            <th class="px-5 py-3 font-medium">免费版</th>
            <th class="px-5 py-3 font-medium text-brand-600">会员（月/年）</th>
          </tr>
        </thead>
        <tbody>
          <tr v-for="row in benefitRows" :key="row.label" class="border-t border-slate-100">
            <td class="px-5 py-3 font-medium text-slate-700">{{ row.label }}</td>
            <td class="px-5 py-3 text-slate-500">{{ row.free }}</td>
            <td class="px-5 py-3 font-medium text-slate-700">{{ row.paid }}</td>
          </tr>
        </tbody>
      </table>
    </div>

    <!-- FAQ -->
    <div class="mx-auto mt-14 max-w-3xl">
      <h2 class="text-center text-lg font-bold text-slate-900">常见问题</h2>
      <el-collapse class="mt-5">
        <el-collapse-item
          v-for="item in faqs"
          :key="item.q"
          :title="item.q"
          :name="item.q"
        >
          <p class="text-sm leading-relaxed text-slate-500">{{ item.a }}</p>
        </el-collapse-item>
      </el-collapse>
    </div>

    <!-- 模拟收银台 -->
    <el-dialog v-model="cashierVisible" width="420px" align-center title="模拟收银台">
      <div v-if="currentOrder" class="py-2">
        <div class="rounded-xl bg-slate-50 p-4">
          <div class="flex justify-between text-sm">
            <span class="text-slate-500">订单号</span>
            <span class="font-mono text-slate-700">#{{ currentOrder.id }}</span>
          </div>
          <div class="mt-2 flex justify-between text-sm">
            <span class="text-slate-500">方案</span>
            <span class="text-slate-700">{{ currentOrder.planName }}</span>
          </div>
          <div class="mt-2 flex justify-between text-base">
            <span class="text-slate-500">应付金额</span>
            <span class="font-bold text-red-500">¥{{ currentOrder.amount }}</span>
          </div>
        </div>
        <p class="mt-4 text-center text-xs text-slate-400">
          当前为演示环境，点击下方按钮模拟支付成功（不会真实扣款）
        </p>
      </div>
      <template #footer>
        <el-button @click="cashierVisible = false">取消支付</el-button>
        <el-button type="primary" class="!bg-brand-500" :loading="paying" @click="confirmPay">
          模拟支付成功
        </el-button>
      </template>
    </el-dialog>
  </div>
</template>
