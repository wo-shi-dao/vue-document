<template>
  <div class="page-content">
    <div class="page-nav">
      <p>
        <span class="nav-firstTitle">文档管理 / </span>
        <span>初始化文档模板</span>
      </p>
    </div>
    <div class="page-step">
      <el-steps style="max-width: 100%" :active="currentStep" align-center>
        <el-step title="选择文档模板库" />
        <el-step title="选择初始化文档" />
        <el-step title="开始初始化" />
      </el-steps>
    </div>
    <div class="init-document-container">
      <!-- 步骤一：选择文档模板库 -->
      <div v-if="currentStep === 1" class="step-container">
        <h2 class="step-title">选择文档模板库</h2>
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
            <div class="template-type">级别：{{ template.level }}</div>
            <div class="template-info">更新人：{{ template.updatedBy }}</div>
            <div class="template-info">更新时间：{{ template.createTime }}</div>
          </div>
        </div>
      </div>

      <!-- 步骤二：选择模板文档 -->
      <div v-if="currentStep === 2 || currentStep === 3" class="step-container">
        <div class="step-header">
          <h2 class="step-title">选择初始化文档</h2>
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
            <span
              ><span class="depar-name">{{ selectedTemplate?.name }}</span
              >的文档目录：</span
            >
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
            default-expand-all
            current-node-key=""
            node-key="id"
            @check="handleTreeCheck"
          >
            <template #default="{ data }">
              <div class="folder-laber">
                <span
                  class="file-icon"
                  v-html="getOfficeIconSvg(data?.type, data?.children)"
                ></span
                >{{ data.label }}
              </div>
            </template>
          </el-tree>
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
    name: "科技和信息化部",
    level: "公司级",
    updatedBy: "张三",
    createTime: "2025-01-05 08:30:00",
  },
  {
    id: "2",
    name: "制动开发部",
    level: "公司级",
    updatedBy: "李四",
    createTime: "2025-01-05 08:30:00",
  },
  {
    id: "3",
    name: "交流传动开发部",
    level: "部门级",
    updatedBy: "王五",
    createTime: "2025-01-05 08:30:00",
  },
  {
    id: "4",
    name: "网络控制开发部",
    level: "公司级",
    updatedBy: "张三",
    createTime: "2025-01-05 08:30:00",
  },
  {
    id: "5",
    name: "数智赋能中心",
    level: "部门级",
    updatedBy: "李四",
    createTime: "2025-01-05 08:30:00",
  },
  {
    id: "6",
    name: "基础开发部",
    level: "部门级",
    updatedBy: "王五",
    createTime: "2025-01-05 08:30:00",
  },
  {
    id: "7",
    name: "安全监测开发部",
    level: "部门级",
    updatedBy: "张三",
    createTime: "2025-01-05 08:30:00",
  },
  // {
  //   id: "8",
  //   name: "XX部门",
  //   level: "部门级",
  //   updatedBy: "李四",
  //   createTime: "2025-01-05 08:30:00",
  // },
  // {
  //   id: "9",
  //   name: "XXX部门",
  //   level: "部门级",
  //   updatedBy: "王五",
  //   createTime: "2025-01-05 08:30:00",
  // },
];

const mockTreeData = [
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
  currentStep.value = 3;
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
.page-content {
  display: flex;
  flex-direction: column;
}

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
  flex: 1;
  overflow: auto;
  padding: 20px 40px 20px;
  background-color: #f3f3f3;
}

.step-container {
  padding: 20px;
  background: #fff;
  border-radius: 8px;
  max-width: 1000px;
  height: calc(100vh - 215px);
  overflow: auto;
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
  border-color: #5e7ce0;
  box-shadow: 0 2px 12px 0 rgba(0, 0, 0, 0.1);
}

.template-item.active {
  border-color: #5e7ce0;
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

  .depar-name {
    font-weight: 600;
  }
}

.selection-actions {
  display: flex;
  align-items: center;
  gap: 15px;
}

.selected-count {
  font-size: 14px;
  color: #5e7ce0;
  font-weight: bold;
}

.folder-laber {
  display: flex;
  align-items: center;
  height: 24px;
}

.file-icon {
  margin-right: 4px;
}

.page-step {
  background-color: #fff;
  margin-top: 10px;
  padding: 10px 0 5px;
}
</style>
