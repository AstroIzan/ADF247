const prisma = require('./prisma')
const bcrypt = require('bcrypt')

const PASSWORD_SALT_ROUNDS = 10

async function main() {
  console.log('\ud83c\udf31 Iniciando seed completo de la BBDD...')

  // Limpiar datos existentes
  console.log('\n\uD83D\uDDD1\uFE0F  Limpiando datos existentes...')
  await prisma.notificationAutomationTaskRun.deleteMany({})
  await prisma.notificationAutomationRun.deleteMany({})
  await prisma.notificationLog.deleteMany({})
  await prisma.formulariCampanya.deleteMany({})
  await prisma.userHoursSummary.deleteMany({})
  await prisma.availabilityWindow.deleteMany({})
  await prisma.respuesta.deleteMany({})
  await prisma.convocatoria.deleteMany({})
  await prisma.role.deleteMany({})
  await prisma.user.deleteMany({})
  await prisma.convoType.deleteMany({})
  console.log('\u2705 Datos anteriores eliminados')

  const usuariosData = [
    { name: 'CapOperatiu',  lastName: null,               nCarnet: '247/GI/200', nIndicatiu: 'S10', password: 'Airline1', isCapOperatiu: true,  isCapColla: false, isAdmin: true,  isGroc: true  },
    { name: 'CapDeColla',   lastName: null,               nCarnet: '247/GI/215', nIndicatiu: 'S20', password: 'Airline2', isCapOperatiu: false, isCapColla: true,  isAdmin: true,  isGroc: true  },
    { name: 'GrocAdmin',    lastName: null,               nCarnet: '247/GI/225', nIndicatiu: null,  password: 'Airline3', isCapOperatiu: false, isCapColla: false, isAdmin: true,  isGroc: true  },
    { name: 'GrocNoAdmin',  lastName: null,               nCarnet: '247/GI/230', nIndicatiu: null,  password: 'Airline4', isCapOperatiu: false, isCapColla: false, isAdmin: false, isGroc: true  },
    { name: 'VerdAdmin',    lastName: null,               nCarnet: '247/068',    nIndicatiu: null,  password: 'Airline5', isCapOperatiu: false, isCapColla: false, isAdmin: true,  isGroc: false },
    { name: 'VerdNoAdmin',  lastName: null,               nCarnet: '247/070',    nIndicatiu: null,  password: 'Airline6', isCapOperatiu: false, isCapColla: false, isAdmin: false, isGroc: false },
    { name: 'Izan',         lastName: 'Estirado Alfaro',  nCarnet: '247/GI/239', nIndicatiu: null,  password: 'Airline7', isCapOperatiu: false, isCapColla: false, isAdmin: false, isGroc: true  },
    { name: 'Bru',          lastName: 'Carreras Hernandez', nCarnet: '247/069', nIndicatiu: null,   password: 'Airline8', isCapOperatiu: false, isCapColla: false, isAdmin: false, isGroc: false },
  ]

  console.log(`\n\uD83D\uDCDD Creando ${usuariosData.length} usuarios...`)
  const userMap = {}

  for (let u of usuariosData) {
    const hashedPassword = await bcrypt.hash(u.password, PASSWORD_SALT_ROUNDS)

    const user = await prisma.user.create({
      data: {
        name: u.name,
        lastName: u.lastName,
        nCarnet: u.nCarnet,
        nIndicatiu: u.nIndicatiu,
        password: hashedPassword,
        isActive: true,
        roles: {
          create: {
            isCapOperatiu: u.isCapOperatiu,
            isCapColla: u.isCapColla,
            isAdmin: u.isAdmin,
            isGroc: u.isGroc
          }
        }
      }
    })
    userMap[u.nCarnet] = user.id
    console.log(`\u2705 Usuario creado: ${user.name} (${user.nCarnet}) - Pass: ${u.password}`)
  }

  console.log(`\n\uD83D\uDCCB Creando tipos de convocatoria...`)
  const tipos = [
    { name: 'Guardia', minGrocSortida: 2, minVerdSortida: 4, defaultLocation: 'brigadas' },
    { name: 'PVI', minGrocSortida: 2, minVerdSortida: 4, defaultLocation: 'brigadas' },
    { name: 'Semanal', minGrocSortida: 0, minVerdSortida: 0, defaultLocation: 'base' },
    { name: 'Formacion', minGrocSortida: 0, minVerdSortida: 0, defaultLocation: 'base' },
    { name: 'Incendi', minGrocSortida: 3, minVerdSortida: 6, defaultLocation: 'Sabadell' },
  ]
  const convoTypeMap = {}

  for (let t of tipos) {
    const ct = await prisma.convoType.upsert({
      where: { name: t.name },
      update: {
        minGrocSortida: t.minGrocSortida,
        minVerdSortida: t.minVerdSortida,
        defaultLocation: t.defaultLocation,
      },
      create: {
        name: t.name,
        minGrocSortida: t.minGrocSortida,
        minVerdSortida: t.minVerdSortida,
        defaultLocation: t.defaultLocation,
      }
    })
    convoTypeMap[t.name] = ct.id
    console.log(`\u2705 Tipo de convocatoria: ${t.name}`)
  }

  console.log(`\n\uD83D\uDDD3\uFE0F  Creando convocatorias...`)
  const convocatoriasData = [
    { convoType: 'Guardia',   date: new Date('2026-02-23'), startTime: new Date('2026-02-23T12:00:00'), finalTime: new Date('2026-02-23T16:00:00'), ubiSortida: 'brigadas', responsableNC: '247/GI/200', isActive: true },
    { convoType: 'Guardia',   date: new Date('2026-02-23'), startTime: new Date('2026-02-23T16:00:00'), finalTime: new Date('2026-02-23T20:00:00'), ubiSortida: 'brigadas', responsableNC: '247/GI/239', isActive: true },
    { convoType: 'PVI',       date: new Date('2026-02-24'), startTime: new Date('2026-02-24T10:00:00'), finalTime: new Date('2026-02-24T14:00:00'), ubiSortida: 'brigadas', responsableNC: '247/GI/215', isActive: true },
    { convoType: 'Formacion', date: new Date('2026-02-26'), startTime: new Date('2026-02-26T09:00:00'), finalTime: null,                            ubiSortida: 'base',    responsableNC: '247/GI/215', isActive: true },
    { convoType: 'Incendi',   date: new Date('2026-02-21'), startTime: new Date('2026-02-21T17:10:00'), finalTime: null,                            ubiSortida: 'Sabadell', responsableNC: '247/GI/225', isActive: true },
    { convoType: 'Guardia',   date: new Date('2026-03-20'), startTime: new Date('2026-03-20T09:00:00'), finalTime: new Date('2026-03-20T13:00:00'), ubiSortida: 'brigadas', responsableNC: '247/GI/200', isActive: true },
    { convoType: 'Formacion', date: new Date('2026-03-20'), startTime: new Date('2026-03-20T15:00:00'), finalTime: new Date('2026-03-20T18:00:00'), ubiSortida: 'base',    responsableNC: '247/GI/215', isActive: true },
    { convoType: 'Semanal',   date: new Date('2026-03-22'), startTime: new Date('2026-03-22T10:00:00'), finalTime: new Date('2026-03-22T14:00:00'), ubiSortida: 'base',     responsableNC: '247/GI/225', isActive: true },
    { convoType: 'Guardia',   date: new Date('2026-03-25'), startTime: new Date('2026-03-25T12:00:00'), finalTime: null,                            ubiSortida: 'brigadas', responsableNC: '247/GI/239', isActive: true },
  ]

  for (let c of convocatoriasData) {
    const convo = await prisma.convocatoria.create({
      data: {
        title: `${c.convoType} - ${c.date.toLocaleDateString()}`,
        convoTypeId: convoTypeMap[c.convoType],
        date: c.date,
        startTime: c.startTime,
        finalTime: c.finalTime,
        ubiSortida: c.ubiSortida,
        responsableId: userMap[c.responsableNC],
        isActive: c.isActive
      }
    })
    console.log(`\u2705 Convocatoria: ${convo.title}`)
  }

  console.log('\n\uD83D\uDD52 Creando ventanas de disponibilidad de ejemplo...')
  const windowsData = [
    {
      userNCarnet: '247/GI/239',
      fromDateTime: new Date('2026-03-25T11:00:00'),
      toDateTime: new Date('2026-03-25T14:00:00'),
      availabilityType: 'available',
      source: 'manual',
      notes: 'Disponible para turno de mediodia',
    },
    {
      userNCarnet: '247/GI/230',
      fromDateTime: new Date('2026-03-25T10:30:00'),
      toDateTime: new Date('2026-03-25T16:00:00'),
      availabilityType: 'unavailable',
      source: 'manual',
      notes: 'No disponible por trabajo',
    },
    {
      userNCarnet: '247/069',
      fromDateTime: new Date('2026-03-25T11:30:00'),
      toDateTime: new Date('2026-03-25T13:30:00'),
      availabilityType: 'available',
      source: 'import',
      notes: 'Importado desde planilla',
    },
  ]

  for (const windowData of windowsData) {
    await prisma.availabilityWindow.create({
      data: windowData,
    })
  }
  console.log(`\u2705 Ventanas creadas: ${windowsData.length}`)

  console.log('\n\uD83C\uDF89 Seed completado correctamente!')
}

main()
  .catch(e => {
    console.error('\u274C Error en seed:', e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
