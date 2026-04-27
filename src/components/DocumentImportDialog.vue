<template>
  <!-- 导入文档弹窗 -->
  <el-dialog
    v-model="visible"
    title="导入文档"
    width="650px"
    :close-on-click-modal="false"
  >
    <el-upload
      ref="uploadRef"
      :auto-upload="false"
      :on-change="handleFileChange"
      :on-remove="handleFileRemove"
      :file-list="fileList"
      accept=".doc,.docx,.xls,.xlsx,.pdf"
      multiple
      drag
      style="margin-bottom: 10px"
      :show-file-list="false"
    >
      <el-icon class="el-icon--upload"><upload-filled /></el-icon>
      <div class="el-upload__text">点击或拖拽文件到此处上传</div>
      <div class="upload_text_tip">支持 .doc, .docx, .xls, .xlsx, .pdf 格式</div>
    </el-upload>

    
    <!-- 文件列表 -->
    <div v-if="showFileList.length > 0" style="margin-bottom: 20px" >
      <!-- <div style="margin-bottom:10px;color:#666;">
        已选择 <span style="color:#409eff;font-weight:bold">{{ showFileList.length }}</span> 个文件
      </div> -->
      <div style="margin-bottom: 10px; font-size: 14px; color: #303133;">
        已选择 <span style="font-weight: 600; color: #303133;">{{ showFileList.length }}</span> 个文件
      </div>
      
      <el-table :data="showFileList" border row-key="uid"  max-height="235" class="no-shadow-table">
        <el-table-column label="文件名称" min-width="250">
          <template #default="{ row }">
            <span>{{ row.name }}</span>
          </template>
        </el-table-column>

        <el-table-column width="180">
          <template #header>
            <span>
              <span style="color: red;">*</span>
              需求类型
            </span>
          </template>
          <template #default="{ row }">
            <el-select
              v-model="row.fileType"
              placeholder="请选择类型"
              style="width: 100%"
              clearable
              :loading="typeLoading"
            >
              <el-option
                v-for="item in documentTypeList"
                :key="item.value"
                :label="item.label"
                :value="item.value"
              />
            </el-select>
          </template>
        </el-table-column>

        <el-table-column label="操作" width="100">
          <template #default="{ row }">
            <el-button type="danger" link size="small" @click="handleRemoveRow(row)">
              移除
            </el-button>
          </template>
        </el-table-column>
      </el-table>
    </div>

    <template #footer>
      <el-button @click="handleCancel">取消</el-button>
      <el-button 
        type="primary" 
        @click="handleStartParse" 
        :disabled="!canStartParse"
        >
        <!-- :disabled="fileList.length === 0" -->
        开始解析
      </el-button>
    </template>
  </el-dialog>
</template>

<script setup>
import { ref, defineProps, defineEmits, watch, computed } from 'vue'
import { ElMessage } from 'element-plus'
import { UploadFilled } from '@element-plus/icons-vue'
import { getDocumentTypeList, parseImportFiles } from '../api/document'

// 接收父组件传值：控制弹窗显示/隐藏
const props = defineProps({
  show: {
    type: Boolean,
    // default: false
  }
})

// 向父组件发送事件
const emit = defineEmits(['success', 'update:show'])

// 弹窗内部受控显示
const visible = ref(false)

watch(
  () => props.show,
  (val) => (visible.value = val)
)

// 上传相关
const fileList = ref([])

const showFileList = ref([])
const uploadRef = ref(null)


// 文档类型（接口获取）
const documentTypeList = ref([])
const typeLoading = ref(false)

// 打开弹窗时加载类型
watch(() => props.show, (val) => {
  if (val && documentTypeList.value.length === 0) {
    loadDocumentTypes()
  }
})

// 监听弹窗关闭 → 自动清空数据
watch(() => props.show, (newVal) => {
  // 弹窗关闭时清空
  if (!newVal) {
    fileList.value = []
    showFileList.value = []
  }
})

// --------------TODO 后续清理--------------

// 动态文档类型（你可以从接口取、从配置读、从后台返）
const docTypeList = ref([
  // { label: '需求文档', value: 'REQUIREMENT' },
  // { label: '接口文档', value: 'API' },
  // { label: '测试文档', value: 'TEST' },
  // { label: '设计文档', value: 'DESIGN' },
  // { label: '用户手册', value: 'MANUAL' }
    { label: 'IR', value: 'IR' },
    { label: 'SR', value: 'SR' },
    { label: 'AR', value: 'AR' },
])

// -------------- 后续清理--------------


// 获取文档类型接口
const loadDocumentTypes = async () => {
  typeLoading.value = true
  try {
    // const res = await getDocumentTypeList()
    // documentTypeList.value = res.data || []
    documentTypeList.value = docTypeList.value
  } catch (err) {
    ElMessage.error('获取需求类型失败')
    documentTypeList.value = []
  } finally {
    typeLoading.value = false
  }
}


const handleFileChange = (file, uploadFiles) => {
  // fileList.value = uploadFiles
  // showFileList.value = uploadFiles.map(item => ({
  //   ...item,
  //   fileType: item.fileType || ''
  // }))


  fileList.value = uploadFiles

  // 新列表 = 合并老类型 + 新文件
  const newShowFileList = uploadFiles.map(newItem => {
    // 找老文件是否已存在，存在就复用之前的 fileType
    const oldItem = showFileList.value.find(f => f.uid === newItem.uid)
    return {
      ...newItem,
      fileType: oldItem ? oldItem.fileType : '' // 保留类型！
    }
  })

  showFileList.value = newShowFileList
}

// ======================================
// 移除单个文件
// ======================================
const handleRemoveRow = (row) => {
  showFileList.value = showFileList.value.filter(f => f.uid !== row.uid)
  fileList.value = fileList.value.filter(f => f.uid !== row.uid)
}

// 上传组件原生移除事件
const handleFileRemove = (uploadFile, uploadFiles) => {
  fileList.value = uploadFiles
  const newFiles = uploadFiles.map(item => ({
    ...item,
    fileType: item.fileType || ''
  }))
  showFileList.value = newFiles
}

// 校验：所有文件都选择了类型，才能解析
const canStartParse = computed(() => {
  if (showFileList.value.length === 0) return false
  return showFileList.value.every(file => file.fileType && file.fileType.trim() !== '')
})


// 取消
const handleCancel = () => {
  emit('update:show', false)
  fileList.value = []
  showFileList.value = []
}
// // 文件选择/移除
// const handleFileChange = (file, files) => {
//   fileList.value = files
// }
// const handleFileRemove = (uploadFile, uploadFiles) => {
//   fileList.value = uploadFiles
// }

// 开始解析
const handleStartParse = () => {
  
  console.info('111')
  if (fileList.value.length === 0) {
    ElMessage.warning('请选择要导入的文件')
    return
  }

  if (!canStartParse.value) {
    ElMessage.warning('请选择文档类型')
    return
  }

  const parseParams = showFileList.value.map(item => ({
    file: item.raw,    // 真正的文件对象必须用 raw
    fileType: item.fileType
  }))


  // emit('update:show', false)

  // 把进度条需要的状态抛给父页面
  emit('success', {
    fileList: parseParams
  })

  // 清空
  // fileList.value = []
  // showFileList.value = []
}

</script>

<style scoped>
.upload_text_tip {
  color: #9fa6b1;
  padding-top: 10px;
}
.el-table.no-shadow-table {
  border-radius: 0 ;
  box-shadow: none;
}

</style>