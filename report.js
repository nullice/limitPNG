/**
 * Created by bgllj on 2016/6/8.
 */



window.getLog = function ()
{
    let log = `<table> <tr>
        <th>文件名</th>
        <th>路径</th>
        <th>原大小</th>
        <th>新大小</th>
        <th>模式</th>
        <th>减少大小</th>
        <th>减少比例</th>
        <th>耗时</th>
        <th>处理日志</th>
        <th>错误</th>
</tr>`;

    let zs0 = v.list_size_old;
    let zs1 = v.list_size_new;
    let ts = 0;
    for (let i = 0; i < v.list.length; i++)
    {
        let z0 = v.list[i].size_old;
        let z1 = v.list[i].size_new;
        let t = (v.list[i].time_consum / 1000).toFixed(1);
        ts = +ts + +t;

        log = log + `<tr>
        <td>${v.list[i].name}</td>
        <td class="log">${v.list[i].path}</td>
        <td>${filter_file_size(z0)} (${z0} B)</td>
        <td>${filter_file_size(z1)} (${z1} B)</td>
        <td> [${v.mode}] </td>
        <td>${filter_file_size(z1 - z0)}(${z1 - z0} B)</td>
        <td>${filter_file_size_pre(z1 / z0)}</td>
        <td>${t} s</td>
        <td class="log">${v.list[i].log}</td>
        <td>${v.list[i].error_info}</td>
        </tr> \n`
    }

    log = log + `<tr>
        <td>总计</td>
        <td> ${v.list.length }个文件</td>
        <td>${filter_file_size(zs0)} (${zs0} B)</td>
        <td>${filter_file_size(zs1)} (${zs1} B)</td>
        <td>线程数：${v.thread}  </td>
        <td>${filter_file_size(zs1 - zs0)}(${zs1 - zs0} B)</td>
        <td>${filter_file_size_pre(zs1 / zs0)}</td>
        <td>累计：${ts} s</td>
        <td >实际耗时： ${(v.time / 1000).toFixed(1)} s, 平均耗时：${(v.time / 1000 / v.list.length).toFixed(1)}s </td>
        <td></td>
        </tr> \n`

    log = log + " </table>";


    return log;
}


window.outLogHtml = function ()
{
    let log = getLog();
    let temp = os.tmpdir(); //"C:\Users\nullice\AppData\Local\Temp"
    temp = path.join(temp, "limitPNG_temp", "Report-limitPNG.html");


    let html = `
    <!DOCTYPE html>
        <html lang="zh-CN">
        <head>
	<title>limitPNG 处理报告</title>
    </head>
    <body>

<style>

	table {
    width: 95%;
    position: absolute;
    left: 0;
    right: 0;
    margin: auto;
        font-family: "微软雅黑";
    font-size: 14px;
}
 thead,  tr {
border-top-width: 1px;
border-top-style: solid;
border-top-color: rgb(233, 236, 236);
}
 {
border-bottom-width: 1px;
border-bottom-style: solid;
border-bottom-color: rgb(233, 236, 236);
}
 td,  th {
padding: 5px 10px;
font-family: Verdana;
color:rgb(55, 100, 128);
}

 tr:nth-child(even) {
background: rgb(233, 236, 236);
}
 tr:nth-child(odd) {
background: #FFF
}
.log{font-size: 8px;}
</style>
        ${log}
    </body>
    </html>
    `;
    fs.writeFileSync(temp, html, 'utf8');
    shell.openExternal(temp);

    return html
}


var _out_log_try_z = 0;
window.out_log_try = function ()
{
    _out_log_try_z++;
    if (_out_log_try_z >= 2)
    {
        outLogHtml();
        _out_log_try_z = 0;
    } else
    {

        _out_log_try_z + 1;
    }

}

window.fileCompare = function ()
{
    function sortList(list, sortBy)
    {
        return list.sort(function (a, b)
        {
            return a[sortBy] - b[sortBy];
        });
    }

    dialog.showOpenDialog(
        {title: "对比文件大小 - 第一个选中的被认为是原图", properties: ["openFile", "multiSelections"]},
        (files)=>
        {
            if (files != undefined && files.length > 0)
            {

                var log = `<table> <tr>
                            <th>排名</th>
                            <th>文件名</th>
                            <th>大小</th>
                            <th>减少大小</th>
                            <th>减少比例</th>        
                            </tr>`;

                var orgSize = 0;

                var ranks = [];

                for (let i = 0; i < files.length; i++)
                {
                    let stat = fs.statSync(files[i])
                    let z0 = stat.size;
                    if (i == 0)
                    {
                        orgSize = z0;
                        log = log + `<tr class="org">
                            <td>原图</td>
                                <td>${path.basename(files[i])}</td>
                                <td>${filter_file_size(z0)} (${z0} B)</td>
                                <td></td>
                                <td></td>
                                </tr> \n`
                    } else
                    {
                        ranks.push( {
                            size: z0, html: `
                                <td>${path.basename(files[i])}</td>
                                <td>${filter_file_size(z0)} (${z0} B)</td>
                                <td>${filter_file_size(orgSize - z0)} (${orgSize - z0} B)</td>
                                <td>${filter_file_size_pre(z0 / orgSize)}</td>
                                </tr> \n`
                        })
                    }
                }
                console.log(ranks);
                sortList(ranks, "size");
                console.log(ranks);
                for (let i = 0; i < ranks.length; i++)
                {
                    if(i==0)
                    {
                        log = log + `<tr class="cp_no1"><td>${i + 1}</td> `
                    }else
                    {
                        log = log + `<tr><td>${i + 1}</td> `
                    }

                    log = log + ranks[i].html;
                }

                log = log + " </table>";
                if(ranks.length>2)
                {
                    log = log + `<div class="cp_vs"> 第一名比第二名减少 ${filter_file_size(ranks[1].size - ranks[0].size)}(${ranks[1].size - ranks[0].size} B), 减少比例：${filter_file_size_pre(ranks[0].size / ranks[1].size)}</div>`

                }


                //-----out
                let temp = os.tmpdir(); //"C:\Users\nullice\AppData\Local\Temp"
                temp = path.join(temp, "limitPNG_temp", "Compare-Report-limitPNG.html");


                let html = `
    <!DOCTYPE html>
        <html lang="zh-CN">
        <head>
	<title>limitPNG 文件比较</title>
    </head>
    <body>

<style>

div.cp_vs {
    position: relative;
    padding: 40px;
    color: #28848E;
}

	table {
    width: 95%;
 
    left: 0;
    right: 0;
    margin: auto;
        font-family: "微软雅黑";
    font-size: 14px;
}
 thead,  tr {
border-top-width: 1px;
border-top-style: solid;
border-top-color: rgb(233, 236, 236);
}
 {
border-bottom-width: 1px;
border-bottom-style: solid;
border-bottom-color: rgb(233, 236, 236);
}
 td,  th {
padding: 5px 10px;
font-family: Verdana;
color:rgb(55, 100, 128);
}

 tr:nth-child(even) {
background: rgb(233, 236, 236);
}
 tr:nth-child(odd) {
background: #FFF
}
.log{font-size: 8px;}

tbody tr.org td {
    color: #FAFFFF;
}
tbody tr.org {
    background: rgb(61, 169, 181);
    color: #A9A9A9;
}

tbody tr.cp_no1 {
    background: #BDE8E8;
}
</style>
        ${log}
    </body>
    </html>
    `;
                fs.writeFileSync(temp, html, 'utf8');
                shell.openExternal(temp);

                return html


            }
        }
    )
}