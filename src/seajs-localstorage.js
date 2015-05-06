(function () {

    //是否线上模式
    var isOnline = ~window.location.hostname.indexOf('h5.m.') ? true : false;

    //是否日常环境，日常环境是去缓存化的
    var isDaily = ~window.location.hostname.indexOf('waptest.tao') ? true : false;

    var isEnable = isOnline;

    //当前的页面URL
    var curHref = window.location.href;
    var curPage = curHref;
    if(curHref.indexOf('?')>-1){
        curPage = curHref.substring(0, curHref.indexOf('?'));
    }

    //是否执行了版本检查
    var isChecked = false;

    //是否需要更新版本
    var isUpdated = false;

    //当前的版本号
    var curVersion;

    //之前的版本号
    var lastVersion = getLastVersion();

    //从来就没有设置到版本号
    if(!lastVersion){
        isUpdated = true;
    }

    if(!('localStorage' in window) || !('slice' in [])) {
        return;
    }

    /**
     * 保存到localstorage
     * @param  {[type]} uri     [description]
     * @param  {[type]} dataUri [description]
     * @return {[type]}         [description]
     */
    function save(uri, dataUri) {
        //防止重复保存
        var d = localStorage.getItem('seajsmodule<' + uri + '>');
        if(d && d.length > 0) {
            //使用次数加1
            isUpdated && updateModuleUsed(uri, 1);
            return false;
        }

        try{
            dataUri = dataUri.toString();
            localStorage.setItem(
                'seajsmodule<' + uri + '>',
                encodeURI('data:text/javascript;charset=utf-8,define(' + dataUri + ');')
            );

            //使用次数置为1
            updateModuleUsed(uri, 0);

            return true;
        }
        catch(oException){
            //存储失败了就清除所有的
            localStorage.clear();
        }
    }

    /**
     * 更新模块被使用的次数
     * @param  {[type]}  uri   [description]
     * @param  {Boolean} addNums [description]
     * @return {[type]}        [description]
     */
    function updateModuleUsed(uri, addNums) {
        var key = 'seajsmused<'+ uri + '>';

        if(addNums === 0){ //初始化
            localStorage.setItem(key, 1);
        }
        else{
            var v = localStorage.getItem(key);
            if(v){
                v = parseInt(v, 10) + addNums;
                if(v === 0){ //使用次数为0时删除
                    localStorage.removeItem(key);
                    localStorage.removeItem('seajsmodule<'+ uri + '>');
                }
                else {
                    localStorage.setItem(key, v);
                }
            }
        }

    }

    /**
     * 从localstorage取数据
     * @param  {[type]} uri [description]
     * @return {[type]}     [description]
     */
    function load(uri) {
        if( typeof(window.enableSM2LS) != 'undefined' ){
            isEnable = window.enableSM2LS;
        }
        if(isEnable){
            var dataUri = localStorage.getItem('seajsmodule<' + uri + '>');
            if(dataUri && dataUri.length > 0) {
                return dataUri;
            } else {
                return uri;
            }
        }
        return uri;

    }

    /**
     * 从localstorage删除缓存
     * @param  {[type]} uri [description]
     * @return {[type]}     [description]
     */
    function del(uri) {
        //如果版本更新了，需要删除原来的缓存,这里只做使用次数的更新即可
        if( isUpdated ) {
            var lastKey = uri.replace(curVersion, lastVersion);
            //localStorage.removeItem('seajsmodule<' + lastKey + '>');
            updateModuleUsed(lastKey, -1);
        }
    }

    /**
     * 获取上次的页面版本
     * @return {[type]} [description]
     */
    function getLastVersion() {
        return localStorage.getItem('seajspage<'+ curPage + '>') || '';
    }

    /**
     * 设置当前的版本号
     * @return {[type]} [description]
     */
    function saveVersion(v) {
        if( typeof(window.enableSM2LS) != 'undefined' ){
            isEnable = window.enableSM2LS;
        }
        if(isEnable){
            localStorage.setItem('seajspage<'+ curPage + '>', v);
        }
    }

    /**
     * 检测本地缓存是否最新
     * @param  {[type]} uri [description]
     * @return {[type]}     [description]
     */
    function latestSource(uri) {
        //没有检查就做一次检查
        if( !isChecked ){
            var cv = uri.match(/\d+\.\d+\.\d+/);
            if(cv && cv.length){
                curVersion = cv[0];

                //设置过版本号，但不是最新的
                if(lastVersion && lastVersion != curVersion){
                    isUpdated = true;
                }
            }

            //设置当前的版本
            if( isUpdated ){
                saveVersion(curVersion);
            }

        }
        isChecked = true;

        return load(uri);
    }

    var oldRequest = seajs.request;
    seajs.request = function (url, callback, charset) {

        if(!/\.css(?:\?|$)/i.test(url)) {
            var cacheUri = latestSource(url);
            if(cacheUri && cacheUri.length > 0) {
                url = cacheUri;
            }
            //daily环境(或者不是线上的禁用LS时)去缓存化
            if(isDaily || (!isOnline && window.enableSM2LS == false)){
                url += '?t='+ (new Date().getTime());
            }
            //daily环境也可以启用缓存，用于刷新页面debugJS
            if(isDaily && window.enableCache === true){
                url = cacheUri;
            }
        }
        return oldRequest.apply(this, Array.prototype.slice.call(arguments));
    };

    var oldExec = seajs.Module.prototype.exec;
    seajs.Module.prototype.exec = function () {
        if( typeof(window.enableSM2LS) != 'undefined' ){
            isEnable = window.enableSM2LS;
        }

        if(isEnable && this.uri && this.factory && !/\.css(?:\?|$)/i.test(this.uri)) {
            del(this.uri);
            save(this.uri, this.factory.toString());
        }

        return oldExec.apply(this, Array.prototype.slice.call(arguments));
    }

})();
