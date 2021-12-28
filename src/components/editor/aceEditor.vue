<template>
  <div class="ace-container">
    <div class="toolbar" @mousedown="toolbarDown" @mouseup="toolbarUp">
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
import { json2Excel } from '@/utils/json2Excel.js'
import { copyTransFunc } from '@/utils/formatDataKey.js'
import { getObjectDiff } from '@/utils/getObjectDiff.js'
import _ from 'lodash'
export default {
  data() {
    return {
      diskIOCurrentWeekData: [], // 磁盘IO当周数据
      data: [], //图表数据源
      editorContent: '', //编辑器内容
      aceEditor: null,
      // 不导入webpack-resolver该模块路径会报错
      themePath: 'ace/theme/monokai',
      modePath: 'ace/mode/javascript',
    }
  },
  props: ['sendEditorProps', 'currentWeek'],
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
    toolbarDown() {
      this.$emit('draggableEnabled', true)
    },
    toolbarUp() {
      this.$emit('draggableEnabled', false)
    },
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
      this.importExcel()
    },
    //导入excel数据,并转换属性名
    importExcel() {
      let currentRoutePath = this.$route.path.split('/')[1]
      if (this.data.length <= 0) {
        this.$message({
          message: '无新增数据',
          type: 'warning',
        })
      } else {
        if (currentRoutePath == 'fd') {
          this.data.forEach((item, index) => {
            this.data[index] = {
              date: item['故障日期'],
              defaultType: item['故障类型'],
              device: item['存储'],
            }
          })
          this.insertData(this.data, '故障分布数据')
        } else if (currentRoutePath == 'diskIO') {
          let keyMapping = [
            { key: '日期', value: 'date' },
            { key: '存储', value: 'device' },
            { key: '磁盘类型', value: 'diskType' },
            { key: '读取速度', value: 'readSpeed' },
            { key: '写入速度', value: 'writeSpeed' },
          ]
          // 更改excel数据属性名
          let excelData = copyTransFunc(this.data, keyMapping)
          this.insertData(excelData, '磁盘IO分布数据')
        } else if (currentRoutePath == 'SIU') {
          let keyMapping = [
            { key: '名称', value: 'interface' },
            { key: '低于50%使用率', value: 'lessThan50p' },
            { key: '使用率50%~80%', value: 'bet50pAnd80p' },
            { key: '使用率80%以上', value: 'moreThan80p' },
          ]
          // 更改excel数据属性名
          let excelData = copyTransFunc(this.data, keyMapping)
          this.insertData(excelData, '交换机接口使用率数据')
        }
      }
    },
    // 点击下载模板按钮
    async downloadTempXlsx() {
      let currentRoutePath = this.$route.path.split('/')[1]
      if (currentRoutePath == 'fd') {
        let queryParams = {
          report_type: '故障分布数据',
        }
        let data = await this.$request('apiQuery', queryParams, 'post')
        let allFdData = data.data.list
        let ExcelData = []
        for (let rec of allFdData) {
          rec = JSON.parse(rec.report_data)
          ExcelData.push(rec)
        }
        const header = ['date', 'defaultType', 'device']
        const headerName = {
          date: '故障日期',
          defaultType: '故障类型',
          device: '存储',
        }
        json2Excel(ExcelData, header, headerName, '故障分布数据表')
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
    async buildChart() {
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
          // data.forEach((item, index) => {
          //   data[index] = {
          //     date: item['故障日期'],
          //     defaultType: item['故障类型'],
          //     device: item['存储'],
          //   }
          // })
          // this.insertData(data, '故障分布数据')
        } else if (currentRoutePath == 'diskIO') {
          //查询数据
          let params = {
            report_type: '磁盘IO分布数据',
            // 根据当周头末时间查询该周数据
            starttime: this.currentWeek.startOfWeek,
            overtime: this.currentWeek.endOfWeek,
          }
          let res = await this.$request('apiQuery', params, 'post')
          data = []
          if (res.code == 2000) {
            res = res.data.list
            for (let rec of res) {
              rec = JSON.parse(rec.report_data)
              data.push(rec)
            }
            let keyMapping = [
              { key: 'date', value: '日期' },
              { key: 'device', value: '存储' },
              { key: 'diskType', value: '磁盘类型' },
              { key: 'readSpeed', value: '读取速度' },
              { key: 'writeSpeed', value: '写入速度' },
            ]
            data = copyTransFunc(data, keyMapping)
          } else {
            data = []
            this.$message({
              message: '该周尚无数据',
              type: 'info',
            })
          }
        } else if (currentRoutePath == 'SIU') {
          let queryParams = {
            report_type: '交换机接口使用率数据',
            starttime: this.$moment(new Date()).format('YYYY-MM-DD'),
          }
          let queryRes = await this.$request('apiQuery', queryParams, 'post')
          data = []
          if (queryRes.code == 2000) {
            queryRes = queryRes.data.list
            for (let rec of queryRes) {
              rec = JSON.parse(rec.report_data)
              data.push(rec)
            }
            let keyMapping = [
              { key: 'interface', value: '名称' },
              { key: 'lessThan50p', value: '低于50%使用率' },
              { key: 'moreThan80p', value: '使用率80%以上' },
              { key: 'bet50pAnd80p', value: '使用率50%~80%' },
            ]
            data = copyTransFunc(data, keyMapping)
            console.log(data);
          }
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
      const that = this
      function addNewDataSuccess(res) {
        if (res.code == 2000) {
          that.$message({
            message: '新增数据成功',
            type: 'success',
          })
        } else {
          that.$message({
            message: '无新增数据',
            type: 'info',
          })
        }
      }
      function queryDataSuccess(res) {
        if (res.code == 2000) {
          that.$message({
            message: '查询数据成功',
            type: 'success',
          })
        } else {
          that.$message({
            message: '查询数据失败',
            type: 'info',
          })
        }
      }
      try {
        let currentRoutePath = this.$route.path.split('/')[1]
        // 故障分布数据
        if (currentRoutePath == 'fd') {
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
                report_type: report_type,
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
            addNewDataSuccess(res)
          }
        }
        // 磁盘IO分布数据
        else if (currentRoutePath == 'diskIO') {
          //查询数据
          let queryParams = {
            report_type: report_type,
            // 根据当周头末时间查询该周数据
            starttime: this.currentWeek.startOfWeek,
            overtime: this.currentWeek.endOfWeek,
          }
          let queryRes = await this.$request('apiQuery', queryParams, 'post')
          // queryDataSuccess(queryRes)
          let tableData = [] //存放查询到的该周数据
          if (queryRes.code == 2000) {
            for (let rec of queryRes.data.list) {
              rec = JSON.parse(rec.report_data)
              tableData.push(rec)
            }
            this.diskIOCurrentWeekData = tableData
            for (let xlsxRec of xlsxData) {
              xlsxRec.date = this.$moment(xlsxRec.date).format('YYYY-MM-DD')
            }
            // 比较excel数据和表格数据，获得新增数据对象
            let newDataArr = getObjectDiff(xlsxData, tableData)
            //存放新增数据
            let addArr = []
            for (let xlsxRec of newDataArr) {
              let obj = {
                report_type: report_type,
                report_data: xlsxRec,
                report_time: xlsxRec.date,
              }
              xlsxRec = obj
              addArr.push(xlsxRec)
            }
            // console.log(addArr);
            // 插入新增数据
            let insertParams = {
              data: addArr,
            }
            let res = await this.$request('apiInsert', insertParams, 'post')
            addNewDataSuccess(res)
          } else {
            let addArr = []
            for (let xlsxRec of xlsxData) {
              xlsxRec.date = this.$moment(xlsxRec.date).format('YYYY-MM-DD')
              let obj = {
                report_type: report_type,
                report_data: xlsxRec,
                report_time: xlsxRec.date,
              }
              xlsxRec = obj
              addArr.push(xlsxRec)
            }
            let insertParams = {
              data: addArr,
            }
            let res = await this.$request('apiInsert', insertParams, 'post')
            addNewDataSuccess(res)
          }
        }
        //交换机接口使用率数据
        else if (currentRoutePath == 'SIU') {
          // const that = this
          //查询当天日期的数据
          let queryParams = {
            report_type: report_type,
            starttime: this.$moment(new Date()).format('YYYY-MM-DD'),
          }
          let queryRes = await this.$request('apiQuery', queryParams, 'post')
          let tableData = [] //存放查询到的数据
          if (queryRes.code == 2000) {
            tableData = queryRes.data.list
            for (let xlsxRec of xlsxData) {
              // 先给excel数据添加excelUploadDate属性，即上传表格时的当天日期
              xlsxRec.excelUploadDate = this.$moment(new Date()).format(
                'YYYY-MM-DD'
              )
            }
            // 筛选report_time为excel上传当天日期的数据
            tableData = _.filter(tableData, [
              'report_time',
              this.$moment(xlsxData[0].excelUploadDate).format(
                'YYYY-MM-DD HH:mm:ss'
              ),
            ])
            // 比较当天导入的excel数据和查询到的当天数据,名称不同则新增，名称相同则更新
            let formatTableData = []
            for (let rec of tableData) {
              let id = rec.report_id
              rec = JSON.parse(rec.report_data)
              rec.id = id
              formatTableData.push(rec)
            }
            let formatTableDataInterface = []
            let xlsxDataInterface = []
            // 双重遍历excel数据和当天查询到的数据
            let totalUpdate = 0
            let haveUpdate = false
            formatTableData.forEach(tableItem => {
              xlsxData.forEach(async xlsxItem => {
                // 接口名相同
                if (tableItem.interface == xlsxItem.interface) {
                  const updateID = tableItem.id
                  tableItem = _.omit(tableItem, ['id'])
                  // console.log(tableItem, xlsxItem)
                  let needUpdate = getObjectDiff([tableItem], [xlsxItem]).length
                  if (needUpdate) {
                    haveUpdate = true
                    let updateParams = {
                      report_id: updateID,
                      report_data: xlsxItem,
                      report_time: xlsxItem.excelUploadDate,
                    }
                    let updateRes = await this.$request(
                      'apiUpdate',
                      updateParams,
                      'post'
                    )
                  }
                }
              })
            })
            if (haveUpdate) {
              this.$message({
                message: `数据更新成功`,
                type: 'success',
              })
            }
            // 获取新增接口名称
            formatTableData.forEach(tableItem => {
              formatTableDataInterface.push(_.pick(tableItem, ['interface']))
            })
            xlsxData.forEach(xlsxItem => {
              xlsxDataInterface.push(_.pick(xlsxItem, ['interface']))
            })
            let newInterfaces = getObjectDiff(
              xlsxDataInterface,
              formatTableDataInterface
            )
            let newAdd = []
            xlsxData.forEach(xlsxItem => {
              newInterfaces.forEach(item => {
                if (xlsxItem.interface == item.interface) {
                  let insertParams = {
                    report_type: report_type,
                    report_data: xlsxItem,
                    report_time: xlsxItem.excelUploadDate,
                  }
                  newAdd.push(insertParams)
                }
              })
            })
            let insertParams = {
              data: newAdd,
            }
            let res = await this.$request('apiInsert', insertParams, 'post')
            if (res.code == 2000) {
              this.$message({
                message: '新增数据成功',
                type: 'success',
              })
            } else {
              this.$message({
                message: '无新增数据',
                type: 'info',
              })
            }
            console.log(formatTableData)
            console.log(xlsxData)
          }
          //查询不到就插入数据
          else {
            let addArr = []
            for (let xlsxRec of xlsxData) {
              xlsxRec.excelUploadDate = this.$moment(new Date()).format(
                'YYYY-MM-DD'
              )
              let obj = {
                report_type: report_type,
                report_data: xlsxRec,
                report_time: this.$moment(new Date()).format('YYYY-MM-DD'),
              }
              xlsxRec = obj
              addArr.push(xlsxRec)
            }
            // console.log(addArr);
            let insertParams = {
              data: addArr,
            }
            let res = await this.$request('apiInsert', insertParams, 'post')
            addNewDataSuccess(res)
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
