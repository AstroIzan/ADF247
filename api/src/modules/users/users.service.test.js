const test = require('node:test')
const assert = require('node:assert/strict')

const { importUsersFromCsv, __csvInternals } = require('./users.service')

test('parseCsvRows valida cabecera correcta', () => {
  const csv = [
    'nCarnet,nIndicatiu,name,lastName,password,isActive,isAdmin,isGroc,isCapOperatiu,isCapColla',
    '247001,BR-01,Ana,Perez,Password1,true,false,true,false,false',
  ].join('\n')

  const rows = __csvInternals.parseCsvRows(csv)
  assert.equal(rows.length, 1)
  assert.equal(rows[0].nCarnet, '247001')
  assert.equal(rows[0].name, 'Ana')
})

test('parseCsvRows rechaza cabecera invalida', () => {
  const csv = [
    'nCarnet,name,password',
    '247001,Ana,Password1',
  ].join('\n')

  assert.throws(() => __csvInternals.parseCsvRows(csv), /Cabecera CSV invalida/)
})

test('importUsersFromCsv procesa inserciones y rechazos por fila', async () => {
  const csv = [
    'nCarnet,nIndicatiu,name,lastName,password,isActive,isAdmin,isGroc,isCapOperatiu,isCapColla',
    '247001,BR-01,Ana,Perez,Password1,true,false,true,false,false',
    '247002,BR-02,Joan,Roca,Password2,true,false,false,false,false',
  ].join('\n')

  const inserted = []

  const result = await importUsersFromCsv(
    { csvContent: csv, fileName: 'users.csv' },
    {
      createUserFn: async (payload) => {
        if (payload.nCarnet === '247002') {
          throw new Error('Ya existe un usuario con ese nCarnet.')
        }

        inserted.push(payload)
      },
    }
  )

  assert.equal(result.totalRows, 2)
  assert.equal(result.inserted, 1)
  assert.equal(result.rejected, 1)
  assert.equal(inserted.length, 1)
  assert.equal(result.rows[1].status, 'rejected')
})

test('importUsersFromCsv rechaza nombre de fichero no csv', async () => {
  const csv = [
    'nCarnet,nIndicatiu,name,lastName,password,isActive,isAdmin,isGroc,isCapOperatiu,isCapColla',
    '247001,BR-01,Ana,Perez,Password1,true,false,true,false,false',
  ].join('\n')

  await assert.rejects(
    importUsersFromCsv({ csvContent: csv, fileName: 'users.txt' }),
    /terminar en \.csv/
  )
})
