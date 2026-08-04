@echo off
chcp 65001 >nul
node -e "import('node:sqlite').then(m=>{
const{DatabaseSync}=m;
const p=(process.env.USERPROFILE||'').replace(/\\/g,'/')+'/AppData/Roaming/data/huangxiaoshuai.db';
console.log('DB:',p);
const db=new DatabaseSync(p);

// 先查各类别标签
const tags=db.prepare('SELECT id,name,category FROM tags').all();
console.log('现有标签:');
tags.forEach(t=>console.log(' ',t.id,t.name,t.category));

// 删除 status 和 customer 类别
const del=db.prepare(\"DELETE FROM tags WHERE category IN ('status','customer')\");
const r=del.run();
console.log('已删除标签:',r.changes,'条');

// 清理孤立关联数据（可选）
const ot=db.prepare(\"DELETE FROM order_tags WHERE tag_id NOT IN (SELECT id FROM tags)\").run();
const ct=db.prepare(\"DELETE FROM customer_tags WHERE tag_id NOT IN (SELECT id FROM tags)\").run();
console.log('清理 order_tags 孤立记录:',ot.changes);
console.log('清理 customer_tags 孤立记录:',ct.changes);

db.close();
console.log('完成');
}).catch(e=>{console.error('ERROR:',e.message)})"
pause
