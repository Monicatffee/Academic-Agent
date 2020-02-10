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
        hora = ahora.getHours()-5;
        console.log('Hora: '+ hora);
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
                console.log('Entro al else');
                //"https://graph.facebook.com/v6.0/${facebookId}?fields=id%2Cfirst_name&access_token=EAAHwi1O8TI0BAJ6hvkxHhIoCX3mZAn1qJUUyJ65MvtFqgsoLe3rqHEWybSUC8agXZCr10w0mm6iE1wd70EmNNn6ZAW31zjGTZAp6L2lK2liOXIN8UvghlNrf4P1cJ9YQJCjiEcZCrMO2yKFZCnEYtcC11mZBf2tVLBxvqw6nOJjQKb28PzFcH97I4W625JLZAkBIr3wdu891thsWTYISZCAtw"
                //https://graph.facebook.com/v2.8/oauth/access_token?grant_type=fb_exchange_token&client_id=545956172680333&client_secret=57a609f69ee83fc76041b697e775cdb0&fb_exchange_token=EAAHwi1O8TI0BAF5sfs1t0fzHgHAwPQNBx48znA39UsjCKFR7YisNBriLOZBbC6QFmybRNZBZCxV5jwiWxv3PzOPQUaztwYFIP1IZCUywrq94JEex15k6hg3oeZBFuavlzYnFsKv5WGXTLFPMd3hyCFht06tTpXk6tJPytZBoZBLiMuGkyB4CnMhANkkv8UD8YhcBVETfCkmaHYnCeyFLAB5
                request(`https://graph.facebook.com/v6.0/10222098590717264?fields=first_name&access_token=EAAHwi1O8TI0BAMFUQOVsm7AZBzVNlZBUpZAvKeyhPM2rIEvVAzaK9HlrEaoj8txktrd2LD86djqe0vEIaASaIZBYxZAP1ZBGLjDOlICPTAlFlmWa5f1PcPxZCpZBnjIGQPEKKHbZBgSoaqnTs0Ke2gzhSdz9aHGj7I76QFtAkNstXBcEqZBMoj7p9foRJ9dY3IxjAi7ul2WN5KxNAwkhcIxquz`, (error, response, body)=>{
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
    hora = ahora.getHours()-5;
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
    facebookId = req.body.originalDetectIntentRequest.payload.data.sender.id;
    console.log('Facebook id: '+ facebookId);
    dbo.collection("pizzashop").find({ facebook_id: facebookId}).toArray(async function(err, users) {
        console.log('User: ' + JSON.stringify(users));
        if(users.length > 0){
            dbo.collection("pizzashop").update({ facebook_id: facebookId},
                { $set: {phone: 3207416387}}), function(err,doc) {
                     response = `Perfecto, en 30 minutos estaremos ahí.`;
                     console.log('response: ', response); 
                     res.json({
                         fulfillmentText: response,
                     });
                 }
        }
        response = `Aun no estas registrado con nosotros.`;
                     console.log('response: ', response); 
                     res.json({
                         fulfillmentText: response,
                     });
        return(response);
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