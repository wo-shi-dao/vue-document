<template>
  <el-dialog
    v-model="dialogVisible"
    :title="props.title"
    width="800px"
    :before-close="handleClose"
  >
    <el-form :model="formData" label-width="120px" ref="formRef">
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
            :render-after-expand="false"
          >
            <template #default="{ data: { label, children } }">
              <div class="folder-laber">
                <span
                  v-if="children"
                  class="file-icon"
                  v-html="folderIcon"
                ></span>
                <span v-else class="file-icon" v-html="wordIcon"></span>
                {{ label }}
              </div>
            </template>
          </el-tree-select>
        </el-form-item>

        <el-form-item label="所属文件夹">
          <el-tree-select
            v-model="formData.parentId"
            :data="folderTreeData"
            placeholder="请选择文件夹（不选则为根目录）"
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

      <el-form-item label="需求创建时间">
        <el-date-picker
          v-model="formData.daterange"
          type="datetimerange"
          start-placeholder="开始时间"
          end-placeholder="结束时间"
        />
      </el-form-item>

      <el-form-item label="其它筛选条件">
        <div class="search-region">
          <p class="search-p">预留可扩展空间</p>
        </div>
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
    value: "1",
    label: "需求文档",
    children: [
      {
        value: "1-1",
        label: "软件需求文档",
        children: [
          {
            value: "1-1-1",
            label: "需求说明文档.docx",
          },
        ],
      },
    ],
  },
  {
    value: "2",
    label: "说明文档",
    children: [
      {
        value: "2-1",
        label: "功能说明文档",
        children: [
          {
            value: "2-1-1",
            label: "软件说明文档.docx",
          },
        ],
      },
      {
        value: "2-2",
        label: "需求说明文档",
        children: [
          {
            value: "2-2-1",
            label: "软件需求说明文档.docx",
          },
        ],
      },
    ],
  },
  {
    value: "3",
    label: "测试用例",
    children: [
      {
        value: "3-1",
        label: "软件测试",
        children: [
          {
            value: "3-1-1",
            label: "需求测试文档.docx",
          },
        ],
      },
      {
        value: "3-2",
        label: "功能测试",
        children: [
          {
            value: "3-2-1",
            label: "功能测试文档.docx",
          },
        ],
      },
    ],
  },
];

// 文件夹目录
const folderTreeData = [
  {
    value: "1",
    label: "项目文档",
    children: [
      {
        value: "1-1",
        label: "软件需求",
      },
    ],
  },
  {
    value: "2",
    label: "测试报告",
  },
];

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
  parentId: null,
  daterange: [],
});

// ---------- 方法 ----------
// 重置表单
const resetForm = () => {
  formData.name = "";
  formData.type = "";
  formData.parentId = null;
  formRef.value?.clearValidate();
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

// 弹窗关闭前的回调
const handleClose = (done) => {
  if (props.submitting) {
    ElMessage.warning("正在提交中，请稍后再试");
    return;
  }
  resetForm();
  done();
};
</script>

<style scoped>
.search-region {
  width: 100%;
  border: 2px dashed #e5e7eb;
  border-radius: 10px;
  padding-right: 10px;
}

.search-p {
  font-size: 18px;
  text-align: center;
  color: #9ca3af;
  margin: 20px;
}

.folder-laber {
  display: flex;
  align-items: center;
}

.file-icon {
  margin-right: 4px;
}

.el-tree-select__popper {
  height: 24px;
}
</style>
