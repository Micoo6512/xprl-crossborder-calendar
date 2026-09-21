<script setup>
import { computed, ref, watch } from 'vue';
import { useRouter } from 'vue-router';
import dayjs from 'dayjs';
import { ElMessageBox } from 'element-plus';
import ControlPanel from '../components/home/ControlPanel.vue';
import FestivalCard from '../components/home/FestivalCard.vue';
import { festivalApi } from '../api/index.js';
import { useAuthStore } from '../stores/auth.js';

const router = useRouter();
const auth = useAuthStore();

const prepDays = ref(30);
const selectedRegions = ref([]);
const baseDate = ref(dayjs().format('YYYY-MM-DD'));
const festivals = ref([]);
const loading = ref(false);
const expandedId = ref(null);
const detailMap = ref({});

async function loadFestivals() {
  loading.value = true;
  try {
    const params = { prepDays: prepDays.value, baseDate: baseDate.value };
    if (selectedRegions.value.length) {
      params.regions = selectedRegions.value.join(',');
    }
    const { data } = await festivalApi.list(params);
    festivals.value = data;

    // 保持已展开节日的详情与新备货周期同步
    if (expandedId.value) await loadDetail(expandedId.value, true);
  } finally {
    loading.value = false;
  }
}

async function loadDetail(id, silent = false) {
  try {
    const { data } = await festivalApi.detail(id, {
      prepDays: prepDays.value,
      baseDate: baseDate.value,
    });
    detailMap.value = { ...detailMap.value, [id]: data };
  } catch (error) {
    if (!silent) throw error;
  }
}

async function toggleFestival(id) {
  if (expandedId.value === id) {
    expandedId.value = null;
    return;
  }
  expandedId.value = id;
  if (!detailMap.value[id]) await loadDetail(id);
}

function promptUpgrade(message) {
  ElMessageBox.confirm(message, '升级会员', {
    confirmButtonText: '查看会员方案',
    cancelButtonText: '以后再说',
    type: 'warning',
  })
    .then(() => router.push('/pricing'))
    .catch(() => {});
}

async function handleJump({ goodsId, platform }) {
  try {
    const { data } = await festivalApi.jump(goodsId, platform);
    window.open(data.url, '_blank', 'noopener');
    if (auth.isLoggedIn) auth.fetchProfile();
  } catch (error) {
    if (['JUMP_LIMIT', 'REGION_LOCKED'].includes(error.code)) {
      promptUpgrade(`${error.message}，立即开通会员？`);
    }
    // 401 已由拦截器唤起登录弹窗
  }
}

watch([prepDays, selectedRegions, baseDate], loadFestivals, { immediate: true });

const remainingText = computed(() => {
  if (!auth.isLoggedIn) return '登录后每日 2 次免费搜索';
  if (auth.isMember) return '会员：搜索不限次';
  return `免费用户：今日剩余 ${auth.user?.jump.remainingToday ?? 2} 次搜索`;
});
</script>

<template>
  <div>
    <!-- Hero -->
    <section class="border-b border-slate-200 bg-gradient-to-b from-brand-50/70 to-transparent">
      <div class="container-page py-8 sm:py-10">
        <h1 class="text-2xl font-bold text-slate-900 sm:text-3xl">
          未来 30–60 天节日选品窗口
        </h1>
        <p class="mt-2 max-w-2xl text-sm leading-relaxed text-slate-500 sm:text-base">
          自动计算最晚备货截止日，节日适配商品 + 英文搜索关键词，一键跳转 Temu / Amazon / Etsy 与 1688 / 义乌购 / 拼多多批发。
        </p>
      </div>
    </section>

    <div class="container-page -mt-4 pb-16 sm:-mt-6">
      <ControlPanel
        v-model:prep-days="prepDays"
        v-model:selected-regions="selectedRegions"
        v-model:base-date="baseDate"
      />

      <!-- 列表工具条 -->
      <div class="mt-6 flex flex-wrap items-center justify-between gap-3">
        <p class="text-sm text-slate-500">
          <span class="font-semibold text-slate-800">{{ festivals.length }}</span>
          个节日 · 按倒计时由近到远 · {{ remainingText }}
        </p>
      </div>

      <!-- 节日列表 -->
      <div v-loading="loading" class="mt-4 space-y-4">
        <FestivalCard
          v-for="festival in festivals"
          :key="festival.id"
          :festival="festival"
          :detail="detailMap[festival.id]"
          :expanded="expandedId === festival.id"
          @toggle="toggleFestival(festival.id)"
          @jump="handleJump"
          @unlock="promptUpgrade('升级会员解锁全部商品与五大区域，立即开通？')"
        />

        <el-empty
          v-if="!loading && festivals.length === 0"
          description="当前筛选下暂无 30–60 天内的节日，试试调整区域筛选"
        />
      </div>
    </div>
  </div>
</template>
