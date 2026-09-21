<script setup>
import { nextTick, ref, watch } from 'vue';
import GoodsItem from './GoodsItem.vue';

const props = defineProps({
  festival: { type: Object, required: true },
  detail: { type: Object, default: null },
  expanded: { type: Boolean, default: false },
});
const emit = defineEmits(['toggle', 'jump', 'unlock']);

const openGoodsId = ref(null);

// 节日介绍长文折叠
const introRef = ref(null);
const introExpanded = ref(false);
const introOverflow = ref(false);

function measureIntro() {
  const el = introRef.value;
  // 折叠为 4 行时，scrollHeight 大于可见高度即说明内容被截断
  introOverflow.value = el ? el.scrollHeight > el.clientHeight + 2 : false;
}

// 收起详情时同时关闭商品行；展开时重置介绍为折叠态并检测是否超长
watch(
  () => props.expanded,
  (value) => {
    if (!value) {
      openGoodsId.value = null;
      introExpanded.value = false;
    } else {
      introExpanded.value = false;
      nextTick(measureIntro);
    }
  },
);

// 列表数据刷新（切换筛选/基准日期）后重新检测
watch(
  () => props.festival.id,
  () => {
    if (props.expanded) {
      introExpanded.value = false;
      nextTick(measureIntro);
    }
  },
);

function toggleGoods(id) {
  openGoodsId.value = openGoodsId.value === id ? null : id;
}

const regionStyle = 'bg-slate-100 text-slate-600';
</script>

<template>
  <article
    class="overflow-hidden rounded-2xl border bg-white shadow-card transition"
    :class="expanded ? 'border-brand-300 shadow-cardHover' : 'border-slate-200 hover:shadow-cardHover'"
  >
    <!-- 卡片主体（点击展开） -->
    <button class="w-full p-5 text-left" @click="emit('toggle')">
      <div class="flex flex-wrap items-start justify-between gap-4">
        <div class="min-w-0 flex-1">
          <div class="flex flex-wrap items-center gap-2">
            <h3 class="text-lg font-bold text-slate-900">{{ festival.name }}</h3>
            <span class="text-sm text-slate-400">{{ festival.enName }}</span>
          </div>
          <div class="mt-2 flex flex-wrap gap-1.5">
            <span
              v-for="region in festival.regions"
              :key="region.code"
              class="rounded px-2 py-0.5 text-xs font-medium"
              :class="regionStyle"
            >
              {{ region.name }}
            </span>
          </div>
        </div>

        <!-- 倒计时 -->
        <div class="flex items-center gap-3">
          <div class="text-right">
            <p class="text-3xl font-bold leading-none" :class="festival.deadlineUrgent ? 'text-red-500' : 'text-brand-600'">
              {{ festival.daysUntil }}
            </p>
            <p class="mt-1 text-xs text-slate-400">天后</p>
          </div>
          <el-icon
            class="text-slate-300 transition"
            :class="expanded ? 'rotate-180' : ''"
            size="18"
          >
            <ArrowDown />
          </el-icon>
        </div>
      </div>

      <div class="mt-4 grid gap-3 sm:grid-cols-2">
        <div class="rounded-xl bg-slate-50 px-3 py-2">
          <p class="text-xs text-slate-400">节日日期</p>
          <p class="mt-0.5 text-sm font-semibold text-slate-700">{{ festival.festivalDate }}</p>
        </div>
        <div
          class="rounded-xl px-3 py-2"
          :class="festival.deadlineUrgent ? 'bg-red-50' : 'bg-amber-50'"
        >
          <p class="text-xs" :class="festival.deadlineUrgent ? 'text-red-400' : 'text-amber-500'">
            最晚备货截止日
            <span v-if="festival.deadlineUrgent" class="font-bold">· 紧急</span>
          </p>
          <p
            class="mt-0.5 text-sm font-bold"
            :class="festival.deadlineUrgent ? 'text-red-600' : 'text-amber-600'"
          >
            {{ festival.deadline }}
          </p>
        </div>
      </div>

    </button>

    <!-- 节日介绍：卡片收起时两行预览；展开后默认折叠为四行，超长可展开全文 -->
    <div v-if="festival.intro" class="px-5 pb-5">
      <p
        ref="introRef"
        class="text-sm leading-relaxed text-slate-500"
        :class="expanded ? (introExpanded ? '' : 'line-clamp-4') : 'line-clamp-2'"
      >
        {{ festival.intro }}
      </p>
      <button
        v-if="expanded && introOverflow"
        type="button"
        class="mt-1.5 flex items-center gap-1 text-sm font-medium text-brand-600 transition hover:text-brand-700"
        @click="introExpanded = !introExpanded"
      >
        {{ introExpanded ? '收起' : '展开阅读全文' }}
        <el-icon size="14" :class="introExpanded ? 'rotate-180' : ''">
          <ArrowDown />
        </el-icon>
      </button>
    </div>

    <!-- 详情面板 -->
    <div v-if="expanded" class="border-t border-slate-100 bg-slate-50/60 p-5">
      <div v-if="festival.advice" class="mb-4 flex gap-2 rounded-xl bg-brand-50 px-3 py-2.5">
        <el-icon class="mt-0.5 shrink-0 text-brand-500"><MagicStick /></el-icon>
        <p class="text-sm leading-relaxed text-brand-700">{{ festival.advice }}</p>
      </div>

      <div class="mb-2 flex items-center justify-between">
        <h4 class="text-sm font-semibold text-slate-700">
          适配商品清单
          <span class="ml-1 text-xs font-normal text-slate-400">
            （点击商品或关键词，展开平台一键搜索）
          </span>
        </h4>
      </div>

      <div v-if="detail" class="space-y-2">
        <GoodsItem
          v-for="goods in detail.goods"
          :key="goods.id"
          :goods="goods"
          :expanded="openGoodsId === goods.id"
          @toggle="toggleGoods(goods.id)"
          @jump="emit('jump', $event)"
        />

        <!-- 锁定商品 -->
        <button
          v-if="detail.lockedGoodsCount"
          class="flex w-full items-center justify-center gap-2 rounded-xl border border-dashed border-slate-300 bg-white/60 px-3 py-3 text-sm text-slate-500 transition hover:border-brand-300 hover:text-brand-600"
          @click="emit('unlock')"
        >
          <el-icon><Lock /></el-icon>
          还有 {{ detail.lockedGoodsCount }} 件高相关商品，升级会员解锁完整清单
        </button>
      </div>
      <div v-else class="flex justify-center py-6">
        <el-icon class="is-loading text-2xl text-brand-400"><Loading /></el-icon>
      </div>
    </div>
  </article>
</template>
