const https = require('https');

const SUPABASE_URL = 'https://yvdfdmyusdhgtzfguxbj.supabase.co';
const SUPABASE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Inl2ZGZkbXl1c2RoZ3R6Zmd1eGJqIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzM0OTg4MzksImV4cCI6MjA4OTA3NDgzOX0.-xSNbj5kLibkhJoXmOXjfmYPKBB-gqasQgy322Kk-n4';

function request(path, method, body) {
  return new Promise((resolve, reject) => {
    const options = {
      hostname: 'yvdfdmyusdhgtzfguxbj.supabase.co',
      path: path,
      method: method,
      headers: {
        'apikey': SUPABASE_KEY,
        'Authorization': 'Bearer ' + SUPABASE_KEY,
        'Content-Type': 'application/json'
      }
    };

    const req = https.request(options, (res) => {
      let data = '';
      res.on('data', (chunk) => { data += chunk; });
      res.on('end', () => {
        try { resolve(JSON.parse(data)); }
        catch (e) { resolve(data); }
      });
    });

    req.on('error', (e) => { reject(e); });
    if (body) req.write(JSON.stringify(body));
    req.end();
  });
}

async function runTests() {
  console.log('--- INICIANDO TESTES GERAIS TUBARÃO ---');

  // 1. Criar usuários de teste
  const roles = ['diretor', 'jogador', 'comissao_tecnica'];
  const userIds = {};

  for (const role of roles) {
    const nome = `test_${role}_${Math.floor(Math.random() * 1000)}`;
    console.log(`Criando usuário: ${nome} (${role})...`);
    const res = await request('/rest/v1/rpc/tubarao_criar_usuario', 'POST', {
      p_nome: nome,
      p_senha: 'teste',
      p_cargo: role
    });
    
    if (res.success) {
      console.log(`✅ Usuário ${role} criado com ID: ${res.id}`);
      userIds[role] = res.id;
    } else {
      console.error(`❌ Erro ao criar usuário ${role}:`, res.message);
    }
  }

  // 2. Criar cadastros de teste para cada tipo
  const tipos = ['jogador', 'comissao_tecnica', 'familia', 'torcida'];
  const tables = ['tubarao_social', 'tubarao_time'];

  for (const table of tables) {
    for (const tipo of tipos) {
      console.log(`Criando cadastro ${tipo} em ${table}...`);
      const payload = {
        nome: `Teste ${tipo} ${table}`,
        telefone: '(62) 99999-9999',
        tipo: tipo,
        criado_por: userIds['diretor'] || null
      };
      
      const res = await request(`/rest/v1/${table}`, 'POST', payload);
      console.log(`✅ Cadastro ${tipo} em ${table} concluído.`);
    }
  }

  // 3. Validar se os dados aparecem
  console.log('\n--- VALIDANDO DADOS ---');
  const checkUsers = await request('/rest/v1/sindspag_usuarios?select=nome,cargo&limit=5&order=criado_em.desc', 'GET');
  console.log('Últimos usuários:', checkUsers);

  const checkSocial = await request('/rest/v1/tubarao_social?select=nome,tipo&limit=5&order=criado_em.desc', 'GET');
  console.log('Últimos cadastros social:', checkSocial);

  console.log('\n--- TESTES FINALIZADOS COM SUCESSO ---');
}

runTests().catch(console.error);
