<template>
<div>
  <div style="width:100%;height: 45px; display: flex; justify-content: space-between; align-items: center;">
    <span class="title">文档解析结果预览</span>
    <span class="button">
      <el-button @click="doClose()">取消</el-button>
      <el-button type="primary" @click="handleConfirmClick">确认导入</el-button>
    </span>
  </div>

  <div class="doc" style="display: flex; height: 100%;overflow: hidden;">
    <div class="letArea">
      <div style="width: 100%; height: calc(100vh - 70px);" v-html="poHtmlCode"></div>
    </div>

    <div class="rightArea" style="width: 300px; height: 100%; padding: 0 10px; background: #f5f5f5; display: flex; flex-direction: column; gap: 8px;">
      <div class="mul">
        <h3 style="margin: 0 0 10px 0;">需求条目</h3>
        <div style="display: flex; gap: 10px; margin-bottom: 10px;">
          <span style="color: #A864C7;background: #f9f2ff;padding: 0 4px;border-radius: 3px;">IR: {{ count.ir }}</span>
          <span style="color: #4D85FF;background: #f2f7ff;padding: 0 4px;border-radius: 3px;">SR: {{ count.sr }}</span>
          <span style="color: #3CB371;background: #f2fff5;padding: 0 4px;border-radius: 3px;">AR: {{ count.ar }}</span>
        </div>
        <input
          v-model="searchKey"
          type="text"
          placeholder="搜索需求"
          style="width: 100%; padding: 6px; box-sizing: border-box; margin-bottom: 15px; border: 1px solid #ddd; border-radius: 4px;"
        />
      </div>

      <div class="list">
        <div
          v-for="item in filteredList"
          :key="item.id"
          @click="selectDemand(item)"
          style="padding: 10px; margin-bottom: 8px; background: #fff; border-radius: 4px; cursor: pointer; border: 1px solid transparent;"
          :style="{ borderColor: selectedDemand?.id === item.id ? '#409eff' : 'transparent' }"
        >
          <div style="display: flex; align-items: center; gap: 8px; margin-bottom: 4px;">
            <span>
              <span v-if="item.type==='IR'" style="background: #f9f2ff; color: #A864C7; border: 1px solid #dac5f0; padding: 0 4px; font-size: 12px; font-weight: bold; border-radius: 3px; display: inline-block;">{{ item.type }}</span>
              <span v-if="item.type==='SR'" style="background: #f2f7ff; color: #4D85FF; border: 1px solid #c5d6f0; padding: 0 4px; font-size: 12px; font-weight: bold; border-radius: 3px; display: inline-block;">{{ item.type }}</span>
              <span v-if="item.type==='AR'" style="background: #f2fff5; color: #3CB371; border: 1px solid #c5f0d0; padding: 0 4px; font-size: 12px; font-weight: bold; border-radius: 3px; display: inline-block;">{{ item.type }}</span>
            </span>
            <span style="font-weight: bold;">{{ item.code }}</span>
            <span style="flex: 1;">{{ item.name }}</span>
          </div>
          <div style="display: flex; align-items: center; gap: 8px; font-size: 14px; color: #666;padding-left: 30px;">
            <span 
              :style="{
                color: item.priority === '高' ? '#ff4d4f' : item.priority === '中' ? '#faad14' : '#52c41a',
                backgroundColor: item.priority === '高' ? '#fff1f0' : item.priority === '中' ? '#fff7e6' : '#f6ffed',
                padding: '0px 4px',
                borderRadius: '3px',
              }"
            >
              {{ item.priority }}
            </span>
            <span style="padding-left: 5px;">{{ item.module }}</span>
            <span style="padding-left: 5px;">{{ item.page }}</span>
          </div>
        </div>
      </div>
    </div>
  </div>

  <ProgressDialog
    v-model:show="modalVisible"
    :showClose="false"
    title="正在导入"
    description="正在处理解析结果..."
    :progress="progressValue"
  />
</div>
</template>

<script setup>
import { ref, onMounted, computed, watch } from 'vue'
import { ElMessage } from 'element-plus'
import ProgressDialog from '@/components/ProgressDialog.vue'
import request from "../../utils/request";
import { getParseDetailList, confirmImport } from '../../api/document'


const poHtmlCode = ref('')
const open_params = ref('')

const modalVisible = ref(false)
const progressValue = ref(0)

const docId = ref('')

const demandList = ref([])
const fetchDemandList = async () => {
  // TODO open_params.value
  const params = {}
  const res = await getParseDetailList(params)
  demandList.value = res.data || []
}

// TODO 后续删除
const mockDemandList = ref([
  { id: 1, code: 'IR-0001', name: '用户管理功能', priority: '高', module: '用户管理', page: 'P.1', type: 'IR' },
  { id: 2, code: 'IR-0002', name: '订单管理功能', priority: '高', module: '订单管理', page: 'P.7', type: 'IR' },
  { id: 3, code: 'IR-0003', name: '报表统计功能', priority: '中', module: '报表统计', page: 'P.10', type: 'IR' },
])

const searchKey = ref('')
const selectedDemand = ref(null)

const filteredList = computed(() => {
  if (!searchKey.value) return demandList.value
  const k = searchKey.value.toLowerCase()
  return demandList.value.filter(i =>
    i.code.toLowerCase().includes(k) ||
    i.name.toLowerCase().includes(k) ||
    i.module.toLowerCase().includes(k)
  )
})

const count = computed(() => {
  const ir = demandList.value.filter(i => i.type === 'IR').length
  const sr = demandList.value.filter(i => i.type === 'SR').length
  const ar = demandList.value.filter(i => i.type === 'AR').length
  return { ir, sr, ar }
})


const selectDemand = (item) => {
  selectedDemand.value = item
  try {
    pageofficectrl.word.HomeKey(6)
    pageofficectrl.word.FindNextText(item.code)
  } catch (e) {}
}


const handleConfirmClick = async () => {

  // TODO 删除
  if ("1" == "1") {

    // 模拟接口延迟
    await new Promise(resolve => setTimeout(resolve, 300))

    const newTaskId = crypto.randomUUID()
    doClose(JSON.stringify({ taskId: newTaskId }))
    return
  }

  try {
    const res = await confirmImport(docId.value)
    if (res.code !== 200) {
      ElMessage.error('确认导入失败：' + res.msg)
      return
    }

    // 接口成功 → 拿到新的 taskId
    const newTaskId = res.data.taskId

      //  window.CallParentFunc({
      //   funcName: 'startConfirmProgress',
      //   paramJson: JSON.stringify({ taskId: newTaskId })
      // })

    doClose(JSON.stringify({ taskId: newTaskId }))
  } catch (err) {
    // 接口失败 → 不关闭页面
    ElMessage.error('导入失败：' + (err.message || '服务异常'))
  }

    // modalVisible.value = true
    // progressValue.value = 0

    // const timer = setInterval(() => {
    //   progressValue.value += 10
    //   if (progressValue.value >= 100) {
    //     clearInterval(timer)
    //     setTimeout(() => {
    //       modalVisible.value = false
    //       doClose()
    //     }, 500)
    //   }
    // }, 200)
}

function OnPageOfficeCtrlInit() {}
function AfterDocumentOpened() {
  pageofficectrl.DisableSave = true
  pageofficectrl.DisableSaveAs = true
  pageofficectrl.DisablePrint = true
  pageofficectrl.CustomToolbar = false;
}
function Save() {}


const doClose = (params) => {
  window.CallParentFunc({
    funcName: 'onPageOfficeClosed',
    paramJson: params,
    success: () => pageofficectrl.CloseWindow(true),
    error: () => pageofficectrl.CloseWindow(true)
  })
}

onMounted(async () => {
  open_params.value = JSON.parse(pageofficectrl.WindowParams)
  openFile().then(res => poHtmlCode.value = res)

  docId.value = open_params.value.docId


  
  // TODO 接口好了打开这个
  // await fetchDemandList()
  // TODO 删除
  demandList.value = mockDemandList.value


  window.POPageMounted = { OnPageOfficeCtrlInit, AfterDocumentOpened, Save }
})

function openFile() {
  // TODO 更换
  // open_params.value
  const params = {}
  return request({ url: '/CommentOnly/Word', method: 'get', params:  params})
}
</script>

<style scoped>
.doc { width: 100%; height: 100%; display: flex; overflow: hidden; }
.letArea { flex: 1; padding-left: 10px; }
.rightArea { width: 300px; background: #f5f5f5; padding: 0 10px; display: flex; flex-direction: column; }
.mul { height: 100px; }
.list { height: calc(100vh - 160px - 25px); overflow-y: auto; padding-right: 5px; }
.title { font-size: 16px; padding-left: 10px; }
.button { padding-right: 10px; }
</style>