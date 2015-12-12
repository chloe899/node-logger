


var Log = require('log');
var util = require('util');

function padZero(number) {
    var n = String(number);
    if (number < 10) {
        return '0' + n;
    } else {
        return n;
    }
}

function pad2Zeros(number) {
    var n = String(number);
    if (number < 10) {
        return '00' + n;
    } else if (number < 100) {
        return '0' + n;
    } else {
        return n;
    }
}

var tz = new Date().toString().split(' ')[5];

function getDate() {
    var now = new Date();
    return now.getFullYear() + '-' + padZero(now.getMonth() + 1) + '-' + padZero(now.getDate()) + ' ' + tz + ' ' +
        padZero(now.getHours()) + ':' + padZero(now.getMinutes()) + ':' + padZero(now.getSeconds()) + '.' + pad2Zeros(now.getMilliseconds());
}



var levelsDecor =
{
    'EMERGENCY': ['EMERGENCY', 31],
    'ALERT': ['ALERT    ', 32],
    'CRITICAL': ['CRITICAL ', 36],
    'ERROR': ['ERROR    ', 35],
    'WARNING': ['WARNING  ', 34],
    'NOTICE': ['NOTICE   ', 30],
    'INFO': ['INFO     ', 33],
    'DEBUG': ['DEBUG    ', 37]
};

function getMessage(msg) {
    // console.log(msg)
    if (typeof msg == 'string') {
        //var arr = Array.prototype.slice.apply(arguments,[0]);
        //msg = util.format.apply(null,arr);
        return msg;
    }
    else {
        return util.inspect(msg, {depth:null});
    }
}


function LogExt(logInstance, theirModule) {
    this.logger = logInstance;
    // this.theirModule = theirModule;
    // this.theirClass = getClass(theirModule);
};

LogExt.prototype = {
    log: function (levelStr, args) {
        var prefix = this._getLineInfo();
        this.logOrig(levelStr, prefix + ' - ', args);
    },

    logOrig: function (levelStr, prefix, args) {
        if (Log[levelStr] <= this.logger.level) {
            var i = 1;
            var orig_msg = getMessage(args[0]);
            var msg = orig_msg.replace(/%s/g, function () {
                return getMessage(args[i++]);
            });
            msg = prefix + msg;
            var decor = levelsDecor[levelStr];
            this.logger.stream.write(
                '\x1B[' + decor[1] + 'm'
                +
                '[' + getDate() + ']'
                + '\x1B[' + decor[1] + 'm'
                + msg
                + '\x1B[0m\n'
            );
        }
    },


    _getFilePath: function (stackLine) {
        if (this.fileInfo) {
            return this.fileInfo;
        }
        var fileInfo = stackLine.replace(/^    at /, '');
        fileInfo = fileInfo.replace(/^[^(]+\(([^)]+)\)/, '$1');
        fileInfo = fileInfo.split(':')[0];
        fileInfo = fileInfo.replace(process.cwd(), '.');
        this.fileInfo = fileInfo;
        return this.fileInfo;
    },

    _getLineInfo: function () {
        var error = new Error();
        var stackLine = error.stack.split('\n')[4];
        var fileInfo = this._getFilePath(stackLine);
        return fileInfo + ':' + stackLine.split(':')[1];
    }
};

LogExt.prototype.__proto__ = Log.prototype;



exports.getLogger = function (level, stream) {
    return new LogExt(new Log(level, stream));
};