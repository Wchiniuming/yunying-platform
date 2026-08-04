@echo off
echo Huang Xiaoshuai - Clear Test Data
echo.
node -e "import('node:sqlite').then(m=>{const{DatabaseSync}=m;const p=(process.env.USERPROFILE||'').replace(/\\/g,'/')+'/AppData/Roaming/data/huangxiaoshuai.db';const db=new DatabaseSync(p);const del=t=>{try{db.prepare('DELETE FROM '+t).run()}catch(e){console.log('skip:',t,e.message)}};del('order_status_log');del('orders');del('customers');const o=db.prepare('SELECT COUNT(*) as c FROM orders').get().c;const c=db.prepare('SELECT COUNT(*) as c FROM customers').get().c;console.log('Orders remaining:',o);console.log('Customers remaining:',c);db.close()}).catch(e=>{console.error('ERROR:',e.message);process.exit(1)})"
pause
