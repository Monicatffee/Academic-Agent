const express = require('express');
const bodyParser = require('body-parser');
//const mongoose = require('mongoose');
const User = require('./user.js');
const request = require('request');
const client = require('mongodb').MongoClient;
const dbo = null;
const uri = "mongodb+srv://userExp:userExp@clusterpruebas-7wtyk.mongodb.net/test?retryWrites=true&w=majority"

 
//mongoose.connect('mongodb://rocket:r0ck3td3v3l0pm3nt@157.230.75.138:27017/rocket', {useNewUrlParser: true});
const APP_TOKEN = 'EAAhgQgglppwBAF6dhss9XrzCTXJGuZBLZCjic2bJygijEWNe9pUj7vtMwJXZCKC0zx2bJZBLIklxgw9TZApm7f5Q3LTYvHw0j4VmGn5Rg1lfZCBcZB0QNJmMhEpZC7yZAgSYIJVAmqjJzzpzbX222UIEIZB7xViGc7AWkzScIb1DtIL3RdSZBkcbP0UyyrflqUMFTUZD';
const port = process.env.PORT || 3000;

var app = express();

app.use(bodyParser.json());

app.listen(port, function(){
    console.log('Server listen localhost:3000');
});

client.connect(uri, { useNewUrlParser: true }, function(err, db) {
    console.log('Conexion DB');
    const dbo = db.db("pruebas");
    if (err) {console.log('Error: ' + err); callback(err)}
})

const getNameFromFacebook = (req, res) => {
    dbo = db.db("pruebas");
    ahora = new Date(); 
    hora = ahora.getHours();
    console.log('Hora: '+ hora);
    var texto = ''
    if(hora < 12){
        texto = 'Buenos días';
    }else if(hora > 12 && hora < 18){
        texto = 'Buenas tardes';
    }else if(hora > 18 && hora < 24){
        texto = 'Buenas noches';
    }
    const facebookId = req.body.originalDetectIntentRequest.payload.data.sender.id;
    console.log('Facebook id: '+ facebookId);
    dbo.collection("pizzashop").find({ facebook_id: facebookId}).toArray(async function(err, users) {
        console.log('User: ' + JSON.stringify(users));
        if(users.length > 0){
            response = `${texto} ${users[0].name}, ¿Cómo podemos ayudarte?`;
            console.log('response: ', response); 
            res.json({
              fulfillmentText: response,
            });
        }else{
            request(`https://graph.facebook.com/${facebookId}?fields=first_name&access_token=EAAhgQgglppwBAHBCxQEhnoZA9EHwyZCyaN8QmTHR8JiTAnUnr7iZCWyCdmZCJ2jEyOZCjWODeTCb2LQNZA0IzBzHmTT7EFSYEsqCTPnaYZBwLl8ftcT3jW9GrPz7ZCwJYZBYBEQUyn6yxTFZAMQvkZBFonPB2fLCTTZAIYncwCnl5k4mXLOdJExGJDOqCBHQ82XcH8IZD`, (error, response, body)=>{
                const p = JSON.parse(body);
                dbo.collection("pizzashop").findOneAndUpdate({name: p.first_name, facebook_id: facebookId}, {upsert: true}, function(err,doc) {
                    if (err) { console.log(err);}
                    else { 
                console.log('nombre');
                console.log(p.first_name);
                console.log(body);
                response = `${texto} ${p.first_name}, Gracias por visitarnos, para Pizzashop es un gusto atenderte.\n\n¿Cómo te podemos ayudar? `;
                console.log('response: ', response); 
                res.json({
                    fulfillmentText: response,
                });
            }
            });
        }); 
        }
    });
}

const getNameFromWhatsapp = (req, res) => {
    ahora = new Date(); 
    hora = ahora.getHours();
    var texto = ''
    if(hora < 12){
        texto = 'Buenos días';
    }else if(hora > 12 && hora < 18){
        texto = 'Buenas tardes';
    }else if(hora > 18 && hora < 24){
        texto = 'Buenas noches';
    }
    response = `${texto}, gracias por contactarnos. \n¿Ya sabes que Pizza quieres probar? `;
    console.log('response: ', response); 
    res.json({
        fulfillmentText: response,
    });

}

const getAppointment = (req, res) => {
    response = `Perfecto, en 30 minutos estaremos ahí.`;
    console.log('response: ', response); 
    res.json({
        fulfillmentText: response,
    });
}

const getSaludo = (req, res) => {
    const source =  req.body.originalDetectIntentRequest.source;

    const sources = {
        facebook: getNameFromFacebook,
        twilio: getNameFromWhatsapp
    }
    sources[source](req, res);
}

app.post('/', async (req, res) => {
    console.log('Al menos entro.');
    console.log('Body: ' + JSON.stringify(req.body));
    
    const intencion = req.body.queryResult.intent.displayName;
      console.log('Intencion: ', intencion);
      const opciones = {
        Saludo: getSaludo,
        'Costos+AgendarCita - yes': getAppointment
      };
      const funcion = opciones[intencion];
      if (typeof funcion === 'function') {
        funcion(req, res);
    }
})