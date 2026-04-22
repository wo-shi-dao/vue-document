<template>
  <el-dialog
    v-model="visible"
    width="500px"
    align-center
    :close-on-click-modal="false"
    :close-on-press-escape="false"
    :show-close="false"
    center
  >
    <div class="progress-content">
      <!-- 第一部分：图标和标题 -->
      <div class="progress-header">

        <el-icon :size="40" color="#409eff">
          <component :is="currentIcon" />
        </el-icon>
        <h2 class="progress-title">{{ title }}</h2>
        <p class="progress-description">{{ description }}</p>
      </div>

      <!-- 第二部分：进度条 -->
      <div class="progress-bar-section">
        <div class="progress-label">
          <span>{{ progressText }}</span>
        </div>
        <el-progress
          :percentage="percentage"
          :status="status"
          :stroke-width="12"
        />
      </div>

      <!-- 第三部分：底部提示 -->
      <div class="progress-footer">
        <div v-if="percentage === 100" class="finish-icon">
          <el-icon>
            <CircleCheck />
          </el-icon>
          <span>{{ footerText }}</span>
        </div>
        <div v-else class="loading-div">
          <el-icon class="loading-icon">
            <Loading />
          </el-icon>
          <span>{{ footerText }}</span>
        </div>
      </div>
    </div>
  </el-dialog>
</template>

<script setup>
import { ref, computed } from "vue";
import { Loading, CircleCheck, DataAnalysis, DocumentAdd, Tools, Upload } from "@element-plus/icons-vue";

const props = defineProps({
  modelValue: {
    type: Boolean,
    default: false,
  },
  title: {
    type: String,
    default: "正在处理",
  },
  description: {
    type: String,
    default: "请稍候...",
  },
  progressText: {
    type: String,
    default: "处理进度",
  },
  footerText: {
    type: String,
    default: "正在处理...",
  },
  percentage: {
    type: Number,
    default: 0,
  },
  status: {
    type: String,
    default: "",
  },
  iconType: {
    type: String,
    default: 'add'
  }
});

const emit = defineEmits(["update:modelValue"]);

const visible = computed({
  get: () => props.modelValue,
  set: (val) => emit("update:modelValue", val),
});

const currentIcon = computed(() => {
  const iconMap = {
    init: Tools,           // 初始化
    add: DocumentAdd,   // 生成文档
    parse: DataAnalysis,      // 解析数据（默认）
    import: Upload      // 失败/异常
  }
  return iconMap[props.iconType] || DocumentAdd
})

</script>

<style scoped>
.progress-content {
  padding: 20px 0;
}

.progress-header {
  text-align: center;
  margin-bottom: 20px;
}

.progress-icon {
  color: #409eff;
  animation: rotate 1s linear infinite;
}

@keyframes rotate {
  from {
    transform: rotate(0deg);
  }
  to {
    transform: rotate(360deg);
  }
}

.progress-title {
  font-size: 16px;
  font-weight: bold;
  margin: 15px 0 10px;
  color: #303133;
}

.progress-description {
  font-size: 14px;
  color: #909399;
  margin: 0;
  padding-top: 10px;
}

.progress-bar-section {
  margin-bottom: 30px;
}

.progress-bar-section :deep(.el-progress__text) {
  min-width: 30px;
}

.progress-label {
  display: flex;
  justify-content: space-between;
  margin-bottom: 10px;
  font-size: 14px;
  color: #606266;
}

.progress-footer {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
  font-size: 14px;
  color: #909399;
}

.loading-div {
  display: flex;
  align-items: center;
  gap: 4px;
}

.loading-icon {
  animation: rotate 1s linear infinite;
}
.finish-icon {
  display: flex;
  align-items: center;
  gap: 4px;
  color: #67c23a;
}
</style>
