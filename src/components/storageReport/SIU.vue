<template>
  <div class="com-chart" ref="chartRef"></div>
</template>
<script>
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
        // if (val.data.length === 0) {
        //   this.changeChart(val.newEditorContent, this.chartData)
        // } else {
        //   this.changeChart(val.newEditorContent, val.data)
        // }
        this.changeChart(val.newEditorContent, val.data)
      },
    },
  },
  mounted() {
    this.initChart()
    //向父组件发送图表配置名称
    this.$emit('sendChartOptionName', this.ChartOptionName)
    window.addEventListener('resize', this.screenAdapter)
    // 在页面加载完成时候，主动进行屏幕适配
    this.screenAdapter()
  },

  methods: {
    //   初始化图表
    initChart() {
      // 初始化echart实例
      let myChart = this.$echarts.init(this.$refs.chartRef)
      let option
      let data = []

      for (let rec of data) {
        rec['低于50%使用率'] = Math.random() * 0.2 + 0.6
        rec['使用率50%~80%'] =
          Math.random() * (0.8 - rec['低于50%使用率']) + 0.2
        rec['使用率80%以上'] = 1 - rec['低于50%使用率'] - rec['使用率50%~80%']
      }

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
      }

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
