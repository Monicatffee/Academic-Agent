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
    hora = Date.now();
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
                request(`https://graph.facebook.com/v6.0/10222098590717264?fields=id%2Cname&access_token=EAAHwi1O8TI0BAEoMeZBHyGoVSKRPoSDqR0yZAsTb3Gas3RIvxU2Pt26NIFtpvUSFIPZApuQJi35yN6Lq6rm5RsCZCPFAFIoEYjQ6Q1mUf6GwnHVytaFerX9VRfkO3jz5iE5MUzFMSWzoP8d0lBKNAG29lknxX4dlcxMlZAuRsUyUJbQM3jbkv6Xuw0rxeZC9EIBP56yIWuz36hqSwXC5vE`, (error, response, body)=>{
                    const p = JSON.parse(body);
                    console.log('Imprimiendo p');
                    console.log(p)
                    dbo.collection("pizzashop").save({name: p.name, facebook_id: facebookId}, function(err,doc) {
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
    response = `${texto}, gracias por contactarnos. \n¿Ya sabes que Pizza quieres probar? `;
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