<script setup>
import { computed } from 'vue';
import dayjs from 'dayjs';
import { REGIONS } from '../../constants/regions.client.js';
import { useAuthStore } from '../../stores/auth.js';

const props = defineProps({
  prepDays: { type: Number, required: true },
  selectedRegions: { type: Array, required: true },
  baseDate: { type: String, required: true },
});
const emit = defineEmits(['update:prepDays', 'update:selectedRegions', 'update:baseDate']);

const auth = useAuthStore();

const todayString = dayjs().format('YYYY-MM-DD');
const isCustomDate = computed(() => props.baseDate !== todayString);

const dateModel = computed({
  get: () => props.baseDate,
  set: (value) => emit('update:baseDate', value),
});

function resetToToday() {
  emit('update:baseDate', todayString);
}

// 基准日期可选范围：今日前后 2 年（与后端约束一致）
const disabledDate = (date) => {
  const offset = dayjs(date).diff(dayjs(), 'day');
  return Math.abs(offset) > 730;
};

function toggleRegion(code) {
  if (!auth.isMember && !['NA', 'EU'].includes(code)) return;
  const next = new Set(props.selectedRegions);
  if (next.has(code)) next.delete(code);
  else next.add(code);
  emit('update:selectedRegions', [...next]);
}

const options = [
  { value: 30, label: '提前 30 天', desc: '常规小件' },
  { value: 45, label: '提前 45 天', desc: '海运 / 大件' },
];
</script>

<template>
  <div class="rounded-2xl border border-slate-200 bg-white p-4 shadow-card sm:p-5">
    <div class="grid gap-4 lg:grid-cols-12 lg:items-center">
      <!-- 备货周期 -->
      <div class="lg:col-span-4">
        <p class="mb-2 text-xs font-semibold uppercase tracking-wide text-slate-400">
          备货周期
        </p>
        <div class="flex rounded-xl bg-slate-100 p-1">
          <button
            v-for="item in options"
            :key="item.value"
            class="flex-1 rounded-lg px-3 py-2 text-sm font-medium transition"
            :class="prepDays === item.value
              ? 'bg-white text-brand-600 shadow-sm'
              : 'text-slate-500 hover:text-slate-700'"
            @click="emit('update:prepDays', item.value)"
          >
            {{ item.label }}
            <span class="ml-1 hidden text-xs text-slate-400 xl:inline">{{ item.desc }}</span>
          </button>
        </div>
      </div>

      <!-- 区域筛选 -->
      <div class="lg:col-span-5">
        <p class="mb-2 text-xs font-semibold uppercase tracking-wide text-slate-400">
          区域筛选
          <span v-if="!auth.isMember" class="normal-case tracking-normal text-brand-500">
            · 免费版仅北美/欧洲
          </span>
        </p>
        <div class="flex flex-wrap gap-2">
          <button
            v-for="region in REGIONS"
            :key="region.code"
            class="rounded-full border px-3 py-1.5 text-sm transition"
            :class="[
              selectedRegions.includes(region.code)
                ? 'border-brand-500 bg-brand-500 text-white'
                : 'border-slate-200 bg-white text-slate-600 hover:border-brand-300',
              !auth.isMember && !['NA', 'EU'].includes(region.code)
                ? 'cursor-not-allowed opacity-45 hover:border-slate-200'
                : '',
            ]"
            :title="!auth.isMember && !['NA', 'EU'].includes(region.code)
              ? '升级会员解锁该区域'
              : region.desc"
            @click="toggleRegion(region.code)"
          >
            <span v-if="!auth.isMember && !['NA','EU'].includes(region.code)">🔒 </span>
            {{ region.name }}
          </button>
        </div>
      </div>

      <!-- 基准日期 -->
      <div class="lg:col-span-3">
        <p class="mb-2 text-xs font-semibold uppercase tracking-wide text-slate-400">
          基准日期
          <span v-if="isCustomDate" class="normal-case tracking-normal text-amber-500">
            · 自定义中
          </span>
        </p>
        <div class="flex items-center gap-2">
          <el-date-picker
            v-model="dateModel"
            type="date"
            value-format="YYYY-MM-DD"
            :disabled-date="disabledDate"
            :clearable="false"
            class="!flex-1"
            placeholder="选择日期"
          />
          <el-button
            class="shrink-0"
            :type="isCustomDate ? 'primary' : 'default'"
            :class="isCustomDate ? '!bg-brand-500' : ''"
            @click="resetToToday"
          >
            今天
          </el-button>
        </div>
        <p class="mt-1.5 text-xs text-slate-400">
          默认今天 · 仅展示该日期起 30–60 天节日
        </p>
      </div>
    </div>
  </div>
</template>
