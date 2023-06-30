const express = require("express");
const mongoose = require("mongoose");
const bodyParser = require("body-parser");
const _ = require("lodash");

const app = express();
app.set('view engine', 'ejs');
app.use(bodyParser.urlencoded({extended: true}));
app.use(express.static("public"));

/*************************************/
//connect with mongoose
mongoose
.connect('mongodb+srv://mbaris:Baris.2000@cluster0.2xpiv3v.mongodb.net/todolistDB') //todolistDB adında bir database oluştur 
.then(() => console.log("Mongo connected"))
.catch((err) => console.log("Mongo error", err));

//create todolist item schema (yapılacaklar listesine eklenen her bir item)
const itemsSchema = new mongoose.Schema({
  name: String,
})

//***create table(collection) called "Items"
const Item = mongoose.model("Item", itemsSchema);

//Items to the be added to the table(collection)
const item1 = new Item({
  name: "Welcome to your to do list!",
})
const item2 = new Item({
  name: "Hit the + button to add a new item",
})
const item3 = new Item({
  name: "<-- Hit this to delete an item",
})

//default items 
const defaultItems = [item1, item2, item3];

///////////////////////////////////////
//Create schema for http://localhost:3000/blabla
const listSchema = {
  name: String, //title
  items: [itemsSchema] //items, string array
}

//Create table(collection) for http://localhost:3000/blabla
const List = mongoose.model("List", listSchema);

/*************************************/
app.get("/", (req, res) => {
  //when a get request made, find and show the items from database
  Item.find()
  .then((items) => { //***.then()'den sonraki parantez içindekiler döndürülen objectler yani bu durumda (items):compassdeki itemlerin hepsi
    if(items.length === 0){ //only first time insert default items to the table 
      Item.insertMany(defaultItems);
      res.redirect("/"); //refresh the page in order to render in the else part
    }else{
      res.render("list", {listTitle: "Today", newListItems: items}) //after the first time, show all existing items by sending listTitle and newListItems to list.ejs
    }
  })
  .catch((err) => console.log(err));
});

///////////////////////////////////////

//in order to prevent the creation of faviconico document (not important)
app.get('/favicon.ico', (req, res) => res.status(204));

app.get("/:topic", (req, res) => { //http://localhost:3000/blabla
  const customListName= _.capitalize(req.params.topic); //customListName = http://localhost:3000/blabla'deki "blabla"

  List.findOne({name: customListName}) //customListName = http://localhost:3000/blabla 'deki "blabla" adında bir row(document) bul 
  .then((foundDocument) => { //foundDocument = querynin döndürdüğü document(row)
    if(foundDocument === null){ //bu adda bir row(document) yoksa, default list oluştur ve database'e kaydet
      const list = new List({
        name: customListName,
        items: defaultItems
      })
      list.save();
      res.redirect("/" + customListName); //Tekrar bu fonksiyonu çağır ki else kısmına girsin
    }else{ //bu adda bir row(document) varsa, başlığı o documentdeki "name" ve itemleri "items" döndür 
      res.render("list", {listTitle: foundDocument.name, newListItems: foundDocument.items})
    }
  })
})

///////////////////////////////////////
app.post("/", (req, res) => {
  const itemName = req.body.newItem; //eklenecek yazı
  const listName = req.body.list; //listName (title)

  const item = new Item({
    name: itemName,
  })

  //anasayfada (localhost3000)'de misin yoksa diğer sayfalarda mısın bak
  if(listName === "Today"){ 
    item.save();
    res.redirect("/");
  }else{ //other pages 
    //find the list name(title) of the page
    List.findOne({name: listName})
    .then((foundDocument) => {
      foundDocument.items.push(item);
      foundDocument.save();
      res.redirect("/" + listName);
    })
  }
});

app.post("/delete", (req, res) => {
  const checkedItemId = req.body.checkbox; //get the value of checkbox which is an id (give the name, get the value)
  const listName = req.body.listName; //to determine which list, written in list.ejs in the hidden format

  if(listName === "Today"){
    Item.findByIdAndRemove(checkedItemId)
    .then(() => console.log("Succesfully deleted")); //delete that item from the database
    res.redirect("/"); //databaseden silindiği için tekrar "/" 'a yönlendir
  }else{
    List.findOneAndUpdate(
      {name: listName},//document name
      {$pull: {items:{_id: checkedItemId}}},
    )
    .then(() => {
      console.log("Succesfully deleted");
      res.redirect("/" + listName);
    })
    .catch(err => console.log(err));
  }
})

app.listen(3000, () => {
  console.log("Server started on port 3000");
});
