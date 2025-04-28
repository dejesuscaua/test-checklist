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
      formData.append("query", `
        mutation ($file: File!) {
          add_file_to_column(file: $file, item_id: ${itemId}, column_id: "${coluna}") {
            id
          }
        }`);
      formData.append("variables[file]", fs.createReadStream(filePath));

      try {
        const response = await fetch("https://api.monday.com/v2/file", {
          method: "POST",
          headers: {
            Authorization: process.env.MONDAY_API_TOKEN
          },
          body: formData
        });

        const result = await response.json();
        context.res = { status: 200, body: result };
        resolve();
      } catch (error) {
        console.error("Erro ao enviar para Monday:", error);
        context.res = { status: 500, body: "Erro ao enviar arquivo para Monday" };
        reject();
      }
    });
  });
};
