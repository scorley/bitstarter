#!/usr/bin/env node
/*
Automatically grade files for the presence of specified HTML tags/attributes.
Uses commander.js and cheerio. Teaches command line application development and basic DOM parsing.

References:

+ cheerio
   - https://github.com/MatthewMueller/cheerio
   - http://encosia.com/cheerio-faster-windows-friendly-alternative-jsdom
   - http://maxogden.com/scraping-with-node.html
   
+ commander.js
   - https://github.com/visonmedia/commander.js
   - http://tjholawaychuk.com/post/9103188408/commander-js-nodejs-commandline-interfaces-made-easy
   
+ JSON
   - http://en.wikipedia.org/wiki/JSON
   - https://developer.mozilla.org/en-US/docs/JSON
   - https://developer.mozilla.org/en-US/docs/JSON#JSON_in_Firefox_2
   
*/
var fs = require('fs');
var program = require('commander');
var cheerio = require('cheerio');
var Sync = require('sync');
var HTMLFILE_DEFAULT = "index.html";
var TMP_REMOTE_HTMLFILE = "temp-index.html";
var CHECKSFILE_DEFAULT = "checks.json";

var assertFileExists = function(infile) {
    var instr = convertToString(infile);
    if (!fs.existsSync(instr)) {
        console.log("%s does not exist. Exiting.", instr);
        process.exit(1); // http://nodejs.org/api/process.html#process_process_exit_code
    }
    return instr;
};

var convertToString = function(param) {
    return param.toString();
};

var cheerioHtmlFile = function(htmlfile) {
    return cheerio.load(fs.readFileSync(htmlfile));
};

var loadChecks = function(checksfile) {
    return JSON.parse(fs.readFileSync(checksfile));
}; 

var checkHtmlFile = function(htmlfile, checksfile) {
   $ = cheerioHtmlFile(htmlfile);
   var checks = loadChecks(checksfile).sort();
   var out = {};
   for (var ii in checks) {
       var present = $(checks[ii]).length > 0;
       out[checks[ii]] = present;
   }
   return out;
};

var gradeHtml = function(htmlfile, checkfile) {
    var checkJson = checkHtmlFile(htmlfile, checkfile);
    var outJson = JSON.stringify(checkJson, null, 4);
    console.log(outJson);
}

var clone = function(fn) {
    // Workaround for commander.js issue.
    // http://stackoverflow.com/a/6772648
    return fn.bind({});
};

if (require.main == module) {
    program
        .option('-c. --checks <check_file>', 'Path to checks.json', clone(assertFileExists), CHECKSFILE_DEFAULT)
        .option('-f, --file <html_file>', 'Path to index.html', clone(assertFileExists), HTMLFILE_DEFAULT)
        .option('-u, --url <url>', 'Url to index.html', clone(convertToString), '')
        .parse(process.argv);
    var fileName = program.url ? TMP_REMOTE_HTMLFILE : program.file;
    console.log("using file " + fileName);
    if (program.url) {
       require("restler").get(program.url).on('complete', function(result, response) {
          if (result instanceof Error) {
             console.log("Issue accessing %s. Exiting", program.url);
             process.exit(1);
          } else {
             fs.writeFileSync(TMP_REMOTE_HTMLFILE, result);
             gradeHtml(TMP_REMOTE_HTMLFILE, program.checks);
          }
       });
    } else {
       gradeHtml(program.file, program.checks);
    }
} else {
    exports.checkHtmlFile = checkHtmlFile;
}
