<template>
  <el-dialog
    v-model="visible"
    :title="title"
    width="500px"
    :close-on-click-modal="false"
    :close-on-press-escape="false"
    :show-close="false"
    center
  >
    <div class="progress-content">
      <!-- 第一部分：图标和标题 -->
      <div class="progress-header">
        <el-icon class="progress-icon" :size="48">
          <Loading />
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
        <el-icon class="loading-icon">
          <Loading />
        </el-icon>
        <span>{{ footerText }}</span>
      </div>
    </div>
  </el-dialog>
</template>

<script setup>
import { ref, computed } from "vue";
import { Loading } from "@element-plus/icons-vue";

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
});

const emit = defineEmits(["update:modelValue"]);

const visible = computed({
  get: () => props.modelValue,
  set: (val) => emit("update:modelValue", val),
});
</script>

<style scoped>
.progress-content {
  padding: 20px 0;
}

.progress-header {
  text-align: center;
  margin-bottom: 30px;
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
  font-size: 20px;
  font-weight: bold;
  margin: 15px 0 10px;
  color: #303133;
}

.progress-description {
  font-size: 14px;
  color: #909399;
  margin: 0;
}

.progress-bar-section {
  margin-bottom: 30px;
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

.loading-icon {
  animation: rotate 1s linear infinite;
}
</style>
