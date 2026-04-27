<script setup>
import { ref, onMounted } from "vue";
import request from "../../utils/request";
import CreateDocumentDialog from "../../components/CreateDocumentDialog.vue";

const poHtmlCode = ref("");

// 生成文档
const showCreateDialog = ref(false);
// 生成文档提交loading
const createDocSubmitting = ref(false);

function openFile() {
  // 发起GET请求到后端Controller的路由
  return request({
    url: "/BeforeAndAfterSave/Word",
    method: "get",
  });
}

function Save() {
  //在这里写您保存前的代码
  // alert("文件要开始保存了.....");
  pageofficectrl.SaveFilePage = "/BeforeAndAfterSave/save";
  pageofficectrl.WebSave();
  //在这里写您保存后的代码，比如判断保存结果pageofficectrl.CustomSaveResult
  if ("ok" == pageofficectrl.CustomSaveResult) {
    alert("文件保存成功了");
  } else {
    alert("保存失败！");
  }
}

function OnPageOfficeCtrlInit() {
  // PageOffice的初始化事件回调函数，您可以在这里添加自定义按钮
  pageofficectrl.Caption = "文档管理系统";

  pageofficectrl.AddCustomToolButton("保存", "Save", 1);
}

function AfterDocumentOpened() {
  // 文档打开后的逻辑
}

const changeDocument = () => {
  pageofficectrl.Enabled = false;
  showCreateDialog.value = true;
};

const handleSubmitDocument = () => {};

onMounted(() => {
  openFile().then((response) => {
    poHtmlCode.value = response;
  });

  //将需要回调的函数挂载到PageOffice控件，例如控件触发的事件、自定义按钮触发的函数。
  window.POPageMounted = { OnPageOfficeCtrlInit, Save, AfterDocumentOpened }; //其中OnPageOfficeCtrlInit必须
});
</script>

<template>
  <div class="Word">
    <div class="change-button">
      <el-button type="primary" @click="changeDocument">更新文档</el-button>
    </div>
    <!-- 此div用来加载PageOffice客户端控件，其中div的高宽及位置就决定了控件的大小及位置 -->
    <div
      style="margin-top: 16px; width: 100%; height: calc(100vh - 70px)"
      v-html="poHtmlCode"
    ></div>
    <!-- 生成文档弹窗 -->
    <CreateDocumentDialog
      v-model:visible="showCreateDialog"
      v-model:submitting="createDocSubmitting"
      type="search"
      @submit="handleSubmitDocument"
    />
  </div>
</template>

<style scoped>
.change-button {
  display: flex;
  margin: 16px;
  justify-content: end;
}
</style>
