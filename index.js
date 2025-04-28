require('dotenv').config();

const fetch = (...args) => import('node-fetch').then(({ default: fetch }) => fetch(...args));

const fs = require('fs');

const FormData = require('form-data');

const formidable = require('formidable');
 
module.exports = async function (context, req) {

  try {

    // Tratar diferentes tipos de requisição:

    const contentType = req.headers["content-type"] || '';
 
    if (req.method === "POST" && contentType.includes("application/json")) {

      // 🔵 Parte 1: Recebendo as respostas (JSON) para criar o item
 
      const respostas = req.body.respostas;

      if (!respostas) {

        context.res = { status: 400, body: { error: "Respostas ausentes." } };

        return;

      }
 
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

          body: { error: "Erro ao criar item no Monday", detalhe: result.errors }

        };

        return;

      }
 
      context.res = { status: 200, body: result };

      return;

    }
 
    if (req.method === "POST" && contentType.includes("multipart/form-data")) {

      // 🟠 Parte 2: Recebendo arquivos para upload (Fatura ou PDF)
 
      const form = new formidable.IncomingForm({ keepExtensions: true });
 
      await new Promise((resolve, reject) => {

        form.parse(req, async (err, fields, files) => {

          if (err) {

            context.res = { status: 500, body: "Erro ao processar arquivo recebido." };

            reject();

            return;

          }
 
          const fileArray = files.arquivo;

          const itemId = fields.itemId;

          const coluna = fields.coluna || "file_mkpn46xc"; // Se não mandar, usa uma padrão
 
          if (!fileArray || !itemId || !coluna) {

            context.res = { status: 400, body: { error: "Arquivo, itemId ou coluna ausente." } };

            reject();

            return;

          }
 
          const file = Array.isArray(fileArray) ? fileArray[0] : fileArray;

          const filePath = file?.filepath || file?.path;
 
          const formData = new FormData();

          formData.append("query", `mutation ($file: File!) {

            add_file_to_column(file: $file, item_id: ${itemId}, column_id: "${coluna}") {

              id

            }

          }`);

          formData.append("variables[file]", fs.createReadStream(filePath));
 
          try {

            const fileResponse = await fetch("https://api.monday.com/v2/file", {

              method: "POST",

              headers: {

                Authorization: process.env.MONDAY_API_TOKEN

              },

              body: formData

            });
 
            const fileResult = await fileResponse.json();
 
            if (fileResult.errors) {

              console.error("Erro ao fazer upload para Monday:", fileResult.errors);

              context.res = { status: 500, body: { error: "Erro no upload", detalhe: fileResult.errors } };

              reject();

              return;

            }
 
            context.res = { status: 200, body: { success: true, message: "Upload concluido"} };
            resolve();

          } catch (error) {

            console.error("Erro de envio:", error);

            context.res = { status: 500, body: "Erro ao enviar arquivo para o Monday." };

            reject();

          }

        });

      });
 
      return;

    }
 
    // Se o formato da requisição for inválido

    context.res = { status: 400, body: "Formato de requisição não suportado." };

  } catch (err) {

    console.error("Erro interno:", err);

    context.res = {

      status: 500,

      body: { error: "Erro interno ao processar requisição", detalhe: err.message }

    };

  }

};

 