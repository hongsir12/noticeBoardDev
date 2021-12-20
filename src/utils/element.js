import Vue from 'vue'
import {
    DatePicker,
    Table,
    Card,
    Button,
    ButtonGroup,
    TableColumn,
    Select,
    Option,
    Input,
    Upload,
    Menu,
    MenuItem,
    Submenu,
    Dropdown,
    DropdownMenu,
    DropdownItem,
    Dialog,
    Switch,
    Message,
    MessageBox,
    Row,
    RadioGroup,
    Radio,
    Form,
    FormItem,
    Pagination
  } from 'element-ui'

Vue.use(DatePicker)
Vue.use(Table)
Vue.use(Card)
Vue.use(Button)
Vue.use(ButtonGroup)
Vue.use(TableColumn)
Vue.use(Select)
Vue.use(Option)
Vue.use(Input)
Vue.use(Upload)
Vue.use(Menu)
Vue.use(MenuItem)
Vue.use(Submenu)
Vue.use(Dropdown)
Vue.use(DropdownMenu)
Vue.use(DropdownItem)
Vue.use(Switch)
Vue.use(Dialog)
Vue.use(Row)
Vue.use(Radio)
Vue.use(RadioGroup)
Vue.use(Form)
Vue.use(FormItem)
Vue.use(Pagination)

Vue.prototype.$message = Message
Vue.prototype.$messageBox = MessageBox