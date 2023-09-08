const {
  createBot,
  createProvider,
  createFlow,
  addKeyword,
} = require("@bot-whatsapp/bot");

const QRPortalWeb = require("@bot-whatsapp/portal");
const BaileysProvider = require("@bot-whatsapp/provider/baileys");
const MockAdapter = require("@bot-whatsapp/database/mock");

const { readExcelFile } = require("./db");

const flowSalir = addKeyword(["salir"]).addAnswer([
  "🚀 Gracias por utilizar nuestro servicio de reporte de proyectos. XOne Bot agradece su visita.",
  "Escribe 👉 *HOLA* para reiniciar el bot.",
]);

async function createMainFlow() {
  const areas = await createJSONArea();

  const flowPrincipal = addKeyword(["hola", "menu", "menú", "inicio","Hola", "Menu", "Menú", "Inicio"])
    .addAnswer("🙌 Hola, bienvenido a *XOneBot*")
    .addAnswer([
      "*Seleccione un área antes de continuar:*\n",
      areas.map((area) => `👉 *${area.id}:* ${area.name}`).join("\n"),
    ])
    .addAnswer(
      [
        "🔴Si tuviste un error al tipear escribe: \n👉 *MENU* \nPara reiniciar el bot.🔴",
      ],
      null,
      null,
      await createFlowProjectsByArea()
    );

  return flowPrincipal;
}

async function createFlowProjectDetails(areaString = "") {
  const projects = await createJSONProjects();

  const filteredProjects = projects.filter(
    (project) => project.area === areaString
  );

  const flowProjects = [];

  for (const project of filteredProjects) {
    let cadenaOriginal = project.details;

    if (cadenaOriginal === undefined) {
      cadenaOriginal = "No existen detalles aún para este proyecto.";
    }

    cadenaOriginal = String(cadenaOriginal);

    let projectdetails = cadenaOriginal.replace(/\$/g, "\n*-* ");

    const projectItem = addKeyword([`${project.id}`]).addAnswer(
      [
        `*DETALLES:* \n\n-${projectdetails}`,
        "\nEscribe 👉 *SALIR* al terminar de consultar.",
      ],
      null,
      null,
      [flowSalir]
    );
    flowProjects.push(projectItem);
  }

  return flowProjects;
}

async function createFlowProjects(areaString = "") {
  const projects = await createJSONProjects();

  const filteredProjects = projects.filter(
    (project) => project.area === areaString
  );

  const flowProjects = [];

  let messageCTX = "";

  for (const project of filteredProjects) {
    const projectItem = addKeyword([`${project.id}`])
      .addAnswer(
        [
          `*${project.name}*`,
          `*DESCRIPCIÓN:* ${project.description}`,
          `*RESPONSABLE DE ÁREA:* ${project.areaLead}`,
          `*RESPONSABLE DE DESARROLLO:* ${project.teachLead}`,
          `*RESPONSABLE DEL PROYECTO:* ${project.qa}`,
          `*ESTADO:* ${project.status} (${project.progress})`, //Unir el progreso con el estado
          `*OBSERVACIONES:* ${project.observations}`,
          `*FECHA DE FINALIZACIÓN:* ${project.endDate}`,
        ],
        null,
        async (ctx, { flowDynamic }) => {
          messageCTX = ctx.body;
          return flowDynamic(
            `Escribe nuevamente 👉 *${messageCTX}* para visualizar los detalles del proyecto.`
          );
        }
      )
      .addAnswer(
        [
          "🔴Si tuviste un error al tipear escribe: \n👉 *MENU* \nPara reiniciar el bot.🔴",
        ],
        null,
        null,
        await createFlowProjectDetails(areaString)
      );
    flowProjects.push(projectItem);
  }

  return flowProjects;
}

async function createFlowProjectsByArea() {
  const areas = await createJSONArea();
  const projects = await createJSONProjects();
  const flowAreas = [];

  for (const area of areas) {
    const areaItem = addKeyword([`${area.id}`])
      .addAnswer([`Ha seleccionado al área: *${area.name}*`])
      .addAnswer([
        projects
          .filter((project) => project.area === area.name)
          .map((project) => `👉 *${project.id}:* ${project.name}`)
          .join("\n"),
      ])
      .addAnswer(
        [
          "🔴Si tuviste un error al tipear escribe: \n👉 *MENU* \nPara reiniciar el bot.🔴",
        ],
        null,
        null,
        await createFlowProjects(area.name)
      );
    flowAreas.push(areaItem);
    flowAreas.push(flowSalir);
  }

  return flowAreas;
}

async function createJSONProjects() {
  const excelFileName = "Proyectos.xlsx";
  const excelData = await readExcelFile(excelFileName);
  const projects = [];

  for (let index = 0; index < excelData.length; index++) {
    const project = excelData[index];
    const projectId = assignLetter(index) + ((index % 10) + 1); // Combina letra y número
    const projectName = project[1];
    const projectDescription = project[2];
    const projectLeader = project[3];
    const projectTeachLead = project[4];
    const projectQA = project[5];
    const projectProgress = project[6];
    const projectStatus = project[7];
    const projectArea = project[8];
    const projectObservations = project[9];
    const projectDetails = project[10];
    const projectEndDate = project[11];

    const jsonProject = {
      id: projectId,
      name: projectName,
      description: projectDescription,
      areaLead: projectLeader,
      teachLead: projectTeachLead,
      qa: projectQA,
      progress: (projectProgress * 100).toFixed(2) + "%",
      status: projectStatus,
      area: projectArea,
      observations: projectObservations,
      details: projectDetails,
      endDate: projectEndDate,
    };

    projects.push(jsonProject);
  }
  return projects;
}

async function createJSONArea() {
  const excelFileName = "Proyectos.xlsx";
  const excelData = await readExcelFile(excelFileName);
  const areaArray = [];

  for (let index = 0; index < excelData.length; index++) {
    const area = excelData[index];
    const areaName = area[8];

    const jsonAreaLeader = {
      id: assignLetter(index) + ((index % 10) + 1),
      name: areaName,
    };

    if (!areaArray.some((area) => area.name === areaName)) {
      areaArray.push(jsonAreaLeader);
    }
  }

  return areaArray;
}

function assignLetter(index) {
  const letterGroups = ["A", "B", "C", "D", "E", "F", "G", "H", "I", "J"];
  const groupIndex = Math.floor(index / 10);

  if (groupIndex < letterGroups.length) {
    return letterGroups[groupIndex];
  } else {
    return "";
  }
}

const main = async () => {
  const flowPrincipal = await createMainFlow();

  const adapterFlow = createFlow([flowPrincipal]);
  const adapterDB = new MockAdapter();
  const adapterProvider = createProvider(BaileysProvider);

  createBot({
    flow: adapterFlow,
    provider: adapterProvider,
    database: adapterDB,
  });

  QRPortalWeb();
};

main();
