import { createClient } from "@supabase/supabase-js";
const supabase = createClient('https://yvdfdmyusdhgtzfguxbj.supabase.co', 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Inl2ZGZkbXl1c2RoZ3R6Zmd1eGJqIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzM0OTg4MzksImV4cCI6MjA4OTA3NDgzOX0.-xSNbj5kLibkhJoXmOXjfmYPKBB-gqasQgy322Kk-n4');
async function test() {
  let { error } = await supabase.from('tubarao_social').insert({ nome: 'Teste', cpf: '123' });
  console.log('Error tubarao_social:', error);
}
test();
