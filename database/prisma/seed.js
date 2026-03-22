const prisma = require('./prisma')
const bcrypt = require('bcrypt')

const PASSWORD_SALT_ROUNDS = 10

async function main() {
  console.log('\ud83c\udf31 Iniciando seed completo de la BBDD...')

  // Limpiar datos existentes
  console.log('\n\uD83D\uDDD1\uFE0F  Limpiando datos existentes...')
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
    { name: 'VerdAdmin',    lastName: null,               nCarnet: '247/068',    nIndicatiu: null,  password: 'Airline5', isCapOperatiu: false, isCapColla: false, isAdmin: false, isGroc: false },
    { name: 'VerdNoAdmin',  lastName: null,               nCarnet: '247/070',    nIndicatiu: null,  password: 'Airline6', isCapOperatiu: false, isCapColla: false, isAdmin: true,  isGroc: false },
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
  const tipos = ['Guardia', 'Formacion', 'Salida']
  const convoTypeMap = {}

  for (let t of tipos) {
    const ct = await prisma.convoType.upsert({
      where: { name: t },
      update: {},
      create: { name: t }
    })
    convoTypeMap[t] = ct.id
    console.log(`\u2705 Tipo de convocatoria: ${t}`)
  }

  console.log(`\n\uD83D\uDDD3\uFE0F  Creando convocatorias...`)
  const convocatoriasData = [
    { convoType: 'Guardia',   date: new Date('2026-02-23'), startTime: new Date('2026-02-23T12:00:00'), finalTime: new Date('2026-02-23T16:00:00'), ubiSortida: 'brigadas', responsableNC: '247/GI/200', moreThan2: true,  isActive: true },
    { convoType: 'Guardia',   date: new Date('2026-02-23'), startTime: new Date('2026-02-23T16:00:00'), finalTime: new Date('2026-02-23T20:00:00'), ubiSortida: 'brigadas', responsableNC: '247/GI/239', moreThan2: true,  isActive: true },
    { convoType: 'Formacion', date: new Date('2026-02-26'), startTime: new Date('2026-02-26T09:00:00'), finalTime: null,                            ubiSortida: 'base',    responsableNC: '247/GI/215', moreThan2: true,  isActive: true },
    { convoType: 'Salida',    date: new Date('2026-02-21'), startTime: new Date('2026-02-21T17:10:00'), finalTime: null,                            ubiSortida: 'brigadas', responsableNC: '247/GI/225', moreThan2: true,  isActive: true },
    { convoType: 'Guardia',   date: new Date('2026-03-20'), startTime: new Date('2026-03-20T09:00:00'), finalTime: new Date('2026-03-20T13:00:00'), ubiSortida: 'brigadas', responsableNC: '247/GI/200', moreThan2: true,  isActive: true },
    { convoType: 'Formacion', date: new Date('2026-03-20'), startTime: new Date('2026-03-20T15:00:00'), finalTime: new Date('2026-03-20T18:00:00'), ubiSortida: 'base',    responsableNC: '247/GI/215', moreThan2: true,  isActive: true },
    { convoType: 'Salida',    date: new Date('2026-03-22'), startTime: new Date('2026-03-22T10:00:00'), finalTime: new Date('2026-03-22T14:00:00'), ubiSortida: 'brigadas', responsableNC: '247/GI/225', moreThan2: false, isActive: true },
    { convoType: 'Guardia',   date: new Date('2026-03-25'), startTime: new Date('2026-03-25T12:00:00'), finalTime: null,                            ubiSortida: 'brigadas', responsableNC: '247/GI/239', moreThan2: true,  isActive: true },
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
        moreThan2: c.moreThan2,
        isActive: c.isActive
      }
    })
    console.log(`\u2705 Convocatoria: ${convo.title}`)
  }

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
