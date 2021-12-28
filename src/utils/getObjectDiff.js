import { _ } from "core-js"
// 判断并获取数组新增对象
export function getObjectDiff(newArr,oldArr){
    if(_.isEqual(newArr,oldArr)){
        return []
    }else{
        let diff = []        
        newArr.forEach(item=>{
            let flag = true
            oldArr.forEach(oldItem=>{
                if(_.isEqual(item,oldItem)){
                    flag = false
                }
            })
            if(flag){
                diff.push(item)
            }
        })
        return diff
    }
}