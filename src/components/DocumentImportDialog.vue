<template>
  <!-- 导入文档弹窗 -->
  <el-dialog
    v-model="visible"
    title="导入文档"
    width="700px"
    top="10vh"
    :close-on-click-modal="false"
  >
    <el-upload
      ref="uploadRef"
      :auto-upload="false"
      :on-change="handleFileChange"
      :on-remove="handleFileRemove"
      :file-list="fileList"
      accept=".doc,.docx"
      multiple
      drag
      style="margin-bottom: 10px"
      :show-file-list="false"
    >
      <el-icon class="el-icon--upload"><upload-filled /></el-icon>
      <div class="el-upload__text">点击或拖拽文件到此处上传</div>
      <div class="upload_text_tip">支持 .doc, .docx 格式</div>
    </el-upload>

    
    <!-- 文件列表 -->
    <div v-if="showFileList.length > 0" style="margin-bottom: 20px" >
      <div style="margin-bottom: 10px; font-size: 14px; color: #303133;">
        已选择 <span style="font-weight: 600; color: #303133;">{{ showFileList.length }}</span> 个文件
      </div>
      
      <el-table :data="showFileList" border row-key="uid"  max-height="290" class="no-shadow-table">
        <el-table-column label="文件名称" min-width="250">
          <template #default="{ row }">
            <span>{{ row.name }}</span>
          </template>
        </el-table-column>
        
        <el-table-column width="180">
          <template #header>
            <span>
              <span style="color: red;">*</span>
              所属部门
            </span>
          </template>
          <template #default="{ row }">
            <el-select
              v-model="row.dept"
              placeholder="请选择"
              style="width: 100%"
              clearable
              :loading="deptLoading"
            >
              <el-option
                v-for="item in deptList"
                :key="item.value"
                :label="item.label"
                :value="item.value"
              />
            </el-select>
          </template>
        </el-table-column>

        <el-table-column width="120">
          <template #header>
            <span>
              <span style="color: red;">*</span>
              需求类型
            </span>
          </template>
          <template #default="{ row }">
            <el-select
              v-model="row.fileType"
              placeholder="请选择"
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


// 新增：部门列表相关
const deptList = ref([])
const deptLoading = ref(false)
// 记忆上次选择的部门ID
const lastDept = ref('')

// 打开弹窗时加载类型
watch(() => props.show, (val) => {
  if (val) {
    if (documentTypeList.value.length === 0) {
      loadDocumentTypes()
    }

    if (deptList.value.length === 0) {
      loadDeptList()
    }
    // 读取本地记忆部门
    lastDept.value = localStorage.getItem('LAST_UPLOAD_DEPT') || ''
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
    { label: 'IR', value: 'IR' },
    { label: 'SR', value: 'SR' },
    { label: 'AR', value: 'AR' },
])
// Mock部门数据
const mockDeptList = ref([
  { label: '科技和信息化部', value: 'RD1' },
  { label: '制动开发部', value: 'RD2' },
  { label: '交流传动开发部', value: 'PD' },
  { label: '网络控制开发部', value: 'QA' },
  { label: '数智赋能中心', value: 'OP1' },
  { label: '基础开发部', value: 'OP2' },
  { label: '安全监测开发部', value: 'OP3' },
])
// -------------- 后续清理--------------


// 获取文档类型接口
const loadDocumentTypes = async () => {
  typeLoading.value = true
  try {
    // TODO 删除
    if ("1" === "1") {
      documentTypeList.value = docTypeList.value
      return
    }
    // 真实接口
    const res = await getDocumentTypeList()
    documentTypeList.value = res.data || []
  } catch (err) {
    ElMessage.error('获取需求类型失败')
    documentTypeList.value = []
  } finally {
    typeLoading.value = false
  }
}

// 获取部门列表
const loadDeptList = async () => {
  deptLoading.value = true
  try {
    // TODO 删除
    if ("1" === "1") {
      deptList.value = mockDeptList.value
      return
    }
    // 真实接口（放开注释即用）
    // const res = await getDeptList()
    // deptList.value = res.data || []
  } catch (err) {
    ElMessage.error('获取部门失败')
    deptList.value = []
  } finally {
    deptLoading.value = false
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
      fileType: oldItem ? oldItem.fileType : '',
      dept: oldItem ? oldItem.dept : lastDept.value // 自动填充上次部门
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
    fileType: item.fileType || '',
    dept: item.dept || ''
  }))
  showFileList.value = newFiles
}

// 校验：所有文件都选择了类型，才能解析
const canStartParse = computed(() => {
  if (showFileList.value.length === 0) return false
  // return showFileList.value.every(file => file.fileType && file.fileType.trim() !== '')
  console.info('tt--' + showFileList.value[0].fileType?.trim() + '--' + showFileList.value[0].dept?.trim())
  return showFileList.value.every(file => file.fileType?.trim() && file.dept?.trim())
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
    ElMessage.warning('请选择需求类型和部门')
    return
  }

  // TODO 删除   保存最后一次选择的部门到本地（记忆功能）
  const currentDept = showFileList.value[0]?.dept
  if (currentDept) {
    localStorage.setItem('LAST_UPLOAD_DEPT', currentDept)
  }


  const parseParams = showFileList.value.map(item => ({
    file: item.raw,    // 真正的文件对象必须用 raw
    fileType: item.fileType,
    dept: item.dept
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

<style lang="scss" scoped>
.upload_text_tip {
  color: #9fa6b1;
  padding-top: 2px;
}
.el-table.no-shadow-table {
  border-radius: 0 ;
  box-shadow: none;
}
:deep(.el-upload-dragger) {
  padding: 20px 10px;
}
.el-icon--upload {
  margin-bottom: 6px;
  font-size: 50px;
}
</style>