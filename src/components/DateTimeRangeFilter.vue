<template>
  <div class="category-search">
    <d-category-search
      ref="categorySearchRef"
      v-model:selected-tags="selectedTags"
      :category="categoryConfig"
      :extend-config="extendConfig"
      @search="onSearch"
    >
      <!-- 动态生成自定义字段的下拉菜单插槽 -->
      <template
        v-for="item in customFields"
        :key="item.field"
        #[`${item.field}Menu`]="scope"
      >
        <div class="date-range-menu">
          <d-range-date-picker-pro
            v-model="tempDateRangeMap[item.field]"
            :placeholder="['开始日期', '结束日期']"
            format="YYYY-MM-DD HH:mm:ss"
            showTime
            :clearable="true"
          />

          <div class="date-range-buttons">
            <d-button
              variant="solid"
              @click="confirmDateSelection(scope, scope.tagOption, item.field)"
            >
              确定
            </d-button>
            <d-button @click="cancelDateSelection(scope, item.field)"
              >取消</d-button
            >
          </div>
        </div>
      </template>

      <!-- 动态生成自定义字段的标签展示插槽 -->
      <template
        v-for="item in customFields"
        :key="item.field"
        #[`${item.field}Tag`]="scope"
      >
        <span>{{ scope.tag.label }}: </span>
        <span v-if="scope.tag.value && scope.tag.value.length === 2">
          {{ scope.tag.value[0] }} — {{ scope.tag.value[1] }}
        </span>
        <span v-else> </span>
      </template>
    </d-category-search>
  </div>
</template>

<script setup>
import { ref, watch, computed, reactive } from "vue";
import dayjs from "dayjs";

const props = defineProps({
  category: {
    type: Array,
    default: () => [],
  },
  modelValue: {
    type: Array,
    default: () => [],
  },
});

const emit = defineEmits(["search", "update:modelValue"]);

const categoryConfig = computed(() => props.category);

const customFields = computed(() => {
  return props.category.filter((item) => item.type === "custom");
});

const selectedTags = ref([]);

const extendConfig = reactive({
  show: true,
  save: false,
});

watch(
  () => props.modelValue,
  (newVal) => {
    selectedTags.value = newVal || [];
  },
  { immediate: true },
);

watch(
  selectedTags,
  (newVal) => {
    emit("update:modelValue", newVal);
  },
  { deep: true },
);

const categorySearchRef = ref(null);

const tempDateRangeMap = reactive({});

watch(
  customFields,
  (fields) => {
    fields.forEach((field) => {
      if (!tempDateRangeMap[field.field]) {
        tempDateRangeMap[field.field] = [];
      }
    });
  },
  { immediate: true },
);

const calendarRange = ref([2020, 2026]);
const limitDateRange = ref(null);

const confirmDateSelection = (scope, tagOption, fieldName) => {
  const dateRange = tempDateRangeMap[fieldName];
  const start = dayjs(dateRange[0]).format("YYYY-MM-DD HH:mm:ss");
  const end = dayjs(dateRange[1]).format("YYYY-MM-DD HH:mm:ss");

  const newTag = {
    label: tagOption.label,
    field: tagOption.field,
    value: [start, end],
  };

  const existingIndex = selectedTags.value.findIndex(
    (tag) => tag.field === tagOption.field,
  );
  if (existingIndex !== -1) {
    selectedTags.value[existingIndex] = newTag;
  } else {
    selectedTags.value.push(newTag);
  }

  categorySearchRef.value.chooseItem(tagOption, selectedTags.value?.value);
  tempDateRangeMap[fieldName] = [];
};

const onSearch = (e) => {
  console.log("search items:", e);
  emit("search", e);
};

const cancelDateSelection = (scope, fieldName) => {
  tempDateRangeMap[fieldName] = [];
  scope.close();
};
</script>

<style scoped>
.category-search {
  max-width: 1000px;
  min-width: 500px;
}

.date-range-menu {
  padding: 12px;
  background: #fff;
  border-radius: 4px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.15);
  /* 让 d-range-date-picker-pro 内部自动撑开宽度 */
  min-width: 560px;
}

.devui-range-date-picker-pro {
  width: 100%;
}

.date-range-buttons {
  display: flex;
  justify-content: center;
  gap: 8px;
  margin-top: 12px;
  padding-top: 8px;
  border-top: 1px solid #f0f0f0;
}
</style>
