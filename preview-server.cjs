const http = require('node:http');
const fs = require('node:fs');
const path = require('node:path');
const root = __dirname;
const types = {'.html':'text/html; charset=utf-8','.css':'text/css','.js':'text/javascript','.png':'image/png','.jpg':'image/jpeg','.webp':'image/webp','.mp4':'video/mp4','.ttf':'font/ttf','.woff2':'font/woff2'};
http.createServer((req,res)=>{
 let name;try{name=decodeURIComponent(new URL(req.url,'http://localhost').pathname);}catch{res.writeHead(400).end();return;}
 if(name==='/')name='/index.html';
 const file=path.resolve(root,'.'+name);
 if(!file.startsWith(root+path.sep)||name.split('/').some(p=>p.startsWith('.'))||!types[path.extname(file)]){res.writeHead(404).end();return;}
 fs.stat(file,(err,stat)=>{
  if(err||!stat.isFile()){res.writeHead(404).end();return;}
  let start=0,end=stat.size-1,status=200;
  if(req.headers.range){
   const match=/^bytes=(\d+)-(\d*)$/.exec(req.headers.range);
   if(!match){res.writeHead(416,{'Content-Range':`bytes */${stat.size}`}).end();return;}
   start=Number(match[1]);end=match[2]?Math.min(Number(match[2]),end):end;
   if(start>end||start>=stat.size){res.writeHead(416,{'Content-Range':`bytes */${stat.size}`}).end();return;}
   status=206;
  }
  const headers={'Content-Type':types[path.extname(file)],'Content-Length':end-start+1,'Accept-Ranges':'bytes','Cache-Control':'no-cache'};
  if(status===206)headers['Content-Range']=`bytes ${start}-${end}/${stat.size}`;
  res.writeHead(status,headers);
  if(req.method==='HEAD'){res.end();return;}
  const stream=fs.createReadStream(file,{start,end});stream.on('error',()=>res.destroy());res.on('close',()=>stream.destroy());stream.pipe(res);
 });
}).listen(4173,'127.0.0.1',()=>console.log('Local: http://127.0.0.1:4173/'));
