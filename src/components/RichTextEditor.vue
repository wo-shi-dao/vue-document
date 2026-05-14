<template>
  <div class="rich-text-editor" >
    <Editor
      v-model="valueHtml"
      :defaultConfig="editorConfig"
      mode="default"
      @onCreated="handleCreated"
    />
  </div>
  <div></div>
  <br/>
  <div style="border: 1px solid #ccc;">
    <div>111</div>

    <div v-html="valueHtml"></div>
  </div>
</template>

<script setup>
import { ref, shallowRef, watch, onBeforeUnmount, computed } from 'vue'
import { Editor, Toolbar } from '@wangeditor/editor-for-vue'
import '@wangeditor/editor/dist/css/style.css'

const props = defineProps({
  modelValue: { type: String, default: '' },
  content: { type: String, default: '' }
})

const emit = defineEmits(['update:modelValue', 'update:content', 'change'])

const innerValue = computed(() => props.modelValue || props.content)
const valueHtml = ref(innerValue.value || '<p><br></p>')

const editorInstance = shallowRef(null)
const isFullscreen = ref(false)


// 编辑器配置
const editorConfig = {
  placeholder: '请输入描述...',
}

const handleCreated = (editor) => {
  editorInstance.value = editor
}

// 监听外部传入的值变化
watch(innerValue, (newVal) => {
  if (newVal !== undefined && newVal !== valueHtml.value) {
    valueHtml.value = newVal || '<p><br></p>'
  }
})

onBeforeUnmount(() => {
  if (editorInstance.value) {
    editorInstance.value.destroy()
    editorInstance.value = null
  }
})
</script>

<style scoped>
.rich-text-editor {
  width: 100%;
  border: 1px solid #dcdfe6;
  border-radius: 4px;
  overflow: hidden;
  transition: all 0.3s ease;
  position: relative;
}
:deep(.table-container) {
  border: none !important; 
}
</style>
