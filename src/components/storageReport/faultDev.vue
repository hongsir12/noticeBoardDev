<template>
  <div class="com-chart" ref="chartRef"></div>
</template>
<script>
export default {
  data() {
    return {
      chartInstance: null, // echart图表实例
      chartData: [], // 图表全部展示数据
      currentWeekChartData: [], //当前周图表展示数据,主要用于定位dataZoom的位置
      ChartOptionName: '故障分布图表配置',
      chartOption: '', // 图表配置信息option
      optionList: [], //故障分布图保存的历史配置信息
    }
  },
  props: ['currentWeek', 'newDataAndScript'],
  watch: {
    // 监听父组件传来的新周数
    currentWeek: {
      handler: function(newVal, oldVal) {
        this.getData()
        this.initChart()
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
    this.getData()
    this.initChart()
    //向父组件发送图表配置名称
    this.$emit('sendChartOptionName', this.ChartOptionName)
    window.addEventListener('resize', this.screenAdapter)
    // 在页面加载完成时候，主动进行屏幕适配
    this.screenAdapter()
  },

  methods: {
    //获取该周设备故障分布数据
    async getData() {
      try {
        let params = {
          report_type: '故障分布数据',
          // 根据当周头末时间查询该周数据
          starttime: this.currentWeek.startOfWeek,
          overtime: this.currentWeek.endOfWeek,
        }
        let data = await this.$request('apiQuery', params, 'post')
        let tableData = []
        function calcX(sDate, rec) {
          let minDt = new Date('2015-01-01') // 故障最早时间点
          let trdDt = new Date('2015-01-01')
          trdDt.setYear(minDt.getFullYear() + 3)
          let friDt = new Date('2015-01-01')
          friDt.setYear(minDt.getFullYear() + 5)
          let eigDt = new Date('2015-01-01')
          eigDt.setYear(minDt.getFullYear() + 8)

          if (rec['进场时间']) {
            minDt = new Date(rec['进场时间']) // 故障最早时间点
            trdDt = new Date(rec['进场时间'])
            trdDt.setYear(minDt.getFullYear() + 3)
            friDt = new Date(rec['进场时间'])
            friDt.setYear(minDt.getFullYear() + 5)
            eigDt = new Date(rec['进场时间'])
            eigDt.setYear(minDt.getFullYear() + 8)
          }

          let recDt = new Date(sDate) // 当前故障时间点
          if (recDt.getTime() <= trdDt.getTime()) {
            return (
              (3 * // (new Date(sDate).getYear() - minDt.getYear())
                // +
                (new Date(sDate).getTime() - minDt.getTime())) /
              (trdDt.getTime() - minDt.getTime())
            )
          } else if (recDt.getTime() <= friDt.getTime()) {
            return (
              3 +
              (2 * (new Date(sDate).getTime() - trdDt.getTime())) /
                (friDt.getTime() - trdDt.getTime())
            )
          } else if (recDt.getTime() <= eigDt.getTime()) {
            return (
              5 +
              (3 * (new Date(sDate).getTime() - friDt.getTime())) /
                (eigDt.getTime() - friDt.getTime())
            )
          }
        }
        if (data.code == 2000) {
          for (let rec of data.data.list) {
            let id = rec.report_id
            rec = JSON.parse(rec.report_data)
            rec.id = id
            tableData.push(rec)
          }
          for (let rec of tableData) {
            rec.x = calcX(rec.date, rec)
          }
        } else {
          const startValue = {x:0.0001}
          const endValue = this.chartData[this.chartData.length-1]
          tableData.push(startValue,endValue)
          this.$message({
            message: '该周尚无数据',
            type: 'info',
          })
        }
        this.$nextTick(function() {
          this.currentWeekChartData = tableData
        })
      } catch (err) {
        console.log(err)
        this.$message({
          message: '获取数据失败',
          type: 'error',
        })
      }
    },
    //   初始化图表
    async initChart() {
      // 获取全部故障分布数据
      try {
        let params = {
          report_type: '故障分布数据',
        }
        let data = await this.$request('apiQuery', params, 'post')
        let tableData = []
        if (data.code == 2000) {
          for (let rec of data.data.list) {
            let id = rec.report_id
            rec = JSON.parse(rec.report_data)
            rec.id = id
            tableData.push(rec)
          }
        }
        this.chartData = tableData
      } catch (err) {
        console.log(err)
        this.$message({
          message: '获取数据失败',
          type: 'error',
        })
      }

      // 初始化echart实例
      let myChart = this.$echarts.getInstanceByDom(this.$refs.chartRef)
      if (myChart == null) {
        myChart = this.$echarts.init(this.$refs.chartRef)
      }
      let option
      var type = ['SAS盘', 'SSD盘', 'SATA盘']
      this.chartData.forEach((item, index) => {
        this.chartData[index] = {
          故障日期: item.date,
          故障类型: item.defaultType,
          存储: item.device,
        }
      })
      var data = this.chartData

      for (let rec of data) {
        if (
          -1 === type.indexOf(rec['故障类型']) &&
          rec['故障类型'] !== '其他'
        ) {
          type.push(rec['故障类型'])
        }
      }
      type.push('其他')

      var macMap = []
      var yAx = []
      for (let rec of data) {
        // 随机生成故障日期和故障类型
        //rec["日期"] = new Date( new Date("2016-01-01").getTime() + (new Date().getTime() - new Date("2016-01-01").getTime()) * Math.random()  );
        //rec["日期"] = `${rec["日期"].getFullYear()}-${rec["日期"].getMonth() < 10 ? '0':''}${rec["日期"].getMonth()}-${rec["日期"].getDate() < 10 ? '0':''}${rec["日期"].getDate()}`;
        //rec["类型"] = type[Math.floor(type.length * Math.random())]
        if (-1 === macMap.indexOf(rec['存储'])) {
          macMap.push(rec['存储'])
          yAx.push(yAx.length)
        }
      }
      macMap.sort()
      //yAx.push(yAx.length + 1)

      function calcX(sDate, rec) {
        let minDt = new Date('2015-01-01') // 故障最早时间点
        let trdDt = new Date('2015-01-01')
        trdDt.setYear(minDt.getFullYear() + 3)
        let friDt = new Date('2015-01-01')
        friDt.setYear(minDt.getFullYear() + 5)
        let eigDt = new Date('2015-01-01')
        eigDt.setYear(minDt.getFullYear() + 8)

        if (rec['进场时间']) {
          minDt = new Date(rec['进场时间']) // 故障最早时间点
          trdDt = new Date(rec['进场时间'])
          trdDt.setYear(minDt.getFullYear() + 3)
          friDt = new Date(rec['进场时间'])
          friDt.setYear(minDt.getFullYear() + 5)
          eigDt = new Date(rec['进场时间'])
          eigDt.setYear(minDt.getFullYear() + 8)
        }

        let recDt = new Date(sDate) // 当前故障时间点
        if (recDt.getTime() <= trdDt.getTime()) {
          return (
            (3 * // (new Date(sDate).getYear() - minDt.getYear())
              // +
              (new Date(sDate).getTime() - minDt.getTime())) /
            (trdDt.getTime() - minDt.getTime())
          )
        } else if (recDt.getTime() <= friDt.getTime()) {
          return (
            3 +
            (2 * (new Date(sDate).getTime() - trdDt.getTime())) /
              (friDt.getTime() - trdDt.getTime())
          )
        } else if (recDt.getTime() <= eigDt.getTime()) {
          return (
            5 +
            (3 * (new Date(sDate).getTime() - friDt.getTime())) /
              (eigDt.getTime() - friDt.getTime())
          )
        }
      }

      function calcY(sDate, sName) {
        return macMap.indexOf(sName)
        //let idx = macMap.indexOf(sName) * 7;
        //return (6 - new Date(sDate).getDay()) + idx;
      }

      for (let rec of data) {
        rec.x = calcX(rec['故障日期'], rec)
        rec.y = calcY(rec['故障日期'], rec['存储'])
      }

      var ds = [
        // x是按 (当前日期-最小日期) / (最大日期 - 最小日期) 的一个比例得出的位置
        // y是按 (当前日期所在星期) + (存储的序号下标 x 7) 得出哪个存储哪个星期几发生的故障
        {
          dimensions: ['故障类型', 'x', 'y', '存储', '故障日期'],
          source: data,
        },
      ]
      var ss = []
      for (let t of type) {
        ds.push({
          transform: {
            type: 'filter',
            config: { dimension: '故障类型', '=': t },
          },
        })

        ss.push({
          name: t,
          datasetIndex: ss.length + 1,
          type: 'scatter',
          //symbolSize: 4,
          encode: {
            x: 'x',
            y: 'y',
          },
        })
        // }
      }

      try {
        option = {
          title: {
            text: '存储故障分布图',
            left: '1%',
          },
          legend: {},
          dataZoom: [
            {
              show: true,
              realtime: true,
              startValue: this.currentWeekChartData[0].x - 0.0001,
              endValue:
                this.currentWeekChartData[this.currentWeekChartData.length - 1]
                  .x + 0.0001,
              xAxisIndex: [0, 1],
            },
          ],
          tooltip: {
            formatter: param => {
              // console.log(this);
              // return param.seriesName + ' <br/>'
              //     + param.value["存储"] + ' <br/>'
              //     + param.value["日期"] + ' <br/>';
              return `故障设备: ${param.value['存储']} <br/>故障类型: ${param.value['故障类型']} <br/>故障日期: ${param.value['故障日期']}`
            },
          },
          dataset: ds,
          xAxis: {
            type: 'value',
            axisTick: {
              alignWithLabel: true,
            },
            axisLabel: {
              align: '',
              formatter: param => {
                if (Number.parseFloat(param) <= 3) {
                  if (3 === param) {
                    return `3年`
                  } else {
                    return ''
                  }
                } else if (Number.parseFloat(param) <= 5) {
                  if (5 === param) {
                    return `5年`
                  } else {
                    return ''
                  }
                } else if (Number.parseFloat(param) <= 8) {
                  if (8 === param) {
                    return `8年`
                  } else {
                    return ''
                  }
                }
              },
            },
          },
          yAxis: {
            type: 'category',
            position: 'bottom',
            data: yAx, //[1, 2, 3, 4, 5, 6,7,8,9,10,11,12,13,14],
            axisTick: {
              alignWithLabel: true,
            },
            axisLabel: {
              align: '',
              formatter: param => {
                return macMap[param]
              },
            },
          },
          series: ss,
        }
      } catch (error) {
        console.log(error)
      }
      myChart.clear()
      setTimeout(() => {
        try {
          myChart.setOption(option)
        } catch (error) {
          console.log(error)
        }
      }, 500)
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
      this.chartInstance.setOption(adapterOption)
      // 手动调用图表对象的resize才能产生效果
      this.chartInstance.resize()
    },
  },
}
</script>
<style lang="less" scoped></style>
