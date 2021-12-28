<template>
  <div class="com-chart" ref="chartRef"></div>
</template>
<script>
import { copyTransFunc } from '@/utils/formatDataKey.js'
import { getObjectDiff } from '@/utils/getObjectDiff.js'
import _ from 'lodash'

export default {
  data() {
    return {
      chartInstance: null, // echart图表实例
      chartData: null, // 图表展示数据
      ChartOptionName: '交换机接口使用率图表配置',
      chartOption: '', // 图表配置信息option
      optionList: [], //故障分布图保存的历史配置信息
    }
  },
  props: ['currentWeek', 'newDataAndScript'],
  watch: {
    // 监听父组件传来的新周数
    currentWeek: {
      handler: function(newVal, oldVal) {
        // this.getData()
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
        let queryParams = {
          report_type: '交换机接口使用率数据',
        }
        let data = await this.$request('apiQuery', queryParams, 'post')
        if (data.code == 2000) {
          let chartData = data.data.list
          let lastReportTime = chartData[chartData.length-1].report_time
          // 获取最近上传日期的数据
          chartData = _.filter(chartData,['report_time',lastReportTime])
          // console.log(chartData);
          this.chartData = chartData
        }else {
          this.chartData = []
          this.$message({
            message: '尚无数据',
            type: 'info',
          })
        }
        this.initChart()
      } catch (error) {
        console.log(error);
      }
    },
    //   初始化图表
    initChart() {
      // 初始化echart实例
      let myChart = this.$echarts.init(this.$refs.chartRef)
      let option
      let data = []
      if (this.chartData) {
        for (let rec of this.chartData) {
          rec = JSON.parse(rec.report_data)
          data.push(rec)
        }
      }
      let keyMapping = [
        {key:'interface',value:'名称'},
        {key:'lessThan50p', value:'低于50%使用率'},
        {key:'moreThan80p', value:'使用率80%以上'},
        {key:'bet50pAnd80p',value:'使用率50%~80%'},
      ]
      data = copyTransFunc(data, keyMapping)
      // console.log(data);
      

      option = {
        title: {
          text: '核心应用SAN交换机 端口使用情况',
          left: '1%',
        },
        tooltip: {
          trigger: 'axis',
          axisPointer: {
            // Use axis to trigger tooltip
            type: 'shadow', // 'shadow' as default; can also be 'line' or 'shadow'
          },
        },
        legend: {},
        grid: {
          left: '3%',
          right: '4%',
          bottom: '3%',
          containLabel: true,
        },
        tooltip: {
          formatter: param => {
            // return param.seriesName + ' <br/>'
            //     + param.value["存储"] + ' <br/>'
            //     + param.value["日期"] + ' <br/>';
            return `${param.value['名称']} <br/> 
      低于50%时长占比: ${(param.value['低于50%使用率'] * 100).toFixed(0)}% <br/>
      50%~80%时长占比: ${(param.value['使用率50%~80%'] * 100).toFixed(0)}% <br/>
      高于80%时长占比: ${(param.value['使用率80%以上'] * 100).toFixed(0)}%`
          },
        },
        dataset: [
          // x是按 (当前日期-最小日期) / (最大日期 - 最小日期) 的一个比例得出的位置
          // y是按 (当前日期所在星期) + (存储的序号下标 x 7) 得出哪个存储哪个星期几发生的故障
          {
            dimensions: [
              '名称',
              '低于50%使用率',
              '使用率50%~80%',
              '使用率80%以上',
            ],
            source: data,
          },
        ],

        xAxis: {
          type: 'value',
          axisLabel: {
            formatter: param => {
              return `${param * 100}%`
            },
          },
        },
        yAxis: {
          type: 'category',
        },
        series: [
          {
            type: 'bar',
            stack: 'total',
            seriesLayoutBy: 'row',
            // emphasis: {
            //   focus: 'series'
            // },
            // label: {
            //   show: true,
            // },
          },
          {
            type: 'bar',
            stack: 'total',
            seriesLayoutBy: 'row',
            // emphasis: {
            //   focus: 'series'
            // },
            // label: {
            //   show: true,
            // },
          },
          {
            type: 'bar',
            stack: 'total',
            seriesLayoutBy: 'row',
            // emphasis: {
            //   focus: 'series'
            // },
            // label: {
            //   show: true,
            // },
          },
        ],
      },

      myChart.setOption(option)
      this.chartInstance = myChart
      // 将option赋值给chartOption，此时chartOption内容是一个对象
      this.chartOption = option
    },
    // 更改图表
    changeChart(script,data) {
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
        console.log(error);
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
      this.chartInstance.setOption(adapterOption)
      // 手动调用图表对象的resize才能产生效果
      this.chartInstance.resize()
    },
  },
}
</script>
<style lang="less" scoped></style>
