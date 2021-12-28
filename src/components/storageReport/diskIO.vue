<template>
  <div class="com-chart" ref="chartRef"></div>
</template>
<script>
import { copyTransFunc } from '@/utils/formatDataKey.js'
import { getObjectDiff } from '@/utils/getObjectDiff.js'
export default {
  data() {
    return {
      chartInstance: null, // echart图表实例
      chartData: null, // 图表展示数据
      chartOption: '', // 图表配置信息option
      ChartOptionName: '磁盘IO分布图表配置',
      optionList: [], //磁盘IO分布图保存的历史配置信息
    }
  },
  props: ['currentWeek', 'newDataAndScript'],
  watch: {
    // 监听父组件传来的新周数
    currentWeek: {
      handler: function(newVal, oldVal) {
        this.getData()
        // this.initChart()
        // this.sendOption()
      },
      immediate: true,
    },
    newDataAndScript: {
      deep: true,
      handler: function(val) {
        if (val.data.length === 0) {
          this.getData()
          this.changeChart(val.newEditorContent, this.chartData)
        } else {
          this.changeChart(val.newEditorContent, val.data)
        }
        // this.changeChart(val.newEditorContent, val.data)
      },
    },
  },
  mounted() {
    this.getData()
    this.initChart()
    //向父组件发送图表配置名称
    this.$emit('sendChartOptionName', this.ChartOptionName)
    window.addEventListener('resize', this.screenAdapter)
    // 在页面加载完成时候，主动进行屏幕适配
    this.screenAdapter()
  },

  methods: {
    async getData() {
      try {
        let params = {
          report_type: '磁盘IO分布数据',
          // 根据当周头末时间查询该周数据
          starttime: this.currentWeek.startOfWeek,
          overtime: this.currentWeek.endOfWeek,
        }
        let data = await this.$request('apiQuery', params, 'post')
        if (data.code == 2000) {
          let chartData = data.data.list
          this.chartData = chartData
        } else {
          this.chartData = []
          this.$message({
            message: '该周尚无数据',
            type: 'info',
          })
        }
        this.initChart()
      } catch (error) {
        console.log(error)
      }
    },
    //   初始化图表
    initChart() {
      // 初始化echart实例
      let myChart = this.$echarts.init(this.$refs.chartRef)
      let data = []
      if (this.chartData) {
        for (let rec of this.chartData) {
          rec = JSON.parse(rec.report_data)
          data.push(rec)
        }
      }
      let keyMapping = [
        { key: 'date', value: '日期' },
        { key: 'device', value: '存储' },
        { key: 'diskType', value: '磁盘类型' },
        { key: 'readSpeed', value: '读取速度' },
        { key: 'writeSpeed', value: '写入速度' },
      ]
      data = copyTransFunc(data, keyMapping)
      let option
      var sasData = [] // 200 ~ 350    288
      var sataData = [] // 100 ~ 200   48
      var ssdData = [] // 2000 ~      96
      for (let rec of data) {
        rec['日期'] = this.$moment(rec['日期'])
          .toDate()
          .format('yyyy-MM-dd')
        if (rec['磁盘类型'] === 'sas') {
          sasData.push(rec)
        }
        if (rec['磁盘类型'] === 'sata') {
          sataData.push(rec)
        }
        if (rec['磁盘类型'] === 'ssd') {
          ssdData.push(rec)
        }
      }

      sasData = sasData.map(item => {
        item = [item['读取速度'], item['写入速度'], item['存储'], item['日期']]
        return item
      })
      sataData = sataData.map(item => {
        item = [item['读取速度'], item['写入速度'], item['存储'], item['日期']]
        return item
      })
      ssdData = ssdData.map(item => {
        item = [item['读取速度'], item['写入速度'], item['存储'], item['日期']]
        return item
      })

      option = {
        title: {
          text: '3Par存储-磁盘IO分布图',
          left: '1%',
        },
        legend: {
          data: ['SAS', 'SATA', 'SSD'],
        },
        xAxis: {
          scale: true,
          type: 'value',
          splitNumber: 10,
          //max: 2000,
          name: '写IOPS',
        },
        yAxis: {
          scale: true,
          type: 'value',
          splitNumber: 10,
          //max: 2000,
          name: '读IOPS',
        },
        tooltip: {
          formatter: param => {
            return `日期:${param.value[3]}<br/>存储:${param.value[2]}<br/>读IOPS: ${param.value[0]} <br/>写IOPS: ${param.value[1]}`
          },
        },
        // 数据格式为: 每个存储一共有多少个盘, 每个盘的型号是什么, 每月平均读写是多少
        // 每月平均读数对应各个点的坐标.
        series: [
          {
            name: 'SAS',
            type: 'scatter',
            // symbolSize: 20,
            data: sasData,
          },
          {
            name: 'SATA',
            type: 'scatter',
            // symbolSize: 20,
            data: sataData,
          },
          {
            name: 'SSD',
            type: 'scatter',
            data: ssdData,
          },
        ],
      }
      myChart.setOption(option)
      this.chartInstance = myChart
      // 将option赋值给chartOption，此时chartOption内容是一个对象
      this.chartOption = option
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
      const titleFontSize = (this.$refs.chartRef.offsetWidth / 100) * 1.5
      // 和分辨率大小相关的配置项
      const adapterOption = {
        title: {
          textStyle: {
            fontSize: titleFontSize,
          },
        },
      }
      // console.log(this.$refs.diskIORef);
      this.chartInstance.setOption(adapterOption)
      // 手动调用图表对象的resize才能产生效果
      this.chartInstance.resize()
    },
  },
}
</script>
<style lang="less" scoped></style>
