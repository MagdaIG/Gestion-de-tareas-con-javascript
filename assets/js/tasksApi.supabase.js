import { supabase } from './supabaseClient.js';
import { getSessionUser } from './auth.js';

export class SupabaseTasksAPI {
  // LISTAR: devuelve SOLO las tareas del usuario (RLS lo garantiza)
  async list() {
    const { data, error } = await supabase
      .from('tareas')
      .select('*')
      .order('id', { ascending: false });
    if (error) throw error;
    return data; // [{id, user_id, ...}]
  }

  // CREAR: no hace falta enviar user_id si dejaste default = auth.uid(),
  // pero lo envío para pasar la policy WITH CHECK sin dudas
  async create({ titulo, descripcion = '', estado = 'borrador', completada = false }) {
    const user = await getSessionUser();
    if (!user) throw new Error('No hay sesión. Inicia sesión primero.');

    const { data, error } = await supabase
      .from('tareas')
      .insert([{
        user_id: user.id,
        titulo,
        descripcion,
        estado,
        completada
      }])
      .select()
      .single();

    if (error) throw error;
    return data;
  }

  // ACTUALIZAR por id (la RLS solo permite si la fila es tuya)
  async update(id, patch = {}) {
    const { data, error } = await supabase
      .from('tareas')
      .update(patch)
      .eq('id', id)
      .select()
      .single();

    if (error) throw error;
    return data;
  }

  // BORRAR por id (RLS igual)
  async remove(id) {
    const { error } = await supabase.from('tareas').delete().eq('id', id);
    if (error) throw error;
    return true;
  }
}
