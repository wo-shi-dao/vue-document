<template>
  <d-category-search
    ref="categorySearchRef"
    v-model:selected-tags="selectedTags"
    :category="category"
    @search="onSearch"
  >
    <!-- 自定义创建时间的下拉菜单：使用 d-range-date-picker-pro -->
    <template #createTimeMenu="scope">
      <div class="date-range-menu">
        <d-range-date-picker-pro
          v-model="tempDateRange"
          :placeholder="['开始日期', '结束日期']"
          format="YYYY-MM-DD HH:mm:ss"
          showTime
          :clearable="true"
        />

        <div class="date-range-buttons">
          <d-button
            variant="solid"
            @click="() => confirmDateSelection(scope, scope.tagOption)"
          >
            确定
          </d-button>
          <d-button @click="cancelDateSelection(scope)">取消</d-button>
        </div>
      </div>
    </template>

    <!-- 自定义创建时间的标签展示 -->
    <template #createTimeTag="scope">
      <span>{{ scope.tag.label }}: </span>
      <span v-if="scope.tag.value && scope.tag.value.length === 2">
        {{ scope.tag.value[0] }} — {{ scope.tag.value[1] }}
      </span>
      <span v-else> </span>
    </template>
  </d-category-search>
</template>

<script setup>
import { ref } from "vue";
import dayjs from "dayjs";
// import { DCategorySearch, DRangeDatePickerPro, DButton } from 'vue-devui'

// ---------- 组件配置 ----------
const category = ref([
  {
    label: "创建人",
    field: "creator",
    type: "textInput",
    group: "Basic",
    maxLength: 10,
    validateRules: [
      { required: true, message: "不能为空", trigger: "change" },
      // {
      //   min: 3,
      //   max: 10,
      //   message: "不小于3个字符，不大于6个字符",
      //   trigger: "change",
      // },
    ],
  },
  {
    label: "创建时间",
    field: "createTime",
    type: "custom", // 自定义类型，使用插槽渲染
    group: "Basic",
    filterKey: "createTime",
  },
]);

const selectedTags = ref([]); // 已选标签

const categorySearchRef = ref(null);

// 日期范围选择器的临时值（格式：[开始日期, 结束日期]）
const tempDateRange = ref([]);

// 可选：限制日历面板可选的年份范围（例如 [2020, 2026]）
const calendarRange = ref([2020, 2026]);
// 可选：限制可选择的具体日期范围（例如 { min: '2020-01-01', max: '2026-12-31' }）
const limitDateRange = ref(null);

// 确认日期选择
const confirmDateSelection = (scope, tagOption) => {
  const start = dayjs(tempDateRange.value[0]).format("YYYY-MM-DD HH:mm:ss");
  const end = dayjs(tempDateRange.value[1]).format("YYYY-MM-DD HH:mm:ss");

  const newTag = {
    label: tagOption.label,
    field: tagOption.field,
    value: [start, end], // 存储为数组格式，便于后续使用
  };

  // 替换或新增该字段的标签
  const existingIndex = selectedTags.value.findIndex(
    (tag) => tag.field === tagOption.field,
  );
  if (existingIndex !== -1) {
    selectedTags.value[existingIndex] = newTag;
  } else {
    selectedTags.value.push(newTag);
  }

  // 处理选中的数据
  categorySearchRef.value.chooseItem(tagOption, selectedTags.value?.value);

  // 清空临时数据
  tempDateRange.value = [];

  // 关闭自定义内容
  // scope.close();
};

const onSearch = (e) => {
  console.log("search items:", e);
};

// 取消日期选择
const cancelDateSelection = (scope) => {
  console.log("scope", scope);

  tempDateRange.value = [];
  scope.close();

  // categorySearchRef.value.style.display = "none";
};
</script>

<style scoped>
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
