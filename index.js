/**
 * Created by bgllj on 2016/5/31.
 */

import Vue from "vue";
import VueDragula  from 'vue-dragula'
Vue.use(VueDragula);
import "vue-dragula/styles/dragula.min.css"
import path  from "path"
import fs  from "fs"
import fsex  from "fs-extra";
import "./limitPNG.js"
import "./report"
import electron  from 'electron'
var remote = electron.remote;
var dialog = remote.dialog;
var shell = electron.shell;
var ipcRenderer = electron.ipcRenderer;
var shell = electron.shell;


window.path = path;
window.fs = fs;
window.remote = remote;
window.dialog = dialog;
window.shell = shell
window.Vue = Vue;


window.filter_file_size = function (value)
{
    if (value < 1024)
    {
        return value + " B";
    }

    let z = (value / 1024);
    if (z > 1000)
    {
        return (z / 1024).toFixed(2) + " MB";
    }
    else
    {
        return (z).toFixed(2) + " KB";
    }
}

Vue.filter('filter_file_size', filter_file_size)


window.filter_file_size_pre = function (value)
{
    let pre;
    if (value > 1.001)
    {
        return "+ " + Math.floor((value - 1) * 100) + "%"
    } else
    {
        pre = (1 - value)
        if (pre < 0.01 && pre > 0)
        {
            return "- " + (pre * 100).toFixed(2) + "%";
        } else
        {
            return "- " + Math.floor(pre * 100) + "%";
        }

    }
}

Vue.filter('filter_file_size_pre', filter_file_size_pre)


var file_data = [];

//todo test
// file_data
//     = [{
//     name: "tas都是ss1.png",
//     size_old: "21233",
//     size_new: null,
//     doing: true
// },
//     {
//         name: "QWEERsadf.png",
//         size_old: "30000",
//         size_new: null
//     },
//     {
//         name: "vvvvv.png",
//         size_old: "3233",
//         size_new: "5000",
//         done: true
//
//     },
//     {
//         name: "sequence-123.png",
//         size_old: "2133233",
//         size_new: "193133",
//         done: true
//     },
//     {
//         name: "DDS. L'Huilier.png",
//         size_old: "2133233",
//         size_new: null,
//         error: true
//     }
// ]


var main_list = new Vue(
    {
        el: "#vue_app",
        data: {
            test: "ddddd",
            list: file_data,
            loading_file: false,
            tasks_doing: false,
            time: 0,


            //----
            mode: "limit",
            out: "-suffix",
            thread: 2,

        },
        methods: {

            openImg_right: function (e, msg)
            {
                if (e.button == 2)
                    shell.openItem(msg)
            },

            openImg: function (msg)
            {
                shell.openItem(msg)
            },
            open_file: function ()
            {
                if (v.tasks_doing)
                {
                    alert("任务进行中，不能打开文件")
                    return;
                }

                dialog.showOpenDialog(
                    {title: "打开文件", properties: ["openFile", "multiSelections"]},
                    (files)=>
                    {
                        if (files != undefined && files.length > 0)
                        {
                            var newList = [];
                            for (let i = 0; i < files.length; i++)
                            {
                                var stat = fs.lstatSync(files[i]);
                                if (stat.isDirectory())
                                {
                                    _scanFiles(files[i], fs.readdirSync(files[i]), newList);
                                }
                                else
                                {
                                    if (ifPngFile(files[i]))
                                    {
                                        newList.push({path: files[i], size: getFileSize(files[i])});
                                    }
                                }
                            }
                            _put_list(newList);
                        }
                    }
                )
            },
            remove_all: function ()
            {
                if (v.tasks_doing == false)
                {
                    this.list = [];
                    file_data = [];
                }
            }


        },
        computed: {
            // 一个计算属性的 getter
            list_size_old: function ()
            {
                let size = 0;
                for (let i = 0; i < this.list.length; i++)
                {
                    size = size + +this.list[i].size_old;
                }
                return size;
            },
            list_size_new: function ()
            {
                let size = 0;
                for (let i = 0; i < this.list.length; i++)
                {
                    size = size + +this.list[i].size_new;
                }
                return size;
            },
            out_dir: function ()
            {
                if (this.out[0] != undefined && this.out[0] != "-")
                {
                    return this.out;
                } else
                {
                    return "";
                }

            }
        }
        ,
        created: function ()
        {
            Vue.vueDragula.options('my-bag', {
                direction: 'vertical'
            })
        }

    }
)


window.v = main_list
window.a = file_data

const holder = document.getElementById('main_body');

holder.ondragover = () =>
{
    return false;
};
holder.ondragleave = holder.ondragend = () =>
{
    return false;
};
holder.ondrop = (e) =>
{
    e.preventDefault();
    const file = e.dataTransfer.files[0];
    console.log(e.dataTransfer.files);
    // console.log('File you dragged here is', file.path);
    main_list.loading_file = true;

    var ff = e.dataTransfer.files
    setTimeout(function ()
    {
        putFile2list(ff);
        main_list.loading_file = false;
    }, 100)


    return false;
};


function putFile2list(files)
{

    if (files == undefined || files.length < 1)
    {
        return
    }

    var newList = [];

    for (let i = 0; i < files.length; i++)
    {
        var stat = fs.lstatSync(files[i].path);
        if (stat.isDirectory())
        {
            _scanFiles(files[i].path, fs.readdirSync(files[i].path), newList);
        }
        else
        {
            if (ifPngFile(files[i].path))
            {
                newList.push({path: files[i].path, size: files[i].size});
            }

        }
    }

    _put_list(newList);
    console.log("--------")
    console.log(newList)
    // file_data
}

function _put_list(newList)
{
    if (v.tasks_doing)
    {
        alert("任务进行中，不能添加文件")
        return;
    } else
    {

        if (file_data.length > 0)
        {
            if (file_data[0].done == true)
            {
                file_data = [];
            }
        }


    }


    for (let i = 0; i < newList.length; i++)
    {

        if (_existPath(newList[i].path,file_data) == false)
        {
            file_data.push({
                name: path.basename(newList[i].path),
                size_old: newList[i].size,
                size_new: 0,
                path: newList[i].path,
                new_File: "",
                doing: false,
                done: false,
                error: false,
                error_info: "",
                time_consum: null,
                log: "",

            });
        }


    }


    if (file_data !== undefined && file_data.length > 0)
    {
        main_list.list = file_data;

    } else
    {
        alert("拖入的文件没有图片")
    }


    function _existPath(_path, objArray)
    {
        for (let i = 0; i < objArray.length; i++)
        {
            if (objArray[i].path == _path)
            {
                return true;
            }
        }

        return false;
    }

}
function _scanFiles(dirPath, _files, newList)
{
    for (let i = 0; i < _files.length; i++)
    {
        let _path = path.join(dirPath, _files[i])

        let stat = fs.lstatSync(_path);
        if (stat.isDirectory())
        {
            _scanFiles(_path, fs.readdirSync(_path), newList);
        }
        else
        {
            if (ifPngFile(_path))
            {
                newList.push({path: _path, size: stat.size});
            }
        }
    }
}

function ifPngFile(fileName)
{
    if (path.extname(fileName).toLocaleLowerCase() == ".png")
    {
        return true
    } else
    {
        return false
    }
}


window.doLimiteByfile_data = function ()
{
    if (v.tasks_doing > 0)
    {
        return
    } else
    {

    }

    v.time = Date.now();
    var tasks = []
    window.tasks = tasks;
    for (let i = 0; i < main_list.list.length; i++)
    {
        let exp = new LimitPNG(main_list.list[i].path);
        console.log(exp)

        if (exp.pngFile != "")
        {
            tasks[i] = function (resolve, reject)
            {
                main_list.list[i].doing = true;
                let _do_func = function (newFile, old_size, new_size, time_consum, err, log)
                {
                    main_list.list[i].doing = false;
                    main_list.list[i].done = true;
                    main_list.list[i].size_new = new_size;
                    main_list.list[i].time_consum = time_consum;
                    main_list.list[i].new_File = newFile;
                    main_list.list[i].log = log;
                    if (err != undefined && err != "")
                    {
                        main_list.list[i].error = true;
                        main_list.list[i].error_info = err;
                    }
                    v.tasks_doing = v.tasks_doing - 1;
                    if (v.tasks_doing < 1)
                    {
                        v.time = (Date.now() - v.time)
                    }
                    if (resolve != undefined)
                    {
                        resolve(0);
                    }
                }
                exp.doDefault(main_list.out, main_list.mode, _do_func);
            };
        }
    }


    //单线程
    // _do_tasks(tasks)


    //多线程
    // function _do_tasks_N(n)
    // {
    //     for (let i = 0; i < tasks.length / n; i++)
    //     {
    //         _do_tasks(tasks.slice(n*i , n*i +n))
    //     }
    // }


    var stack = 2;
    if (v.thread != undefined && v.thread > 0 && v.thread < 16)
    {
        stack = v.thread;
    }

    v.tasks_doing = tasks.length;
    cheakTasks()
    function cheakTasks()
    {

        while (stack > 0 && tasks.length > 0)
        {
            tasks.shift()(function ()
            {
                stack++;
                cheakTasks();
            });
            stack--;
        }

    }


    //双线程
    // var _task_piceA=[];
    // var _task_piceB=[];
    // for (let i = 0; i < tasks.length; i++)
    // {
    //     if (i%2 ==0)
    //     {
    //         _task_piceB.push(tasks[i]);
    //     }else
    //     {
    //         _task_piceA.push(tasks[i]);
    //     }
    // }
    //
    // _do_tasks(_task_piceA);
    // _do_tasks(_task_piceB);


    function _do_tasks(_tasks)
    {
        let promises = [];
        for (let i = 0; i < _tasks.length; i++)
        {
            if (i == 0)
            {
                promises[0] = new Promise(_tasks[0])
            }
            else
            {
                promises[i] = new Promise(function (resolve, reject)
                {
                    promises[i - 1].then(function () {_tasks[i](resolve, reject);})
                })
            }
        }
    }

}


window.minimize = ()=>
{
    ipcRenderer.send('minimize');
}

window.exit = ()=>
{
    let temp = os.tmpdir(); //"C:\Users\nullice\AppData\Local\Temp"
    temp = path.join(temp, "limitPNG_temp");
    fsex.removeSync(temp)

    ipcRenderer.send('exit');
}


var _select_out_op = false;


window.select_out_blur = ()=>
{
    if (_select_out_op = true)
    {
        _select_out_op = false;
    }
}

window.select_out = ()=>
{
    if (_select_out_op)
    {
        var s = document.getElementById("outFile");
        if (s.selectedIndex == 2)
        {
            dialog.showOpenDialog(
                {title: "选择输出文件夹", defaultPath: v.our_dir, properties: ["openDirectory"]},
                (e)=>
                {
                    if (e != undefined && e.length > 0)
                    {

                        s[2].text = "输出到：" + e[0];
                        s[2].value = e[0]
                        v.out = e[0];
                    }
                }
            )
        }
    }

    _select_out_op = !_select_out_op;

}


window.openUrl = function (url)
{
    console.log(url)
    shell.openExternal(url);
}


