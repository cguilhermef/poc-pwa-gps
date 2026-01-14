/**
 * Script para testar conexão com Supabase
 * Uso: npx tsx scripts/test-supabase-connection.ts
 * 
 * Requer variáveis de ambiente configuradas em .env.local:
 * - SUPABASE_URL
 * - SUPABASE_SERVICE_ROLE_KEY
 */

import { createClient } from '@supabase/supabase-js';

async function testConnection() {
  const supabaseUrl = process.env.SUPABASE_URL;
  const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!supabaseUrl || !supabaseKey) {
    console.error('❌ Variáveis de ambiente não configuradas.');
    console.error('   Configure SUPABASE_URL e SUPABASE_SERVICE_ROLE_KEY em .env.local');
    process.exit(1);
  }

  console.log('🔄 Testando conexão com Supabase...');
  console.log(`   URL: ${supabaseUrl}`);

  const supabase = createClient(supabaseUrl, supabaseKey, {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  });

  try {
    // Testa conexão verificando se a tabela existe
    const { data, error } = await supabase
      .from('tracking_points')
      .select('id')
      .limit(1);

    if (error) {
      // Se o erro for "relation does not exist", a conexão funcionou mas a tabela não existe
      if (error.message.includes('does not exist')) {
        console.log('✅ Conexão com Supabase estabelecida com sucesso!');
        console.log('⚠️  Tabela tracking_points não encontrada.');
        console.log('   Execute o schema.sql no Supabase para criar a tabela.');
        process.exit(0);
      }
      throw error;
    }

    console.log('✅ Conexão com Supabase estabelecida com sucesso!');
    console.log('✅ Tabela tracking_points encontrada.');
    console.log(`   Registros encontrados: ${data?.length ?? 0}`);
  } catch (err) {
    console.error('❌ Erro ao conectar com Supabase:', err);
    process.exit(1);
  }
}

testConnection();
