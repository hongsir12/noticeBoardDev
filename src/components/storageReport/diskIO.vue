<template>
  <div class="com-chart" ref="chartRef"></div>
</template>
<script>
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
      var sasData = [] // 200 ~ 350    288
      var sataData = [] // 100 ~ 200   48
      var ssdData = [] // 2000 ~      96

      // for (let i = 0; i < 288; i++) {
      //   let factor = Math.random()
      //   if (factor < 0.1) {
      //     sasData.push([
      //       Math.floor(170 * Math.random()) + 180,
      //       Math.floor(100 * Math.random()),
      //     ])
      //   } else if (factor < 0.2) {
      //     sasData.push([
      //       Math.floor(150 * Math.random()),
      //       Math.floor(150 * Math.random()),
      //     ])
      //   } else if (factor < 0.9) {
      //     sasData.push([
      //       Math.floor(170 * Math.random()) + 180,
      //       Math.floor(170 * Math.random()) + 180,
      //     ])
      //   } else {
      //     sasData.push([
      //       Math.floor(100 * Math.random()),
      //       Math.floor(170 * Math.random()) + 180,
      //     ])
      //   }
      // }

      // for (let i = 0; i < 48; i++) {
      //   let factor = Math.random()
      //   if (factor < 0.1) {
      //     sataData.push([
      //       Math.floor(70 * Math.random()) + 130,
      //       Math.floor(50 * Math.random()),
      //     ])
      //   } else if (factor < 0.2) {
      //     sataData.push([
      //       Math.floor(100 * Math.random()),
      //       Math.floor(100 * Math.random()),
      //     ])
      //   } else if (factor < 0.9) {
      //     sataData.push([
      //       Math.floor(80 * Math.random()) + 120,
      //       Math.floor(80 * Math.random()) + 120,
      //     ])
      //   } else {
      //     sataData.push([
      //       Math.floor(50 * Math.random()),
      //       Math.floor(70 * Math.random()) + 130,
      //     ])
      //   }
      // }

      // for (let i = 0; i < 96; i++) {
      //   let factor = Math.random()
      //   if (factor < 0.1) {
      //     ssdData.push([
      //       Math.floor(1000 * Math.random()) + 1000,
      //       Math.floor(1000 * Math.random()),
      //     ])
      //   } else if (factor < 0.2) {
      //     ssdData.push([
      //       Math.floor(500 * Math.random()),
      //       Math.floor(500 * Math.random()),
      //     ])
      //   } else if (factor < 0.8) {
      //     ssdData.push([
      //       Math.floor(500 * Math.random()) + 1000,
      //       Math.floor(500 * Math.random()) + 1000,
      //     ])
      //   } else if (factor < 0.9) {
      //     ssdData.push([
      //       Math.floor(1000 * Math.random()) + 1000,
      //       Math.floor(1000 * Math.random()) + 1000,
      //     ])
      //   } else {
      //     ssdData.push([
      //       Math.floor(1000 * Math.random()),
      //       Math.floor(1000 * Math.random()) + 1000,
      //     ])
      //   }
      // }
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
            return `读IOPS: ${param.value[1]} <br/>写IOPS: ${param.value[0]}`
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
      // console.log(this.$refs.diskIORef);
      this.chartInstance.setOption(adapterOption)
      // 手动调用图表对象的resize才能产生效果
      this.chartInstance.resize()
    },
  },
}
</script>
<style lang="less" scoped></style>
