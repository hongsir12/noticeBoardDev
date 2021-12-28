// 更改对象属性名
// 第一个参数为要更改的对象，第二个参数为属性名映射数组
// 如将属性名为 “日期” 更改为 "date" : [{ key: '日期', value: 'date' }]
export function copyTransFunc (obj, typeArr) {
    let result;
    let toString = Object.prototype.toString;
    if (toString.call (obj) === '[object Array]') {
        result = [];
        for (let i = 0; i < obj.length; i++) {
            result[i] = copyTransFunc (obj[i], arguments[1])
        }
    } else if (toString.call (obj) === '[object Object]') {
        result = {};
        for (let _key in obj) {
            if (obj.hasOwnProperty (_key)) {
                let flag = 0, _value = null;
                for (let j = 0; j < arguments[1].length; j++) {
                    if (arguments[1][j].key === _key) {
                        flag = 1;
                        _value = arguments[1][j].value
                    }
                }
                if (flag)
                    result[_value] = copyTransFunc (obj[_key], arguments[1]);
                else
                    result[_key] = copyTransFunc (obj[_key], arguments[1])
            }
        }
    } else {
        return obj
    }
    return result
}
