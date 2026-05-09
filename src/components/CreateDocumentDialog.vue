<template>
  <el-dialog v-model="dialogVisible" :title="props.title" width="800px">
    <el-form ref="formRef" :model="formData" label-width="120px">
      <div v-if="props.type !== 'search'">
        <el-form-item
          label="文档模板"
          required
          prop="type"
          :rules="[
            { required: true, message: '请选择模板文档', trigger: 'change' },
          ]"
        >
          <el-tree-select
            v-model="formData.type"
            placeholder="请选择"
            :data="treeSelectData"
            node-key="id"
            :render-after-expand="false"
          >
            <template #default="{ data }">
              <div class="folder-laber">
                <span
                  class="file-icon"
                  v-html="getOfficeIconSvg(data?.type, data?.children)"
                ></span>
                {{ data?.label }}
              </div>
            </template>
          </el-tree-select>
        </el-form-item>

        <el-form-item
          label="选择文档目录"
          required
          prop="parentId"
          :rules="[
            { required: true, message: '请选择文档目录', trigger: 'change' },
          ]"
        >
          <el-tree-select
            v-model="formData.parentId"
            :data="folderTreeData"
            node-key="id"
            placeholder="请选择"
            clearable
            check-strictly
            style="width: 100%"
          >
            <template #default="{ data: { label } }">
              <div class="folder-laber">
                <span class="file-icon" v-html="folderIcon"></span>{{ label }}
              </div>
            </template>
          </el-tree-select>
        </el-form-item>
      </div>

      <el-form-item label="基线版本" prop="baselineVersion">
        <el-select v-model="formData.baselineVersion" placeholder="请选择">
          <el-option
            v-for="item in basicOptions"
            :key="item.value"
            :label="item.label"
            :value="item.value"
          />
        </el-select>
      </el-form-item>

      <el-form-item label="选择字段" prop="fields">
        <el-checkbox-group v-model="formData.fields" style="width: 100%">
          <div class="checkbox-list">
            <el-checkbox
              v-for="item in basicFields"
              :value="item.value"
              :label="item.label"
              :disabled="item?.disabled"
            />
          </div>
        </el-checkbox-group>
      </el-form-item>
    </el-form>

    <template #footer>
      <el-button @click="handleCancel">取消</el-button>
      <el-button type="primary" @click="handleSubmit" :loading="submitting"
        >确定</el-button
      >
    </template>
  </el-dialog>
</template>

<script setup lang="ts">
import { ref, reactive, watch, computed } from "vue";
import { ElMessage } from "element-plus";

// ---------- Props 定义 ----------
const props = defineProps({
  // 控制弹窗显示/隐藏
  visible: {
    type: Boolean,
    default: false,
  },
  // 是否正在提交（外部控制，用于防重复提交）
  submitting: {
    type: Boolean,
    default: false,
  },
  // 类型（从哪打开的）
  type: {
    type: String,
    default: "",
  },
  title: {
    type: String,
    default: "生成文档",
  },
});

// 模板文档数据
const treeSelectData = [
  {
    id: 1,
    label: "项目文档",
    children: [
      { id: 2, label: "需求文档.docx", type: "word" },
      { id: 3, label: "设计文档.pdf", type: "ppt" },
      { id: 4, label: "计划文档.xlsx", type: "excel" },
    ],
  },
  {
    id: 5,
    label: "技术文档",
    children: [
      { id: 6, label: "接口文档.docx", type: "word" },
      { id: 7, label: "部署文档.docx", type: "word" },
      { id: 8, label: "架构文档.xlsx", type: "excel" },
      {
        id: 9,
        label: "数据库文档",
        children: [
          { id: 10, label: "ER图文档.xlsx", type: "excel" },
          { id: 11, label: "表结构文档.pdf", type: "ppt" },
        ],
      },
    ],
  },
  {
    id: 12,
    label: "管理文档",
    children: [
      { id: 13, label: "会议纪要文档.docx", type: "word" },
      { id: 14, label: "风险评估文档.pdf", type: "ppt" },
      { id: 15, label: "进度报告文档.docx", type: "word" },
    ],
  },
  {
    id: 16,
    label: "用户文档",
    children: [
      { id: 17, label: "用户手册文档.docx", type: "word" },
      { id: 18, label: "安装指南文档.xlsx", type: "excel" },
      { id: 19, label: "FAQ文档.docx", type: "word" },
      { id: 20, label: "更新日志文档.pdf", type: "ppt" },
    ],
  },
];

// 文件夹目录
const folderTreeData = [
  {
    id: 1,
    label: "项目文档",
    children: [],
  },
  {
    id: 5,
    label: "技术文档",
    children: [
      {
        id: 9,
        label: "数据库文档",
        children: [],
      },
    ],
  },
  {
    id: 12,
    label: "管理文档",
    children: [],
  },
  {
    id: 16,
    label: "用户文档",
    children: [],
  },
];

const basicOptions = ref([
  { label: "基线V1.0", value: "V1.0" },
  { label: "基线V2.0", value: "V2.0" },
  { label: "基线V3.0", value: "V3.0" },
  { label: "基线V4.0", value: "V4.0" },
  { label: "基线V5.0", value: "V5.0" },
]);

const basicFields = ref([
  { value: "title", label: "标题", disabled: true },
  { value: "status", label: "状态", disabled: true },
  { value: "tag", label: "标签" },
  { value: "更新时间", label: "更新时间" },
  { value: "实际工时", label: "实际工时" },
  { value: "domain", label: "领域" },
  { value: "decompose_status", label: "分解状态" },
  { value: "module", label: "模块" },
  { value: "计划工时", label: "计划工时" },
  { value: "优先级", label: "优先级" },
  { value: "描述", label: "描述" },
]);

// ---------- Emits 定义 ----------
const emit = defineEmits([
  "update:visible", // 支持 v-model
  "submit", // 提交表单时触发
  "close", // 关闭弹窗触发
]);

// ---------- 响应式数据 ----------
const dialogVisible = ref(false);
const formRef = ref(null);
const formData = reactive({
  name: "",
  type: "",
  baselineVersion: "",
  fields: ["title", "status", "tag", "更新时间", "实际工时"],
});

// ---------- 方法 ----------
// 重置表单
const resetForm = () => {
  if (formRef.value) {
    formRef.value.resetFields(); // 重置到初始值
  }
};

//图标
const getOfficeIconSvg = (type, children) => {
  const size = 24;
  if (children != undefined) {
    return `
      <svg width="${size}" height="${size}" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
        <path d="M10 4H4C2.89543 4 2 4.89543 2 6V18C2 19.1046 2.89543 20 4 20H20C21.1046 20 22 19.1046 22 18V8C22 6.89543 21.1046 6 20 6H12L10 4Z" fill="#F7C331"/>
      </svg>
    `;
  }
  if (type === "word") {
    return `
      <svg width="${size}" height="${size}" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
        <path d="M4 4H14L20 10V20C20 21.1046 19.1046 22 18 22H6C4.89543 22 4 21.1046 4 20V4Z" fill="#2B57D9"/>
        <path d="M14 4V10H20" fill="white" opacity="0.3"/>
        <text x="12" y="16" font-size="10" font-weight="bold" fill="white" text-anchor="middle" dominant-baseline="middle">W</text>
      </svg>
    `;
  }
  if (type === "excel") {
    return `
      <svg width="${size}" height="${size}" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
        <path d="M4 4H14L20 10V20C20 21.1046 19.1046 22 18 22H6C4.89543 22 4 21.1046 4 20V4Z" fill="#21A366"/>
        <path d="M14 4V10H20" fill="white" opacity="0.3"/>
        <text x="12" y="16" font-size="10" font-weight="bold" fill="white" text-anchor="middle" dominant-baseline="middle">X</text>
      </svg>
    `;
  }
  if (type === "ppt") {
    return `
      <svg width="${size}" height="${size}" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
        <path d="M4 4H14L20 10V20C20 21.1046 19.1046 22 18 22H6C4.89543 22 4 21.1046 4 20V4Z" fill="#D24726"/>
        <path d="M14 4V10H20" fill="white" opacity="0.3"/>
        <text x="12" y="16" font-size="10" font-weight="bold" fill="white" text-anchor="middle" dominant-baseline="middle">P</text>
      </svg>
    `;
  }
  return `
    <svg width="${size}" height="${size}" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
      <path d="M4 4H14L20 10V20C20 21.1046 19.1046 22 18 22H6C4.89543 22 4 21.1046 4 20V4Z" fill="#c0c6cc"/>
      <path d="M14 4V10H20" fill="white" opacity="0.3"/>
    </svg>
  `;
};

const wordIcon = `
      <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
        <path d="M4 4H14L20 10V20C20 21.1046 19.1046 22 18 22H6C4.89543 22 4 21.1046 4 20V4Z" fill="#2B57D9"/>
        <path d="M14 4V10H20" fill="white" opacity="0.3"/>
        <text x="12" y="16" font-size="10" font-weight="bold" fill="white" text-anchor="middle" dominant-baseline="middle">W</text>
      </svg>
    `;

const folderIcon = `
      <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
        <path d="M10 4H4C2.89543 4 2 4.89543 2 6V18C2 19.1046 2.89543 20 4 20H20C21.1046 20 22 19.1046 22 18V8C22 6.89543 21.1046 6 20 6H12L10 4Z" fill="#F7C331"/>
      </svg>
    `;

// ---------- 监听 props.visible 变化 ----------
watch(
  () => props.visible,
  (newVal) => {
    dialogVisible.value = newVal;
    if (!newVal) {
      // 弹窗关闭时重置表单
      resetForm();
    }
  },
  { immediate: true },
);

// ---------- 监听 dialogVisible 变化，同步到父组件 ----------
watch(dialogVisible, (newVal) => {
  emit("update:visible", newVal);
});

// 提交表单
const handleSubmit = async () => {
  // 表单校验
  if (!formRef.value) return;

  try {
    await formRef.value.validate();

    // 触发提交事件，将表单数据传递给父组件
    emit("submit", {});
  } catch (error) {
    console.error("表单校验失败:", error);
  }
};

// 取消操作
const handleCancel = () => {
  dialogVisible.value = false;
  resetForm();
};
</script>

<style scoped>
.folder-laber {
  display: flex;
  align-items: center;
  height: 24px;
}

.file-icon {
  margin-right: 4px;
}

.checkbox-list {
  display: grid;
  grid-template-columns: repeat(4, minmax(0, 1fr));
  gap: 12px 16px;
}
</style>
