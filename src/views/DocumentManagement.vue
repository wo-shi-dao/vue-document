<template>
  <div class="document-management-container">
    <!-- 标题区域 -->
    <div class="header">
      <h1 class="title">文档管理</h1>
      <el-button type="primary" @click="handleShowGenerateDialog">
        生成文档
      </el-button>
    </div>

    <!-- Tab页签 -->
    <el-tabs v-model="activeTab" class="content-tabs">
      <!-- 文档内容Tab -->
      <el-tab-pane label="文档内容" name="content">
        <!-- 筛选条件 -->

        <!-- 文档表格 -->
        <el-table
          :data="documentList"
          style="width: 100%"
          border
          v-loading="loading"
        >
          <el-table-column prop="name" label="文档名称" min-width="180" />
          <el-table-column prop="type" label="需求文档类型" width="160" />
          <el-table-column prop="creator" label="创建人" width="120" />
          <el-table-column prop="createTime" label="创建时间" width="180" />
          <el-table-column prop="modifier" label="修改人" width="120" />
          <el-table-column prop="modifyTime" label="修改时间" width="180" />
          <el-table-column label="操作" width="300" fixed="right">
            <template #default="{ row }">
              <template v-if="row.isFolder">
                <el-button link type="primary" @click="handleRenameFolder(row)">
                  重命名
                </el-button>
                <el-button
                  v-if="row.isEmpty"
                  link
                  type="danger"
                  @click="handleDeleteFolder(row)"
                >
                  删除
                </el-button>
              </template>
              <template v-else>
                <el-button link type="primary" @click="handleViewDocument(row)">
                  查看
                </el-button>
                <el-button link type="primary" @click="handleEditDocument(row)">
                  编辑
                </el-button>
                <el-button
                  link
                  type="danger"
                  @click="handleDeleteDocument(row)"
                >
                  删除
                </el-button>
                <el-button
                  link
                  type="primary"
                  @click="handleDownloadDocument(row)"
                >
                  下载
                </el-button>
                <el-button
                  link
                  type="primary"
                  @click="handleRenameDocument(row)"
                >
                  重命名
                </el-button>
              </template>
            </template>
          </el-table-column>
        </el-table>

        <!-- 分页 -->
        <el-pagination
          v-model:current-page="pagination.current"
          v-model:page-size="pagination.size"
          :total="pagination.total"
          :page-sizes="[10, 20, 50, 100]"
          layout="total, sizes, prev, pager, next, jumper"
          @size-change="handlePageSizeChange"
          @current-change="handlePageChange"
        />
      </el-tab-pane>

      <!-- 历史记录Tab -->
      <el-tab-pane label="历史记录" name="history">
        <div class="filter-section">
          <el-date-picker
            v-model="historyFilters.timeRange"
            type="daterange"
            range-separator="至"
            start-placeholder="开始日期"
            end-placeholder="结束日期"
          />
          <el-button type="primary" @click="handleSearchHistory"
            >搜索</el-button
          >
        </div>

        <el-table :data="historyList" style="width: 100%" border>
          <el-table-column prop="time" label="时间" width="180" />
          <el-table-column prop="operator" label="操作人" width="120" />
          <el-table-column prop="type" label="操作类型" width="120" />
          <el-table-column prop="detail" label="详情" min-width="200" />
          <el-table-column label="状态" width="120">
            <template #default="{ row }">
              <el-tag v-if="row.status === 'success'" type="success"
                >成功</el-tag
              >
              <el-tag v-else-if="row.status === 'processing'" type="warning"
                >处理中</el-tag
              >
              <el-tag v-else-if="row.status === 'failed'" type="danger"
                >失败</el-tag
              >
            </template>
          </el-table-column>
        </el-table>
      </el-tab-pane>
    </el-tabs>

    <!-- 生成文档弹窗 -->
    <CreateDocumentDialog
      v-model:visible="showGenerateDialog"
      v-model:submitting="createDocSubmitting"
      @submit="handleGenerateDocument"
    />

    <!-- 新增文件夹弹窗 -->
    <el-dialog v-model="showAddFolderDialog" title="新增文件夹" width="500px">
      <el-form
        :model="folderForm"
        :rules="folderRules"
        ref="folderFormRef"
        label-width="100px"
      >
        <el-form-item label="文件夹名称" prop="name">
          <el-input
            v-model="folderForm.name"
            placeholder="请输入文件夹名称"
            maxlength="50"
            show-word-limit
          />
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="showAddFolderDialog = false">取消</el-button>
        <el-button type="primary" @click="handleAddFolder">确定</el-button>
      </template>
    </el-dialog>

    <!-- 重命名弹窗 -->
    <el-dialog v-model="showRenameDialog" title="重命名" width="500px">
      <el-form
        :model="renameForm"
        :rules="renameRules"
        ref="renameFormRef"
        label-width="100px"
      >
        <el-form-item label="名称" prop="name">
          <el-input
            v-model="renameForm.name"
            placeholder="请输入名称"
            maxlength="50"
            show-word-limit
          />
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="showRenameDialog = false">取消</el-button>
        <el-button type="primary" @click="handleConfirmRename">确定</el-button>
      </template>
    </el-dialog>

    <!-- 进度条弹窗 -->
    <ProgressDialog
      v-model="showProgress"
      title="正在生成文档"
      description="请稍候，正在根据筛选条件生成文档..."
      progress-text="生成进度"
      :footer-text="progressFooterText"
      :percentage="progressPercentage"
      :status="progressStatus"
    />
  </div>
</template>

<script setup>
import { ref, reactive, onMounted } from "vue";
import { ElMessage, ElMessageBox } from "element-plus";
import ProgressDialog from "../components/ProgressDialog.vue";
import CreateDocumentDialog from "../components/CreateDocumentDialog.vue";
import {
  getDocumentList,
  deleteDocument,
  downloadDocument,
  renameDocument,
  addFolder,
  deleteFolder,
  renameFolder,
  generateDocument,
  getHistoryList,
} from "../api/document";

const activeTab = ref("content");
const loading = ref(false);
const documentList = ref([]);
const historyList = ref([]);

const filters = reactive({
  name: "",
  type: "",
});

const historyFilters = reactive({
  timeRange: null,
});

const pagination = reactive({
  current: 1,
  size: 10,
  total: 0,
});

// 生成文档
const showGenerateDialog = ref(false);
// 生成文档提交loading
const createDocSubmitting = ref(false);

const testTreeData = ref([
  {
    id: "f1",
    name: "项目文档",
    type: "IR",
    isFolder: false,
    creator: "admin",
    createTime: "2025-01-01",
    modifier: "admin",
    modifyTime: "2025-01-01",
  },
  {
    id: "d1",
    name: "需求规格.docx",
    type: "SR",
    isFolder: false,
    creator: "张三",
    createTime: "2025-01-02",
    modifier: "李四",
    modifyTime: "2025-01-03",
    parentId: "f1",
  },
  {
    id: "d2",
    name: "设计文档.docx",
    type: "AR",
    isFolder: false,
    creator: "王五",
    createTime: "2025-01-04",
    modifier: "王五",
    modifyTime: "2025-01-04",
    parentId: "f1",
  },
  {
    id: "f2",
    name: "测试报告",
    type: "IR",
    isFolder: false,
    creator: "admin",
    createTime: "2025-01-05",
    modifier: "admin",
    modifyTime: "2025-01-05",
  },
  {
    id: "d3",
    name: "测试用例.xlsx",
    type: "SR",
    isFolder: false,
    creator: "赵六",
    createTime: "2025-01-06",
    modifier: "赵六",
    modifyTime: "2025-01-06",
    parentId: "f2",
  },
  {
    id: "d4",
    name: "会议记录.pdf",
    type: "AR",
    isFolder: false,
    creator: "孙七",
    createTime: "2025-01-07",
    modifier: "孙七",
    modifyTime: "2025-01-07",
    parentId: null,
  },
]);

// 新增文件夹
const showAddFolderDialog = ref(false);
const folderFormRef = ref(null);
const folderForm = reactive({
  name: "",
});
const folderRules = {
  name: [{ required: true, message: "请输入文件夹名称", trigger: "blur" }],
};

// 重命名
const showRenameDialog = ref(false);
const renameFormRef = ref(null);
const renameForm = reactive({
  name: "",
  id: "",
  isFolder: false,
});
const renameRules = {
  name: [{ required: true, message: "请输入名称", trigger: "blur" }],
};

// 进度条
const showProgress = ref(false);
const progressPercentage = ref(0);
const progressStatus = ref("");
const progressFooterText = ref("正在生成文档...");

onMounted(() => {
  loadDocumentList();
});

//获取文档列表
const loadDocumentList = async () => {
  loading.value = true;
  try {
    // const res = await getDocumentList({
    //   ...filters,
    //   page: pagination.current,
    //   size: pagination.size,
    // });
    documentList.value = testTreeData.value || [];
    pagination.total = testTreeData.value.length || 0;
  } catch (error) {
    ElMessage.error("获取文档列表失败");
  } finally {
    loading.value = false;
  }
};

const handleSearch = () => {
  pagination.current = 1;
  loadDocumentList();
};

const handleResetFilters = () => {
  filters.name = "";
  filters.type = "";
  handleSearch();
};

const handlePageSizeChange = () => {
  pagination.current = 1;
  loadDocumentList();
};

const handlePageChange = () => {
  loadDocumentList();
};

const handleViewDocument = (row) => {
  ElMessage.info("打开PageOffice查看文档（只读模式）");
};

const handleEditDocument = (row) => {
  ElMessage.info("打开PageOffice编辑文档");
};

const handleDeleteDocument = async (row) => {
  try {
    await ElMessageBox.confirm("确定要删除该文档吗？", "提示", {
      confirmButtonText: "确定",
      cancelButtonText: "取消",
      type: "warning",
    });
    await deleteDocument(row.id);
    ElMessage.success("删除成功");
    loadDocumentList();
  } catch (error) {
    if (error !== "cancel") {
      ElMessage.error("删除失败");
    }
  }
};

const handleDownloadDocument = async (row) => {
  try {
    await downloadDocument(row.id);
    ElMessage.success("下载成功");
  } catch (error) {
    ElMessage.error("下载失败");
  }
};

const handleRenameDocument = (row) => {
  renameForm.name = row.name.replace(/\.[^/.]+$/, "");
  renameForm.id = row.id;
  renameForm.isFolder = false;
  showRenameDialog.value = true;
};

const handleShowAddFolderDialog = () => {
  folderForm.name = "";
  showAddFolderDialog.value = true;
};

const handleAddFolder = async () => {
  try {
    await folderFormRef.value.validate();
    await addFolder(folderForm.name);
    ElMessage.success("新增成功");
    showAddFolderDialog.value = false;
    loadDocumentList();
  } catch (error) {
    if (error !== false) {
      ElMessage.error("新增失败");
    }
  }
};

const handleRenameFolder = (row) => {
  renameForm.name = row.name;
  renameForm.id = row.id;
  renameForm.isFolder = true;
  showRenameDialog.value = true;
};

const handleDeleteFolder = async (row) => {
  try {
    await ElMessageBox.confirm("是否删除该文件夹？", "提示", {
      confirmButtonText: "确定",
      cancelButtonText: "取消",
      type: "warning",
    });
    await deleteFolder(row.id);
    ElMessage.success("删除成功");
    loadDocumentList();
  } catch (error) {
    if (error !== "cancel") {
      ElMessage.error("删除失败");
    }
  }
};

const handleConfirmRename = async () => {
  try {
    await renameFormRef.value.validate();
    if (renameForm.isFolder) {
      await renameFolder(renameForm.id, renameForm.name);
    } else {
      await renameDocument(renameForm.id, renameForm.name);
    }
    ElMessage.success("修改成功");
    showRenameDialog.value = false;
    loadDocumentList();
  } catch (error) {
    if (error !== false) {
      ElMessage.error("修改失败");
    }
  }
};

const handleShowGenerateDialog = () => {
  showGenerateDialog.value = true;
};

const handleGenerateDocument = async (form) => {
  try {
    showGenerateDialog.value = false;
    showProgress.value = true;
    progressPercentage.value = 0;
    progressStatus.value = "";
    progressFooterText.value = "正在生成文档...";

    const result = await generateDocument(form, (progress) => {
      progressPercentage.value = progress;
    });

    if (result.success) {
      progressPercentage.value = 100;
      progressStatus.value = "success";
      progressFooterText.value = "生成完成";

      setTimeout(() => {
        showProgress.value = false;
        ElMessage.success("文档生成成功");
        loadDocumentList();
      }, 1000);
    } else {
      throw new Error(result.message);
    }
  } catch (error) {
    if (error !== false) {
      showProgress.value = false;
      ElMessage.error(error.message || "生成失败");
    }
  }
};

const handleSearchHistory = async () => {
  try {
    const res = await getHistoryList(historyFilters);
    historyList.value = res.data || [];
  } catch (error) {
    ElMessage.error("获取历史记录失败");
  }
};
</script>

<style scoped>
.document-management-container {
  padding: 20px;
  background-color: #fff;
  min-height: 100vh;
}

.header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 20px;
}

.title {
  font-size: 24px;
  font-weight: bold;
  color: #303133;
  margin: 0;
}

.content-tabs {
  margin-top: 20px;
}

.filter-section {
  display: flex;
  gap: 10px;
  margin-bottom: 20px;
  flex-wrap: wrap;
}

.el-pagination {
  margin-top: 20px;
  justify-content: flex-end;
}
</style>
