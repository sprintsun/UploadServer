var express = require ('express');
var fs = require('fs');
var mkdirp = require('mkdirp');
var sysPath = require('path');
var multer = require ('multer');
var log4js = require('log4js');
var app = express();
var ALLOW_KEYS = ['kami'];

// 日志监控
log4js.configure('log4js.json', {});
var logger = log4js.getLogger('service');
logger.setLevel('DEBUG');
app.use(function(req, res, next){
    logger.debug('%s %s', req.method, req.ip + req.url);
    next();
});

var uploader = multer({
    dest: './source/',
    rename: function(fieldName, fileName) {
        return fileName;
    },
    onFileUploadStart: function(file, req) {
        var query = req.query;
        if (query && query.path) {
            var path = query.path,
                key = path.split('/')[0];
            if (ALLOW_KEYS.indexOf(key) > -1) {
                return true;
            }
        }
        logger.warn(file.fieldname + ' upload fail!');
        return false;
    },
    onFileUploadComplete: function (file) {
        logger.debug(file.fieldname + ' uploaded to  ' + file.path);
    },
    changeDest: function(dest, req) {
        var query = req.query;
        if (query && query.path) {
            var path = req.query.path,
                key = path.split('/')[0],
                realPath = sysPath.join(dest, path);
            if (ALLOW_KEYS.indexOf(key) > -1) {
                if (!fs.existsSync(realPath)) {
                    mkdirp.sync(realPath);
                }
            }

            return realPath;
        }
        return dest;
    }
});

// 类型判断, map类型文件默认返回修改成application/octet-stream
express.static.mime.define({"application/octet-stream": ["map"]});

// 静态服务
app.use(express.static(sysPath.join(__dirname, 'views')));

// Uploader API
app.post('/upload', uploader, function(req, res) {
    // TODO 上传失败
    res.json({
        success: true
    });
});


app.listen(8888);
logger.info("Server runing at port: " + 8888);