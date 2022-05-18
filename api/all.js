const express = require("express");
const router = express.Router();
const fetch = (...args) => import('node-fetch').then(({ default: fetch }) => fetch(...args));
const cheerio = require('cheerio');
//var http = require('http');
var fs = require('fs');
const Pageres = require('pageres');
const { redirect } = require("express/lib/response");
//const { parse } = require('querystring');
const chromium = require('chrome-aws-lambda');

process.env.PUPPETEER_EXECUTABLE_PATH = chromium.executablePath;

/*const browser = chromium.puppeteer.launch({
    args: [...chromium.args, "--hide-scrollbars", "--disable-web-security"],
    defaultViewport: chromium.defaultViewport,
    executablePath: await chromium.executablePath,
    headless: true,
    ignoreHTTPSErrors: true,
});*/

async function getData() {
    const response = await fetch('https://www.bangchak.co.th/th/oilprice/historical');
    const body = await response.text();

    //console.log(body);
    const $ = cheerio.load(body);

    //console first tr inside tbody
    const tr = $('tbody tr').first();
    //console.log(tr.text());

    //console.log(sparray(tr.text()));

    //console second tr inside tbody
    const tr2 = $('tbody tr').eq(1);
    //console.log(tr2.text());

    //console.log(sparray(tr2.text()));

    //add sparray tr and tr2 to array
    const arr = [sparray(tr.text()), sparray(tr2.text())];
    //console.log(arr);
    //console.log(arr[0][0]);
    //console.log(arr[1][0]);

    //subtract arr[1] from arr[0]
    const arr2 = arr[0].map((e, i) => e - arr[1][i]);
    //console.log(arr2);

    //get 2 string
    var date1 = new Date(arr[0][0].substr(3, 2) + '/' + arr[0][0].substr(0, 2) + '/' + (parseInt(arr[0][0].substr(6, 4)) - 543));
    var date2 = new Date(arr[1][0].substr(3, 2) + '/' + arr[1][0].substr(0, 2) + '/' + (parseInt(arr[1][0].substr(6, 4)) - 543));
    console.log(date1);
    console.log(date2);

    var difftime = Math.abs(date2.getTime() - date1.getTime());
    var diffdays = Math.ceil(difftime / (1000 * 3600 * 24));

    arr2[0] = diffdays;

    //remove NaN
    const arr3 = arr2.filter(e => !isNaN(e));
    //console.log(arr3);

    //format number to 2 decimal
    const arr4 = arr3.map(e => e.toFixed(2));

    //add วัน to arr4[0]
    arr4[0] = parseInt(arr4[0]) + ' วัน';

    //console.log(arr4);
    return [sparray(tr.text()), sparray(tr2.text()), arr4];
}

function sparray(wow) {
    //split into array by new line
    const arr = wow.split('\n');
    //console.log(arr);

    //remove space in each element
    const arr2 = arr.map(e => e.trim());
    //console.log(arr2);

    //remove empty element
    const arr3 = arr2.filter(e => e !== '');
    //console.log(arr3);
    //return arr3 format json
    return arr3;
}

/*router.get('/', async (req, res) => {
});*/

router.get('/', async (req, res) => {
    await new Pageres({ format: 'png', delay: 2, filename: 'oilprice', launchOptions: {executablePath: await chromium.executablePath, args: ['--no-sandbox', '--disable-setuid-sandbox', '--no-first-run', '--disable-extensions'] } })
        .src('https://boyphongsakorn.github.io/thaioilpriceapi/', ['1000x1000'])
        .dest(__dirname)
        .run();

    console.log('Finished generating screenshots!');

    res.writeHead(200, { 'Content-Type': 'image/png' });
    fs.readFile(__dirname + '/oilprice.png', function (err, data) {
        if (err) throw err;
        res.end(data);
    });
});

module.exports = router;