const SUPABASE_URL = 'https://yvdfdmyusdhgtzfguxbj.supabase.co';
const SUPABASE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Inl2ZGZkbXl1c2RoZ3R6Zmd1eGJqIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzM0OTg4MzksImV4cCI6MjA4OTA3NDgzOX0.-xSNbj5kLibkhJoXmOXjfmYPKBB-gqasQgy322Kk-n4';

async function test() {
  const res = await fetch(`${SUPABASE_URL}/rest/v1/rpc/sindspag_criar_usuario`, {
    method: 'POST',
    headers: {
      'apikey': SUPABASE_KEY,
      'Authorization': `Bearer ${SUPABASE_KEY}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({ p_nome: 'Teste User', p_senha: '123', p_cargo: 'usuario' })
  });
  const data = await res.text();
  console.log('Status:', res.status);
  console.log('Data:', data);
}
test();
