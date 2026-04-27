<template>
  <div class="init-document-container">
    <!-- 步骤一：选择文档模板库 -->
    <div v-if="currentStep === 1" class="step-container">
      <h2 class="step-title">1 选择文档模板库</h2>
      <p class="step-description">请选择要初始化的文档模板库：</p>

      <div class="template-list">
        <div
          v-for="template in templateList"
          :key="template.id"
          class="template-item"
          :class="{ active: selectedTemplate?.id === template.id }"
          @click="handleSelectTemplate(template)"
        >
          <div class="template-name">{{ template.name }}</div>
          <div class="template-type">类型：{{ template.type }}</div>
          <div class="template-info">
            文档数量：{{ template.docCount }} | 模板时间：{{
              template.createTime
            }}
          </div>
        </div>
      </div>
    </div>

    <!-- 步骤二：选择模板文档 -->
    <div v-if="currentStep === 2" class="step-container">
      <div class="step-header">
        <h2 class="step-title">选择要初始化的文档</h2>
        <div class="step-actions">
          <el-button @click="handleBackToStep1">返回上一步</el-button>
          <el-button
            type="primary"
            :disabled="selectedDocs.length === 0"
            @click="handleStartInit"
          >
            开始初始化
          </el-button>
        </div>
      </div>

      <div class="doc-selection">
        <div class="selection-header">
          <span>{{ selectedTemplate?.name }}的文档目录：</span>
          <div class="selection-actions">
            <span class="selected-count"
              >已选择 {{ selectedDocs.length }} 项</span
            >
            <el-button link @click="handleSelectAll">全选</el-button>
            <el-button link @click="handleClearSelection">清空</el-button>
          </div>
        </div>

        <el-tree
          ref="treeRef"
          :data="docTree"
          show-checkbox
          node-key="id"
          :props="{ label: 'name', children: 'children' }"
          @check="handleTreeCheck"
        />
      </div>
    </div>

    <!-- 进度条弹窗 -->
    <ProgressDialog
      v-model="showProgress"
      title="正在初始化文档目录"
      description="正在根据您的选择创建文档目录结构..."
      progress-text="初始化进度"
      :footer-text="progressFooterText"
      :percentage="progressPercentage"
      :status="progressStatus"
    />
  </div>
</template>

<script setup>
import { ref, onMounted } from "vue";
import { useRouter, useRoute } from "vue-router";
import { ElMessage } from "element-plus";
import ProgressDialog from "../components/ProgressDialog.vue";
import {
  getTemplateList,
  getTemplateDocs,
  initDocumentDirectory,
} from "../api/document";

const router = useRouter();
const route = useRoute();

const currentStep = ref(1);
const templateList = ref([]);
const selectedTemplate = ref(null);
const docTree = ref([]);
const selectedDocs = ref([]);
const treeRef = ref(null);

const showProgress = ref(false);
const progressPercentage = ref(0);
const progressStatus = ref("");
const progressFooterText = ref("正在创建文档目录...");

onMounted(async () => {
  await loadTemplateList();
});

const loadTemplateList = async () => {
  try {
    const res = await getTemplateList();
    templateList.value = res.data || [];
  } catch (error) {
    ElMessage.error("获取模板库列表失败");
  }
};

const handleSelectTemplate = async (template) => {
  selectedTemplate.value = template;
  try {
    const res = await getTemplateDocs(template.id);
    docTree.value = res.data || [];
    currentStep.value = 2;
  } catch (error) {
    ElMessage.error("获取模板文档失败");
  }
};

const handleBackToStep1 = () => {
  currentStep.value = 1;
  selectedDocs.value = [];
};

const handleTreeCheck = (data, { checkedNodes }) => {
  selectedDocs.value = checkedNodes;
};

const handleSelectAll = () => {
  treeRef.value?.setCheckedNodes(docTree.value);
};

const handleClearSelection = () => {
  treeRef.value?.setCheckedKeys([]);
  selectedDocs.value = [];
};

const handleStartInit = async () => {
  showProgress.value = true;
  progressPercentage.value = 0;
  progressStatus.value = "";

  try {
    const docIds = selectedDocs.value.map((doc) => doc.id);
    const result = await initDocumentDirectory(docIds, (progress) => {
      progressPercentage.value = progress;
    });

    if (result.success) {
      progressPercentage.value = 100;
      progressStatus.value = "success";
      progressFooterText.value = "初始化完成";

      setTimeout(() => {
        showProgress.value = false;
        ElMessage.success("文档目录初始化成功");
        router.push("/document-export");
      }, 1000);
    } else {
      throw new Error(result.message);
    }
  } catch (error) {
    showProgress.value = false;
    ElMessage.error(error.message || "初始化失败");
  }
};
</script>

<style scoped>
.init-document-container {
  padding: 40px;
  background-color: #fff;
  min-height: 100vh;
}

.step-container {
  max-width: 1000px;
  margin: 0 auto;
}

.step-title {
  font-size: 24px;
  font-weight: bold;
  margin-bottom: 20px;
  color: #303133;
}

.step-description {
  font-size: 16px;
  color: #606266;
  margin-bottom: 30px;
}

.template-list {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(300px, 1fr));
  gap: 20px;
}

.template-item {
  border: 2px solid #dcdfe6;
  border-radius: 8px;
  padding: 20px;
  cursor: pointer;
  transition: all 0.3s;
}

.template-item:hover {
  border-color: #409eff;
  box-shadow: 0 2px 12px 0 rgba(0, 0, 0, 0.1);
}

.template-item.active {
  border-color: #409eff;
  background-color: #ecf5ff;
}

.template-name {
  font-size: 18px;
  font-weight: bold;
  color: #303133;
  margin-bottom: 10px;
}

.template-type {
  font-size: 14px;
  color: #606266;
  margin-bottom: 5px;
}

.template-info {
  font-size: 14px;
  color: #909399;
}

.step-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 30px;
}

.step-actions {
  display: flex;
  gap: 10px;
}

.doc-selection {
  border: 1px solid #dcdfe6;
  border-radius: 8px;
  padding: 20px;
}

.selection-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 20px;
  padding-bottom: 15px;
  border-bottom: 1px solid #ebeef5;
}

.selection-actions {
  display: flex;
  align-items: center;
  gap: 15px;
}

.selected-count {
  font-size: 14px;
  color: #409eff;
  font-weight: bold;
}
</style>
