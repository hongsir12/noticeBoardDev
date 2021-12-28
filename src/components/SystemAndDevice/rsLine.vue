<!--一周资源使用折线图-->
<template>
  <div class="com-page">
    <!-- 编辑器组件 -->
    <vue-draggable-resizable
      v-if="editorShow"
      :w="400"
      :h="400"
      :z="999"
      :min-width="278"
      :min-height="200"
      @dragging="onDrag"
      @resizing="onResize"
    >
      <ace
        :sendEditorProps="sendEditorProps"
        @dialogVisible="getDialogVisible"
        @aceClose="aceClose"
        @getChartOptionName="getChartOptionName"
        @sendEditorContent="sendEditorContent"
        ref="aceRef"
      ></ace>
    </vue-draggable-resizable>
    <!-- 编辑器开关 -->
    <div class="switch" @click.prevent="switchClick">
      <el-switch
        v-model="editorShow"
        active-color="#13ce66"
        inactive-color="#ff4949"
        :disabled="isDisabled"
      >
      </el-switch>
    </div>

    <!-- 已保存历史配置弹出框 -->
    <el-dialog
      title="已保存配置"
      :visible.sync="dialogVisible"
      width="30%"
      :before-close="handleClose"
      custom-class="dialogWidth"
    >
      <template>
        <el-radio-group v-model="currentOptionRadio">
          <el-radio
            v-for="(item, index) in sendEditorProps.optionList"
            :key="index"
            :label="item.optionName"
            border
            @change="radioChange"
          ></el-radio>
        </el-radio-group>
      </template>
      <span slot="footer" class="dialog-footer">
        <el-button type="danger" @click="deleteOption">删除配置</el-button>
        <el-button @click="handleClose">取 消</el-button>
        <el-button type="primary" @click="chooseOption">确 定</el-button>
      </span>
    </el-dialog>

    <div class="com-chart" ref="chartRef"></div>
  </div>
</template>
<script>
export default {
  data() {
    return {
      // 可拖动缩放容器的配置
      draggableResizable: { width: 0, height: 0, x: 0, y: 0 },
      chartInstance: null,
      allData: null, //获取的所有数据
      cpuData: null, //cpu数据
      ramData: null, //内存数据
      storageData: null, //存储数据
      chartOption: '', // 图表配置信息option
      ChartOptionName: '一周资源使用折线图配置',
      optionList: [], //一周资源使用折线图保存的历史配置信息
      // 编辑器显示状态
      editorShow: false,
      // 开关禁用状态
      isDisabled: true,
      // 要传给编辑器组件的值
      sendEditorProps: {
        // 保存的图表配置
        optionList: [],
        // 要传给编辑器显示区的字符串
        aceEditorScript: '',
        // 当前图表配置名称
        chartOptionName: '',
      },
      // 弹框显示状态
      dialogVisible: false,
      // 选中的历史配置名称
      currentOptionRadio: '',
      // 要传给图表的新的数据和编辑器内容
      newDataAndScript: null,
    }
  },
  props: ['currentWeek'], //周数
  watch: {
    // 监听父组件传来的新周数
    currentWeek: function(newVal, oldVal) {
      this.getData()
    },
    newDataAndScript: {
      deep: true,
      handler: function(val) {
        // if (val.data.length === 0) {
        //   this.changeChart(val.newEditorContent, this.chartData)
        // } else {
        //   this.changeChart(val.newEditorContent, val.data)
        // }
        this.changeChart(val.newEditorContent, this.allData)
      },
    },
  },
  mounted() {
    this.getData()
    this.initChart()
    this.getChartOptionName(this.ChartOptionName)
    window.addEventListener('resize', this.screenAdapter)
    // 在页面加载完成时候，主动进行屏幕适配
    this.screenAdapter()
  },

  methods: {
    // 编辑器开关
    switchClick() {
      if (this.editorShow == false) {
        this.$messageBox
          .confirm('确定开启编辑器?', '提示', {
            confirmButtonText: '确定',
            cancelButtonText: '取消',
            type: 'warning',
          })
          .then(() => {
            this.editorShow = true
          })
          .catch(() => {
            this.$message({
              type: 'info',
              message: '已取消',
            })
          })
      } else {
        this.$messageBox
          .confirm('确定关闭编辑器?', '提示', {
            confirmButtonText: '确定',
            cancelButtonText: '取消',
            type: 'warning',
          })
          .then(() => {
            this.editorShow = false
          })
          .catch(() => {
            this.$message({
              type: 'info',
              message: '已取消',
            })
          })
      }
    },
    // 点击编辑器内的关闭按钮
    aceClose(res) {
      this.editorShow = res
    },
    // 获取图表历史配置列表
    async getChartOptionName(res) {
      this.sendEditorProps.chartOptionName = res
      let params = {
        report_type: '全部已保存图表配置',
        conditions: [{ chartName: res }],
      }
      let { data } = await this.$request('apiQuery', params, 'post')
      let chartData = data.list
      let optionList = []
      for (let rec of chartData) {
        let id = rec.report_id
        rec = JSON.parse(rec.report_data)
        let obj = { optionName: rec.optionName, content: rec.content, id: id }
        optionList.push(obj)
      }
      this.sendEditorProps.optionList = optionList
    },
    // 编辑器组件点击历史配置按钮后将弹框显示状态传给当前父组件
    getDialogVisible(res) {
      this.dialogVisible = res
    },
    // 切换历史配置
    radioChange(res) {
      //将历史配置名称存到 currentOptionRadio
      this.currentOptionRadio = res
    },
    // 历史配置弹框点击确认
    chooseOption() {
      // 获取选中的历史配置代码字符串
      for (let rec of this.sendEditorProps.optionList) {
        if (rec.optionName === this.currentOptionRadio) {
          this.sendEditorProps.aceEditorScript = rec.content
        }
      }
      this.dialogVisible = false
      this.currentOptionRadio = ''
    },
    //删除历史配置
    deleteOption() {
      let optionList = this.sendEditorProps.optionList
      let deletedID
      //如果选中项为默认配置，取消操作
      if (this.currentOptionRadio == '默认配置') {
        this.$messageBox.alert('默认配置无法删除', '提示', {
          confirmButtonText: '确定',
          callback: () => {
            this.$message({
              type: 'info',
              message: `操作已取消`,
            })
          },
        })
      } else {
        //遍历配置列表
        for (let rec of optionList) {
          //选中配置名和配置列表项名称一样时，获取id
          if (rec.optionName == this.currentOptionRadio) {
            deletedID = rec.id
          }
        }
        this.$messageBox
          .confirm('此操作将永久删除该配置, 是否继续?', '提示', {
            confirmButtonText: '确定',
            cancelButtonText: '取消',
            type: 'warning',
          })
          .then(async () => {
            let deleteParam = {
              data: [deletedID],
            }
            let res = await this.$request('apiDelete', deleteParam, 'post')
            if (res.code == 2000) {
              this.$message({
                type: 'success',
                message: '删除成功!',
              })
              this.getChartOptionName(this.ChartOptionName)
            } else {
              this.$message({
                type: 'info',
                message: '删除失败',
              })
            }
          })
          .catch(() => {
            this.$message({
              type: 'info',
              message: '已取消删除',
            })
          })
      }
    },
    // 关闭历史配置弹出框
    handleClose(done) {
      this.$messageBox
        .confirm('确认关闭？')
        .then(_ => {
          this.dialogVisible = false
          this.currentOptionRadio = ''
          this.$message({
            message: '关闭成功',
            type: 'success',
          })
        })
        .catch(_ => {})
    },
    // 接收编辑器传来的新的数据源和编辑器内容
    sendEditorContent(res) {
      this.newDataAndScript = res
    },
    // 初始化echartInstance对象
    initChart() {
      this.chartInstance = this.$echarts.init(this.$refs.chartRef)
      const initOption = {
        title: {
          text: '各资源一周使用趋势',
          left: 'center',
          top: '2%',
          textStyle: {
            color: 'white',
          },
        },
        tooltip: {
          trigger: 'axis',
        },
        legend: {
          top: '10%',
          textStyle: {
            color: 'white',
          },
        },
        grid: {
          left: '3%',
          right: '4%',
          bottom: '3%',
          top: '16%',
          // 开启距离包含坐标轴上的文字
          containLabel: true,
        },

        xAxis: {
          type: 'category',
          axisLabel: {
            textStyle: {
              color: 'white',
            },
          },
        },
        yAxis: {
          axisLabel: {
            textStyle: {
              color: 'white',
            },
          },
        },
        series: [
          {
            type: 'line',
            itemStyle: {
              color: '#f26522',
            },
          },
          {
            type: 'line',
            itemStyle: {
              color: '#aa363d',
            },
          },
          {
            type: 'line',
            itemStyle: {
              color: 'green',
            },
          },
        ],
        backgroundColor: 'rgba(255, 255, 255, 0.1)',
      }
      this.chartInstance.setOption(initOption)
    },
    async getData() {
      let data = []
      let params = {
        report_type: '资源使用情况周报数据',
        // 根据当周头末时间查询该周数据
        starttime: this.currentWeek.startOfWeek,
        overtime: this.currentWeek.endOfWeek,
      }
      let res = await this.$request('apiQuery', params, 'post')
      if (res.code == 2000) {
        let tabledata = res.data.list
        for (let rec of tabledata) {
          rec = JSON.parse(rec.report_data)
          data.push(rec)
        }
      } else {
        data = []
      }
      this.allData = data
      this.cpuData = data.filter((value, index, arr) => {
        return value.type == 'CPU(核)'
      })
      this.ramData = data.filter((value, index, arr) => {
        return value.type == '内存(GB)'
      })
      this.storageData = data.filter((value, index, arr) => {
        return value.type == '存储(TB)'
      })
      this.updateChart()
    },
    updateChart() {
      // 计算当天资源使用量
      const that = this
      function currentDayResourceUsed(n) {
        try {
          if (that.allData.length <= 0) {
          return 0
        } else {
          let arr = []
          if(typeof(that.cpuData[n])=='undefined') {
            arr.push(0)
          }else{
            arr.push(that.cpuData[n].used)
          }
          if(typeof(that.ramData[n])=='undefined') {
            arr.push(0)
          }else{
            arr.push(that.ramData[n].used)
          }
          if(typeof(that.storageData[n])=='undefined') {
            arr.push(0)
          }else{
            arr.push(that.storageData[n].used)
          }
          // arr.push(
          //   that.cpuData[n].used,
          //   that.ramData[n].used,
          //   that.storageData[n].used
          // )
          // console.log(arr)
          return arr
        }
        } catch (error) {
          console.log(error);
        }
        
      }
      // 处理数据相关配置项
      const dataOption = {
        dataset: {
          // 提供一份数据。
          source: [
            ['product', 'CPU(核)', '内存(GB)', '存储(TB)'],
            [this.currentWeek.startOfWeek, ...currentDayResourceUsed(0)],
            [
              this.$moment(this.currentWeek.startOfWeek)
                .add(1, 'd')
                .format('YYYY-MM-DD'),
              ...currentDayResourceUsed(1),
            ],
            [
              this.$moment(this.currentWeek.startOfWeek)
                .add(2, 'd')
                .format('YYYY-MM-DD'),
              ...currentDayResourceUsed(2),
            ],
            [
              this.$moment(this.currentWeek.startOfWeek)
                .add(3, 'd')
                .format('YYYY-MM-DD'),
              ...currentDayResourceUsed(3),
            ],
            [
              this.$moment(this.currentWeek.startOfWeek)
                .add(4, 'd')
                .format('YYYY-MM-DD'),
              ...currentDayResourceUsed(4),
            ],
            [
              this.$moment(this.currentWeek.startOfWeek)
                .add(5, 'd')
                .format('YYYY-MM-DD'),
              ...currentDayResourceUsed(5),
            ],
            [this.currentWeek.endOfWeek, ...currentDayResourceUsed(6)],
          ],
        },
      }
      this.chartInstance.setOption(dataOption)
    },
    // 更改图表
    changeChart(script, data) {
      // 用echarts时，如果不存在DOM，就会报错，处理方法先检查是否DOM存在：
      if (this.$refs.chartRef == null) {
        return
      }
      // 用echarts时，如果存在DOM，就会报存在警告，处理方法删除DOM：
      this.$echarts.dispose(this.$refs.chartRef)
      try {
        data = JSON.stringify(data)
        let func = new Function(
          'echarts',
          `const ROOT_PATH = 'https://cdn.jsdelivr.net/gh/apache/echarts-website@asf-site/examples';var option;let myChart = echarts.init(this.$refs.chartRef);let data;data = ${data};` +
            script +
            `myChart.clear();option && myChart.setOption(option);`
        ).bind(this)
        func(this.$echarts)
      } catch (error) {
        console.log(error)
        this.$message({
          message: '数据或代码出错',
          type: 'error',
        })
      }
    },
    // 当浏览器大小发生变化时候，调用方法完成屏幕适配
    screenAdapter() {
      const titleFontSize = (this.$refs.chartRef.offsetWidth / 100) * 3
      // 和分辨率大小相关的配置项
      const adapterOption = {
        title: {
          textStyle: {
            fontSize: titleFontSize,
          },
        },
      }
      this.chartInstance.setOption(adapterOption)
      // 手动调用图表对象的resize才能产生效果
      this.chartInstance.resize()
    },
    //   容器大小
    onResize: function(x, y, width, height) {
      this.draggableResizable.x = x
      this.draggableResizable.y = y
      this.draggableResizable.width = width
      this.draggableResizable.height = height
    },
    // 容器拖动
    onDrag: function(x, y) {
      this.draggableResizable.x = x
      this.draggableResizable.y = y
    },
  },
}
</script>
<style lang="less" scoped>
.switch {
  position: absolute;
  top: 10px;
  right: 10px;
  z-index: 10;
}
.dialogWidth {
  width: 60%;
}
/deep/ .el-radio-group {
  display: flex;
  flex-direction: column;
}
/deep/ .el-radio.is-bordered {
  margin-left: 10px;
}
/deep/ .el-cascader-node > .el-radio,
.el-radio:last-child {
  margin-right: 30px;
}
</style>
