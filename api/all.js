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

process.env.TZ = 'Asia/bangkok';

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

    let count = 0;
    for (let i = 0; i < sparray(tr.text()).length; i++) {
        if (sparray(tr.text())[i] != sparray(tr2.text())[i]) {
            count++;
        }
    }
    console.log("======")
    console.log(count);
    console.log("======")

    //if count = 1, tr = tr2 and tr2 = $('tbody tr').eq(2)
    if (count == 1) {
        tr = tr2;
        tr2 = $('tbody tr').eq(2);
    }

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

router.get('/', async (req, res) => {
    let data = await getData();
    let newdata = ["", "", "", "", "", "", "", "", "", ""];

    await fetch('https://www.bangchak.co.th/api/oilprice')
        .then(res => res.text())
        .then(body => {
            const $ = cheerio.load(body);

            let arr = $('update_date').text().split('/');

            let year = parseInt(arr[2].substring(0, 4)) - 543;

            let todaydate = new Date(arr[1] + '/' + arr[0] + '/' + year.toString());

            console.log(arr);
            console.log(todaydate);
            //console.log(arr[0])
            //console.log(arr[1])
            //console.log(arr[2])

            //push date/month/year to newdata[0]
            let date = new Date();

            //if todaydate is yesterday
            if (date.getDate() - 1 == todaydate.getDate() && date.getMonth() == todaydate.getMonth() && date.getFullYear() == todaydate.getFullYear()) {
                console.log('yesterday');
                newdata[0] = (date.getDate()).toString().padStart(2, '0') + '/' + (date.getMonth() + 1).toString().padStart(2, '0') + '/' + (date.getFullYear() + 543);
            } else {
                newdata[0] = (date.getDate() + 1).toString().padStart(2, '0') + '/' + (date.getMonth() + 1).toString().padStart(2, '0') + '/' + (date.getFullYear() + 543);
            }

            newdata[1] = $('item').eq(0).find('tomorrow').text();
            newdata[2] = $('item').eq(1).find('tomorrow').text();
            newdata[3] = $('item').eq(2).find('tomorrow').text();
            newdata[4] = $('item').eq(3).find('tomorrow').text();
            newdata[5] = $('item').eq(4).find('tomorrow').text();
            newdata[6] = $('item').eq(5).find('tomorrow').text();
            newdata[7] = $('item').eq(6).find('tomorrow').text();
            newdata[8] = $('item').eq(7).find('tomorrow').text();
            newdata[9] = '-';

            //log every item tag

            /*$('item').each(function(i, elem) {
                console.log($(this).find('type').text());
                console.log($(this).find('today').text());
                console.log($(this).find('tomorrow').text());
                console.log($(this).find('yesterday').text());
            });*/
        });

    console.log(newdata);

    //get count of difference between newdata and data[0]
    let count = 0;
    for (let i = 0; i < newdata.length; i++) {
        if (newdata[i] !== data[0][i]) {
            count++;
        }
    }
    console.log(count);

    //if count > 1, then set data[1] = data[0] and set data[0] = newdata
    if (count > 1) {
        data[1] = data[0];
        data[0] = newdata;
        //subtract data[1] from data[0] and set to data[2]
        data[2] = data[0].map((e, i) => e - data[1][i]);
        //format number to 2 decimal
        data[2] = data[2].map(e => e.toFixed(2));

        var date1 = new Date(data[0][0].substr(3, 2) + '/' + data[0][0].substr(0, 2) + '/' + (parseInt(data[0][0].substr(6, 4)) - 543));
        var date2 = new Date(data[1][0].substr(3, 2) + '/' + data[1][0].substr(0, 2) + '/' + (parseInt(data[1][0].substr(6, 4)) - 543));
        console.log(date1);
        console.log(date2);

        var difftime = Math.abs(date2.getTime() - date1.getTime());
        var diffdays = Math.ceil(difftime / (1000 * 3600 * 24));

        data[2][0] = diffdays + ' วัน';

        //remove last element of data[2]
        data[2].pop();
    }

    res.writeHead(200, { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' });
    //res.write(JSON.stringify(data));
    res.end(JSON.stringify(data));
});

/*router.get('/image', async (req, res) => {

    const browser = await chromium.puppeteer.launch({
        args: [...chromium.args, "--hide-scrollbars", "--disable-web-security"],
        defaultViewport: chromium.defaultViewport,
        executablePath: await chromium.executablePath,
        headless: true,
        ignoreHTTPSErrors: true,
    });

    process.env.PUPPETEER_EXECUTABLE_PATH = await chromium.executablePath;

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
});*/

module.exports = router;
