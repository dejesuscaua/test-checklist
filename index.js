require('dotenv').config();
const fs = require('fs');
const FormData = require('form-data');
const formidable = require('formidable');
const fetch = (...args) => import('node-fetch').then(({ default: fetch }) => fetch(...args));

module.exports = async function (context, req) {
  const form = new formidable.IncomingForm({ keepExtensions: true });

  await new Promise((resolve, reject) => {
    form.parse(req, async (err, fields, files) => {
      if (err) {
        context.res = { status: 500, body: "Erro ao processar o formulário." };
        reject();
        return;
      }

      const fileArray = files.arquivo;
      const itemId = fields.itemId;
      const coluna = fields.coluna || "file_mkpn46xc"; // coluna padrão
      const respostas = fields.respostas; // Respostas do formulário

      if (!itemId) {
        context.res = { status: 400, body: { error: "ItemId ausente." } };
        reject();
        return;
      }

      try {
        // Processa o arquivo, caso exista
        if (fileArray) {
          const file = Array.isArray(fileArray) ? fileArray[0] : fileArray;
          const filePath = file?.filepath || file?.path;

          const formData = new FormData();
          formData.append("query", `
            mutation ($file: File!) {
              add_file_to_column(file: $file, item_id: ${itemId}, column_id: "${coluna}") {
                id
              }
            }`);
          formData.append("variables[file]", fs.createReadStream(filePath));

          const fileResponse = await fetch("https://api.monday.com/v2/file", {
            method: "POST",
            headers: {
              Authorization: process.env.MONDAY_API_TOKEN
            },
            body: formData
          });

          const fileResult = await fileResponse.json();
          console.log("Arquivo enviado para o Monday:", fileResult);
        }

        // Agora o formulário e as respostas são processados
        // Aqui você pode salvar as respostas no banco ou processá-las conforme necessário
        // Caso precise, adicione o código para gerar o PDF aqui e enviar para o Monday.

        context.res = { status: 200, body: { message: "Checklist enviado com sucesso!" } };
        resolve();
      } catch (error) {
        console.error("Erro ao processar dados:", error);
        context.res = { status: 500, body: "Erro ao processar dados." };
        reject();
      }
    });
  });
};
