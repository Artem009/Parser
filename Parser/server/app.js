var express = require('express');
var app = express();
const https = require("https");
require('chromedriver');

const fs = require('fs');
const path = require('path');
const axios = require('axios');

const makeDir = (dir) => {
    !fs.existsSync(dir) ? fs.mkdirSync(dir):false;
};

const readDir = (path) => {
    return fs.readdirSync(path);
};

function getLinks(url) {
    let arrLinks = [];
    axios.get(url)
        .then(function (response) {
            let content = response.data;
            let arr = content.match(/<a class="filterLink" rel="nofollow"href=\"(.+?)\" data-e2e=\"listing-filter-multi-item\">/g);
            arr.map((item, i, arr) => {
                let link = 'https://www.footpatrol.com' + /<a class="filterLink" rel="nofollow"href=\"(.+?)\" data-e2e=\"listing-filter-multi-item\">/.exec(item)[1];
                link.indexOf("https://www.footpatrol.com/campaign/New+In/brand/") > -1 ? arrLinks.push(link) : false;
            });
            fs.writeFileSync('linksBrand.json', JSON.stringify(arrLinks, null, 4));
        })
        .catch(function (error) {
            console.log(error);
        });
}

function getLinksExamples(){
    makeDir(`brands/`);
    let BrandContentLinks = JSON.parse(fs.readFileSync(path.join('linksBrand.json'), 'utf8'));
    BrandContentLinks.map((url, i, BrandContentLinks) => {
        let nameDir = /brand\/(.+?)\/latest/.exec(url);
        nameDir !== undefined ? nameDir = nameDir[1] : false;
        makeDir(`brands/${nameDir}`);
        axios.get(url)
            .then(function (response) {
                let content = response.data;
                let arr = content.match(/<a class="itemImage" href="(.+?)" data-e2e="product-listing">/g);
                let examplesLinks = [];
                arr.map((item, i, arr) => {
                    let link = /<a class=\"itemImage\" href=\"(.+?)\" data-e2e=\"product-listing\">/.exec(item);
                    link !== undefined ? link = link[1] : false;
                    link = 'https://www.footpatrol.com' + link;
                    examplesLinks.push(link);
                });
                fs.writeFileSync(`brands/${nameDir}/links.json`, JSON.stringify(examplesLinks, null, 4));
            })
            .catch(function (error) {
                console.log(error);
            });
    });
}

function getInformation() {
    const dirs = readDir('brands');
    dirs.map((itemDir, i, dirs) => {
        let links = JSON.parse(fs.readFileSync(path.join(`brands/${itemDir}/links.json`), 'utf8'));
        links.map((item, i, links) => {
            axios.get(item)
                .then(function (response) {
                    let content = response.data;
                    let name = /<h1 itemprop="name" data-e2e="product-name">(.+?)<\/h1>/.exec(content);
                    let img = /<source srcset=\"(.+?)\"/.exec(content);
                    name !== null ? name = name[1] : false;
                    img !== null ? img = img[1] : false;
                    let result = {
                        name: name,
                        url: url,
                        img: img
                    };
                    let allFootwear = fs.existsSync(`brands/${itemDir}/allFootwear.json`) ? fs.readFileSync(path.join(`brands/${itemDir}/allFootwear.json`)) : [];
                    allFootwear.push(result);
                    fs.writeFileSync(`brands/${itemDir}/allFootwear.json`, JSON.stringify(allFootwear, null, 4));
                })
                .catch(function (error) {
                    console.log(error);
                });
        });
    });
}



let url = 'https://www.footpatrol.com/campaign/New+In/?facet:new=latest&sort=latest';
process.env["NODE_TLS_REJECT_UNAUTHORIZED"] = 0;
getLinks(url);
setTimeout(() => { getLinksExamples() }, 5000);
setTimeout(() => { getInformation() }, 15000);


app.listen(3000, function () {
    console.log('Example app listening on port 3000!');
});