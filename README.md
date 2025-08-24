# Gestión de Tareas con Supabase

Una aplicación web para gestionar tareas con autenticación de usuarios usando Supabase. Esta aplicación permite crear, organizar y gestionar tareas de manera eficiente con una interfaz moderna y intuitiva.

## Descripción

Esta aplicación de gestión de tareas incluye todas las funcionalidades básicas que necesitas para organizar tu trabajo:

- **Sistema de autenticación**: Registro, inicio de sesión y verificación de email
- **Gestión completa de tareas**: Crear, editar, eliminar y organizar tareas
- **Organización visual**: Arrastra tareas entre columnas según su estado
- **Estados de tareas**: Borrador, En progreso, Edición, Completada
- **Progreso visual**: Barras de progreso para cada tarea
- **Interfaz responsiva**: Funciona en desktop y dispositivos móviles

## Configuración

### Requisitos previos

- Una cuenta en [Supabase](https://supabase.com)
- Conocimientos básicos de bases de datos (opcional)

### Paso 1: Crear proyecto en Supabase

1. Ve a [supabase.com](https://supabase.com)
2. Crea una nueva cuenta o inicia sesión
3. Crea un nuevo proyecto
4. Anota tu **URL del proyecto** y **clave anónima**

### Paso 2: Configurar la base de datos

En el panel de Supabase, ve a la sección "SQL Editor" y ejecuta el siguiente código:

```sql
-- Crear tabla de tareas
CREATE TABLE tareas (
  id BIGSERIAL PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  titulo TEXT NOT NULL,
  descripcion TEXT DEFAULT '',
  completada BOOLEAN DEFAULT false,
  estado TEXT DEFAULT 'borrador' CHECK (estado IN ('borrador', 'en_progreso', 'edicion', 'completada')),
  progreso INTEGER DEFAULT 0 CHECK (progreso >= 0 AND progreso <= 100),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Habilitar seguridad a nivel de fila
ALTER TABLE tareas ENABLE ROW LEVEL SECURITY;

-- Políticas de seguridad para que cada usuario solo vea sus tareas
CREATE POLICY "Users can view own tasks" ON tareas
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own tasks" ON tareas
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own tasks" ON tareas
  FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own tasks" ON tareas
  FOR DELETE USING (auth.uid() = user_id);

-- Función para actualizar automáticamente la fecha de modificación
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_tareas_updated_at 
  BEFORE UPDATE ON tareas 
  FOR EACH ROW 
  EXECUTE FUNCTION update_updated_at_column();
```

### Paso 3: Configurar autenticación

1. En Supabase, ve a **Authentication > Settings**
2. En **Site URL**, agrega: `http://localhost:3000`
3. En **Redirect URLs**, agrega: `http://localhost:3000`
4. Para desarrollo, puedes desactivar **Enable email confirmations**

### Paso 4: Actualizar credenciales

En el archivo `assets/js/gestionTareas.js`, reemplaza las credenciales con las tuyas:

```javascript
const SUPABASE_URL = 'TU_URL_DE_SUPABASE';
const SUPABASE_ANON_KEY = 'TU_CLAVE_ANONIMA';
```

## Instalación y uso

### Instalación rápida

1. **Descargar el proyecto**:
   ```bash
   git clone [URL_DEL_REPOSITORIO]
   cd gestion-tareas
   ```

2. **Abrir la aplicación**:
   - Opción A: Abre `index.html` directamente en tu navegador
   - Opción B: Usa un servidor local: `npx serve .`

### Primeros pasos

1. **Crear cuenta**: Haz clic en "Iniciar sesión" y luego "¿No tienes cuenta? Regístrate"
2. **Verificar email**: Revisa tu correo y confirma tu cuenta
3. **Crear tu primera tarea**: Haz clic en el botón "+ Nueva"
4. **Organizar tareas**: Arrastra las tareas entre las columnas según su estado

### Funcionalidades principales

- **Crear tarea**: Botón "+ Nueva" en la parte superior
- **Editar tarea**: Haz clic en el ícono de lápiz en cada tarea
- **Eliminar tarea**: Haz clic en el ícono de papelera
- **Marcar como completada**: Haz clic en el ícono de check
- **Mover tarea**: Arrastra la tarea a otra columna
- **Recargar datos**: Botón "Recargar" para sincronizar

## Estructura del proyecto

```
gestion-tareas/
├── index.html                 # Página principal de la aplicación
├── assets/
│   ├── css/
│   │   └── styles.css         # Estilos y diseño visual
│   └── js/
│       └── gestionTareas.js   # Lógica y funcionalidad
├── config.example.js          # Ejemplo de configuración
└── README.md                  # Este archivo de documentación
```

## Tecnologías utilizadas

- **Frontend**: HTML5, CSS3, JavaScript moderno
- **Backend**: Supabase (PostgreSQL + sistema de autenticación)
- **Diseño**: CSS Grid y Flexbox para layout responsivo
- **Autenticación**: Sistema de usuarios de Supabase
- **Base de datos**: PostgreSQL con seguridad a nivel de fila
- **Despliegue**: Aplicación web estática

## Seguridad

La aplicación incluye varias capas de seguridad:

- **Autenticación segura**: Sistema de usuarios con tokens JWT
- **Seguridad a nivel de fila**: Cada usuario solo puede ver y modificar sus propias tareas
- **Validación de datos**: Verificación tanto en el navegador como en el servidor
- **HTTPS**: Recomendado para uso en producción

## Solución de problemas

### Problema: No puedo iniciar sesión
**Solución**: 
- Verifica que las credenciales de Supabase sean correctas
- Confirma que la configuración de autenticación esté completa
- Revisa la consola del navegador para mensajes de error

### Problema: No se cargan las tareas
**Solución**:
- Asegúrate de estar autenticado
- Verifica que la tabla 'tareas' exista en Supabase
- Confirma que las políticas de seguridad estén configuradas

### Problema: Error de CORS
**Solución**:
- Usa un servidor local en lugar de abrir el archivo directamente
- Verifica que las URLs de redirección estén configuradas correctamente en Supabase

## Contribuir al proyecto

Si quieres contribuir a este proyecto:

1. Haz un fork del repositorio
2. Crea una rama para tu nueva funcionalidad
3. Realiza tus cambios y haz commit
4. Envía un pull request con tu contribución

## Licencia

Este proyecto está bajo la Licencia MIT. Puedes usar, modificar y distribuir este código libremente.

---

## Autor

Desarrollado por **Magdalena Inalaf G.**

- [Sitio web](https://inalaf.ca)
- [GitHub](https://github.com/MagdaIG)
- [LinkedIn](https://www.linkedin.com/in/minalaf/)

---

*Este proyecto fue desarrollado como ejercicio práctico de integración con Supabase y gestión de tareas en tiempo real.* 
