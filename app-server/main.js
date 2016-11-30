const port = 7903;
const pathAppClientRoot = 'app-client';
const folderOfAppClientBuild = 'build-dev';


const path = require('path');
const express = require('express');
const app = express();


const pathAppClientBuild = path.join(__dirname, '..', pathAppClientRoot, folderOfAppClientBuild);

app.use(express.static(pathAppClientBuild));

const server = app.listen(port, function () {
  let host = server.address().address;
  const port = server.address().port;

  if (host=='::') host = 'localhost';

  console.log('本地资源目录： ', pathAppClientBuild);
  console.log('服务器访问地址： http://%s:%s', host, port);
});