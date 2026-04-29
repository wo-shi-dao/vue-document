<template>
  <div class="page-nav">
    <p>
      <span class="nav-firstTitle">文档管理 / </span>
      <span>初始化文档模板</span>
    </p>
  </div>
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
          <div class="template-info">文档数量：{{ template.docCount }}</div>
          <div class="template-info">模板时间：{{ template.createTime }}</div>
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
          current-node-key=""
          node-key="id"
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
import { id } from "element-plus/es/locale/index.mjs";

const router = useRouter();
const route = useRoute();

const curNode = ref("");

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

const testData = [
  {
    id: "1",
    name: "软件部门",
    type: "软件需求文档",
    docCount: "3",
    createTime: "2025-01-05 08:30:00",
  },
  {
    id: "2",
    name: "测试部门",
    type: "测试文档",
    docCount: "3",
    createTime: "2025-01-05 08:30:00",
  },
  {
    id: "3",
    name: "研发部门",
    type: "研发需求文档",
    docCount: "3",
    createTime: "2025-01-05 08:30:00",
  },
  {
    id: "4",
    name: "行政部门",
    type: "行政文档",
    docCount: "3",
    createTime: "2025-01-05 08:30:00",
  },
  {
    id: "5",
    name: "后勤部门",
    type: "后勤部门文档",
    docCount: "3",
    createTime: "2025-01-05 08:30:00",
  },
  {
    id: "6",
    name: "XXX部门",
    type: "XXXX文档",
    docCount: "3",
    createTime: "2025-01-05 08:30:00",
  },
  {
    id: "7",
    name: "XXXX部门",
    type: "XXXX文档",
    docCount: "3",
    createTime: "2025-01-05 08:30:00",
  },
  {
    id: "8",
    name: "XX部门",
    type: "XXXX文档",
    docCount: "3",
    createTime: "2025-01-05 08:30:00",
  },
  {
    id: "9",
    name: "XXX部门",
    type: "XXXX文档",
    docCount: "3",
    createTime: "2025-01-05 08:30:00",
  },
  {
    id: "10",
    name: "XX部门",
    type: "XXXX文档",
    docCount: "3",
    createTime: "2025-01-05 08:30:00",
  },
];

const mockTreeData = [
  {
    id: 1,
    label: "项目文档",
    children: [
      { id: 2, label: "需求文档" },
      { id: 3, label: "设计文档" },
      { id: 4, label: "计划文档" },
    ],
  },
  {
    id: 5,
    label: "技术文档",
    children: [
      { id: 6, label: "接口文档" },
      { id: 7, label: "部署文档" },
      { id: 8, label: "架构文档" },
      {
        id: 9,
        label: "数据库文档",
        children: [
          { id: 10, label: "ER图文档" },
          { id: 11, label: "表结构文档" },
        ],
      },
    ],
  },
  {
    id: 12,
    label: "管理文档",
    children: [
      { id: 13, label: "会议纪要文档" },
      { id: 14, label: "风险评估文档" },
      { id: 15, label: "进度报告文档" },
    ],
  },
  {
    id: 16,
    label: "用户文档",
    children: [
      { id: 17, label: "用户手册文档" },
      { id: 18, label: "安装指南文档" },
      { id: 19, label: "FAQ文档" },
      { id: 20, label: "更新日志文档" },
    ],
  },
];

const treeData = [
  {
    id: "1",
    value: "1",
    label: "需求文档",
    children: [
      {
        id: "1-1",
        value: "1-1",
        label: "软件需求文档",
        children: [
          {
            id: "1-1-1",
            value: "1-1-1",
            label: "需求说明文档.docx",
          },
          {
            id: "1-1-2",
            value: "1-1-2",
            label: "需求说明文档.docx",
          },
          {
            id: "1-1-3",
            value: "1-1-3",
            label: "需求说明文档.docx",
          },
        ],
      },
    ],
  },
  {
    id: "2",
    value: "2",
    label: "说明文档",
    children: [
      {
        id: "2-1",
        value: "2-1",
        label: "功能说明文档",
        children: [
          {
            id: "2-1-1",
            value: "2-1-1",
            label: "软件说明文档.docx",
          },
        ],
      },
      {
        id: "2-2",
        value: "2-2",
        label: "需求说明文档",
        children: [
          {
            id: "2-2-1",
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

onMounted(async () => {
  await loadTemplateList();
});

const loadTemplateList = async () => {
  try {
    // const res = await getTemplateList();
    templateList.value = testData || [];
  } catch (error) {
    ElMessage.error("获取模板库列表失败");
  }
};

const handleSelectTemplate = async (template) => {
  selectedTemplate.value = template;
  try {
    // const res = await getTemplateDocs(template.id);
    docTree.value = mockTreeData || [];
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
  selectedDocs.value = treeRef.value.getCheckedNodes(false, false);

  // selectedDocs.value = selectNode.filter((item) => {
  //   return !item.children || item.children.length === 0;
  // });
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

<style lang="scss" scoped>
.page-nav {
  background: #fff;
  height: 32px;
  font-size: 14px;
  padding: 0 16px;
  line-height: 32px;

  .nav-firstTitle {
    color: #777777;
  }
}
.init-document-container {
  padding: 40px;
  background-color: #f3f3f3;
  min-height: 100vh;
}

.step-container {
  padding: 20px;
  background: #fff;
  border-radius: 8px;
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
