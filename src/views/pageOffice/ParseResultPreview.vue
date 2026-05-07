<template>
  <div class="container-wrap">
    <div class="header-bar">
      <span class="title">{{ open_params.file_name }}</span>


      <span class="button" v-if="open_params.showConfirmBtn == true">
        <el-button @click="doClose()">取消</el-button>
        <el-button type="primary" @click="handleConfirmClick">确认导入</el-button>
      </span>
    </div>

    <div class="layout-wrap">
      <!-- 左侧预览 -->
      <div class="left-doc" id="previewDiv">
        <div style="width:100%;height:100%" v-html="poHtmlCode"></div>
      </div>

      <div class="resize-handle" @mousedown="startDrag">
        <div class="drag-icon">
          <i></i>
          <i></i>
        </div>
        <div class="hover-tip">拖动调整分栏宽度</div>
      </div>

      <!-- 右侧区域 -->
      <div class="right-panel">
        <div v-if="!showDetail" class="panel-mul">
          <h3 style="margin:0 0 10px">需求条目</h3>
          <div style="display:flex;gap:10px;margin-bottom:10px">
            <span style="color:#A864C7;background:#f9f2ff;padding:0 4px;border-radius:3px">IR: {{ count.ir }}</span>
            <span style="color:#4D85FF;background:#f2f7ff;padding:0 4px;border-radius:3px">SR: {{ count.sr }}</span>
            <span style="color:#3CB371;background:#f2fff5;padding:0 4px;border-radius:3px">AR: {{ count.ar }}</span>
          </div>
          <el-input v-model="searchKey" placeholder="搜索需求" clearable class="search-input" />
        </div>

        <div class="panel-list" v-if="!showDetail" @scroll="handleListScroll">
          <div
            v-for="item in showList"
            :key="item.id"
            class="demand-item"
            @click="selectDemand(item)"
            :class="{ active: selectedDemand?.id === item.id }"
          >
            <div style="display:flex;align-items:center;gap:8px;margin-bottom:4px">
              <span v-if="item.type==='IR'" style="background:#f9f2ff;color:#A864C7;padding:0 4px;font-size:12px;border-radius:3px">{{ item.type }}</span>
              <span v-if="item.type==='SR'" style="background:#f2f7ff;color:#4D85FF;padding:0 4px;font-size:12px;border-radius:3px">{{ item.type }}</span>
              <span v-if="item.type==='AR'" style="background:#f2fff5;color:#3CB371;padding:0 4px;font-size:12px;border-radius:3px">{{ item.type }}</span>
              <span style="font-weight:bold">{{ item.code }}</span>
            </div>
            <div style="padding-left:30px">{{ item.name }}</div>
          </div>

          <div class="load-tip" v-if="loading && showList.length == 0">加载中...</div>
          <div class="load-tip" v-if="searchFinished && !loading && showList.length === 0">暂无匹配数据</div>
        </div>

        

        <!-- 展示详情 -->
        <div v-if="showDetail" class="detail-view">
          <div class="detail-header">
            <span class="detail-title">编号：{{ currentDetail?.code || '-' }}</span>
            <span class="back-btn" @click="showDetail = false">← 返回</span>
          </div>
          <div class="detail-body">
            <div class="detail-row"><label>名称：</label><span>{{ currentDetail?.name }}</span></div>
            <div class="detail-row"><label>来源：</label><span>{{ currentDetail?.source || '无' }}</span></div>
            <!-- <div class="detail-row"><label>内容：</label><div v-html="currentDetail?.description"></div></div> -->
            <div class="detail-row"><label>内容：</label>
              <!-- <div v-html="currentDetail?.description"></div> -->
              <!-- <d-md-render :content="currentDetail?.description" :md-rules="mdRules" base-url="https://test-base-url"></d-md-render> -->
              <d-md-render 
                :content="currentDetail?.description || ''" 
              ></d-md-render>
            </div>
            <div class="detail-row"><label>说明：</label><span>{{ currentDetail?.remark || '无' }}</span></div>
            <div class="detail-row"><label>补充：</label><span>{{ currentDetail?.desc || '无' }}</span></div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted, onUnmounted, computed, watch} from 'vue'
import request from "../../utils/request";

// ======================
// 你原版 100% 好用的拖拽变量
// ======================
let isDragging = false
const poHtmlCode = ref('')
const open_params = ref({})
const showDetail = ref(false)
const currentDetail = ref({})
const selectedDemand = ref(null)
const searchKey = ref('')


const docId = ref('')

const demandList = ref([])

const mockDemandList = ref([
  { id: 1, code: 'IRD555A-AAA-DDD-NI.212', name: '硬线本级主断状态', type: 'IR', description: "<p>【需求背景】</p><p><br></p><p>【需求价值】</p><p><br></p><p>【需求详情】</p>" },
  { id: 2, code: 'IRD555A-AAA-DDD-NI.213', name: '硬线它单级主断状态', type: 'IR', 
    source: '需求规格书V2.1',
    desc: '实现硬线本级主断状态实时采集与展示，支持状态异常告警。实现硬线本级主断状态实时采集与展示，支持状态异常告警。实现硬线本级主断状态实时采集与展示，支持状态异常告警。实现硬线本级主断状态实时采集与展示，支持状态异常告警。实现硬线本级主断状态实时采集与展示，支持状态异常告警。实现硬线本级主断状态实时采集与展示，支持状态异常告警。实现硬线本级主断状态实时采集与展示，支持状态异常告警。实现硬线本级主断状态实时采集与展示，支持状态异常告警。实现硬线本级主断状态实时采集与展示，支持状态异常告警。实现硬线本级主断状态实时采集与展示，支持状态异常告警。实现硬线本级主断状态实时采集与展示，支持状态异常告警。实现硬线本级主断状态实时采集与展示，支持状态异常告警。实现硬线本级主断状态实时采集与展示，支持状态异常告警。实现硬线本级主断状态实时采集与展示，支持状态异常告警。实现硬线本级主断状态实时采集与展示，支持状态异常告警。实现硬线本级主断状态实时采集与展示，支持状态异常告警。实现硬线本级主断状态实时采集与展示，支持状态异常告警。',
    remark: '需联调硬件接口，其他说明给给了，还嘻嘻嘻嘻嘻嘻嘻嘻嘻，对讲机家具哈哈哈哈哈哈',
    // description: "<p>【需求背景】</p><p>对对对等等等</p><p>【需求价值】</p><p>A</p><p>【需求详情】</p><p><br></p><p>上述需求对应的真值表如下：</p><p class='ql-align-center'><br></p><div class='quill-better-table-wrapper'><table class='quill-better-table' contenteditable='false' border='1' style='width: 300px;'><colgroup><col width='124' class='ql-align-center'><col width='105' class='ql-align-center'><col width='97' class='ql-align-center'></colgroup><tbody><tr id='focb'><td id='focb_gynu' rowspan='1' colspan='1'><div id='focb_gynu_1_1' class='ql-align-center'>CCU分主断求助</div></td><td id='focb_oxh0' rowspan='1' colspan='1'><div id='focb_oxh0_1_1' class='ql-align-center'>主断禁止环线</div></td><td id='focb_j8r3' rowspan='1' colspan='1'><div id='focb_j8r3_1_1' class='ql-align-center'>主断使能</div></td></tr><tr id='iqva'><td id='iqva_drwe' rowspan='1' colspan='1'><div id='iqva_drwe_1_1' class='ql-align-center'>0</div></td><td id='iqva_sq5n' rowspan='1' colspan='1'><div id='iqva_sq5n_1_1' class='ql-align-center'>无影响</div></td><td id='iqva_ysdj' rowspan='1' colspan='1'><div id='iqva_ysdj_1_1' class='ql-align-center'>无影响</div></td></tr><tr id='u8fi'><td id='u8fi_cbr5' rowspan='1' colspan='1'><div id='u8fi_cbr5_1_1' class='ql-align-center'>1</div></td><td id='u8fi_v7e8' rowspan='1' colspan='1'><div id='u8fi_v7e8_1_1' class='ql-align-center'>0</div></td><td id='u8fi_hltu' rowspan='1' colspan='1'><div id='u8fi_hltu_1_1' class='ql-align-center'>0x55</div></td></tr></tbody></table></div><p class='ql-align-center'><br></p><p><br></p>" 
    description: "<p>【需求背景】</p><p>对对对等等等</p><p>【需求价值】</p><p>A</p><p>【需求详情】</p><p><br></p><p>上述需求对应的真值表如下：</p><p class='ql-align-center'><br></p><div class='quill-better-table-wrapper'><table class='quill-better-table' contenteditable='false' border='1' style='width: 500px;'><colgroup><col width='124'><col width='105'><col width='97'><col width='100'><col width='100'></colgroup><tbody><tr id='focb'><td id='focb_wpbs' rowspan='1' colspan='1'><div id='focb_wpbs_1_1' class='ql-align-center'>CCU分主断求助</div></td><td id='focb_h7ex' rowspan='1' colspan='1'><div id='focb_h7ex_1_1' class='ql-align-center'>主断禁止环线</div></td><td id='focb_fl7q' rowspan='1' colspan='1' class=''><div id='focb_fl7q_1_1' class='ql-align-center'>主断使能</div></td><td id='focb_ffkm' rowspan='1' colspan='1' class=''><div id='focb_ffkm_1_1'>说明</div></td><td id='focb_f8qy' rowspan='1' colspan='1' class=''><div id='focb_f8qy_1_1'>描述</div></td></tr><tr id='iqva'><td id='iqva_yx5n' rowspan='1' colspan='1'><div id='iqva_yx5n_1_1' class='ql-align-center'>0</div></td><td id='iqva_vjpz' rowspan='1' colspan='1'><div id='iqva_vjpz_1_1' class='ql-align-center'>无影响</div></td><td id='iqva_lijj' rowspan='1' colspan='1'><div id='iqva_lijj_1_1' class='ql-align-center'>无影响</div></td><td id='iqva_pw92' rowspan='1' colspan='1' class=''><div id='iqva_pw92_1_1'>他对对对</div></td><td id='iqva_gz4r' rowspan='1' colspan='1' class=''><div id='iqva_gz4r_1_1'>额度伏尔泰灌灌灌灌灌</div></td></tr><tr id='u8fi'><td id='u8fi_yyxk' rowspan='1' colspan='1'><div id='u8fi_yyxk_1_1' class='ql-align-center'>1</div></td><td id='u8fi_vub4' rowspan='1' colspan='1'><div id='u8fi_vub4_1_1' class='ql-align-center'>0</div></td><td id='u8fi_nqis' rowspan='1' colspan='1'><div id='u8fi_nqis_1_1' class='ql-align-center'>0x55</div></td><td id='u8fi_e0ha' rowspan='1' colspan='1' class=''><div id='u8fi_e0ha_1_1'>额打的费呃呃呃</div></td><td id='u8fi_k3kt' rowspan='1' colspan='1'  ><div id='u8fi_k3kt_1_1'>大发生的是的发生阿斯蒂芬阿斯蒂芬撒旦法</div></td></tr></tbody></table></div><p class='ql-align-center'><br></p>"
  },
  { id: 3, code: 'IRD555A-AAA-DDD-NI.214', name: '硬线单的级主断状态的点点滴滴ddd的点点滴滴', type: 'IR',
    source: '客户反馈个法人丰富的大多数是sssssssssssss顶顶顶顶地方大卫杜夫灌灌灌灌灌滴滴答答哒哒哒哒哒哒',
    desc: '跨设备状态同步',
    remark: '优先级：高',
    description: "<p>【需求背景】</p><p>实时监控硬线本级主断状态</p><p><br></p><p>【需求价值】</p><p><br></p><p>【需求详情】</p><p>支持状态采集、异常上报、日志记录</p>" },
  { id: 31, code: 'IRD555A-AAA-DDD-NI.2101', name: '硬线单的级主断状态', type: 'IR',
    source: '客户反馈',
    desc: '跨设备状态同步',
    remark: '优先级：高',
    description: '<p>【需求背景】</p><p>dddddddddddddddddddddddddddddddddddddddddddddddddddddddddddddddddddddddddddddddddddddddddddddddddddddddddddddddddddddddddddddddddddddddddddddddddddddddddddddddddddddddddddddddddddddddddddddddddddddddddddddd</p><p>【需求价值】</p><p><br></p><div class="quill-better-table-wrapper"><table class="quill-better-table" contenteditable="false" border="1" style="width: 1200px;"><colgroup><col width="65"><col width="65"><col width="65"><col width="65"><col width="65"><col width="65"><col width="65"><col width="65"><col width="65"><col width="65"><col width="65"><col width="65"></colgroup><tbody><tr id="w375"><td id="w375_cygh" rowspan="1" colspan="1"><div id="w375_cygh_1_1"><span style="color: black;">dd</span></div></td><td id="w375_crra" rowspan="1" colspan="1"><div id="w375_crra_1_1"><span style="color: black;">dd</span></div></td><td id="w375_esag" rowspan="1" colspan="1"><div id="w375_esag_1_1"><span style="color: black;">dd</span></div></td><td id="w375_sshq" rowspan="1" colspan="1"><div id="w375_sshq_1_1"><span style="color: black;">d</span></div></td><td id="w375_v7hk" rowspan="1" colspan="1"><div id="w375_v7hk_1_1"><span style="color: black;">d</span></div></td><td id="w375_vm0t" rowspan="1" colspan="1"><div id="w375_vm0t_1_1"><span style="color: black;">d</span></div></td><td id="w375_gybu" rowspan="1" colspan="1"><div id="w375_gybu_1_1"><span style="color: black;">d</span></div></td><td id="w375_dndx" rowspan="1" colspan="1"><div id="w375_dndx_1_1"><span style="color: black;">fd</span></div></td><td id="w375_emue" rowspan="1" colspan="1"><div id="w375_emue_1_1"><span style="color: black;">sdf</span></div></td><td id="w375_ezao" rowspan="1" colspan="1"><div id="w375_ezao_1_1"><span style="color: black;">df</span></div></td><td id="w375_c786" rowspan="1" colspan="1"><div id="w375_c786_1_1"><span style="color: black;">dddf</span></div></td><td id="w375_jlj5" rowspan="1" colspan="1"><div id="w375_jlj5_1_1"><span style="color: black;">df</span></div></td></tr><tr id="u3w6"><td id="u3w6_hrdt" rowspan="1" colspan="1"><div id="u3w6_hrdt_1_1"><br></div></td><td id="u3w6_p0ek" rowspan="1" colspan="1"><div id="u3w6_p0ek_1_1"><br></div></td><td id="u3w6_p48m" rowspan="1" colspan="1"><div id="u3w6_p48m_1_1"><br></div></td><td id="u3w6_vgzo" rowspan="1" colspan="1"><div id="u3w6_vgzo_1_1"><br></div></td><td id="u3w6_f875" rowspan="1" colspan="1"><div id="u3w6_f875_1_1"><span style="color: black;">d</span></div></td><td id="u3w6_f5a4" rowspan="1" colspan="1"><div id="u3w6_f5a4_1_1"><br></div></td><td id="u3w6_fmxr" rowspan="1" colspan="1"><div id="u3w6_fmxr_1_1"><span style="color: black;">d</span></div></td><td id="u3w6_it2u" rowspan="1" colspan="1"><div id="u3w6_it2u_1_1"><br></div></td><td id="u3w6_qp64" rowspan="1" colspan="1"><div id="u3w6_qp64_1_1"><br></div></td><td id="u3w6_jds2" rowspan="1" colspan="1"><div id="u3w6_jds2_1_1"><br></div></td><td id="u3w6_j0si" rowspan="1" colspan="1"><div id="u3w6_j0si_1_1"><br></div></td><td id="u3w6_raoc" rowspan="1" colspan="1"><div id="u3w6_raoc_1_1"><br></div></td></tr><tr id="bp60"><td id="bp60_w0xb" rowspan="1" colspan="1"><div id="bp60_w0xb_1_1"><span style="color: black;">d</span></div></td><td id="bp60_yko3" rowspan="1" colspan="1"><div id="bp60_yko3_1_1"><br></div></td><td id="bp60_tvec" rowspan="1" colspan="1"><div id="bp60_tvec_1_1"><br></div></td><td id="bp60_rq12" rowspan="1" colspan="1"><div id="bp60_rq12_1_1"><br></div></td><td id="bp60_ow6p" rowspan="1" colspan="1"><div id="bp60_ow6p_1_1"><br></div></td><td id="bp60_jv3a" rowspan="1" colspan="1"><div id="bp60_jv3a_1_1"><br></div></td><td id="bp60_r522" rowspan="1" colspan="1"><div id="bp60_r522_1_1"><br></div></td><td id="bp60_e21h" rowspan="1" colspan="1"><div id="bp60_e21h_1_1"><br></div></td><td id="bp60_kebl" rowspan="1" colspan="1"><div id="bp60_kebl_1_1"><br></div></td><td id="bp60_irmn" rowspan="1" colspan="1"><div id="bp60_irmn_1_1"><br></div></td><td id="bp60_vdh8" rowspan="1" colspan="1"><div id="bp60_vdh8_1_1"><br></div></td><td id="bp60_pwbh" rowspan="1" colspan="1"><div id="bp60_pwbh_1_1"><br></div></td></tr></tbody></table></div><p><img src="/api/ipdproject/openapi/v1/projects/12484f8c5e884447b12c9b31f1f2b291/imgs/c8b4e0ab9ff0469cbcdda3edef4b021a.png" image-id="img0" devui-editorx-image="true" style="vertical-align: baseline;"></p><p>【需求详情】</p><p><br></p><p>CPU应用软件根据硬线接口地址，读取单元级主断反馈采用常开触点，生成“单XX状态”，主断闭合时，该信号为高电平，主断断开时，该信号为低电平。</p><p>上述需求对应的真值表如下：</p><div class="quill-better-table-wrapper"><table class="quill-better-table" contenteditable="false" border="1" style="width: 300px;"><colgroup><col width="155"><col width="131"><col width="120"></colgroup><tbody><tr id="sxn7"><td id="sxn7_lk21" rowspan="1" colspan="1"><div id="sxn7_lk21_1_1" class="ql-align-center">CCU分主断求助</div></td><td id="sxn7_h5qt" rowspan="1" colspan="1"><div id="sxn7_h5qt_1_1" class="ql-align-center">主断禁止环线</div></td><td id="sxn7_p7rm" rowspan="1" colspan="1"><div id="sxn7_p7rm_1_1" class="ql-align-center">主断使能</div></td></tr><tr id="u595"><td id="u595_r3pf" rowspan="1" colspan="1"><div id="u595_r3pf_1_1" class="ql-align-center">0</div></td><td id="u595_czj2" rowspan="1" colspan="1"><div id="u595_czj2_1_1" class="ql-align-center">无影响</div></td><td id="u595_scvs" rowspan="1" colspan="1"><div id="u595_scvs_1_1" class="ql-align-center">无影响</div></td></tr><tr id="dz8r"><td id="dz8r_nd36" rowspan="1" colspan="1"><div id="dz8r_nd36_1_1" class="ql-align-center">1</div></td><td id="dz8r_isvn" rowspan="1" colspan="1"><div id="dz8r_isvn_1_1" class="ql-align-center">0</div></td><td id="dz8r_s50e" rowspan="1" colspan="1"><div id="dz8r_s50e_1_1" class="ql-align-center">0x55</div></td></tr></tbody></table></div><p class="ql-align-center"><br></p>' },
  { id: 32, code: 'IRD555A-AAA-DDD-NI.2102', name: '硬线单的级主断状态', type: 'IR',
    source: '客户反馈',
    desc: '跨设备状态同步',
    remark: '优先级：高',
    description: "<p>【需求背景】</p><p>实时监控硬线本级主断状态</p><p><br></p><p>【需求价值】</p><p><br></p><p>【需求详情】</p><p>支持状态采集、异常上报、日志记录</p>" },
  { id: 33, code: 'IRD555A-AAA-DDD-NI.2103', name: '硬线单的级主断状态', type: 'IR',
    source: '客户反馈',
    desc: '跨设备状态同步',
    remark: '优先级：高',
    description: "<p>【需求背景】</p><p>实时监控硬线本级主断状态</p><p><br></p><p>【需求价值】</p><p><br></p><p>【需求详情】</p><p>支持状态采集、异常上报、日志记录</p>" },
  { id: 34, code: 'IRD555A-AAA-DDD-NI.2103', name: '硬线单的级主断状态', type: 'IR',
    source: '客户反馈',
    desc: '跨设备状态同步',
    remark: '优先级：高',
    description: "<p>【需求背景】</p><p>实时监控硬线本级主断状态</p><p><br></p><p>【需求价值】</p><p><br></p><p>【需求详情】</p><p>支持状态采集、异常上报、日志记录</p>" },
  { id: 35, code: 'IRD555A-AAA-DDD-NI.2104', name: '硬线单的级主断状态', type: 'IR',
    source: '客户反馈',
    desc: '跨设备状态同步',
    remark: '优先级：高',
    description: "<p>【需求背景】</p><p>实时监控硬线本级主断状态</p><p><br></p><p>【需求价值】</p><p><br></p><p>【需求详情】</p><p>支持状态采集、异常上报、日志记录</p>" },
  { id: 36, code: 'IRD555A-AAA-DDD-NI.2105', name: '硬线单的级主断状态', type: 'IR',
    source: '客户反馈',
    desc: '跨设备状态同步',
    remark: '优先级：高',
    description: "<p>【需求背景】</p><p>实时监控硬线本级主断状态</p><p><br></p><p>【需求价值】</p><p><br></p><p>【需求详情】</p><p>支持状态采集、异常上报、日志记录</p>" },
  { id: 37, code: 'IRD555A-AAA-DDD-NI.2106', name: '硬线单的级主断状态', type: 'IR',
    source: '客户反馈',
    desc: '跨设备状态同步',
    remark: '优先级：高',
    description: "<p>【需求背景】</p><p>实时监控硬线本级主断状态</p><p><br></p><p>【需求价值】</p><p><br></p><p>【需求详情】</p><p>支持状态采集、异常上报、日志记录</p>" },

])


// 分页全局配置
const pageSize = 20
const loading = ref(false)
const searchFinished = ref(false)

// 普通列表 分页状态
const normalList = ref([])
const normalPage = ref(1)
const normalHasMore = ref(true)

// 搜索列表 分页状态
const searchList = ref([])
const searchPage = ref(1)
const searchHasMore = ref(true)

let searchTimer = null

const showList = computed(() => {
  return searchKey.value.trim() ? searchList.value : normalList.value
})


const count = computed(() => ({
  ir: mockDemandList.value.filter(i => i.type === 'IR').length,
  sr: mockDemandList.value.filter(i => i.type === 'SR').length,
  ar: mockDemandList.value.filter(i => i.type === 'AR').length
}))

// 1. 普通列表分页
const getNormalPageData = async (page) => {
  // TODO 后续换成后端真实分页接口
  // const res = await request.get('/api/demand/list', { params: { page, pageSize } })
  // return res.data.records || []

  // mock 模拟分页
  const start = (page - 1) * pageSize
  const end = start + pageSize
  return mockDemandList.value.slice(start, end)
}

// 2. 搜索列表分页
const getSearchPageData = async (page, kw) => {
  // TODO 后续换成后端真实搜索分页接口
  // const res = await request.get('/api/demand/list', { params: { page, pageSize, keyword: kw } })
  // return res.data.records || []

  // mock 模拟搜索+分页
  const filterAll = mockDemandList.value.filter(i =>
    i.code.includes(kw) || i.name.includes(kw)
  )
  const start = (page - 1) * pageSize
  const end = start + pageSize
  return filterAll.slice(start, end)
}

// 加载普通列表第一页 / 加载更多
const loadNormalData = async () => {
  const items = await getNormalPageData(normalPage.value)
  if (items.length) {
    normalList.value.push(...items)
    normalPage.value++
  } else {
    normalHasMore.value = false
  }
}

// ==============================
// 加载搜索列表第一页 / 加载更多
// ==============================
const loadSearchData = async (page) => {
  const kw = searchKey.value.trim()
  const items = await getSearchPageData(page, kw)
  if (items.length) {
    searchList.value.push(...items)
    searchPage.value++
  } else {
    searchHasMore.value = false
  }
}

// 搜索防抖 逻辑不变
watch(searchKey, () => {
  if (searchTimer) clearTimeout(searchTimer)
  const kw = searchKey.value.trim()
  if (!kw) {
    resetToNormal()
    return
  }
  searchFinished.value = false

  searchList.value = []
  searchPage.value = 1
  searchHasMore.value = true
  loading.value = true
  searchTimer = setTimeout(() => {
    startSearch()
  }, 500)
})

const startSearch = async () => {
  // 搜索默认加载第一页
  await loadSearchData(1)
  loading.value = false
  searchFinished.value = true
}

// 滚动加载 适配分页
const handleListScroll = async (e) => {
  const el = e.target
  if (el.scrollTop + el.clientHeight >= el.scrollHeight - 100) {
    if (loading.value) return
    loading.value = true
    if (searchKey.value.trim()) {
      if (searchHasMore.value) await loadSearchData(searchPage.value)
    } else {
      if (normalHasMore.value) await loadNormalData()
    }
    loading.value = false
  }
}

// 重置
const resetToNormal = () => {
  normalList.value = []
  normalPage.value = 1
  normalHasMore.value = true
  searchList.value = []
  searchFinished.value = false
  loading.value = false;
  loadNormalData()
}

// 点击条目 右侧展示
const selectDemand = (item) => {
  selectedDemand.value = item
  currentDetail.value = item
  showDetail.value = true
  
  try {
    pageofficectrl.word.HomeKey(6);
  // pageofficectrl.word.FindNextText(item.code)
    if (pageofficectrl.word.FindNextText(item.code)) {
    } else {
    // alert("未搜索到位置。");
    }
  } catch (e) {
  }

}

const startDrag = (e) => {
  e.preventDefault()
  isDragging = true

  pageofficectrl.Enabled = false
}

const onMouseMove = (e) => {
  if (!isDragging) return
  if (e.buttons !== 1) {
    isDragging = false
    return
  }
  const previewDiv = document.getElementById('previewDiv')
  if (!previewDiv) return
  
  let newWidth = e.clientX
  if (newWidth < 400) newWidth = 400
  if (newWidth > window.innerWidth - 320) newWidth = window.innerWidth - 320
  
  previewDiv.style.width = newWidth + 'px'
  window.dispatchEvent(new Event('resize'))
}


const stopDrag = () => {
  isDragging = false;
  pageofficectrl.Enabled = true;
}

// ======================
// 原有功能不变
// ======================
const doClose = (params) => {
  window.CallParentFunc({
    funcName: 'onPageOfficeClosed', paramJson: params,
    success: () => pageofficectrl.CloseWindow(true),
    error: () => pageofficectrl.CloseWindow(true)
  })
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
  pageofficectrl.word.DocumentMap = true;
}


onMounted(async() => {
  window.addEventListener('mousemove', onMouseMove)
  window.addEventListener('mouseup', stopDrag)
  window.addEventListener('mouseleave', stopDrag)
  open_params.value = JSON.parse(pageofficectrl.WindowParams)
  openFile().then(res => poHtmlCode.value = res)
  
  docId.value = open_params.value.docId;

  // TODO 接口好了打开这个
  // await fetchDemandList()
  // TODO 删除
  // demandList.value = mockDemandList.value
  await loadNormalData()

  window.POPageMounted = { OnPageOfficeCtrlInit, AfterDocumentOpened }

  
})

onUnmounted(() => {
  clearTimeout(searchTimer)
  window.removeEventListener('mousemove', onMouseMove)
  window.removeEventListener('mouseup', stopDrag)
  window.removeEventListener('mouseleave', stopDrag)
})

function openFile() {
  // TODO 更换
  // open_params.value
  const params = {}
  return request({ url: '/CommentOnly/Word', method: 'get', params:  params})
}
</script>

<style scoped>
.container-wrap {
  width: 100%;
  height: 100vh;
  display: flex;
  flex-direction: column;
  overflow: hidden;
}
.header-bar {
  height: 48px;
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 0 16px;
  background: #fff;
  border-bottom: 1px solid #ebeef5;
  /* position: relative; */
}
.title { font-size: 15px; color: #333; }
.button { display: flex; gap: 8px; }

.resize-handle {
  width: 6px;
  height: 100%;
  background: transparent;
  cursor: col-resize;
  display: flex;
  align-items: center;
  justify-content: center;
  position: relative;
  z-index: 99;
  transition: background 0.2s;
}
.resize-handle:hover {
  background: #e4e7ed;
}
.drag-icon {
  display: flex;
  gap: 2px;
}
.drag-icon i {
  display: block;
  width: 2px;
  height: 40px;
  background: #c0c4cc;
  border-radius: 1px;
}
.resize-handle:hover .drag-icon i {
  background: #409eff;
}
.hover-tip {
  position: absolute;
  top: 50%;
  left: 12px;
  transform: translateY(-50%);
  background: rgba(0,0,0,0.7);
  color: #fff;
  font-size: 12px;
  padding: 3px 8px;
  border-radius: 4px;
  white-space: nowrap;
  opacity: 0;
  visibility: hidden;
  transition: 0.2s;
}
.resize-handle:hover .hover-tip {
  opacity: 1;
  visibility: visible;
}

.layout-wrap {
  flex: 1;
  display: flex;
  width: 100%;
  overflow: hidden;
  position: relative;
}
.left-doc {
  width: 75%;
  height: 100%;
  overflow: hidden;
}
.right-panel {
  flex: 1;
  height: 100%;
  background: #f5f5f5;
  padding: 0 10px;
  display: flex;
  flex-direction: column;
  overflow: hidden;
}
.panel-mul { height: 118px; padding-top: 10px; }
.panel-list { flex: 1; overflow-y: auto; }

.search-input {
  font-size: 13px; 
}
/* .search-input {
  width: 100%; padding: 5px 8px; box-sizing: border-box; margin-bottom: 12px;
  border: 1px solid #ddd; border-radius: 4px;
   font-size: 13px; 
   outline: none;
}
.search-input:focus { border-color: #409eff; } */

.demand-item {
  padding: 10px; margin-bottom: 8px; background: #fff; border-radius: 6px;
  cursor: pointer; border: 1px solid transparent; transition: all 0.2s ease; font-size: 14px;
}
.demand-item:hover { border-color: #e4e7ed; box-shadow: 0 1px 4px rgba(0, 0, 0, 0.05); }
.demand-item.active { border-color: #409eff; background: #f0f7ff; }

.detail-view { 
  flex: 1; 
  background: #fff; 
  border-radius: 6px; 
  margin: 10px 0;
  display: flex;
  flex-direction: column;
  overflow: hidden; 
}
.detail-header { 
  display: flex; 
  justify-content: space-between; 
  padding: 12px; 
  border-bottom: 1px solid #eee; 
  flex-shrink: 0;
}
.detail-title {
  font-weight: 600;
  font-size: 14px;
  /* color: #333; */
}
.back-btn { color: #409eff; cursor: pointer; }
.detail-body {flex: 1; padding: 16px; 
  overflow-y: auto;}
.detail-row { margin-bottom: 14px; 
}
.detail-row label { font-weight: bold; margin-right: 8px; color: #666; }

.load-tip {
  text-align: center;
  padding: 10px;
  color: #999;
  font-size: 13px;
}
</style>