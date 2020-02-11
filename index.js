const express = require('express');
const bodyParser = require('body-parser');
const request = require('request');
const client = require('mongodb').MongoClient;
let dbo = null;
let facebookId  = null;
const uri = "mongodb+srv://userExp:userExp@clusterpruebas-7wtyk.mongodb.net/test?retryWrites=true&w=majority"

 
//mongoose.connect('mongodb://rocket:r0ck3td3v3l0pm3nt@157.230.75.138:27017/rocket', {useNewUrlParser: true});
const APP_TOKEN = 'EAAHwi1O8TI0BAPYUcxNkKKMm36HYMewgbWQWwpNmmLipyqll7JVNZBbR4bBHz06YWyZBEvpOEZBPzvFH0iOTP16LEdZAzh381Dd1Hcp5ht4p0HbZAWugo5OVeZARnvhAx16CZCZC0fHZAZCqI8a4dsWwcXQ2P3i7217uZCWvyqqn1sW6iCxg5YKoiVN';
const port = process.env.PORT || 3000;

var app = express();

app.use(bodyParser.json());

app.listen(port, function(){
    console.log('Server listen localhost:3000');
});

client.connect(uri, { useNewUrlParser: true }, function(err, db) {
    console.log('Conexion DB');
    dbo = db.db("pruebas");
    if (err) {console.log('Error: ' + err); callback(err)}
})

const getNameFromFacebook = (req, res) => {
        ahora = new Date(); 
        hora = (ahora.getHours()-5);
        console.log('Hora: '+ hora);
        hora = hora-5;
        var texto = ''
        if(hora < 12){
            texto = 'Buenos días';
        }else if(hora > 12 && hora < 18){
            texto = 'Buenas tardes';
        }else if(hora > 18 && hora < 24){
            texto = 'Buenas noches';
        }
        facebookId = req.body.originalDetectIntentRequest.payload.data.sender.id;
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
                request(`https://graph.facebook.com/v6.0/10222098590717264?fields=first_name&access_token=EAAHwi1O8TI0BAFi0SbCG2qDPPtAsanVKJyJoHHpXBK8CI6mzAxonr4XsTEqRZBt0J8JE3zu9ryBGrFSHZBgBygLh4DNLanOoZC19QaBbcHMskAsBt4RzeoZBlLpgjdDsaR4S1bKk7YJwsjRMjqJyZBZC2eZC9hpJPBzPY9XgS0pZAVh4n9OI7CSgYVywrRPD8KdOFyL0p4ex8eMHv87TH6gX`, (error, response, body)=>{
                    const p = JSON.parse(body);
                    console.log('nombre');
                    console.log(p.first_name);
                    console.log(body);
                    dbo.collection("pizzashop").save({name: p.first_name, facebook_id: facebookId}, function(err,doc) {
                        if (err) { console.log(err);}
                        else { 
                            response = `${texto} ${p.first_name}, Gracias por visitarnos, para Pizzashop es un gusto atenderte.\n\n¿Cómo te podemos ayudar? `;
                            console.log('response: ', response); 
                            res.json({
                                fulfillmentText: response,
                            });
                        }
                });
                return(response);
            }); 
            }
            return(response);
        });   
}

const getNameFromWhatsapp = (req, res) => {
    ahora = new Date(); 
    hora = (ahora.getHours()-5);
    console.log('Hora: '+ hora);
    hora = hora-5;
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
    const phone = req.body.queryResult.parameters['phone-number'];
    const tipo = req.body.queryResult.outputContexts.TipoPizza;
    const tamano = req.body.queryResult.outputContexts.TamanoPizza;
    console.log(phone, tipo, tamano)
    console.log('Pintando la respuesta');
    console.log(req.body.queryResult.parameters);
    console.log(req.body.queryResult.outputContexts.TipoPizza);
    facebookId = req.body.originalDetectIntentRequest.payload.data.sender.id;
    console.log('Facebook id: '+ facebookId);
    dbo.collection("pizzashop").find({ facebook_id: facebookId}).toArray(async function(err, users) {
        console.log('User: ' + JSON.stringify(users));
        if(users.length > 0){
            dbo.collection("pizzashop").update({ facebook_id: facebookId},
                { $set: {phone: 3207416387}})
                response = `Perfecto, en 30 minutos estaremos ahí.`;
                console.log('response: ', response); 
                res.json({
                    fulfillmentText: response,
                });
                return(response);
        }else 
            {
                response = `Aun no estas registrado con nosotros.`;
                console.log('response: ', response); 
                res.json({
                    fulfillmentText: response,
                });
                return(response);
            }
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
        'Elegir Pizza - yes': getAppointment
      };
      const funcion = opciones[intencion];
      if (typeof funcion === 'function') {
        funcion(req, res);
    }
})