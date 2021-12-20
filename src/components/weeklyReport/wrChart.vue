<template>
  <div class="com-page">
    <div class="com-chart" ref="chartRef"></div>
  </div>
</template>
<script>
export default {
  data() {
    return {
      chartInstance: null, // echart图表实例
      chartData: null, // 图表展示数据
      chartOption: '', // 图表配置信息option
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
          this.changeChart(val.newEditorContent, this.chartData)
        }else{
          this.changeChart(val.newEditorContent, val.data)
        }
      },
    },
  },
  mounted() {
    this.getData()
    //向父组件发送图表配置名称
    this.$emit('sendChartOptionName', '人员周报表图表配置')
    window.addEventListener('resize', this.screenAdapter)
    // 在页面加载完成时候，主动进行屏幕适配
    this.screenAdapter()
  },

  methods: {
    // 发起请求获取图表展示数据
    async getData() {
      let params = {
        report_type: '人员周报数据',
        // 根据当周头末时间查询该周数据
        starttime: this.currentWeek.startOfWeek,
        overtime: this.currentWeek.endOfWeek,
      }
      let { data: chartData } = await this.$request('apiQuery', params, 'post')
      chartData = chartData.list
      this.chartData = chartData
      this.initChart()
    },
    // 初始化图表样式
    initChart() {
      // 初始化echart实例
      let myChart = this.$echarts.init(this.$refs.chartRef)
      let option
      let data = []
      for (let rec of this.chartData) {
        let date = rec.report_time
        rec = JSON.parse(rec.report_data)
        if (typeof rec.time == 'string') {
          rec.time = JSON.parse(rec.time)
        }
        let obj = {
          姓名: `${rec.station}-${rec.name}`,
          工单号: rec.workOrder,
          开始时间: rec.time[0],
          结束时间: rec.time[1],
          日期: date,
          工作内容: rec.tasks,
        }
        data.push(obj)
      }
      // 计算 工作时长
      for (let rec of data) {
        rec['工作时长'] = Math.floor(
          (new Date(rec['结束时间']).getTime() -
            new Date(rec['开始时间']).getTime()) /
            1000 /
            60
        )
      }
      // 计算 X轴 Y轴
      var nameMap = []
      var xAx = []
      for (let rec of data) {
        if (-1 === nameMap.indexOf(rec['姓名'])) {
          let tmp = nameMap.length * 5
          for (let i = 1; i <= 5; i++) {
            xAx.push(i + tmp)
          }
          nameMap.push(rec['姓名'])
        }
      }
      xAx.push(xAx.length + 1)
      function calcX(sDate, sName) {
        let idx = nameMap.indexOf(sName) * 5
        return new Date(sDate).getDay() + idx
      }

      let hashMap = {}
      function calcY(rec) {
        let day = new Date(rec['开始时间']).getDay()
        hashMap[rec['姓名']] = hashMap[rec['姓名']] || {}
        hashMap[rec['姓名']][`${day}`] = hashMap[rec['姓名']][`${day}`] || {}
        let tmp = rec['工作时长']
        let i = 10
        while (
          undefined !== hashMap[rec['姓名']][`${day}`][`${tmp}`] &&
          i-- > 0
        ) {
          tmp += 4
        }
        hashMap[rec['姓名']][`${day}`][`${tmp}`] = true
        if (tmp > 480) {
          tmp = Math.floor(Math.random() * (400 - 300 + 1) + 300)
          // tmp = 480
        }
        return tmp
      }

      for (let rec of data) {
        rec.x = calcX(
          new Date(rec['开始时间']).format('yyyy-MM-dd'),
          rec['姓名']
        )
        rec.y = calcY(rec)
      }

      // 生成数据源和图表配置
      var ds = [
        {
          dimensions: ['姓名', 'x', 'y', '工作时长', '开始日期'],
          source: data,
        },
      ]
      var ss = []
      var oldT = 0
      var symbol = ['circle', 'rect', 'triangle', 'diamond', 'roundRect']
      var times = [30, 90, 120, 240, 480]
      for (let i = 0; i < times.length; i++) {
        let t = times[i]
        if (i === times.length - 1) {
          ds.push({
            transform: {
              type: 'filter',
              config: { dimension: '工作时长', '>=': oldT },
            },
          })
        } else {
          ds.push({
            transform: {
              type: 'filter',
              config: { dimension: '工作时长', '>=': oldT, '<=': t },
            },
          })
          oldT = t + 1
        }
        function legend() {
          let str = `小于${t}分钟`
          if (t === 480) {
            str = `大于240分钟`
          }
          return str
        }
        legend()

        ss.push({
          name: legend(),
          datasetIndex: ss.length + 1,
          type: 'scatter',
          symbol: symbol[i],
          encode: {
            x: 'x',
            y: 'y',
          },
        })
      }

      // 统计周总工作量并生成 源 和 图
      let sumData = []
      for (let rec of data) {
        let idx = sumData.findIndex(e => e['姓名'] === rec['姓名'])
        if (-1 === idx) {
          sumData.push({
            姓名: rec['姓名'],
            总工时: rec['工作时长'],
            x: nameMap.indexOf(rec['姓名']) * 5 + 5,
            y: rec['工作时长'],
          })
        } else {
          sumData[idx]['总工时'] += rec['工作时长']
          sumData[idx].y = sumData[idx]['总工时']
        }
      }
      for (let rec of sumData) {
        rec['总工时'] = Math.floor(rec['总工时'] / 60)
        rec.y = rec['总工时']
        if (rec.y > 50) {
          rec.y = 50
        }
      }
      ds.push({
        dimensions: ['姓名', 'x', 'y', '总时长'],
        source: sumData,
      })
      ss.push({
        name: '总工时',
        type: 'line',
        yAxisIndex: 1,
        datasetIndex: ss.length + 1,
        encode: {
          x: 'x',
          y: 'y',
        },
      })

      option = {
        title: {
          text: '人员工作量分布图',
          left: '1%',
        },
        legend: {},
        tooltip: {
          formatter: param => {
            if (undefined === param.value['总工时']) {
              return `工作时长: ${param.value['工作时长']}分钟 <br/>姓名: ${param.value['姓名']} <br/>开始时间: ${param.value['开始时间']}`
            } else {
              return `总工时: ${param.value['总工时']}小时 <br/>姓名: ${param.value['姓名']}`
            }
          },
        },
        dataset: ds,
        yAxis: [
          {
            type: 'value',
            name: '工作时长(分钟)',
            interval: 50,
            axisTick: {
              alignWithLabel: true,
            },
          },
          {
            type: 'value',
            name: '总时长(小时)',
            max: 50,
            interval: 10,
            position: 'right',
            splitLine: {
              show: false,
            },
          },
        ],
        xAxis: {
          type: 'value',
          interval: 1,
          position: 'bottom',
          data: xAx,
          axisTick: {
            //alignWithLabel: true,
          },
          axisLabel: {
            formatter: param => {
              let offset = 0
              const map = {
                '1': '1',
                '2': '2',
                '3': '3',
                '4': '4',
                '5': '5',
              }
              if (0 !== (param + offset) % 5) {
                return '' //`周${map[param % 5]}`
              } else {
                let name = nameMap[Math.floor((param + offset) / 5) - 1]
                if (name == undefined) {
                  return ''
                }
                name = name.split('-')[0]
                return name
              }
            },
          },
        },
        series: ss,
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
