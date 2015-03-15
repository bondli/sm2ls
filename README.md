# sm2ls
seajs module to localstorage

# usage

```
<script src="{path for seajs}/sea.js"></script>
<script src="{path for seajsplugin}/seajs-localstorage.js"></script>
```

```
<script>
window.enableSM2LS = true; //强制开启或强制关闭
basePath = './0.0.1/';
seajs.config({base: basePath});
</script>
```

```
<script>
    seajs.use('test/index');
</script>
```