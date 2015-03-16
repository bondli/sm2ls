(function () {

    var isOnline = ~window.location.hostname.indexOf('h5.m.') ? true : false;

    if(!('localStorage' in window) || !('slice' in [])) {
        return ;
    }

    function save(uri, dataUri) {
        //防止重复保存
        var d = localStorage.getItem('seajscache<' + uri + '>');
        if(d && d.length > 0) {
            return false;
        }
        dataUri = dataUri.toString();
        localStorage.setItem('seajscache<' + uri + '>', encodeURI('data:text/javascript;charset=utf-8,define(' + dataUri + ');'));
        return true;
    }

    function load(uri) {
        var dataUri = localStorage.getItem('seajscache<' + uri + '>');
        if(dataUri && dataUri.length > 0) {
            return dataUri;
        } else {
            return uri;
        }
    }

    function getLastVersion() {
        return localStorage.getItem('pageversion') || '';
    }

    function latestSource(uri) {
        // 检测本地缓存是否最新
        var curVersion = uri.match(/\d\.\d\.\d/);
        if(curVersion && curVersion.length){
            curVersion = curVersion[0];
            var lastVersion = getLastVersion();
            if(lastVersion && lastVersion != curVersion){
                //删除原来的localstorage
                var lastKey = uri.replace(curVersion, lastVersion);
                localStorage.removeItem('seajscache<'+ lastKey +'>');
            }
            //设置当前的版本
            localStorage.setItem('pageversion', curVersion);
        }

        return load(uri);
    }

    var oldRequest = seajs.request;
    seajs.request = function (url, callback, charset) {

        if(!/\.css(?:\?|$)/i.test(url)) {
            var cacheUri = latestSource(url);
            if(cacheUri && cacheUri.length > 0) {
                url = decodeURI(cacheUri);
            }
        }
        return oldRequest.apply(this, Array.prototype.slice.call(arguments));
    };

    var oldExec = seajs.Module.prototype.exec;
    seajs.Module.prototype.exec = function () {
        //是否保存到localstorage的条件判断
        var enable = isOnline;
        if( typeof(window.enableSM2LS) != 'undefined' ){
            enable = window.enableSM2LS;
        }
        
        if(enable && this.uri && this.factory && !/\.css(?:\?|$)/i.test(this.uri)) {
            save(this.uri, this.factory.toString().replace(/\r/, '').replace(/\n/, ''));
        }
        return oldExec.apply(this, Array.prototype.slice.call(arguments));
    }

})();
