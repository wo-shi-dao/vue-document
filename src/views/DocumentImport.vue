<template>
  <div class="document-import-container">
    <!-- 标题区域 -->
    <div class="header">
      <h1 class="title">文档导入</h1>
    </div>

    <!-- 筛选条件 -->
    <div class="filter-section">
      <el-date-picker
        v-model="filters.importTime"
        type="daterange"
        range-separator="至"
        start-placeholder="开始日期"
        end-placeholder="结束日期"
      />
      <el-select v-model="filters.status" placeholder="状态" clearable>
        <el-option label="处理中" value="processing" />
        <el-option label="待确认" value="pending" />
        <el-option label="成功" value="success" />
        <el-option label="失败" value="failed" />
        <el-option label="已取消" value="cancelled" />
      </el-select>
      <el-button type="primary" @click="handleSearch">搜索</el-button>
      <el-button type="primary" @click="handleShowImportDialog">导入</el-button>
    </div>

    <!-- 导入历史表格 -->
    <el-table :data="importList" style="width: 100%" border v-loading="loading">
      <el-table-column prop="importTime" label="导入时间" width="180" />
      <el-table-column prop="batchNo" label="批次号" width="150" />
      <el-table-column prop="condition" label="导入条件" width="150" />
      <el-table-column prop="fileName" label="文件名称" min-width="200" />
      <el-table-column prop="fileCount" label="文件数" width="80" />
      <el-table-column prop="irCount" label="IR数量" width="80" />
      <el-table-column prop="srCount" label="SR数量" width="80" />
      <el-table-column prop="arCount" label="AR数量" width="80" />
      <el-table-column label="状态" width="100">
        <template #default="{ row }">
          <el-tag v-if="row.status === 'processing'" type="warning">处理中</el-tag>
          <el-tag v-else-if="row.status === 'pending'" type="info">待确认</el-tag>
          <el-tag v-else-if="row.status === 'success'" type="success">成功</el-tag>
          <el-tag v-else-if="row.status === 'failed'" type="danger">失败</el-tag>
          <el-tag v-else-if="row.status === 'cancelled'" type="info">已取消</el-tag>
        </template>
      </el-table-column>
      <el-table-column label="操作" width="120">
        <template #default="{ row }">
          <el-button
            v-if="row.status !== 'processing' && row.status !== 'failed' && row.status !== 'cancelled'"
            link
            type="primary"
            @click="handleViewDetail(row)"
          >
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
    <el-dialog
      v-model="showImportDialog"
      title="导入文档"
      width="600px"
    >
      <el-upload
        ref="uploadRef"
        :auto-upload="false"
        :on-change="handleFileChange"
        :file-list="fileList"
        accept=".doc,.docx,.xls,.xlsx,.pdf"
        multiple
        drag
      >
        <el-icon class="el-icon--upload"><upload-filled /></el-icon>
        <div class="el-upload__text">
          将文件拖到此处，或<em>点击上传</em>
        </div>
        <template #tip>
          <div class="el-upload__tip">
            支持 .doc, .docx, .xls, .xlsx, .pdf 格式，且支持多个文件导入
          </div>
        </template>
      </el-upload>
      <template #footer>
        <el-button @click="showImportDialog = false">取消</el-button>
        <el-button type="primary" @click="handleStartParse">开始解析</el-button>
      </template>
    </el-dialog>

    <!-- 详情预览弹窗 -->
    <el-dialog
      v-model="showDetailDialog"
      :title="currentDetail.fileName"
      width="80%"
      top="5vh"
    >
      <div class="detail-content">
        <div class="detail-header">
          <span>{{ currentDetail.fileName }}</span>
          <div class="detail-actions" v-if="currentDetail.status === 'pending'">
            <el-button @click="handleCancelImport">取消</el-button>
            <el-button type="primary" @click="handleConfirmImport">确认导入</el-button>
          </div>
        </div>
        <div class="detail-body">
          <div class="document-preview">
            <h3>文档预览区域</h3>
            <p>此处显示文档内容预览</p>
          </div>
          <div class="requirement-list">
            <h3>需求条目列表</h3>
            <el-table :data="requirementList" border max-height="400">
              <el-table-column prop="id" label="ID" width="80" />
              <el-table-column prop="name" label="名称" />
              <el-table-column prop="type" label="类型" width="100" />
            </el-table>
          </div>
        </div>
      </div>
    </el-dialog>

    <!-- 进度条弹窗 -->
    <ProgressDialog
      v-model="showProgress"
      :title="progressTitle"
      :description="progressDescription"
      :progress-text="progressText"
      :footer-text="progressFooterText"
      :percentage="progressPercentage"
      :status="progressStatus"
    />
  </div>
</template>

<script setup>
import { ref, reactive, onMounted } from 'vue'
import { ElMessage } from 'element-plus'
import { UploadFilled } from '@element-plus/icons-vue'
import ProgressDialog from '../components/ProgressDialog.vue'
import {
  getImportHistory,
  parseImportFiles,
  getImportDetail,
  confirmImport,
  cancelImport
} from '../api/document'

const loading = ref(false)
const importList = ref([])
const fileList = ref([])
const uploadRef = ref(null)

const filters = reactive({
  importTime: null,
  status: ''
})

const pagination = reactive({
  current: 1,
  size: 10,
  total: 0
})

// 导入弹窗
const showImportDialog = ref(false)

// 详情弹窗
const showDetailDialog = ref(false)
const currentDetail = ref({})
const requirementList = ref([])

// 进度条
const showProgress = ref(false)
const progressTitle = ref('')
const progressDescription = ref('')
const progressText = ref('')
const progressFooterText = ref('')
const progressPercentage = ref(0)
const progressStatus = ref('')

onMounted(() => {
  loadImportHistory()
})

const loadImportHistory = async () => {
  loading.value = true
  try {
    const res = await getImportHistory({
      ...filters,
      page: pagination.current,
      size: pagination.size
    })
    importList.value = res.data.list || []
    pagination.total = res.data.total || 0
  } catch (error) {
    ElMessage.error('获取导入历史失败')
  } finally {
    loading.value = false
  }
}

const handleSearch = () => {
  pagination.current = 1
  loadImportHistory()
}

const handlePageSizeChange = () => {
  pagination.current = 1
  loadImportHistory()
}

const handlePageChange = () => {
  loadImportHistory()
}

const handleShowImportDialog = () => {
  fileList.value = []
  showImportDialog.value = true
}

const handleFileChange = (file, files) => {
  fileList.value = files
}

const handleStartParse = async () => {
  if (fileList.value.length === 0) {
    ElMessage.warning('请选择要导入的文件')
    return
  }

  showImportDialog.value = false
  showProgress.value = true
  progressTitle.value = '正在解析导入数据'
  progressDescription.value = '请稍候，正在解析需求条目...'
  progressText.value = '解析进度'
  progressFooterText.value = '正在处理需求条目...'
  progressPercentage.value = 0
  progressStatus.value = ''

  try {
    const result = await parseImportFiles(fileList.value, (progress) => {
      progressPercentage.value = progress
    })

    if (result.success) {
      progressPercentage.value = 100
      progressStatus.value = 'success'
      progressFooterText.value = '解析完成'
      
      setTimeout(() => {
        showProgress.value = false
        ElMessage.success('文件解析成功')
        loadImportHistory()
      }, 1000)
    } else {
      throw new Error(result.message)
    }
  } catch (error) {
    showProgress.value = false
    ElMessage.error(error.message || '解析失败')
  }
}

const handleViewDetail = async (row) => {
  try {
    const res = await getImportDetail(row.id)
    currentDetail.value = { ...row, ...res.data }
    requirementList.value = res.data.requirements || []
    showDetailDialog.value = true
  } catch (error) {
    ElMessage.error('获取详情失败')
  }
}

const handleConfirmImport = async () => {
  showProgress.value = true
  progressTitle.value = '正在导入数据'
  progressDescription.value = '请稍候，正在将需求条目导入系统...'
  progressText.value = '导入进度'
  progressFooterText.value = '正在处理需求条目...'
  progressPercentage.value = 0
  progressStatus.value = ''

  try {
    const result = await confirmImport(currentDetail.value.id, (progress) => {
      progressPercentage.value = progress
    })

    if (result.success) {
      progressPercentage.value = 100
      progressStatus.value = 'success'
      progressFooterText.value = '导入完成'
      
      setTimeout(() => {
        showProgress.value = false
        showDetailDialog.value = false
        ElMessage.success('导入成功')
        loadImportHistory()
      }, 1000)
    } else {
      throw new Error(result.message)
    }
  } catch (error) {
    showProgress.value = false
    ElMessage.error(error.message || '导入失败')
  }
}

const handleCancelImport = async () => {
  try {
    await cancelImport(currentDetail.value.id)
    ElMessage.success('已取消导入')
    showDetailDialog.value = false
    loadImportHistory()
  } catch (error) {
    ElMessage.error('取消失败')
  }
}
</script>

<style scoped>
.document-import-container {
  padding: 20px;
  background-color: #fff;
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
</style>
