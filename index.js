require('dotenv').config();
const fetch = (...args) => import('node-fetch').then(({ default: fetch }) => fetch(...args));
const fs = require('fs');
const FormData = require('form-data');
const formidable = require('formidable');
 
module.exports = async function (context, req) {
  try {
    if (req.method === "POST" && req.headers["content-type"].includes("application/json")) {
      // 🔵 Primeira parte: recebendo JSON (respostas)
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
          body: { error: "Erro ao enviar para o Monday", detalhe: result.errors }
        };
        return;
      }
 
      context.res = { status: 200, body: result };
      return;
    }
 
    if (req.method === "POST" && req.headers["content-type"].includes("multipart/form-data")) {
      // 🟠 Segunda parte: upload de arquivo
      const form = new formidable.IncomingForm({ keepExtensions: true });
 
      await new Promise((resolve, reject) => {
        form.parse(req, async (err, fields, files) => {
          if (err) {
            context.res = { status: 500, body: "Erro ao processar arquivo." };
            reject();
            return;
          }
 
          const fileArray = files.arquivo;
          const itemId = fields.itemId;
          const coluna = fields.coluna || "file_mkpn46xc"; // coluna padrão
 
          if (!fileArray || !itemId) {
            context.res = { status: 400, body: { error: "Arquivo ou itemId ausente." } };
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
            context.res = { status: 200, body: fileResult };
            resolve();
          } catch (error) {
            console.error("Erro ao enviar para Monday:", error);
            context.res = { status: 500, body: "Erro ao enviar arquivo para Monday" };
            reject();
          }
        });
      });
 
      return;
    }
 
    // Se não for JSON nem multipart
    context.res = { status: 400, body: "Formato de requisição inválido" };
  } catch (err) {
    context.res = {
      status: 500,
      body: { error: "Erro interno ao processar requisição", detalhe: err.message }
    };
  }
};