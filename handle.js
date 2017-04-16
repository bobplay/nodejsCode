var http = require('http'),
    fs = require('fs')
url = require('url'),
    superagent = require('superagent'),
    cheerio = require('cheerio'),
    async = require('async'),
    eventproxy = require('eventproxy');
var ep = new eventproxy(),
    urlsArray = [],
    pageUrls = [],
    pageNum = 2,
    fileNum = 0;
//获取到的url放置在数组中
for (var i = 0; i <= pageNum; i++) {
    // http://www.cnblogs.com/#p3
    // http://www.cnblogs.com/?CategoryId=808&CategoryType=%22SiteHome%22&ItemListActionName=%22PostList%22&PageIndex=16&ParentCategoryId=0
    pageUrls.push('http://www.cnblogs.com/?CategoryId=808&CategoryType=%22SiteHome%22&ItemListActionName=%22PostList%22&PageIndex=' + i + '&ParentCategoryId=0');
}


function start() {
    function onRequest(req, res) {
        //遍历所有文章列表
        // pageUrls.forEach(function(pageUrl) {
        //     superagent.get(pageUrl)
        //         .end(function(err, pres) {
        //             var $ = cheerio.load(pres.text)
        //             var curPageUrls = $('.titlelink');
        //             for (var i = 0; i < curPageUrls.length; i++) {
        //                 var articleUrl = curPageUrls[i].attr('href')
        //                 urlsArray.push(articleUrl);
        //                 // 相当于一个计数器
        //                 ep.emit('BlogArticleHtml', articleUrl);
        //             }
        //         })
        // });

        pageUrls.forEach(function(pageUrl) {
            superagent.get(pageUrl)
                .end(function(err, pres) {
                    // pres.text 里面存储着请求返回的 html 内容，将它传给 cheerio.load 之后
                    // 就可以得到一个实现了 jquery 接口的变量，我们习惯性地将它命名为 `$`
                    // 剩下就都是利用$ 使用 jquery 的语法了
                    var $ = cheerio.load(pres.text);
                    var curPageUrls = $('.titlelnk');
                    for (var i = 0; i < curPageUrls.length; i++) {
                        var articleUrl = curPageUrls.eq(i).attr('href');
                        urlsArray.push(articleUrl);
                        // 相当于一个计数器
                        ep.emit('BlogArticleHtml', articleUrl);
                    }

                });
        });
        // ep.after('BlogArticleHtml', pageUrls.length * 20, function(articleUrls) {
        // 当所有 'BlogArticleHtml' 事件完成后的回调触发下面事件
        // ...

        // console.log(12)
        //     // var newArr = [];
        //     // console.log(urlsArray.length)
        //     // for (var i = 0; i < urlsArray.length; i++) {
        //     //     if (newArr.indexOf(urlsArray[i]) == -1) {
        //     //         newArr.push(urlsArray[i])
        //     //     }
        //     // }400多个链接差不多有800个链接是重复的,数额比较小不影响
        //     // console.log(newArr.length)
        // for (var i = 0; i < articleUrls.length; i++) {
        //     res.write(articleUrls[i])
        // }
        // res.end()
        // });
        ep.after('BlogArticleHtml', pageUrls.length * 20, function(articleUrls) {
            // 当所有 'BlogArticleHtml' 事件完成后的回调触发下面事件
            // 控制并发数
            var curCount = 0;
            var reptileMove = function(url, callback) {
                //延迟毫秒数
                var delay = parseInt((Math.random() * 30000000) % 1000, 10);
                curCount++;
                // console.log('现在的并发数是', curCount, '，正在抓取的是', url, '，耗时' + delay + '毫秒');

                superagent.get(url)
                    .end(function(err, sres) {
                        // sres.text 里面存储着请求返回的 html 内容
                        var $ = cheerio.load(sres.text);

                        // 收集数据
                        // 拼接URL
                        var currentBlogApp = url.split('/p/')[0].split('/')[3],
                            appUrl = "http://www.cnblogs.com/mvc/blog/news.aspx?blogApp=" + currentBlogApp;
                        // 具体收集函数
                        personInfo(appUrl);


                    });

                function personInfo(appUrl) {
                    superagent.get(appUrl)
                        .end(function(err, sres) {

                            fs.writeFile('./artical' + fileNum + '.html', sres.text, function(err) {
                                if (err) throw err;
                                console.log('写入成功')
                                fileNum++;
                            })
                        })
                }

                setTimeout(function() {
                    curCount--;
                    callback(null, url + 'Call back content');
                }, delay);

            };

            // 使用async控制异步抓取 	
            // mapLimit(arr, limit, iterator, [callback])
            // 异步回调
            async.mapLimit(articleUrls, 5, function(url, callback) {
                reptileMove(url, callback);
            }, function(err, result) {
                // 4000 个 URL 访问完成的回调函数
                // ...
                // res.end(result.join(''))


            });
        });
    }
    http.createServer(onRequest).listen(3000);
}
exports.start = start;