<template>
  <div class="document-import-container">
    <!-- 标题区域 -->
    <div class="header">
      <h1 class="title">文档导入</h1>
    </div>

    <!-- 筛选条件 -->
    <BaseDataSearchForm
      :formItems="formItems"
      :searchForm="searchForm"
      @search="handleSearch"
      span="3"
    />
    <!-- <div class="filter-section">
      <el-date-picker
        v-model="filters.importTime"
        type="daterange"
        range-separator="至"
        start-placeholder="开始日期"
        end-placeholder="结束日期"
      />
      <el-button type="primary" @click="handleSearch">搜索</el-button>
      <el-button @click="handleReset">重置</el-button>
    </div> -->

    <div class="import-btn-wrapper">
      <el-button
        type="primary"
        @click="handleShowImportDialog"
        class="import-btn"
        >导入</el-button
      >
    </div>

    <!-- 导入历史表格 -->
    <el-table :data="importList" style="width: 100%" border v-loading="loading">
      <el-table-column prop="importTime" label="导入时间" width="180" />
      <!-- <el-table-column prop="batchNo" label="批次号" width="150" /> -->
      <el-table-column prop="condition" label="文件名称" min-width="150" />
      <el-table-column prop="importType" label="文件类型" min-width="80" />
      <!-- <el-table-column prop="fileName" label="文件名称" min-width="200" /> -->
      <el-table-column prop="fileCount" label="文件数" min-width="80" />
      <el-table-column prop="count" label="数量" min-width="80" />

      <el-table-column label="状态" width="120">
        <template #default="{ row }">
          <el-tag
            :type="getStatusTagType(row.status)"
            effect="light"
            :class="{ 'status-clickable': row.status === '失败' }"
            class="status-tag"
            @click="handleStatusClick(row)"
          >
            <el-icon class="status-icon" :loading="row.status === '处理中'">
              <component :is="getStatusIcon(row.status)" />
            </el-icon>
            {{ row.status }}
          </el-tag>
        </template>
      </el-table-column>
      <el-table-column label="操作" width="120">
        <template #default="{ row }">
          <el-button
            v-if="
              row.status !== 'processing' &&
              row.status !== 'failed' &&
              row.status !== 'cancelled'
            "
            link
            type="primary"
            @click.prevent="handleViewDetail(row)"
          >
            <!-- @click.prevent="handleViewDetail(row)" -->
            <!-- @click="handleViewDetail(row)" -->
            查看详情
          </el-button>
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

    <!-- 导入文档弹窗 -->
    <DocumentImportDialog
      v-model:show="showImportDialog"
      @success="handleStartImport"
    />

    <!-- 进度条弹窗 -->
    <ProgressDialog
      iconType="parse"
      v-model="showProgress"
      :title="progressTitle"
      :description="progressDescription"
      :progress-text="progressText"
      :footer-text="progressFooterText"
      :percentage="progressPercentage"
      :status="progressStatus"
    />

    <!-- 失败错误信息弹窗 -->
    <el-dialog v-model="errorDialogVisible" title="导入失败详情" width="500px">
      <div class="error-content">{{ errorMessage }}</div>
      <template #footer>
        <span class="dialog-footer">
          <el-button @click="errorDialogVisible = false">关闭</el-button>
        </span>
      </template>
    </el-dialog>
  </div>
</template>

<script setup>
import { ref, reactive, onMounted, onUnmounted } from "vue";
import { ElMessage } from "element-plus";
import {
  UploadFilled,
  CircleCheck,
  InfoFilled,
  CircleClose,
  Close,
  Loading,
  QuestionFilled,
} from "@element-plus/icons-vue";
import ProgressDialog from "../components/ProgressDialog.vue";
import BaseDataSearchForm from "@/components/BasicDataSearchForm/index.vue";
import DocumentImportDialog from "../components/DocumentImportDialog.vue";
import {
  getImportHistory,
  parseImportFiles,
  getImportDetail,
  confirmImport,
  cancelImport,
  submitParseFile,
  getParseProgress,
} from "../api/document";
import { POBrowser } from "js-pageoffice";

const loading = ref(false);
const importList = ref([]);
const fileList = ref([]);
const uploadRef = ref(null);

const filters = reactive({
  importTime: null,
  status: "",
});

const pagination = reactive({
  current: 1,
  size: 10,
  total: 0,
});

const searchForm = ref({});
// 表单项
const formItems = ref([
  {
    componentType: "el-date-picker",
    field: "creationDateRange",
    label: "导入时间",
    componentProps: {
      type: "daterange",
      "start-placeholder": "开始时间",
      "end-placeholder": "结束时间",
      format: "YYYY-MM-DD HH:mm:ss",
      "value-format": "YYYY-MM-DD HH:mm:ss",
    },
  },
  // {
  //   componentType: "el-input",
  //   field: "companyName",
  //   label: "文档名称",
  // },
]);

// 导入弹窗
const showImportDialog = ref(false);

// 详情弹窗
const showDetailDialog = ref(false);
const currentDetail = ref({});
const requirementList = ref([]);

const progressTimer = ref(null);

// 进度条
const showProgress = ref(false);
const progressTitle = ref("");
const progressDescription = ref("");
const progressText = ref("");
const progressFooterText = ref("");
const progressPercentage = ref(0);
const progressStatus = ref("");

// 弹窗状态
const errorDialogVisible = ref(false);
const errorMessage = ref("");

// --------------TODO 后续清理--------------
// 表格数据
const mockTmpTableData = ref([
  // { importTime: '2024-07-25 16:30:00', condition: '需求文档 v2.1.0', fileCount: '3', irCount: 25, srCount: 11, arCount: 5, status: '成功' },
  // { importTime: '2024-07-23 09:20:00', condition: '用户需求初稿', fileCount: '4', irCount: 0, srCount: 12, arCount: 0, status: '处理中' },
  // { importTime: '2024-07-22 14:45:00', condition: '测试用例文档', fileCount: '5', irCount: 10, srCount: 9, arCount: 0, status: '部分成功' },
  // { importTime: '2024-07-21 16:10:00', condition: '接口文档异常版本', fileCount: '2', irCount: 0, srCount: 11, arCount: 15, status: '失败', message: '文件格式错误：仅支持 .xlsx / .docx' },
  // { importTime: '2024-07-20 11:30:00', condition: '需求汇总文档', fileCount: '1', irCount: 0, srCount: 11, arCount: 5, status: '待确认' },
  // { importTime: '2024-07-20 11:30:00', condition: '需求汇总文档', fileCount: '1', irCount: 0, srCount: 11, arCount: 9, status: '待确认' },
  // { importTime: '2024-07-20 11:30:00', condition: '需求汇总文档', fileCount: '1', irCount: 0, srCount: 10, arCount: 8, status: '待确认' },
  // { importTime: '2024-07-20 11:30:00', condition: '需求汇总文档', fileCount: '1', irCount: 0, srCount: 16, arCount: 7, status: '待确认' },
  // { importTime: '2024-07-20 11:30:00', condition: '需求汇总文档', fileCount: '1', irCount: 0, srCount: 0, arCount: 5, status: '待确认' },
  // { importTime: '2024-07-20 11:30:00', condition: '需求汇总文档', fileCount: '1', irCount: 0, srCount: 3, arCount: 2, status: '待确认' },
  // { importTime: '2024-07-20 11:30:00', condition: '需求汇总文档', fileCount: '1', irCount: 0, srCount: 5, arCount: 0, status: '待确认' },
  // { importTime: '2024-07-20 11:30:00', condition: '需求汇总文档', fileCount: '1', irCount: 0, srCount: 19, arCount: 15, status: '待确认' },
  // { importTime: '2024-07-19 15:20:00', condition: '旧版需求文档', fileCount: '2', irCount: 0, srCount: 11, arCount: 5, status: '已取消' }
  {
    importTime: "2024-07-25 16:30:00",
    condition: "需求文档 v2.1.0",
    fileCount: "3",
    status: "成功",
    importType: "IR",
    count: 25,
  },
  {
    importTime: "2024-07-23 09:20:00",
    condition: "用户需求初稿",
    fileCount: "4",
    status: "处理中",
    importType: "IR",
    count: 0,
  },
  {
    importTime: "2024-07-22 14:45:00",
    condition: "测试用例文档",
    fileCount: "5",
    status: "部分成功",
    importType: "IR",
    count: 10,
  },
  {
    importTime: "2024-07-21 16:10:00",
    condition: "接口文档异常版本",
    fileCount: "2",
    status: "失败",
    message: "文件解析异常，内容为空。",
    importType: "IR",
    count: 0,
  },
  {
    importTime: "2024-07-20 11:30:00",
    condition: "需求汇总文档",
    fileCount: "1",
    status: "待确认",
    importType: "IR",
    count: 0,
  },
  {
    importTime: "2024-07-20 11:30:00",
    condition: "性能优化整改说明",
    fileCount: "1",
    status: "待确认",
    importType: "IR",
    count: 0,
  },
  {
    importTime: "2024-07-20 11:30:00",
    condition: "系统配置变更单",
    fileCount: "1",
    status: "待确认",
    importType: "IR",
    count: 0,
  },
  {
    importTime: "2024-07-20 11:30:00",
    condition: "角色权限梳理文档",
    fileCount: "1",
    status: "待确认",
    importType: "IR",
    count: 0,
  },
  {
    importTime: "2024-07-20 11:30:00",
    condition: "权限管理清单",
    fileCount: "1",
    status: "待确认",
    importType: "IR",
    count: 0,
  },
  {
    importTime: "2024-07-20 11:30:00",
    condition: "后端接口规范文档",
    fileCount: "1",
    status: "待确认",
    importType: "IR",
    count: 0,
  },
  {
    importTime: "2024-07-20 11:30:00",
    condition: "迭代优化需求清单",
    fileCount: "1",
    status: "待确认",
    importType: "IR",
    count: 0,
  },
  {
    importTime: "2024-07-20 11:30:00",
    condition: "需求汇总文档V1",
    fileCount: "1",
    status: "待确认",
    importType: "IR",
    count: 0,
  },
  {
    importTime: "2024-07-19 15:20:00",
    condition: "旧版需求文档",
    fileCount: "2",
    status: "已取消",
    importType: "IR",
    count: 0,
  },
]);
// --------------后续清理--------------

onMounted(() => {
  loadImportHistory();

  window.onPageOfficeClosed = (paramJson) => {
    console.info("回调父类方法..");

    const { taskId } = JSON.parse(paramJson);

    // 显示确认导入进度条
    setConfirmProgress();

    // 开始轮询
    startConfirmProgressLoop(taskId);
  };
});

onUnmounted(() => {
  // 组件销毁时清理
  window.onPageOfficeClosed = null; // 销毁
});

const loadImportHistory = async () => {
  console.info("111");
  loading.value = true;

  // --------------TODO 后续清理--------------
  if ("1" == "1") {
    // 模拟接口延迟
    await new Promise((resolve) => setTimeout(resolve, 300));

    const list = mockTmpTableData.value;
    const total = mockTmpTableData.value.length;
    const start = (pagination.current - 1) * pagination.size;
    const end = start + pagination.size;

    // ✅ 前端分页
    importList.value = list.slice(start, end);
    pagination.total = total;

    loading.value = false;

    return;
    // --------------后续清理--------------
  }

  // TODO 要改
  try {
    const res = await getImportHistory({
      ...filters,
      page: pagination.current,
      size: pagination.size,
    });
    importList.value = res.data.list || [];
    pagination.total = res.data.total || 0;
  } catch (error) {
    ElMessage.error("获取导入历史失败");
  } finally {
    loading.value = false;
  }
};

const getStatusIcon = (status) => {
  const iconMap = {
    成功: CircleCheck,
    部分成功: InfoFilled,
    失败: CircleClose,
    已取消: Close,
    处理中: Loading,
    待确认: QuestionFilled,
  };
  return iconMap[status] || "";
};

const getStatusTagType = (status) => {
  const typeMap = {
    成功: "success",
    部分成功: "warning",
    失败: "danger",
    已取消: "info",
    处理中: "",
    待确认: "warning",
  };
  return typeMap[status] || "";
};

const handleStatusClick = (row) => {
  if (row.status === "失败") {
    errorMessage.value = row.message;
    errorDialogVisible.value = true;
  }
};

const handleReset = () => {
  searchParams.value = {
    timeRange: [],
    status: "",
  };
};

const handleSearch = () => {
  pagination.current = 1;
  loadImportHistory();
};

const handlePageSizeChange = () => {
  pagination.current = 1;
  loadImportHistory();
};

const handlePageChange = () => {
  loadImportHistory();
};

const handleShowImportDialog = () => {
  console.info("import..");
  fileList.value = [];
  showImportDialog.value = true;
};

// TODO 删除
const addData = ref([]);

const formatTime = () => {
  const now = new Date();
  return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}-${String(now.getDate()).padStart(2, "0")} ${String(now.getHours()).padStart(2, "0")}:${String(now.getMinutes()).padStart(2, "0")}:${String(now.getSeconds()).padStart(2, "0")}`;
};

const setParseProgress = () => {
  showProgress.value = true;
  progressTitle.value = "文档解析中";
  progressDescription.value = "后台正在解析文档内容...";
  progressText.value = "解析进度";
  progressFooterText.value = "正在处理...";
  progressPercentage.value = 0;
  progressStatus.value = "";
};

const handleStartImport = async (params) => {
  const { fileList } = params;

  // TODO 删除
  if ("1" == "1") {
    await new Promise((resolve) => setTimeout(resolve, 300));
    const taskId = crypto.randomUUID();
    const docId = crypto.randomUUID();

    // TODO 删除
    addData.value = [];
    for (let i = 0; i < params.fileList.length; i++) {
      const ele = params.fileList[i];

      let tmp = {
        importTime: formatTime(),
        condition: ele.file.name,
        importType: ele.fileType,
        fileCount: "1",
        count: 15,
        status: "成功",
      };
      addData.value.push(tmp);
    }

    // 提交成功 → 关闭上传弹窗
    showImportDialog.value = false;

    // 设置进度条参数
    setParseProgress();

    // 轮询进度
    startProgressLoop(taskId, docId);
    return;
  }

  try {
    const res = await submitParseFile(fileList);
    const taskId = res.data?.taskId;

    if (!taskId) {
      ElMessage.error("解析失败，未获取到任务ID");
      return;
    }

    // 提交成功 → 关闭上传弹窗
    showImportDialog.value = false;

    // 设置进度条参数
    setParseProgress();

    // 轮询进度
    startProgressLoop(taskId, docId);
  } catch (err) {
    // 接口失败 → 不关闭上传弹窗
    ElMessage.error("提交解析失败：" + (err.message || "服务异常"));
  }
};

// 轮询查询解析进度
const startProgressLoop = (taskId, docId) => {
  if (progressTimer.value) clearInterval(progressTimer.value);

  // TODO 后续删除
  if ("1" == "1") {
    mockProgressLoop(taskId, docId);
    return;
  }

  progressTimer.value = setInterval(async () => {
    try {
      const res = await getParseProgress(taskId);
      const { progress, status } = res.data;

      progressPercentage.value = progress;

      // 完成
      if (status === "SUCCESS") {
        clearInterval(progressTimer.value);
        progressTimer.value = null;
        progressPercentage.value = 100;
        progressStatus.value = "success";
        progressFooterText.value = "解析完成";

        setTimeout(() => {
          showProgress.value = false;
          ElMessage.success("解析完成");

          afterParseComplete(taskId, docId);
        }, 800);
      }

      // 失败
      if (status === "FAILED") {
        clearInterval(progressTimer.value);
        progressTimer.value = null;
        showProgress.value = false;
        ElMessage.error("解析失败");
      }
    } catch (err) {
      clearInterval(progressTimer.value);
      progressTimer.value = null;
      showProgress.value = false;
      ElMessage.error("查询进度失败");
    }
  }, 1500);
};

// ========== 假进度模拟 ==========
const mockProgressLoop = (taskId, docId) => {
  let mockPercent = 0;
  progressTimer.value = setInterval(() => {
    mockPercent += 10;
    if (mockPercent >= 100) {
      mockPercent = 100;
      clearInterval(progressTimer.value);
      progressTimer.value = null;

      progressPercentage.value = 100;
      progressStatus.value = "success";
      progressFooterText.value = "解析完成";

      setTimeout(() => {
        showProgress.value = false;
        ElMessage.success("解析完成");
        afterParseComplete(taskId, docId);
      }, 800);
    }
    progressPercentage.value = mockPercent;
  }, 300);
  return;
};

// 进度完成后执行
const afterParseComplete = (taskId, docId) => {
  // 打开预览界面
  openPageOfficePreview({
    fileId: 123,
    fileName: "测试文档.docx",
    taskId: taskId,
    docId: docId,
  });
};

// 打开 PageOffice 预览页面
const openPageOfficePreview = (fileParams) => {
  const paramString = JSON.stringify(fileParams);
  POBrowser.openWindow(
    "/pageOffice/parseResultPreview",
    "fullscreen=yes",
    paramString,
  );
};

const setConfirmProgress = () => {
  showProgress.value = true;
  progressTitle.value = "确认导入中";
  progressDescription.value = "正在保存解析结果到系统...";
  progressText.value = "导入进度";
  progressFooterText.value = "正在保存...";
  progressPercentage.value = 0;
  progressStatus.value = "";
};

const startConfirmProgressLoop = (taskId) => {
  if (progressTimer.value) clearInterval(progressTimer.value);

  // TODO 后续删除
  if ("1" == "1") {
    mockConfirmProgressLoop(taskId);
    return;
  }

  progressTimer.value = setInterval(async () => {
    try {
      const res = await getParseProgress(taskId);
      const { progress, status } = res.data;

      progressPercentage.value = progress;

      // 完成
      if (status === "SUCCESS") {
        clearInterval(progressTimer.value);
        progressTimer.value = null;
        progressPercentage.value = 100;
        progressStatus.value = "success";
        progressFooterText.value = "导入完成";

        setTimeout(() => {
          showProgress.value = false;
          ElMessage.success("导入完成");

          // 刷新列表
          loadImportHistory();
        }, 800);
      }

      // 失败
      if (status === "FAILED") {
        clearInterval(progressTimer.value);
        progressTimer.value = null;
        showProgress.value = false;
        ElMessage.error("解析失败");
      }
    } catch (err) {
      clearInterval(progressTimer.value);
      progressTimer.value = null;
      showProgress.value = false;
      ElMessage.error("查询进度失败");
    }
  }, 1500);
};

// ========== TODO 假进度模拟 ==========
const mockConfirmProgressLoop = (taskId) => {
  let mockPercent = 0;
  progressTimer.value = setInterval(() => {
    mockPercent += 10;
    if (mockPercent >= 100) {
      mockPercent = 100;
      clearInterval(progressTimer.value);
      progressTimer.value = null;

      progressPercentage.value = 100;
      progressStatus.value = "success";
      progressFooterText.value = "导入完成";

      setTimeout(() => {
        showProgress.value = false;
        ElMessage.success("导入完成");

        mockTmpTableData.value.unshift(...addData.value);

        loadImportHistory(); // 刷新列表
      }, 800);
    }
    progressPercentage.value = mockPercent;
  }, 300);
  return;
};

const handleViewDetail = async (row) => {
  let paramJson = {};
  paramJson.file_id = 1;
  paramJson.file_name = "test.docx";
  let paramString = JSON.stringify(paramJson);

  //openWindow()第三个参数用来向弹出的PageOffice浏览器（POBrowser）窗口传递参数(参数长度不限)，支持json格式字符串。
  //此处为了方便演示，我们传递了file_id和file_name两个参数，具体以您实际开发为准。
  // POBrowser.openWindow('/pageOffice/parseResultPreview', "width=1000px;height=600px;", paramString);

  // const paramString = JSON.stringify({})
  POBrowser.openWindow(
    "/pageOffice/parseResultPreview",
    "fullscreen=yes",
    paramString,
  );

  // try {
  //   const res = await getImportDetail(row.id)
  //   currentDetail.value = { ...row, ...res.data }
  //   requirementList.value = res.data.requirements || []
  //   showDetailDialog.value = true
  // } catch (error) {
  //   ElMessage.error('获取详情失败')
  // }
};

const handleConfirmImport = async () => {
  showProgress.value = true;
  progressTitle.value = "正在导入数据";
  progressDescription.value = "请稍候，正在将需求条目导入系统...";
  progressText.value = "导入进度";
  progressFooterText.value = "正在处理需求条目...";
  progressPercentage.value = 0;
  progressStatus.value = "";

  try {
    const result = await confirmImport(currentDetail.value.id, (progress) => {
      progressPercentage.value = progress;
    });

    if (result.success) {
      progressPercentage.value = 100;
      progressStatus.value = "success";
      progressFooterText.value = "导入完成";

      setTimeout(() => {
        showProgress.value = false;
        showDetailDialog.value = false;
        ElMessage.success("导入成功");
        loadImportHistory();
      }, 800);
    } else {
      throw new Error(result.message);
    }
  } catch (error) {
    showProgress.value = false;
    ElMessage.error(error.message || "导入失败");
  }
};

const handleCancelImport = async () => {
  try {
    await cancelImport(currentDetail.value.id);
    ElMessage.success("已取消导入");
    showDetailDialog.value = false;
    loadImportHistory();
  } catch (error) {
    ElMessage.error("取消失败");
  }
};
</script>

<style scoped>
.document-import-container {
  padding: 20px;
  background-color: #f3f3f3;
  min-height: 100vh;
}

.header {
  margin-bottom: 20px;
}

.title {
  font-size: 24px;
  font-weight: bold;
  color: #303133;
  margin: 0;
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

.detail-content {
  height: 70vh;
  display: flex;
  flex-direction: column;
}

.detail-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding-bottom: 15px;
  border-bottom: 1px solid #ebeef5;
  margin-bottom: 20px;
}

.detail-body {
  display: flex;
  gap: 20px;
  flex: 1;
  overflow: hidden;
}

.document-preview {
  flex: 1;
  border: 1px solid #dcdfe6;
  border-radius: 4px;
  padding: 20px;
  overflow: auto;
}

.requirement-list {
  flex: 1;
  border: 1px solid #dcdfe6;
  border-radius: 4px;
  padding: 20px;
  overflow: auto;
}

.status-clickable {
  cursor: pointer;
}
.status-clickable:hover {
  opacity: 0.8;
}
:deep(.status-tag) {
  display: inline-flex;
  align-items: center;
  gap: 4px;
}
:deep(.status-tag .status-icon) {
  display: inline-flex;
  align-items: center;
  vertical-align: middle;
}

.ir-count {
  color: #9254de;
  font-weight: 500;
}

.sr-count {
  color: #2563eb;
  font-weight: 500;
}

.ar-count {
  color: #16a34a;
  font-weight: 500;
}

.import-btn-wrapper {
  margin-bottom: 16px; /* 离表格间距 */
}
.import-btn {
  /* display: flex;
  align-items: center;
  gap: 4px; */
  margin-left: auto;
}

.upload_text_tip {
  color: #9fa6b1;
  padding-top: 10px;
}

.custom-upload :deep(.el-upload) {
  border: 1px dashed #d9d9d9;
  border-radius: 8px;
  padding: 40px 0;
  text-align: center;
  background-color: #fff;
}

.upload-icon {
  font-size: 48px;
  color: #c0c4cc;
  margin-bottom: 16px;
}
</style>
