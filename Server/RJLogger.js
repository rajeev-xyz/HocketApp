/**
Author: rajeev.jayaswal
Uses:
    rjLogger = require('./RJLogger');
    rjLogger.setFile('test.tsv');//optional
    rjLogger.log("This is custom message");
    rjLogger.log("This msg to log with IP Address");
*/
const ipInfo = require("ipinfo");
var fs = require('fs'),
    package = require('./package.json');

var log_file = package.name + "_logs.tsv" || 'logs.tsv';

module.exports = {
    setFile: function (logFile) {
        log_file = logFile;
    },

    log: function (msg, req) {
        var req = typeof req !== 'undefined' ? req : '';
        var msg = typeof msg !== 'undefined' ? msg : '';
        var logHeader = "Date\tMessage\t";

        //put header if file created is new
        ipLog = {
            ip: '',
            hostname: '',
            city: '',
            region: '',
            country: '',
            loc: '',
            org: '',
            postal: ''
        };
        if(!fs.existsSync(log_file)) {

            for(key in ipLog) {
                if(ipLog.hasOwnProperty(key)) {
                    logHeader += key + '\t';
                }
            }
            logHeader += '\n';
            fs.appendFile(log_file, logHeader, function (err) {
                if(err)
                    console.log(date + '\t' + ip + '\t' +
                        "error occured while creating header in log file\t" + err.toString());
            });
        }
        var date = module.exports.getDate(new Date());
        var log = date + '\t' + msg + '\t';

        var ip = '';
        //If req is passed - get ip in log
        if(req != '') {
            ip = req.ip || req.headers['x-forwarded-for'] || req.connection.remoteAddress ||
                req.socket.remoteAddress || req.connection.socket.remoteAddress;
        }

        ipInfo(ip, function (err, data) {

           if (!err)
            ipLog = {
                ip: data.ip,
                hostname: data.hostname,
                city: data.city,
                region: data.region,
                country: data.country,
                loc: data.loc,
                org: data.org,
                postal: data.postal
            }

            if(!err && req != '') {
                for(var key in ipLog) {
                    if(ipLog.hasOwnProperty(key)) {
                        log += ipLog[key] + '\t';
                    }
                }
            }
            log += '\n';

            console.log(JSON.stringify(data));
            //putting it after callback completes
            fs.appendFile(log_file, log, function (err) {
                if(err)
                    console.log(date + '\t' + ip + '\t' +
                        "error occured while writing data on logs\t" + err.toString());
            });
        });

    },

    getDate: function (d) {
        dformat = [d.getMonth() + 1, d.getDate(), d.getFullYear()].join('/') + ' ' + [d.getHours(), d.getMinutes(),
            d.getSeconds()
        ].join(':');
        //=> dformat => '5/17/2012 10:52:21'
        return dformat;
    }
}
