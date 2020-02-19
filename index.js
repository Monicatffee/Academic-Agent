const express = require('express');
const bodyParser = require('body-parser');
const request = require('request');
const client = require('mongodb').MongoClient;
let dbo = null;
let facebookId  = null;
const uri = "mongodb+srv://userExp:userExp@clusterpruebas-7wtyk.mongodb.net/test?retryWrites=true&w=majority"
const port = process.env.PORT || 3000;
var app = express();

app.use(bodyParser.json());

app.listen(port, function(){
    console.log('Server listen localhost:3000');
});

client.connect(uri, { useNewUrlParser: true }, function(err, db) {
    dbo = db.db("pruebas");
    if (err) {console.log('Error: ' + err); callback(err)}
})

function get_daytime(){
    ahora = new Date(); 
    hora = (ahora.getHours());
    console.log('Hora: '+ hora);
    var texto = ''
    if(hora > 6 && hora < 17){
        texto = 'Buenos días';
    }else if(hora > 17 && hora < 23){
        texto = 'Buenas tardes';
    }else if(hora > 0 && hora < 5){
        texto = 'Buenas noches';
    }
    return texto;
}

const getNameFromFacebook = (req, res) => {
        texto = get_daytime()
        facebookId = req.body.originalDetectIntentRequest.payload.data.sender.id;
        dbo.collection("pizzashop").find({ facebook_id: facebookId}).toArray(async function(err, users) {
            if(users.length > 0){
                response = `${texto} ${users[0].name}, ¿Cómo podemos ayudarte?`;
                res.json({
                fulfillmentText: response,
                });
            }else{
                    request(`https://graph.facebook.com/v6.0/10222098590717264?fields=id%2Cfirst_name%2Cname&access_token=EAAHwi1O8TI0BAInw4pwt1sLcmJgwZAmTqiRUjQyymI3bXZBFhtLPAKFOOwZAVhCWgd1t3WCDHkEEQkuZCU4g3ZCxi9LX3wmKL761nwJd1ejcrUsNtyYUlQjDVnnGVTZC0wMZBpw0j5C97ZCbmUk8bq1iZAJQ3eBImHlEq8jaKw9IMhRrlDsDwXfl9GXWzHGOOaukq3VEGpxiBZBPVwXfOcEH95`, (error, response, body)=>{
                    const p = JSON.parse(body);
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
    texto = get_daytime()
    response = `${texto}, gracias por contactarnos. \n¿Cómo podemos ayudarte?`;
    res.json({
        fulfillmentText: response,
    });
    return(response);
}

const getAppointment = (req, res) => {
    ahora = new Date(); 
    const phone = req.body.queryResult.parameters['phone-number'];
    const tipo = req.body.queryResult.outputContexts[0].parameters.TipoPizza;
    const tamano = req.body.queryResult.outputContexts[0].parameters.TamanoPizza; 
    facebookId = req.body.originalDetectIntentRequest.payload.data.sender.id;
    dbo.collection("pizzashop").find({ facebook_id: facebookId}).toArray(async function(err, users) {
        console.log('User: ' + JSON.stringify(users));
        if(users.length > 0){
            dbo.collection("pizzashop").update({ facebook_id: facebookId},
                { $push: { order: {date: ahora, phone: phone, type: tipo, size: tamano}}});
                response = `Perfecto, en 30 minutos estaremos ahí.`;
                res.json({
                    fulfillmentText: response,
                });
                return(response);
        }else 
            {
                response = `Aun no estas registrado con nosotros.`;
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
    const intencion = req.body.queryResult.intent.displayName;
      const opciones = {
        Saludo: getSaludo,
        'Elegir Pizza - yes': getAppointment
      };
      const funcion = opciones[intencion];
      if (typeof funcion === 'function') {
        funcion(req, res);
    }
})