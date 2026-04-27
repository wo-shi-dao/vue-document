<template>
<div>
  <div style="width:100%;height: 45px; display: flex; justify-content: space-between; align-items: center;">
    <!-- <span class="title">文档解析结果预览</span> -->
    <span class="title">{{ open_params.file_name }}</span>
    <span class="button" v-if="open_params.showConfirmBtn == true">
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
          class="search-input"
          />
      </div>

      <div class="list">
        <div
          v-for="item in filteredList"
          :key="item.id"
          class="demand-item"
          @click="selectDemand(item)"
          :class="{ active: selectedDemand?.id === item.id }"
        >
          <div style="display: flex; align-items: center; gap: 8px; margin-bottom: 4px;">
            <span>
              <span v-if="item.type==='IR'" style="background: #f9f2ff; color: #A864C7; border: 1px solid #dac5f0; padding: 0 4px; font-size: 12px; font-weight: bold; border-radius: 3px; display: inline-block;">{{ item.type }}</span>
              <span v-if="item.type==='SR'" style="background: #f2f7ff; color: #4D85FF; border: 1px solid #c5d6f0; padding: 0 4px; font-size: 12px; font-weight: bold; border-radius: 3px; display: inline-block;">{{ item.type }}</span>
              <span v-if="item.type==='AR'" style="background: #f2fff5; color: #3CB371; border: 1px solid #c5f0d0; padding: 0 4px; font-size: 12px; font-weight: bold; border-radius: 3px; display: inline-block;">{{ item.type }}</span>
            </span>
            <span style="font-weight: bold;">{{ item.code }}</span>
          </div>
          <div style="display: flex; align-items: center; gap: 8px; margin-bottom: 4px; padding-left: 30px;">
            <span style="flex: 1; ">{{ item.name }}</span>
          </div>


          <!-- <div style="display: flex; align-items: center; gap: 8px; font-size: 14px; color: #666;padding-left: 30px;">
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
          </div> -->
        </div>
      </div>
    </div>
  </div>

</div>
</template>

<script setup>
import { ref, onMounted, computed, watch } from 'vue'
import { ElMessage } from 'element-plus'
import request from "../../utils/request";
import { getParseDetailList, confirmImport } from '../../api/document'


const poHtmlCode = ref('')
const open_params = ref('')


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
  // { id: 1, code: 'IRD555A-AAA-DDD-001', name: '用户管理功能', priority: '高', module: '用户管理', page: 'P.1', type: 'IR' },
  // { id: 2, code: 'IRD555A-AAA-NN-DDD-024', name: '订单管理功能', priority: '高', module: '订单管理', page: 'P.7', type: 'IR' },
  // { id: 3, code: 'IRD555A-AAA-MM-DDD-054', name: '报表统计功能', priority: '中', module: '报表统计', page: 'P.10', type: 'IR' },

  { id: 1, code: 'TKD539A-SWR-SF.023', name: '牵引安全', priority: '高', module: '订单管理', page: 'P.7', type: 'IR' },
  { id: 2, code: 'TKD539A-SWR-NF.024', name: '主断路器控制', priority: '中', module: '报表统计', page: 'P.10', type: 'IR' },
  { id: 3, code: 'TKD539A-SWRCP-SF.074', name: '主断路器控制指令（安全）', priority: '中', module: '报表统计', page: 'P.10', type: 'IR' },
  { id: 4, code: 'TKD539A-SWRCP-NI.212', name: '硬线本单元列车级主断状态', priority: '中', module: '报表统计', page: 'P.10', type: 'IR' },
  { id: 5, code: 'TKD539A-SWRCP-NI.213', name: '硬线它单元列车级主断状态', priority: '中', module: '报表统计', page: 'P.10', type: 'IR' },
  { id: 6, code: 'TKD539A-SWRCP-SI.214', name: '硬线单元级主断状态', priority: '中', module: '报表统计', page: 'P.10', type: 'IR' },
  { id: 7, code: 'TKD539A-SWRCP-NI.215', name: '硬线短接接触器状态反馈', priority: '中', module: '报表统计', page: 'P.10', type: 'IR' },
  { id: 8, code: 'TKD539A-SWRCP-NI.216', name: '硬线预充电接触器状态反馈', priority: '中', module: '报表统计', page: 'P.10', type: 'IR' },
  { id: 9, code: 'TKD539A-SWRCP-NI.270', name: '硬线接触网网压检测', priority: '中', module: '报表统计', page: 'P.10', type: 'IR' },
  { id: 10, code: 'TKD539A-SWRCP-SI.450', name: '硬线主断使能', priority: '中', module: '报表统计', page: 'P.10', type: 'IR' },

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
  selectedDemand.value = item;
  try {
    pageofficectrl.word.HomeKey(6);
    // pageofficectrl.word.FindNextText(item.code)
     if (pageofficectrl.word.FindNextText(item.code)) {
     } else {
      alert("未搜索到位置。");
     }
  } catch (e) {
  }
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

}

function OnPageOfficeCtrlInit() {
  
  pageofficectrl.DisableSave = true;
  pageofficectrl.DisableSaveAs = true;
  pageofficectrl.DisablePrint = true;
  pageofficectrl.CustomToolbar = false; //隐藏自定义工具栏
  pageofficectrl.OfficeToolbars = false; //隐藏Office工具栏
}
function AfterDocumentOpened() {
}


const doClose = (params) => {
  window.CallParentFunc({
    funcName: 'onPageOfficeClosed',
    paramJson: params,
    success: () => pageofficectrl.CloseWindow(true),
    error: () => pageofficectrl.CloseWindow(true)
  })
}

onMounted(async () => {
  open_params.value = JSON.parse(pageofficectrl.WindowParams);
  openFile().then(res => poHtmlCode.value = res);

  docId.value = open_params.value.docId;


  
  // TODO 接口好了打开这个
  // await fetchDemandList()
  // TODO 删除
  demandList.value = mockDemandList.value


  window.POPageMounted = { OnPageOfficeCtrlInit, AfterDocumentOpened }
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
.search-input {
  width: 100%;
  padding: 5px 8px;
  box-sizing: border-box;
  margin-bottom: 12px;
  border: 1px solid #ddd;
  border-radius: 4px;
  font-size: 13px;
  outline: none;
}
.search-input:focus {
  border-color: #409eff;
}

.demand-item {
  padding: 10px;
  margin-bottom: 8px;
  background: #fff;
  border-radius: 6px; /* 轻微圆角，比原来更柔和 */
  cursor: pointer;
  border: 1px solid transparent;
  transition: all 0.2s ease;
  font-size: 14px;

  
}
.demand-item:hover {
  border-color: #e4e7ed; /* hover 时显示浅灰边框 */
  box-shadow: 0 1px 4px rgba(0, 0, 0, 0.05); /* 轻微阴影，提升质感 */
}
.demand-item.active {
  border-color: #409eff; /* 选中状态保持你原来的蓝色边框 */
  background: #f0f7ff; /* 加一层淡蓝背景，选中更清晰 */
}
</style>