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
      title="更新文档"
      @submit="handleSubmitDocument"
    />

    <!-- 进度条弹窗 -->
    <ProgressDialog
      v-model="showProgress"
      title="正在更新文档"
      description="请稍候，正在根据筛选条件更新文档..."
      progress-text="更新进度"
      :footer-text="progressFooterText"
      :percentage="progressPercentage"
      :status="progressStatus"
    />
  </div>
</template>

<script setup>
import { ref, watch, onMounted } from "vue";
import request from "../../utils/request";
import { ElMessage, ElMessageBox } from "element-plus";
import CreateDocumentDialog from "../../components/CreateDocumentDialog.vue";
import ProgressDialog from "../../components/ProgressDialog.vue";
import { generateDocument } from "../../api/document";

const poHtmlCode = ref("");

// 生成文档
const showCreateDialog = ref(false);
// 生成文档提交loading
const createDocSubmitting = ref(false);
// 进度条
const showProgress = ref(false);
const progressPercentage = ref(0);
const progressStatus = ref("");
const progressFooterText = ref("正在更新文档...");

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

const changeDocument = () => {
  pageofficectrl.Enabled = false;
  showCreateDialog.value = true;
};

const handleSubmitDocument = async () => {
  try {
    pageofficectrl.Enabled = false;
    showCreateDialog.value = false;
    showProgress.value = true;
    progressPercentage.value = 0;
    progressStatus.value = "";
    progressFooterText.value = "正在更新文档...";

    const result = await generateDocument({}, (progress) => {
      progressPercentage.value = progress;
    });

    if (result.success) {
      progressPercentage.value = 100;
      progressStatus.value = "success";
      progressFooterText.value = "更新完成";

      setTimeout(() => {
        showProgress.value = false;
        // pageofficectrl.word.SetTextToSelection(
        //   "11111哈哈哈哈哈哈哈哈哈哈哈哈哈",
        // );

        ElMessage.success("文档更新成功");
        pageofficectrl.Enabled = true;
        openFile().then((response) => {
          poHtmlCode.value = response;
          pageofficectrl.Reload(); // 必须：切换打开文件时必须调用 pageofficectrl.Reload()
        });
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

function AfterDocumentOpened() {
  pageofficectrl.word.DocumentMap = true; // true 表示显示文档结构图，false 表示隐藏
}

onMounted(() => {
  openFile().then((response) => {
    poHtmlCode.value = response;
  });

  //将需要回调的函数挂载到PageOffice控件，例如控件触发的事件、自定义按钮触发的函数。
  window.POPageMounted = { OnPageOfficeCtrlInit, Save, AfterDocumentOpened }; //其中OnPageOfficeCtrlInit必须
});
</script>

<style scoped>
.change-button {
  display: flex;
  margin: 16px;
  justify-content: end;
}
</style>
