require('dotenv').config();

const fetch = (...args) => import('node-fetch').then(({ default: fetch }) => fetch(...args));
 
module.exports = async function (context, req) {

  try {

    const respostas = req.body.respostas;
 
    const columnValues = {

      text_mkpjsmpc: respostas[0],

      text_mkq9ep39: respostas[2],

      text_mkpnrmd0: respostas[3],

      text_mkpn766e: respostas[4],

      text_mkpnn53k: respostas[5],

      text_mkpnxs2v: respostas[6],

      text_mkpnza93: respostas[7],

      text_mkpnzzsa: respostas[8],

      text_mkpncg6g: respostas[9],

      text_mkpnj2z2: respostas[10],

      text_mkpn67sw: respostas[11],

      text_mkpntpbk: respostas[12],

      text_mkpndc5k: respostas[13],

      text_mkpn1nf1: respostas[14],

      text_mkpnc0wq: respostas[15],

      text_mkpnh13t: respostas[16],

    };
 
    const mutation = {

      query: `mutation {

        create_item(

          board_id: ${process.env.MONDAY_BOARD_ID},

          item_name: "Checklist ${respostas[0]} - ${new Date().toLocaleDateString()}",

          column_values: "${JSON.stringify(columnValues).replace(/"/g, '\\"')}"

        ) {

          id

        }

      }`

    };
 
    const response = await fetch("https://api.monday.com/v2", {

      method: "POST",

      headers: {

        Authorization: process.env.MONDAY_API_TOKEN,

        "Content-Type": "application/json"

      },

      body: JSON.stringify(mutation)

    });
 
    const result = await response.json();
 
    if (result.errors) {

      context.res = {

        status: 500,

        body: { error: "Erro ao enviar para o Monday", detalhe: result.errors }

      };

      return;

    }
 
    context.res = {

      status: 200,

      body: result

    };

  } catch (err) {

    context.res = {

      status: 500,

      body: { error: "Erro interno ao enviar formulário", detalhe: err.message }

    };

  }

}

 