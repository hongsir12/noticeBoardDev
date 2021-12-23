<template>
  <div class="ace-container">
    <div class="toolbar">
      <vue-xlsx-table @on-select-file="handleSelectedFile"
        ><el-button
          type="primary"
          icon="el-icon-upload"
          title="上传Excel"
        ></el-button
      ></vue-xlsx-table>
      <el-button-group>
        <el-button
          icon="el-icon-download"
          title="下载模板"
          @click="downloadTempXlsx"
        ></el-button>
        <el-button
          type="success"
          icon="el-icon-check"
          title="保存配置"
          @click="saveChartOption"
        ></el-button>
        <el-button
          type="info"
          icon="el-icon-refresh"
          title="重置Excel数据"
          @click="resetData"
        ></el-button>
        <el-button
          type="warning"
          icon="el-icon-document"
          title="历史配置"
          @click="optionListDialog"
        ></el-button>
        <el-button
          type="primary"
          icon="el-icon-video-play"
          title="运行"
          @click="buildChart"
        ></el-button>
        <el-button
          type="danger"
          icon="el-icon-circle-close"
          title="关闭"
          @click="closeEditor"
        ></el-button>
      </el-button-group>
    </div>
    <div class="ace-editor" ref="ace"></div>
  </div>
</template>
<script>
// import {export_json_to_excel} from "@/vendor/Export2Excel.js"
import ace from 'ace-builds'
// 在webpack环境中使用必须要导入
import 'ace-builds/webpack-resolver'
// 默认设置的主题
import 'ace-builds/src-noconflict/theme-monokai'
// 默认设置的语言模式
import 'ace-builds/src-noconflict/mode-javascript'
export default {
  data() {
    return {
      data: [], //图表数据源
      editorContent: '', //编辑器内容
      aceEditor: null,
      // 不导入webpack-resolver该模块路径会报错
      themePath: 'ace/theme/monokai',
      modePath: 'ace/mode/javascript',
    }
  },
  props: ['sendEditorProps'],
  mounted() {
    this.aceEditor = ace.edit(this.$refs.ace, {
      // 最大行数，超过会自动出现滚动条
      maxLines: 48,
      // 最小行数，还未到最大行数时，编辑器会自动伸缩大小
      minLines: 48,
      // 编辑器内字体大小
      fontSize: 14,
      // 默认设置的主体
      theme: this.themePath,
      // 默认设置的语言模式
      mode: this.modePath,
      // 制表符设置为4个空格大小
      tabSize: 4,
    })
    this.setDefaultChartOption()
  },
  watch: {
    sendEditorProps: {
      deep: true,
      handler(val) {
        this.setEditorContent(val.aceEditorScript)
      },
    },
  },
  methods: {
    // 设置图表默认配置显示到编辑器中
    async setDefaultChartOption() {
      let params = {
        report_type: '全部已保存图表配置',
        conditions: [{ chartName: this.sendEditorProps.chartOptionName }],
      }
      let { data } = await this.$request('apiQuery', params, 'post')
      let chartData = data.list
      for (let rec of chartData) {
        rec = JSON.parse(rec.report_data)
        if (rec.optionName === '默认配置') {
          this.aceEditor.setValue(rec.content, 1)
        }
      }
    },
    // 点击上传按钮获取excel表数据
    handleSelectedFile(convertedData) {
      this.data = convertedData.body
    },
    // 点击下载模板按钮
    async downloadTempXlsx() {
      // const {export_json_to_excel} = require("@/vendor/Export2Excel.js")
      let currentRoutePath = this.$route.path.split('/')[1]
      if (currentRoutePath == 'fd') {
        let queryParams = {
          report_type: '故障分布数据',
        }
        let {data} = await this.$request('apiQuery', queryParams, 'post')
        data = data.list;
        let arr = []
        for(let rec of data) {
          rec = JSON.parse(rec.report_data)
          arr.push(rec)
        }
        const tHeader = ["故障日期","故障类型","存储"]
        const filterVal = ["date","defaultType","device"]
        // const xlsxData = 
        // export_json_to_excel(tHeader, arr)
        
      }
  
      
    },
    // 点击保存按钮保存当前配置
    saveChartOption() {
      let that = this
      // 获取编辑器内容
      let newEditorContent = this.aceEditor.getValue()
      // 将新的编辑器内容保存到editorContent
      this.editorContent = newEditorContent
      this.$messageBox
        .prompt('', '配置名称', {
          confirmButtonText: '确定',
          cancelButtonText: '取消',
        })
        .then(async ({ value }) => {
          if (!value) {
            this.$message({
              message: '配置名不能为空',
              type: 'error',
            })
          } else {
            //先判断配置名是否存在
            let queryParams = {
              report_type: '全部已保存图表配置',
              conditions: [
                {
                  chartName: this.sendEditorProps.chartOptionName,
                  optionName: value,
                },
              ],
            }
            let data = await this.$request('apiQuery', queryParams, 'post')
            //code为5000，没有该配置名，直接添加
            if (data.code == 5000) {
              // 将保存的配置名和代码传给图表组件
              // this.$bus.$emit('saveOption',[value,currentOption]);
              let params = {
                report_type: '全部已保存图表配置',
                report_data: {
                  chartName: this.sendEditorProps.chartOptionName,
                  optionName: value,
                  content: newEditorContent,
                },
                report_time: new Date().format('yyyy-MM-dd hh:mm:ss'),
              }
              await this.$request('apiInsert', params, 'post')
              this.$emit(
                'getChartOptionName',
                this.sendEditorProps.chartOptionName
              )
              this.$message({
                message: '保存成功',
                type: 'success',
              })
            } else {
              //否则说明配置名存在，提示是否覆盖配置
              this.$messageBox
                .confirm(`配置"${value}"已存在, 是否覆盖?`, '提示', {
                  confirmButtonText: '确定',
                  cancelButtonText: '取消',
                  type: 'warning',
                })
                .then(async () => {
                  let updateParams = {
                    report_id: data.data.list[0].report_id,
                    report_data: { content: newEditorContent },
                  }
                  let res = await this.$request(
                    'apiUpdate',
                    updateParams,
                    'post'
                  )
                  this.$emit(
                    'getChartOptionName',
                    this.sendEditorProps.chartOptionName
                  )
                  if (res.code == 2000) {
                    this.$message({
                      type: 'success',
                      message: '覆盖成功!',
                    })
                  } else {
                    console.log(res)
                    this.$message({
                      type: 'info',
                      message: '覆盖失败',
                    })
                  }
                })
                .catch(err => {
                  // console.log(err)
                  this.$message({
                    type: 'info',
                    message: '已取消操作',
                  })
                })
            }
          }
        })
        .catch(() => {
          this.$message({
            message: '已取消',
            type: 'info',
          })
        })
    },
    // 点击历史配置按钮显示历史配置弹框
    optionListDialog() {
      // 向父组件传递弹框显示状态
      this.$emit('dialogVisible', true)
    },
    // 点击重置数据按钮
    resetData() {
      this.data = []
    },
    // 点击运行按钮
    buildChart() {
      // 先获取编辑器内容
      let newEditorContent = this.aceEditor.getValue()
      // 获取excel数据源
      let data = this.data
      let currentRoutePath = this.$route.path.split('/')[1]
      if (data.length <= 0) {
        this.$message({
          message: '无新增数据',
          type: 'warning',
        })
      } else {
        if (currentRoutePath == 'fd') {
          data.forEach((item, index) => {
            data[index] = {
              date: item['故障日期'],
              defaultType: item['故障类型'],
              device: item['存储'],
            }
          })
          this.insertData(data, '故障分布数据')
        }
      }

      // 传给父组件新的编辑器内容和数据源
      this.$emit('sendEditorContent', { newEditorContent, data })
    },
    // 设置编辑器内容
    setEditorContent(content) {
      this.aceEditor.setValue(content, 1)
    },
    //   关闭编辑器
    closeEditor() {
      this.$messageBox
        .confirm('确定关闭编辑器?', '提示', {
          confirmButtonText: '确定',
          cancelButtonText: '取消',
          type: 'warning',
        })
        .then(() => {
          this.$emit('aceClose', false)
        })
        .catch(() => {
          this.$message({
            type: 'info',
            message: '已取消',
          })
        })
    },
    // 插入excel表格中的新增数据
    async insertData(xlsxData, report_type) {
      try {
        let queryParams = {
          report_type: report_type,
        }
        let data = await this.$request('apiQuery', queryParams, 'post')
        let tableData = [] //存放查询到的全部数据
        if (data.code == 2000) {
          for (let rec of data.data.list) {
            let id = rec.report_id
            rec = JSON.parse(rec.report_data)
            rec.id = id
            tableData.push(rec)
          }
          for (let xlsxRec of xlsxData) {
            xlsxRec.date = this.$moment(xlsxRec.date).format('YYYY-MM-DD')
          }
          // 存放新增的数据
          let newDataArr = xlsxData.filter(
            item =>
              !tableData.some(
                ele =>
                  ele.date === item.date &&
                  ele.device === item.device &&
                  ele.defaultType === item.defaultType
              )
          )
          let addArr = []
          for (let rec of newDataArr) {
            let obj = {
              report_type: '故障分布数据',
              report_data: rec,
              report_time: rec.date,
            }
            rec = obj
            addArr.push(rec)
          }
          let insertParams = {
            data: addArr,
          }
          let res = await this.$request('apiInsert', insertParams, 'post')
          if (res.code == 2000) {
            this.$message({
              message: '新增数据成功',
              type: 'success',
            })
          }else{
            this.$message({
              message: '无新增数据',
              type: 'info',
            })
          }
        }
      } catch (error) {
        console.log(error)
      }
    },
  },
}
</script>
<style lang="less" scoped>
.ace-container {
  display: flex;
  flex-direction: column;
  width: 100%;
  height: 100%;
  overflow: hidden;
  .toolbar {
    display: flex;
    justify-content: end;
    background-color: #f3f5f7;
  }
}
/deep/ .xlsx-button {
  border: 0px solid hsl(206, 100%, 56%);
  padding: 0;
  border-radius: 0;
}
</style>
