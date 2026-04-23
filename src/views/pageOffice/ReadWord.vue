<script setup>
import request from "../../utils/request";
import { ref, onMounted } from "vue";

const poHtmlCode = ref("");

function OnPageOfficeCtrlInit() {
  // PageOffice的初始化事件回调函数，您可以在这里添加自定义按钮
  pageofficectrl.CustomToolbar = false; //隐藏自定义工具栏
  pageofficectrl.OfficeToolbars = false; //隐藏Office工具栏
  pageofficectrl.Caption = "只读模式打开Word文档";
}

function openFile() {
  // 发起GET请求到后端Controller的路由
  return request({
    url: "/BeforeAndAfterSave/Word",
    method: "get",
  });
}

onMounted(() => {
  // 请求后端打开文件
  openFile().then((response) => {
    poHtmlCode.value = response;
  });
  //将需要回调的函数挂载到PageOffice控件，例如控件触发的事件、自定义按钮触发的函数。
  window.POPageMounted = { OnPageOfficeCtrlInit }; //其中OnPageOfficeCtrlInit必须
});
</script>

<template>
  <!-- 此div用来加载PageOffice客户端控件，其中div的高宽及位置就决定了控件的大小及位置 -->
  <div style="width: auto; height: 900px" v-html="poHtmlCode"></div>
</template>
