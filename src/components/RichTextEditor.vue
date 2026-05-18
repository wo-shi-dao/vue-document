<template>
  <div class="rich-text-editor-wrapper" :class="{ 'is-readonly': readonly, 'is-fullscreen': isFullscreen }">
    <!-- 工具栏 -->
    <div v-if="!readonly" class="toolbar-container" ref="toolbarContainer">
      <Toolbar
        :editor="editorInstance"
        :defaultConfig="toolbarConfig"
        mode="default"
      />
    </div>
    
    <!-- 编辑器区域 -->
    <div class="editor-container" :class="{ 'readonly-mode': readonly }" ref="editorContainerRef">
      <Editor
        v-model="valueHtml"
        :defaultConfig="editorConfig"
        :mode="readonly ? 'simple' : 'default'"
        @onCreated="handleCreated"
        @onChange="handleChange"
      />
    </div>
  </div>
</template>

<script setup>
import { ref, shallowRef, watch, onBeforeUnmount, computed, nextTick, onMounted } from 'vue'
import { Editor, Toolbar } from '@wangeditor/editor-for-vue'
import '@wangeditor/editor/dist/css/style.css'
import katex from 'katex'
import 'katex/dist/katex.min.css'

const props = defineProps({
  modelValue: { type: String, default: '' },
  content: { type: String, default: '' },
  readonly: { type: Boolean, default: false },
  placeholder: { type: String, default: '请输入内容...' },
  height: { type: String, default: '300px' },
  showToolbar: { type: Boolean, default: true },
  maxHeight: { type: String, default: '600px' }
})

const emit = defineEmits(['update:modelValue', 'update:content', 'change', 'ready'])

const innerValue = computed(() => props.modelValue || props.content)
const valueHtml = ref(innerValue.value || '<p><br></p>')

const editorInstance = shallowRef(null)
const isFullscreen = ref(false)
const toolbarContainer = ref(null)
const editorContainerRef = ref(null)

// 渲染LaTeX数学公式
const renderLatex = (container) => {
  if (!container) return
  
  const editorContent = container.querySelector('.w-e-text-container') || container
  
  const processHtml = (html) => {
    if (!html || typeof html !== 'string') return html
    
    let result = html
    
    if (!result.includes('$$') && !result.includes('\\[') && 
        !result.includes('$') && !result.includes('\\(')) {
      return result
    }
    
    // 处理块级公式 $$...$$
    result = result.replace(/\$\$([\s\S]+?)\$\$/g, (match, formula) => {
      console.log('Found block formula:', formula)
      try {
        const rendered = katex.renderToString(formula.trim(), { 
          displayMode: true, 
          throwOnError: false,
          errorColor: '#cc0000'
        })
        console.log('Rendered formula:', rendered)
        return `<div class="katex-block">${rendered}</div>`
      } catch (e) {
        console.error('KaTeX block formula error:', e)
        return `<div class="katex-error" title="${e.message}">${match}</div>`
      }
    })
    
    // 处理块级公式 \[...\]
    result = result.replace(/\\\[([\s\S]+?)\\\]/g, (match, formula) => {
      try {
        const rendered = katex.renderToString(formula.trim(), { 
          displayMode: true, 
          throwOnError: false,
          errorColor: '#cc0000'
        })
        return `<div class="katex-block">${rendered}</div>`
      } catch (e) {
        console.error('KaTeX block formula error:', e)
        return `<div class="katex-error" title="${e.message}">${match}</div>`
      }
    })
    
    // 处理行内公式 $...$
    result = result.replace(/(?<!\$)\$(?!\$)([^\$\n]+?)\$(?!\$)/g, (match, formula) => {
      try {
        const rendered = katex.renderToString(formula.trim(), { 
          displayMode: false, 
          throwOnError: false,
          errorColor: '#cc0000'
        })
        return `<span class="katex-inline">${rendered}</span>`
      } catch (e) {
        console.error('KaTeX inline formula error:', e)
        return `<span class="katex-error" title="${e.message}">${match}</span>`
      }
    })
    
    // 处理行内公式 \(...\)
    result = result.replace(/\\\(([^)]+?)\\\)/g, (match, formula) => {
      try {
        const rendered = katex.renderToString(formula.trim(), { 
          displayMode: false, 
          throwOnError: false,
          errorColor: '#cc0000'
        })
        return `<span class="katex-inline">${rendered}</span>`
      } catch (e) {
        console.error('KaTeX inline formula error:', e)
        return `<span class="katex-error" title="${e.message}">${match}</span>`
      }
    })
    
    return result
  }
  
  const elements = editorContent.querySelectorAll('p, div, span, li, td, th, h1, h2, h3, h4, h5, h6')
  
  console.log('Found elements for formula rendering:', elements.length)
  
  elements.forEach(el => {
    if (el.classList.contains('katex-block') || 
        el.classList.contains('katex-inline') ||
        el.classList.contains('katex') ||
        el.classList.contains('katex-element') ||
        el.tagName === 'CODE' ||
        el.tagName === 'PRE') {
      return
    }
    
    const html = el.innerHTML
    if (html && typeof html === 'string') {
      const hasFormula = html.includes('$$') || html.includes('\\[') || 
                        (html.includes('$') && !html.includes('data:image')) || 
                        html.includes('\\(')
      
      if (hasFormula) {
        const processed = processHtml(html)
        if (processed !== html) {
          el.innerHTML = processed
        }
      }
    }
  })
}

const toolbarConfig = {
  excludeKeys: [
    'group-video',
    'fullScreen'
  ]
}

const editorConfig = computed(() => ({
  placeholder: props.placeholder,
  readOnly: props.readonly,
  MENU_CONF: {
    uploadImage: {
      customUpload: async (file, insertFn) => {
        const reader = new FileReader()
        reader.onload = () => {
          insertFn(reader.result, file.name, '')
        }
        reader.readAsDataURL(file)
      },
      maxFileSize: 5 * 1024 * 1024,
      allowedFileTypes: ['image/*']
    },
    codeSelectLang: {
      codeLangs: [
        { text: 'CSS', value: 'css' },
        { text: 'HTML', value: 'html' },
        { text: 'XML', value: 'xml' },
        { text: 'JavaScript', value: 'javascript' },
        { text: 'TypeScript', value: 'typescript' },
        { text: 'Java', value: 'java' },
        { text: 'Python', value: 'python' },
        { text: 'C', value: 'c' },
        { text: 'C++', value: 'cpp' },
        { text: 'C#', value: 'csharp' },
        { text: 'PHP', value: 'php' },
        { text: 'Go', value: 'go' },
        { text: 'Shell', value: 'shell' },
        { text: 'SQL', value: 'sql' },
        { text: 'JSON', value: 'json' }
      ]
    }
  }
}))

const handleCreated = (editor) => {
  editorInstance.value = editor
  emit('ready', editor)
  nextTick(() => {
    renderLatex(editorContainerRef.value)
  })
}

const handleChange = (editor) => {
  const html = editor.getHtml()
  emit('update:modelValue', html)
  emit('update:content', html)
  emit('change', html)
  nextTick(() => {
    renderLatex(editorContainerRef.value)
  })
}

watch(innerValue, (newVal) => {
  if (newVal !== undefined && newVal !== valueHtml.value) {
    valueHtml.value = newVal || '<p><br></p>'
    nextTick(() => {
      renderLatex(editorContainerRef.value)
    })
  }
})

watch(() => props.readonly, (newVal) => {
  if (editorInstance.value) {
    editorInstance.value.enable(!newVal)
  }
  nextTick(() => {
    renderLatex(editorContainerRef.value)
  })
})

onMounted(() => {
  nextTick(() => {
    renderLatex(editorContainerRef.value)
  })
})

onBeforeUnmount(() => {
  if (editorInstance.value) {
    editorInstance.value.destroy()
    editorInstance.value = null
  }
})
</script>

<style scoped>
.rich-text-editor-wrapper {
  width: 100%;
  border: 1px solid #dcdfe6 !important;
  border-radius: 4px;
  overflow: hidden;
  transition: all 0.3s ease;
  position: relative;
  background: #fff;
}

.rich-text-editor-wrapper.is-fullscreen {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  z-index: 9999;
  border: none;
  border-radius: 0;
}

.toolbar-container {
  border-bottom: 1px solid #e8e8e8;
  background: #fff;
}

.editor-container {
  min-height: v-bind(height);
  max-height: v-bind(maxHeight);
  overflow-y: auto;
}

.editor-container.readonly-mode {
  min-height: auto;
  padding: 12px;
}

.is-readonly .editor-container {
  border: none;
}

:deep(.w-e-text-container) {
  background: #fff;
}

:deep(table) {
  border-collapse: collapse;
  width: 100%;
  margin: 10px 0;
}

:deep(table th),
:deep(table td) {
  border: 1px solid #ddd;
  padding: 8px 12px;
  text-align: left;
}

:deep(table th) {
  background-color: #f5f5f5;
  font-weight: bold;
}

:deep(ul),
:deep(ol) {
  padding-left: 24px;
  margin: 8px 0;
}

:deep(li) {
  margin: 4px 0;
  line-height: 1.6;
}

:deep(img) {
  max-width: 100%;
  height: auto;
  display: block;
  margin: 10px auto;
  border-radius: 4px;
  cursor: pointer;
}

:deep(pre) {
  background: #f5f5f5;
  border: 1px solid #e8e8e8;
  border-radius: 4px;
  padding: 12px;
  overflow-x: auto;
  margin: 10px 0;
}

:deep(code) {
  font-family: 'Consolas', 'Monaco', 'Courier New', monospace;
  font-size: 13px;
}

:deep(.w-e-text-container [data-w-e-type="formula"]) {
  display: inline-block;
  padding: 4px 8px;
  background: #f8f8f8;
  border-radius: 4px;
  font-family: 'Times New Roman', serif;
}

:deep(.katex-element) {
  display: contents;
}

:deep(.katex-block) {
  display: block;
  text-align: center;
  margin: 16px 0;
  padding: 12px;
  background: #f8f9fa;
  border-radius: 4px;
  overflow-x: auto;
}

:deep(.katex-inline) {
  display: inline;
}

:deep(.katex-error) {
  color: #d32f2f;
  background: #ffebee;
  padding: 2px 4px;
  border-radius: 2px;
  font-family: monospace;
  cursor: help;
}

:deep(blockquote) {
  border-left: 4px solid #ddd;
  padding-left: 16px;
  margin: 10px 0;
  color: #666;
  background: #f9f9f9;
  padding: 10px 16px;
  border-radius: 0 4px 4px 0;
}

:deep(a) {
  color: #409eff;
  text-decoration: none;
}

:deep(a:hover) {
  text-decoration: underline;
}

:deep(hr) {
  border: none;
  border-top: 1px solid #e8e8e8;
  margin: 16px 0;
}

:deep(h1),
:deep(h2),
:deep(h3),
:deep(h4),
:deep(h5),
:deep(h6) {
  margin: 16px 0 8px;
  font-weight: bold;
  color: #333;
}

:deep(h1) { font-size: 24px; }
:deep(h2) { font-size: 20px; }
:deep(h3) { font-size: 18px; }
:deep(h4) { font-size: 16px; }
:deep(h5) { font-size: 14px; }
:deep(h6) { font-size: 13px; }

:deep(p) {
  margin: 8px 0;
  line-height: 1.8;
}

:deep(.ql-align-center) {
  text-align: center;
}

:deep(.ql-align-right) {
  text-align: right;
}

:deep(.ql-align-justify) {
  text-align: justify;
}

:deep(.table-container) {
  /* border: none !important; */
  overflow-x: auto;
}

:deep(.quill-better-table-wrapper) {
  overflow-x: auto;
  margin: 10px 0;
}

:deep(.quill-better-table) {
  border-collapse: collapse;
  width: 100%;
}

:deep(.quill-better-table td),
:deep(.quill-better-table th) {
  border: 1px solid #ddd;
  padding: 8px;
  min-width: 50px;
}
</style>
