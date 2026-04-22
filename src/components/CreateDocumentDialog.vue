<template>
  <el-dialog
    v-model="dialogVisible"
    align-center
    title="生成文档"
    width="500px"
    :before-close="handleClose"
  >
    <el-form :model="formData" label-width="120px" ref="formRef">
      <!-- <el-form-item
        label="文档名称"
        required
        prop="name"
        :rules="[{ required: true, message: '请输入文档名称', trigger: 'blur' }]"
      >
        <el-input v-model="formData.name" placeholder="请输入文档名称" />
      </el-form-item>

      <el-form-item
        label="文档类型"
        required
        prop="type"
        :rules="[{ required: true, message: '请选择文档类型', trigger: 'change' }]"
      >
        <el-select v-model="formData.type" placeholder="请选择" style="width: 100%">
          <el-option label="Word" value="docx" />
          <el-option label="Excel" value="xlsx" />
          <el-option label="PDF" value="pdf" />
        </el-select>
      </el-form-item> -->

      <el-form-item
        label="需求文档类型"
        required
        prop="type"
        :rules="[
          { required: true, message: '请选择需求类型', trigger: 'change' },
        ]"
      >
        <el-select
          v-model="formData.type"
          placeholder="请选择"
          style="width: 100%"
        >
          <el-option label="IR" value="IR" />
          <el-option label="SR" value="SR" />
          <el-option label="AR" value="AR" />
        </el-select>
      </el-form-item>

      <!-- <el-form-item label="所属文件夹">
        <el-tree-select
          v-model="formData.parentId"
          :data="folderTreeData"
          :props="{ label: 'name', value: 'id', children: 'children' }"
          placeholder="请选择文件夹（不选则为根目录）"
          clearable
          check-strictly
          style="width: 100%"
        />
      </el-form-item> -->
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
  // 文件夹树形数据（用于选择所属文件夹）
  folderTreeData: {
    type: Array,
    default: () => [],
  },
  // 是否正在提交（外部控制，用于防重复提交）
  submitting: {
    type: Boolean,
    default: false,
  },
});

// ---------- Emits 定义 ----------
const emit = defineEmits([
  "update:visible", // 支持 v-model
  "submit", // 提交表单时触发
]);

// ---------- 响应式数据 ----------
const dialogVisible = ref(false);
const formRef = ref(null);
const formData = reactive({
  name: "",
  type: "",
  parentId: null,
});

// ---------- 方法 ----------
// 重置表单
const resetForm = () => {
  formData.name = "";
  formData.type = "";
  formData.parentId = null;
  formRef.value?.clearValidate();
};

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
    emit("submit", {
      name: formData.name,
      type: formData.type,
      parentId: formData.parentId,
    });
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
/* 可根据需要添加样式 */
</style>
