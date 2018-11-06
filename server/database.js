var sqlite3 = require('sqlite3').verbose();
var db = new sqlite3.Database('./db/sessions.db',function() {
  db.run("create table message(id integer primary key autoincrement not null,from_user char(11) not null,to_user char(11) not null,message text not null)",function(){
    
    db.run("insert into message values(NULL,'123','321','Message')",function(){
      db.all("select * from message",function(err,res){
        if(!err)
res.forEach((row) => {
    console.log(row.id);
  });
        else
          console.log(err);
      });
    })
    
  });

});