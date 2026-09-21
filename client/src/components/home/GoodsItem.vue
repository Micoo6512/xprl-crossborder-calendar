<script setup>
import { computed } from 'vue';
import { PLATFORMS } from '../../constants/platforms.js';

const props = defineProps({
  goods: { type: Object, required: true },
  expanded: { type: Boolean, default: false },
});
const emit = defineEmits(['toggle', 'jump']);

const crossPlatforms = computed(() => PLATFORMS.filter((item) => item.group === 'cross'));
const domesticPlatforms = computed(() => PLATFORMS.filter((item) => item.group === 'domestic'));

const priorityStyle = computed(() => {
  switch (props.goods.priority) {
    case 'P1': return 'bg-red-50 text-red-600';
    case 'P3': return 'bg-slate-100 text-slate-500';
    default: return 'bg-blue-50 text-blue-600';
  }
});
</script>

<template>
  <div class="rounded-xl border border-slate-100 transition" :class="expanded ? 'border-brand-200 bg-brand-50/40' : 'hover:bg-slate-50'">
    <div class="flex items-center gap-3 px-3 py-2.5">
      <span class="rounded px-1.5 py-0.5 text-[11px] font-bold" :class="priorityStyle">
        {{ goods.priority }}
      </span>
      <button
        class="min-w-0 flex-1 truncate text-left text-sm font-medium text-slate-700"
        @click="emit('toggle')"
      >
        {{ goods.name }}
      </button>
      <button
        class="hidden min-w-0 max-w-[240px] truncate rounded px-2 py-0.5 text-left font-mono text-xs text-slate-500 hover:bg-slate-100 hover:text-brand-600 sm:block"
        @click="emit('toggle')"
      >
        {{ goods.enKeyword }}
      </button>
      <el-icon class="text-slate-400 transition" :class="expanded ? 'rotate-180' : ''">
        <ArrowDown />
      </el-icon>
    </div>

    <div v-if="expanded" class="border-t border-brand-100 px-3 py-3">
      <p class="mb-2 text-xs leading-relaxed text-slate-500">
        跨境平台按英文关键词「<span class="font-mono text-slate-700">{{ goods.enKeyword }}</span>」搜索；
        国内进货按中文名称「<span class="text-slate-700">{{ goods.name }}</span>」搜索。
      </p>
      <p class="mb-2.5 text-xs leading-relaxed text-slate-400">
        提示：1688、拼多多批发需先登录平台账号才能查看搜索结果；义乌购可直接浏览。
      </p>

      <div class="space-y-2.5">
        <div class="flex flex-wrap items-center gap-2">
          <span class="w-14 shrink-0 text-xs text-slate-400">跨境平台</span>
          <button
            v-for="platform in crossPlatforms"
            :key="platform.code"
            class="flex items-center gap-1.5 rounded-lg border border-slate-200 bg-white px-2.5 py-1.5 text-xs font-medium text-slate-700 transition hover:-translate-y-0.5 hover:border-slate-300 hover:shadow-sm"
            @click="emit('jump', { goodsId: goods.id, platform: platform.code })"
          >
            <span
              class="flex h-4 w-4 items-center justify-center rounded text-[9px] font-bold text-white"
              :style="{ backgroundColor: platform.color }"
            >{{ platform.letter }}</span>
            {{ platform.name }}
            <el-icon class="text-slate-300"><TopRight /></el-icon>
          </button>
        </div>
        <div class="flex flex-wrap items-center gap-2">
          <span class="w-14 shrink-0 text-xs text-slate-400">国内进货</span>
          <button
            v-for="platform in domesticPlatforms"
            :key="platform.code"
            class="flex items-center gap-1.5 rounded-lg border border-slate-200 bg-white px-2.5 py-1.5 text-xs font-medium text-slate-700 transition hover:-translate-y-0.5 hover:border-slate-300 hover:shadow-sm"
            @click="emit('jump', { goodsId: goods.id, platform: platform.code })"
          >
            <span
              class="flex h-4 w-4 items-center justify-center rounded text-[9px] font-bold text-white"
              :style="{ backgroundColor: platform.color }"
            >{{ platform.letter }}</span>
            {{ platform.name }}
            <el-icon class="text-slate-300"><TopRight /></el-icon>
          </button>
        </div>
      </div>
    </div>
  </div>
</template>
