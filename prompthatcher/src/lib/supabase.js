import { createClient } from '@supabase/supabase-js'

let supabaseClient = null

// Initialize or get Supabase client
export const getSupabaseClient = (url, anonKey) => {
  if (!url || !anonKey) {
    return null
  }

  if (!supabaseClient || supabaseClient.supabaseUrl !== url) {
    supabaseClient = createClient(url, anonKey, {
      auth: {
        persistSession: false
      }
    })
  }

  return supabaseClient
}

// Test connection to Supabase
export const testConnection = async (url, anonKey) => {
  try {
    const client = getSupabaseClient(url, anonKey)
    if (!client) {
      return { success: false, error: 'Invalid credentials' }
    }

    // Try to query the prompts table (or any table)
    const { error } = await client.from('prompts').select('id').limit(1)

    // If table doesn't exist, that's okay - connection works
    if (error && !error.message.includes('does not exist')) {
      return { success: false, error: error.message }
    }

    return { success: true }
  } catch (err) {
    return { success: false, error: err.message }
  }
}

// Initialize database tables if they don't exist
export const initializeTables = async (client) => {
  // Note: In production, you'd use Supabase migrations
  // This is a simplified version for demo purposes
  const tables = `
    -- Prompts table
    CREATE TABLE IF NOT EXISTS prompts (
      id TEXT PRIMARY KEY,
      name TEXT NOT NULL,
      content TEXT,
      mode TEXT,
      execution_time TEXT,
      capital NUMERIC,
      leverage NUMERIC,
      ai_model TEXT,
      min_ipe NUMERIC,
      num_results INTEGER,
      status TEXT,
      parent_prompt TEXT,
      trades INTEGER DEFAULT 0,
      win_rate NUMERIC DEFAULT 0,
      profit_factor NUMERIC DEFAULT 0,
      total_pnl NUMERIC DEFAULT 0,
      max_drawdown NUMERIC DEFAULT 0,
      created_at TIMESTAMPTZ DEFAULT NOW(),
      updated_at TIMESTAMPTZ DEFAULT NOW()
    );

    -- Signals table
    CREATE TABLE IF NOT EXISTS signals (
      id TEXT PRIMARY KEY,
      prompt_id TEXT REFERENCES prompts(id) ON DELETE CASCADE,
      prompt_name TEXT,
      asset TEXT,
      strategy TEXT,
      entry TEXT,
      take_profit TEXT,
      stop_loss TEXT,
      ipe NUMERIC,
      explanation TEXT,
      insights JSONB,
      status TEXT,
      result TEXT,
      pnl NUMERIC,
      created_at TIMESTAMPTZ DEFAULT NOW()
    );

    -- Settings table (single row)
    CREATE TABLE IF NOT EXISTS settings (
      id INTEGER PRIMARY KEY DEFAULT 1,
      ai_provider TEXT,
      ai_model TEXT,
      system_prompt TEXT,
      updated_at TIMESTAMPTZ DEFAULT NOW()
    );
  `

  return tables
}

// Sync prompts to Supabase
export const syncPrompts = async (client, prompts) => {
  if (!client || !prompts.length) return { success: true }

  try {
    const formattedPrompts = prompts.map(p => ({
      id: p.id,
      name: p.name,
      content: p.content,
      mode: p.mode,
      execution_time: p.executionTime,
      capital: p.capital,
      leverage: p.leverage,
      ai_model: p.aiModel,
      min_ipe: p.minIpe,
      num_results: p.numResults,
      status: p.status,
      parent_prompt: p.parentPrompt,
      trades: p.trades || 0,
      win_rate: p.winRate || 0,
      profit_factor: p.profitFactor || 0,
      total_pnl: p.totalPnl || 0,
      max_drawdown: p.maxDrawdown || 0,
      created_at: p.createdAt,
      updated_at: p.updatedAt
    }))

    const { error } = await client
      .from('prompts')
      .upsert(formattedPrompts, { onConflict: 'id' })

    if (error) throw error
    return { success: true }
  } catch (err) {
    console.error('Sync prompts error:', err)
    return { success: false, error: err.message }
  }
}

// Sync signals to Supabase
export const syncSignals = async (client, signals) => {
  if (!client || !signals.length) return { success: true }

  try {
    const formattedSignals = signals.map(s => ({
      id: s.id,
      prompt_id: s.promptId,
      prompt_name: s.promptName,
      asset: s.asset,
      strategy: s.strategy,
      entry: s.entry,
      take_profit: s.takeProfit,
      stop_loss: s.stopLoss,
      ipe: s.ipe,
      explanation: s.explanation,
      insights: s.insights,
      status: s.status,
      result: s.result,
      pnl: s.pnl,
      created_at: s.createdAt
    }))

    const { error } = await client
      .from('signals')
      .upsert(formattedSignals, { onConflict: 'id' })

    if (error) throw error
    return { success: true }
  } catch (err) {
    console.error('Sync signals error:', err)
    return { success: false, error: err.message }
  }
}

// Sync settings to Supabase
export const syncSettings = async (client, settings) => {
  if (!client) return { success: true }

  try {
    const { error } = await client
      .from('settings')
      .upsert({
        id: 1,
        ai_provider: settings.aiProvider,
        ai_model: settings.aiModel,
        system_prompt: settings.systemPrompt,
        updated_at: new Date().toISOString()
      }, { onConflict: 'id' })

    if (error) throw error
    return { success: true }
  } catch (err) {
    console.error('Sync settings error:', err)
    return { success: false, error: err.message }
  }
}

// Load prompts from Supabase
export const loadPrompts = async (client) => {
  if (!client) return { success: false, data: [] }

  try {
    const { data, error } = await client
      .from('prompts')
      .select('*')
      .order('created_at', { ascending: false })

    if (error) throw error

    const formattedPrompts = (data || []).map(p => ({
      id: p.id,
      name: p.name,
      content: p.content,
      mode: p.mode,
      executionTime: p.execution_time,
      capital: p.capital,
      leverage: p.leverage,
      aiModel: p.ai_model,
      minIpe: p.min_ipe,
      numResults: p.num_results,
      status: p.status,
      parentPrompt: p.parent_prompt,
      trades: p.trades,
      winRate: p.win_rate,
      profitFactor: p.profit_factor,
      totalPnl: p.total_pnl,
      maxDrawdown: p.max_drawdown,
      createdAt: p.created_at,
      updatedAt: p.updated_at
    }))

    return { success: true, data: formattedPrompts }
  } catch (err) {
    console.error('Load prompts error:', err)
    return { success: false, data: [], error: err.message }
  }
}

// Load signals from Supabase
export const loadSignals = async (client) => {
  if (!client) return { success: false, data: [] }

  try {
    const { data, error } = await client
      .from('signals')
      .select('*')
      .order('created_at', { ascending: false })

    if (error) throw error

    const formattedSignals = (data || []).map(s => ({
      id: s.id,
      promptId: s.prompt_id,
      promptName: s.prompt_name,
      asset: s.asset,
      strategy: s.strategy,
      entry: s.entry,
      takeProfit: s.take_profit,
      stopLoss: s.stop_loss,
      ipe: s.ipe,
      explanation: s.explanation,
      insights: s.insights,
      status: s.status,
      result: s.result,
      pnl: s.pnl,
      createdAt: s.created_at
    }))

    return { success: true, data: formattedSignals }
  } catch (err) {
    console.error('Load signals error:', err)
    return { success: false, data: [], error: err.message }
  }
}

// Load settings from Supabase
export const loadSettings = async (client) => {
  if (!client) return { success: false, data: null }

  try {
    const { data, error } = await client
      .from('settings')
      .select('*')
      .eq('id', 1)
      .single()

    if (error && error.code !== 'PGRST116') throw error

    if (data) {
      return {
        success: true,
        data: {
          aiProvider: data.ai_provider,
          aiModel: data.ai_model,
          systemPrompt: data.system_prompt
        }
      }
    }

    return { success: true, data: null }
  } catch (err) {
    console.error('Load settings error:', err)
    return { success: false, data: null, error: err.message }
  }
}

// Sync eggs to Supabase
export const syncEggs = async (client, eggs) => {
  if (!client || !eggs.length) return { success: true }

  try {
    const formattedEggs = eggs.map(e => ({
      id: e.id,
      prompt_id: e.promptId,
      prompt_name: e.promptName,
      prompt_content: e.promptContent,
      full_ai_prompt: e.fullAIPrompt,
      config: e.config,
      status: e.status,
      trades: e.trades,
      total_capital: e.totalCapital,
      execution_time: e.executionTime,
      expires_at: e.expiresAt,
      hatched_at: e.hatchedAt,
      results: e.results,
      created_at: e.createdAt
    }))

    const { error } = await client
      .from('eggs')
      .upsert(formattedEggs, { onConflict: 'id' })

    if (error) throw error
    return { success: true }
  } catch (err) {
    console.error('Sync eggs error:', err)
    return { success: false, error: err.message }
  }
}

// Load eggs from Supabase
export const loadEggs = async (client) => {
  if (!client) return { success: false, data: [] }

  try {
    const { data, error } = await client
      .from('eggs')
      .select('*')
      .order('created_at', { ascending: false })

    if (error) throw error

    const formattedEggs = (data || []).map(e => ({
      id: e.id,
      promptId: e.prompt_id,
      promptName: e.prompt_name,
      promptContent: e.prompt_content,
      fullAIPrompt: e.full_ai_prompt,
      config: e.config,
      status: e.status,
      trades: e.trades || [],
      totalCapital: e.total_capital,
      executionTime: e.execution_time,
      expiresAt: e.expires_at,
      hatchedAt: e.hatched_at,
      results: e.results,
      createdAt: e.created_at
    }))

    return { success: true, data: formattedEggs }
  } catch (err) {
    console.error('Load eggs error:', err)
    return { success: false, data: [], error: err.message }
  }
}

// Delete egg from Supabase
export const deleteEggFromCloud = async (client, eggId) => {
  if (!client) return { success: true }

  try {
    const { error } = await client
      .from('eggs')
      .delete()
      .eq('id', eggId)

    if (error) throw error
    return { success: true }
  } catch (err) {
    console.error('Delete egg error:', err)
    return { success: false, error: err.message }
  }
}

// Delete prompt from Supabase
export const deletePromptFromCloud = async (client, promptId) => {
  if (!client) return { success: true }

  try {
    const { error } = await client
      .from('prompts')
      .delete()
      .eq('id', promptId)

    if (error) throw error
    return { success: true }
  } catch (err) {
    console.error('Delete prompt error:', err)
    return { success: false, error: err.message }
  }
}

// Sync health checks to Supabase
export const syncHealthChecks = async (client, healthChecks) => {
  if (!client || !healthChecks.length) return { success: true }

  try {
    const formattedChecks = healthChecks.map(hc => ({
      id: hc.id,
      name: hc.name,
      preset: hc.preset,
      prompts: hc.prompts,
      schedule: hc.schedule,
      capital: hc.capital,
      eggs: hc.eggs,
      variations: hc.variations,
      is_active: hc.isActive,
      last_run: hc.lastRun,
      created_at: hc.createdAt
    }))

    const { error } = await client
      .from('health_checks')
      .upsert(formattedChecks, { onConflict: 'id' })

    if (error) throw error
    return { success: true }
  } catch (err) {
    console.error('Sync health checks error:', err)
    return { success: false, error: err.message }
  }
}

// Load health checks from Supabase
export const loadHealthChecks = async (client) => {
  if (!client) return { success: false, data: [] }

  try {
    const { data, error } = await client
      .from('health_checks')
      .select('*')
      .order('created_at', { ascending: false })

    if (error) throw error

    const formattedChecks = (data || []).map(hc => ({
      id: hc.id,
      name: hc.name,
      preset: hc.preset,
      prompts: hc.prompts,
      schedule: hc.schedule,
      capital: hc.capital,
      eggs: hc.eggs,
      variations: hc.variations,
      isActive: hc.is_active,
      lastRun: hc.last_run,
      createdAt: hc.created_at
    }))

    return { success: true, data: formattedChecks }
  } catch (err) {
    console.error('Load health checks error:', err)
    return { success: false, data: [], error: err.message }
  }
}

// Delete health check from Supabase
export const deleteHealthCheckFromCloud = async (client, healthCheckId) => {
  if (!client) return { success: true }

  try {
    const { error } = await client
      .from('health_checks')
      .delete()
      .eq('id', healthCheckId)

    if (error) throw error
    return { success: true }
  } catch (err) {
    console.error('Delete health check error:', err)
    return { success: false, error: err.message }
  }
}
