

/* ==== SUPABASE CLIENT ==== */
const SUPABASE_URL = 'https://njmebzqpzjvmndxiyfpq.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im5qbWVienFwemp2bW5keGl5ZnBxIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTUxMjk3NzksImV4cCI6MjA3MDcwNTc3OX0.l2n7ZLBjf6vP_SAF3yxxRPulrCcrpvYO9UmY2xKWf0o';

let supabaseClient;

// Inicialización del cliente de Supabase
async function initializeSupabase() {
  try {
    // Carga por CDN si existe, si no, usa ESM dinámico
    if (window.supabase) {
      supabaseClient = window.supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
    } else {
      const { createClient } = await import('https://esm.sh/@supabase/supabase-js@2?bundle');
      supabaseClient = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
    }
    console.log('Cliente de Supabase inicializado correctamente');
  } catch (error) {
    console.error('Error al inicializar Supabase:', error);
    throw error;
  }
}

// Inicializar inmediatamente
initializeSupabase();

/* ==== Utils ==== */
const Util = {
  esc: (s) => String(s)
    .replace(/&/g,"&amp;").replace(/</g,"&lt;")
    .replace(/>/g,"&gt;").replace(/"/g,"&quot;").replace(/'/g,"&#039;"),
  setStatus: (el, msg, tipo='info', dur=2500) => {
    el.textContent = msg; el.className = `status notificacion ${tipo}`;
    if (dur>0) setTimeout(()=>{ el.textContent=''; el.className='status notificacion'; }, dur);
  },
  safeShow(d){ try{ d.showModal(); } catch{ d.setAttribute('open',''); } },
  safeClose(d){ try{ d.close(); } catch{ d.removeAttribute('open'); } },
  validateTask: (t) => {
    if (!t.titulo || t.titulo.trim().length < 3) return {ok:false,msg:"El título debe tener al menos 3 caracteres"};
    if (t.progreso < 0 || t.progreso > 100) return {ok:false,msg:"El progreso debe estar entre 0 y 100"};
    return {ok:true};
  },
};

/* ==== Modal genérico (mensajes/confirm) ==== */
const AppModal = (() => {
  // Usa el modal de tu HTML (appDialog). Si no existe, lo crea.
  let dlg = document.getElementById('appDialog');
  if (!dlg) {
    dlg = document.createElement('dialog');
    dlg.id = 'appDialog';
    dlg.className = 'modal';
    dlg.innerHTML = `
      <div class="modal-card">
        <h3 id="appDialogTitle">Mensaje</h3>
        <p id="appDialogText" class="muted"></p>
        <div class="modal-actions">
          <button id="appDialogCancel" class="btn ghost">Cancelar</button>
          <button id="appDialogOk" class="btn primary">Aceptar</button>
        </div>
      </div>`;
    document.body.appendChild(dlg);
  }
  const t = dlg.querySelector('#appDialogTitle');
  const p = dlg.querySelector('#appDialogText');
  const btnOk = dlg.querySelector('#appDialogOk');
  const btnCancel = dlg.querySelector('#appDialogCancel');

  function info(text, title="Mensaje"){
    return new Promise(res=>{
      t.textContent = title; p.textContent = text; btnCancel.style.display='none';
      Util.safeShow(dlg);
      const onOk = ()=>{ btnOk.removeEventListener('click', onOk); Util.safeClose(dlg); res(true); };
      btnOk.addEventListener('click', onOk, {once:true});
    });
  }
  function confirm(text, title="Confirmar"){
    return new Promise(res=>{
      t.textContent = title; p.textContent = text; btnCancel.style.display='';
      Util.safeShow(dlg);
      const ok = ()=>{ cleanup(); Util.safeClose(dlg); res(true); };
      const cancel = ()=>{ cleanup(); Util.safeClose(dlg); res(false); };
      function cleanup(){ btnOk.removeEventListener('click', ok); btnCancel.removeEventListener('click', cancel); }
      btnOk.addEventListener('click', ok);
      btnCancel.addEventListener('click', cancel);
    });
  }
  return { info, confirm };
})();

/* ==== Modal de Auth (login/registro) ==== */
const AuthModal = (() => {
  let dlg = document.getElementById('authDialog');
  if (!dlg) {
    dlg = document.createElement('dialog');
    dlg.id = 'authDialog';
    dlg.className = 'modal';
    dlg.innerHTML = `
      <div class="modal-card">
        <h3 id="authTitle">Iniciar sesión</h3>
        <form id="authForm">
          <label>Email
            <input id="authEmail" type="email" required placeholder="tu@correo.com" />
          </label>
          <label>Contraseña
            <input id="authPass" type="password" required placeholder="••••••••" />
          </label>
          <div class="modal-actions">
            <button id="authSwitch" type="button" class="btn ghost">¿No tienes cuenta? Regístrate</button>
            <button id="authSubmit" class="btn primary" type="submit">Entrar</button>
          </div>
        </form>
      </div>
    `;
    document.body.appendChild(dlg);
  }
  const $title = dlg.querySelector('#authTitle');
  const $form  = dlg.querySelector('#authForm');
  const $email = dlg.querySelector('#authEmail');
  const $pass  = dlg.querySelector('#authPass');
  const $switch= dlg.querySelector('#authSwitch');
  const $submit= dlg.querySelector('#authSubmit');
  let mode = 'login'; // 'signup' | 'login'

  $switch.addEventListener('click', ()=>{
    mode = (mode === 'login') ? 'signup' : 'login';
    $title.textContent = (mode === 'login') ? 'Iniciar sesión' : 'Crear cuenta';
    $submit.textContent= (mode === 'login') ? 'Entrar' : 'Registrarme';
    $switch.textContent= (mode === 'login') ? '¿No tienes cuenta? Regístrate' : '¿Ya tienes cuenta? Inicia sesión';
  });

  function open(){ Util.safeShow(dlg); }
  function close(){ Util.safeClose(dlg); }

  async function onSubmit(handler){
    $form.addEventListener('submit', async (e)=>{
      e.preventDefault();
      const email = $email.value.trim();
      const pass  = $pass.value.trim();
      if (!email || !pass) { AppModal.info("Escribe email y contraseña.", "Validación"); return; }
      try{
        await handler({ mode, email, pass });
        close();
      }catch(err){
        console.error(err);
        AppModal.info(err.message || "Error de autenticación", "Auth");
      }
    });
  }
  return { open, onSubmit };
})();

/* ==== Modelos ==== */
class Tarea {
  constructor({ id, user_id, titulo, descripcion="", completada=false, estado="borrador", progreso=0 }) {
    this.id = id;                           // int8
    this.user_id = user_id;                 // uuid
    this.titulo = titulo;
    this.descripcion = descripcion;
    this.completada = !!completada;
    this.estado = estado;                   // borrador | en_progreso | edicion | completada
    this.progreso = Number(progreso || (this.completada ? 100 : 0));
  }
}
class ListaTareas {
  constructor(){ this.tareas = []; }
  add(t){ this.tareas.push(t); }
  remove(id){ this.tareas = this.tareas.filter(x=>x.id!==id); }
  get(id){ return this.tareas.find(x=>x.id===id) || null; }
  all(){ return [...this.tareas]; }
  countBy(estado){ return this.tareas.filter(x=>x.estado===estado).length; }
}

/* ==== API Supabase (tareas) ==== */
class SupabaseTasksAPI {
  async currentUser(){
    try {
      // Obtener usuario directamente
      const { data, error } = await supabaseClient.auth.getUser();
      if (error) {
        console.log('Error al obtener usuario actual:', error.message);
        return null;
      }
      return data.user || null;
    } catch (error) {
      console.log('Excepción al obtener usuario actual:', error.message);
      return null;
    }
  }
    async list(){
    const user = await this.currentUser();
    if (!user) {
      console.log('No hay usuario autenticado para listar tareas');
      return [];
    }

    const { data, error } = await supabaseClient
      .from('tareas')
      .select('*')
      .eq('user_id', user.id)
      .order('id', { ascending:false });
    if (error) throw error;
    return data.map(d => new Tarea(d));
  }
    async create({ titulo, descripcion="", estado="borrador", completada=false, progreso=0 }){
    try {
      console.log('=== INICIANDO CREACIÓN DE TAREA ===');

      // Obtener el usuario actual para asociar la tarea
      const user = await this.currentUser();
      console.log('Usuario obtenido:', user ? user.email : 'null');

      if (!user) {
        console.log('No hay usuario para crear tarea');
        throw new Error("No hay sesión. Inicia sesión.");
      }

      console.log('Usuario válido:', user.email);
      console.log('User ID:', user.id);

      // Crear el payload con los datos de la tarea y el ID del usuario
      const payload = { user_id: user.id, titulo, descripcion, estado, completada, progreso };
      console.log('Payload a enviar:', payload);

      // Insertar la tarea en la base de datos
      const { data, error } = await supabaseClient.from('tareas').insert([payload]).select().single();

      if (error) {
        console.error('Error de Supabase al crear tarea:', error);
        console.error('Código de error:', error.code);
        console.error('Mensaje de error:', error.message);
        console.error('Detalles:', error.details);
        throw error;
      }

      console.log('Tarea creada exitosamente:', data);
      return new Tarea(data);
    } catch (error) {
      console.error('Error completo al crear tarea:', error);
      throw error;
    }
  }
    async update(id, patch){
    const user = await this.currentUser();
    if (!user) throw new Error("No hay sesión. Inicia sesión.");

    const { data, error } = await supabaseClient
      .from('tareas')
      .update(patch)
      .eq('id', id)
      .eq('user_id', user.id)
      .select()
      .single();
    if (error) {
      console.error('Error al actualizar tarea:', error);
      throw error;
    }
    if (!data) throw new Error("Tarea no encontrada o no tienes permisos para editarla.");
    return new Tarea(data);
  }
    async remove(id){
    const user = await this.currentUser();
    if (!user) throw new Error("No hay sesión. Inicia sesión.");

    const { error } = await supabaseClient
      .from('tareas')
      .delete()
      .eq('id', id)
      .eq('user_id', user.id);
    if (error) {
      console.error('Error al eliminar tarea:', error);
      throw error;
    }
    return true;
  }
}

/* ==== App ==== */
class App {
  constructor(){
    this.api = new SupabaseTasksAPI();
    this.lista = new ListaTareas();

    // DOM
    this.$status = document.getElementById('statusMsg');
    this.$counts = {
      borrador: document.querySelector('[data-count="draft"]'),
      en_progreso: document.querySelector('[data-count="in_progress"]'),
      edicion: document.querySelector('[data-count="editing"]'),
      completada: document.querySelector('[data-count="done"]'),
    };

    // Modal tarea
    this.$dlg = document.getElementById('taskDialog');
    this.$form = document.getElementById('taskForm');
    this.$titleH = document.getElementById('modalTitle');
    this.$id = document.getElementById('taskId');
    this.$titulo = document.getElementById('title');
    this.$desc = document.getElementById('description');
    this.$estado = document.getElementById('status');
    this.$prog = document.getElementById('progress');
    const $cancel = document.getElementById('cancelTaskBtn');

    // Listeners
    document.getElementById('addTaskBtn').addEventListener('click', ()=> this.openNew());
    document.getElementById('reloadBtn').addEventListener('click', ()=> this.load());
    $cancel?.addEventListener('click', ()=> Util.safeClose(this.$dlg));
    this.$form.addEventListener('submit', (e)=> this.onSave(e));
    // --- Auth UI (botones de sesión) ---
    this.$loginBtn  = document.getElementById('loginBtn');
    this.$logoutBtn = document.getElementById('logoutBtn');
    this.$verifyEmailBtn = document.getElementById('verifyEmailBtn');
    this.$userChip  = document.getElementById('userChip');
    this.$userEmail = document.getElementById('userEmail');

    this.$loginBtn?.addEventListener('click', ()=> this.openLogin());
    this.$logoutBtn?.addEventListener('click', ()=> this.logout());
    this.$verifyEmailBtn?.addEventListener('click', ()=> this.resendVerificationEmail());

// Refresca la UI cuando cambie la sesión (login/logout en cualquier pestaña)
    supabaseClient.auth.onAuthStateChange((event, session)=>{
      console.log('Cambio de estado de autenticación:', event, session?.user?.email);
      const user = session?.user ?? null;
      this.updateSessionUI(user);
      if (user) {
        this.load();
      } else {
        this.clearBoard();
      }
    });

    // Drag & Drop (delegación)
    const board = document.querySelector('.board');
    board.addEventListener('click', (e)=>{
      const btn = e.target.closest('.icon-btn'); if(!btn) return;
      const card = e.target.closest('.card'); if(!card) return;
      const id = Number(card.dataset.id);
      const action = btn.dataset.action;
      if (action === 'toggle') this.toggleDone(id);
      else if (action === 'edit') this.openEdit(id);
      else if (action === 'delete') this.remove(id);
    });
    board.addEventListener('dragstart', (e)=>{
      const card = e.target.closest('.card'); if(!card) return;
      card.classList.add('dragging');
      e.dataTransfer.setData('text/plain', card.dataset.id);
      e.dataTransfer.effectAllowed = 'move';
    });
    board.addEventListener('dragend', (e)=>{
      const card = e.target.closest('.card'); if(card) card.classList.remove('dragging');
    });
    document.querySelectorAll(".dropzone").forEach(z=>{
      z.addEventListener("dragover", e=>{ e.preventDefault(); z.classList.add("drag-over"); });
      z.addEventListener("dragleave", ()=> z.classList.remove("drag-over"));
      z.addEventListener("drop", e=> this.onDrop(e, z));
    });

    // Auth: abre modal si no hay sesión
    AuthModal.onSubmit(async ({mode, email, pass})=>{
      try {
        if (mode === 'signup') {
          const { data, error } = await supabaseClient.auth.signUp({ email, password: pass });
          if (error) throw error;

          if (data.user && !data.session) {
            await AppModal.info("Cuenta creada. Revisa tu correo para verificar tu cuenta.", "Registro");
          } else {
            await AppModal.info("Cuenta creada y sesión iniciada.", "Registro");
            // Actualizar UI después del registro exitoso
            this.updateSessionUI(data.user);
          }
        } else {
          const { data, error } = await supabaseClient.auth.signInWithPassword({ email, password: pass });
          if (error) throw error;

          if (data.user) {
            await AppModal.info(`Bienvenido, ${data.user.email}!`, "Login");
            // Actualizar UI después del login exitoso
            this.updateSessionUI(data.user);
          }
        }

        // Recargar tareas después del login
        await this.load();
      } catch (error) {
        console.error('Error de autenticación:', error);

        // Mensajes de error más específicos
        let errorMessage = "Error de autenticación";
        if (error.message.includes('Invalid login credentials')) {
          errorMessage = "Email o contraseña incorrectos";
        } else if (error.message.includes('Email not confirmed')) {
          errorMessage = "Confirma tu email antes de iniciar sesión";
        } else if (error.message.includes('User already registered')) {
          errorMessage = "Este email ya está registrado";
        } else if (error.message.includes('Password should be at least')) {
          errorMessage = "La contraseña debe tener al menos 6 caracteres";
        }

        AppModal.info(errorMessage, "Error");
      }
    });

    // Inicializa
    this.bootstrap();
  }

                async bootstrap(){
    try{
      console.log('=== INICIANDO BOOTSTRAP ===');

      // Intentar obtener el usuario directamente
      const { data, error } = await supabaseClient.auth.getUser();

      if (error || !data.user) {
        console.log('No hay usuario autenticado:', error?.message || 'Usuario no encontrado');
        this.updateSessionUI(null);
        Util.setStatus(this.$status, "Inicia sesión para ver tus tareas.", "info", 0);
        return;
      }

      // Usuario autenticado
      console.log('Usuario autenticado en bootstrap:', data.user.email);
      this.updateSessionUI(data.user);
      await this.load();
    }catch(e){
      console.error('Error en bootstrap:', e);
      this.updateSessionUI(null);
      Util.setStatus(this.$status, "Inicia sesión para ver tus tareas.", "info", 0);
    }
  }

  async load(){
    try{
      Util.setStatus(this.$status, "Cargando tareas…", "info", 0);
      const data = await this.api.list();
      this.lista = new ListaTareas();
      data.forEach(t => this.lista.add(t));
      this.render();
      Util.setStatus(this.$status, data.length > 0 ? "Listo." : "No hay tareas. Crea una nueva.", "exito");
    }catch(e){
      console.error('Error al cargar tareas:', e);
      Util.setStatus(this.$status, "Error al cargar las tareas.", "error");
      this.clearBoard();
    }
  }

      openNew(){
    // Abrir modal directamente, la verificación se hará al guardar
    this.$titleH.textContent = "Nueva Tarea";
    this.$id.value = "";
    this.$titulo.value = "";
    this.$desc.value = "";
    this.$estado.value = "borrador";
    this.$prog.value = 0;
    Util.safeShow(this.$dlg);
  }

  openEdit(id){
    const t = this.lista.get(id); if(!t) return;
    this.$titleH.textContent = "Editar Tarea";
    this.$id.value = t.id;
    this.$titulo.value = t.titulo;
    this.$desc.value = t.descripcion || "";
    this.$estado.value = t.estado;
    this.$prog.value = t.progreso;
    Util.safeShow(this.$dlg);
  }

  async onSave(e){
    e.preventDefault();
    const payload = {
      id: this.$id.value ? Number(this.$id.value) : null,
      titulo: this.$titulo.value.trim(),
      descripcion: this.$desc.value.trim(),
      estado: this.$estado.value,
      progreso: Number(this.$prog.value || 0),
      completada: this.$estado.value === "completada"
    };
    const v = Util.validateTask(payload);
    if(!v.ok){ AppModal.info(v.msg, "Validación"); return; }

    try{
      if(payload.id){
        const updated = await this.api.update(payload.id, {
          titulo: payload.titulo,
          descripcion: payload.descripcion,
          estado: payload.estado,
          progreso: payload.progreso,
          completada: payload.completada
        });
        const t = this.lista.get(payload.id);
        if (t) Object.assign(t, updated);
      }else{
        const created = await this.api.create(payload);
        this.lista.add(created);
      }
      Util.safeClose(this.$dlg);
      this.render();
      AppModal.info("Tarea guardada con éxito.", "Éxito");
    }catch(err){
      console.error('Error al guardar tarea:', err);

      // Manejar errores de autenticación específicamente
      if (err.message?.includes('No hay sesión') || err.message?.includes('AuthSessionMissingError')) {
        AppModal.info("Error de autenticación. Verifica tu sesión.", "Error de sesión");
        // No abrir automáticamente el modal de login
      } else {
        AppModal.info(err.message || "Error al guardar la tarea.", "Error");
      }
    }
  }

  async remove(id){
    const ok = await AppModal.confirm("¿Eliminar esta tarea?", "Confirmar");
    if(!ok) return;
    try{
      await this.api.remove(id);
      this.lista.remove(id);
      this.render();
      AppModal.info("Tarea eliminada.", "Éxito");
    }catch(err){
      console.error(err);
      AppModal.info(err.message || "No se pudo eliminar.", "Error");
    }
  }

  async toggleDone(id){
    const t = this.lista.get(id); if(!t) return;
    const next = !t.completada;
    try{
      const updated = await this.api.update(id, {
        completada: next,
        estado: next ? "completada" : "en_progreso",
        progreso: next ? 100 : Math.min(t.progreso, 95)
      });
      Object.assign(t, updated);
      this.render();
    }catch(err){
      console.error(err);
      AppModal.info(err.message || "No se pudo actualizar el estado.", "Error");
    }
  }

  async onDrop(e, zone){
    e.preventDefault(); zone.classList.remove("drag-over");

    // Obtener el ID de la tarea desde el drag event
    const id = Number(e.dataTransfer.getData('text/plain'));
    const t = this.lista.get(id); if(!t) return;

    // Mapear el ID de la columna al estado correspondiente
    const map = { "col-draft":"borrador", "col-in_progress":"en_progreso", "col-editing":"edicion", "col-done":"completada" };
    const nuevo = map[zone.id] || "borrador";
    if(t.estado === nuevo) return;

    try{
      // Actualizar la tarea con el nuevo estado
      const updated = await this.api.update(id, {
        estado: nuevo,
        completada: (nuevo === "completada"),
        progreso: (nuevo === "completada") ? 100 : Math.min(t.progreso, 95)
      });
      Object.assign(t, updated);
      this.render();
    }catch(err){
      console.error(err);
      AppModal.info(err.message || "No se pudo mover la tarea.", "Error");
    }
  }

  render(){
    // Obtener referencias a todas las columnas del tablero
    const cols = {
      borrador: document.getElementById("col-draft"),
      en_progreso: document.getElementById("col-in_progress"),
      edicion: document.getElementById("col-editing"),
      completada: document.getElementById("col-done")
    };

    // Limpiar todas las columnas
    Object.values(cols).forEach(c => c.innerHTML = "");

    // Renderizar cada tarea en su columna correspondiente
    this.lista.all().forEach(t => cols[t.estado]?.appendChild(this.card(t)));

    // Actualizar los contadores de cada estado
    const mapC = { borrador:"draft", en_progreso:"in_progress", edicion:"editing", completada:"done" };
    Object.entries(mapC).forEach(([k,attr])=>{
      const el = document.querySelector(`[data-count="${attr}"]`);
      if(el) el.textContent = this.lista.countBy(k);
    });
  }

  // SVGs profesionales
  svgCheck(){ return `<svg class="icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M9 12l2 2 4-4"></path><circle cx="12" cy="12" r="9"></circle></svg>`; }
  svgEdit(){ return `<svg class="icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M12 20h9"></path><path d="M16.5 3.5a2.121 2.121 0 013 3L7 19l-4 1 1-4 12.5-12.5z"></path></svg>`; }
  svgTrash(){ return `<svg class="icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><polyline points="3 6 5 6 21 6"></polyline><path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6"></path><path d="M10 11v6"></path><path d="M14 11v6"></path><path d="M9 6V4a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v2"></path></svg>`; }

  card(t){
    const el = document.createElement('article');
    el.className = `card card--${t.estado}`;
    el.draggable = true;
    el.dataset.id = t.id;

    // Obtener el email del usuario actual para mostrar en lugar del ID
    const currentUserEmail = this.$userEmail?.textContent || 'Usuario';

    el.innerHTML = `
      <div class="title">${Util.esc(t.titulo)}</div>
      <div class="desc">${t.descripcion ? Util.esc(t.descripcion) + " — " : ""}por: ${currentUserEmail}</div>
      <div class="progress"><span style="width:${t.progreso||0}%"></span></div>
      <div class="meta">
        <span class="badge ${t.completada ? "done" : "wip"}">${t.completada ? "Completada" : "En progreso"}</span>
        <div class="actions">
          <button class="icon-btn" data-action="toggle" title="Alternar completada" aria-label="Alternar completada">${this.svgCheck()}</button>
          <button class="icon-btn" data-action="edit" title="Editar" aria-label="Editar">${this.svgEdit()}</button>
          <button class="icon-btn" data-action="delete" title="Eliminar" aria-label="Eliminar">${this.svgTrash()}</button>
        </div>
      </div>
    `;
    return el;
  }
  openLogin(){
    AuthModal.open();
  }

          async getCurrentUser() {
    try {
      console.log('=== OBTENIENDO USUARIO ACTUAL ===');

      // Obtener usuario directamente sin verificar sesión primero
      const { data, error } = await supabaseClient.auth.getUser();

      if (error) {
        console.log('Error al obtener usuario:', error.message);
        return null;
      }

      if (data.user) {
        console.log('Usuario obtenido:', data.user.email);
        console.log('User ID:', data.user.id);
        return data.user;
      } else {
        console.log('No hay usuario en la respuesta');
        return null;
      }
    } catch (error) {
      console.log('Excepción al obtener usuario:', error.message);
      return null;
    }
  }

  async resendVerificationEmail() {
    try {
      const user = await this.getCurrentUser();
      if (!user) {
        AppModal.info("No hay usuario autenticado.", "Error");
        return;
      }

      const { error } = await supabaseClient.auth.resend({
        type: 'signup',
        email: user.email
      });

      if (error) throw error;

      await AppModal.info("Email de verificación enviado. Revisa tu bandeja de entrada.", "Verificación");
    } catch (error) {
      console.error('Error al reenviar email:', error);
      AppModal.info("Error al reenviar el email de verificación.", "Error");
    }
  }

  async logout(){
    try {
      await supabaseClient.auth.signOut();
      this.updateSessionUI(null);
      this.clearBoard();
      Util.setStatus(this.$status, "Sesión cerrada. Inicia sesión para ver tus tareas.", "info", 0);
    } catch (error) {
      console.error('Error al cerrar sesión:', error);
      Util.setStatus(this.$status, "Error al cerrar sesión.", "error");
    }
  }

    updateSessionUI(user){
    const logged = !!user;
    console.log('Actualizando UI de sesión:', logged ? user.email : 'No autenticado');

    if (logged){
      this.$userEmail.textContent = user.email || user.id.slice(0,8)+"…";
      this.$userChip.classList.remove('hidden');
      this.$logoutBtn.classList.remove('hidden');
      this.$loginBtn.classList.add('hidden');

      // Mostrar botón de verificación si el email no está confirmado
      if (!user.email_confirmed_at) {
        this.$verifyEmailBtn.classList.remove('hidden');
      } else {
        this.$verifyEmailBtn.classList.add('hidden');
      }
    }else{
      this.$userChip.classList.add('hidden');
      this.$logoutBtn.classList.add('hidden');
      this.$verifyEmailBtn.classList.add('hidden');
      this.$loginBtn.classList.remove('hidden');
    }
  }

  clearBoard(){
    // Limpia columnas y contadores
    ['col-draft','col-in_progress','col-editing','col-done'].forEach(id=>{
      const n = document.getElementById(id); if (n) n.innerHTML = '';
    });
    this.$counts.borrador.textContent = '0';
    this.$counts.en_progreso.textContent = '0';
    this.$counts.edicion.textContent = '0';
    this.$counts.completada.textContent = '0';
  }



        async isAuthenticated() {
    try {
      const { data, error } = await supabaseClient.auth.getUser();
      const isAuth = !error && data.user !== null;

      if (isAuth && data.user && !data.user.email_confirmed_at) {
        console.log('Estado de autenticación: Usuario no verificado');
        // Opcional: mostrar mensaje de verificación
        Util.setStatus(this.$status, "Verifica tu email para acceder a todas las funciones.", "info", 0);
      }

      console.log('Estado de autenticación:', isAuth ? 'Autenticado' : 'No autenticado');
      return isAuth;
    } catch (error) {
      console.log('Error al verificar autenticación:', error.message);
      return false;
    }
  }


}

/* Init */
document.addEventListener('DOMContentLoaded', async () => {
  try {
    // Esperar a que Supabase esté inicializado
    if (!supabaseClient) {
      await initializeSupabase();
    }
    new App();
  } catch (error) {
    console.error('Error al inicializar la aplicación:', error);
    // Mostrar mensaje de error en la UI
    const statusEl = document.getElementById('statusMsg');
    if (statusEl) {
      statusEl.textContent = 'Error al conectar con la base de datos. Recarga la página.';
      statusEl.className = 'status notificacion error';
    }
  }
});
